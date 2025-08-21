import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Play, 
  Heart, 
  Share2, 
  UserPlus, 
  UserCheck, 
  Crown, 
  MapPin, 
  Calendar,
  Users,
  Music,
  ShoppingBag,
  ExternalLink,
  Star,
  Lock
} from "lucide-react";

export default function ArtistProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch artist data
  const { data: artist, isLoading } = useQuery({
    queryKey: ["/api/artists", id],
  });

  const { data: songs = [] } = useQuery({
    queryKey: ["/api/artists", id, "songs"],
  });

  const { data: albums = [] } = useQuery({
    queryKey: ["/api/artists", id, "albums"], 
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/artists", id, "events"],
  });

  const { data: merch = [] } = useQuery({
    queryKey: ["/api/artists", id, "merch"],
  });

  const { data: blogs = [] } = useQuery({
    queryKey: ["/api/artists", id, "blogs"],
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["/api/artists", id, "following"],
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/artists", id, "subscription"],
    enabled: !!user,
  });

  // Mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", `/api/artists/${id}/follow`, {});
      } else {
        await apiRequest("POST", `/api/artists/${id}/follow`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists", id, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artists", id] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following!",
        description: isFollowing ? "You unfollowed this artist" : "You're now following this artist",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (tier: string) => {
      await apiRequest("POST", `/api/artists/${id}/subscribe`, { tier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists", id, "subscription"] });
      toast({
        title: "Subscribed!",
        description: "You're now subscribed to this artist",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-ruc-surface rounded-2xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 bg-ruc-surface rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-ruc-surface rounded-lg"></div>
                <div className="h-48 bg-ruc-surface rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Artist Not Found</h2>
              <p className="text-ruc-text-muted">The artist you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Artist Header */}
        <Card className="bg-ruc-surface border-ruc-border mb-8 overflow-hidden">
          <div className="relative">
            {/* Cover Image */}
            <div className="h-64 bg-gradient-to-br from-ruc-red to-ruc-orange relative">
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
            
            {/* Artist Info */}
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-32 h-32 -mt-16 border-4 border-ruc-surface relative z-10">
                  <AvatarImage src={artist.avatar} alt={artist.name} />
                  <AvatarFallback className="bg-ruc-surface-2 text-2xl">
                    {artist.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold" data-testid="artist-name">{artist.name}</h1>
                    {artist.isVerified && (
                      <Badge className="bg-ruc-red text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-ruc-text-muted mb-4">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {artist.totalFollowers?.toLocaleString()} followers
                    </span>
                    <span className="flex items-center">
                      <Play className="w-4 h-4 mr-1" />
                      {artist.totalPlays?.toLocaleString()} plays
                    </span>
                    {artist.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {artist.location}
                      </span>
                    )}
                  </div>

                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {artist.genres.map((genre: string) => (
                        <Badge key={genre} variant="secondary" className="bg-ruc-surface-2">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-ruc-text-muted mb-6 max-w-2xl">
                    {artist.bio || "No bio available"}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    {user && user.id !== artist.userId && (
                      <Button
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        className={isFollowing 
                          ? "bg-ruc-surface-2 text-ruc-text hover:bg-ruc-surface border border-ruc-border"
                          : "red-gradient hover:shadow-red-glow"
                        }
                        data-testid="follow-button"
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}

                    {user && user.id !== artist.userId && !subscription && (
                      <Button
                        onClick={() => subscribeMutation.mutate("basic")}
                        disabled={subscribeMutation.isPending}
                        variant="outline"
                        className="border-ruc-red text-ruc-red hover:bg-ruc-red hover:text-white"
                        data-testid="subscribe-button"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Subscribe
                      </Button>
                    )}

                    {subscription && (
                      <Badge className="bg-ruc-success text-white px-4 py-2 h-10 flex items-center">
                        <Crown className="w-4 h-4 mr-2" />
                        Subscribed
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      className="text-ruc-text-muted hover:text-ruc-red"
                      data-testid="share-button"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Social Links */}
                  {artist.socialLinks && (
                    <div className="flex gap-3 mt-4">
                      {Object.entries(artist.socialLinks).map(([platform, url]) => (
                        <Button
                          key={platform}
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-ruc-text-muted hover:text-ruc-red"
                          data-testid={`social-link-${platform}`}
                        >
                          <a href={url as string} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            {platform}
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="music" className="space-y-6">
          <TabsList className="bg-ruc-surface border-ruc-border">
            <TabsTrigger value="music" className="data-[state=active]:bg-ruc-red" data-testid="tab-music">
              <Music className="w-4 h-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger value="blogs" className="data-[state=active]:bg-ruc-red" data-testid="tab-blogs">
              Blogs
            </TabsTrigger>
            <TabsTrigger value="merch" className="data-[state=active]:bg-ruc-red" data-testid="tab-merch">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Merch
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-ruc-red" data-testid="tab-events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Music Tab */}
          <TabsContent value="music" className="space-y-6">
            {/* Albums */}
            {albums.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Albums</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {albums.map((album: any) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </section>
            )}

            {/* Songs */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Songs</h2>
              {songs.length > 0 ? (
                <div className="space-y-2">
                  {songs.map((song: any, index: number) => (
                    <SongRow 
                      key={song.id} 
                      song={song} 
                      index={index} 
                      showArtwork={true}
                      isSubscribed={!!subscription}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-ruc-surface border-ruc-border">
                  <CardContent className="p-8 text-center">
                    <Music className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No songs yet</h3>
                    <p className="text-ruc-text-muted">This artist hasn't uploaded any songs yet.</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </TabsContent>

          {/* Blogs Tab */}
          <TabsContent value="blogs">
            {blogs.length > 0 ? (
              <div className="space-y-6">
                {blogs.map((blog: any) => (
                  <BlogCard key={blog.id} blog={blog} isSubscribed={!!subscription} />
                ))}
              </div>
            ) : (
              <Card className="bg-ruc-surface border-ruc-border">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No blogs yet</h3>
                  <p className="text-ruc-text-muted">This artist hasn't published any blogs yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Merch Tab */}
          <TabsContent value="merch">
            {merch.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {merch.map((item: any) => (
                  <MerchCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Card className="bg-ruc-surface border-ruc-border">
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No merchandise available</h3>
                  <p className="text-ruc-text-muted">This artist doesn't have any merchandise for sale yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card className="bg-ruc-surface border-ruc-border">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No upcoming events</h3>
                  <p className="text-ruc-text-muted">This artist doesn't have any scheduled events.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper Components
function AlbumCard({ album }: { album: any }) {
  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border" data-testid={`album-card-${album.id}`}>
      <CardContent className="p-4">
        <img
          src={album.artwork || "/placeholder-album.jpg"}
          alt={album.title}
          className="w-full aspect-square rounded-lg object-cover mb-3"
        />
        <h3 className="font-semibold truncate">{album.title}</h3>
        <p className="text-sm text-ruc-text-muted">{album.type} • {new Date(album.releaseDate).getFullYear()}</p>
      </CardContent>
    </Card>
  );
}

function SongRow({ song, index, showArtwork = false, isSubscribed = false }: { 
  song: any; 
  index: number; 
  showArtwork?: boolean;
  isSubscribed?: boolean;
}) {
  const isLocked = song.visibility === 'subscriber_only' && !isSubscribed;
  
  return (
    <div className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-ruc-surface group ${isLocked ? 'opacity-60' : ''}`} data-testid={`song-row-${song.id}`}>
      <div className="w-8 text-center text-ruc-text-low group-hover:hidden">
        {index + 1}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="w-8 h-8 hidden group-hover:flex items-center justify-center p-0"
        disabled={isLocked}
        data-testid={`play-song-${song.id}`}
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      
      {showArtwork && (
        <img
          src={song.artworkUrl || "/placeholder-album.jpg"}
          alt={song.title}
          className="w-12 h-12 rounded object-cover"
        />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{song.title}</h4>
          {isLocked && <Lock className="w-4 h-4 text-ruc-text-low" />}
        </div>
        <p className="text-sm text-ruc-text-muted">{song.genre}</p>
      </div>
      
      <div className="text-sm text-ruc-text-low">
        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
      </div>
      
      <Button variant="ghost" size="sm" disabled={isLocked} data-testid={`like-song-${song.id}`}>
        <Heart className={`w-4 h-4 ${song.isLiked ? 'fill-ruc-red text-ruc-red' : 'text-ruc-text-muted hover:text-ruc-red'}`} />
      </Button>
    </div>
  );
}

function BlogCard({ blog, isSubscribed }: { blog: any; isSubscribed: boolean }) {
  const isLocked = blog.visibility?.isSubscriberOnly && !isSubscribed;
  
  return (
    <Card className="bg-ruc-surface border-ruc-border" data-testid={`blog-card-${blog.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {blog.featuredImage && (
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-24 h-24 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold">{blog.title}</h3>
              {isLocked && <Lock className="w-4 h-4 text-ruc-text-low" />}
            </div>
            <p className="text-ruc-text-muted mb-3">
              {isLocked ? "Subscriber-only content" : blog.excerpt}
            </p>
            <div className="flex items-center gap-4 text-sm text-ruc-text-low">
              <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
              <span>{blog.engagement?.readTime || 5} min read</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MerchCard({ item }: { item: any }) {
  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border" data-testid={`merch-card-${item.id}`}>
      <img
        src={item.mainImage || "/placeholder-merch.jpg"}
        alt={item.name}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate">{item.name}</h3>
        <p className="text-sm text-ruc-text-muted mb-2 line-clamp-2">{item.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">${item.price}</span>
          <Button size="sm" className="red-gradient" data-testid={`add-to-cart-${item.id}`}>
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: any }) {
  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border" data-testid={`event-card-${event.id}`}>
      <img
        src={event.media?.bannerImage || "/placeholder-event.jpg"}
        alt={event.title}
        className="w-full h-32 object-cover rounded-t-lg"
      />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold truncate flex-1">{event.title}</h3>
          <Badge variant="secondary" className="ml-2 bg-ruc-red text-white">
            {new Date(event.dateTime).toLocaleDateString()}
          </Badge>
        </div>
        <p className="text-sm text-ruc-text-muted mb-1">{event.venue?.name}</p>
        <p className="text-xs text-ruc-text-low mb-3">{event.venue?.address?.city}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold">${event.ticketTypes?.[0]?.price || "TBA"}</span>
          <Button size="sm" className="red-gradient" data-testid={`buy-ticket-${event.id}`}>
            Buy Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
