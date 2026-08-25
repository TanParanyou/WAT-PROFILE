"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Repeat } from "lucide-react";

interface MiniAudioPlayerProps {
  audioUrl: string;
  title: string;
  subtitle?: string;
  labels: {
    play: string;
    pause: string;
    speed: string;
    mute: string;
    unmute: string;
    restart: string;
    loop: string;
    loopOff: string;
  };
}

function formatDurationSeconds(sec: number): string {
  if (isNaN(sec) || sec < 0) return "0:00";
  const mins = Math.floor(sec / 60);
  const remSec = Math.floor(sec % 60);
  return `${mins}:${remSec < 10 ? "0" : ""}${remSec}`;
}

export function MiniAudioPlayer({
  audioUrl,
  title,
  subtitle,
  labels,
}: MiniAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const togglePlaybackRate = () => {
    const rates = [1, 1.25, 0.85];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (audioRef.current) {
      audioRef.current.loop = nextLoop;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      void audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (!audioUrl) return null;

  return (
    <aside
      aria-label="เครื่องเล่นเสียงสวดมนต์"
      className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-site-border bg-site-canvas/95 backdrop-blur-md shadow-2xl transition-all print:hidden"
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" loop={isLooping} />

      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3.5">
        {/* Title and Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 border border-site-accent/40 bg-site-surface px-1.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-site-accent">
              <Sparkles size={11} aria-hidden />
              <span>AUDIO</span>
            </span>
            <h4 className="truncate font-heading text-sm sm:text-base font-bold text-site-foreground">
              {title}
            </h4>
          </div>
          {subtitle && (
            <p className="truncate text-xs text-site-muted mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Playback Controls & Scrubber */}
        <div className="flex flex-1 flex-col items-center gap-1.5 w-full sm:max-w-md">
          <div className="flex w-full items-center gap-2.5">
            <span className="font-mono text-[11px] text-site-muted tabular-nums w-9 text-right">
              {formatDurationSeconds(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Audio progress seekbar"
              className="h-1.5 w-full cursor-pointer appearance-none bg-site-border accent-site-accent rounded-none focus-visible:outline-2 focus-visible:outline-site-focus"
            />
            <span className="font-mono text-[11px] text-site-muted tabular-nums w-9">
              {formatDurationSeconds(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              aria-label={labels.restart}
              title={labels.restart}
              className="p-1.5 text-site-muted hover:text-site-foreground transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? labels.pause : labels.play}
              className="flex size-9 items-center justify-center border border-site-border bg-site-action text-site-on-action hover:bg-site-action-hover transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={togglePlaybackRate}
              aria-label={labels.speed}
              title={labels.speed}
              className="border border-site-border bg-site-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-site-foreground hover:bg-site-surface/80 transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
            >
              {playbackRate}x
            </button>

            <button
              type="button"
              onClick={toggleLoop}
              aria-label={isLooping ? labels.loopOff : labels.loop}
              title={isLooping ? labels.loopOff : labels.loop}
              className={`p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-site-focus ${
                isLooping
                  ? "text-site-accent font-bold"
                  : "text-site-muted hover:text-site-foreground"
              }`}
            >
              <Repeat size={16} />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? labels.unmute : labels.mute}
              title={isMuted ? labels.unmute : labels.mute}
              className="p-1.5 text-site-muted hover:text-site-foreground transition-colors focus-visible:outline-2 focus-visible:outline-site-focus"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
