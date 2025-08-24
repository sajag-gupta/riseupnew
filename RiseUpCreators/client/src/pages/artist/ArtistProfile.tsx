import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { SongCard } from "@/components/music/SongCard";
import { EventCard } from "@/components/events/EventCard";
import {
  Music,
  Users,
  Share,
  Calendar,
  ShoppingBag,
  FileText,
  MapPin,
  ExternalLink,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Heart,
  Play,
} from "lucide-react";
import type { Artist, Song, Event, Product, Blog } from "@shared/schema";

export default function ArtistProfile() {
  const params = useParams();
  const artistId = params.id;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("music");

  const { data: artistData, isLoading: artistLoading, error: artistError } = useQuery({
    queryKey: ["/api/artists", artistId],
    queryFn: async () => {
      if (!artistId) {
        throw new Error("Artist ID is required");
      }
      const response = await apiRequest("GET", `/api/artists/${artistId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch artist: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!artistId,
    retry: 2,
  });

  const { data: songs = [], isLoading: songsLoading, error: songsError } = useQuery<Song[]>({
    queryKey: ["/api/artists", artistId, "songs"],
    queryFn: async () => {
      if (!artistId) {
        return [];
      }
      const response = await apiRequest("GET", `/api/artists/${artistId}/songs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch songs: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!artistId,
  });

  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery<Event[]>({
    queryKey: ["/api/artists", artistId, "events"],
    queryFn: async () => {
      if (!artistId) {
        return [];
      }
      const response = await apiRequest("GET", `/api/artists/${artistId}/events`);
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!artistId,
  });

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/artists", artistId, "products"],
    queryFn: async () => {
      if (!artistId) {
        return [];
      }
      const response = await apiRequest("GET", `/api/artists/${artistId}/products`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!artistId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!artistId) {
        throw new Error("Artist ID is required");
      }
      if (artistData?.isFollowing) {
        return apiRequest("DELETE", `/api/artists/${artistId}/follow`);
      } else {
        return apiRequest("POST", `/api/artists/${artistId}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists", artistId] });
    },
  });

  if (artistLoading || songsLoading || eventsLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (artistError || !artistData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Artist Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The artist you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => window.location.href = '/discover'}>
                Browse Artists
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { artist, isFollowing } = artistData;

  const handleFollow = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    followMutation.mutate();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${artist.name} - Rise Up Creators`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const socialLinks = [
    { icon: Instagram, url: artist.socials?.instagram || "" },
    { icon: Twitter, url: artist.socials?.twitter || "" },
    { icon: Youtube, url: artist.socials?.youtube || "" },
    { icon: Globe, url: artist.socials?.website || "" },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen">
      {/* Artist Header */}
      <div className="relative h-80 bg-gradient-to-b from-primary/20 to-background overflow-hidden">
        {/* Cover Image Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/30" />

        {/* Artist Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto flex items-end space-x-6">
            <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
              <AvatarImage src={artist.avatarUrl || ""} alt={artist.name} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                <Music className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold" data-testid="artist-name">
                  {artist.name}
                </h1>
                {artist.verification?.status === 'approved' && (
                  <Badge className="bg-primary text-primary-foreground">
                    Verified Artist
                  </Badge>
                )}
                {artist.featured && (
                  <Badge variant="secondary">
                    Featured
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-6 text-muted-foreground">
                <span className="flex items-center" data-testid="follower-count">
                  <Users className="w-4 h-4 mr-1" />
                  {artist.followers?.length?.toLocaleString() || 0} followers
                </span>
                <span className="flex items-center" data-testid="monthly-listeners">
                  <Play className="w-4 h-4 mr-1" />
                  {artist.stats?.monthlyListeners?.toLocaleString() || 0} monthly listeners
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  className={
                    isFollowing
                      ? "btn-secondary border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      : "btn-primary"
                  }
                  data-testid="follow-button"
                >
                  {followMutation.isPending ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : isFollowing ? (
                    <>
                      <Heart className="w-4 h-4 mr-2 fill-current" />
                      Following
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={handleShare} data-testid="share-button">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>

                {socialLinks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    {socialLinks.map((social, index) => {
                      const Icon = social.icon;
                      return (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          asChild
                          data-testid={`social-link-${index}`}
                        >
                          <a href={social.url} target="_blank" rel="noopener noreferrer">
                            <Icon className="w-4 h-4" />
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="music" data-testid="music-tab">
              <Music className="w-4 h-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="events-tab">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="merch" data-testid="merch-tab">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Merch
            </TabsTrigger>
            <TabsTrigger value="about" data-testid="about-tab">
              <FileText className="w-4 h-4 mr-2" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Music</h2>
              <div className="text-sm text-muted-foreground">
                {songs.length} {songs.length === 1 ? "track" : "tracks"}
              </div>
            </div>

            {songs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songs.map((song: Song) => (
                  <SongCard key={song.id} song={song} showArtist={false} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Music className="w-16 h-16" />}
                title="No Music Yet"
                description="This artist hasn't uploaded any music yet. Check back later!"
              />
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Events</h2>
              <div className="text-sm text-muted-foreground">
                {events.length} {events.length === 1 ? "event" : "events"}
              </div>
            </div>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event: Event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar className="w-16 h-16" />}
                title="No Upcoming Events"
                description="This artist doesn't have any scheduled events at the moment."
              />
            )}
          </TabsContent>

          <TabsContent value="merch" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Merchandise</h2>
              <div className="text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? "item" : "items"}
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: Product) => (
                  <Card key={product.id} className="card-hover">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                        <img
                          src={product.imageUrl || ""}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-primary font-bold">${product.price.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ShoppingBag className="w-16 h-16" />}
                title="No Merchandise"
                description="This artist doesn't have any merchandise available yet."
              />
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <div className="max-w-4xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {artist.bio || "This artist has not provided a biography yet."}
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {artist.stats?.totalStreams?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Streams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {artist.followers?.length?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {songs.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tracks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {events.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Events</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}