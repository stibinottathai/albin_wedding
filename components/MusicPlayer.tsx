"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export interface MusicPlayerRef {
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

interface MusicPlayerProps {
  url?: string;
}

export const MusicPlayer = forwardRef<MusicPlayerRef, MusicPlayerProps>(({ url }, ref) => {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  const defaultUrl = url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  useEffect(() => {
    setMounted(true);
    // Initialize audio element
    const audio = new Audio(defaultUrl);
    audio.loop = true;
    audioRef.current = audio;

    // Handle audio events
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, [defaultUrl]);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay blocked by browser. Music will play upon user click.", err);
        });
      }
    },
    pause: () => {
      audioRef.current?.pause();
    },
    toggle: () => {
      togglePlay();
    }
  }));

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Playback failed:", err);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    audioRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Sound Visualizer Bars */}
      {isPlaying && (
        <div className="glass-panel flex items-end gap-[3px] rounded-full px-3 py-2 h-9">
          <div className="w-[3px] bg-primary h-2 rounded-full animate-[bounce_0.8s_infinite_0.1s]"></div>
          <div className="w-[3px] bg-primary h-4 rounded-full animate-[bounce_0.8s_infinite_0.3s]"></div>
          <div className="w-[3px] bg-primary h-3 rounded-full animate-[bounce_0.8s_infinite_0.5s]"></div>
          <div className="w-[3px] bg-primary h-5 rounded-full animate-[bounce_0.8s_infinite_0.2s]"></div>
          <div className="w-[3px] bg-primary h-2 rounded-full animate-[bounce_0.8s_infinite_0.4s]"></div>
        </div>
      )}

      {/* Control Button */}
      <button
        onClick={togglePlay}
        className="glass-panel text-primary hover:text-accent p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 duration-300"
        title={isPlaying ? t("soundOff") : t("soundOn")}
        aria-label="Toggle background music"
      >
        {isPlaying ? (
          <Volume2 className="h-5 w-5 animate-pulse" />
        ) : (
          <VolumeX className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
});

MusicPlayer.displayName = "MusicPlayer";
export default MusicPlayer;
