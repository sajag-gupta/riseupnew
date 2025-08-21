import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Play, Music } from "lucide-react";
import { Link } from "wouter";
import type { Artist } from "@shared/schema";

interface ArtistCardProps {
  artist: Artist;
  isFollowing?: boolean;
  onFollow?: () => void;
  className?: string;
}

export function ArtistCard({
  artist,
  isFollowing = false,
  onFollow,
  className = "",
}: ArtistCardProps) {
  return (
    <Card
      className={`card-hover bg-card border-border text-center overflow-hidden ${className}`}
      data-testid="artist-card"
    >
      <CardContent className="p-6">
        <Link href={`/artist/${artist.id}`}>
          <div className="cursor-pointer">
            {/* Artist Avatar */}
            <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary">
              <AvatarImage src={""} alt={artist.id} />
              <AvatarFallback className="bg-muted">
                <Music className="w-8 h-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            {/* Artist Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <h3 className="font-semibold text-lg truncate" data-testid="artist-name">
                  Artist Name
                </h3>
                {artist.verification?.status === 'approved' && (
                  <Badge className="bg-primary text-primary-foreground">
                    Verified
                  </Badge>
                )}
              </div>
              
              {artist.featured && (
                <Badge variant="secondary" className="mb-2">
                  Featured Artist
                </Badge>
              )}
            </div>
          </div>
        </Link>

        {/* Stats */}
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground mb-4">
          <span data-testid="artist-followers">
            <Users className="w-4 h-4 inline mr-1" />
            {artist.followers?.length?.toLocaleString() || 0}
          </span>
          <span data-testid="artist-monthly-plays">
            <Play className="w-4 h-4 inline mr-1" />
            {artist.stats?.monthlyListeners?.toLocaleString() || 0}
          </span>
        </div>

        {/* Follow Button */}
        <Button
          onClick={onFollow}
          variant={isFollowing ? "secondary" : "default"}
          className={`w-full ${
            isFollowing
              ? "border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              : "btn-primary"
          }`}
          data-testid="artist-follow-button"
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </CardContent>
    </Card>
  );
}
