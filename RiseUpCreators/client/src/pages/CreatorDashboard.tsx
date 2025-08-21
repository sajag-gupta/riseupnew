import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Music, 
  DollarSign, 
  Users, 
  Play, 
  Eye, 
  Heart, 
  ShoppingBag,
  Calendar,
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  Settings,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { formatTime, validateAudioFile, validateImageFile } from "@/lib/audioUtils";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch creator data
  const { data: stats } = useQuery({
    queryKey: ["/api/creator/stats"],
  });

  const { data: songs = [] } = useQuery({
    queryKey: ["/api/creator/songs"],
  });

  const { data: albums = [] } = useQuery({
    queryKey: ["/api/creator/albums"],
  });

  const { data: revenue } = useQuery({
    queryKey: ["/api/creator/revenue"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/creator/analytics"],
  });

  if (!user || user.role !== "artist") {
    return (
      <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-8 text-center">
              <Music className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-ruc-text-muted">You need to be a verified artist to access this dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ruc-black text-ruc-text pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-ruc-text-muted">
            Manage your music, track your performance, and grow your fanbase
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Total Plays</p>
                  <p className="text-2xl font-bold">{stats?.totalPlays?.toLocaleString() || 0}</p>
                </div>
                <Play className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Followers</p>
                  <p className="text-2xl font-bold">{stats?.totalFollowers?.toLocaleString() || 0}</p>
                </div>
                <Users className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold">${revenue?.monthly?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-ruc-surface border-ruc-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ruc-text-muted text-sm">Songs</p>
                  <p className="text-2xl font-bold">{songs.length}</p>
                </div>
                <Music className="w-8 h-8 text-ruc-red" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-ruc-surface">
            <TabsTrigger value="overview" className="data-[state=active]:bg-ruc-red" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-ruc-red" data-testid="tab-upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="songs" className="data-[state=active]:bg-ruc-red" data-testid="tab-songs">
              <Music className="w-4 h-4 mr-2" />
              My Music
            </TabsTrigger>
            <TabsTrigger value="merch" className="data-[state=active]:bg-ruc-red" data-testid="tab-merch">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Merchandise
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-ruc-red" data-testid="tab-events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-ruc-red" data-testid="tab-analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card className="bg-ruc-surface border-ruc-border">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.recentActivity?.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-ruc-surface-2 rounded-lg">
                        <div className="w-2 h-2 bg-ruc-red rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-ruc-text-muted">{activity.timeAgo}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-ruc-text-muted text-center py-8">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Songs */}
              <Card className="bg-ruc-surface border-ruc-border">
                <CardHeader>
                  <CardTitle>Top Performing Songs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {songs.slice(0, 5).map((song: any, index: number) => (
                      <div key={song.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-ruc-red rounded text-white text-sm flex items-center justify-center">
                          {index + 1}
                        </div>
                        <img
                          src={song.artworkUrl || "/placeholder-album.jpg"}
                          alt={song.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{song.title}</p>
                          <p className="text-sm text-ruc-text-muted">{song.playCount} plays</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <UploadSongForm />
          </TabsContent>

          {/* Songs Tab */}
          <TabsContent value="songs">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Songs</CardTitle>
                  <Button
                    onClick={() => setActiveTab("upload")}
                    className="red-gradient"
                    data-testid="upload-song-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Song
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {songs.length > 0 ? (
                  <div className="space-y-4">
                    {songs.map((song: any) => (
                      <SongRow key={song.id} song={song} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No songs uploaded yet</h3>
                    <p className="text-ruc-text-muted mb-4">Upload your first song to get started</p>
                    <Button
                      onClick={() => setActiveTab("upload")}
                      className="red-gradient"
                      data-testid="upload-first-song"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your First Song
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Merchandise Tab */}
          <TabsContent value="merch">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Merchandise</CardTitle>
                  <Button className="red-gradient" data-testid="create-merch-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No merchandise yet</h3>
                  <p className="text-ruc-text-muted mb-4">Create your first product to start selling</p>
                  <Button className="red-gradient" data-testid="create-first-product">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="bg-ruc-surface border-ruc-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Events</CardTitle>
                  <Button className="red-gradient" data-testid="create-event-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-ruc-text-low mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No events scheduled</h3>
                  <p className="text-ruc-text-muted mb-4">Create your first event to connect with fans</p>
                  <Button className="red-gradient" data-testid="create-first-event">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card className="bg-ruc-surface border-ruc-border">
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-ruc-red mb-2">
                        {analytics?.playsGrowth || "+0%"}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Plays Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-ruc-red mb-2">
                        {analytics?.followersGrowth || "+0%"}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Followers Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-ruc-red mb-2">
                        {analytics?.revenueGrowth || "+0%"}
                      </div>
                      <div className="text-sm text-ruc-text-muted">Revenue Growth</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Upload Song Form Component
function UploadSongForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await apiRequest("POST", "/api/creator/songs", formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return response.json();
      } finally {
        clearInterval(progressInterval);
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/songs"] });
      toast({
        title: "Song uploaded successfully!",
        description: "Your song is now available to your fans.",
      });
      // Reset form
      setAudioFile(null);
      setArtworkFile(null);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (audioFile) {
      formData.append("audio", audioFile);
    }
    if (artworkFile) {
      formData.append("artwork", artworkFile);
    }
    
    uploadMutation.mutate(formData);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateAudioFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      setAudioFile(file);
    }
  };

  const handleArtworkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      setArtworkFile(file);
    }
  };

  return (
    <Card className="bg-ruc-surface border-ruc-border">
      <CardHeader>
        <CardTitle>Upload New Song</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Song Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter song title"
                className="bg-ruc-surface-2 border-ruc-border focus:border-ruc-red"
                required
                data-testid="song-title-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select name="genre">
                <SelectTrigger className="bg-ruc-surface-2 border-ruc-border">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-ruc-surface border-ruc-border">
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="hiphop">Hip-Hop</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="folk">Folk</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Tell your fans about this song..."
              className="bg-ruc-surface-2 border-ruc-border focus:border-ruc-red"
              rows={3}
              data-testid="song-description-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="audio">Audio File *</Label>
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="bg-ruc-surface-2 border-ruc-border focus:border-ruc-red"
                required
                data-testid="audio-file-input"
              />
              {audioFile && (
                <p className="text-sm text-ruc-text-muted">
                  Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="artwork">Artwork</Label>
              <Input
                id="artwork"
                type="file"
                accept="image/*"
                onChange={handleArtworkFileChange}
                className="bg-ruc-surface-2 border-ruc-border focus:border-ruc-red"
                data-testid="artwork-file-input"
              />
              {artworkFile && (
                <p className="text-sm text-ruc-text-muted">
                  Selected: {artworkFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select name="visibility" defaultValue="public">
              <SelectTrigger className="bg-ruc-surface-2 border-ruc-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-ruc-surface border-ruc-border">
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="subscriber_only">Subscribers Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ruc-text-muted">Uploading...</span>
                <span className="text-sm text-ruc-text-muted">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button
            type="submit"
            className="w-full red-gradient hover:shadow-red-glow"
            disabled={isUploading || !audioFile}
            data-testid="upload-song-submit"
          >
            {isUploading ? "Uploading..." : "Upload Song"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Song Row Component
function SongRow({ song }: { song: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/creator/songs/${song.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/songs"] });
      toast({
        title: "Song deleted",
        description: "The song has been removed from your library.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex items-center space-x-4 p-4 bg-ruc-surface-2 rounded-lg" data-testid={`song-row-${song.id}`}>
      <img
        src={song.artworkUrl || "/placeholder-album.jpg"}
        alt={song.title}
        className="w-16 h-16 rounded object-cover"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{song.title}</h4>
        <p className="text-sm text-ruc-text-muted">{song.genre}</p>
        <div className="flex items-center space-x-4 text-xs text-ruc-text-low mt-1">
          <span><Play className="w-3 h-3 inline mr-1" />{song.playCount}</span>
          <span><Heart className="w-3 h-3 inline mr-1" />{song.likeCount}</span>
          <span><Eye className="w-3 h-3 inline mr-1" />{song.visibility}</span>
        </div>
      </div>
      
      <div className="text-sm text-ruc-text-muted">
        {formatTime(song.duration)}
      </div>
      
      <Badge 
        variant={song.visibility === 'public' ? 'default' : 'secondary'}
        className={song.visibility === 'public' ? 'bg-ruc-success' : ''}
      >
        {song.visibility}
      </Badge>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" data-testid={`edit-song-${song.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          data-testid={`delete-song-${song.id}`}
        >
          <Trash2 className="w-4 h-4 text-ruc-danger" />
        </Button>
      </div>
    </div>
  );
}
