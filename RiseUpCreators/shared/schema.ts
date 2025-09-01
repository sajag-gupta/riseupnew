import { z } from "zod";
import { ObjectId } from "mongodb";

// -----------------------------
// 🔹 Custom ObjectId Validation
// -----------------------------
export const ObjectIdType = z.string().refine(value => ObjectId.isValid(value), {
  message: "Invalid ObjectId format",
});

// -----------------------------
// 🔹 User Schema (Fans + Artists + Admins)
// -----------------------------
export const userSchema = z.object({
  _id: ObjectIdType,
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["fan", "artist", "admin"]),
  passwordHash: z.string(),
  avatarUrl: z.string().optional(),

  // Fan-related fields
  subscriptions: z.array(z.object({
    artistId: ObjectIdType,   // Reference to User (role=artist)
    tier: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    active: z.boolean()
  })).default([]),

  favorites: z.object({
    artists: z.array(ObjectIdType).default([]),  // Reference to User (role=artist)
    songs: z.array(ObjectIdType).default([]),    // Reference to Song
    events: z.array(ObjectIdType).default([])    // Reference to Event
  }).default({ artists: [], songs: [], events: [] }),

  playlists: z.array(z.object({
    name: z.string(),
    songs: z.array(ObjectIdType).default([]),    // Reference to Song
    createdAt: z.date()
  })).default([]),

  following: z.array(ObjectIdType).default([]),  // Reference to User (role=artist)

  adPreference: z.object({
    personalized: z.boolean(),
    categories: z.array(z.string())
  }).default({ personalized: true, categories: [] }),

  plan: z.object({
    type: z.enum(["FREE", "PREMIUM"]),
    renewsAt: z.date().optional()
  }).default({ type: "FREE" }),

  // Artist-only fields (applies only if role = artist)
  artist: z.object({
    bio: z.string().optional(),
    socialLinks: z.object({
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      x: z.string().optional(),
      website: z.string().optional()
    }).default({}),
    followers: z.array(ObjectIdType).default([]),   // Reference to User
    totalPlays: z.number().default(0),
    totalLikes: z.number().default(0),
    revenue: z.object({
      subscriptions: z.number().default(0),
      merch: z.number().default(0),
      events: z.number().default(0),
      ads: z.number().default(0),
    }).default({}),
    trendingScore: z.number().default(0),
    featured: z.boolean().default(false),
    verified: z.boolean().default(false),
  }).optional(),

  createdAt: z.date().default(() => new Date()),
  lastLogin: z.date().optional()
});

export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true });

// -----------------------------
// 🔹 Song Schema
// -----------------------------
export const songSchema = z.object({
  _id: ObjectIdType,
  artistId: ObjectIdType, // Reference to User (role=artist)
  title: z.string(),
  genre: z.string(),
  fileUrl: z.string(),
  artworkUrl: z.string(),
  durationSec: z.number(),
  plays: z.number().default(0),
  uniqueListeners: z.number().default(0),
  likes: z.number().default(0),
  shares: z.number().default(0),
  reviews: z.array(z.object({
    userId: ObjectIdType,  // Reference to User
    rating: z.number().min(1).max(5),
    comment: z.string(),
    createdAt: z.date()
  })).default([]),
  visibility: z.enum(["PUBLIC", "SUBSCRIBER_ONLY"]).default("PUBLIC"),
  adEnabled: z.boolean().default(true),
  createdAt: z.date().default(() => new Date())
});

export const insertSongSchema = songSchema.omit({ _id: true, createdAt: true });

// -----------------------------
// 🔹 Merch Schema
// -----------------------------
export const merchSchema = z.object({
  _id: ObjectIdType,
  artistId: ObjectIdType,  // Reference to User (role=artist)
  name: z.string(),
  description: z.string(),
  price: z.number(),
  stock: z.number(),
  images: z.array(z.string()),
  category: z.string().optional(),
  orders: z.array(ObjectIdType).default([]),  // Reference to Order
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const insertMerchSchema = merchSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// -----------------------------
// 🔹 Event Schema
// -----------------------------
export const eventSchema = z.object({
  _id: ObjectIdType,
  artistId: ObjectIdType,  // Reference to User (role=artist)
  title: z.string(),
  description: z.string(),
  date: z.date(),
  location: z.string(),
  onlineUrl: z.string().optional(),
  ticketPrice: z.number(),
  capacity: z.number().optional(),
  imageUrl: z.string().optional(),
  attendees: z.array(ObjectIdType).default([]),  // Reference to User
  createdAt: z.date().default(() => new Date())
});

export const insertEventSchema = eventSchema.omit({ _id: true, createdAt: true });

// -----------------------------
// 🔹 Order Schema
// -----------------------------
export const orderSchema = z.object({
  _id: ObjectIdType,
  userId: ObjectIdType,  // Reference to User
  type: z.enum(["MERCH", "TICKET", "MIXED"]),
  items: z.array(z.object({
    merchId: ObjectIdType.optional(),  // Reference to Merch
    eventId: ObjectIdType.optional(),  // Reference to Event
    qty: z.number(),
    unitPrice: z.number()
  })),
  totalAmount: z.number(),
  currency: z.string().default("INR"),
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).default("PENDING"),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  shippingAddress: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    phone: z.string()
  }).optional(),
  qrTicketUrl: z.string().optional(),
  invoiceUrl: z.string().optional(),
  createdAt: z.date().default(() => new Date())
});

export const insertOrderSchema = orderSchema.omit({ _id: true, createdAt: true });

// -----------------------------
// 🔹 Subscription Schema
// -----------------------------
export const subscriptionSchema = z.object({
  _id: ObjectIdType,
  fanId: ObjectIdType,    // Reference to User (role=fan)
  artistId: ObjectIdType, // Reference to User (role=artist)
  tier: z.enum(["BRONZE", "SILVER", "GOLD"]),
  amount: z.number(),
  currency: z.string().default("INR"),
  startDate: z.date(),
  endDate: z.date(),
  active: z.boolean().default(true),
  razorpaySubId: z.string().optional(),
  createdAt: z.date().default(() => new Date())
});

export const insertSubscriptionSchema = subscriptionSchema.omit({ _id: true, createdAt: true });

// -----------------------------
// 🔹 Analytics Schema
// -----------------------------
export const analyticsSchema = z.object({
  _id: ObjectIdType,
  userId: ObjectIdType.optional(),   // Reference to User
  artistId: ObjectIdType.optional(), // Reference to User (role=artist)
  songId: ObjectIdType.optional(),   // Reference to Song
  merchId: ObjectIdType.optional(),  // Reference to Merch
  eventId: ObjectIdType.optional(),  // Reference to Event
  action: z.enum([
    "play", "like", "share", "purchase", "review", "follow", "subscribe",
    "ad_impression", "ad_click", "ad_complete", "search", "view"
  ]),
  context: z.enum(["home", "profile", "discover", "player", "cart", "admin"]),
  value: z.number().optional(),
  metadata: z.object({
    device: z.string().optional(),
    ipRegion: z.string().optional(),
    sessionId: z.string().optional(),
    referrer: z.string().optional()
  }).default({}),
  timestamp: z.date().default(() => new Date())
});

export const insertAnalyticsSchema = analyticsSchema.omit({ _id: true, timestamp: true });

// -----------------------------
// 🔹 Blog Schema
// -----------------------------
export const blogSchema = z.object({
  _id: ObjectIdType,
  artistId: ObjectIdType,  // Reference to User (role=artist)
  title: z.string(),
  content: z.string(),
  visibility: z.enum(["PUBLIC", "SUBSCRIBER_ONLY"]).default("PUBLIC"),
  images: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const insertBlogSchema = blogSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// -----------------------------
// 🔹 Type Exports
// -----------------------------
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Song = z.infer<typeof songSchema>;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Merch = z.infer<typeof merchSchema>;
export type InsertMerch = z.infer<typeof insertMerchSchema>;
export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Analytics = z.infer<typeof analyticsSchema>;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Blog = z.infer<typeof blogSchema>;
export type InsertBlog = z.infer<typeof insertBlogSchema>;
