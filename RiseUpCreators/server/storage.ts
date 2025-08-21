import {
  users,
  artists,
  songs,
  albums,
  playlists,
  subscriptions,
  products,
  events,
  orders,
  tickets,
  blogs,
  blogComments,
  ads,
  analytics,
  notifications,
  reports,
  follows,
  likes,
  type User,
  type InsertUser,
  type Artist,
  type InsertArtist,
  type Song,
  type InsertSong,
  type Album,
  type InsertAlbum,
  type Playlist,
  type InsertPlaylist,
  type Subscription,
  type InsertSubscription,
  type Product,
  type InsertProduct,
  type Event,
  type InsertEvent,
  type Order,
  type InsertOrder,
  type Ticket,
  type InsertTicket,
  type Blog,
  type InsertBlog,
  type BlogComment,
  type InsertBlogComment,
  type Ad,
  type InsertAd,
  type Analytics,
  type InsertAnalytics,
  type Notification,
  type InsertNotification,
  type Report,
  type InsertReport,
  type Follow,
  type InsertFollow,
  type Like,
  type InsertLike,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, sql, count, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Artist operations
  getArtist(id: string): Promise<Artist | undefined>;
  getArtistByUserId(userId: string): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist>;
  getFeaturedArtists(limit?: number): Promise<Artist[]>;
  searchArtists(query: string, limit?: number): Promise<Artist[]>;

  // Song operations
  getSong(id: string): Promise<Song | undefined>;
  getSongsByArtist(artistId: string, limit?: number): Promise<Song[]>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: string, updates: Partial<InsertSong>): Promise<Song>;
  deleteSong(id: string): Promise<void>;
  getTrendingSongs(limit?: number): Promise<Song[]>;
  searchSongs(query: string, limit?: number): Promise<Song[]>;

  // Album operations
  getAlbum(id: string): Promise<Album | undefined>;
  getAlbumsByArtist(artistId: string): Promise<Album[]>;
  createAlbum(album: InsertAlbum): Promise<Album>;
  updateAlbum(id: string, updates: Partial<InsertAlbum>): Promise<Album>;
  deleteAlbum(id: string): Promise<void>;

  // Playlist operations
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<Playlist>;
  deletePlaylist(id: string): Promise<void>;

  // Subscription operations
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionsByFan(fanId: string): Promise<Subscription[]>;
  getSubscriptionsByArtist(artistId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription>;
  cancelSubscription(id: string): Promise<void>;

  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByArtist(artistId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string, limit?: number): Promise<Product[]>;

  // Event operations
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByArtist(artistId: string): Promise<Event[]>;
  getUpcomingEvents(limit?: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  searchEvents(query: string, limit?: number): Promise<Event[]>;

  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;

  // Ticket operations
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketsByUser(userId: string): Promise<Ticket[]>;
  getTicketsByEvent(eventId: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket>;

  // Blog operations
  getBlog(id: string): Promise<Blog | undefined>;
  getBlogsByAuthor(authorId: string): Promise<Blog[]>;
  getPublishedBlogs(limit?: number): Promise<Blog[]>;
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: string, updates: Partial<InsertBlog>): Promise<Blog>;
  deleteBlog(id: string): Promise<void>;

  // Blog comment operations
  getBlogComment(id: string): Promise<BlogComment | undefined>;
  getBlogCommentsByBlog(blogId: string): Promise<BlogComment[]>;
  createBlogComment(comment: InsertBlogComment): Promise<BlogComment>;
  updateBlogComment(id: string, updates: Partial<InsertBlogComment>): Promise<BlogComment>;
  deleteBlogComment(id: string): Promise<void>;

  // Follow operations
  followArtist(followerId: string, artistId: string): Promise<Follow>;
  unfollowArtist(followerId: string, artistId: string): Promise<void>;
  getFollowedArtists(userId: string): Promise<Artist[]>;
  isFollowing(followerId: string, artistId: string): Promise<boolean>;

  // Like operations
  likeSong(userId: string, songId: string): Promise<Like>;
  unlikeSong(userId: string, songId: string): Promise<void>;
  getLikedSongs(userId: string): Promise<Song[]>;
  isLiked(userId: string, songId: string): Promise<boolean>;

  // Analytics operations
  trackEvent(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalytics(filters: { userId?: string; eventType?: string; startDate?: Date; endDate?: Date }): Promise<Analytics[]>;

  // Notification operations
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Report operations
  getReport(id: string): Promise<Report | undefined>;
  getReports(status?: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<InsertReport>): Promise<Report>;

  // Ad operations
  getAd(id: string): Promise<Ad | undefined>;
  getActiveAds(): Promise<Ad[]>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: string, updates: Partial<InsertAd>): Promise<Ad>;
  deleteAd(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Artist operations
  async getArtist(id: string): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist;
  }

  async getArtistByUserId(userId: string): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.userId, userId));
    return artist;
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [newArtist] = await db.insert(artists).values(artist).returning();
    return newArtist;
  }

  async updateArtist(id: string, updates: Partial<InsertArtist>): Promise<Artist> {
    const [updatedArtist] = await db
      .update(artists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(artists.id, id))
      .returning();
    return updatedArtist;
  }

  async getFeaturedArtists(limit = 10): Promise<Artist[]> {
    return await db
      .select()
      .from(artists)
      .where(eq(artists.featured, true))
      .orderBy(desc(artists.trendingScore))
      .limit(limit);
  }

  async searchArtists(query: string, limit = 20): Promise<Artist[]> {
    return await db
      .select()
      .from(artists)
      .innerJoin(users, eq(artists.userId, users.id))
      .where(ilike(users.name, `%${query}%`))
      .limit(limit);
  }

  // Song operations
  async getSong(id: string): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song;
  }

  async getSongsByArtist(artistId: string, limit = 50): Promise<Song[]> {
    return await db
      .select()
      .from(songs)
      .where(eq(songs.artistId, artistId))
      .orderBy(desc(songs.createdAt))
      .limit(limit);
  }

  async createSong(song: InsertSong): Promise<Song> {
    const [newSong] = await db.insert(songs).values(song).returning();
    return newSong;
  }

  async updateSong(id: string, updates: Partial<InsertSong>): Promise<Song> {
    const [updatedSong] = await db
      .update(songs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(songs.id, id))
      .returning();
    return updatedSong;
  }

  async deleteSong(id: string): Promise<void> {
    await db.delete(songs).where(eq(songs.id, id));
  }

  async getTrendingSongs(limit = 20): Promise<Song[]> {
    return await db
      .select()
      .from(songs)
      .where(eq(songs.visibility, 'public'))
      .orderBy(desc(sql`(${songs.analytics}->>'trendingScore')::numeric`))
      .limit(limit);
  }

  async searchSongs(query: string, limit = 50): Promise<Song[]> {
    return await db
      .select()
      .from(songs)
      .where(
        and(
          eq(songs.visibility, 'public'),
          or(
            ilike(songs.title, `%${query}%`),
            ilike(songs.genre, `%${query}%`)
          )
        )
      )
      .limit(limit);
  }

  // Album operations
  async getAlbum(id: string): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }

  async getAlbumsByArtist(artistId: string): Promise<Album[]> {
    return await db
      .select()
      .from(albums)
      .where(eq(albums.artistId, artistId))
      .orderBy(desc(albums.releaseDate));
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [newAlbum] = await db.insert(albums).values(album).returning();
    return newAlbum;
  }

  async updateAlbum(id: string, updates: Partial<InsertAlbum>): Promise<Album> {
    const [updatedAlbum] = await db
      .update(albums)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(albums.id, id))
      .returning();
    return updatedAlbum;
  }

  async deleteAlbum(id: string): Promise<void> {
    await db.delete(albums).where(eq(albums.id, id));
  }

  // Playlist operations
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist;
  }

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    return await db
      .select()
      .from(playlists)
      .where(eq(playlists.ownerId, userId))
      .orderBy(desc(playlists.updatedAt));
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    const [newPlaylist] = await db.insert(playlists).values(playlist).returning();
    return newPlaylist;
  }

  async updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<Playlist> {
    const [updatedPlaylist] = await db
      .update(playlists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return updatedPlaylist;
  }

  async deletePlaylist(id: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  // Subscription operations
  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionsByFan(fanId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.fanId, fanId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionsByArtist(artistId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.artistId, artistId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async cancelSubscription(id: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(subscriptions.id, id));
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByArtist(artistId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.artistId, artistId), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  async searchProducts(query: string, limit = 50): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.description, `%${query}%`)
          )
        )
      )
      .limit(limit);
  }

  // Event operations
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByArtist(artistId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.artistId, artistId))
      .orderBy(asc(events.dateTime));
  }

  async getUpcomingEvents(limit = 20): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.status, 'published'),
          sql`${events.dateTime} > NOW()`
        )
      )
      .orderBy(asc(events.dateTime))
      .limit(limit);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async searchEvents(query: string, limit = 50): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.status, 'published'),
          or(
            ilike(events.title, `%${query}%`),
            ilike(events.description, `%${query}%`)
          )
        )
      )
      .limit(limit);
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.buyerId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Ticket operations
  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketsByUser(userId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.buyerId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketsByEvent(eventId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.eventId, eventId))
      .orderBy(desc(tickets.createdAt));
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  // Blog operations
  async getBlog(id: string): Promise<Blog | undefined> {
    const [blog] = await db.select().from(blogs).where(eq(blogs.id, id));
    return blog;
  }

  async getBlogsByAuthor(authorId: string): Promise<Blog[]> {
    return await db
      .select()
      .from(blogs)
      .where(eq(blogs.authorId, authorId))
      .orderBy(desc(blogs.createdAt));
  }

  async getPublishedBlogs(limit = 20): Promise<Blog[]> {
    return await db
      .select()
      .from(blogs)
      .where(eq(blogs.status, 'published'))
      .orderBy(desc(blogs.publishedAt))
      .limit(limit);
  }

  async createBlog(blog: InsertBlog): Promise<Blog> {
    const [newBlog] = await db.insert(blogs).values(blog).returning();
    return newBlog;
  }

  async updateBlog(id: string, updates: Partial<InsertBlog>): Promise<Blog> {
    const [updatedBlog] = await db
      .update(blogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogs.id, id))
      .returning();
    return updatedBlog;
  }

  async deleteBlog(id: string): Promise<void> {
    await db.delete(blogs).where(eq(blogs.id, id));
  }

  // Blog comment operations
  async getBlogComment(id: string): Promise<BlogComment | undefined> {
    const [comment] = await db.select().from(blogComments).where(eq(blogComments.id, id));
    return comment;
  }

  async getBlogCommentsByBlog(blogId: string): Promise<BlogComment[]> {
    return await db
      .select()
      .from(blogComments)
      .where(eq(blogComments.blogId, blogId))
      .orderBy(desc(blogComments.createdAt));
  }

  async createBlogComment(comment: InsertBlogComment): Promise<BlogComment> {
    const [newComment] = await db.insert(blogComments).values(comment).returning();
    return newComment;
  }

  async updateBlogComment(id: string, updates: Partial<InsertBlogComment>): Promise<BlogComment> {
    const [updatedComment] = await db
      .update(blogComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteBlogComment(id: string): Promise<void> {
    await db.delete(blogComments).where(eq(blogComments.id, id));
  }

  // Follow operations
  async followArtist(followerId: string, artistId: string): Promise<Follow> {
    const [follow] = await db.insert(follows).values({
      followerId,
      followingId: artistId,
    }).returning();
    return follow;
  }

  async unfollowArtist(followerId: string, artistId: string): Promise<void> {
    await db.delete(follows).where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, artistId)
      )
    );
  }

  async getFollowedArtists(userId: string): Promise<Artist[]> {
    return await db
      .select({
        id: artists.id,
        userId: artists.userId,
        verification: artists.verification,
        stats: artists.stats,
        revenue: artists.revenue,
        payout: artists.payout,
        featured: artists.featured,
        trendingScore: artists.trendingScore,
        followers: artists.followers,
        createdAt: artists.createdAt,
        updatedAt: artists.updatedAt,
      })
      .from(follows)
      .innerJoin(artists, eq(follows.followingId, artists.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));
  }

  async isFollowing(followerId: string, artistId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, artistId)
        )
      );
    return !!follow;
  }

  // Like operations
  async likeSong(userId: string, songId: string): Promise<Like> {
    const [like] = await db.insert(likes).values({
      userId,
      songId,
    }).returning();
    return like;
  }

  async unlikeSong(userId: string, songId: string): Promise<void> {
    await db.delete(likes).where(
      and(
        eq(likes.userId, userId),
        eq(likes.songId, songId)
      )
    );
  }

  async getLikedSongs(userId: string): Promise<Song[]> {
    return await db
      .select({
        id: songs.id,
        title: songs.title,
        artistId: songs.artistId,
        albumId: songs.albumId,
        collaborators: songs.collaborators,
        genre: songs.genre,
        subGenres: songs.subGenres,
        duration: songs.duration,
        releaseDate: songs.releaseDate,
        files: songs.files,
        metadata: songs.metadata,
        visibility: songs.visibility,
        monetization: songs.monetization,
        analytics: songs.analytics,
        createdAt: songs.createdAt,
        updatedAt: songs.updatedAt,
      })
      .from(likes)
      .innerJoin(songs, eq(likes.songId, songs.id))
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt));
  }

  async isLiked(userId: string, songId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.songId, songId)
        )
      );
    return !!like;
  }

  // Analytics operations
  async trackEvent(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [analytics] = await db.insert(analytics).values(analyticsData).returning();
    return analytics;
  }

  async getAnalytics(filters: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Analytics[]> {
    let query = db.select().from(analytics);
    
    const conditions = [];
    if (filters.userId) conditions.push(eq(analytics.userId, filters.userId));
    if (filters.eventType) conditions.push(eq(analytics.eventType, filters.eventType));
    if (filters.startDate) conditions.push(sql`${analytics.timestamp} >= ${filters.startDate}`);
    if (filters.endDate) conditions.push(sql`${analytics.timestamp} <= ${filters.endDate}`);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(analytics.timestamp));
  }

  // Notification operations
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.recipientId, userId));
  }

  // Report operations
  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReports(status?: string): Promise<Report[]> {
    let query = db.select().from(reports);
    
    if (status) {
      query = query.where(eq(reports.status, status as any));
    }

    return await query.orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async updateReport(id: string, updates: Partial<InsertReport>): Promise<Report> {
    const [updatedReport] = await db
      .update(reports)
      .set(updates)
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  // Ad operations
  async getAd(id: string): Promise<Ad | undefined> {
    const [ad] = await db.select().from(ads).where(eq(ads.id, id));
    return ad;
  }

  async getActiveAds(): Promise<Ad[]> {
    return await db
      .select()
      .from(ads)
      .where(eq(ads.status, 'active'))
      .orderBy(desc(ads.createdAt));
  }

  async createAd(ad: InsertAd): Promise<Ad> {
    const [newAd] = await db.insert(ads).values(ad).returning();
    return newAd;
  }

  async updateAd(id: string, updates: Partial<InsertAd>): Promise<Ad> {
    const [updatedAd] = await db
      .update(ads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ads.id, id))
      .returning();
    return updatedAd;
  }

  async deleteAd(id: string): Promise<void> {
    await db.delete(ads).where(eq(ads.id, id));
  }
}

export const storage = new DatabaseStorage();
