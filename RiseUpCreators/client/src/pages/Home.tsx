import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, LoadingGrid } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { SongCard } from "@/components/music/SongCard";
import { ArtistCard } from "@/components/music/ArtistCard";
import { EventCard } from "@/components/events/EventCard";
import {
  Music,
  Users,
  TrendingUp,
  Clock,
  Star,
  Play,
  Calendar,
  Crown,
} from "lucide-react";
import type { Song, Artist, Event } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();

  // Fetch personalized content
  const { data: recentSongs = [], isLoading: recentLoading, isError: recentError } = useQuery({
    queryKey: ["/api/songs/recent"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/songs/recent?limit=6");
      if (!response.ok) {
        throw new Error(`Failed to fetch recent songs: ${response.status}`);
      }
      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recommendedSongs = [], isLoading: recommendedLoading, isError: recommendedError } = useQuery({
    queryKey: ["/api/songs/recommended"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/songs/recommended?limit=6");
      if (!response.ok) {
        throw new Error(`Failed to fetch recommended songs: ${response.status}`);
      }
      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: followedArtists = [], isLoading: artistsLoading, isError: artistsError } = useQuery({
    queryKey: ["/api/users/following"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/following");
      if (!response.ok) {
        throw new Error(`Failed to fetch followed artists: ${response.status}`);
      }
      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingSongs = [], isLoading: trendingLoading, isError: trendingError } = useQuery({
    queryKey: ["/api/songs", { trending: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/songs?trending=true&limit=8");
      if (!response.ok) {
        throw new Error(`Failed to fetch trending songs: ${response.status}`);
      }
      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingEvents = [], isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ["/api/events/upcoming"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/events?upcoming=true&limit=4");
      if (!response.ok) {
        throw new Error(`Failed to fetch upcoming events: ${response.status}`);
      }
      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const handleLikeSong = async (songId: string) => {
    try {
      await apiRequest("POST", `/api/songs/${songId}/like`);
      // Optionally refetch data or update local state
    } catch (error) {
      console.error("Failed to like song:", error);
    }
  };

  const handleFollowArtist = async (artistId: string) => {
    try {
      await apiRequest("POST", `/api/artists/${artistId}/follow`);
      // Optionally refetch data or update local state
    } catch (error) {
      console.error("Failed to follow artist:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold" data-testid="welcome-title">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Discover new music and stay connected with your favorite artists
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover bg-card border-border cursor-pointer">
          <CardContent className="p-6 text-center">
            <Music className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Discover New Music</h3>
            <p className="text-sm text-muted-foreground">
              Explore trending songs and new releases
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover bg-card border-border cursor-pointer">
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Find Artists</h3>
            <p className="text-sm text-muted-foreground">
              Connect with your favorite musicians
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover bg-card border-border cursor-pointer">
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Upcoming Events</h3>
            <p className="text-sm text-muted-foreground">
              Don't miss live concerts and shows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recently Played */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" data-testid="recently-played-title">
            <Clock className="mr-2 w-6 h-6 text-primary" />
            Recently Played
          </h2>
          <Button variant="ghost" className="text-primary">
            View All
          </Button>
        </div>

        {recentLoading ? (
          <LoadingGrid count={4} />
        ) : recentError ? (
          <EmptyState
            icon={<Clock className="w-16 h-16" />}
            title="Failed to Load Recent Songs"
            description="There was an error loading your recently played tracks. Please try again later."
            action={{
              label: "Try Again",
              onClick: () => window.location.reload(),
            }}
          />
        ) : recentSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentSongs.slice(0, 4).map((song: Song) => (
              <SongCard
                key={song.id}
                song={song}
                onLike={() => handleLikeSong(song.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Clock className="w-16 h-16" />}
            title="No Recent Activity"
            description="Start listening to music to see your recently played tracks here."
            action={{
              label: "Discover Music",
              onClick: () => window.location.href = "/discover",
            }}
          />
        )}
      </section>

      {/* Your Artists */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" data-testid="your-artists-title">
            <Users className="mr-2 w-6 h-6 text-primary" />
            Your Artists
          </h2>
          <Button variant="ghost" className="text-primary">
            View All
          </Button>
        </div>

        {artistsLoading ? (
          <LoadingGrid count={6} />
        ) : artistsError ? (
          <EmptyState
            icon={<Users className="w-16 h-16" />}
            title="Failed to Load Your Artists"
            description="There was an error loading the artists you follow. Please try again later."
            action={{
              label: "Try Again",
              onClick: () => window.location.reload(),
            }}
          />
        ) : followedArtists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {followedArtists.slice(0, 6).map((artist: Artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                isFollowing={true}
                onFollow={() => handleFollowArtist(artist.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="w-16 h-16" />}
            title="Not Following Any Artists"
            description="Find and follow your favorite artists to see them here."
            action={{
              label: "Explore Artists",
              onClick: () => window.location.href = "/artists",
            }}
          />
        )}
      </section>

      {/* Recommended For You */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" data-testid="recommended-title">
            <Star className="mr-2 w-6 h-6 text-primary" />
            Recommended For You
          </h2>
          <Button variant="ghost" className="text-primary">
            Refresh
          </Button>
        </div>

        {recommendedLoading ? (
          <LoadingGrid count={6} />
        ) : recommendedError ? (
          <EmptyState
            icon={<Star className="w-16 h-16" />}
            title="Failed to Load Recommendations"
            description="There was an error loading your recommendations. Please try again later."
            action={{
              label: "Try Again",
              onClick: () => window.location.reload(),
            }}
          />
        ) : recommendedSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedSongs.slice(0, 6).map((song: Song) => (
              <SongCard
                key={`recommended-${song.id}`}
                song={song}
                onLike={() => handleLikeSong(song.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Star className="w-16 h-16" />}
            title="No Recommendations Yet"
            description="Listen to more music to get personalized recommendations."
            action={{
              label: "Explore Trending",
              onClick: () => window.location.href = "/discover",
            }}
          />
        )}
      </section>

      {/* Trending Now */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" data-testid="trending-now-title">
            <TrendingUp className="mr-2 w-6 h-6 text-primary" />
            Trending Now
          </h2>
          <Button variant="ghost" className="text-primary">
            View Charts
          </Button>
        </div>

        {trendingLoading ? (
          <LoadingGrid count={8} />
        ) : trendingError ? (
          <EmptyState
            icon={<TrendingUp className="w-16 h-16" />}
            title="Failed to Load Trending Songs"
            description="There was an error loading trending songs. Please try again later."
            action={{
              label: "Try Again",
              onClick: () => window.location.reload(),
            }}
          />
        ) : trendingSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingSongs.slice(0, 8).map((song: Song, index) => (
              <div key={song.id} className="relative">
                <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground">
                  #{index + 1}
                </Badge>
                <SongCard
                  song={song}
                  onLike={() => handleLikeSong(song.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<TrendingUp className="w-16 h-16" />}
            title="No Trending Content"
            description="Check back later for trending music on the platform."
          />
        )}
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center" data-testid="upcoming-events-title">
            <Calendar className="mr-2 w-6 h-6 text-primary" />
            Upcoming Events
          </h2>
          <Button variant="ghost" className="text-primary">
            View All
          </Button>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="loading-pulse h-80 rounded-2xl" />
            ))}
          </div>
        ) : eventsError ? (
          <EmptyState
            icon={<Calendar className="w-16 h-16" />}
            title="Failed to Load Upcoming Events"
            description="There was an error loading upcoming events. Please try again later."
            action={{
              label: "Try Again",
              onClick: () => window.location.reload(),
            }}
          />
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.slice(0, 4).map((event: Event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar className="w-16 h-16" />}
            title="No Upcoming Events"
            description="Check back later for upcoming events."
          />
        )}
      </section>

      {/* Premium Upgrade CTA */}
      {user?.subscription?.isPremium !== true && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Upgrade to Premium</h3>
            <p className="text-muted-foreground mb-6">
              Enjoy ad-free listening, offline downloads, and exclusive content
            </p>
            <Button className="btn-primary" data-testid="upgrade-premium-button">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}