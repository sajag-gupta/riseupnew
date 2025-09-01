import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { storage } from "./storage";
import { authenticateToken, requireRole, AuthRequest } from "./middleware/auth";
import { uploadAudio, uploadImage } from "./services/cloudinary";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmation,
  sendTicketEmail,
  sendArtistVerificationEmail,
} from "./services/email";
import AnalyticsService from "./services/analytics";
import {
  createOrder,
  verifyPayment,
  generateQRCode,
} from "./services/razorpay";
import {
  insertUserSchema,
  insertSongSchema,
  insertMerchSchema,
  insertEventSchema,
  insertOrderSchema,
} from "@shared/schema";


// Extend session type for cart
declare module "express-session" {
  interface SessionData {
    cart?: {
      items: Array<{
        _id: string;
        type: "merch" | "event";
        id: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
      }>;
      summary: {
        subtotal: number;
        discount: number;
        tax: number;
        total: number;
      };
    };
  }
}

// Multer configuration for file uploads (storing files in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware: Session configuration for storing user sessions
export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage connection
  await storage.connect();

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-here",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);

      // Update user with embedded artist data if role is artist
      if (user.role === "artist") {
        await storage.updateUser(user._id, {
          artist: {
            bio: "",
            socialLinks: {},
            followers: [],
            totalPlays: 0,
            totalLikes: 0,
            revenue: { subscriptions: 0, merch: 0, events: 0, ads: 0 },
            trendingScore: 0,
            featured: false,
            verified: false,
          }
        });
      }

      // Send welcome email (non-blocking)
      sendWelcomeEmail(user.email, user.name, user.role).catch((error) => {
        console.warn("Failed to send welcome email:", error.message);
      });

      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role, name: user.name },
        process.env.SESSION_SECRET || "your-secret-key-here",
        { expiresIn: "24h" },
      );

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user._id, { lastLogin: new Date() });

      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role, name: user.name },
        process.env.SESSION_SECRET || "your-secret-key-here",
        { expiresIn: "24h" },
      );

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate reset token (6-digit code)
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

      // In production, store this token with expiration in the database
      sendPasswordResetEmail(user.email, resetToken).catch((error) => {
        console.warn("Failed to send password reset email:", error.message);
      });

      res.json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get(
    "/api/users/me/following-content",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get content from followed artists
        const followedArtists = await Promise.all(
          user.following.map((artistId) => storage.getArtistByUserId(artistId)),
        );

        const validArtists = followedArtists.filter(
          (artist) => artist !== undefined,
        );
        res.json(validArtists);
      } catch (error) {
        console.error("Get following content error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get("/api/users/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        favorites: user.favorites,
        following: user.following,
        avatarUrl: user.avatarUrl,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/users/me/recent-plays",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const recentSongs = await storage.getRecentPlaysByUser(req.user!.id);
        res.json(recentSongs);
      } catch (error) {
        console.error("Get recent plays error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/users/me",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const updates = req.body;
        const user = await storage.updateUser(req.user!.id, updates);
        res.json(user);
      } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/users/follow/:artistId",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { artistId } = req.params;
        const user = await storage.getUser(req.user!.id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const isCurrentlyFollowing = user.following.includes(artistId);
        const following = isCurrentlyFollowing
          ? user.following.filter((id) => id !== artistId)
          : [...user.following, artistId];

        // Update user's following list
        await storage.updateUser(req.user!.id, { following });

        // Update artist's followers list (bidirectional sync)
        const artist = await storage.getArtistByUserId(artistId);
        if (artist && artist.artist) {
          const followers = isCurrentlyFollowing
            ? artist.artist.followers.filter((id) => id !== req.user!.id)
            : [...artist.artist.followers, req.user!.id];

          await storage.updateUser(artistId, {
            artist: { ...artist.artist, followers }
          });
        }

        // Use analytics service to track follow/unfollow
        await AnalyticsService.trackArtistFollow(req.user!.id, artistId, !isCurrentlyFollowing, "profile");

        res.json({ following: !isCurrentlyFollowing });
      } catch (error) {
        console.error("Follow error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Artist routes
  app.get("/api/artists/featured", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const artists = await storage.getFeaturedArtists(limit);
      res.json(artists);
    } catch (error) {
      console.error("Get featured artists error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // -----------------------------
  // 🔹 Get Artist Profile
  // -----------------------------
  app.get(
    "/api/artists/profile",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }

        if (req.user.role !== "artist") {
          return res.status(403).json({ message: "Access denied. Artist role required." });
        }
        const artist = await storage.getArtistByUserId(req.user.id);

        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        res.json(artist);
      } catch (error) {
        console.error("Get artist profile error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // -----------------------------
  // 🔹 Get Songs by Logged-in Artist
  // -----------------------------
  app.get(
    "/api/artists/songs",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }

        if (req.user.role !== "artist") {
          return res.status(403).json({ message: "Access denied. Artist role required." });
        }

        const artist = await storage.getArtistByUserId(req.user.id);

        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }
        const songs = await storage.getSongsByArtist(artist._id);
        res.json(songs);
      } catch (error) {
        console.error("Get artist songs error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/artists/analytics",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }

        if (req.user.role !== "artist") {
          return res.status(403).json({ message: "Access denied. Artist role required." });
        }
        const artist = await storage.getArtistByUserId(req.user.id);

        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        // Aggregate analytics from songs
        const songs = await storage.getSongsByArtist(artist._id);
        const totalPlays = songs.reduce((sum, song) => sum + (song.plays || 0), 0);
        const totalLikes = songs.reduce((sum, song) => sum + (song.likes || 0), 0);
        const uniqueListeners = songs.reduce((sum, song) => sum + (song.uniqueListeners || 0), 0);

        // Get analytics from last 30 days for new followers/subscribers
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentAnalytics = await storage.db.collection("analytics").find({
          artistId: artist._id,
          timestamp: { $gte: thirtyDaysAgo }
        }).toArray();

        const newFollowers = recentAnalytics.filter(a => a.action === "follow").length;
        const newSubscribers = recentAnalytics.filter(a => a.action === "subscribe").length;

        // Calculate conversion rate (followers to subscribers)
        const conversionRate = artist.artist?.followers?.length > 0
          ? ((newSubscribers / artist.artist.followers.length) * 100).toFixed(1)
          : 0;

        // Get current revenue from artist profile
        const revenue = artist.artist?.revenue || { subscriptions: 0, merch: 0, events: 0, ads: 0 };
        const monthlyRevenue = revenue.subscriptions + revenue.merch + revenue.events + revenue.ads;

        res.json({
          monthlyRevenue,
          subscriptionRevenue: revenue.subscriptions,
          merchRevenue: revenue.merch,
          eventRevenue: revenue.events,
          totalPlays,
          uniqueListeners,
          totalLikes,
          newFollowers,
          newSubscribers,
          conversionRate: parseFloat(conversionRate.toString()),
          topSongs: songs
            .sort((a, b) => (b.plays || 0) - (a.plays || 0))
            .slice(0, 5),
        });
      } catch (error) {
        console.error("Get artist analytics error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/artists/profile",
    authenticateToken,
    requireRole(["artist"]),
    async (req: AuthRequest, res) => {
      try {
        const artist = await storage.getArtistByUserId(req.user!.id);

        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        const updatedArtist = await storage.updateUser(artist._id, {
          artist: { ...artist.artist, ...req.body },
        });

        res.json(updatedArtist?.artist || {});
      } catch (error) {
        console.error("Update artist profile error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get("/api/artists/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const artist = await storage.getArtistByUserId(id);

      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }

      // Get artist's songs
      const songs = await storage.getSongsByArtist(id);

      // Get artist's events
      const events = await storage.getEventsByArtist(id);

      // Get artist's merch
      const merch = await storage.getMerchByArtist(id);

      // Get artist's blogs
      const blogs = await storage.getBlogsByArtist(id);

      res.json({
        ...artist,
        user: {
          _id: artist._id,
          name: artist.name,
          email: artist.email
        },
        songs,
        events,
        merch,
        blogs
      });
    } catch (error) {
      console.error("Get artist by ID error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/artists", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const artists = await storage.getAllArtists(limit);

      // Enrich with additional info
      const enrichedArtists = await Promise.all(
        artists.map(async (artist) => {
          const songs = await storage.getSongsByArtist(artist._id);
          const totalPlays = songs.reduce((sum, song) => sum + (song.plays || 0), 0);

          return {
            ...artist,
            user: {
              _id: artist._id,
              name: artist.name,
              email: artist.email
            },
            songsCount: songs.length,
            totalPlays,
            // Ensure we have the artist profile data
            artist: artist.artist || {
              bio: "",
              socialLinks: {},
              followers: [],
              totalPlays: totalPlays,
              totalLikes: 0,
              revenue: { subscriptions: 0, merch: 0, events: 0, ads: 0 },
              trendingScore: totalPlays,
              featured: false,
              verified: false,
            }
          };
        })
      );

      res.json(enrichedArtists);
    } catch (error) {
      console.error("Get all artists error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Song routes
  app.get("/api/songs/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const songs = await storage.getTrendingSongs(limit);

      // Populate artist names
      const songsWithArtistNames = await Promise.all(
        songs.map(async (song) => {
          const artist = await storage.getArtistByUserId(song.artistId);
          if (artist) {
            const user = artist;
            return {
              ...song,
              artistName: user?.name || "Unknown Artist",
            };
          }
          return {
            ...song,
            artistName: "Unknown Artist",
          };
        }),
      );

      res.json(songsWithArtistNames);
    } catch (error) {
      console.error("Get trending songs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/songs/recommended",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;
        // For now, return trending songs as recommendations
        // In future, this could be personalized based on user's listening history
        const songs = await storage.getTrendingSongs(limit);

        // Populate artist names
        const songsWithArtistNames = await Promise.all(
          songs.map(async (song) => {
            const artist = await storage.getArtistByUserId(song.artistId);
            if (artist) {
              const user = artist;
              return {
                ...song,
                artistName: user?.name || "Unknown Artist",
              };
            }
            return {
              ...song,
              artistName: "Unknown Artist",
            };
          }),
        );

        res.json(songsWithArtistNames);
      } catch (error) {
        console.error("Get recommended songs error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get("/api/songs", async (req, res) => {
    try {
      const { genre, sort, limit } = req.query;
      const limitNum = parseInt(limit as string) || 20;

      // Get all songs based on filters
      const songs = await storage.getAllSongs({
        genre: genre as string,
        sort: sort as string,
        limit: limitNum,
      });

      // Populate artist names
      const songsWithArtistNames = await Promise.all(
        songs.map(async (song) => {
          const artist = await storage.getArtistByUserId(song.artistId);
          if (artist) {
            const user = artist;
            return {
              ...song,
              artistName: user?.name || "Unknown Artist",
            };
          }
          return {
            ...song,
            artistName: "Unknown Artist",
          };
        }),
      );

      res.json(songsWithArtistNames);
    } catch (error) {
      console.error("Get all songs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/songs/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query required" });
      }

      const songs = await storage.searchSongs(q);
      res.json(songs);
    } catch (error) {
      console.error("Search songs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/songs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const song = await storage.getSong(id);

      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }

      // Get artist info for the song
      const artist = await storage.getArtistByUserId(song.artistId);
      const songWithArtist = {
        ...song,
        artistName: artist?.name || "Unknown Artist"
      };

      res.json(songWithArtist);
    } catch (error) {
      console.error("Get song error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/songs",
    authenticateToken,
    requireRole(["artist"]),
    upload.fields([
      { name: "audio", maxCount: 1 },
      { name: "artwork", maxCount: 1 },
    ]),
    async (req: AuthRequest, res) => {
      try {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const songData = JSON.parse(req.body.data);

        if (!files.audio || !files.artwork) {
          return res
            .status(400)
            .json({ message: "Audio file and artwork required" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        // Upload files to Cloudinary
        const audioResult = await uploadAudio(
          files.audio[0].buffer,
          `song_${Date.now()}`,
        );
        const artworkResult = await uploadImage(
          files.artwork[0].buffer,
          `artwork_${Date.now()}`,
        );

        // Get audio duration from Cloudinary response
        const audioDuration = (audioResult as any).duration || 0;

        const song = await storage.createSong({
          ...songData,
          artistId: artist._id,
          fileUrl: (audioResult as any).secure_url,
          artworkUrl: (artworkResult as any).secure_url,
          durationSec: Math.round(audioDuration),
          plays: 0,
          likes: 0,
          uniqueListeners: 0,
        });

        // Log analytics
        await storage.logAnalytics({
          userId: req.user!.id,
          artistId: artist._id,
          songId: song._id,
          action: "view",
          context: "profile",
          metadata: {},
        });

        res.json(song);
      } catch (error) {
        console.error("Upload song error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/songs/:id/play",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const song = await storage.getSong(id);

        if (!song) {
          return res.status(404).json({ message: "Song not found" });
        }

        // Use analytics service to track play
        await AnalyticsService.trackSongPlay(req.user!.id, id, req.body.context || "player");

        res.json({ message: "Play logged" });
      } catch (error) {
        console.error("Log play error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/songs/:id/like",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const song = await storage.getSong(id);

        if (!song) {
          return res.status(404).json({ message: "Song not found" });
        }

        const user = await storage.getUser(req.user!.id);
        const isLiked = user?.favorites.songs.includes(id);

        // Update user favorites
        const favorites = {
          ...user!.favorites,
          songs: isLiked
            ? user!.favorites.songs.filter((songId) => songId !== id)
            : [...user!.favorites.songs, id],
        };

        await storage.updateUser(req.user!.id, { favorites });

        // Use analytics service to track like/unlike
        await AnalyticsService.trackSongLike(req.user!.id, id, !isLiked, req.body.context || "player");

        res.json({ liked: !isLiked });
      } catch (error) {
        console.error("Like song error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Update Song
  app.patch(
    "/api/songs/:id",
    authenticateToken,
    requireRole(["artist"]),
    upload.fields([
      { name: "audio", maxCount: 1 },
      { name: "artwork", maxCount: 1 },
    ]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        // Check if song exists and belongs to this artist
        const existingSong = await storage.getSong(id);
        if (!existingSong) {
          return res.status(404).json({ message: "Song not found" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist || existingSong.artistId !== artist._id) {
          return res.status(403).json({ message: "Not authorized to update this song" });
        }

        let songData;
        if (req.body.data) {
          songData = JSON.parse(req.body.data);
        } else {
          songData = req.body;
        }

        let fileUrl = existingSong.fileUrl;
        let artworkUrl = existingSong.artworkUrl;
        let durationSec = existingSong.durationSec;

        // Upload new files if provided
        if (files.audio && files.audio[0]) {
          const audioResult = await uploadAudio(
            files.audio[0].buffer,
            `song_${Date.now()}`,
          );
          fileUrl = (audioResult as any).secure_url;
          durationSec = Math.round((audioResult as any).duration || 0);
        }

        if (files.artwork && files.artwork[0]) {
          const artworkResult = await uploadImage(
            files.artwork[0].buffer,
            `artwork_${Date.now()}`,
          );
          artworkUrl = (artworkResult as any).secure_url;
        }

        const updatedSong = await storage.updateSong(id, {
          ...songData,
          fileUrl,
          artworkUrl,
          durationSec,
        });

        res.json(updatedSong);
      } catch (error) {
        console.error("Update song error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete Song
  app.delete(
    "/api/songs/:id",
    authenticateToken,
    requireRole(["artist"]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const song = await storage.getSong(id);

        if (!song) {
          return res.status(404).json({ message: "Song not found" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist || song.artistId !== artist._id) {
          return res.status(403).json({ message: "Not authorized to delete this song" });
        }

        const deleted = await storage.deleteSong(id);
        if (deleted) {
          res.json({ message: "Song deleted successfully" });
        } else {
          res.status(500).json({ message: "Failed to delete song" });
        }
      } catch (error) {
        console.error("Delete song error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Merch routes
  app.get("/api/merch", async (req, res) => {
    try {
      const { search, category, minPrice, maxPrice, sort } = req.query;

      // Build query filters
      const filters: any = {};

      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (category && category !== "all-categories") {
        filters.category = { $regex: category, $options: "i" };
      }

      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = parseFloat(minPrice as string);
        if (maxPrice) filters.price.$lte = parseFloat(maxPrice as string);
      }

      // Get filtered merch
      let merch = await storage.getAllMerchFiltered(filters);

      // Apply sorting
      if (sort) {
        switch (sort) {
          case "price-low":
            merch.sort((a, b) => a.price - b.price);
            break;
          case "price-high":
            merch.sort((a, b) => b.price - a.price);
            break;
          case "newest":
            merch.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
            break;
          case "popular":
          default:
            merch.sort(
              (a, b) => (b.orders?.length || 0) - (a.orders?.length || 0),
            );
            break;
        }
      }

      res.json(merch);
    } catch (error) {
      console.error("Get merch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/merch/artist",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        if (req.user!.role !== "artist") {
          return res.json([]); // fans/admins shouldn't see this
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        const merch = await storage.getMerchByArtist(artist._id);
        const merchWithArtistName = merch.map((item) => ({
          ...item,
          artistName: artist.name,
        }));

        res.json(merchWithArtistName);
      } catch (error) {
        console.error("Get artist merch error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get("/api/merch/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getMerch(id);

      if (!item) {
        return res.status(404).json({ message: "Merch item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Get merch item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/merch",
    authenticateToken,
    requireRole(["artist"]),
    upload.array("images", 5),
    async (req: AuthRequest, res) => {
      try {
        const files = req.files as Express.Multer.File[];
        const merchData = JSON.parse(req.body.data);

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        // Upload images to Cloudinary
        let images: string[] = [];
        if (files && files.length > 0) {
          const imageUploads = files.map((file) =>
            uploadImage(
              file.buffer,
              `merch_${Date.now()}_${Math.random()}`,
              "ruc/merch",
            ),
          );
          const imageResults = await Promise.all(imageUploads);
          images = imageResults.map((result) => (result as any).secure_url);
        }

        const merch = await storage.createMerch({
          ...merchData,
          artistId: artist._id,
          images,
        });

        res.json(merch);
      } catch (error) {
        console.error("Create merch error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // -----------------------------
  // 🔹 Update Merch (PATCH)
  // -----------------------------
  app.patch(
    "/api/merch/:id",
    authenticateToken,
    upload.array("images", 5),
    async (req: AuthRequest, res) => {
      try {
        if (req.user!.role !== "artist") {
          return res.status(403).json({ message: "Only artists can update merch" });
        }

        const { id } = req.params;
        const files = req.files as Express.Multer.File[];

        // Check if merch exists and belongs to this artist
        const existingMerch = await storage.getMerch(id);
        if (!existingMerch) {
          return res.status(404).json({ message: "Merch not found" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist || existingMerch.artistId !== artist._id) {
          return res.status(403).json({ message: "Not authorized to update this merch" });
        }

        let merchData;
        if (req.body.data) {
          // Multipart form data with images
          merchData = JSON.parse(req.body.data);
        } else {
          // JSON data without images
          merchData = req.body;
        }

        // Upload new images to Cloudinary if provided
        let images = existingMerch.images || [];
        if (files && files.length > 0) {
          const imageUploads = files.map((file) =>
            uploadImage(
              file.buffer,
              `merch_${Date.now()}_${Math.random()}`,
              "ruc/merch",
            ),
          );
          const imageResults = await Promise.all(imageUploads);
          images = imageResults.map((result) => (result as any).secure_url);
        }

        const updatedMerch = await storage.updateMerch(id, {
          ...merchData,
          images,
        });

        if (!updatedMerch) {
          return res.status(500).json({ message: "Failed to update merch" });
        }

        res.json(updatedMerch);
      } catch (error) {
        console.error("Update merch error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete Merch
  app.delete(
    "/api/merch/:id",
    authenticateToken,
    requireRole(["artist"]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const merch = await storage.getMerch(id);

        if (!merch) {
          return res.status(404).json({ message: "Merch not found" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist || merch.artistId !== artist._id) {
          return res.status(403).json({ message: "Not authorized to delete this merch" });
        }

        const deleted = await storage.deleteMerch(id);
        if (deleted) {
          res.json({ message: "Merch deleted successfully" });
        } else {
          res.status(500).json({ message: "Failed to delete merch" });
        }
      } catch (error) {
        console.error("Delete merch error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { search, location, date, genre, type } = req.query;

      // Build query filters
      const filters: any = {};

      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }

      if (location && location !== "all-locations") {
        filters.location = { $regex: location, $options: "i" };
      }

      if (date && date !== "upcoming") {
        const now = new Date();
        switch (date) {
          case "this-week":
            const weekFromNow = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000,
            );
            filters.date = { $gte: now, $lte: weekFromNow };
            break;
          case "this-month":
            const monthFromNow = new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000,
            );
            filters.date = { $gte: now, $lte: monthFromNow };
            break;
          case "past":
            filters.date = { $lt: now };
            break;
          default:
            filters.date = { $gte: now };
        }
      } else {
        // Default to upcoming events
        filters.date = { $gte: new Date() };
      }

      let events = await storage.getAllEventsFiltered(filters);

      // Populate artist names
      const eventsWithArtistNames = await Promise.all(
        events.map(async (event) => {
          const artist = await storage.getArtistByUserId(event.artistId);
          if (artist) {
            const user = artist;
            return {
              ...event,
              artistName: user?.name || "Unknown Artist",
            };
          }
          return {
            ...event,
            artistName: "Unknown Artist",
          };
        }),
      );

      res.json(eventsWithArtistNames);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/events/artist",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        if (req.user!.role !== "artist") {
          return res.json([]);
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        const events = await storage.getEventsByArtist(artist._id);
        const eventsWithArtistName = events.map((event) => ({
          ...event,
          artistName: artist.name,
        }));

        res.json(eventsWithArtistName);
      } catch (error) {
        console.error("Get artist events error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getEvent(id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/events",
    authenticateToken,
    requireRole(["artist"]),
    upload.single("image"),
    async (req: AuthRequest, res) => {
      try {
        const file = req.file;
        let eventData;

        if (req.body.data) {
          // Multipart form data with image
          eventData = JSON.parse(req.body.data);
        } else {
          // JSON data without image
          eventData = req.body;
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        // Upload image to Cloudinary if provided
        let imageUrl = "";
        if (file) {
          const imageResult = await uploadImage(
            file.buffer,
            `event_${Date.now()}_${Math.random()}`,
            "ruc/events",
          );
          imageUrl = (imageResult as any).secure_url;
        }

        const event = await storage.createEvent({
          ...eventData,
          artistId: artist._id,
          date: new Date(eventData.date),
          imageUrl: imageUrl || eventData.imageUrl || "",
        });

        res.json(event);
      } catch (error) {
        console.error("Create event error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Order and Payment routes
  app.post("/api/orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Determine order type based on cart items
      let orderType = "MERCH";
      if (req.session.cart && req.session.cart.items.length > 0) {
        const hasTickets = req.session.cart.items.some(
          (item: any) => item.type === "event",
        );
        const hasMerch = req.session.cart.items.some(
          (item: any) => item.type === "merch",
        );

        if (hasTickets && hasMerch) {
          orderType = "MIXED";
        } else if (hasTickets) {
          orderType = "TICKET";
        } else {
          orderType = "MERCH";
        }
      }

      // Transform cart items to match order schema
      const transformedItems =
        req.session.cart?.items?.map((item: any) => ({
          merchId: item.type === "merch" ? item.id : undefined,
          eventId: item.type === "event" ? item.id : undefined,
          qty: item.quantity,
          unitPrice: item.price,
        })) || [];

      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user!.id,
        type: req.body.type || orderType,
        status: "PENDING",
        currency: "INR",
        items: transformedItems,
        totalAmount: req.session.cart?.summary?.total || 0,
      });

      const order = await storage.createOrder(orderData);

      // Create Razorpay order
      const razorpayOrder = await createOrder(
        order.totalAmount,
        order.currency,
        order._id,
      );

      await storage.updateOrder(order._id, {
        razorpayOrderId: razorpayOrder.id,
      });

      res.json({
        order,
        razorpayOrder,
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/payments/verify",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { orderId, paymentId, signature, orderDbId } = req.body;

        const isValid = verifyPayment(orderId, paymentId, signature);

        if (!isValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }

        // Update order status
        const order = await storage.updateOrder(orderDbId, {
          status: "PAID",
          razorpayPaymentId: paymentId,
        });

        if (order) {
          // Send confirmation email (non-blocking)
          sendOrderConfirmation(req.user!.email, order).catch((error) => {
            console.warn("Failed to send order confirmation:", error.message);
          });

          // Generate QR code for tickets
          if (order.type === "TICKET") {
            const qrCode = await generateQRCode(
              order.totalAmount,
              `Ticket for ${order._id}`,
            );
            await storage.updateOrder(order._id, { qrTicketUrl: qrCode });

            // Send ticket email (non-blocking)
            sendTicketEmail(
              req.user!.email,
              {
                eventTitle: "Event", // You'd fetch the actual event details
                date: new Date(),
                location: "Venue",
                ticketId: order._id,
              },
              qrCode,
            ).catch((error) => {
              console.warn("Failed to send ticket email:", error.message);
            });
          }
        }

        res.json({ message: "Payment verified successfully", order });
      } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/orders/me",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const orders = await storage.getOrdersByUser(req.user!.id);
        res.json(orders);
      } catch (error) {
        console.error("Get user orders error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/orders/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const order = await storage.getOrder(id);

        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        // Check if user owns this order
        if (order.userId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }

        res.json(order);
      } catch (error) {
        console.error("Get order error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Admin routes
  app.get(
    "/api/admin/pending-artists",
    authenticateToken,
    requireRole(["admin"]),
    async (req: AuthRequest, res) => {
      try {
        // Get artists awaiting verification
        const artists = await storage.db
          .collection("users")
          .find({ role: "artist", "artist.verified": false })
          .toArray();

        res.json(artists);
      } catch (error) {
        console.error("Get pending artists error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/admin/verify-artist/:artistId",
    authenticateToken,
    requireRole(["admin"]),
    async (req: AuthRequest, res) => {
      try {
        const { artistId } = req.params;
        const { approved, reason } = req.body;

        const artist = await storage.getArtistByUserId(artistId);
        if (artist && artist.artist) {
          await storage.updateUser(artistId, {
            artist: { ...artist.artist, verified: approved }
          });
        }

        const user = await storage.getUser(artistId);
        if (user) {
          await sendArtistVerificationEmail(
            user.email,
            user.name,
            approved ? "approved" : "rejected",
            reason,
          );
        }

        res.json({ message: "Artist verification updated" });
      } catch (error) {
        console.error("Verify artist error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Settings routes
  app.get(
    "/api/users/me/settings",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get artist profile if user is an artist
        let artistProfile = null;
        if (user.role === "artist") {
          artistProfile = await storage.getArtistByUserId(user._id);
        }

        res.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            bio: artistProfile?.artist?.bio || "",
            website: artistProfile?.artist?.socialLinks?.website || "",
            instagram: artistProfile?.artist?.socialLinks?.instagram || "",
            youtube: artistProfile?.artist?.socialLinks?.youtube || "",
            x: artistProfile?.artist?.socialLinks?.x || "",
          },
          notifications: {
            email: true,
            newMusic: true,
            events: true,
            marketing: false,
          },
          privacy: {
            profileVisibility: "public",
            activityStatus: true,
            listeningHistory: true,
            personalizedAds: false,
          },
        });
      } catch (error) {
        console.error("Get user settings error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/auth/change-password",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { currentPassword, newPassword } = req.body;

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(
          currentPassword,
          user.passwordHash,
        );
        if (!isValidPassword) {
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await storage.updateUser(req.user!.id, {
          passwordHash: hashedNewPassword,
        });

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Playlist routes
  app.get(
    "/api/playlists/mine",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const playlists = user.playlists || [];

        // Populate songs with artist names
        const populatedPlaylists = await Promise.all(
          playlists.map(async (playlist) => {
            const populatedSongs = await Promise.all(
              playlist.songs.map(async (songId) => {
                const song = await storage.getSong(songId);
                if (song) {
                  const artist = await storage.getArtistByUserId(song.artistId);
                  return {
                    ...song,
                    artistName: artist?.name || "Unknown Artist"
                  };
                }
                return null;
              })
            );

            return {
              ...playlist,
              songs: populatedSongs.filter(song => song !== null)
            };
          })
        );

        res.json(populatedPlaylists);
      } catch (error) {
        console.error("Get user playlists error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/playlists",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { name, songs = [] } = req.body;

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const newPlaylist = {
          name,
          songs,
          createdAt: new Date(),
        };

        const updatedPlaylists = [...(user.playlists || []), newPlaylist];
        await storage.updateUser(req.user!.id, { playlists: updatedPlaylists });

        res.json(newPlaylist);
      } catch (error) {
        console.error("Create playlist error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/playlists/add-song",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { playlistName, songId } = req.body;

        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const updatedPlaylists = (user.playlists || []).map((playlist) => {
          if (playlist.name === playlistName) {
            // Check if song is already in playlist
            if (!playlist.songs.includes(songId)) {
              return {
                ...playlist,
                songs: [...playlist.songs, songId],
              };
            }
          }
          return playlist;
        });

        await storage.updateUser(req.user!.id, { playlists: updatedPlaylists });

        res.json({ message: "Song added to playlist" });
      } catch (error) {
        console.error("Add song to playlist error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Favorites routes
  app.get(
    "/api/users/me/favorites",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUser(req.user!.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const favorites = user.favorites || {
          artists: [],
          songs: [],
          events: [],
        };

        // Populate song details for favorites
        const populatedSongs = [];
        for (const songId of favorites.songs) {
          const song = await storage.getSong(songId);
          if (song) {
            populatedSongs.push(song);
          }
        }

        // Populate artist details for favorites
        const populatedArtists = [];
        for (const artistId of favorites.artists) {
          const artist = await storage.getArtistByUserId(artistId);
          if (artist) {
            populatedArtists.push(artist);
          }
        }

        // Populate event details for favorites
        const populatedEvents = [];
        for (const eventId of favorites.events) {
          const event = await storage.getEvent(eventId);
          if (event) {
            populatedEvents.push(event);
          }
        }

        res.json({
          artists: populatedArtists,
          songs: populatedSongs,
          events: populatedEvents,
        });
      } catch (error) {
        console.error("Get user favorites error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/users/me/favorites/songs/:songId",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { songId } = req.params;
        const user = await storage.getUser(req.user!.id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const favorites = user.favorites || {
          artists: [],
          songs: [],
          events: [],
        };
        const songIndex = favorites.songs.indexOf(songId);

        if (songIndex > -1) {
          // Remove from favorites
          favorites.songs.splice(songIndex, 1);
        } else {
          // Add to favorites
          favorites.songs.push(songId);
        }

        await storage.updateUser(req.user!.id, { favorites });
        res.json({ favorited: songIndex === -1, favorites });
      } catch (error) {
        console.error("Toggle song favorite error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/users/me/avatar",
    authenticateToken,
    upload.single("avatar"),
    async (req: AuthRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Avatar file required" });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
          return res.status(400).json({ message: "Only image files are allowed" });
        }

        // Validate file size (5MB max)
        if (req.file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: "File size must be less than 5MB" });
        }

        try {
          const avatarResult = await uploadImage(
            req.file.buffer,
            `avatar_${req.user!.id}`,
            "ruc/avatars"
          );

          const avatarUrl = (avatarResult as any).secure_url;

          // Update user profile with avatar URL
          await storage.updateUser(req.user!.id, { avatarUrl });

          res.json({
            message: "Avatar uploaded successfully",
            avatarUrl: avatarUrl,
          });
        } catch (uploadError: any) {
          console.error("Cloudinary upload error:", uploadError);
          throw uploadError; // Re-throw to be caught by outer catch
        }
      } catch (error: any) {
        console.error("Upload avatar error:", error);
        if (error.message?.includes("Cloudinary not configured")) {
          res.status(503).json({ message: "File upload service not configured. Please contact administrator." });
        } else if (error.message?.includes("Upload timeout")) {
          res.status(408).json({ message: "Upload timeout. Please try again." });
        } else {
          res.status(500).json({ message: "Failed to upload avatar. Please try again." });
        }
      }
    },
  );

  // Cart routes
  app.get("/api/cart", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For now, we'll use session-based cart (could be moved to user schema)
      const cart = req.session.cart || {
        items: [],
        summary: { subtotal: 0, discount: 0, tax: 0, total: 0 },
      };
      res.json(cart);
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/cart/add",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { type, id, quantity = 1 } = req.body;

        if (!req.session.cart) {
          req.session.cart = {
            items: [],
            summary: { subtotal: 0, discount: 0, tax: 0, total: 0 },
          };
        }

        let itemData;
        let price: number = 0;

        if (type === "merch") {
          itemData = await storage.getMerch(id);
          price = itemData?.price || 0;
        } else if (type === "event") {
          itemData = await storage.getEvent(id);
          price = itemData?.ticketPrice || 0;
        }

        if (!itemData) {
          return res.status(404).json({ message: "Item not found" });
        }

        // Check if item already exists in cart
        const existingItemIndex = req.session.cart.items.findIndex(
          (item: any) => item.id === id && item.type === type,
        );

        if (existingItemIndex > -1) {
          // Update quantity
          req.session.cart.items[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          req.session.cart.items.push({
            _id: `cart_${Date.now()}`,
            type,
            id,
            name:
              type === "merch"
                ? (itemData as any).name
                : (itemData as any).title,
            price,
            quantity,
            image: type === "merch" ? (itemData as any).images?.[0] : undefined,
          });
        }

        // Recalculate totals
        const subtotal = req.session.cart.items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0,
        );
        const tax = subtotal * 0.18; // 18% GST
        const total = subtotal + tax;

        req.session.cart.summary = { subtotal, discount: 0, tax, total };

        res.json({ message: "Item added to cart", cart: req.session.cart });
      } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/cart/update",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { itemId, quantity } = req.body;

        if (!req.session.cart) {
          return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = req.session.cart.items.findIndex(
          (item: any) => item._id === itemId,
        );

        if (itemIndex > -1) {
          if (quantity <= 0) {
            req.session.cart.items.splice(itemIndex, 1);
          } else {
            req.session.cart.items[itemIndex].quantity = quantity;
          }

          // Recalculate totals
          const subtotal = req.session.cart.items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0,
          );
          const tax = subtotal * 0.18;
          const total = subtotal + tax;

          req.session.cart.summary = { subtotal, discount: 0, tax, total };
        }

        res.json({ message: "Cart updated", cart: req.session.cart });
      } catch (error) {
        console.error("Update cart error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.delete(
    "/api/cart/remove",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { itemId } = req.body;

        if (!req.session.cart) {
          return res.status(404).json({ message: "Cart not found" });
        }

        req.session.cart.items = req.session.cart.items.filter(
          (item: any) => item._id !== itemId,
        );

        // Recalculate totals
        const subtotal = req.session.cart.items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0,
        );
        const tax = subtotal * 0.18;
        const total = subtotal + tax;

        req.session.cart.summary = { subtotal, discount: 0, tax, total };

        res.json({ message: "Item removed from cart", cart: req.session.cart });
      } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/cart/promo",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { code } = req.body;

        if (!req.session.cart) {
          return res.status(404).json({ message: "Cart not found" });
        }

        // Simple promo code logic (you can expand this)
        const promoCodes: { [key: string]: number } = {
          SAVE10: 0.1,
          SAVE20: 0.2,
          FIRST50: 0.5,
        };

        const discount = promoCodes[code.toUpperCase()];
        if (!discount) {
          return res.status(400).json({ message: "Invalid promo code" });
        }

        const subtotal = req.session.cart.items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0,
        );
        const discountAmount = subtotal * discount;
        const tax = (subtotal - discountAmount) * 0.18;
        const total = subtotal - discountAmount + tax;

        req.session.cart.summary = {
          subtotal,
          discount: discountAmount,
          tax,
          total,
        };

        res.json({ message: "Promo code applied", cart: req.session.cart });
      } catch (error) {
        console.error("Apply promo error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // -----------------------------
  // 🔹 Update Event (PATCH)
  // -----------------------------
  app.patch(
    "/api/events/:id",
    authenticateToken,
    upload.single("image"),
    async (req: AuthRequest, res) => {
      try {
        if (req.user!.role !== "artist") {
          return res.status(403).json({ message: "Only artists can update events" });
        }

        const { id } = req.params;
        const file = req.file;

        // Check if event exists and belongs to this artist
        const existingEvent = await storage.getEvent(id);
        if (!existingEvent) {
          return res.status(404).json({ message: "Event not found" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist || existingEvent.artistId !== artist._id) {
          return res.status(403).json({ message: "Not authorized to update this event" });
        }

        let eventData;
        if (req.body.data) {
          // Multipart form data with image
          eventData = JSON.parse(req.body.data);
        } else {
          // JSON data without image
          eventData = req.body;
        }

        // Upload new image to Cloudinary if provided
        let imageUrl = existingEvent.imageUrl;
        if (file) {
          const imageResult = await uploadImage(
            file.buffer,
            `event_${Date.now()}_${Math.random()}`,
            "ruc/events",
          );
          imageUrl = (imageResult as any).secure_url;
        }

        const updatedEvent = await storage.updateEvent(id, {
          ...eventData,
          date: eventData.date ? new Date(eventData.date) : existingEvent.date,
          imageUrl: imageUrl || eventData.imageUrl || existingEvent.imageUrl,
        });

        if (!updatedEvent) {
          return res.status(500).json({ message: "Failed to update event" });
        }

        res.json(updatedEvent);
      } catch (error) {
        console.error("Update event error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Delete Event
  app.delete(
    "/api/events/:id",
    authenticateToken,
    requireRole(["artist"]),
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;
        const event = await storage.getEvent(id);

        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist || event.artistId !== artist._id) {
          return res.status(403).json({ message: "Not authorized to delete this event" });
        }

        const deleted = await storage.deleteEvent(id);
        if (deleted) {
          res.json({ message: "Event deleted successfully" });
        } else {
          res.status(500).json({ message: "Failed to delete event" });
        }
      } catch (error) {
        console.error("Delete event error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Subscription routes
  app.get(
    "/api/subscriptions/me",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const subscriptions = await storage.getSubscriptionsByUser(
          req.user!.id,
        );
        res.json(subscriptions);
      } catch (error) {
        console.error("Get user subscriptions error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/subscriptions",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { artistId, plan, amount } = req.body;

        const subscription = await storage.createSubscription({
          fanId: req.user!.id,
          artistId,
          tier: plan || "BRONZE",
          amount,
          currency: "INR",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          active: true,
        });

        res.json(subscription);
      } catch (error) {
        console.error("Create subscription error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Blog routes
  app.get("/api/blogs", async (req, res) => {
    try {
      const blogs = await storage.getAllBlogs();
      res.json(blogs);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  });

  // Get blogs by artist
  app.get("/api/blogs/artist", authenticateToken, async (req: AuthRequest, res) => {
    if (!req.user || req.user.role !== "artist") {
      return res.status(401).json({ message: "Unauthorized - Artist access required" });
    }

    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) {
        return res.status(404).json({ message: "Artist profile not found" });
      }

      const blogs = await storage.getBlogsByArtist(artist._id);
      res.json(blogs);
    } catch (error) {
      console.error("Error fetching artist blogs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get individual blog post
  app.get("/api/blogs/:id", async (req, res) => {
    try {
      const blog = await storage.getBlog(req.params.id);
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      // Check if blog is subscriber-only
      if (blog.visibility === "SUBSCRIBER_ONLY") {
        // Extract token from headers for optional authentication
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        
        if (!token) {
          return res.status(403).json({ message: "Authentication required for subscriber content" });
        }

        try {
          const decoded = jwt.verify(token, process.env.SESSION_SECRET || "your-secret-key-here") as any;
          const userId = decoded.userId || decoded.id;

          // Check if user is subscribed to the artist
          const user = await storage.getUser(userId);
          if (!user) {
            return res.status(403).json({ message: "User not found" });
          }

          const isSubscribed = user.subscriptions?.some(sub =>
            sub.artistId === blog.artistId && sub.active
          );

          if (!isSubscribed && userId !== blog.artistId) {
            return res.status(403).json({ message: "Subscriber access required" });
          }
        } catch (error) {
          return res.status(403).json({ message: "Invalid authentication token" });
        }
      }

      // Get artist name for the blog
      const artist = await storage.getUser(blog.artistId);
      const blogWithArtist = {
        ...blog,
        artistName: artist?.name || "Unknown Artist"
      };

      res.json(blogWithArtist);
    } catch (error) {
      console.error("Error fetching blog:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/blogs",
    authenticateToken,
    requireRole(["artist"]),
    upload.array("images", 10),
    async (req: AuthRequest, res) => {
      try {
        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist) {
          return res.status(404).json({ message: "Artist profile not found" });
        }

        let blogData;
        if (req.body.data) {
          // FormData with files
          blogData = JSON.parse(req.body.data);
        } else {
          // Direct JSON
          blogData = req.body;
        }

        const { title, content, visibility, tags } = blogData;
        const parsedTags = Array.isArray(tags) ? tags : (tags ? JSON.parse(tags) : []);

        const images: string[] = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
          try {
            for (const file of req.files as Express.Multer.File[]) {
              const result = await uploadImage(
                file.buffer,
                `blog_${Date.now()}_${Math.random()}`,
                "ruc/blogs"
              );
              images.push((result as any).secure_url);
            }
          } catch (uploadError) {
            console.warn("Image upload failed, creating blog without images:", uploadError);
            // Continue without images if upload fails
          }
        }

        const blog = await storage.createBlog({
          artistId: artist._id,
          title,
          content,
          visibility: visibility || "PUBLIC",
          images,
          tags: parsedTags
        });

        res.status(201).json(blog);
      } catch (error) {
        console.error("Blog creation error:", error);
        res.status(500).json({ message: "Failed to create blog" });
      }
    },
  );

  app.patch(
    "/api/blogs/:id",
    authenticateToken,
    requireRole(["artist"]),
    upload.array("images", 10),
    async (req: AuthRequest, res) => {
      try {
        const blog = await storage.getBlog(req.params.id);
        if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
        }

        const artist = await storage.getArtistByUserId(req.user!.id);
        if (!artist || blog.artistId !== artist._id) {
          return res.status(403).json({ message: "Not authorized to edit this blog" });
        }

        let blogData;
        if (req.body.data) {
          // FormData with files
          blogData = JSON.parse(req.body.data);
        } else {
          // Direct JSON
          blogData = req.body;
        }

        const { title, content, visibility, tags } = blogData;
        const parsedTags = Array.isArray(tags) ? tags : (tags ? JSON.parse(tags) : blog.tags);

        let images = blog.images || [];
        if (req.files && Array.isArray(req.files)) {
          for (const file of req.files as Express.Multer.File[]) {
            const result = await uploadImage(
              file.buffer,
              `blog_${Date.now()}_${Math.random()}`,
              "ruc/blogs"
            );
            images.push((result as any).secure_url);
          }
        }

        const updateData = {
          title: title || blog.title,
          content: content || blog.content,
          visibility: visibility || blog.visibility,
          images,
          tags: parsedTags
        };

        const updatedBlog = await storage.updateBlog(req.params.id, updateData);
        res.json(updatedBlog);
      } catch (error) {
        console.error("Blog update error:", error);
        res.status(500).json({ message: "Failed to update blog" });
      }
    },
  );

  app.delete(
    "/api/blogs/:id",
    authenticateToken,
    requireRole(["artist"]),
    async (req, res) => {
      try {
        const blog = await storage.getBlog(req.params.id);
        if (!blog) {
          return res.status(404).json({ message: "Blog not found" });
        }

        if (blog.artistId !== req.user!.id) {
          return res.status(403).json({ message: "Not authorized to delete this blog" });
        }

        const deleted = await storage.deleteBlog(req.params.id);
        if (deleted) {
          res.json({ message: "Blog deleted successfully" });
        } else {
          res.status(500).json({ message: "Failed to delete blog" });
        }
      } catch (error) {
        console.error("Blog deletion error:", error);
        res.status(500).json({ message: "Failed to delete blog" });
      }
    },
  );

  // Analytics route
  app.post(
    "/api/analytics",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const analyticsData = {
          ...req.body,
          userId: req.user!.id,
        };

        await storage.logAnalytics(analyticsData);
        res.json({ message: "Analytics logged" });
      } catch (error) {
        console.error("Log analytics error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}