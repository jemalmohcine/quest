import { useState, useRef, useEffect, useCallback } from 'react';
import { useFirebase } from './FirebaseProvider';
import { GoogleGenAI, Type } from "@google/genai";
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Mic, Square, Loader2, Check, X } from 'lucide-react';
import { PILLARS, FEELINGS, Pillar, Feeling, PILLAR_LABELS } from '../types';
import { db, collection, addDoc, Timestamp } from '../lib/firebase';
import { cn, createDeedMetadata } from '../lib/utils';
import { UI_CONSTANTS } from '../constants';

interface AudioAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReviewDraft = {
  pillar: Pillar;
  actionName: string;
  duration: string;
  feeling: Feeling;
  thought: string;
};

function normalizeAiPayload(raw: Record<string, unknown>) {
  const pillar =
    typeof raw.pillar === 'string' && PILLARS.includes(raw.pillar as Pillar)
      ? (raw.pillar as Pillar)
      : 'mindset';
  const actionName = typeof raw.actionName === 'string' ? raw.actionName.trim() : '';
  let duration: number | null = null;
  if (raw.duration != null && raw.duration !== '') {
    const n = Number(raw.duration);
    if (!Number.isNaN(n) && n >= 0) duration = n;
  }
  const feeling =
    typeof raw.feeling === 'string' && FEELINGS.includes(raw.feeling as Feeling)
      ? (raw.feeling as Feeling)
      : 'neutral';
  const thought = typeof raw.thought === 'string' ? raw.thought.trim() : '';
  return { pillar, actionName, duration, feeling, thought };
}

function toReviewDraft(n: ReturnType<typeof normalizeAiPayload>): ReviewDraft {
  return {
    pillar: n.pillar,
    actionName: n.actionName,
    duration: n.duration != null ? String(n.duration) : '',
    feeling: n.feeling,
    thought: n.thought,
  };
}

export function AudioAssistant({ isOpen, onClose }: AudioAssistantProps) {
  const { user, profile, t } = useFirebase();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDeed, setExtractedDeed] = useState<ReturnType<typeof normalizeAiPayload> | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordStartedAtRef = useRef<number>(0);

  /** WebKit / PWA: periodic chunks; stop mic tracks only after recorder finishes (avoids empty blobs). */
  const RECORD_TIMESLICE_MS = 250;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.requestData();
        } catch {
          /* */
        }
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    };
  }, []);

  const resetFlow = useCallback(() => {
    setExtractedDeed(null);
    setReviewDraft(null);
    setError(null);
    setIsProcessing(false);
    setIsSaving(false);
  }, []);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      resetFlow();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, resetFlow]);

  const pickRecorderMimeType = (): string | undefined => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const candidates = isIOS
      ? ['audio/mp4', 'audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c)) return c;
    }
    return undefined;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mime = pickRecorderMimeType();
      const mediaRecorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingSeconds(0);
      recordStartedAtRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const streamToStop = recordingStreamRef.current;
        recordingStreamRef.current = null;
        if (streamToStop) {
          streamToStop.getTracks().forEach((track) => track.stop());
        }
        mediaRecorderRef.current = null;

        const elapsedMs = Date.now() - recordStartedAtRef.current;
        const blobType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        const minMs = 600;
        const minBytes = 64;
        if (elapsedMs < minMs) {
          setError(t('recordingTooShort'));
          return;
        }
        if (audioBlob.size < minBytes) {
          setError(t('recordingTooShort'));
          return;
        }
        processAudio(audioBlob);
      };

      mediaRecorder.start(RECORD_TIMESLICE_MS);
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

    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      try {
        mr.requestData();
      } catch {
        /* older Safari */
      }
      mr.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);
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

          const lang = profile?.language === 'fr' ? 'French' : 'English';
          const fidelity =
            profile?.language === 'fr'
              ? `Fidélité au discours : le titre (actionName) doit coller à ce que la personne a réellement dit (ex. « j'ai fait 20 minutes de méditation » → un titre proche, pas un autre sport). N'invente pas d'activité absente de l'audio.`
              : `Faithfulness: actionName must match what the speaker actually said (e.g. "I meditated 20 minutes" → keep that meaning). Do not invent activities they did not mention.`;

          const prompt = `Listen to the audio and extract ONE deed (one concrete action) the user describes.

${fidelity}

Pillar keywords (pick exactly one): soulset, healthset, mindset, skillset, heartset — use the definitions below only to choose the pillar, not to rewrite their story.
- soulset: meditation, prayer, gratitude, spiritual practice, breathing, silence
- healthset: exercise, sleep, food, hydration, sport, body care
- mindset: learning, reading, focus, planning, study, journaling for clarity
- skillset: craft, coding, music practice, training a skill for work or art
- heartset: family, friends, kindness, volunteering, emotional connection

Return JSON with:
- pillar: one of soulset | healthset | mindset | skillset | heartset
- actionName: short title in ${lang}, faithful to their words (light polish OK, no marketing fluff)
- duration: minutes as a number if they stated a duration, else null
- feeling: exactly one of: ${FEELINGS.join(', ')}
- thought: one short reflective sentence only if they expressed a reflection, else null

Language for actionName and thought: ${lang}.`;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: blob.type || 'audio/webm', data: base64Data } }
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

          const text = response.text;
          if (!text) throw new Error("No response from AI.");

          const parsed = JSON.parse(text) as Record<string, unknown>;
          const normalized = normalizeAiPayload(parsed);
          setExtractedDeed(normalized);
          setReviewDraft(toReviewDraft(normalized));
          setIsProcessing(false);
        } catch (innerErr: unknown) {
          console.error("Gemini API Error:", innerErr);
          const msg = innerErr instanceof Error ? innerErr.message : t('audioError');
          setError(msg);
          setIsProcessing(false);
        }
      };
    } catch (err) {
      setError(t('audioError'));
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !reviewDraft) return;

    const title = reviewDraft.actionName.trim();
    if (!title) {
      setError(t('actionNameRequired'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const deedData: Record<string, unknown> = {
        pillar: reviewDraft.pillar,
        actionName: title,
        feeling: reviewDraft.feeling,
        createdAt: Timestamp.now(),
        ...createDeedMetadata(),
      };

      if (reviewDraft.duration.trim()) {
        const d = parseInt(reviewDraft.duration, 10);
        if (!Number.isNaN(d) && d >= 0) deedData.duration = d;
      }
      if (reviewDraft.thought.trim()) {
        deedData.thought = reviewDraft.thought.trim();
      }

      await addDoc(collection(db, 'users', user.uid, 'deeds'), deedData);
      resetFlow();
      onClose();
    } catch (e) {
      console.error(e);
      setError(t('saveDeedFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const lang = profile?.language || 'en';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetFlow();
          onClose();
        }
      }}
    >
      <DialogContent className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white sm:max-w-[425px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto", UI_CONSTANTS.cardRadius)}>
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
          {!extractedDeed && !isProcessing && (
            <div className="flex flex-col items-center space-y-6 w-full">
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
                  {isRecording ? t('listening') : t('tapToSpeak')}
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

          {extractedDeed && reviewDraft && !isProcessing && (
            <div className="w-full space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('deedExtracted')}</p>
              <p className="text-xs text-zinc-500">{t('actionNameHint')}</p>

              <div className={cn("p-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-4", UI_CONSTANTS.cardRadius)}>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('pillar')}</Label>
                  <Select
                    value={reviewDraft.pillar}
                    onValueChange={(v) => v && setReviewDraft((d) => d ? { ...d, pillar: v as Pillar } : d)}
                  >
                    <SelectTrigger className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700", UI_CONSTANTS.buttonRadius)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PILLARS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PILLAR_LABELS[lang][p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('actionName')}</Label>
                  <Input
                    value={reviewDraft.actionName}
                    onChange={(e) => setReviewDraft((d) => d ? { ...d, actionName: e.target.value } : d)}
                    className={cn("font-bold", UI_CONSTANTS.buttonRadius)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('duration')}</Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      placeholder=""
                      value={reviewDraft.duration}
                      onChange={(e) => setReviewDraft((d) => d ? { ...d, duration: e.target.value } : d)}
                      className={UI_CONSTANTS.buttonRadius}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('feeling')}</Label>
                    <Select
                      value={reviewDraft.feeling}
                      onValueChange={(v) => v && setReviewDraft((d) => d ? { ...d, feeling: v as Feeling } : d)}
                    >
                      <SelectTrigger className={cn("bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700", UI_CONSTANTS.buttonRadius)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FEELINGS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('thought')}</Label>
                  <Textarea
                    value={reviewDraft.thought}
                    onChange={(e) => setReviewDraft((d) => d ? { ...d, thought: e.target.value } : d)}
                    rows={2}
                    className={cn("resize-none text-sm", UI_CONSTANTS.buttonRadius)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFlow}
                  disabled={isSaving}
                  className={cn("flex-1 h-12 border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[10px] tracking-widest transition-transform active:scale-95 hover:bg-zinc-100", UI_CONSTANTS.buttonRadius)}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('reRecordAudio')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={cn("flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 uppercase text-[10px] tracking-widest transition-transform active:scale-95", UI_CONSTANTS.buttonRadius)}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  {t('saveDeed')}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className={cn("w-full p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest text-center", UI_CONSTANTS.cardRadius)}>
              {error}
              <Button
                variant="link"
                type="button"
                onClick={() => {
                  setError(null);
                  if (!extractedDeed) setIsProcessing(false);
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
