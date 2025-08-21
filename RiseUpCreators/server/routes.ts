import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService } from "./auth";
import { authenticate, requireRole, optionalAuth, validateRequest, rateLimiter, errorHandler } from "./middleware";
import { cloudinaryService } from "./services/cloudinary";
import { emailService } from "./services/email";
import { analyticsService } from "./services/analytics";
import { 
  insertUserSchema, 
  insertSongSchema, 
  insertAlbumSchema,
  insertPlaylistSchema,
  insertProductSchema,
  insertEventSchema,
  insertOrderSchema,
  insertSubscriptionSchema,
  insertBlogSchema,
  insertReportSchema,
  insertAdSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import QRCode from "qrcode";

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
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
  role: z.enum(['fan', 'artist']).optional(),
});

const searchSchema = z.object({
  q: z.string().min(1),
  type: z.enum(['all', 'songs', 'artists', 'events', 'products']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting
  app.use('/api/auth', rateLimiter(15 * 60 * 1000, 5)); // 5 requests per 15 minutes for auth
  app.use('/api', rateLimiter(60 * 1000, 100)); // 100 requests per minute for API

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  app.post('/api/auth/register', validateRequest(registerSchema), async (req, res) => {
    try {
      const { email, password, name, role = 'fan' } = req.body;
      const { user, token } = await authService.register(email, password, name, role);
      
      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.name, user.role);
      
      // Track signup
      await analyticsService.trackSignup(user.role, user.id);
      
      res.json({ user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', validateRequest(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      
      // Track login
      await analyticsService.trackLogin(user.id);
      
      res.json({ user, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/auth/me', authenticate, async (req: any, res) => {
    res.json(req.user);
  });

  app.post('/api/auth/logout', authenticate, async (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  // ============================================================================
  // USER ROUTES
  // ============================================================================

  app.get('/api/users/profile', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get artist profile if user is artist
      let artist = null;
      if (user.role === 'artist') {
        artist = await storage.getArtistByUserId(user.id);
      }

      res.json({ user, artist });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/users/profile', authenticate, async (req: any, res) => {
    try {
      const updates = req.body;
      const updatedUser = await storage.updateUser(req.user.id, updates);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/users/notifications', authenticate, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/users/notifications/:id/read', authenticate, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ARTIST ROUTES
  // ============================================================================

  app.get('/api/artists', optionalAuth, async (req: any, res) => {
    try {
      const { featured } = req.query;
      let artists;
      
      if (featured === 'true') {
        artists = await storage.getFeaturedArtists(12);
      } else {
        artists = await storage.getFeaturedArtists(50);
      }
      
      res.json(artists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/artists/:id', optionalAuth, async (req: any, res) => {
    try {
      const artist = await storage.getArtist(req.params.id);
      if (!artist) {
        return res.status(404).json({ message: 'Artist not found' });
      }

      // Get artist's songs, products, events
      const [songs, products, events] = await Promise.all([
        storage.getSongsByArtist(req.params.id, 20),
        storage.getProductsByArtist(req.params.id),
        storage.getEventsByArtist(req.params.id),
      ]);

      // Check if current user follows this artist
      let isFollowing = false;
      if (req.user) {
        isFollowing = await storage.isFollowing(req.user.id, req.params.id);
      }

      res.json({ artist, songs, products, events, isFollowing });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/artists/:id/follow', authenticate, async (req: any, res) => {
    try {
      await storage.followArtist(req.user.id, req.params.id);
      
      // Track follow
      await analyticsService.trackFollow(req.params.id, req.user.id);
      
      res.json({ message: 'Artist followed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/artists/:id/follow', authenticate, async (req: any, res) => {
    try {
      await storage.unfollowArtist(req.user.id, req.params.id);
      res.json({ message: 'Artist unfollowed successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // SONG ROUTES
  // ============================================================================

  app.get('/api/songs', optionalAuth, async (req: any, res) => {
    try {
      const { trending, artistId, limit = 20 } = req.query;
      let songs;
      
      if (trending === 'true') {
        songs = await storage.getTrendingSongs(parseInt(limit));
      } else if (artistId) {
        songs = await storage.getSongsByArtist(artistId, parseInt(limit));
      } else {
        songs = await storage.getTrendingSongs(parseInt(limit));
      }
      
      res.json(songs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/songs/:id', optionalAuth, async (req: any, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }

      // Check if current user likes this song
      let isLiked = false;
      if (req.user) {
        isLiked = await storage.isLiked(req.user.id, req.params.id);
      }

      res.json({ song, isLiked });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/songs', authenticate, requireRole(['artist']), upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'artwork', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.audio || !files.audio[0]) {
        return res.status(400).json({ message: 'Audio file is required' });
      }

      // Get artist profile
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) {
        return res.status(400).json({ message: 'Artist profile not found' });
      }

      // Upload audio file
      const audioBuffer = files.audio[0].buffer;
      const audioUpload = await cloudinaryService.uploadAudio(audioBuffer, {
        folder: 'ruc/songs',
      });

      // Upload artwork if provided
      let artworkUpload = null;
      if (files.artwork && files.artwork[0]) {
        const artworkBuffer = files.artwork[0].buffer;
        artworkUpload = await cloudinaryService.uploadArtwork(artworkBuffer, {
          folder: 'ruc/artwork',
        });
      }

      // Generate waveform data
      const waveformData = await cloudinaryService.generateWaveform(audioUpload.secure_url);

      // Create song
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
  });

  app.post('/api/songs/:id/play', optionalAuth, async (req: any, res) => {
    try {
      // Track play event
      await analyticsService.trackPlay(req.params.id, req.user?.id);
      
      // Update song play count
      const song = await storage.getSong(req.params.id);
      if (song) {
        const updatedAnalytics = {
          ...song.analytics,
          playCount: (song.analytics?.playCount || 0) + 1,
        };
        await storage.updateSong(req.params.id, { analytics: updatedAnalytics });
      }
      
      res.json({ message: 'Play tracked successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/songs/:id/like', authenticate, async (req: any, res) => {
    try {
      await storage.likeSong(req.user.id, req.params.id);
      
      // Track like
      await analyticsService.trackLike(req.params.id, req.user.id);
      
      res.json({ message: 'Song liked successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/songs/:id/like', authenticate, async (req: any, res) => {
    try {
      await storage.unlikeSong(req.user.id, req.params.id);
      res.json({ message: 'Song unliked successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PLAYLIST ROUTES
  // ============================================================================

  app.get('/api/playlists/me', authenticate, async (req: any, res) => {
    try {
      const playlists = await storage.getPlaylistsByUser(req.user.id);
      res.json(playlists);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/playlists', authenticate, validateRequest(insertPlaylistSchema), async (req: any, res) => {
    try {
      const playlistData = {
        ...req.body,
        ownerId: req.user.id,
      };
      const playlist = await storage.createPlaylist(playlistData);
      res.json(playlist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/playlists/:id', optionalAuth, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      // Check if user owns playlist or it's public
      if (!playlist.isPublic && (!req.user || playlist.ownerId !== req.user.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(playlist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // SEARCH ROUTES
  // ============================================================================

  app.get('/api/search', optionalAuth, validateRequest(searchSchema), async (req: any, res) => {
    try {
      const { q, type = 'all', limit = 20 } = req.query;
      
      // Track search
      await analyticsService.trackSearch(q, 0, req.user?.id);
      
      const results: any = {};
      
      if (type === 'all' || type === 'songs') {
        results.songs = await storage.searchSongs(q, limit);
      }
      
      if (type === 'all' || type === 'artists') {
        results.artists = await storage.searchArtists(q, limit);
      }
      
      if (type === 'all' || type === 'events') {
        results.events = await storage.searchEvents(q, limit);
      }
      
      if (type === 'all' || type === 'products') {
        results.products = await storage.searchProducts(q, limit);
      }
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // EVENT ROUTES
  // ============================================================================

  app.get('/api/events', optionalAuth, async (req: any, res) => {
    try {
      const { upcoming, artistId, limit = 20 } = req.query;
      let events;
      
      if (upcoming === 'true') {
        events = await storage.getUpcomingEvents(parseInt(limit));
      } else if (artistId) {
        events = await storage.getEventsByArtist(artistId);
      } else {
        events = await storage.getUpcomingEvents(parseInt(limit));
      }
      
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/events/:id', optionalAuth, async (req: any, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/events', authenticate, requireRole(['artist']), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) {
        return res.status(400).json({ message: 'Artist profile not found' });
      }

      const eventData = {
        ...req.body,
        artistId: artist.id,
      };

      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PRODUCT ROUTES
  // ============================================================================

  app.get('/api/products', optionalAuth, async (req: any, res) => {
    try {
      const { artistId, limit = 20 } = req.query;
      let products;
      
      if (artistId) {
        products = await storage.getProductsByArtist(artistId);
      } else {
        // Get all active products (implement in storage)
        products = [];
      }
      
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/products/:id', optionalAuth, async (req: any, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/products', authenticate, requireRole(['artist']), upload.array('images', 5), async (req: any, res) => {
    try {
      const artist = await storage.getArtistByUserId(req.user.id);
      if (!artist) {
        return res.status(400).json({ message: 'Artist profile not found' });
      }

      const files = req.files as Express.Multer.File[];
      const images = [];

      // Upload product images
      for (const file of files) {
        const upload = await cloudinaryService.uploadImage(file.buffer, {
          folder: 'ruc/products',
        });
        images.push(upload.secure_url);
      }

      const productData = {
        ...req.body,
        artistId: artist.id,
        images,
        mainImage: images[0] || null,
      };

      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ORDER & PAYMENT ROUTES
  // ============================================================================

  app.post('/api/orders', authenticate, async (req: any, res) => {
    try {
      const orderData = {
        ...req.body,
        buyerId: req.user.id,
        orderNumber: `RUC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };

      const order = await storage.createOrder(orderData);
      
      // Send order confirmation email
      await emailService.sendOrderConfirmationEmail(req.user.email, order);
      
      // Track purchase
      await analyticsService.trackPurchase(order.id, order.totals.total, req.user.id);
      
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/orders/me', authenticate, async (req: any, res) => {
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

  app.get('/api/subscriptions/me', authenticate, async (req: any, res) => {
    try {
      const subscriptions = await storage.getSubscriptionsByFan(req.user.id);
      res.json(subscriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/subscriptions', authenticate, async (req: any, res) => {
    try {
      const subscriptionData = {
        ...req.body,
        fanId: req.user.id,
      };

      const subscription = await storage.createSubscription(subscriptionData);
      
      // Track subscription
      await analyticsService.trackSubscribe(subscription.artistId, subscription.tier.name, req.user.id);
      
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================

  app.post('/api/analytics/track', optionalAuth, async (req: any, res) => {
    try {
      const eventData = {
        ...req.body,
        userId: req.user?.id,
        userAgent: req.headers['user-agent'],
      };
      
      await analyticsService.track(eventData);
      res.json({ message: 'Event tracked successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/analytics/dashboard', authenticate, async (req: any, res) => {
    try {
      const isArtist = req.user.role === 'artist';
      const stats = await analyticsService.getDashboardStats(req.user.id, isArtist);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  app.get('/api/admin/dashboard', authenticate, requireRole(['admin']), async (req: any, res) => {
    try {
      // Get platform-wide statistics
      const stats = {
        totalUsers: 0,
        totalArtists: 0,
        totalSongs: 0,
        totalRevenue: 0,
        // These would need to be implemented in storage
      };
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/reports', authenticate, requireRole(['admin']), async (req: any, res) => {
    try {
      const { status } = req.query;
      const reports = await storage.getReports(status as string);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // FILE UPLOAD ROUTES
  // ============================================================================

  app.post('/api/upload/image', authenticate, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const upload = await cloudinaryService.uploadImage(req.file.buffer, {
        folder: 'ruc/uploads',
      });

      res.json({
        url: upload.secure_url,
        publicId: upload.public_id,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Error handling middleware
  app.use(errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}
