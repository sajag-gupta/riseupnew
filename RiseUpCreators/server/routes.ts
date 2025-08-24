// routes.ts
import type { Express } from "express";
import { storage } from "./storage";
import { authService } from "./auth";
import {
  authenticateToken,
  requireRole,
  optionalAuth,
} from "./middleware/auth";
import { rateLimiter, errorHandler } from "./middleware";
import { validateBody } from "./middleware/validation";
import {
  insertPlaylistSchema,
  insertAlbumSchema,
  insertEventSchema,
  insertProductSchema,
  insertBlogSchema,
  InsertBlogComment,
} from "@shared/schema";
import { cloudinaryService } from "./services/cloudinary";
import { emailService } from "./services/email";
import { analyticsService } from "./services/analytics";
import { z } from "zod";
import multer from "multer";
import { User, Artist, Song, Event, Follow } from "@shared/schema";


// ------------------------ Config ------------------------
const isProd = process.env.NODE_ENV === "production";
const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "token";
const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  path: "/",
};

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// ------------------------ Validation Schemas ------------------------
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["fan", "artist"]).optional(),
});

const searchSchema = z.object({
  q: z.string().min(1),
  type: z.enum(["all", "songs", "artists", "albums", "playlists", "events", "products", "blogs"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

// ------------------------ ROUTES ------------------------

export function setupRoutes(app: Express): void {

  // ------------------------ Rate limiting ------------------------
  if (isProd) {
    const skipPaths = new Set<string>(["/api/auth/me", "/me"]);
    app.use("/api/auth", (req, res, next) => {
      const p = req.originalUrl || req.url;
      if (skipPaths.has(p)) return next();
      return rateLimiter(15 * 60 * 1000, 50)(req, res, next);
    });
    app.use("/api", (req, res, next) => {
      const p = req.originalUrl || req.url;
      if (skipPaths.has(p)) return next();
      return rateLimiter(60 * 1000, 300)(req, res, next);
    });
  }

  // ============================================================================
  // AUTHROUTES
  // ============================================================================
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const { email, password, name, role = "fan" } = validation.data;
      const { user, token } = await authService.register(email, password, name, role);

      try {
        await emailService.sendWelcomeEmail(user.email, user.name, user.role);
        await analyticsService.trackSignup(user.role, user.id);
      } catch (err) {
        console.warn("Email/Analytics service failed:", err);
      }

      res.cookie(JWT_COOKIE_NAME, token, cookieOpts);
      res.status(201).json({ user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const { email, password } = validation.data;
      const { user, token } = await authService.login(email, password);

      try {
        await analyticsService.trackLogin(user.id, "/login");
      } catch (err) {
        console.warn("Analytics tracking failed:", err);
      }

      res.cookie(JWT_COOKIE_NAME, token, cookieOpts);
      res.json({ user, token });
    } catch (error: any) {
      res.status(401).json({ message: error.message || "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", optionalAuth, (req: any, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id, email, role, name, status, isVerified, lastActive } = req.user;
    res.json({ id, email, role, name, status, isVerified, lastActive });
  });

  app.get("/me", optionalAuth, (req: any, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id, email, role, name, status, isVerified, lastActive } = req.user;
    res.json({ id, email, role, name, status, isVerified, lastActive });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(JWT_COOKIE_NAME, { ...cookieOpts, maxAge: 0 });
    res.status(204).end();
  });

  // ============================================================================
  // ARTIST ROUTES
  // ============================================================================
  app.get("/api/artists/:id", optionalAuth, async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.params.id);
      if (!artist) {
        // Try finding by artist ID directly
        const artistById = await storage.getArtist(req.params.id);
        if (!artistById) {
          return res.status(404).json({ message: "Artist not found" });
        }
        
        if (req.user) {
          await analyticsService.trackEventGeneric(
            "view_artist",
            "artist",
            { artistId: artistById._id },
            req.user.id
          );
        }
        
        return res.json(artistById);
      }

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "view_artist",
          "artist", 
          { artistId: artist._id },
          req.user.id
        );
      }

      res.json(artist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ARTISTS LIST ROUTE
  // ============================================================================
  app.get("/api/artists", optionalAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const featured = req.query.featured === "true";
      
      let artists;
      if (featured) {
        artists = await storage.getFeaturedArtists(limit);
      } else {
        artists = await storage.searchArtists("", limit);
      }
      
      res.json(artists);
    } catch (error: any) {
      console.error("Error fetching artists:", error);
      res.status(500).json({ message: "Failed to fetch artists", error: error.message });
    }
  });

  // ============================================================================
  // USER ROUTES
  // ============================================================================
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const artist =
        user.role === "artist"
          ? await storage.getArtistByUserId(user.id)
          : null;
      res.json({ ...user, artist });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/settings", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        profile: {
          name: user.name,
          bio: user.bio || "",
          location: user.location || "",
          dateOfBirth: user.dateOfBirth
            ? user.dateOfBirth.toISOString().split("T")[0]
            : "",
          genres: user.genres || [],
          socialLinks: user.socialLinks || {
            instagram: "",
            twitter: "",
            youtube: "",
            spotify: "",
            website: "",
          },
        },
        privacy: user.settings?.privacy || {
          showListeningActivity: true,
          showPlaylists: true,
          allowMessages: true,
        },
        notifications: {
          emailNotifications: user.settings?.emailNotifications ?? true,
          pushNotifications: user.settings?.pushNotifications ?? true,
        },
        adPreferences: user.settings?.adPreferences || {
          personalizedAds: true,
          frequency: "normal",
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user/settings", authenticateToken, async (req: any, res) => {
    try {
      const { privacy, notifications, adPreferences } = req.body;
      const updates: any = {};
      if (privacy) updates["settings.privacy"] = privacy;
      if (notifications) {
        if (notifications.emailNotifications !== undefined) {
          updates["settings.emailNotifications"] =
            notifications.emailNotifications;
        }
        if (notifications.pushNotifications !== undefined) {
          updates["settings.pushNotifications"] =
            notifications.pushNotifications;
        }
      }
      if (adPreferences) updates["settings.adPreferences"] = adPreferences;
      await storage.updateUser(req.user.id, updates);
      res.json({ message: "Settings updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user/profile", authenticateToken, upload.single("avatar"), async (req: any, res) => {
    try {
      const updates: any = {};

      // Collect text fields from form-data
      if (req.body.name) updates.name = req.body.name;
      if (req.body.bio) updates.bio = req.body.bio;
      if (req.body.location) updates.location = req.body.location;
      if (req.body.website) updates["socialLinks.website"] = req.body.website;

      // Handle avatar upload
      if (req.file) {
        const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const uploadResult = await cloudinaryService.uploadImage(req.file.buffer, req.file.mimetype, {
          folder: "avatars",
          public_id: `avatar_${req.user.id}`,
          transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
        });

        updates.avatar = uploadResult.secure_url;
      }

      // Update DB
      const updatedUser = await storage.updateUser(req.user.id, updates);
      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/profile", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const artist =
        user.role === "artist"
          ? await storage.getArtistByUserId(user.id)
          : null;
      res.json({ user, artist });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/profile", authenticateToken, async (req: any, res) => {
    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch(
    "/api/users/notifications/:id/read",
    authenticateToken,
    async (req: any, res) => {
      try {
        await storage.markNotificationAsRead(req.params.id);
        res.json({ message: "Notification marked as read" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // ============================================================================
  // SONG ROUTES (Songs + Likes + Follows Integrated)
  // ============================================================================
  
  // ---------------- RECENT SONGS ----------------
  app.get("/api/songs/recent", optionalAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const songs = await storage.getSongs({
        visibility: "public",
        limit,
        sortBy: "createdAt",
        sortOrder: "desc"
      });
      res.json(songs);
    } catch (error: any) {
      console.error("Error fetching recent songs:", error);
      res.status(500).json({ message: "Failed to fetch recent songs", error: error.message });
    }
  });

  // ---------------- RECOMMENDED SONGS ----------------
  app.get("/api/songs/recommended", authenticateToken, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      // For now, return random songs - can implement ML recommendations later
      const songs = await storage.getSongs({
        visibility: "public",
        limit: limit * 2 // Get more to randomize
      });
      
      // Simple shuffle for recommendations
      const shuffled = songs.sort(() => 0.5 - Math.random()).slice(0, limit);
      res.json(shuffled);
    } catch (error: any) {
      console.error("Error fetching recommended songs:", error);
      res.status(500).json({ message: "Failed to fetch recommended songs", error: error.message });
    }
  });

  // ---------------- USER FOLLOWING ----------------
  app.get("/api/users/following", authenticateToken, async (req: any, res) => {
    try {
      const followedArtists = await storage.getFollowedArtists(req.user.id);
      res.json(followedArtists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  // ---------------- UPLOAD SONG ----------------
app.post(
  "/api/songs/upload",
  authenticateToken,
  upload.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "artworkFile", maxCount: 1 },
  ]),
  async (req: any, res) => {
    try {
      // Only artists can upload
      if (req.user.role !== "artist") {
        return res.status(403).json({ message: "Only artists can upload music" });
      }

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) {
        return res.status(404).json({ message: "Artist profile not found" });
      }

      // Extract files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const audioFile = files?.audioFile?.[0];
      const artworkFile = files?.artworkFile?.[0];

      if (!audioFile) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      // Validate audio file type
      if (!audioFile.mimetype.startsWith("audio/")) {
        return res.status(400).json({ message: "Invalid audio file type" });
      }

      if (!req.body.songData) {
        return res.status(400).json({ message: "Song metadata is required" });
      }

      let songData;
      try {
        songData = JSON.parse(req.body.songData);
      } catch {
        return res.status(400).json({ message: "Invalid songData JSON" });
      }

      // Validate required fields
      if (!songData.title) {
        return res.status(400).json({ message: "Song title is required" });
      }

      // ---------------- Upload Audio ----------------
      console.log("Starting audio upload to Cloudinary...");
      let audioUpload;
      try {
        audioUpload = await cloudinaryService.uploadAudio(
          audioFile.buffer,
          audioFile.mimetype,
          {
            folder: "ruc/music",
            public_id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          }
        );
        console.log("Audio upload successful:", audioUpload.public_id);
      } catch (err: any) {
        console.error("Cloudinary audio upload error:", {
          message: err.message,
          stack: err.stack,
          cloudinaryError: err.error || err.response?.data,
          fileInfo: {
            size: audioFile.size,
            mimetype: audioFile.mimetype,
            originalname: audioFile.originalname
          }
        });
        return res.status(500).json({
          message: "Failed to upload audio to Cloudinary",
          error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
        });
      }

      // ---------------- Upload Artwork ----------------
      let artworkUpload = null;
      if (artworkFile) {
        // Validate artwork file type
        if (!artworkFile.mimetype.startsWith("image/")) {
          return res.status(400).json({ message: "Invalid artwork file type" });
        }

        try {
          console.log("Starting artwork upload to Cloudinary...");
          artworkUpload = await cloudinaryService.uploadArtwork(
            artworkFile.buffer,
            artworkFile.mimetype,
            {
              folder: "ruc/artwork",
              public_id: `artwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            }
          );
          console.log("Artwork upload successful:", artworkUpload.public_id);
        } catch (err: any) {
          console.error("Cloudinary artwork upload error:", err);
          // Don't fail the entire upload if artwork fails
          console.warn("Artwork upload failed, continuing without artwork");
        }
      }

      // ---------------- Create Song in DB ----------------
      const duration = audioUpload.duration || songData.duration || 180; // Default to 3 minutes if not available

      const newSong = await storage.createSong({
        title: songData.title,
        artistId: artist._id,
        genre: songData.genre || "Unknown",
        subGenres: songData.subGenres || [],
        duration: duration,
        releaseDate: songData.releaseDate ? new Date(songData.releaseDate) : new Date(),
        files: {
          audioUrl: audioUpload.secure_url,
          audioFileId: audioUpload.public_id,
          artworkUrl: artworkUpload?.secure_url,
          artworkFileId: artworkUpload?.public_id,
          waveformData: audioUpload.waveform || [],
        },
        metadata: songData.metadata || {},
        visibility: songData.visibility || "public",
        monetization: songData.monetization || {
          isMonetized: false,
          adEnabled: true,
        },
      });

      console.log("Song created successfully:", newSong._id);
      return res.status(201).json(newSong);
    } catch (error: any) {
      console.error("Song upload error:", {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        files: req.files ? Object.keys(req.files) : "no files"
      });
      return res.status(500).json({
        message: "Unexpected error during song upload",
        error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      });
    }
  }
);


  // ---------------- ARTIST MUSIC DASHBOARD ----------------
  app.get("/api/artists/my-music", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== "artist") {
        return res.status(403).json({ message: "Artist access required" });
      }
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(404).json({ message: "Artist profile not found" });

      const songs = await storage.getSongsByArtist(artist._id);

      // Aggregated stats via analytics
      const totalPlays = (await analyticsService.getPopularContent("songs"))
        .filter((s) => songs.find((song) => song._id.toString() === s.id))
        .reduce((sum, s) => sum + s.count, 0);

      const totalLikes = (await analyticsService.getUserEngagement(req.user.id))
        .likeCount;

      const stats = {
        totalSongs: songs.length,
        totalPlays,
        totalLikes,
        monthlyListeners: artist.stats?.monthlyListeners || 0,
      };

      res.json({ songs, stats });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------- FETCH SONGS ----------------
  app.get("/api/songs", optionalAuth, async (req: any, res) => {
    try {
      await analyticsService.trackEventGeneric("page_view", req.user?.id, {
        page: "songs_browse",
      });

      const { genre, limit = "20", trending } = req.query;
      const filter: any = { visibility: "public" };

      if (genre && genre !== "all") {
        filter.genre = genre;
      }

      let songs;
      try {
        if (trending === "true") {
          songs = await storage.getSongs({
            ...filter,
            limit: parseInt(limit as string),
            sortBy: "createdAt",
            sortOrder: "desc"
          });
        } else {
          songs = await storage.getSongs({
            ...filter,
            limit: parseInt(limit as string),
            sortBy: "createdAt", 
            sortOrder: "desc"
          });
        }
      } catch (error: any) {
        console.error("Error fetching songs:", error);
        // Fallback to basic song fetch if advanced options fail
        songs = await storage.searchSongs("", parseInt(limit as string));
      }

      if (trending === "true") {
        // Sort by a combination of play count and recency for trending
        songs = songs.sort((a, b) => {
          const aScore = (a.analytics?.playCount || 0) + (a.analytics?.likeCount || 0) * 2;
          const bScore = (b.analytics?.playCount || 0) + (b.analytics?.likeCount || 0) * 2;
          return bScore - aScore;
        });
      }

      res.json(songs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------- FETCH SINGLE SONG ----------------
  app.get("/api/songs/:id", optionalAuth, async (req: any, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) return res.status(404).json({ message: "Song not found" });

      const isLiked = req.user
        ? await storage.isLiked(req.user.id, req.params.id)
        : false;

      res.json({ song, isLiked });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------- UPDATE SONG ----------------
  app.put("/api/songs/:id", authenticateToken, async (req: any, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) return res.status(404).json({ message: "Song not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || song.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedSong = await storage.updateSong(req.params.id, req.body);
      res.json(updatedSong);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------- DELETE SONG ----------------
  app.delete("/api/songs/:id", authenticateToken, async (req: any, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) return res.status(404).json({ message: "Song not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || song.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (song.files?.audioFileId) await cloudinaryService.deleteAudio(song.files.audioFileId);
      if (song.files?.artworkFileId) await cloudinaryService.deleteArtwork(song.files.artworkFileId);

      await storage.deleteSong(req.params.id);
      res.json({ message: "Song deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------- LIKE SONG ----------------
  app.post("/api/songs/:id/like", authenticateToken, async (req: any, res) => {
    try {
      await storage.likeSong(req.user.id, req.params.id);
      await analyticsService.trackLike(req.params.id, req.user.id);
      res.json({ liked: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/songs/:id/like", authenticateToken, async (req: any, res) => {
    try {
      await storage.unlikeSong(req.user.id, req.params.id);
      res.json({ liked: false });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------- FOLLOW ARTIST ----------------
  app.post("/api/artists/:id/follow", authenticateToken, async (req: any, res) => {
    try {
      await storage.followArtist(req.user.id, req.params.id);
      await analyticsService.trackFollow(req.params.id, req.user.id);
      res.json({ following: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/artists/:id/follow", authenticateToken, async (req: any, res) => {
    try {
      await storage.unfollowArtist(req.user.id, req.params.id);
      res.json({ following: false });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PLAYLIST ROUTES
  // ============================================================================
  app.get("/api/playlists/me", authenticateToken, async (req: any, res) => {
    try {
      const playlists = await storage.getPlaylistsByUser(req.user.id);
      res.json(playlists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(
    "/api/playlists",
    authenticateToken,
    validateBody(insertPlaylistSchema),
    async (req: any, res) => {
      try {
        const playlist = await storage.createPlaylist({
          ...req.body,
          ownerId: req.user.id,
        });
        res.json(playlist);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get("/api/playlists/:id", optionalAuth, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) return res.status(404).json({ message: "Playlist not found" });

      if (!playlist.isPublic && (!req.user || playlist.ownerId.toString() !== req.user.id.toString())) {
        return res.status(403).json({ message: "Access denied" });
      }

      // track view if authenticated
      if (req.user) {
        await analyticsService.trackEventGeneric(
          "view_playlist",
          "playlist",
          { playlistId: playlist._id },
          req.user.id
        );
      }

      res.json(playlist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/playlists/:id", authenticateToken, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) return res.status(404).json({ message: "Playlist not found" });
      if (playlist.ownerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updatePlaylist(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/playlists/:id", authenticateToken, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) return res.status(404).json({ message: "Playlist not found" });
      if (playlist.ownerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deletePlaylist(req.params.id);
      res.json({ message: "Playlist deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ALBUM ROUTES
  // ============================================================================
  app.get("/api/albums/:id", optionalAuth, async (req: any, res) => {
    try {
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ message: "Album not found" });

      // track view if user logged in
      if (req.user) {
        await analyticsService.trackEventGeneric(
          "view_album",
          "album",
          { albumId: album._id },
          req.user.id
        );
      }

      res.json(album);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/artists/:id/albums", optionalAuth, async (req: any, res) => {
    try {
      const albums = await storage.getAlbumsByArtist(req.params.id);

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "browse_albums",
          "album",
          { artistId: req.params.id },
          req.user.id
        );
      }

      res.json(albums);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/albums", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(400).json({ message: "Artist profile not found" });

      const album = await storage.createAlbum({ ...req.body, artistId: artist._id });

      await analyticsService.trackEventGeneric(
        "create_album",
        "album",
        { albumId: album._id },
        req.user.id
      );

      res.json(album);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/albums/:id", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ message: "Album not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || album.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateAlbum(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/albums/:id", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ message: "Album not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || album.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteAlbum(req.params.id);

      await analyticsService.trackEventGeneric(
        "delete_album",
        "album",
        { albumId: req.params.id },
        req.user.id
      );

      res.json({ message: "Album deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // ============================================================================
  // EVENT ROUTES
  // ============================================================================
  app.get("/api/events", optionalAuth, async (req: any, res) => {
    try {
      const upcoming = String(req.query.upcoming || "false") === "true";
      const artistId = req.query.artistId as string | undefined;
      const limit = Number(req.query.limit ?? 20);

      let events;
      if (upcoming) events = await storage.getUpcomingEvents(limit);
      else if (artistId) events = await storage.getEventsByArtist(artistId);
      else events = await storage.getUpcomingEvents(limit);

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "browse_events",
          "event",
          { upcoming, artistId },
          req.user.id
        );
      }

      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/:id", optionalAuth, async (req: any, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "view_event",
          "event",
          { eventId: event._id },
          req.user.id
        );
      }

      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/events", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(400).json({ message: "Artist profile not found" });

      const event = await storage.createEvent({ ...req.body, artistId: artist._id });

      await analyticsService.trackEventGeneric(
        "create_event",
        "event",
        { eventId: event._id },
        req.user.id
      );

      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/events/:id", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || event.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateEvent(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/events/:id", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || event.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteEvent(req.params.id);

      await analyticsService.trackEventGeneric(
        "delete_event",
        "event",
        { eventId: req.params.id },
        req.user.id
      );

      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PRODUCT ROUTES
  // ============================================================================
  app.get("/api/products", optionalAuth, async (req: any, res) => {
    try {
      const artistId = req.query.artistId as string | undefined;
      const limit = Number(req.query.limit ?? 20);

      const products = artistId
        ? await storage.getProductsByArtist(artistId)
        : await storage.searchProducts("", limit);

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "browse_products",
          "product",
          { artistId },
          req.user.id
        );
      }

      res.json(products.slice(0, limit));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", optionalAuth, async (req: any, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "view_product",
          "product",
          { productId: product._id },
          req.user.id
        );
      }

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(
  "/api/products",
  authenticateToken,
  requireRole(["artist"]),
  upload.array("images", 5),
  async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(400).json({ message: "Artist profile not found" });

      const files = (req.files as Express.Multer.File[]) || [];
      const images: string[] = [];

      for (const file of files) {
        const upload = await cloudinaryService.uploadImage(
          file.buffer,
          file.mimetype,
          { folder: "ruc/products" }
        );
        images.push(upload.secure_url);
      }

      const product = await storage.createProduct({
        ...req.body,
        artistId: artist._id,
        images,
        mainImage: images[0] || null,
      });

      await analyticsService.trackEventGeneric(
        "create_product",
        "product",
        { productId: product._id },
        req.user.id
      );

      res.json(product);
    } catch (error: any) {
      console.error("Product upload error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

  app.put("/api/products/:id", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || product.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateProduct(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist || product.artistId.toString() !== artist._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteProduct(req.params.id);

      await analyticsService.trackEventGeneric(
        "delete_product",
        "product",
        { productId: req.params.id },
        req.user.id
      );

      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // ============================================================================
  // ORDER ROUTES
  // ============================================================================
  app.post("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      const order = await storage.createOrder({
        ...req.body,
        buyerId: req.user.id,
        orderNumber: `RUC-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
      });

      // send confirmation + analytics
      if (req.user.email) {
        await emailService.sendOrderConfirmationEmail(req.user.email, order);
      }

      await analyticsService.trackPurchase(
        order._id.toString(),
        order.totals?.total ?? 0,
        req.user.id
      );

      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/me", authenticateToken, async (req: any, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user.id);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.buyerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.buyerId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateOrder(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // SUBSCRIPTION ROUTES
  // ============================================================================
  app.get("/api/subscriptions/me", authenticateToken, async (req: any, res) => {
    try {
      const subscriptions = await storage.getSubscriptionsByFan(req.user.id);
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscriptions", authenticateToken, async (req: any, res) => {
    try {
      const subscription = await storage.createSubscription({
        ...req.body,
        fanId: req.user.id,
      });

      await analyticsService.trackSubscribe(
        subscription.artistId.toString(),
        subscription.tier?.name ?? "default",
        req.user.id
      );

      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/subscriptions/:id", authenticateToken, async (req: any, res) => {
    try {
      const sub = await storage.updateSubscription(req.params.id, req.body);
      if (!sub) return res.status(404).json({ message: "Subscription not found" });
      res.json(sub);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/subscriptions/:id", authenticateToken, async (req: any, res) => {
    try {
      await storage.cancelSubscription(req.params.id);

      await analyticsService.trackEventGeneric(
        "cancel_subscription",
        "subscription",
        { subscriptionId: req.params.id },
        req.user.id
      );

      res.json({ message: "Subscription cancelled successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // BLOG ROUTES
  // ============================================================================
  app.get("/api/blogs", optionalAuth, async (req: any, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const limit = Number(req.query.limit ?? 20);

      let blogs;
      if (authorId) blogs = await storage.getBlogsByAuthor(authorId);
      else blogs = await storage.getPublishedBlogs(limit);

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "browse_blogs",
          "blog",
          { authorId },
          req.user.id
        );
      }

      res.json(blogs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/blogs/:id", optionalAuth, async (req: any, res) => {
    try {
      const blog = await storage.getBlog(req.params.id);
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      if (req.user) {
        await analyticsService.trackEventGeneric(
          "view_blog",
          "blog",
          { blogId: blog._id },
          req.user.id
        );
      }

      res.json(blog);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/blogs", authenticateToken, async (req: any, res) => {
    try {
      const blog = await storage.createBlog({ ...req.body, authorId: req.user.id });

      await analyticsService.trackEventGeneric(
        "create_blog",
        "blog",
        { blogId: blog._id },
        req.user.id
      );

      res.json(blog);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/blogs/:id", authenticateToken, async (req: any, res) => {
    try {
      const blog = await storage.getBlog(req.params.id);
      if (!blog) return res.status(404).json({ message: "Blog not found" });
      if (blog.authorId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateBlog(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/blogs/:id", authenticateToken, async (req: any, res) => {
    try {
      const blog = await storage.getBlog(req.params.id);
      if (!blog) return res.status(404).json({ message: "Blog not found" });
      if (blog.authorId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteBlog(req.params.id);

      await analyticsService.trackEventGeneric(
        "delete_blog",
        "blog",
        { blogId: req.params.id },
        req.user.id
      );

      res.json({ message: "Blog deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // BLOG COMMENT ROUTES
  // ============================================================================
  app.get("/api/blogs/:id/comments", optionalAuth, async (req: any, res) => {
    try {
      const comments = await storage.getBlogCommentsByBlog(req.params.id);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/blogs/:id/comments", authenticateToken, async (req: any, res) => {
    try {
      const comment = await storage.createBlogComment({
        ...req.body,
        blogId: req.params.id,
        authorId: req.user.id,
      });

      await analyticsService.trackEventGeneric("create_comment", "blog", {
        blogId: req.params.id,
        commentId: comment._id,
      }, req.user.id);

      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/comments/:id", authenticateToken, async (req: any, res) => {
    try {
      const comment = await storage.getBlogComment(req.params.id);
      if (!comment) return res.status(404).json({ message: "Comment not found" });
      if (comment.authorId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateBlogComment(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/comments/:id", authenticateToken, async (req: any, res) => {
    try {
      const comment = await storage.getBlogComment(req.params.id);
      if (!comment) return res.status(404).json({ message: "Comment not found" });
      if (comment.authorId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteBlogComment(req.params.id);

      await analyticsService.trackEventGeneric("delete_comment", "blog", {
        commentId: req.params.id,
      }, req.user.id);

      res.json({ message: "Comment deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // REPORT ROUTES
  // ============================================================================
  app.get("/api/reports", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const reports = await storage.getReports(status);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/:id", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) return res.status(404).json({ message: "Report not found" });
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reports", authenticateToken, async (req: any, res) => {
    try {
      const report = await storage.createReport({
        ...req.body,
        reporterId: req.user.id,
      });

      await analyticsService.trackEventGeneric("create_report", "report", {
        reportId: report._id,
      }, req.user.id);

      res.json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/reports/:id", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const updated = await storage.updateReport(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Report not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ADROUTES
  // ============================================================================
  app.get("/api/ads", optionalAuth, async (_req: any, res) => {
    try {
      const ads = await storage.getActiveAds();
      res.json(ads);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/ads/:id", optionalAuth, async (req: any, res) => {
    try {
      const ad = await storage.getAd(req.params.id);
      if (!ad) return res.status(404).json({ message: "Ad not found" });
      res.json(ad);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ads", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const ad = await storage.createAd(req.body);
      res.json(ad);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/ads/:id", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const updated = await storage.updateAd(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Ad not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/ads/:id", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      await storage.deleteAd(req.params.id);
      res.json({ message: "Ad deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // FOLLOWROUTES
  // ============================================================================
  app.get("/api/users/:id/following", authenticateToken, async (req: any, res) => {
    try {
      const artists = await storage.getFollowedArtists(req.params.id);
      res.json(artists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/artists/:id/follow", authenticateToken, async (req: any, res) => {
    try {
      await storage.followArtist(req.user.id, req.params.id);
      await analyticsService.trackFollow(req.params.id, req.user.id);
      res.json({ message: "Artist followed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/artists/:id/follow", authenticateToken, async (req: any, res) => {
    try {
      await storage.unfollowArtist(req.user.id, req.params.id);

      await analyticsService.trackEventGeneric("unfollow", "social", {
        artistId: req.params.id,
      }, req.user.id);

      res.json({ message: "Artist unfollowed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // LIKE ROUTES
  // ============================================================================
  app.get("/api/users/:id/likes", authenticateToken, async (req: any, res) => {
    try {
      const songs = await storage.getLikedSongs(req.params.id);
      res.json(songs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/songs/:id/like", authenticateToken, async (req: any, res) => {
    try {
      await storage.likeSong(req.user.id, req.params.id);
      await analyticsService.trackLike(req.params.id, req.user.id);
      res.json({ message: "Song liked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/songs/:id/like", authenticateToken, async (req: any, res) => {
    try {
      await storage.unlikeSong(req.user.id, req.params.id);

      await analyticsService.trackEventGeneric("unlike", "engagement", {
        songId: req.params.id,
      }, req.user.id);

      res.json({ message: "Song unliked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================
  app.post("/api/analytics", optionalAuth, async (req: any, res) => {
    try {
      const record = await storage.trackEvent({
        ...req.body,
        userId: req.user?.id,
        timestamp: new Date(),
      });
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const { userId, eventType, startDate, endDate } = req.query;
      const filters: any = {};
      if (userId) filters.userId = userId;
      if (eventType) filters.eventType = eventType;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const records = await storage.getAnalytics(filters);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DISCOVER ROUTES
  // ============================================================================
  app.get("/api/discover/trending", optionalAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const songs = await storage.getSongs({
        visibility: "public",
        limit,
        sortBy: "createdAt",
        sortOrder: "desc"
      });
      
      // Sort by engagement for trending
      const trending = songs.sort((a, b) => {
        const aScore = (a.analytics?.playCount || 0) + (a.analytics?.likeCount || 0) * 3;
        const bScore = (b.analytics?.playCount || 0) + (b.analytics?.likeCount || 0) * 3;
        return bScore - aScore;
      });
      
      res.json(trending);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/genres", async (req: any, res) => {
    try {
      const genres = [
        "Hip Hop", "R&B", "Pop", "Rock", "Electronic", "Jazz", "Country", 
        "Reggae", "Alternative", "Indie", "Soul", "Funk", "Gospel", "Blues"
      ];
      res.json(genres);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/artists/featured", optionalAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const artists = await storage.searchArtists("", limit * 2);
      
      // Simple shuffle for featured artists
      const featured = artists.sort(() => 0.5 - Math.random()).slice(0, limit);
      res.json(featured);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ANALYTICS DASHBOARD ROUTES
  // ============================================================================
  app.get("/api/analytics/dashboard", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(404).json({ message: "Artist profile not found" });

      const songs = await storage.getSongsByArtist(artist._id);
      const totalPlays = songs.reduce((sum, song) => sum + (song.analytics?.playCount || 0), 0);
      const totalLikes = songs.reduce((sum, song) => sum + (song.analytics?.likeCount || 0), 0);
      
      const analytics = {
        totalSongs: songs.length,
        totalPlays,
        totalLikes,
        monthlyListeners: artist.stats?.monthlyListeners || 0,
        recentActivity: songs.slice(0, 5).map(song => ({
          songId: song._id,
          title: song.title,
          plays: song.analytics?.playCount || 0,
          likes: song.analytics?.likeCount || 0
        }))
      };
      
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics/revenue", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      // Mock revenue data for now
      const revenue = {
        thisMonth: 0,
        lastMonth: 0,
        total: 0,
        breakdown: {
          streaming: 0,
          merchandise: 0,
          subscriptions: 0,
          tips: 0
        }
      };
      res.json(revenue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/songs/my-music", authenticateToken, requireRole(["artist"]), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(404).json({ message: "Artist profile not found" });

      const songs = await storage.getSongsByArtist(artist._id);
      
      // Return in the format expected by frontend
      const stats = {
        totalSongs: songs.length,
        totalPlays: songs.reduce((sum, song) => sum + (song.analytics?.playCount || 0), 0),
        totalLikes: songs.reduce((sum, song) => sum + (song.analytics?.likeCount || 0), 0),
        monthlyListeners: artist.stats?.monthlyListeners || 0,
      };
      
      res.json({ songs, stats });
    } catch (error: any) {
      console.error("Error fetching artist music:", error);
      res.status(500).json({ message: "Failed to fetch your music", error: error.message });
    }
  });

  // ============================================================================
  // SEARCHROUTES
  // ============================================================================
  app.get("/api/search", optionalAuth, async (req: any, res) => {
    try {
      const validation = searchSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }

      const { q, type = "all", limit = 20 } = validation.data;

      if (req.user) {
        await analyticsService.trackSearch(q, 0, req.user.id);
      }

      const results: any = {};
      if (type === "all" || type === "songs") results.songs = await storage.searchSongs(q, limit);
      if (type === "all" || type === "artists") results.artists = await storage.searchArtists(q, limit);
      if (type === "all" || type === "events") results.events = await storage.searchEvents(q, limit);
      if (type === "all" || type === "products") results.products = await storage.searchProducts(q, limit);

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // FINAL ERROR HANDLER
  // ============================================================================
  app.use(errorHandler);
}