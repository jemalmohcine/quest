import { useEffect, useState, useRef } from 'react';
import { useQuest } from './QuestProvider';
import { questHttp } from '@/services/quest-http';
import { mapDeedRows } from '@/lib/quest-mappers';
import { Deed } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfWeek, endOfWeek, subWeeks, getWeek, getYear, parseISO, isAfter } from 'date-fns';
import { FileText, Volume2, Download, Play, Pause, Loader2, Share2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { UI_CONSTANTS } from '@/constants';
import { SectionHeader } from './SectionHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeedsRefreshStore } from '@/stores';
import { clientApiUrl } from '@/lib/client-api-url';

const MIN_WEEKLY_DEEDS = 3;

export function Resumes() {
  const { user, profile, t } = useQuest();
  const deedsGeneration = useDeedsRefreshStore((s) => s.generation);
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
  const [narrative, setNarrative] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasGeneratedThisWeek, setHasGeneratedThisWeek] = useState(false);

  const getWeekId = (date: Date) => {
    return `${getYear(date)}-W${getWeek(date)}`;
  };

  const lastAudioDataRef = useRef<string | null>(null);

  const createAudioFromBase64 = (base64Data: string, playbackSampleRate = 24000) => {
    if (lastAudioDataRef.current === base64Data) return;
    lastAudioDataRef.current = base64Data;

    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const numChannels = 1;
      const bitsPerSample = 16;
      const header = new ArrayBuffer(44);
      const d = new DataView(header);

      d.setUint32(0, 0x52494646, false);
      d.setUint32(4, 36 + bytes.length, true);
      d.setUint32(8, 0x57415645, false);
      d.setUint32(12, 0x666d7420, false);
      d.setUint32(16, 16, true);
      d.setUint16(20, 1, true);
      d.setUint16(22, numChannels, true);
      d.setUint32(24, playbackSampleRate, true);
      d.setUint32(28, (playbackSampleRate * numChannels * bitsPerSample) / 8, true);
      d.setUint16(32, (numChannels * bitsPerSample) / 8, true);
      d.setUint16(34, bitsPerSample, true);
      d.setUint32(36, 0x64617461, false);
      d.setUint32(40, bytes.length, true);

      const blob = new Blob([header, bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current = audio;
      setAudioElement(audio);
      setAudioUrl(url);
    } catch (e) {
      console.error('Error building audio:', e);
    }
  };

  const weekOptions = Array.from({ length: 4 }, (_, i) => {
    const start = startOfWeek(subWeeks(new Date(), i));
    const end = endOfWeek(subWeeks(new Date(), i));
    return {
      value: format(start, 'yyyy-MM-dd'),
      label: `Week of ${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
    };
  });

  const [error, setError] = useState<string | null>(null);

  const weekHasEnded = (() => {
    try {
      const start = parseISO(selectedWeek);
      return isAfter(new Date(), endOfWeek(start));
    } catch {
      return false;
    }
  })();

  const canGenerateResume = !hasGeneratedThisWeek && deeds.length >= MIN_WEEKLY_DEEDS && weekHasEnded;

  const generateNarrative = async () => {
    if (!user || deeds.length === 0 || isGenerating || !canGenerateResume) return;

    setIsGenerating(true);
    setError(null);
    try {
      const deedsSummary = deeds.map((d) => `- [${d.date}] ${d.pillar}: ${d.actionName} (${d.duration || 'N/A'} min)`).join('\n');

      const res = await fetch(clientApiUrl('/api/v1/gemini/weekly-narrative'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deedsSummary,
          userName: profile?.name,
          selectedWeek,
          language: profile?.language === 'fr' ? 'fr' : 'en',
        }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Gemini request failed');
      }
      const text = json.text;
      if (!text) throw new Error('No response from AI.');

      setNarrative(text);

      const weekId = getWeekId(new Date(selectedWeek));
      const { error: upErr } = await questHttp.putWeeklyResume(weekId, { narrative: text });
      if (upErr) throw new Error(upErr.message);
      setHasGeneratedThisWeek(true);
      setAudioUrl(null);
    } catch (err: unknown) {
      console.error('Error generating narrative:', err);
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!narrative || !user) return;

    setIsGeneratingAudio(true);
    setError(null);
    try {
      const ttsRes = await fetch(clientApiUrl('/api/v1/gemini/weekly-tts'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative }),
      });
      const ttsJson = (await ttsRes.json()) as { audioBase64?: string; error?: string };
      if (!ttsRes.ok) {
        throw new Error(typeof ttsJson.error === 'string' ? ttsJson.error : 'TTS request failed');
      }
      const base64Audio = ttsJson.audioBase64;

      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const originalBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          originalBytes[i] = binaryString.charCodeAt(i);
        }

        const downsampledLength = Math.floor(originalBytes.length / 2);
        const finalLength = downsampledLength % 2 === 0 ? downsampledLength : downsampledLength - 1;
        const downsampledBytes = new Uint8Array(finalLength);

        for (let i = 0, j = 0; i < originalBytes.length; i += 4) {
          if (j + 1 < finalLength) {
            downsampledBytes[j] = originalBytes[i];
            downsampledBytes[j + 1] = originalBytes[i + 1];
            j += 2;
          }
        }

        let downsampledBase64 = '';
        for (let i = 0; i < downsampledBytes.length; i++) {
          downsampledBase64 += String.fromCharCode(downsampledBytes[i]);
        }
        const b64ToStore = btoa(downsampledBase64);

        try {
          const weekId = getWeekId(new Date(selectedWeek));
          const { error: upErr } = await questHttp.putWeeklyResume(weekId, {
            narrative,
            audio_base64: b64ToStore,
          });
          if (upErr) throw new Error(upErr.message);
        } catch (e) {
          console.error('Critical: Failed to save audio:', e);
          setError('Audio still too large. Try an even shorter narrative.');
        }

        createAudioFromBase64(base64Audio, 24000);
      } else {
        throw new Error('No audio data received from Gemini');
      }
    } catch (err: unknown) {
      console.error('Error generating audio:', err);
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const formatAudioTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
    } else {
      void audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const copyToClipboard = () => {
    if (!narrative) return;
    void navigator.clipboard.writeText(narrative);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    if (!user) return;

    const weekId = getWeekId(new Date(selectedWeek));
    setIsLoading(true);

    const loadResume = async () => {
      const { data, error: rErr } = await questHttp.getWeeklyResume(weekId);
      if (rErr) {
        console.error('Error fetching résumé:', rErr);
        setIsLoading(false);
        return;
      }
      if (data && typeof data === 'object' && 'narrative' in data) {
        const nar = String((data as { narrative?: string }).narrative || '');
        setNarrative(nar);
        setHasGeneratedThisWeek(!!nar);
        const audioB64 = (data as { audio_base64?: string | null }).audio_base64;
        if (audioB64) {
          createAudioFromBase64(audioB64, 24000);
        } else {
          setAudioUrl(null);
          setAudioElement(null);
        }
      } else {
        setNarrative('');
        setHasGeneratedThisWeek(false);
        setAudioUrl(null);
        setAudioElement(null);
      }
      setIsLoading(false);
    };

    void loadResume();

    const start = selectedWeek;
    const end = format(endOfWeek(new Date(selectedWeek)), 'yyyy-MM-dd');

    const loadDeeds = async () => {
      const { data, error: dErr } = await questHttp.listDeeds({ from: start, to: end });
      if (dErr) {
        console.error('Error fetching deeds:', dErr);
        setError('Failed to sync deeds. Please try again.');
        return;
      }
      setDeeds(mapDeedRows(data));
    };

    void loadDeeds();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user, selectedWeek, deedsGeneration]);

  return (
    <div className="py-4 md:py-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <SectionHeader title={t('resumes')} subtitle={t('weeklyJourney')} />

        <Select value={selectedWeek} onValueChange={(v: string | null) => v && setSelectedWeek(v)}>
          <SelectTrigger
            className={cn(
              'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-11 text-xs font-black uppercase tracking-widest w-full md:w-64',
              UI_CONSTANTS.buttonRadius,
            )}
          >
            <SelectValue placeholder={t('selectWeek')} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl">
            {weekOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="font-bold">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <section className="lg:col-span-2 space-y-6">
          {hasGeneratedThisWeek && (
            <div
              className={cn(
                'p-4 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold leading-relaxed',
                UI_CONSTANTS.cardRadius,
              )}
            >
              {t('resumeFinalized')} {t('resumeIrreversible')}
            </div>
          )}
          {!hasGeneratedThisWeek && deeds.length > 0 && !weekHasEnded && (
            <div
              className={cn(
                'p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-800 dark:text-indigo-200 text-xs font-medium leading-relaxed',
                UI_CONSTANTS.cardRadius,
              )}
            >
              {t('resumeWaitWeekEnd')}
            </div>
          )}
          {!hasGeneratedThisWeek && weekHasEnded && deeds.length > 0 && deeds.length < MIN_WEEKLY_DEEDS && (
            <div
              className={cn(
                'p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium leading-relaxed',
                UI_CONSTANTS.cardRadius,
              )}
            >
              {t('resumeMinDeeds')}
            </div>
          )}
          {!hasGeneratedThisWeek && weekHasEnded && deeds.length >= MIN_WEEKLY_DEEDS && (
            <div
              className={cn(
                'p-4 bg-indigo-500/5 border border-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-medium leading-relaxed italic',
                UI_CONSTANTS.cardRadius,
              )}
            >
              {t('resumeIrreversible')}
            </div>
          )}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">{t('weeklyNarrative')}</h2>
            {hasGeneratedThisWeek ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('resumeAlreadyGenerated')}</span>
            ) : weekHasEnded && deeds.length >= MIN_WEEKLY_DEEDS ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void generateNarrative()}
                disabled={isGenerating || deeds.length === 0 || !canGenerateResume}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-indigo-500/10 h-9 rounded-xl font-bold disabled:opacity-50 text-[10px] uppercase tracking-widest"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {t('generate')}
              </Button>
            ) : null}
          </div>

          {error && (
            <div
              className={cn(
                'p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest text-center',
                UI_CONSTANTS.cardRadius,
              )}
            >
              {error}
            </div>
          )}

          {isLoading ? (
            <Card className={cn('bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden', UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-8 md:p-12 space-y-6">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <div className="flex gap-4 pt-8">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ) : deeds.length === 0 ? (
            <Card className={cn('bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 border-dashed', UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-16 text-center space-y-4">
                <div className={cn('w-16 h-16 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4', UI_CONSTANTS.buttonRadius)}>
                  <FileText className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                </div>
                <p className="text-zinc-500 font-bold italic text-sm">{t('noDeedsWeekly')}</p>
              </CardContent>
            </Card>
          ) : narrative ? (
            <Card className={cn('bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden group', UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-8 md:p-12 space-y-8">
                <div className="prose dark:prose-invert prose-lg max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed font-serif italic text-xl">
                  <ReactMarkdown>{narrative}</ReactMarkdown>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className={cn(
                      'font-bold transition-all text-[10px] uppercase tracking-widest',
                      UI_CONSTANTS.buttonRadius,
                      isCopied ? 'text-indigo-500 bg-indigo-500/10' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white',
                    )}
                  >
                    {isCopied ? 'Copied!' : t('copy')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold text-[10px] uppercase tracking-widest',
                      UI_CONSTANTS.buttonRadius,
                    )}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('share')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className={cn('bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 border-dashed', UI_CONSTANTS.cardRadius)}>
              <CardContent className="p-16 text-center space-y-4">
                <div className={cn('w-16 h-16 bg-indigo-600/10 flex items-center justify-center mx-auto mb-4', UI_CONSTANTS.buttonRadius)}>
                  <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
                </div>
                <p className="text-zinc-500 font-bold italic text-sm">
                  {!weekHasEnded ? t('resumeWaitWeekEnd') : deeds.length < MIN_WEEKLY_DEEDS ? t('resumeMinDeeds') : t('clickGenerate')}
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('audioExperience')}</h2>
          {isLoading ? (
            <Card className={cn('bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl p-8', UI_CONSTANTS.cardRadius)}>
              <div className="flex flex-col items-center gap-6">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
          ) : (
            <Card
              className={cn(
                'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden relative group transition-all hover:border-indigo-500/30',
                UI_CONSTANTS.cardRadius,
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none" />
              <div className="bg-indigo-600 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-black text-white text-[10px] uppercase tracking-widest">Weekly Audio</span>
                </div>
                {audioUrl && (
                  <a
                    href={audioUrl}
                    download={`Quest_Resume_${selectedWeek}.wav`}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                    title={t('download')}
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>

              <CardContent className="p-8">
                {!narrative ? (
                  <div className="flex flex-col items-center gap-2 text-center py-4 opacity-50">
                    <Volume2 className="w-6 h-6 text-zinc-400 mb-2" />
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Generate narrative first</p>
                  </div>
                ) : !audioUrl ? (
                  <Button
                    onClick={() => void generateAudio()}
                    disabled={isGeneratingAudio}
                    className={cn(
                      'w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 transition-transform active:scale-95',
                      UI_CONSTANTS.buttonRadius,
                    )}
                  >
                    {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGeneratingAudio ? t('generating') : 'Record Masterpiece'}
                  </Button>
                ) : (
                  <div
                    className={cn(
                      'flex flex-col items-center gap-6 bg-white dark:bg-zinc-800/50 p-6 border border-zinc-200 dark:border-zinc-700 shadow-inner relative overflow-hidden group',
                      UI_CONSTANTS.cardRadius,
                    )}
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500" />

                    <div className="w-full space-y-2">
                      <div className="relative h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-300 rounded-full"
                          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        >
                          <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tabular-nums text-zinc-500 uppercase tracking-tighter">
                          {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 text-indigo-600 transition-all shadow-xl active:scale-90"
                      >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                      </Button>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Status</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{isPlaying ? 'Playing Narrative...' : 'Ready to listen'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
