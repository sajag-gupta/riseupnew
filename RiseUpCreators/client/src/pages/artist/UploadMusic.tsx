
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AudioVisualizer } from "@/components/ui/audio-visualizer";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  Music,
  Image as ImageIcon,
  X,
  Play,
  Pause,
  Volume2,
  DollarSign,
  Users,
  Globe,
  Lock,
  Eye,
  Calendar,
  Tag,
} from "lucide-react";
import type { Song } from "@shared/schema";

interface SongFormData {
  title: string;
  genre: string;
  subGenres: string[];
  description: string;
  visibility: 'public' | 'subscriber_only' | 'private';
  monetization: {
    isMonetized: boolean;
    adEnabled: boolean;
    price?: number;
  };
  metadata: {
    bpm?: number;
    key?: string;
    mood?: string;
    energy?: number;
    danceability?: number;
    tags: string[];
    lyrics?: string;
  };
  releaseDate: string;
}

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 
  'R&B', 'Reggae', 'Blues', 'Folk', 'Punk', 'Metal', 'Alternative', 'Indie'
];

const moods = ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Aggressive', 'Melancholic', 'Uplifting'];
const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function UploadMusic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);

  const [formData, setFormData] = useState<SongFormData>({
    title: '',
    genre: '',
    subGenres: [],
    description: '',
    visibility: 'public',
    monetization: {
      isMonetized: false,
      adEnabled: true,
    },
    metadata: {
      tags: [],
    },
    releaseDate: new Date().toISOString().split('T')[0],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await fetch('/api/songs/upload', {
        method: 'POST',
        body: data,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Your music has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artists/my-music"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const resetForm = () => {
    setStep(1);
    setAudioFile(null);
    setArtworkFile(null);
    setAudioPreview(null);
    setArtworkPreview(null);
    setFormData({
      title: '',
      genre: '',
      subGenres: [],
      description: '',
      visibility: 'public',
      monetization: {
        isMonetized: false,
        adEnabled: true,
      },
      metadata: {
        tags: [],
      },
      releaseDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Audio file must be less than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioPreview(url);

    // Get audio duration
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration);
    });
  };

  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image file must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setArtworkFile(file);
    const url = URL.createObjectURL(file);
    setArtworkPreview(url);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!formData.metadata.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          tags: [...prev.metadata.tags, newTag]
        }
      }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags.filter(tag => tag !== tagToRemove)
      }
    }));
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      toast({
        title: "Missing audio file",
        description: "Please select an audio file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your song.",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append('audioFile', audioFile);
    if (artworkFile) {
      data.append('artworkFile', artworkFile);
    }
    
    // Add form data
    data.append('songData', JSON.stringify({
      ...formData,
      duration: Math.round(audioDuration),
    }));

    uploadMutation.mutate(data);
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'subscriber_only': return <Users className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to upload music.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Music</h1>
          <p className="text-muted-foreground">Share your music with the world</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 ${
                    step > stepNum ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of 3: {
              step === 1 ? 'Upload Files' : 
              step === 2 ? 'Song Details' : 
              'Publish Settings'
            }
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Audio Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Audio File
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!audioFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Drop your audio file here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                      <p className="text-xs text-muted-foreground">Supports MP3, WAV, FLAC (max 50MB)</p>
                    </div>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Music className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">{audioFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                            {audioDuration > 0 && ` • ${formatDuration(audioDuration)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {audioPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={togglePlayPause}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAudioFile(null);
                            setAudioPreview(null);
                            setAudioDuration(0);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {audioPreview && (
                      <>
                        <audio
                          ref={audioRef}
                          src={audioPreview}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <AudioVisualizer audioUrl={audioPreview} isPlaying={isPlaying} />
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Artwork Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Artwork (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!artworkFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center relative">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Add cover art</p>
                    <p className="text-xs text-muted-foreground mb-4">JPG, PNG (max 10MB, recommended 1000x1000)</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleArtworkUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={artworkPreview!}
                        alt="Artwork preview"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setArtworkFile(null);
                          setArtworkPreview(null);
                        }}
                        className="absolute -top-2 -right-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div>
                      <p className="font-medium">{artworkFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(artworkFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!audioFile}
              >
                Next: Song Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Song Details */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Song Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter song title"
                  />
                </div>

                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell listeners about your song..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="releaseDate">Release Date</Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bpm">BPM</Label>
                    <Input
                      id="bpm"
                      type="number"
                      value={formData.metadata.bpm || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, bpm: parseInt(e.target.value) || undefined }
                      }))}
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Select
                      value={formData.metadata.key || ''}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, key: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        {keys.map(key => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mood">Mood</Label>
                    <Select
                      value={formData.metadata.mood || ''}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, mood: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map(mood => (
                          <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.metadata.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tags (e.g., chill, summer, love)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="lyrics">Lyrics (Optional)</Label>
                  <Textarea
                    id="lyrics"
                    value={formData.metadata.lyrics || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, lyrics: e.target.value }
                    }))}
                    placeholder="Add your song lyrics..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Publish Settings
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Publish Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can listen to this song', icon: <Globe className="w-4 h-4" /> },
                    { value: 'subscriber_only', label: 'Subscribers Only', desc: 'Only your subscribers can listen', icon: <Users className="w-4 h-4" /> },
                    { value: 'private', label: 'Private', desc: 'Only you can access this song', icon: <Lock className="w-4 h-4" /> },
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.visibility === option.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, visibility: option.value as any }))}
                    >
                      <div className="flex items-center space-x-3">
                        {option.icon}
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Monetization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="monetized">Enable Monetization</Label>
                    <p className="text-sm text-muted-foreground">Allow fans to tip and support your music</p>
                  </div>
                  <Switch
                    id="monetized"
                    checked={formData.monetization.isMonetized}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      monetization: { ...prev.monetization, isMonetized: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ads">Enable Ads</Label>
                    <p className="text-sm text-muted-foreground">Show ads to generate revenue</p>
                  </div>
                  <Switch
                    id="ads"
                    checked={formData.monetization.adEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      monetization: { ...prev.monetization, adEnabled: checked }
                    }))}
                  />
                </div>

                {formData.monetization.isMonetized && (
                  <div>
                    <Label htmlFor="price">Premium Price (Optional)</Label>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monetization.price || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          monetization: { 
                            ...prev.monetization, 
                            price: parseFloat(e.target.value) || undefined 
                          }
                        }))}
                        placeholder="0.99"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Set a price for premium access. Leave empty for free listening.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {isUploading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Uploading...</span>
                      <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isUploading}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Publish Song'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
