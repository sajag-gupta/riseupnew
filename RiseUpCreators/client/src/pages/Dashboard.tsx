import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { 
  Crown, 
  Heart, 
  List, 
  ShoppingBag, 
  Calendar, 
  Download, 
  Settings, 
  CreditCard,
  RefreshCw,
  Music,
  Users,
  Star,
  Package,
  Ticket
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["/api/user/subscriptions"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/user/orders"],
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["/api/user/tickets"],
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ["/api/user/playlists"],
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["/api/user/favorites"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-ruc-text-muted">
            Manage your subscriptions, orders, playlists, and preferences
          </p>
        </div>

        {/* Premium Status */}
        {!user?.subscription?.isPremium && (
          <Card className="bg-gradient-to-r from-ruc-red to-ruc-orange border-0 mb-8">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Premium
                </h3>
                <p className="text-white/90">Unlock ad-free listening, exclusive content, and more features!</p>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-ruc-red"
                data-testid="upgrade-premium-button"
              >
                <Link href="/plans">Upgrade Now</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4 text-center">
              <Music className="w-8 h-8 text-ruc-red mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.songsPlayed || 0}</div>
              <div className="text-sm text-ruc-text-muted">Songs Played</div>
            </CardContent>
          </Card>
          
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-ruc-red mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.artistsFollowed || 0}</div>
              <div className="text-sm text-ruc-text-muted">Artists Followed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4 text-center">
              <List className="w-8 h-8 text-ruc-red mx-auto mb-2" />
              <div className="text-2xl font-bold">{playlists.length}</div>
              <div className="text-sm text-ruc-text-muted">Playlists</div>
            </CardContent>
          </Card>
          
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-ruc-red mx-auto mb-2" />
              <div className="text-2xl font-bold">{favorites.length}</div>
              <div className="text-sm text-ruc-text-muted">Favorites</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList className="bg-ruc-surface">
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-ruc-red" data-testid="tab-subscriptions">
              <Crown className="w-4 h-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-ruc-red" data-testid="tab-orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="tickets" className="data-[state=active]:bg-ruc-red" data-testid="tab-tickets">
              <Calendar className="w-4 h-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-ruc-red" data-testid="tab-playlists">
              <List className="w-4 h-4 mr-2" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-ruc-red" data-testid="tab-favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favorites
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Subscriptions</h2>
                <Button asChild variant="outline" className="border-ruc-border" data-testid="browse-artists-button">
                  <Link href="/discover?tab=artists">Browse Artists</Link>
                </Button>
              </div>

              {subscriptions.length > 0 ? (
                <div className="grid gap-4">
                  {subscriptions.map((sub: any) => (
                    <Card key={sub.id} className="bg-ruc-surface border-ruc-border" data-testid={`subscription-${sub.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={sub.artist?.avatar || "/placeholder-artist.jpg"}
                              alt={sub.artist?.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-semibold">{sub.artist?.name}</h3>
                              <p className="text-sm text-ruc-text-muted">{sub.tier?.name} Tier • ${sub.tier?.price}/month</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={sub.status === 'active' ? 'default' : 'secondary'}
                                  className={sub.status === 'active' ? 'bg-ruc-success' : ''}
                                >
                                  {sub.status}
                                </Badge>
                                <span className="text-xs text-ruc-text-low">
                                  Next billing: {new Date(sub.nextBillDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-ruc-border"
                              data-testid={`manage-subscription-${sub.id}`}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Manage
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              className="red-gradient"
                              data-testid={`view-artist-${sub.artistId}`}
                            >
                              <Link href={`/artist/${sub.artistId}`}>View Artist</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-ruc-surface border-ruc-border">
                  <CardContent className="p-8 text-center">
                    <Crown className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No subscriptions yet</h3>
                    <p className="text-ruc-text-muted mb-4">Subscribe to your favorite artists to access exclusive content</p>
                    <Button asChild className="red-gradient" data-testid="discover-artists-cta">
                      <Link href="/discover?tab=artists">Discover Artists</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Orders</h2>
                <Button asChild variant="outline" className="border-ruc-border" data-testid="browse-merch-button">
                  <Link href="/merch">Browse Merchandise</Link>
                </Button>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <Card key={order.id} className="bg-ruc-surface border-ruc-border" data-testid={`order-${order.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Order #{order.orderNumber}</h3>
                            <p className="text-sm text-ruc-text-muted">
                              {new Date(order.createdAt).toLocaleDateString()} • ${order.totals?.total}
                            </p>
                          </div>
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : 'secondary'}
                            className={
                              order.status === 'delivered' ? 'bg-ruc-success' :
                              order.status === 'shipped' ? 'bg-ruc-warning' :
                              order.status === 'processing' ? 'bg-ruc-info' : ''
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {order.items?.map((item: any, index: number) => (
                            <div key={index} className="flex items-center space-x-3">
                              <img
                                src={item.product?.mainImage || "/placeholder-merch.jpg"}
                                alt={item.product?.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.product?.name}</p>
                                <p className="text-sm text-ruc-text-muted">Qty: {item.quantity} • ${item.unitPrice}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="border-ruc-border" data-testid={`view-order-${order.id}`}>
                            View Details
                          </Button>
                          {order.status === 'delivered' && (
                            <Button variant="outline" size="sm" className="border-ruc-border" data-testid={`reorder-${order.id}`}>
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Reorder
                            </Button>
                          )}
                          {order.invoiceUrl && (
                            <Button variant="outline" size="sm" className="border-ruc-border" data-testid={`download-invoice-${order.id}`}>
                              <Download className="w-4 h-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-ruc-surface border-ruc-border">
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No orders yet</h3>
                    <p className="text-ruc-text-muted mb-4">Shop for merchandise from your favorite artists</p>
                    <Button asChild className="red-gradient" data-testid="shop-merch-cta">
                      <Link href="/merch">Shop Merchandise</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Event Tickets</h2>
                <Button asChild variant="outline" className="border-ruc-border" data-testid="browse-events-button">
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>

              {tickets.length > 0 ? (
                <div className="grid gap-4">
                  {tickets.map((ticket: any) => (
                    <Card key={ticket.id} className="bg-ruc-surface border-ruc-border" data-testid={`ticket-${ticket.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={ticket.event?.media?.bannerImage || "/placeholder-event.jpg"}
                              alt={ticket.event?.title}
                              className="w-16 h-16 rounded object-cover"
                            />
                            <div>
                              <h3 className="font-semibold">{ticket.event?.title}</h3>
                              <p className="text-sm text-ruc-text-muted">
                                {new Date(ticket.event?.dateTime).toLocaleDateString()} • {ticket.ticketType}
                              </p>
                              <p className="text-sm text-ruc-text-muted">{ticket.event?.venue?.name}</p>
                              <Badge 
                                variant={ticket.status === 'valid' ? 'default' : 'secondary'}
                                className={ticket.status === 'valid' ? 'bg-ruc-success' : ''}
                              >
                                {ticket.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {ticket.qrCode && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-ruc-border"
                                data-testid={`view-ticket-${ticket.id}`}
                              >
                                <Ticket className="w-4 h-4 mr-1" />
                                View QR
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-ruc-border"
                              data-testid={`download-ticket-${ticket.id}`}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-ruc-surface border-ruc-border">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No tickets yet</h3>
                    <p className="text-ruc-text-muted mb-4">Buy tickets to events and concerts from your favorite artists</p>
                    <Button asChild className="red-gradient" data-testid="browse-events-cta">
                      <Link href="/events">Browse Events</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Playlists</h2>
                <Button className="red-gradient" data-testid="create-playlist-button">
                  <List className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </div>

              {playlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist: any) => (
                    <Card key={playlist.id} className="card-hover bg-ruc-surface border-ruc-border" data-testid={`playlist-${playlist.id}`}>
                      <CardContent className="p-4">
                        <img
                          src={playlist.coverArt || "/placeholder-playlist.jpg"}
                          alt={playlist.name}
                          className="w-full aspect-square rounded-lg object-cover mb-3"
                        />
                        <h3 className="font-semibold truncate">{playlist.name}</h3>
                        <p className="text-sm text-ruc-text-muted">
                          {playlist.songs?.length || 0} songs • {playlist.isPublic ? 'Public' : 'Private'}
                        </p>
                        <div className="flex items-center space-x-2 mt-3">
                          <Button size="sm" className="flex-1 red-gradient" data-testid={`play-playlist-${playlist.id}`}>
                            <Music className="w-4 h-4 mr-1" />
                            Play
                          </Button>
                          <Button variant="outline" size="sm" className="border-ruc-border" data-testid={`edit-playlist-${playlist.id}`}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-ruc-surface border-ruc-border">
                  <CardContent className="p-8 text-center">
                    <List className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No playlists yet</h3>
                    <p className="text-ruc-text-muted mb-4">Create your first playlist to organize your favorite songs</p>
                    <Button className="red-gradient" data-testid="create-first-playlist">
                      <List className="w-4 h-4 mr-2" />
                      Create Your First Playlist
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Favorites</h2>
                <Button asChild variant="outline" className="border-ruc-border" data-testid="discover-music-button">
                  <Link href="/discover">Discover Music</Link>
                </Button>
              </div>

              {favorites.length > 0 ? (
                <div className="space-y-2">
                  {favorites.map((favorite: any, index: number) => (
                    <div key={favorite.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-ruc-surface group" data-testid={`favorite-${favorite.id}`}>
                      <div className="w-8 text-center text-ruc-text-low group-hover:hidden">
                        {index + 1}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 hidden group-hover:flex items-center justify-center p-0"
                        data-testid={`play-favorite-${favorite.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      
                      <img
                        src={favorite.content?.artworkUrl || "/placeholder-album.jpg"}
                        alt={favorite.content?.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{favorite.content?.title}</h4>
                        <p className="text-sm text-ruc-text-muted truncate">{favorite.content?.artist?.name}</p>
                      </div>
                      
                      <Button variant="ghost" size="sm" data-testid={`unfavorite-${favorite.id}`}>
                        <Heart className="w-4 h-4 fill-ruc-red text-ruc-red" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="bg-ruc-surface border-ruc-border">
                  <CardContent className="p-8 text-center">
                    <Heart className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No favorites yet</h3>
                    <p className="text-ruc-text-muted mb-4">Like songs, artists, and content to see them here</p>
                    <Button asChild className="red-gradient" data-testid="discover-music-cta">
                      <Link href="/discover">Discover Music</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
