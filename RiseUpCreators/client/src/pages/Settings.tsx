
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Lock,
  DollarSign,
  CreditCard,
  Globe,
  Eye,
  EyeOff,
  Upload,
  X,
  Save,
  AlertTriangle,
  Shield,
  Volume2,
  Mail,
  Smartphone,
  Camera,
  MapPin,
  Calendar,
  Link,
  Tag,
} from "lucide-react";

interface UserSettings {
  profile: {
    name: string;
    bio: string;
    location: string;
    dateOfBirth: string;
    genres: string[];
    socialLinks: {
      instagram: string;
      twitter: string;
      youtube: string;
      spotify: string;
      website: string;
    };
  };
  privacy: {
    showListeningActivity: boolean;
    showPlaylists: boolean;
    allowMessages: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  adPreferences: {
    personalizedAds: boolean;
    frequency: string;
  };
}

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 
  'R&B', 'Reggae', 'Blues', 'Folk', 'Punk', 'Metal', 'Alternative', 'Indie'
];

const adFrequencies = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'normal', label: 'Normal' },
  { value: 'frequent', label: 'Frequent' },
];

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [genreInput, setGenreInput] = useState('');

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: '',
      bio: '',
      location: '',
      dateOfBirth: '',
      genres: [],
      socialLinks: {
        instagram: '',
        twitter: '',
        youtube: '',
        spotify: '',
        website: '',
      },
    },
    privacy: {
      showListeningActivity: true,
      showPlaylists: true,
      allowMessages: true,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
    },
    adPreferences: {
      personalizedAds: true,
      frequency: 'normal',
    },
  });

  // Fetch user settings
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ["/api/user/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/settings");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings);
    }
  }, [userSettings]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PUT", "/api/user/profile", {
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await apiRequest("PUT", "/api/user/settings", {
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleProfileUpdate = () => {
    const formData = new FormData();
    
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    formData.append('profileData', JSON.stringify(settings.profile));
    updateProfileMutation.mutate(formData);
  };

  const addGenre = () => {
    if (!genreInput.trim()) return;
    
    const newGenre = genreInput.trim();
    if (!settings.profile.genres.includes(newGenre)) {
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          genres: [...prev.profile.genres, newGenre]
        }
      }));
    }
    setGenreInput('');
  };

  const removeGenre = (genreToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        genres: prev.profile.genres.filter(genre => genre !== genreToRemove)
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Please log in to access your settings.
              </p>
              <Button onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="monetization" className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Monetization
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarPreview || user?.avatar || ''} />
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="avatar" className="text-sm font-medium">Profile Picture</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="avatar" className="cursor-pointer">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </label>
                      </Button>
                      {avatarPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={settings.profile.name}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value }
                      }))}
                      placeholder="Your display name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={settings.profile.location}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, location: e.target.value }
                      }))}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={settings.profile.bio}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, bio: e.target.value }
                    }))}
                    placeholder="Tell people about yourself..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={settings.profile.dateOfBirth}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, dateOfBirth: e.target.value }
                    }))}
                  />
                </div>

                {/* Genres */}
                <div>
                  <Label>Music Genres</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.profile.genres.map(genre => (
                      <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                        {genre}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeGenre(genre)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select value={genreInput} onValueChange={setGenreInput}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Add a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.filter(g => !settings.profile.genres.includes(g)).map(genre => (
                          <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addGenre} variant="outline">
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <Label>Social Links</Label>
                  <div className="space-y-3 mt-2">
                    {[
                      { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
                      { key: 'instagram', label: 'Instagram', icon: Link, placeholder: 'https://instagram.com/username' },
                      { key: 'twitter', label: 'Twitter', icon: Link, placeholder: 'https://twitter.com/username' },
                      { key: 'youtube', label: 'YouTube', icon: Link, placeholder: 'https://youtube.com/channel' },
                      { key: 'spotify', label: 'Spotify', icon: Link, placeholder: 'https://open.spotify.com/artist' },
                    ].map(social => {
                      const Icon = social.icon;
                      return (
                        <div key={social.key} className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <Input
                            value={settings.profile.socialLinks[social.key as keyof typeof settings.profile.socialLinks]}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              profile: {
                                ...prev.profile,
                                socialLinks: {
                                  ...prev.profile.socialLinks,
                                  [social.key]: e.target.value
                                }
                              }
                            }))}
                            placeholder={social.placeholder}
                            className="flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="listening-activity">Show Listening Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Let others see what you're currently listening to
                      </p>
                    </div>
                    <Switch
                      id="listening-activity"
                      checked={settings.privacy.showListeningActivity}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showListeningActivity: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="playlists">Show Playlists</Label>
                      <p className="text-sm text-muted-foreground">
                        Make your playlists visible to other users
                      </p>
                    </div>
                    <Switch
                      id="playlists"
                      checked={settings.privacy.showPlaylists}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showPlaylists: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="messages">Allow Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Let other users send you direct messages
                      </p>
                    </div>
                    <Switch
                      id="messages"
                      checked={settings.privacy.allowMessages}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, allowMessages: checked }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => updateSettingsMutation.mutate({ privacy: settings.privacy })}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Privacy Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates via email
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailNotifications: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get push notifications on your device
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, pushNotifications: checked }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Ad Preferences</Label>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="personalized-ads">Personalized Ads</Label>
                        <p className="text-sm text-muted-foreground">
                          Show ads based on your listening preferences
                        </p>
                      </div>
                      <Switch
                        id="personalized-ads"
                        checked={settings.adPreferences.personalizedAds}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          adPreferences: { ...prev.adPreferences, personalizedAds: checked }
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ad-frequency">Ad Frequency</Label>
                      <Select
                        value={settings.adPreferences.frequency}
                        onValueChange={(value) => setSettings(prev => ({
                          ...prev,
                          adPreferences: { ...prev.adPreferences, frequency: value }
                        }))}
                      >
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {adFrequencies.map(freq => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => updateSettingsMutation.mutate({ 
                      notifications: settings.notifications,
                      adPreferences: settings.adPreferences
                    })}
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Notification Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monetization */}
          <TabsContent value="monetization" className="space-y-6">
            {user?.role === 'artist' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Monetization & Payouts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Artist Monetization</h3>
                    <p className="text-sm text-muted-foreground">
                      As an artist, you can earn through subscriptions, merchandise sales, 
                      event tickets, and ad revenue sharing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold">$0.00</div>
                          <div className="text-sm text-muted-foreground">Pending Earnings</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <div className="text-2xl font-bold">$0.00</div>
                          <div className="text-sm text-muted-foreground">Total Earned</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Button className="w-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Set Up Payout Method
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Configure your bank details or PayPal to receive payments
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-lg font-semibold mb-2">Monetization Unavailable</h3>
                    <p className="text-muted-foreground mb-4">
                      Monetization features are only available for artist accounts.
                    </p>
                    <Button variant="outline">
                      Upgrade to Artist Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
