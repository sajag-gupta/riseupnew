import { useState, useCallback, useRef, useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  audioUrl: string;
  duration: number;
  isLiked?: boolean;
}

export function usePlayer() {
  const {
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    setCurrentTrack,
    setIsPlaying,
    setQueue,
    setCurrentIndex,
    setVolume,
    setIsMuted,
    setIsShuffled,
    setRepeatMode,
    addToQueue,
    removeFromQueue,
  } = usePlayerStore();

  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout>();

  const play = useCallback((track?: Track) => {
    if (track) {
      setCurrentTrack(track);
    }
    setIsPlaying(true);
  }, [setCurrentTrack, setIsPlaying]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const skipToNext = useCallback(() => {
    if (queue.length === 0) return;

    let nextIndex: number;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setIsPlaying(true);
  }, [queue, currentIndex, isShuffled, repeatMode, setCurrentIndex, setCurrentTrack, setIsPlaying]);

  const skipToPrevious = useCallback(() => {
    if (queue.length === 0) return;

    let prevIndex: number;
    
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === "all") {
          prevIndex = queue.length - 1;
        } else {
          return;
        }
      }
    }

    setCurrentIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    setIsPlaying(true);
  }, [queue, currentIndex, isShuffled, repeatMode, setCurrentIndex, setCurrentTrack, setIsPlaying]);

  const seek = useCallback((percentage: number) => {
    setProgress(percentage);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted, setIsMuted]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(!isShuffled);
  }, [isShuffled, setIsShuffled]);

  const toggleRepeat = useCallback(() => {
    const modes = ["off", "all", "one"] as const;
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  }, [repeatMode, setRepeatMode]);

  const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
    setQueue(tracks);
    setCurrentIndex(startIndex);
    setCurrentTrack(tracks[startIndex]);
    setIsPlaying(true);
  }, [setQueue, setCurrentIndex, setCurrentTrack, setIsPlaying]);

  const addToPlaylist = useCallback((track: Track) => {
    addToQueue(track);
  }, [addToQueue]);

  const toggleLike = useCallback(async (trackId: string) => {
    // This would typically make an API call to toggle the like status
    console.log("Toggle like for track:", trackId);
  }, []);

  // Update progress when playing
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.1, 100));
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  return {
    currentTrack,
    isPlaying,
    queue,
    progress,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    playQueue,
    addToPlaylist,
    removeFromQueue,
    toggleLike,
  };
}
