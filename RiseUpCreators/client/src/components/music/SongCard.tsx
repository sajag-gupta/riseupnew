import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, Heart, Plus, Share, MoreHorizontal, Music } from "lucide-react";
import type { Song } from "@shared/schema";
import { usePlayerStore } from "@/store/playerStore";

interface SongCardProps {
  song: Song;
  isLiked?: boolean;
  onLike?: () => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
  showArtist?: boolean;
  className?: string;
}

export function SongCard({
  song,
  isLiked = false,
  onLike,
  onAddToPlaylist,
  onShare,
  showArtist = true,
  className = "",
}: SongCardProps) {
  const { currentSong, isPlaying, play, pause, addToQueue } = usePlayerStore();
  const [isHovered, setIsHovered] = useState(false);

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  const handlePlayPause = () => {
    if (isCurrentSong) {
      isPlaying ? pause() : play();
    } else {
      addToQueue([song]);
      play();
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className={`card-hover bg-card border-border group overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="song-card"
    >
      <CardContent className="p-0">
        {/* Album Artwork */}
        <div className="relative">
          <Avatar className="w-full h-48 rounded-none">
            <AvatarImage
              src={song.files.artworkUrl || ""}
              alt={song.title}
              className="object-cover"
            />
            <AvatarFallback className="rounded-none bg-muted">
              <Music className="w-12 h-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          {/* Play Button Overlay */}
          <div
            className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
              isHovered || isCurrentlyPlaying ? "opacity-100" : "opacity-0"
            }`}
          >
            <Button
              onClick={handlePlayPause}
              className="w-12 h-12 red-gradient rounded-full hover:shadow-red-glow"
              data-testid="song-play-button"
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </Button>
          </div>

          {/* Trending Badge */}
          {song.analytics?.trendingScore && song.analytics.trendingScore > 100 && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              Trending
            </Badge>
          )}
        </div>

        {/* Song Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-lg mb-1 truncate"
                data-testid="song-title"
              >
                {song.title}
              </h3>
              {showArtist && (
                <p className="text-muted-foreground text-sm truncate" data-testid="song-artist">
                  Artist Name
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="song-menu-trigger"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddToPlaylist}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Playlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare}>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
            <span data-testid="song-plays">
              <Play className="w-3 h-3 inline mr-1" />
              {song.analytics?.playCount?.toLocaleString() || 0}
            </span>
            <span data-testid="song-likes">
              <Heart className="w-3 h-3 inline mr-1" />
              {song.analytics?.likeCount?.toLocaleString() || 0}
            </span>
            <span data-testid="song-duration">
              {formatDuration(song.duration)}
            </span>
          </div>

          {/* Waveform */}
          {song.files.waveformData && (
            <div className="flex items-end space-x-1 h-8 mb-4">
              {song.files.waveformData.slice(0, 20).map((amplitude, index) => (
                <div
                  key={index}
                  className="w-1 bg-primary rounded-full wave-animation"
                  style={{
                    height: `${Math.max(10, amplitude)}%`,
                    animationDelay: `${index * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className={`hover:bg-accent ${
                  isLiked ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid="song-like-button"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddToPlaylist}
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                data-testid="song-add-button"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                data-testid="song-share-button"
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>
            {song.visibility === 'subscriber_only' && (
              <Badge variant="secondary" className="text-xs">
                Subscribers Only
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
