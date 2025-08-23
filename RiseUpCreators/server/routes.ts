import type { Express } from "express";
import { storage } from "./storage";
import { authService } from "./auth";
import {
  authenticate,
  requireRole,
  optionalAuth,
  validateRequest,
  rateLimiter,
  errorHandler,
} from "./middleware";
import { cloudinaryService } from "./services/cloudinary";
import { emailService } from "./services/email";
import { analyticsService } from "./services/analytics";
import {
  insertPlaylistSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";

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

// Validation schemas
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
  type: z.enum(["all", "songs", "artists", "events", "products"]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export function setupRoutes(app: Express): void {
  // ------------------------ Rate limiting ------------------------
  // In dev, skip rate limiting entirely.
  if (isProd) {
    const skipPaths = new Set<string>(["/api/auth/me", "/me"]);
    app.use("/api/auth", (req, res, next) => {
      const p = req.originalUrl || req.url;
      if (skipPaths.has(p)) return next();
      return rateLimiter(15 * 60 * 1000, 50)(req, res, next); // 50 / 15min for auth
    });
    app.use("/api", (req, res, next) => {
      const p = req.originalUrl || req.url;
      if (skipPaths.has(p)) return next();
      return rateLimiter(60 * 1000, 300)(req, res, next); // 300 / min for API
    });
  }

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  app.post("/api/auth/register", validateRequest(registerSchema), async (req, res) => {
    try {
      const { email, password, name, role = "fan" } = req.body;
      const { user, token } = await authService.register(email, password, name, role);

      // Welcome + analytics
      await emailService.sendWelcomeEmail(user.email, user.name, user.role);
      await analyticsService.trackSignup(user.role, user.id);

      // Set HttpOnly cookie so FE fetches with credentials: "include" work
      res.cookie(JWT_COOKIE_NAME, token, cookieOpts);
      res.status(201).json({ user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", validateRequest(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);

      await analyticsService.trackLogin(user.id);

      res.cookie(JWT_COOKIE_NAME, token, cookieOpts);
      res.json({ user, token });
    } catch (error: any) {
      res.status(401).json({ message: error.message || "Invalid credentials" });
    }
  });

  // "Who am I" — optional auth so unauthenticated users get 401 (frontend treats as null)
  app.get("/api/auth/me", optionalAuth, (req: any, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id, email, role, name, status, isVerified, lastActive } = req.user;
    res.json({ id, email, role, name, status, isVerified, lastActive });
  });

  // Backward-compat alias (same response, no redirect)
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
  // USER ROUTES
  // ============================================================================

  app.get("/api/users/profile", authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const artist = user.role === "artist" ? await storage.getArtistByUserId(user.id) : null;
      res.json({ user, artist });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/profile", authenticate, async (req: any, res) => {
    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/notifications", authenticate, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/notifications/:id/read", authenticate, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ARTIST ROUTES
  // ============================================================================

  app.get("/api/artists", optionalAuth, async (req: any, res) => {
    try {
      const featured = String(req.query.featured || "false") === "true";
      const limit = featured ? 12 : 50;
      const artists = await storage.getFeaturedArtists(limit);
      res.json(artists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/artists/:id", optionalAuth, async (req: any, res) => {
    try {
      const artist = await storage.getArtist(req.params.id);
      if (!artist) return res.status(404).json({ message: "Artist not found" });

      const [songs, products, events] = await Promise.all([
        storage.getSongsByArtist(req.params.id, 20),
        storage.getProductsByArtist(req.params.id),
        storage.getEventsByArtist(req.params.id),
      ]);

      const isFollowing = req.user ? await storage.isFollowing(req.user.id, req.params.id) : false;

      res.json({ artist, songs, products, events, isFollowing });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/artists/:id/follow", authenticate, async (req: any, res) => {
    try {
      await storage.followArtist(req.user.id, req.params.id);
      await analyticsService.trackFollow(req.params.id, req.user.id);
      res.json({ message: "Artist followed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/artists/:id/follow", authenticate, async (req: any, res) => {
    try {
      await storage.unfollowArtist(req.user.id, req.params.id);
      res.json({ message: "Artist unfollowed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // SONG ROUTES
  // ============================================================================

  app.get("/api/songs", optionalAuth, async (req: any, res) => {
    try {
      const trending = String(req.query.trending || "false") === "true";
      const artistId = req.query.artistId as string | undefined;
      const limit = Number(req.query.limit ?? 20);

      let songs;
      if (trending) songs = await storage.getTrendingSongs(limit);
      else if (artistId) songs = await storage.getSongsByArtist(artistId, limit);
      else songs = await storage.getTrendingSongs(limit);

      res.json(songs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/songs/:id", optionalAuth, async (req: any, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) return res.status(404).json({ message: "Song not found" });

      const isLiked = req.user ? await storage.isLiked(req.user.id, req.params.id) : false;
      res.json({ song, isLiked });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(
    "/api/songs",
    authenticate,
    requireRole(["artist"]),
    upload.fields([
      { name: "audio", maxCount: 1 },
      { name: "artwork", maxCount: 1 },
    ]),
    async (req: any, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files.audio?.[0]) return res.status(400).json({ message: "Audio file is required" });

        const artist = await storage.getArtistByUserId(req.user.id);
        if (!artist) return res.status(400).json({ message: "Artist profile not found" });

        const audioUpload = await cloudinaryService.uploadAudio(files.audio[0].buffer, { folder: "ruc/songs" });

        let artworkUpload: any = null;
        if (files.artwork?.[0]) {
          artworkUpload = await cloudinaryService.uploadArtwork(files.artwork[0].buffer, { folder: "ruc/artwork" });
        }

        const waveformData = await cloudinaryService.generateWaveform(audioUpload.secure_url);

        const songData = {
          ...req.body,
          artistId: artist.id,
          files: {
            audioUrl: audioUpload.secure_url,
            audioFileId: audioUpload.public_id,
            artworkUrl: artworkUpload?.secure_url,
            artworkFileId: artworkUpload?.public_id,
            waveformData,
          },
        };

        const song = await storage.createSong(songData);
        res.json(song);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post("/api/songs/:id/play", optionalAuth, async (req: any, res) => {
    try {
      await analyticsService.trackPlay(req.params.id, req.user?.id);

      const song = await storage.getSong(req.params.id);
      if (song) {
        const updatedAnalytics = {
          ...song.analytics,
          playCount: (song.analytics?.playCount || 0) + 1,
        };
        await storage.updateSong(req.params.id, { analytics: updatedAnalytics });
      }
      res.json({ message: "Play tracked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/songs/:id/like", authenticate, async (req: any, res) => {
    try {
      await storage.likeSong(req.user.id, req.params.id);
      await analyticsService.trackLike(req.params.id, req.user.id);
      res.json({ message: "Song liked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/songs/:id/like", authenticate, async (req: any, res) => {
    try {
      await storage.unlikeSong(req.user.id, req.params.id);
      res.json({ message: "Song unliked successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PLAYLIST ROUTES
  // ============================================================================

  app.get("/api/playlists/me", authenticate, async (req: any, res) => {
    try {
      const playlists = await storage.getPlaylistsByUser(req.user.id);
      res.json(playlists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/playlists", authenticate, validateRequest(insertPlaylistSchema), async (req: any, res) => {
    try {
      const playlist = await storage.createPlaylist({ ...req.body, ownerId: req.user.id });
      res.json(playlist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/playlists/:id", optionalAuth, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) return res.status(404).json({ message: "Playlist not found" });

      if (!playlist.isPublic && (!req.user || playlist.ownerId !== req.user.id)) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(playlist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // SEARCH ROUTES
  // ============================================================================

  app.get("/api/search", optionalAuth, validateRequest(searchSchema), async (req: any, res) => {
    try {
      const q = String(req.query.q);
      const type = (req.query.type as string) || "all";
      const limit = Number(req.query.limit ?? 20);

      await analyticsService.trackSearch(q, 0, req.user?.id);

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

      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/events/:id", optionalAuth, async (req: any, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/events", authenticate, requireRole(["artist"]), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(400).json({ message: "Artist profile not found" });

      const event = await storage.createEvent({ ...req.body, artistId: artist.id });
      res.json(event);
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
      const products = artistId ? await storage.getProductsByArtist(artistId) : await storage.getAllActiveProducts?.(limit) ?? [];
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", optionalAuth, async (req: any, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", authenticate, requireRole(["artist"]), upload.array("images", 5), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) return res.status(400).json({ message: "Artist profile not found" });

      const files = (req.files as Express.Multer.File[]) || [];
      const images: string[] = [];

      for (const file of files) {
        const upload = await cloudinaryService.uploadImage(file.buffer, { folder: "ruc/products" });
        images.push(upload.secure_url);
      }

      const product = await storage.createProduct({
        ...req.body,
        artistId: artist.id,
        images,
        mainImage: images[0] || null,
      });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ORDER & PAYMENT ROUTES
  // ============================================================================

  app.post("/api/orders", authenticate, async (req: any, res) => {
    try {
      const order = await storage.createOrder({
        ...req.body,
        buyerId: req.user.id,
        orderNumber: `RUC-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
      });

      await emailService.sendOrderConfirmationEmail(req.user.email, order);
      await analyticsService.trackPurchase(order.id, order.totals.total, req.user.id);

      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/me", authenticate, async (req: any, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user.id);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // SUBSCRIPTION ROUTES
  // ============================================================================

  app.get("/api/subscriptions/me", authenticate, async (req: any, res) => {
    try {
      const subscriptions = await storage.getSubscriptionsByFan(req.user.id);
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscriptions", authenticate, async (req: any, res) => {
    try {
      const subscription = await storage.createSubscription({ ...req.body, fanId: req.user.id });
      await analyticsService.trackSubscribe(subscription.artistId.toString(), subscription.tier.name, req.user.id);
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // FILE UPLOAD ROUTES
  // ============================================================================

  app.post("/api/upload/image", authenticate, upload.single("image"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const upload = await cloudinaryService.uploadImage(req.file.buffer, { folder: "ruc/uploads" });
      res.json({ url: upload.secure_url, publicId: upload.public_id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ------------------------ Error handling ------------------------
  app.use(errorHandler);
}
