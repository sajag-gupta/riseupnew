
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  Music,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Download,
  Share,
  TrendingUp,
  Users,
  Heart,
  Calendar,
  Globe,
  Lock,
  DollarSign,
} from "lucide-react";
import type { Song } from "@shared/schema";

export default function MyMusic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  const { data: songsData, isLoading } = useQuery({
    queryKey: ["/api/artists/my-music"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/artists/my-music");
      return response.json();
    },
    enabled: !!user && user.role === 'artist',
  });

  const deleteSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await apiRequest("DELETE", `/api/songs/${songId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Song deleted",
        description: "The song has been removed from your library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artists/my-music"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete song.",
        variant: "destructive",
      });
    },
  });

  const updateSongVisibilityMutation = useMutation({
    mutationFn: async ({ songId, visibility }: { songId: string; visibility: string }) => {
      const response = await apiRequest("PUT", `/api/songs/${songId}`, {
        body: JSON.stringify({ visibility }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Visibility updated",
        description: "Song visibility has been changed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artists/my-music"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update visibility.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== 'artist') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Artist Access Required</h2>
              <p className="text-muted-foreground mb-4">
                This page is only available for artist accounts.
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const songs = songsData?.songs || [];
  const stats = songsData?.stats || {
    totalSongs: 0,
    totalPlays: 0,
    totalLikes: 0,
    monthlyListeners: 0,
  };

  const filteredSongs = songs.filter((song: Song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTabSongs = () => {
    switch (activeTab) {
      case 'public':
        return filteredSongs.filter((song: Song) => song.visibility === 'public');
      case 'private':
        return filteredSongs.filter((song: Song) => song.visibility === 'private');
      case 'subscriber':
        return filteredSongs.filter((song: Song) => song.visibility === 'subscriber_only');
      default:
        return filteredSongs;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Badge className="bg-green-100 text-green-800"><Globe className="w-3 h-3 mr-1" />Public</Badge>;
      case 'private':
        return <Badge className="bg-red-100 text-red-800"><Lock className="w-3 h-3 mr-1" />Private</Badge>;
      case 'subscriber_only':
        return <Badge className="bg-blue-100 text-blue-800"><Users className="w-3 h-3 mr-1" />Subscribers</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Music</h1>
            <p className="text-muted-foreground">Manage your uploaded music</p>
          </div>
          <Button onClick={() => window.location.href = '/artist/upload'}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Music
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Music className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalSongs}</div>
                  <div className="text-sm text-muted-foreground">Total Songs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Play className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Plays</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Heart className="w-8 h-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Likes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.monthlyListeners.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Monthly Listeners</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search your music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({songs.length})</TabsTrigger>
            <TabsTrigger value="public">
              Public ({songs.filter((s: Song) => s.visibility === 'public').length})
            </TabsTrigger>
            <TabsTrigger value="subscriber">
              Subscribers ({songs.filter((s: Song) => s.visibility === 'subscriber_only').length})
            </TabsTrigger>
            <TabsTrigger value="private">
              Private ({songs.filter((s: Song) => s.visibility === 'private').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {getTabSongs().length === 0 ? (
              <EmptyState
                icon={<Music className="w-16 h-16" />}
                title="No songs found"
                description={
                  searchQuery
                    ? "Try adjusting your search terms"
                    : "Upload your first song to get started"
                }
                action={{
                  label: "Upload Music",
                  onClick: () => window.location.href = '/artist/upload',
                }}
              />
            ) : (
              <div className="space-y-4">
                {getTabSongs().map((song: Song) => (
                  <Card key={song.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        {/* Album Art */}
                        <Avatar className="w-16 h-16 rounded-lg">
                          <AvatarImage src={song.files?.artworkUrl} className="object-cover" />
                          <AvatarFallback className="rounded-lg bg-primary/10">
                            <Music className="w-6 h-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">{song.title}</h3>
                            {getVisibilityBadge(song.visibility)}
                            {song.monetization?.isMonetized && (
                              <Badge variant="outline" className="text-green-600">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Monetized
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span>{song.genre}</span>
                            <span>•</span>
                            <span>{formatDuration(song.duration)}</span>
                            <span>•</span>
                            <span>{formatDate(song.releaseDate)}</span>
                          </div>

                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-1">
                              <Play className="w-4 h-4" />
                              <span>{song.analytics?.playCount?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{song.analytics?.likeCount?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>{Math.round(song.analytics?.trendingScore || 0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon">
                            <Play className="w-4 h-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.location.href = `/song/${song.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Song
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.location.href = `/artist/edit-song/${song.id}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share className="w-4 h-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateSongVisibilityMutation.mutate({
                                  songId: song.id,
                                  visibility: song.visibility === 'public' ? 'private' : 'public'
                                })}
                              >
                                {song.visibility === 'public' ? (
                                  <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Make Private
                                  </>
                                ) : (
                                  <>
                                    <Globe className="w-4 h-4 mr-2" />
                                    Make Public
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deleteSongMutation.mutate(song.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
