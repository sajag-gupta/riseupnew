import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Upload,
  Bell,
  Shield,
  CreditCard,
  Save,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// ------------------- SCHEMAS -------------------
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  newFollowers: z.boolean(),
  newMessages: z.boolean(),
  updates: z.boolean(),
});

const privacySchema = z.object({
  showListeningActivity: z.boolean(),
  showPlaylists: z.boolean(),
  allowMessages: z.boolean(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type NotificationForm = z.infer<typeof notificationSchema>;
type PrivacyForm = z.infer<typeof privacySchema>;

// ------------------- COMPONENT -------------------
export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // ------------------- FORMS -------------------
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      location: user?.location || "",
      website: user?.socialLinks?.website || "",
    },
  });

  const notificationForm = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: user?.settings?.emailNotifications ?? true,
      pushNotifications: user?.settings?.pushNotifications ?? true,
      newFollowers: true,
      newMessages: true,
      updates: false,
    },
  });

  const privacyForm = useForm<PrivacyForm>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      showListeningActivity: user?.settings?.privacy?.showListeningActivity ?? true,
      showPlaylists: user?.settings?.privacy?.showPlaylists ?? true,
      allowMessages: user?.settings?.privacy?.allowMessages ?? true,
    },
  });

  // ------------------- AVATAR UPLOAD -------------------
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Profile picture must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (file.type.startsWith("image/")) {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        toast({
          title: "Avatar selected",
          description: `Selected: ${file.name}. Click save to update.`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        });
      }
    }
  };

  // ------------------- API: PROFILE -------------------
  const onProfileSubmit = async (data: ProfileForm) => {
  setIsLoading(true);
  try {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found.");

    const formData = new FormData();
    formData.append("name", data.name);
    if (data.bio) formData.append("bio", data.bio);
    if (data.location) formData.append("location", data.location);
    if (data.website) formData.append("website", data.website);
    if (avatarFile) formData.append("avatar", avatarFile);

    const response = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type for FormData
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update profile");
    }

    const result = await response.json();

    // ✅ Update avatar immediately
    if (result.user?.avatar) {
      setAvatarPreview(result.user.avatar);

      // If useAuth exposes a setter, update the user in global state
      if (typeof user?.setUser === "function") {
        user.setUser((prev: any) => ({
          ...prev,
          avatar: result.user.avatar,
          name: result.user.name ?? prev.name,
          bio: result.user.bio ?? prev.bio,
          location: result.user.location ?? prev.location,
          socialLinks: result.user.socialLinks ?? prev.socialLinks,
        }));
      }
    }

    toast({
      title: "Profile updated",
      description: "Your profile has been saved.",
    });

    setAvatarFile(null);
  } catch (error) {
    toast({
      title: "Error updating profile",
      description: error instanceof Error ? error.message : "Failed",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  // ------------------- API: NOTIFICATIONS -------------------
  const onNotificationSubmit = async (data: NotificationForm) => {
    setIsLoading(true);
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notifications: data }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update settings");
      }

      toast({
        title: "Notifications updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error updating notifications",
        description: error instanceof Error ? error.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- API: PRIVACY -------------------
  const onPrivacySubmit = async (data: PrivacyForm) => {
    setIsLoading(true);
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ privacy: data }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update privacy");
      }

      toast({
        title: "Privacy updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error updating privacy",
        description: error instanceof Error ? error.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- RENDER -------------------
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ruc-text-high mb-2">Settings</h1>
        <p className="text-ruc-text-med">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center space-x-2"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* ------------------- PROFILE TAB ------------------- */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your profile information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-6"
              >
                {/* Avatar Upload */}
                <div className="flex items-start space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage
                      src={avatarPreview || user?.avatar}
                      alt="Avatar"
                    />
                    <AvatarFallback className="text-lg">
                      {user?.name?.substring(0, 2).toUpperCase() || "RU"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <div className="mt-2">
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("avatar")?.click()
                        }
                        className="flex items-center space-x-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>
                          {isLoading ? "Uploading..." : "Upload new picture"}
                        </span>
                      </Button>
                    </div>
                    <p className="text-sm text-ruc-text-low mt-1">
                      JPG, PNG or GIF. Max size 5MB.{" "}
                      {avatarFile &&
                        `(${(avatarFile.size / 1024 / 1024).toFixed(2)} MB)`}
                    </p>
                    {avatarFile && (
                      <p className="text-xs text-ruc-red mt-1">
                        New avatar selected. Click "Save Changes" to apply.
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Profile Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      {...profileForm.register("name")}
                      className="bg-ruc-charcoal border-ruc-border"
                      placeholder="Your display name"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-red-500 text-sm">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      {...profileForm.register("location")}
                      placeholder="City, Country"
                      className="bg-ruc-charcoal border-ruc-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    {...profileForm.register("website")}
                    placeholder="https://yourwebsite.com"
                    className="bg-ruc-charcoal border-ruc-border"
                  />
                  {profileForm.formState.errors.website && (
                    <p className="text-red-500 text-sm">
                      {profileForm.formState.errors.website.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    {...profileForm.register("bio")}
                    placeholder="Tell us about yourself..."
                    className="bg-ruc-charcoal border-ruc-border"
                    rows={4}
                  />
                  <p className="text-sm text-ruc-text-low">
                    {profileForm.watch("bio")?.length || 0}/500 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isLoading}
                  className="bg-ruc-red hover:bg-ruc-red-dark"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------- NOTIFICATIONS TAB ------------------- */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Choose how you want to be notified about activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-ruc-text-low">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("emailNotifications")}
                      onCheckedChange={(checked) =>
                        notificationForm.setValue("emailNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-ruc-text-low">
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("pushNotifications")}
                      onCheckedChange={(checked) =>
                        notificationForm.setValue("pushNotifications", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Followers</Label>
                      <p className="text-sm text-ruc-text-low">
                        When someone follows you
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("newFollowers")}
                      onCheckedChange={(checked) =>
                        notificationForm.setValue("newFollowers", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Messages</Label>
                      <p className="text-sm text-ruc-text-low">
                        When you receive a message
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("newMessages")}
                      onCheckedChange={(checked) =>
                        notificationForm.setValue("newMessages", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Product Updates</Label>
                      <p className="text-sm text-ruc-text-low">
                        News about new features
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.watch("updates")}
                      onCheckedChange={(checked) =>
                        notificationForm.setValue("updates", checked)
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-ruc-red hover:bg-ruc-red-dark"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------- PRIVACY TAB ------------------- */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control what information is visible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={privacyForm.handleSubmit(onPrivacySubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Listening Activity</Label>
                      <p className="text-sm text-ruc-text-low">
                        Let others see what you're listening to
                      </p>
                    </div>
                    <Switch
                      checked={privacyForm.watch("showListeningActivity")}
                      onCheckedChange={(checked) =>
                        privacyForm.setValue("showListeningActivity", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Playlists</Label>
                      <p className="text-sm text-ruc-text-low">
                        Make your playlists visible
                      </p>
                    </div>
                    <Switch
                      checked={privacyForm.watch("showPlaylists")}
                      onCheckedChange={(checked) =>
                        privacyForm.setValue("showPlaylists", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Messages</Label>
                      <p className="text-sm text-ruc-text-low">
                        Let other users send you messages
                      </p>
                    </div>
                    <Switch
                      checked={privacyForm.watch("allowMessages")}
                      onCheckedChange={(checked) =>
                        privacyForm.setValue("allowMessages", checked)
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-ruc-red hover:bg-ruc-red-dark"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------- BILLING TAB ------------------- */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-ruc-text-low mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-ruc-text-med mb-2">
                  Billing Coming Soon
                </h3>
                <p className="text-ruc-text-low">
                  Subscription and billing management features are currently
                  under development.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
