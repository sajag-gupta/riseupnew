import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import type { Song, MusicPlayerState } from "@/types";

interface PlayerContextType extends MusicPlayerState {
  play: (song?: Song) => void;
  pause: () => void;
  stop: () => void; // Added stop function
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (songs: Song[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCurrentTime: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [progress, setProgress] = useState<number>(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTimeState] = useState<number>(0);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    // Audio event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime || 0;
      const duration = audio.duration || 0;
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

      setCurrentTimeState(currentTime);
      setProgress(progress);
    };

    const handleEnded = () => {
      if (repeat === "one") {
        // Repeat current song
        audio.currentTime = 0;
        audio.play();
        return;
      }

      // Auto-advance to next song
      if (queue.length > 0) {
        let nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeat === "all") {
            nextIndex = 0; // Loop back to start
          } else {
            // End of queue
            setIsPlaying(false);
            setProgress(0);
            setCurrentTimeState(0);
            return;
          }
        }

        const nextSong = queue[nextIndex];
        setCurrentIndex(nextIndex);
        setCurrentSong(nextSong);
        // Audio will auto-play due to useEffect below
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTimeState(0);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    // Removed play and pause listeners as they are handled by the play/pause functions directly

    // Load saved state
    const savedQueue = localStorage.getItem(STORAGE_KEYS.PLAYER_QUEUE);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.PLAYER_SETTINGS);

    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue);
        setOriginalQueue(parsedQueue); // Initialize originalQueue as well
      } catch (error) {
        console.error('Failed to load saved queue:', error);
      }
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setVolumeState(settings.volume || 0.8);
        setShuffle(settings.shuffle || false);
        setRepeat(settings.repeat || 'none');
        if (audioRef.current) {
          audioRef.current.volume = settings.volume || 0.8;
        }
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_QUEUE, JSON.stringify(queue));
    localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, JSON.stringify({
      volume: volume,
      shuffle: shuffle,
      repeat: repeat,
    }));
  }, [queue, volume, shuffle, repeat]);

  // Effect to play the song when currentSong or currentIndex changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.fileUrl;
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error);
        toast({
          title: "Playback Error",
          description: "Failed to play this track. Please check your internet connection.",
          variant: "destructive"
        });
      });
      setIsPlaying(true); // Ensure isPlaying is true when a song starts playing
    }
  }, [currentSong, currentIndex]); // Depend on currentSong and currentIndex

  const play = (song?: Song) => {
    if (song) {
      // Validate song has required fields
      if (!song.fileUrl) {
        console.error('Song missing fileUrl:', song);
        toast({
          title: "Playback Error",
          description: "This song cannot be played - missing audio file.",
          variant: "destructive"
        });
        return;
      }

      // Find song in current queue or add it
      const songIndex = queue.findIndex(q => q._id === song._id);
      if (songIndex !== -1) {
        setCurrentIndex(songIndex);
        setCurrentSong(song); // Ensure currentSong is updated
      } else {
        // Add to queue and set as current
        setQueue(prev => [...prev, song]);
        setCurrentIndex(queue.length);
        setCurrentSong(song); // Ensure currentSong is updated
      }
    } else if (currentSong && audioRef.current) {
      // Resume current song if no new song is provided
      try {
        audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to resume audio:', error);
        toast({
          title: "Playback Error",
          description: "Failed to resume playback.",
          variant: "destructive"
        });
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  // Added stop function
  const stop = () => {
    setCurrentSong(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTimeState(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ''; // Clear audio source
    }
  };

  const next = () => {
    if (queue.length === 0) return;

    let nextIndex = currentIndex + 1;

    // Handle repeat modes
    if (repeat === "one") {
      // Stay on current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (nextIndex >= queue.length) {
      if (repeat === "all") {
        nextIndex = 0; // Loop back to start
      } else {
        // End of queue, stop playback
        stop();
        return;
      }
    }

    const nextSong = queue[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentSong(nextSong);
  };

  const previous = () => {
    if (queue.length === 0) return;

    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeat === "all") {
        prevIndex = queue.length - 1; // Loop to end
      } else {
        prevIndex = 0; // Stay at first song
      }
    }

    const prevSong = queue[prevIndex];
    setCurrentIndex(prevIndex);
    setCurrentSong(prevSong);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTimeState(time); // Update state when seeking
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setVolumeState(volume);
    }
  };

  const addToQueue = (songs: Song[]) => {
    setQueue(prev => {
      const newQueue = [...prev];
      songs.forEach(song => {
        if (!newQueue.find(q => q._id === song._id)) {
          newQueue.push(song);
        }
      });
      return newQueue;
    });

    toast({
      title: "Added to queue",
      description: `${songs.length} song(s) added to queue`
    });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prevQueue => {
      const newQueue = prevQueue.filter((_, i) => i !== index);
      // Adjust currentIndex if the removed song was before the current song
      if (index < currentIndex) {
        setCurrentIndex(prevIndex => prevIndex - 1);
      } else if (index === currentIndex && newQueue.length > 0) {
        // If the current song is removed, play the next one if available
        setCurrentIndex(prevIndex => prevIndex); // Keep index, but the song might change in the next effect
        setCurrentSong(newQueue[prevIndex]);
      } else if (newQueue.length === 0) {
        stop(); // Stop if queue becomes empty
      }
      return newQueue;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setOriginalQueue([]);
    setCurrentIndex(0);
    stop(); // Use stop instead of pause and clearing src
  };

  const toggleShuffle = () => {
    const newShuffle = !shuffle;
    setShuffle(newShuffle);

    if (newShuffle) {
      // Save original queue order
      setOriginalQueue([...queue]);

      // Create shuffled queue but keep current song at current position
      const shuffled = [...queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Find current song in shuffled array and move to current position
      if (currentSong) {
        const currentSongIndex = shuffled.findIndex(s => s._id === currentSong._id);
        if (currentSongIndex !== -1 && currentSongIndex !== currentIndex) {
          // Swap current song to the current index
          [shuffled[currentIndex], shuffled[currentSongIndex]] = [shuffled[currentSongIndex], shuffled[currentIndex]];
        }
      }

      setQueue(shuffled);
    } else {
      // Restore original queue order
      if (originalQueue.length > 0) {
        setQueue(originalQueue);
        // Find current song position in original queue
        if (currentSong) {
          const newIndex = originalQueue.findIndex(s => s._id === currentSong._id);
          if (newIndex !== -1) {
            setCurrentIndex(newIndex);
          }
        }
      }
    }
  };

  const toggleRepeat = () => {
    setRepeat(prevRepeat => {
      if (prevRepeat === 'none') return 'all';
      if (prevRepeat === 'all') return 'one';
      return 'none';
    });
  };

  const setCurrentTime = (time: number) => {
    setCurrentTimeState(time);
  };

  const contextValue: PlayerContextType = {
    currentSong,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    queue,
    shuffle,
    repeat,
    currentIndex,
    play,
    pause,
    stop,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    removeFromQueue,
    clearQueue,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}