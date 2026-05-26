"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, RotateCcw, Check, Volume2, ChevronRight } from "lucide-react";
import { PASSAGES } from "@/lib/learn-data";
import { useLocale, useT } from "@/lib/i18n/provider";
import { addXp, markLessonComplete } from "@/lib/learn-store";

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

type Status = "idle" | "recording" | "recorded";

export default function SpeakingPage() {
  const t = useT();
  const { locale } = useLocale();
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const sentence = PASSAGES[index];

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
      setError(t.app.speaking.unsupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);
        setStatus("recorded");
        streamRef.current?.getTracks().forEach((tr) => tr.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setStatus("recording");
    } catch {
      setError(t.app.speaking.micDenied);
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setStatus("idle");
  }

  function done() {
    addXp(5);
    markLessonComplete(`speaking:${sentence.id}`);
    reset();
    setIndex((i) => (i + 1) % PASSAGES.length);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.speaking.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{index + 1} / {PASSAGES.length}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">{t.app.speaking.prompt}</p>
        <p className="font-cn mt-4 text-3xl font-bold leading-relaxed">{sentence.text}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{sentence.pinyin}</p>
        <p className="mt-2 text-sm text-muted-foreground">{sentence.translation[locale]}</p>

        <button onClick={() => speak(sentence.text)} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium hover:bg-muted">
          <Volume2 className="h-3.5 w-3.5" /> {t.app.listening.play}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background p-6">
        {status === "idle" && (
          <button onClick={start} className="mx-auto flex h-14 items-center gap-2 rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground hover:opacity-90">
            <Mic className="h-5 w-5" /> {t.app.speaking.start}
          </button>
        )}
        {status === "recording" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-600" />
              {t.app.speaking.recording}
            </div>
            <button onClick={stop} className="inline-flex h-14 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-medium text-white hover:opacity-90">
              <Square className="h-5 w-5" /> {t.app.speaking.stop}
            </button>
          </div>
        )}
        {status === "recorded" && audioUrl && (
          <div className="space-y-4 text-center">
            <audio src={audioUrl} controls className="mx-auto block w-full max-w-md">
              <track kind="captions" />
            </audio>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={() => { const a = document.querySelector("audio"); a?.play(); }} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted">
                <Play className="h-3.5 w-3.5" /> {t.app.speaking.playback}
              </button>
              <button onClick={reset} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted">
                <RotateCcw className="h-3.5 w-3.5" /> {t.app.speaking.recordAgain}
              </button>
              <button onClick={done} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90">
                <Check className="h-3.5 w-3.5" /> {t.app.speaking.markDone} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
