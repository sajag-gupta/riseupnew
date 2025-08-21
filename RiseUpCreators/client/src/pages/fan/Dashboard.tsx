import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Music,
  Users,
  Heart,
  Calendar,
  ShoppingBag,
  PlayCircle,
  Clock,
  Star,
  Download,
} from "lucide-react";

export default function FanDashboard() {
  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["/api/subscriptions/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscriptions/me");
      return response.json();
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/orders/me");
      return response.json();
    },
  });

  const { data: playlists = [], isLoading: playlistsLoading } = useQuery({
    queryKey: ["/api/playlists/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/playlists/me");
      return response.json();
    },
  });

  const { data: likedSongs = [], isLoading: likedLoading } = useQuery({
    queryKey: ["/api/songs/liked"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/songs/liked");
      return response.json();
    },
  });

  const { data: followedArtists = [], isLoading: followedLoading } = useQuery({
    queryKey: ["/api/users/following"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/following");
      return response.json();
    },
  });

  if (subscriptionsLoading || ordersLoading || playlistsLoading || likedLoading || followedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      title: "Following",
      value: followedArtists.length,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Liked Songs",
      value: likedSongs.length,
      icon: Heart,
      color: "text-red-500",
    },
    {
      title: "Playlists",
      value: playlists.length,
      icon: Music,
      color: "text-blue-500",
    },
    {
      title: "Subscriptions",
      value: subscriptions.filter((s: any) => s.status === 'active').length,
      icon: Star,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="dashboard-title">Your Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your music library, subscriptions, and orders
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase()}`}>
                    {stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscriptions" data-testid="subscriptions-tab">Subscriptions</TabsTrigger>
          <TabsTrigger value="orders" data-testid="orders-tab">Orders</TabsTrigger>
          <TabsTrigger value="playlists" data-testid="playlists-tab">Playlists</TabsTrigger>
          <TabsTrigger value="favorites" data-testid="favorites-tab">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Subscriptions</h2>
            <Button variant="outline">Manage All</Button>
          </div>

          {subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((subscription: any) => (
                <Card key={subscription.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={""} />
                        <AvatarFallback>
                          <Music className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">Artist Name</h3>
                        <p className="text-sm text-muted-foreground">
                          {subscription.tier.name} Tier
                        </p>
                      </div>
                      <Badge
                        className={
                          subscription.status === 'active'
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">
                          ${subscription.tier.price}/{subscription.tier.interval}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next billing:</span>
                        <span className="font-medium">
                          {subscription.nextBillDate ? 
                            new Date(subscription.nextBillDate).toLocaleDateString() 
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Manage
                      </Button>
                      <Button variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Star className="w-16 h-16" />}
              title="No Subscriptions"
              description="You haven't subscribed to any artists yet. Start supporting your favorite creators!"
              action={{
                label: "Discover Artists",
                onClick: () => window.location.href = "/discover",
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Order History</h2>
            <Button variant="outline">Export</Button>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          {order.type === 'merch' ? (
                            <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <Calendar className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'shipped' ? 'secondary' :
                              order.status === 'processing' ? 'outline' : 'destructive'
                            }>
                              {order.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${order.totals.total.toFixed(2)}</p>
                        <div className="flex space-x-2 mt-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {order.status === 'delivered' && (
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ShoppingBag className="w-16 h-16" />}
              title="No Orders"
              description="You haven't made any purchases yet. Check out merchandise and event tickets from your favorite artists!"
              action={{
                label: "Browse Merch",
                onClick: () => window.location.href = "/merch",
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="playlists" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Playlists</h2>
            <Button className="btn-primary">
              <Music className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          {playlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist: any) => (
                <Card key={playlist.id} className="card-hover cursor-pointer">
                  <CardContent className="p-6">
                    <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      {playlist.coverArt ? (
                        <img 
                          src={playlist.coverArt} 
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-12 h-12 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Music className="w-16 h-16" />}
              title="No Playlists"
              description="Create your first playlist to organize your favorite songs."
              action={{
                label: "Create Your First Playlist",
                onClick: () => console.log("Create playlist"),
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Liked Songs & Artists</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Liked Songs */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                Liked Songs ({likedSongs.length})
              </h3>
              {likedSongs.length > 0 ? (
                <div className="space-y-3">
                  {likedSongs.slice(0, 5).map((song: any, index: number) => (
                    <div key={song.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{song.title}</p>
                        <p className="text-sm text-muted-foreground">Artist Name</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <PlayCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {likedSongs.length > 5 && (
                    <Button variant="ghost" className="w-full">
                      View All {likedSongs.length} Songs
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No liked songs yet.</p>
              )}
            </div>

            {/* Following Artists */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Following ({followedArtists.length})
              </h3>
              {followedArtists.length > 0 ? (
                <div className="space-y-3">
                  {followedArtists.slice(0, 5).map((artist: any, index: number) => (
                    <div key={artist.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={""} />
                        <AvatarFallback>
                          <Music className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Artist Name</p>
                        <p className="text-sm text-muted-foreground">
                          {artist.followers?.length || 0} followers
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Following
                      </Button>
                    </div>
                  ))}
                  {followedArtists.length > 5 && (
                    <Button variant="ghost" className="w-full">
                      View All {followedArtists.length} Artists
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Not following any artists yet.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
