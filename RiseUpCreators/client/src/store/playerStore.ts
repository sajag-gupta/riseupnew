import { create } from 'zustand';
import type { Song } from '@shared/schema';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  isRepeating: boolean;
  originalQueue: Song[];
}

interface PlayerActions {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  addToQueue: (songs: Song[], playNow?: boolean) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playTrack: (song: Song, queue?: Song[]) => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  // State
  currentSong: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 75,
  isShuffled: false,
  isRepeating: false,
  originalQueue: [],

  // Actions
  play: () => {
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  next: () => {
    const { queue, currentIndex, isRepeating } = get();
    
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    
    // Handle repeat mode
    if (nextIndex >= queue.length) {
      if (isRepeating) {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }
    
    set({
      currentIndex: nextIndex,
      currentSong: queue[nextIndex],
      currentTime: 0,
    });
  },

  previous: () => {
    const { queue, currentIndex, currentTime } = get();
    
    if (queue.length === 0) return;
    
    // If more than 3 seconds played, restart current song
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    
    set({
      currentIndex: prevIndex,
      currentSong: queue[prevIndex],
      currentTime: 0,
    });
  },

  seek: (time: number) => {
    set({ currentTime: time });
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(0, Math.min(100, volume)) });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },

  setDuration: (duration: number) => {
    set({ duration });
  },

  addToQueue: (songs: Song[], playNow = false) => {
    const { queue, isShuffled, originalQueue } = get();
    
    if (playNow) {
      const newQueue = [...songs, ...queue];
      set({
        queue: newQueue,
        originalQueue: isShuffled ? [...newQueue] : originalQueue,
        currentIndex: 0,
        currentSong: songs[0],
        currentTime: 0,
        isPlaying: true,
      });
    } else {
      const newQueue = [...queue, ...songs];
      set({
        queue: newQueue,
        originalQueue: isShuffled ? originalQueue : [...newQueue],
      });
    }
  },

  removeFromQueue: (index: number) => {
    const { queue, currentIndex, originalQueue, isShuffled } = get();
    
    const newQueue = queue.filter((_, i) => i !== index);
    let newCurrentIndex = currentIndex;
    
    if (index < currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      if (newQueue.length === 0) {
        set({
          queue: [],
          originalQueue: [],
          currentSong: null,
          currentIndex: -1,
          isPlaying: false,
        });
        return;
      }
      
      // If we removed the current song, play the next one (or previous if at end)
      newCurrentIndex = Math.min(currentIndex, newQueue.length - 1);
    }
    
    set({
      queue: newQueue,
      originalQueue: isShuffled ? originalQueue.filter(song => newQueue.includes(song)) : newQueue,
      currentIndex: newCurrentIndex,
      currentSong: newQueue[newCurrentIndex] || null,
    });
  },

  clearQueue: () => {
    set({
      queue: [],
      originalQueue: [],
      currentSong: null,
      currentIndex: -1,
      isPlaying: false,
      currentTime: 0,
    });
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentSong } = get();
    
    if (isShuffled) {
      // Turn off shuffle - restore original order
      const currentSongIndex = originalQueue.findIndex(song => song.id === currentSong?.id);
      set({
        isShuffled: false,
        queue: [...originalQueue],
        currentIndex: currentSongIndex,
      });
    } else {
      // Turn on shuffle
      const shuffled = [...queue];
      
      // Keep current song at the beginning
      if (currentSong) {
        const currentIndex = shuffled.findIndex(song => song.id === currentSong.id);
        if (currentIndex > 0) {
          shuffled.splice(currentIndex, 1);
          shuffled.unshift(currentSong);
        }
      }
      
      // Shuffle the rest
      for (let i = shuffled.length - 1; i > 1; i--) {
        const j = Math.floor(Math.random() * (i - 1)) + 1;
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      set({
        isShuffled: true,
        originalQueue: [...queue],
        queue: shuffled,
        currentIndex: 0,
      });
    }
  },

  toggleRepeat: () => {
    const { isRepeating } = get();
    set({ isRepeating: !isRepeating });
  },

  playTrack: (song: Song, queue?: Song[]) => {
    const newQueue = queue || [song];
    const songIndex = newQueue.findIndex(s => s.id === song.id);
    
    set({
      currentSong: song,
      queue: newQueue,
      originalQueue: [...newQueue],
      currentIndex: songIndex,
      isPlaying: true,
      currentTime: 0,
    });
  },
}));
