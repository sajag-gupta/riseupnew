import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
  uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['fan', 'artist', 'admin']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);
export const visibilityEnum = pgEnum('visibility', ['public', 'subscriber_only', 'private']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'cancelled', 'expired', 'paused']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'completed']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'archived']);
export const adStatusEnum = pgEnum('ad_status', ['draft', 'pending', 'active', 'paused', 'completed']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'resolved', 'dismissed']);
export const ticketStatusEnum = pgEnum('ticket_status', ['valid', 'used', 'refunded', 'transferred']);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }),
  role: userRoleEnum("role").default('fan').notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  dateOfBirth: timestamp("date_of_birth"),
  genres: jsonb("genres").$type<string[]>().default([]),
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    website?: string;
  }>().default({}),
  settings: jsonb("settings").$type<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    privacy: {
      showListeningActivity: boolean;
      showPlaylists: boolean;
      allowMessages: boolean;
    };
    adPreferences: {
      personalizedAds: boolean;
      frequency: string;
    };
  }>().default({
    emailNotifications: true,
    pushNotifications: true,
    privacy: {
      showListeningActivity: true,
      showPlaylists: true,
      allowMessages: true,
    },
    adPreferences: {
      personalizedAds: true,
      frequency: 'normal',
    },
  }),
  subscription: jsonb("subscription").$type<{
    isPremium: boolean;
    plan?: string;
    startDate?: Date;
    endDate?: Date;
    autoRenew: boolean;
  }>().default({
    isPremium: false,
    autoRenew: false,
  }),
  analytics: jsonb("analytics").$type<{
    totalPlays: number;
    totalFollowers: number;
    deviceInfo?: object;
  }>().default({
    totalPlays: 0,
    totalFollowers: 0,
  }),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Artists table (extended user data)
export const artists = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  verification: jsonb("verification").$type<{
    status: 'pending' | 'approved' | 'rejected';
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    notes?: string;
    documents?: string[];
  }>().default({
    status: 'pending',
  }),
  stats: jsonb("stats").$type<{
    monthlyListeners: number;
    totalStreams: number;
    totalRevenue: number;
    followerGrowth: { date: Date; count: number }[];
    topCountries: { country: string; percentage: number }[];
  }>().default({
    monthlyListeners: 0,
    totalStreams: 0,
    totalRevenue: 0,
    followerGrowth: [],
    topCountries: [],
  }),
  revenue: jsonb("revenue").$type<{
    subscriptions: number;
    merchandise: number;
    events: number;
    ads: number;
    tips: number;
  }>().default({
    subscriptions: 0,
    merchandise: 0,
    events: 0,
    ads: 0,
    tips: 0,
  }),
  payout: jsonb("payout").$type<{
    bankDetails?: object;
    paypalEmail?: string;
    taxInfo?: object;
    pendingAmount: number;
    lastPayoutDate?: Date;
    payoutHistory: object[];
  }>().default({
    pendingAmount: 0,
    payoutHistory: [],
  }),
  featured: boolean("featured").default(false),
  trendingScore: decimal("trending_score", { precision: 10, scale: 2 }).default('0'),
  followers: jsonb("followers").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Albums table
export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  description: text("description"),
  releaseDate: timestamp("release_date"),
  type: varchar("type", { length: 50 }).default('album'), // album, ep, single
  artwork: varchar("artwork", { length: 500 }),
  genres: jsonb("genres").$type<string[]>().default([]),
  totalDuration: integer("total_duration").default(0),
  price: decimal("price", { precision: 10, scale: 2 }),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Songs table
export const songs = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  albumId: uuid("album_id").references(() => albums.id),
  collaborators: jsonb("collaborators").$type<string[]>().default([]),
  genre: varchar("genre", { length: 100 }),
  subGenres: jsonb("sub_genres").$type<string[]>().default([]),
  duration: integer("duration").notNull(), // in seconds
  releaseDate: timestamp("release_date").defaultNow(),
  files: jsonb("files").$type<{
    audioUrl: string;
    audioFileId: string;
    artworkUrl?: string;
    artworkFileId?: string;
    waveformData?: number[];
  }>().notNull(),
  metadata: jsonb("metadata").$type<{
    bpm?: number;
    key?: string;
    mood?: string;
    energy?: number;
    danceability?: number;
    tags?: string[];
    lyrics?: string;
    credits?: { role: string; name: string }[];
  }>().default({}),
  visibility: visibilityEnum("visibility").default('public'),
  monetization: jsonb("monetization").$type<{
    isMonetized: boolean;
    adEnabled: boolean;
    price?: number;
    royaltySplit?: { collaborator: string; percentage: number }[];
  }>().default({
    isMonetized: false,
    adEnabled: true,
  }),
  analytics: jsonb("analytics").$type<{
    playCount: number;
    uniqueListeners: number;
    likeCount: number;
    shareCount: number;
    downloadCount: number;
    trendingScore: number;
    demographics?: object;
    playHistory: { date: Date; plays: number }[];
  }>().default({
    playCount: 0,
    uniqueListeners: 0,
    likeCount: 0,
    shareCount: 0,
    downloadCount: 0,
    trendingScore: 0,
    playHistory: [],
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Playlists table
export const playlists = pgTable("playlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  songs: jsonb("songs").$type<string[]>().default([]),
  coverArt: varchar("cover_art", { length: 500 }),
  isPublic: boolean("is_public").default(false),
  isCollaborative: boolean("is_collaborative").default(false),
  collaborators: jsonb("collaborators").$type<string[]>().default([]),
  analytics: jsonb("analytics").$type<{
    playCount: number;
    likeCount: number;
    shareCount: number;
    followerCount: number;
  }>().default({
    playCount: 0,
    likeCount: 0,
    shareCount: 0,
    followerCount: 0,
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions table (fan to artist)
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fanId: uuid("fan_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  tier: jsonb("tier").$type<{
    name: string;
    price: number;
    currency: string;
    interval: string; // monthly/yearly
    perks: string[];
  }>().notNull(),
  status: subscriptionStatusEnum("status").default('active'),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  nextBillDate: timestamp("next_bill_date"),
  payment: jsonb("payment").$type<{
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;
    paymentMethod?: object;
  }>().default({}),
  analytics: jsonb("analytics").$type<{
    totalPaid: number;
    renewalCount: number;
    engagementScore: number;
  }>().default({
    totalPaid: 0,
    renewalCount: 0,
    engagementScore: 0,
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table (merchandise)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  images: jsonb("images").$type<string[]>().default([]),
  mainImage: varchar("main_image", { length: 500 }),
  variants: jsonb("variants").$type<{
    name: string;
    options: string[];
    priceModifier: number;
    stock: number;
  }[]>().default([]),
  inventory: jsonb("inventory").$type<{
    totalStock: number;
    soldCount: number;
    lowStockThreshold: number;
    isInStock: boolean;
  }>().default({
    totalStock: 0,
    soldCount: 0,
    lowStockThreshold: 5,
    isInStock: true,
  }),
  shipping: jsonb("shipping").$type<{
    dimensions: { length: number; width: number; height: number };
    weight: number;
    shippingRates: { region: string; rate: number }[];
    processingTime: string;
  }>().default({
    dimensions: { length: 0, width: 0, height: 0 },
    weight: 0,
    shippingRates: [],
    processingTime: '1-3 business days',
  }),
  seo: jsonb("seo").$type<{
    tags: string[];
    metaDescription?: string;
  }>().default({
    tags: [],
  }),
  analytics: jsonb("analytics").$type<{
    viewCount: number;
    addToCartCount: number;
    purchaseCount: number;
    revenue: number;
    conversionRate: number;
  }>().default({
    viewCount: 0,
    addToCartCount: 0,
    purchaseCount: 0,
    revenue: 0,
    conversionRate: 0,
  }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  collaborators: jsonb("collaborators").$type<string[]>().default([]),
  dateTime: timestamp("date_time").notNull(),
  endDateTime: timestamp("end_date_time"),
  timezone: varchar("timezone", { length: 50 }).default('UTC'),
  venue: jsonb("venue").$type<{
    name: string;
    address: object;
    capacity?: number;
    coordinates?: { lat: number; lng: number };
  }>().notNull(),
  isOnline: boolean("is_online").default(false),
  streamUrl: varchar("stream_url", { length: 500 }),
  ticketTypes: jsonb("ticket_types").$type<{
    name: string;
    description: string;
    price: number;
    currency: string;
    capacity: number;
    sold: number;
    salesStartDate?: Date;
    salesEndDate?: Date;
    perks: string[];
  }[]>().default([]),
  media: jsonb("media").$type<{
    bannerImage?: string;
    gallery?: string[];
    promoVideo?: string;
  }>().default({}),
  settings: jsonb("settings").$type<{
    ageRestriction?: number;
    dresscode?: string;
    refundPolicy?: string;
    transferPolicy?: string;
  }>().default({}),
  analytics: jsonb("analytics").$type<{
    viewCount: number;
    interestedCount: number;
    ticketsSold: number;
    revenue: number;
    attendance?: number;
    satisfaction?: number;
  }>().default({
    viewCount: 0,
    interestedCount: 0,
    ticketsSold: 0,
    revenue: 0,
  }),
  status: eventStatusEnum("status").default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  buyerId: uuid("buyer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  items: jsonb("items").$type<{
    productId?: string;
    eventId?: string;
    variant?: string;
    quantity: number;
    price: number;
    artistId: string;
  }[]>().notNull(),
  totals: jsonb("totals").$type<{
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  }>().notNull(),
  shipping: jsonb("shipping").$type<{
    address: {
      fullName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone: string;
    };
    method: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: Date;
  }>(),
  payment: jsonb("payment").$type<{
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    method: string;
    status: string;
    paidAt?: Date;
  }>().notNull(),
  status: orderStatusEnum("status").default('pending'),
  timeline: jsonb("timeline").$type<{
    status: string;
    timestamp: Date;
    note?: string;
  }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  buyerId: uuid("buyer_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  ticketType: varchar("ticket_type", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  qrCode: varchar("qr_code", { length: 500 }),
  ticketNumber: varchar("ticket_number", { length: 50 }).unique().notNull(),
  seatInfo: jsonb("seat_info").$type<{
    section?: string;
    row?: string;
    seat?: string;
  }>().default({}),
  status: ticketStatusEnum("status").default('valid'),
  usedAt: timestamp("used_at"),
  transferredTo: uuid("transferred_to").references(() => users.id),
  payment: jsonb("payment").$type<{
    razorpayPaymentId?: string;
    purchaseDate: Date;
    refundId?: string;
  }>().notNull(),
  additionalInfo: jsonb("additional_info").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blogs table
export const blogs = pgTable("blogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  featuredImage: varchar("featured_image", { length: 500 }),
  gallery: jsonb("gallery").$type<string[]>().default([]),
  embeddedMedia: jsonb("embedded_media").$type<{
    type: string;
    url: string;
    metadata?: object;
  }[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  category: varchar("category", { length: 100 }),
  visibility: visibilityEnum("visibility").default('public'),
  seo: jsonb("seo").$type<{
    metaTitle?: string;
    metaDescription?: string;
    slug: string;
  }>().notNull(),
  engagement: jsonb("engagement").$type<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    readTime: number;
  }>().default({
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    readTime: 0,
  }),
  status: contentStatusEnum("status").default('draft'),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog comments table
export const blogComments = pgTable("blog_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  blogId: uuid("blog_id").references(() => blogs.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id").references(() => blogComments.id),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ads table
export const ads = pgTable("ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaign: jsonb("campaign").$type<{
    name: string;
    advertiser: string;
    contactEmail: string;
    budget: number;
    dailyBudget?: number;
    currency: string;
  }>().notNull(),
  creative: jsonb("creative").$type<{
    type: 'audio' | 'banner' | 'video';
    audioFile?: string;
    bannerImage?: string;
    videoFile?: string;
    duration?: number;
    clickUrl?: string;
    callToAction?: string;
  }>().notNull(),
  targeting: jsonb("targeting").$type<{
    demographics: {
      ageRange?: { min: number; max: number };
      gender?: string[];
      locations?: string[];
      languages?: string[];
    };
    interests: {
      genres?: string[];
      artistTypes?: string[];
      behaviors?: string[];
    };
    schedule: {
      startDate: Date;
      endDate: Date;
      dayParting?: object;
      timezone: string;
    };
  }>().notNull(),
  performance: jsonb("performance").$type<{
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpm: number;
    completionRate: number;
  }>().default({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    ctr: 0,
    cpm: 0,
    completionRate: 0,
  }),
  status: adStatusEnum("status").default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics table
export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventData: jsonb("event_data").$type<{
    action: string;
    category: string;
    label?: string;
    value?: number;
    metadata?: object;
  }>().notNull(),
  context: jsonb("context").$type<{
    page: string;
    userAgent?: string;
    deviceType?: string;
    location?: object;
    referrer?: string;
  }>().notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientId: uuid("recipient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  actionUrl: varchar("action_url", { length: 500 }),
  priority: varchar("priority", { length: 20 }).default('medium'), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports table
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // song, blog, comment, user, event
  contentId: uuid("content_id").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  description: text("description"),
  status: reportStatusEnum("status").default('pending'),
  moderatorId: uuid("moderator_id").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  action: varchar("action", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Follows table (user follows artist)
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followingId: uuid("following_id").references(() => artists.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes table (user likes song)
export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  songId: uuid("song_id").references(() => songs.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  artist: one(artists, {
    fields: [users.id],
    references: [artists.userId],
  }),
  playlists: many(playlists),
  subscriptions: many(subscriptions),
  orders: many(orders),
  tickets: many(tickets),
  blogs: many(blogs),
  blogComments: many(blogComments),
  notifications: many(notifications),
  reports: many(reports),
  follows: many(follows),
  likes: many(likes),
}));

export const artistsRelations = relations(artists, ({ one, many }) => ({
  user: one(users, {
    fields: [artists.userId],
    references: [users.id],
  }),
  albums: many(albums),
  songs: many(songs),
  products: many(products),
  events: many(events),
  subscriptions: many(subscriptions),
  follows: many(follows),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistId],
    references: [artists.id],
  }),
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one }) => ({
  artist: one(artists, {
    fields: [songs.artistId],
    references: [artists.id],
  }),
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.id],
  }),
}));

export const playlistsRelations = relations(playlists, ({ one }) => ({
  owner: one(users, {
    fields: [playlists.ownerId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  fan: one(users, {
    fields: [subscriptions.fanId],
    references: [users.id],
  }),
  artist: one(artists, {
    fields: [subscriptions.artistId],
    references: [artists.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  artist: one(artists, {
    fields: [products.artistId],
    references: [artists.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  artist: one(artists, {
    fields: [events.artistId],
    references: [artists.id],
  }),
  tickets: many(tickets),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  buyer: one(users, {
    fields: [tickets.buyerId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [tickets.orderId],
    references: [orders.id],
  }),
}));

export const blogsRelations = relations(blogs, ({ one, many }) => ({
  author: one(users, {
    fields: [blogs.authorId],
    references: [users.id],
  }),
  comments: many(blogComments),
}));

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
  blog: one(blogs, {
    fields: [blogComments.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [blogComments.userId],
    references: [users.id],
  }),
  parent: one(blogComments, {
    fields: [blogComments.parentId],
    references: [blogComments.id],
  }),
  replies: many(blogComments),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  moderator: one(users, {
    fields: [reports.moderatorId],
    references: [users.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
  }),
  following: one(artists, {
    fields: [follows.followingId],
    references: [artists.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [likes.songId],
    references: [songs.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActive: true,
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogSchema = createInsertSchema(blogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdSchema = createInsertSchema(ads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = z.infer<typeof insertArtistSchema>;

export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Blog = typeof blogs.$inferSelect;
export type InsertBlog = z.infer<typeof insertBlogSchema>;

export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;

export type Ad = typeof ads.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
