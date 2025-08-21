import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner, EmptyState } from "@/components/ui/loading-spinner";
import {
  BarChart3,
  DollarSign,
  Music,
  Users,
  Calendar,
  ShoppingBag,
  Upload,
  Eye,
  Heart,
  Play,
  TrendingUp,
} from "lucide-react";

export default function ArtistDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/analytics/dashboard");
      return response.json();
    },
  });

  const { data: songs = [], isLoading: songsLoading } = useQuery({
    queryKey: ["/api/songs/my-music"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/songs/my-music");
      return response.json();
    },
  });

  const { data: revenue = {}, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/analytics/revenue"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/analytics/revenue");
      return response.json();
    },
  });

  if (statsLoading || songsLoading || revenueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Plays",
      value: stats?.totalPlays?.toLocaleString() || "0",
      icon: Play,
      change: "+12.5%",
      changeType: "positive" as const,
    },
    {
      title: "Followers",
      value: stats?.totalFollowers?.toLocaleString() || "0",
      icon: Users,
      change: "+8.2%",
      changeType: "positive" as const,
    },
    {
      title: "Monthly Revenue",
      value: `$${revenue?.monthly?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      change: "+15.3%",
      changeType: "positive" as const,
    },
    {
      title: "Songs Published",
      value: songs.length.toString(),
      icon: Music,
      change: "+2",
      changeType: "positive" as const,
    },
  ];

  const revenueBreakdown = [
    { source: "Streaming", amount: revenue?.streaming || 0, color: "bg-primary" },
    { source: "Subscriptions", amount: revenue?.subscriptions || 0, color: "bg-secondary" },
    { source: "Merchandise", amount: revenue?.merchandise || 0, color: "bg-accent" },
    { source: "Events", amount: revenue?.events || 0, color: "bg-muted" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="dashboard-title">Creator Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your music, track your performance, and grow your audience
          </p>
        </div>
        <Button className="btn-primary" data-testid="upload-music-button">
          <Upload className="w-4 h-4 mr-2" />
          Upload Music
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                    {stat.value}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  from last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
          <TabsTrigger value="music" data-testid="music-tab">Music</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="revenue-tab">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "New follower", description: "John Doe started following you", time: "2 hours ago" },
                    { action: "Song liked", description: "\"Midnight Dreams\" received 25 new likes", time: "4 hours ago" },
                    { action: "Revenue milestone", description: "You've earned $500 this month", time: "1 day ago" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Songs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Top Performing Songs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {songs.length > 0 ? (
                  <div className="space-y-4">
                    {songs.slice(0, 5).map((song: any, index: number) => (
                      <div key={song.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-muted-foreground w-4">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{song.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {song.analytics?.playCount || 0} plays
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Heart className="w-4 h-4" />
                          <span>{song.analytics?.likeCount || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Music className="w-12 h-12" />}
                    title="No Songs Yet"
                    description="Upload your first song to start tracking performance."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="music" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Music</h2>
            <Button className="btn-primary">
              <Upload className="w-4 h-4 mr-2" />
              Upload New Song
            </Button>
          </div>

          {songs.length > 0 ? (
            <div className="space-y-4">
              {songs.map((song: any) => (
                <Card key={song.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{song.title}</h3>
                          <p className="text-muted-foreground">{song.genre}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Play className="w-3 h-3 mr-1" />
                              {song.analytics?.playCount || 0} plays
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {song.analytics?.likeCount || 0} likes
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {song.visibility}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          Analytics
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Music className="w-16 h-16" />}
              title="No Music Uploaded"
              description="Start your journey by uploading your first song."
              action={{
                label: "Upload Your First Song",
                onClick: () => console.log("Upload music"),
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plays Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Demographics chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBreakdown.map((item) => (
                    <div key={item.source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="font-medium">{item.source}</span>
                      </div>
                      <span className="font-bold">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Earnings chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
