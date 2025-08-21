import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Heart, Users, Search, Filter, Music, Calendar, ShoppingBag } from "lucide-react";

export default function Discover() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = urlParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Search queries
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/search", searchQuery, activeTab, selectedGenre, sortBy],
    enabled: searchQuery.length > 0,
  });

  const { data: trendingContent } = useQuery({
    queryKey: ["/api/discover/trending", activeTab],
    enabled: !searchQuery,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ["/api/genres"],
  });

  const { data: featuredArtists = [] } = useQuery({
    queryKey: ["/api/artists/featured"],
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const displayContent = searchQuery ? searchResults : trendingContent;

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover</h1>
          <p className="text-ruc-text-muted">
            Find your next favorite song, artist, event, or merchandise
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ruc-text-low w-5 h-5" />
              <Input
                type="text"
                placeholder="Search songs, artists, events, merchandise..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 bg-ruc-surface border-ruc-border focus:border-ruc-red"
                data-testid="search-input"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-32 bg-ruc-surface border-ruc-border" data-testid="genre-filter">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent className="bg-ruc-surface border-ruc-border">
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre: string) => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-ruc-surface border-ruc-border" data-testid="sort-filter">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-ruc-surface border-ruc-border">
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-ruc-surface">
              <TabsTrigger value="all" className="data-[state=active]:bg-ruc-red" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="songs" className="data-[state=active]:bg-ruc-red" data-testid="tab-songs">Songs</TabsTrigger>
              <TabsTrigger value="artists" className="data-[state=active]:bg-ruc-red" data-testid="tab-artists">Artists</TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-ruc-red" data-testid="tab-events">Events</TabsTrigger>
            </TabsList>

            {/* Search Results or Trending Content */}
            <div className="mt-6">
              {searchLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-ruc-surface border-ruc-border">
                      <CardContent className="p-4">
                        <div className="animate-pulse">
                          <div className="bg-ruc-surface-2 h-48 rounded mb-4"></div>
                          <div className="bg-ruc-surface-2 h-4 rounded mb-2"></div>
                          <div className="bg-ruc-surface-2 h-3 rounded w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <TabsContent value="all">
                  {displayContent?.songs?.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Songs</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayContent.songs.slice(0, 6).map((song: any) => (
                          <SongCard key={song.id} song={song} />
                        ))}
                      </div>
                    </div>
                  )}

                  {displayContent?.artists?.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Artists</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {displayContent.artists.slice(0, 6).map((artist: any) => (
                          <ArtistCard key={artist.id} artist={artist} />
                        ))}
                      </div>
                    </div>
                  )}

                  {displayContent?.events?.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">Events</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayContent.events.slice(0, 3).map((event: any) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  )}

                  {!displayContent && !searchQuery && (
                    <div className="space-y-8">
                      <FeaturedArtistsSection artists={featuredArtists} />
                      <GenresSection genres={genres} />
                    </div>
                  )}

                  {searchQuery && !displayContent && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No results found</h3>
                      <p className="text-ruc-text-muted">Try different keywords or browse our featured content</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="songs">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayContent?.songs?.map((song: any) => (
                      <SongCard key={song.id} song={song} />
                    )) || (
                      <div className="col-span-full text-center py-12">
                        <Music className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                        <p className="text-ruc-text-muted">No songs found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="artists">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {displayContent?.artists?.map((artist: any) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    )) || (
                      <div className="col-span-full text-center py-12">
                        <Users className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                        <p className="text-ruc-text-muted">No artists found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="events">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayContent?.events?.map((event: any) => (
                      <EventCard key={event.id} event={event} />
                    )) || (
                      <div className="col-span-full text-center py-12">
                        <Calendar className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                        <p className="text-ruc-text-muted">No events found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Component: Song Card
function SongCard({ song }: { song: any }) {
  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border group" data-testid={`song-card-${song.id}`}>
      <div className="relative">
        <img 
          src={song.artworkUrl || "/placeholder-album.jpg"} 
          alt={song.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <Button
          size="sm"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 red-gradient rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`play-song-${song.id}`}
        >
          <Play className="w-5 h-5 text-white" />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{song.title}</h3>
        <p className="text-ruc-text-muted mb-2 truncate">{song.artist?.name}</p>
        
        <div className="flex items-center space-x-4 text-sm text-ruc-text-low mb-3">
          <span><Play className="w-3 h-3 inline mr-1" />{song.playCount}</span>
          <span><Heart className="w-3 h-3 inline mr-1" />{song.likeCount}</span>
        </div>

        {song.genre && (
          <Badge variant="secondary" className="bg-ruc-surface-2 text-ruc-text-muted">
            {song.genre}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// Component: Artist Card
function ArtistCard({ artist }: { artist: any }) {
  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border text-center" data-testid={`artist-card-${artist.id}`}>
      <CardContent className="p-4">
        <img 
          src={artist.avatar || "/placeholder-artist.jpg"} 
          alt={artist.name}
          className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-ruc-red object-cover"
        />
        <h3 className="font-semibold mb-1 truncate">{artist.name}</h3>
        <p className="text-sm text-ruc-text-muted mb-2">{artist.genres?.[0] || "Music"}</p>
        <div className="text-xs text-ruc-text-low">
          <Users className="w-3 h-3 inline mr-1" />{artist.totalFollowers} followers
        </div>
      </CardContent>
    </Card>
  );
}

// Component: Event Card
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
          <div className="text-sm text-ruc-red font-semibold ml-2">
            {new Date(event.dateTime).toLocaleDateString()}
          </div>
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

// Component: Featured Artists Section
function FeaturedArtistsSection({ artists }: { artists: any[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Featured Artists</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {artists.slice(0, 6).map((artist: any) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </section>
  );
}

// Component: Genres Section  
function GenresSection({ genres }: { genres: string[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Browse by Genre</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {genres.slice(0, 12).map((genre: string) => (
          <Card key={genre} className="card-hover bg-ruc-surface border-ruc-border cursor-pointer" data-testid={`genre-card-${genre}`}>
            <CardContent className="p-4 text-center">
              <Music className="w-8 h-8 text-ruc-red mx-auto mb-2" />
              <h3 className="font-semibold text-sm">{genre}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
