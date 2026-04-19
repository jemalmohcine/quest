import { useState, useRef, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { GoogleGenAI, Type } from "@google/genai";
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Mic, Square, Loader2, Check, X } from 'lucide-react';
import { PILLARS, FEELINGS } from '../types';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn, createDeedMetadata } from '../lib/utils';
import { UI_CONSTANTS } from '../constants';

interface AudioAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioAssistant({ isOpen, onClose }: AudioAssistantProps) {
  const { user, profile, t } = useFirebase();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDeed, setExtractedDeed] = useState<any>(null);
  const [missingField, setMissingField] = useState<'duration' | 'pillar' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingSeconds(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) { 
           setError("Recording too short. Please speak clearly.");
           setIsProcessing(false);
           return;
        }
        processAudio(audioBlob);
      };

      mediaRecorder.start(1000); 
      setIsRecording(true);
      setError(null);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 59) { 
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(t('audioError'));
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const apiKey = process.env.GEMINI_API_KEY;
          
          if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
            throw new Error("Gemini API Key is not configured.");
          }

          const ai = new GoogleGenAI({ apiKey });
        
        const prompt = extractedDeed && missingField 
          ? `The user is providing the missing ${missingField} for their action.
             Current action: ${extractedDeed.actionName}
             Extract only the ${missingField} from this new audio and return the updated JSON.`
          : `Analyze the user's speech and identify the specific deed (action) they performed.
             
             Categorize it into one of these 5 pillars:
             - soulset: Meditation, prayer, gratitude, spiritual study, silence, deep breathing.
             - healthset: Gym, running, walking, hydration, healthy meals, sleep, stretching.
             - mindset: Reading, learning, cognitive training, mental planning, focus work.
             - skillset: Practicing a craft, coding, playing an instrument, professional training.
             - heartset: Family time, volunteering, helping others, meaningful conversation, kindness.
             
             Return a JSON object with: 
             - pillar: one of the 5 keywords above
             - actionName: a clear, premium sounding title (e.g. "Deep Focus Session" instead of "I worked")
             - duration: number in minutes (if mentioned, otherwise null)
             - feeling: one of [happy, tired, neutral, proud]
             - thought: a short 1-sentence reflection if they shared one.
             
             Language: ${profile?.language === 'fr' ? 'French' : 'English'}.
             Be decisive. If unclear, choose the most probable pillar based on the action.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: 'audio/webm', data: base64Data } }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                pillar: { type: Type.STRING, enum: PILLARS },
                actionName: { type: Type.STRING },
                duration: { type: Type.NUMBER, nullable: true },
                feeling: { type: Type.STRING, enum: FEELINGS, nullable: true },
                thought: { type: Type.STRING, nullable: true },
              },
              required: ["pillar", "actionName"],
            }
          }
        });

        if (!response.text) throw new Error("No response from AI.");

        const result = JSON.parse(response.text);
        
        const updatedDeed = extractedDeed ? { ...extractedDeed, ...result } : result;
        
        // Don't block on missing fields, just show the result
        setExtractedDeed(updatedDeed);
        setMissingField(null);
        setIsProcessing(false);
        } catch (innerErr: any) {
          console.error("Gemini API Error:", innerErr);
          setError(innerErr.message || t('audioError'));
          setIsProcessing(false);
        }
      };
    } catch (err) {
      setError(t('audioError'));
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !extractedDeed) return;

    const path = `users/${user.uid}/deeds`;
    try {
      const deedData: any = {
        ...extractedDeed,
        createdAt: Timestamp.now(),
        ...createDeedMetadata()
      };

      await addDoc(collection(db, path), deedData);
      onClose();
      setExtractedDeed(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white sm:max-w-[425px] p-0 overflow-hidden", UI_CONSTANTS.cardRadius)}>
        <div className="bg-indigo-600 p-6 flex items-center gap-4">
          <div className={cn("w-12 h-12 bg-white/20 flex items-center justify-center backdrop-blur-sm", UI_CONSTANTS.buttonRadius)}>
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight leading-none">{t('audioAssistant')}</DialogTitle>
            <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mt-1">{t('audioAssistantTagline')}</p>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center justify-center space-y-8">
          {( (!extractedDeed || missingField) && !isProcessing) && (
            <div className="flex flex-col items-center space-y-6 w-full">
              {missingField && extractedDeed && (
                <div className={cn("w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-center animate-in fade-in slide-in-from-top-4", UI_CONSTANTS.cardRadius)}>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium mb-1">
                    {missingField === 'duration' ? "I've got the action, but how long did it take?" : "Which pillar does this belong to?"}
                  </p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest">
                    {missingField === 'duration' ? "Specify Duration" : "Specify Pillar"}
                  </p>
                </div>
              )}
              
              <div className="relative">
                {isRecording && (
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                )}
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "w-24 h-24 rounded-full shadow-2xl transition-all active:scale-90 relative z-10",
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                  )}
                >
                  {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-10 h-10" />}
                </Button>
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-zinc-900 dark:text-white text-lg tracking-tight">
                  {isRecording ? t('listening') : missingField ? "Tap to provide detail" : t('tapToSpeak')}
                </p>
                {isRecording && (
                  <p className="text-indigo-600 dark:text-indigo-400 font-mono text-2xl font-black animate-pulse">
                    {formatTime(recordingSeconds)}
                  </p>
                )}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="font-bold text-zinc-500 dark:text-zinc-400 text-sm italic">{t('processingAudio')}</p>
            </div>
          )}

          {extractedDeed && !missingField && (
            <div className="w-full space-y-6">
              <div className={cn("p-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-4", UI_CONSTANTS.cardRadius)}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('pillar')}</span>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                    {extractedDeed.pillar}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('actionName')}</span>
                  <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{extractedDeed.actionName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('duration')}</span>
                    <p className="font-black text-indigo-600 dark:text-indigo-400">{extractedDeed.duration || '--'} min</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('feeling')}</span>
                    <p className="font-bold capitalize text-zinc-900 dark:text-white">{extractedDeed.feeling || 'Neutral'}</p>
                  </div>
                </div>
                {extractedDeed.thought && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('thought')}</span>
                    <p className="text-xs text-zinc-500 italic leading-relaxed">"{extractedDeed.thought}"</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setExtractedDeed(null);
                    setMissingField(null);
                  }}
                  className={cn("flex-1 h-12 border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[10px] tracking-widest transition-transform active:scale-95 hover:bg-zinc-100", UI_CONSTANTS.buttonRadius)}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('tryAgain')}
                </Button>
                <Button 
                  onClick={handleSave}
                  className={cn("flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 uppercase text-[10px] tracking-widest transition-transform active:scale-95", UI_CONSTANTS.buttonRadius)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('saveDeed')}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className={cn("p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest text-center", UI_CONSTANTS.cardRadius)}>
              {error}
              <Button 
                variant="link" 
                onClick={() => {
                  setError(null);
                  setExtractedDeed(null);
                  setIsProcessing(false);
                }}
                className="block mx-auto mt-2 text-red-600 dark:text-red-400 font-black uppercase text-[10px]"
              >
                {t('tryAgain')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
