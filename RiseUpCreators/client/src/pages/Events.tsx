import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Clock,
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List,
  Music,
  Ticket
} from "lucide-react";
import { format } from "date-fns";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch events data
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events", searchQuery, selectedLocation, selectedGenre, dateRange],
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/events/locations"],
  });

  const { data: genres = [] } = useQuery({
    queryKey: ["/api/events/genres"],
  });

  const { data: featuredEvents = [] } = useQuery({
    queryKey: ["/api/events/featured"],
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["/api/events/upcoming"],
  });

  const filteredEvents = events.filter((event: any) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.artist?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "all" || 
                           event.venue?.address?.city === selectedLocation ||
                           event.isOnline && selectedLocation === "online";
    const matchesGenre = selectedGenre === "all" || event.genre === selectedGenre;
    const eventDate = new Date(event.dateTime);
    const matchesDate = !dateRange.from || 
                       (eventDate >= dateRange.from && (!dateRange.to || eventDate <= dateRange.to));
    
    return matchesSearch && matchesLocation && matchesGenre && matchesDate;
  });

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Events & Concerts</h1>
          <p className="text-ruc-text-muted">
            Discover live music events from your favorite artists
          </p>
        </div>

        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.slice(0, 3).map((event: any) => (
                <FeaturedEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Quick Categories */}
        <div className="mb-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-ruc-surface">
              <TabsTrigger value="all" className="data-[state=active]:bg-ruc-red" data-testid="tab-all-events">
                All Events
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-ruc-red" data-testid="tab-upcoming">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="online" className="data-[state=active]:bg-ruc-red" data-testid="tab-online">
                Online Events
              </TabsTrigger>
              <TabsTrigger value="concerts" className="data-[state=active]:bg-ruc-red" data-testid="tab-concerts">
                Concerts
              </TabsTrigger>
              <TabsTrigger value="festivals" className="data-[state=active]:bg-ruc-red" data-testid="tab-festivals">
                Festivals
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ruc-text-low w-5 h-5" />
              <Input
                type="text"
                placeholder="Search events, artists, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-ruc-surface border-ruc-border focus:border-ruc-red"
                data-testid="search-input"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40 bg-ruc-surface border-ruc-border" data-testid="location-filter">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="bg-ruc-surface border-ruc-border">
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="online">Online Events</SelectItem>
                  {locations.map((location: string) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-ruc-border" data-testid="date-filter">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from 
                      ? dateRange.to 
                        ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                        : format(dateRange.from, "MMM dd")
                      : "Select dates"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-ruc-surface border-ruc-border" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange(range || {})}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-ruc-text-muted">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "red-gradient" : ""}
                data-testid="grid-view-button"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "red-gradient" : ""}
                data-testid="list-view-button"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Events Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-ruc-surface border-ruc-border">
                <div className="animate-pulse">
                  <div className="bg-ruc-surface-2 h-48 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="bg-ruc-surface-2 h-4 rounded"></div>
                    <div className="bg-ruc-surface-2 h-3 rounded w-3/4"></div>
                    <div className="bg-ruc-surface-2 h-4 rounded w-1/2"></div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredEvents.map((event: any) => (
              viewMode === "grid" ? (
                <EventCard key={event.id} event={event} />
              ) : (
                <EventListItem key={event.id} event={event} />
              )
            ))}
          </div>
        ) : (
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-ruc-text-low mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-ruc-text-muted mb-4">
                Try adjusting your search criteria or browse all events
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLocation("all");
                  setSelectedGenre("all");
                  setDateRange({});
                }}
                className="red-gradient"
                data-testid="clear-all-filters"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Featured Event Card Component
function FeaturedEventCard({ event }: { event: any }) {
  const eventDate = new Date(event.dateTime);
  const isUpcoming = eventDate > new Date();

  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border relative overflow-hidden" data-testid={`featured-event-${event.id}`}>
      <Badge className="absolute top-2 left-2 z-10 bg-ruc-red text-white">
        Featured
      </Badge>
      {event.isOnline && (
        <Badge className="absolute top-2 right-2 z-10 bg-ruc-info text-white">
          Online
        </Badge>
      )}
      <img
        src={event.media?.bannerImage || "/placeholder-event.jpg"}
        alt={event.title}
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-lg mb-1">{event.title}</h3>
          <p className="text-sm text-ruc-text-muted">{event.artist?.name}</p>
        </div>
        
        <div className="space-y-2 text-sm text-ruc-text-muted mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{format(eventDate, "MMM dd, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>{event.isOnline ? "Online Event" : `${event.venue?.name}, ${event.venue?.address?.city}`}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{event.venue?.capacity} capacity</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-ruc-red">
            {event.ticketTypes?.[0]?.price ? `$${event.ticketTypes[0].price}` : "Free"}
          </div>
          <Button
            size="sm"
            className="red-gradient"
            disabled={!isUpcoming}
            data-testid={`buy-ticket-featured-${event.id}`}
          >
            <Ticket className="w-4 h-4 mr-1" />
            {isUpcoming ? "Buy Ticket" : "Past Event"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Event Card Component (Grid View)
function EventCard({ event }: { event: any }) {
  const eventDate = new Date(event.dateTime);
  const isUpcoming = eventDate > new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();

  return (
    <Card className="card-hover bg-ruc-surface border-ruc-border group" data-testid={`event-card-${event.id}`}>
      <div className="relative">
        <img
          src={event.media?.bannerImage || "/placeholder-event.jpg"}
          alt={event.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {event.isOnline && (
          <Badge className="absolute top-2 right-2 bg-ruc-info text-white">
            Online
          </Badge>
        )}
        {isToday && (
          <Badge className="absolute top-2 left-2 bg-ruc-warning text-ruc-black">
            Today
          </Badge>
        )}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="bg-ruc-surface/80 hover:bg-ruc-surface" data-testid={`like-event-${event.id}`}>
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="bg-ruc-surface/80 hover:bg-ruc-surface" data-testid={`share-event-${event.id}`}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{event.title}</h3>
          <p className="text-sm text-ruc-text-muted">{event.artist?.name}</p>
        </div>
        
        <div className="space-y-2 text-sm text-ruc-text-muted mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{format(eventDate, "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{format(eventDate, "h:mm a")}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">
              {event.isOnline ? "Online Event" : event.venue?.name}
            </span>
          </div>
        </div>

        {event.genre && (
          <Badge variant="secondary" className="mb-3 bg-ruc-surface-2">
            <Music className="w-3 h-3 mr-1" />
            {event.genre}
          </Badge>
        )}

        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {event.ticketTypes?.[0]?.price ? `$${event.ticketTypes[0].price}` : "Free"}
          </div>
          <Button
            size="sm"
            className="red-gradient hover:shadow-red-glow"
            disabled={!isUpcoming}
            data-testid={`buy-ticket-${event.id}`}
          >
            <Ticket className="w-4 h-4 mr-1" />
            {isUpcoming ? "Buy Ticket" : "Past Event"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Event List Item Component (List View)
function EventListItem({ event }: { event: any }) {
  const eventDate = new Date(event.dateTime);
  const isUpcoming = eventDate > new Date();
  const isToday = eventDate.toDateString() === new Date().toDateString();

  return (
    <Card className="bg-ruc-surface border-ruc-border" data-testid={`event-list-${event.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <img
            src={event.media?.bannerImage || "/placeholder-event.jpg"}
            alt={event.title}
            className="w-24 h-24 rounded object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  {event.isOnline && (
                    <Badge className="bg-ruc-info text-white text-xs">Online</Badge>
                  )}
                  {isToday && (
                    <Badge className="bg-ruc-warning text-ruc-black text-xs">Today</Badge>
                  )}
                </div>
                <p className="text-sm text-ruc-text-muted mb-2">{event.artist?.name}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-ruc-text-muted">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{format(eventDate, "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(eventDate, "h:mm a")}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">
                      {event.isOnline ? "Online Event" : `${event.venue?.name}, ${event.venue?.address?.city}`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className="text-lg font-bold mb-2">
                  {event.ticketTypes?.[0]?.price ? `$${event.ticketTypes[0].price}` : "Free"}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" data-testid={`like-event-list-${event.id}`}>
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`share-event-list-${event.id}`}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="red-gradient"
                    disabled={!isUpcoming}
                    data-testid={`buy-ticket-list-${event.id}`}
                  >
                    <Ticket className="w-4 h-4 mr-1" />
                    {isUpcoming ? "Buy Ticket" : "Past Event"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
