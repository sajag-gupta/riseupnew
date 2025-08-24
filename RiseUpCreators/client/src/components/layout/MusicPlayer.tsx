import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  List,
  Music,
} from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    queue,
    currentTime,
    duration,
    volume,
    isShuffled,
    isRepeating,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    setIsPlaying
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';

      const audio = audioRef.current;

      const handleTimeUpdate = () => {
        usePlayerStore.getState().setCurrentTime(audio.currentTime);
      };

      const handleLoadedMetadata = () => {
        usePlayerStore.getState().setDuration(audio.duration);
      };

      const handleEnded = () => {
        next();
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [next]);

  // Handle play/pause state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle current song changes
  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.files.audioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentSong, isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    seek(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentSong) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Ensure the audio source is set
        if (audioRef.current.src !== currentSong.files?.audioUrl) {
          audioRef.current.src = currentSong.files?.audioUrl || '';
          audioRef.current.load();
        }

        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
    }
  };

  // Always render the player container, but only show it when there's a song
  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ display: 'none' }}>
        {/* Hidden player container */}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border">
      <div className="max-w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <Avatar className="w-12 h-12 rounded-xl">
              <AvatarImage 
                src={currentSong.files.artworkUrl || ""} 
                alt={currentSong.title}
              />
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground">
                <Music className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div 
                className="font-semibold text-sm truncate" 
                data-testid="current-song-title"
              >
                {currentSong.title}
              </div>
              <div 
                className="text-muted-foreground text-xs truncate"
                data-testid="current-song-artist"
              >
                Artist Name
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-primary"
              data-testid="like-current-song"
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShuffle}
                className={`text-muted-foreground hover:text-foreground ${
                  isShuffled ? 'text-primary' : ''
                }`}
                data-testid="shuffle-button"
              >
                <Shuffle className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={previous}
                className="text-muted-foreground hover:text-foreground"
                data-testid="previous-button"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                onClick={togglePlayPause}
                className="w-10 h-10 red-gradient rounded-full hover:shadow-red-glow"
                data-testid="play-pause-button"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={next}
                className="text-muted-foreground hover:text-foreground"
                data-testid="next-button"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRepeat}
                className={`text-muted-foreground hover:text-foreground ${
                  isRepeating ? 'text-primary' : ''
                }`}
                data-testid="repeat-button"
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-muted-foreground" data-testid="current-time">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
                data-testid="progress-slider"
              />
              <span className="text-xs text-muted-foreground" data-testid="duration">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Queue */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            <Popover open={isQueueOpen} onOpenChange={setIsQueueOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="queue-button"
                >
                  <List className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Queue</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {queue.map((song, index) => (
                      <div
                        key={`${song.id}-${index}`}
                        className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer ${
                          song.id === currentSong.id ? 'bg-accent' : ''
                        }`}
                        data-testid={`queue-item-${index}`}
                      >
                        <Avatar className="w-8 h-8 rounded">
                          <AvatarImage src={song.files.artworkUrl || ""} />
                          <AvatarFallback>
                            <Music className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {song.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            Artist Name
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center space-x-2">
              <Popover open={isVolumeOpen} onOpenChange={setIsVolumeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="volume-button"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-2" align="end">
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(values) => setVolume(values[0])}
                    orientation="vertical"
                    className="h-24"
                    data-testid="volume-slider"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}