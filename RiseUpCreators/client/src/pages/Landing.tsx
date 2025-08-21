import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { LoadingSpinner, EmptyState } from "@/components/ui/loading-spinner";
import { SongCard } from "@/components/music/SongCard";
import { ArtistCard } from "@/components/music/ArtistCard";
import { EventCard } from "@/components/events/EventCard";
import {
  Music,
  Heart,
  Upload,
  Users,
  Play,
  DollarSign,
  BarChart3,
  Crown,
  Ticket,
  Star,
} from "lucide-react";
import type { Song, Artist, Event } from "@shared/schema";

export default function Landing() {
  const [stats] = useState({
    artists: "15K+",
    songs: "1M+",
    fans: "500K+",
    revenue: "$2M+",
  });

  // Fetch featured content
  const { data: featuredArtists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ["/api/artists", { featured: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/artists?featured=true");
      return response.json();
    },
  });

  const { data: trendingSongs = [], isLoading: songsLoading } = useQuery({
    queryKey: ["/api/songs", { trending: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/songs?trending=true&limit=6");
      return response.json();
    },
  });

  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events", { upcoming: true }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/events?upcoming=true&limit=3");
      return response.json();
    },
  });

  // Floating animation elements
  const floatingElements = Array.from({ length: 3 }, (_, i) => (
    <div
      key={i}
      className={`absolute w-${16 + i * 8} h-${16 + i * 8} border border-primary/20 rounded-full animate-float opacity-10`}
      style={{
        top: `${20 + i * 20}%`,
        left: `${10 + i * 30}%`,
        animationDelay: `${i * 2}s`,
      }}
    />
  ));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden py-20 lg:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          {floatingElements}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8" data-testid="hero-title">
            <span className="block text-foreground">Empowering</span>
            <span className="block text-gradient">Music Creators</span>
            <span className="block text-foreground">Connecting Fans</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed" data-testid="hero-description">
            The ultimate platform where artists can upload, monetize, and connect with fans through streaming,
            subscriptions, merchandise, and live events. Join the revolution of independent music.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <Button asChild className="w-full sm:w-auto btn-primary text-lg px-8 py-4" data-testid="join-fan-button">
              <Link href="/register?role=fan">
                <Heart className="mr-2 w-5 h-5" />
                Join as Fan
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-4 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="upload-music-button"
            >
              <Link href="/register?role=artist">
                <Upload className="mr-2 w-5 h-5" />
                Upload Your Music
              </Link>
            </Button>
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center" data-testid={`stat-${key}`}>
                <div className="text-3xl font-bold text-primary mb-2">{value}</div>
                <div className="text-muted-foreground capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artists */}
      <section className="py-20 bg-gradient-to-b from-background to-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold" data-testid="featured-artists-title">Featured Artists</h2>
            <Button variant="ghost" className="text-primary hover:text-primary/80" data-testid="view-all-artists">
              View All
              <Star className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {artistsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="loading-pulse h-64 rounded-2xl" />
              ))}
            </div>
          ) : featuredArtists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {featuredArtists.slice(0, 6).map((artist: Artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-16 h-16" />}
              title="No Featured Artists"
              description="Check back soon for featured artists on the platform."
            />
          )}
        </div>
      </section>

      {/* Trending Songs */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold" data-testid="trending-songs-title">Trending Now</h2>
            <Button variant="ghost" className="text-primary hover:text-primary/80" data-testid="view-charts">
              View Charts
              <BarChart3 className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {songsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="loading-pulse h-96 rounded-2xl" />
              ))}
            </div>
          ) : trendingSongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingSongs.map((song: Song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Music className="w-16 h-16" />}
              title="No Trending Songs"
              description="Be the first to discover trending music on Rise Up Creators."
            />
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold" data-testid="upcoming-events-title">Upcoming Events</h2>
            <Button variant="ghost" className="text-primary hover:text-primary/80" data-testid="view-all-events">
              View All Events
              <Ticket className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="loading-pulse h-80 rounded-2xl" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event: Event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Ticket className="w-16 h-16" />}
              title="No Upcoming Events"
              description="Stay tuned for exciting live events and concerts."
            />
          )}
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6" data-testid="value-prop-title">Why Rise Up Creators?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The complete platform that empowers artists and connects them directly with their fans
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Artists */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-primary mb-8">For Artists</h3>

              {[
                {
                  icon: Upload,
                  title: "Upload & Stream",
                  description: "Upload your music and reach listeners worldwide. Keep 100% ownership of your content.",
                },
                {
                  icon: DollarSign,
                  title: "Multiple Revenue Streams",
                  description: "Earn from subscriptions, merchandise, event tickets, and ad revenue sharing.",
                },
                {
                  icon: BarChart3,
                  title: "Deep Analytics",
                  description: "Understand your audience with detailed analytics and insights to grow your fanbase.",
                },
                {
                  icon: Users,
                  title: "Direct Fan Connection",
                  description: "Build meaningful relationships with your fans through exclusive content and events.",
                },
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4" data-testid={`artist-feature-${index}`}>
                  <div className="w-12 h-12 red-gradient rounded-2xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* For Fans */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-primary mb-8">For Fans</h3>

              {[
                {
                  icon: Music,
                  title: "Discover New Music",
                  description: "Find your next favorite artist with personalized recommendations and trending charts.",
                },
                {
                  icon: Crown,
                  title: "Exclusive Content",
                  description: "Get access to exclusive tracks, behind-the-scenes content, and artist updates.",
                },
                {
                  icon: Ticket,
                  title: "Events & Merch",
                  description: "Buy concert tickets and exclusive merchandise directly from your favorite artists.",
                },
                {
                  icon: Heart,
                  title: "Support Artists Directly",
                  description: "Your subscriptions and purchases go directly to supporting independent artists.",
                },
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4" data-testid={`fan-feature-${index}`}>
                  <div className="w-12 h-12 red-gradient rounded-2xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <Card className="bg-muted/50 border-border max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4" data-testid="cta-title">Ready to Rise Up?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of artists and fans already building the future of music together.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button asChild className="w-full sm:w-auto btn-primary" data-testid="cta-start-journey">
                    <Link href="/register">Start Your Journey</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:w-auto" data-testid="cta-learn-more">
                    <Link href="/about">Learn More</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
