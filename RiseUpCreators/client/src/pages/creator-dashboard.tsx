import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Upload, Music, Calendar, ShoppingBag,
  DollarSign, Users, Heart, Play, Plus, Edit, Trash2, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequireRole } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import Loading from "@/components/common/loading";
import Sidebar from "@/components/layout/sidebar";
import CreateEventForm from "@/components/forms/create-event-form";
import MerchForm from "@/components/forms/merch-form";
import BlogForm from "@/components/forms/blog-form";
import { MUSIC_GENRES } from "@/lib/constants";
import { sidebarEventBus } from "@/components/layout/sidebar";

// ---------- INTERFACES ----------
interface ArtistProfile {
  _id: string;
  userId: string;
  bio: string;
  socialLinks: Record<string, string>;
  followers: string[];
  totalPlays: number;
  totalLikes: number;
  revenue: { subscriptions: number; merch: number; events: number; ads: number };
  trendingScore: number;
  featured: boolean;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Song {
  _id: string;
  artistId: string;
  title: string;
  genre: string;
  fileUrl: string;
  artworkUrl: string;
  durationSec: number;
  plays: number;
  uniqueListeners: number;
  likes: number;
  shares: number;
  visibility: "PUBLIC" | "SUBSCRIBER_ONLY";
  adEnabled: boolean;
  createdAt: Date;
}

interface Event {
  _id: string;
  artistId: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  onlineUrl?: string;
  ticketPrice: number;
  capacity?: number;
  imageUrl?: string;
  attendees: string[];
  createdAt: Date;
}

interface Merch {
  _id: string;
  artistId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category?: string;
  orders: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Analytics {
  monthlyRevenue: number;
  subscriptionRevenue: number;
  merchRevenue: number;
  eventRevenue: number;
  totalPlays: number;
  uniqueListeners: number;
  totalLikes: number;
  newFollowers: number;
  newSubscribers: number;
  conversionRate: number;
  topSongs: Song[];
}

interface Blog {
  _id: string;
  artistId: string;
  title: string;
  content: string;
  visibility: "PUBLIC" | "SUBSCRIBER_ONLY";
  images: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------- COMPONENT ----------
export default function CreatorDashboard() {
  const auth = useRequireRole("artist");
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Extract tab from URL search params or route params
  const getTabFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) return tabParam;

    const pathParts = location.split('/');
    return pathParts[2] || "overview";
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  useEffect(() => {
    const currentTab = getTabFromUrl();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);

      // Refetch data when switching to specific tabs
      if (currentTab === "songs") {
        queryClient.invalidateQueries({ queryKey: ["artistSongs"] });
      } else if (currentTab === "events") {
        queryClient.invalidateQueries({ queryKey: ["artistEvents"] });
      } else if (currentTab === "merch") {
        queryClient.invalidateQueries({ queryKey: ["artistMerch"] });
      }
    }
  }, [location, activeTab, queryClient]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "overview") {
      setLocation("/creator");
    } else {
      setLocation(`/creator?tab=${value}`);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showAddMerchModal, setShowAddMerchModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEditMerchModal, setShowEditMerchModal] = useState(false);
  const [showCreateBlogModal, setShowCreateBlogModal] = useState(false);
  const [showEditBlogModal, setShowEditBlogModal] = useState(false);
  const [showEditSongModal, setShowEditSongModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingMerch, setEditingMerch] = useState<Merch | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Connect sidebar event bus
  useEffect(() => {
    sidebarEventBus.openEventModal = () => setShowCreateEventModal(true);
    sidebarEventBus.openMerchModal = () => setShowAddMerchModal(true);
  }, []);

  // Helper: fetch with auth
  const fetchWithAuth = async (url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` }
    });
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  };

  // ---------- QUERIES ----------
  const { data: artistProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["artistProfile"],
    queryFn: () => fetchWithAuth("/api/artists/profile"),
    enabled: !!auth.user,
  });

  const { data: artistSongs, isLoading: songsLoading } = useQuery({
    queryKey: ["artistSongs"],
    queryFn: () => fetchWithAuth("/api/artists/songs"),
    enabled: !!auth.user,
  });

  const { data: artistEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["artistEvents"],
    queryFn: () => fetchWithAuth("/api/events/artist"),
    enabled: !!auth.user,
  });

  const { data: artistMerch, isLoading: merchLoading } = useQuery({
    queryKey: ["artistMerch"],
    queryFn: () => fetchWithAuth("/api/merch/artist"),
    enabled: !!auth.user,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["artistAnalytics"],
    queryFn: () => fetchWithAuth("/api/artists/analytics"),
    enabled: !!auth.user,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const { data: artistBlogs, isLoading: blogsLoading } = useQuery({
    queryKey: ["artistBlogs"],
    queryFn: () => fetchWithAuth("/api/blogs/artist"),
    enabled: !!auth.user,
  });

  // ---------- SAFE DEFAULTS ----------
  const safeArtistProfile: ArtistProfile = {
    _id: artistProfile?._id || "",
    userId: artistProfile?.userId || auth.user?._id || "",
    bio: artistProfile?.bio || "",
    socialLinks: artistProfile?.socialLinks || {},
    followers: artistProfile?.followers || [],
    totalPlays: artistProfile?.totalPlays || 0,
    totalLikes: artistProfile?.totalLikes || 0,
    revenue: {
      subscriptions: artistProfile?.revenue?.subscriptions || 0,
      merch: artistProfile?.revenue?.merch || 0,
      events: artistProfile?.revenue?.events || 0,
      ads: artistProfile?.revenue?.ads || 0
    },
    trendingScore: artistProfile?.trendingScore || 0,
    featured: artistProfile?.featured || false,
    verified: artistProfile?.verified || false,
    createdAt: artistProfile?.createdAt || new Date(),
    updatedAt: artistProfile?.updatedAt || new Date()
  };
  const safeArtistSongs: Song[] = Array.isArray(artistSongs) ? artistSongs : [];
  const safeArtistEvents: Event[] = Array.isArray(artistEvents) ? artistEvents : [];
  const safeArtistMerch: Merch[] = Array.isArray(artistMerch) ? artistMerch : [];
  const safeAnalytics: Analytics = analytics || {
    monthlyRevenue: 0, subscriptionRevenue: 0, merchRevenue: 0, eventRevenue: 0,
    totalPlays: 0, uniqueListeners: 0, totalLikes: 0,
    newFollowers: 0, newSubscribers: 0, conversionRate: 0, topSongs: []
  };
  const safeArtistBlogs: Blog[] = Array.isArray(artistBlogs) ? artistBlogs : [];

  // ---------- MUTATIONS ----------

  // Upload Song
  const uploadSongMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistSongs"] });
      toast({ title: "Success", description: "Song uploaded successfully" });
      setIsUploading(false);
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload song. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  // Create Event
  const createEventMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistEvents"] });
      toast({
        title: "Event created successfully",
        description: "Your event is now live for fans to discover",
      });
      setShowCreateEventModal(false);
    },
    onError: () => {
      toast({
        title: "Event creation failed",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete Event
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistEvents"] });
      toast({
        title: "Event deleted successfully",
        description: "Your event has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Event deletion failed",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create Merch
  const createMerchMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/merch", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create merchandise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistMerch"] });
      toast({
        title: "Merchandise added successfully",
        description: "Your product is now available in your store",
      });
      setShowAddMerchModal(false);
    },
    onError: () => {
      toast({
        title: "Merchandise creation failed",
        description: "Failed to add merchandise. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit Event
  const editEventMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistEvents"] });
      toast({
        title: "Event updated successfully",
        description: "Your event changes have been saved",
      });
      setShowEditEventModal(false);
      setEditingEvent(null);
    },
    onError: () => {
      toast({
        title: "Event update failed",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit Merch
  const editMerchMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/merch/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update merchandise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistMerch"] });
      toast({
        title: "Merchandise updated successfully",
        description: "Your product changes have been saved",
      });
      setShowEditMerchModal(false);
      setEditingMerch(null);
    },
    onError: () => {
      toast({
        title: "Merchandise update failed",
        description: "Failed to update merchandise. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create Blog
  const createBlogMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create blog post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistBlogs"] });
      toast({
        title: "Blog post published successfully",
        description: "Your blog post is now live for fans to read",
      });
      setShowCreateBlogModal(false);
    },
    onError: () => {
      toast({
        title: "Blog creation failed",
        description: "Failed to create blog post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit Blog
  const editBlogMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update blog post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistBlogs"] });
      toast({
        title: "Blog post updated successfully",
        description: "Your blog changes have been saved",
      });
      setShowEditBlogModal(false);
      setEditingBlog(null);
    },
    onError: () => {
      toast({
        title: "Blog update failed",
        description: "Failed to update blog post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit Song
  const editSongMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/songs/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update song");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistSongs"] });
      toast({
        title: "Song updated successfully",
        description: "Your song changes have been saved",
      });
      setShowEditSongModal(false);
      setEditingSong(null);
    },
    onError: () => {
      toast({
        title: "Song update failed",
        description: "Failed to update song. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete Song
  const deleteSongMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/songs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete song");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistSongs"] });
      toast({
        title: "Song deleted successfully",
        description: "Your song has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Song deletion failed",
        description: "Failed to delete song. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete Merch
  const deleteMerchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/merch/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete merchandise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistMerch"] });
      toast({
        title: "Merchandise deleted successfully",
        description: "Your product has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Merchandise deletion failed",
        description: "Failed to delete merchandise. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete Blog
  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("ruc_auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete blog post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistBlogs"] });
      toast({
        title: "Blog post deleted successfully",
        description: "Your blog post has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Blog deletion failed",
        description: "Failed to delete blog post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ---------- HANDLERS ----------

  // Song Upload
  const handleSongUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const audioFile = formData.get("audio") as File;
    const artworkFile = formData.get("artwork") as File;

    if (!audioFile || !artworkFile) {
      toast({
        title: "Missing files",
        description: "Please select both audio file and artwork",
        variant: "destructive",
      });
      return;
    }

    const songData = {
      title: formData.get("title") as string,
      genre: formData.get("genre") as string,
      visibility: (formData.get("visibility") as string) || "PUBLIC",
    };

    // The following block is removed as per the provided changes
    // Prepare FormData
    // const uploadFormData = new FormData();
    // uploadFormData.append("audio", audioFile);
    // uploadFormData.append("artwork", artworkFile);
    // uploadFormData.append("data", JSON.stringify(Object.fromEntries(formData.entries())));

    // setIsUploading(true);
    // uploadSongMutation.mutate(uploadFormData);
    // form.reset();
  };

  // ---------- LOADING STATES ----------
  if (auth.isLoading || profileLoading) {
    return (
      <div className="min-h-screen pt-16">
        <Loading size="lg" text="Loading creator dashboard..." />
      </div>
    );
  }

  if (!auth.user) return null;


  return (
    <div className="min-h-screen pt-16 pb-24 flex">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64">
        <div className="container-custom py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your music, track performance, and grow your audience
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-8 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="songs">My Songs</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="merch">Merch</TabsTrigger>
              <TabsTrigger value="blogs">Blogs</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* ------------------ OVERVIEW ------------------ */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Earnings */}
                <Card>
                  <CardHeader className="flex items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹
                      {(
                        safeArtistProfile.revenue.subscriptions +
                        safeArtistProfile.revenue.merch +
                        safeArtistProfile.revenue.events +
                        safeArtistProfile.revenue.ads
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>

                {/* Streams */}
                <Card>
                  <CardHeader className="flex items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeAnalytics.totalPlays?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {safeAnalytics.totalPlays > safeArtistProfile.totalPlays ? '+' : ''}
                      {Math.round(((safeAnalytics.totalPlays - safeArtistProfile.totalPlays) / Math.max(safeArtistProfile.totalPlays, 1)) * 100)}% from last period
                    </p>
                  </CardContent>
                </Card>

                {/* Followers */}
                <Card>
                  <CardHeader className="flex items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Followers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeArtistProfile.followers.length?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{safeAnalytics.newFollowers || 0} this period
                    </p>
                  </CardContent>
                </Card>

                {/* Likes */}
                <Card>
                  <CardHeader className="flex items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeAnalytics.totalLikes?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{Math.max(0, (safeAnalytics.totalLikes || 0) - safeArtistProfile.totalLikes)} new likes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card onClick={() => handleTabChange("upload")} className="cursor-pointer hover-glow">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Upload className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-lg font-semibold">Upload Music</h3>
                    <p className="text-sm text-muted-foreground">Share your tracks with fans</p>
                  </CardContent>
                </Card>

                <Card onClick={() => setShowCreateEventModal(true)} className="cursor-pointer hover-glow">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Calendar className="w-12 h-12 text-secondary mb-4" />
                    <h3 className="text-lg font-semibold">Create Event</h3>
                    <p className="text-sm text-muted-foreground">Schedule concerts & shows</p>
                  </CardContent>
                </Card>

                <Card onClick={() => setShowAddMerchModal(true)} className="cursor-pointer hover-glow">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <ShoppingBag className="w-12 h-12 text-accent mb-4" />
                    <h3 className="text-lg font-semibold">Add Merch</h3>
                    <p className="text-sm text-muted-foreground">Sell products to fans</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ------------------ UPLOAD ------------------ */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Song</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Share your music with the world. Supported formats: MP3, WAV
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSongUpload} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="title">Song Title *</Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="Enter song title"
                          required
                        />
                      </div>

                      {/* Genre */}
                      <div className="space-y-2">
                        <Label htmlFor="genre">Genre *</Label>
                        <Select name="genre" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            {MUSIC_GENRES.map((genre) => (
                              <SelectItem key={genre} value={genre}>
                                {genre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Visibility */}
                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select name="visibility" defaultValue="PUBLIC">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="SUBSCRIBER_ONLY">Subscribers Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Files */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="audio">Audio File *</Label>
                        <Input id="audio" name="audio" type="file" accept="audio/*" required />
                        <p className="text-xs text-muted-foreground">Max size: 50MB</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="artwork">Artwork *</Label>
                        <Input id="artwork" name="artwork" type="file" accept="image/*" required />
                        <p className="text-xs text-muted-foreground">Recommended: 800x800px</p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gradient-primary hover:opacity-90"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loading size="sm" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" /> Upload Song
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ------------------ SONGS ------------------ */}
            <TabsContent value="songs">
              {songsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : safeArtistSongs.length > 0 ? (
                <div className="space-y-4">
                  {safeArtistSongs.map((song, index) => (
                    <Card key={song._id} data-testid={`song-item-${index}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          {/* Song info */}
                          <div className="flex items-center space-x-4">
                            <img
                              src={
                                song.artworkUrl ||
                                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100"
                              }
                              alt={song.title}
                              className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                              onClick={() => setLocation(`/songs/${song._id}`)}
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100")
                              }
                            />
                            <div>
                              <h3 className="font-semibold">{song.title}</h3>
                              <p className="text-sm text-muted-foreground">{song.genre}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {song.plays?.toLocaleString() || 0} plays
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {song.likes?.toLocaleString() || 0} likes
                                </span>
                                {song.visibility === "SUBSCRIBER_ONLY" && (
                                  <Badge variant="secondary" className="text-xs">
                                    Subscribers Only
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingSong(song);
                                setShowEditSongModal(true);
                              }}
                              data-testid={`edit-song-${index}`}
                            >
                              <Edit className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSongMutation.mutate(song._id)}
                              disabled={deleteSongMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No songs uploaded</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first song to start sharing your music with fans.
                    </p>
                    <Button onClick={() => handleTabChange("upload")}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Your First Song
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>


            {/* ------------------ ANALYTICS ------------------ */}
            <TabsContent value="analytics">
              {analyticsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-8 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Revenue */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹{safeAnalytics.monthlyRevenue}</div>
                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between text-xs">
                            <span>Subscriptions</span>
                            <span>₹{safeAnalytics.subscriptionRevenue}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Merch</span>
                            <span>₹{safeAnalytics.merchRevenue}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Events</span>
                            <span>₹{safeAnalytics.eventRevenue}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Engagement */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Plays</span>
                            <span>{safeAnalytics.totalPlays.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Unique Listeners</span>
                            <span>{safeAnalytics.uniqueListeners.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Likes</span>
                            <span>{safeAnalytics.totalLikes.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Growth */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Growth</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>New Followers</span>
                            <span className="text-success font-medium">
                              +{safeAnalytics.newFollowers}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>New Subscribers</span>
                            <span className="text-success font-medium">
                              +{safeAnalytics.newSubscribers}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Conversion Rate</span>
                            <span>{safeAnalytics.conversionRate}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Songs */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Songs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {safeAnalytics.topSongs.length > 0 ? (
                        <div className="space-y-3">
                          {safeAnalytics.topSongs.map((song, index) => (
                            <div key={song._id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                <div>
                                  <p className="font-medium">{song.title}</p>
                                  <p className="text-sm text-muted-foreground">{song.genre}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{(song.plays ?? 0).toLocaleString()} plays</p>
                                <p className="text-sm text-muted-foreground">{(song.likes ?? 0).toLocaleString()} likes</p>
                              </div>

                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No performance data available yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ------------------ EVENTS ------------------ */}
            <TabsContent value="events">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">My Events</h2>
                    <p className="text-sm text-muted-foreground">Manage your upcoming shows</p>
                  </div>
                  <Button
                    className="gradient-primary hover:opacity-90"
                    onClick={() => setShowCreateEventModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                  </Button>
                </div>

                {eventsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : safeArtistEvents.length > 0 ? (
                  <div className="space-y-4">
                    {safeArtistEvents.map((event, index) => (
                      <Card key={event._id} data-testid={`event-item-${index}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            {/* Event info */}
                            <div className="flex items-center space-x-4">
                              {event.imageUrl ? (
                                <img
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                                  onClick={() => setLocation(`/events/${event._id}`)}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=100&h=100";
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                  <Calendar className="w-6 h-6 text-muted-foreground opacity-50" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold">{event.title}</h3>
                                <p className="text-sm text-muted-foreground">{event.location}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(event.date).toLocaleDateString()} @{" "}
                                    {new Date(event.date).toLocaleTimeString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ₹{event.ticketPrice} per ticket
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingEvent(event);
                                  setShowEditEventModal(true);
                                }}
                                data-testid={`edit-event-${index}`}
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteEventMutation.mutate(event._id)}
                                disabled={deleteEventMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first event to connect with fans.
                      </p>
                      <Button
                        className="gradient-primary hover:opacity-90"
                        onClick={() => setShowCreateEventModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Create Event
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>


            {/* ------------------ MERCH ------------------ */}
            <TabsContent value="merch">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">My Merchandise</h2>
                    <p className="text-sm text-muted-foreground">Manage your products</p>
                  </div>
                  <Button
                    className="gradient-primary hover:opacity-90"
                    onClick={() => setShowAddMerchModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Merchandise
                  </Button>
                </div>

                {merchLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="aspect-square bg-muted rounded mb-4"></div>
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : safeArtistMerch.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {safeArtistMerch.map((item, index) => (
                      <Card key={item._id} data-testid={`merch-item-${index}`}>
                        <CardContent className="p-6">
                          <div className="aspect-square rounded-lg overflow-hidden mb-4">
                            <img
                              src={
                                item.images?.[0] ||
                                "https://images.unsplash.com/photo-1521572163474-686442075746?w=300&h=300"
                              }
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">₹{item.price}</span>
                              <span className="text-sm text-muted-foreground">
                                Stock: {item.stock}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setEditingMerch(item);
                                  setShowEditMerchModal(true);
                                }}
                                data-testid={`edit-merch-${index}`}
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => deleteMerchMutation.mutate(item._id)}
                                disabled={deleteMerchMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No merchandise added</h3>
                      <p className="text-muted-foreground mb-4">
                        Start selling products to your fans.
                      </p>
                      <Button
                        className="gradient-primary hover:opacity-90"
                        onClick={() => setShowAddMerchModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Merchandise
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ------------------ BLOGS ------------------ */}
            <TabsContent value="blogs">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">My Blog Posts</h2>
                    <p className="text-sm text-muted-foreground">Share insights and connect with your audience</p>
                  </div>
                  <Button
                    className="gradient-primary hover:opacity-90"
                    onClick={() => setShowCreateBlogModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Blog Post
                  </Button>
                </div>

                {blogsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : safeArtistBlogs.length > 0 ? (
                  <div className="space-y-4">
                    {safeArtistBlogs.map((blog, index) => (
                      <Card key={blog._id} data-testid={`blog-item-${index}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-lg">{blog.title}</h3>
                                {blog.visibility === "SUBSCRIBER_ONLY" && (
                                  <Badge variant="secondary" className="text-xs">
                                    Subscribers Only
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {blog.content.replace(/[#*>]/g, '').substring(0, 150)}...
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>
                                  {new Date(blog.createdAt).toLocaleDateString()}
                                </span>
                                {blog.tags && blog.tags.length > 0 && (
                                  <div className="flex items-center space-x-1">
                                    {blog.tags.slice(0, 3).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingBlog(blog);
                                  setShowEditBlogModal(true);
                                }}
                                data-testid={`edit-blog-${index}`}
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteBlogMutation.mutate(blog._id)}
                                disabled={deleteBlogMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start sharing your thoughts and insights with your fans.
                      </p>
                      <Button
                        className="gradient-primary hover:opacity-90"
                        onClick={() => setShowCreateBlogModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Write Your First Post
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ------------------ SETTINGS ------------------ */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Artist Profile</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Update your public artist information
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        defaultValue={safeArtistProfile.bio}
                        placeholder="Tell fans about yourself..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          defaultValue={safeArtistProfile.socialLinks.instagram}
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          defaultValue={safeArtistProfile.socialLinks.youtube}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          defaultValue={safeArtistProfile.socialLinks.website}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="x">X (Twitter)</Label>
                        <Input
                          id="x"
                          defaultValue={safeArtistProfile.socialLinks.x}
                          placeholder="https://x.com/username"
                        />
                      </div>
                    </div>

                    <Button className="bg-primary hover:bg-primary/80">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monetization</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure how you earn from your content
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Subscription Tiers</p>
                        <p className="text-sm text-muted-foreground">
                          Offer exclusive content to subscribers
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Ad Revenue</p>
                        <p className="text-sm text-muted-foreground">
                          Earn from ads played before songs
                        </p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ------------------ MODALS ------------------ */}
      <Dialog open={showCreateEventModal} onOpenChange={setShowCreateEventModal}>
        <DialogContent className="max-w-lg max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Set up a new event for your fans</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <CreateEventForm
              onSubmit={(data) => createEventMutation.mutate(data)}
              onCancel={() => setShowCreateEventModal(false)}
              isLoading={createEventMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMerchModal} onOpenChange={setShowAddMerchModal}>
        <DialogContent className="max-w-lg max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Merchandise</DialogTitle>
            <DialogDescription>Add a new product to your store</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <MerchForm
              onSubmit={(data) => createMerchMutation.mutate(data)}
              onCancel={() => setShowAddMerchModal(false)}
              isLoading={createMerchMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={showEditEventModal} onOpenChange={setShowEditEventModal}>
        <DialogContent className="max-w-lg max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update your event details</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <CreateEventForm
              onSubmit={(data) => editingEvent && editEventMutation.mutate({ id: editingEvent._id, formData: data })}
              onCancel={() => {
                setShowEditEventModal(false);
                setEditingEvent(null);
              }}
              isLoading={editEventMutation.isPending}
              initialData={editingEvent}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Merch Modal */}
      <Dialog open={showEditMerchModal} onOpenChange={setShowEditMerchModal}>
        <DialogContent className="max-w-lg max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Merchandise</DialogTitle>
            <DialogDescription>Update your product details</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <MerchForm
              onSubmit={(data) => editingMerch && editMerchMutation.mutate({ id: editingMerch._id, formData: data })}
              onCancel={() => {
                setShowEditMerchModal(false);
                setEditingMerch(null);
              }}
              isLoading={editMerchMutation.isPending}
              initialData={editingMerch}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Blog Modal */}
      <Dialog open={showCreateBlogModal} onOpenChange={setShowCreateBlogModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <BlogForm
              onSubmit={(data) => createBlogMutation.mutate(data)}
              onCancel={() => setShowCreateBlogModal(false)}
              isLoading={createBlogMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Blog Modal */}
      <Dialog open={showEditBlogModal} onOpenChange={setShowEditBlogModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <BlogForm
              onSubmit={(data) => editingBlog && editBlogMutation.mutate({ id: editingBlog._id, formData: data })}
              onCancel={() => {
                setShowEditBlogModal(false);
                setEditingBlog(null);
              }}
              isLoading={editBlogMutation.isPending}
              initialData={editingBlog}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Song Modal */}
      <Dialog open={showEditSongModal} onOpenChange={setShowEditSongModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
            <DialogDescription>Update your song details</DialogDescription>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              
              if (editingSong) {
                // Only include data, no files for basic edit
                const songData = {
                  title: formData.get("title") as string,
                  genre: formData.get("genre") as string,
                  visibility: formData.get("visibility") as string,
                };
                
                const editFormData = new FormData();
                editFormData.append("data", JSON.stringify(songData));
                
                editSongMutation.mutate({ id: editingSong._id, formData: editFormData });
              }
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-title">Song Title</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={editingSong?.title}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-genre">Genre</Label>
              <Select name="genre" defaultValue={editingSong?.genre}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {MUSIC_GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select name="visibility" defaultValue={editingSong?.visibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="SUBSCRIBER_ONLY">Subscribers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditSongModal(false);
                  setEditingSong(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editSongMutation.isPending}
              >
                {editSongMutation.isPending ? "Updating..." : "Update Song"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}