import {
  User,
  Artist,
  Song,
  Album,
  Playlist,
  Subscription,
  Product,
  Event,
  Order,
  Ticket,
  Blog,
  BlogComment,
  Ad,
  Analytics,
  Notification,
  Report,
  Follow,
  Like,
  type User as IUser,
  type InsertUser,
  type Artist as IArtist,
  type InsertArtist,
  type Song as ISong,
  type InsertSong,
  type Album as IAlbum,
  type InsertAlbum,
  type Playlist as IPlaylist,
  type InsertPlaylist,
  type Subscription as ISubscription,
  type InsertSubscription,
  type Product as IProduct,
  type InsertProduct,
  type Event as IEvent,
  type InsertEvent,
  type Order as IOrder,
  type InsertOrder,
  type Ticket as ITicket,
  type InsertTicket,
  type Blog as IBlog,
  type InsertBlog,
  type BlogComment as IBlogComment,
  type InsertBlogComment,
  type Ad as IAd,
  type InsertAd,
  type Analytics as IAnalytics,
  type InsertAnalytics,
  type Notification as INotification,
  type InsertNotification,
  type Report as IReport,
  type InsertReport,
  type Follow as IFollow,
  type InsertFollow,
  type Like as ILike,
  type InsertLike,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  createUser(user: InsertUser): Promise<IUser>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<void>;

  // Artist operations
  getArtist(id: string): Promise<IArtist | null>;
  getArtistByUserId(userId: string): Promise<IArtist | null>;
  createArtist(artist: InsertArtist): Promise<IArtist>;
  updateArtist(id: string, updates: Partial<InsertArtist>): Promise<IArtist | null>;
  getFeaturedArtists(limit?: number): Promise<IArtist[]>;
  searchArtists(query: string, limit?: number): Promise<IArtist[]>;

  // Song operations
  getSong(id: string): Promise<ISong | null>;
  getSongsByArtist(artistId: string, limit?: number): Promise<ISong[]>;
  createSong(song: InsertSong): Promise<ISong>;
  updateSong(id: string, updates: Partial<InsertSong>): Promise<ISong | null>;
  deleteSong(id: string): Promise<void>;
  getTrendingSongs(limit?: number): Promise<ISong[]>;
  searchSongs(query: string, limit?: number): Promise<ISong[]>;

  // Album operations
  getAlbum(id: string): Promise<IAlbum | null>;
  getAlbumsByArtist(artistId: string): Promise<IAlbum[]>;
  createAlbum(album: InsertAlbum): Promise<IAlbum>;
  updateAlbum(id: string, updates: Partial<InsertAlbum>): Promise<IAlbum | null>;
  deleteAlbum(id: string): Promise<void>;

  // Playlist operations
  getPlaylist(id: string): Promise<IPlaylist | null>;
  getPlaylistsByUser(userId: string): Promise<IPlaylist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<IPlaylist>;
  updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<IPlaylist | null>;
  deletePlaylist(id: string): Promise<void>;

  // Subscription operations
  getSubscription(id: string): Promise<ISubscription | null>;
  getSubscriptionsByFan(fanId: string): Promise<ISubscription[]>;
  getSubscriptionsByArtist(artistId: string): Promise<ISubscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<ISubscription>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<ISubscription | null>;
  cancelSubscription(id: string): Promise<void>;

  // Product operations
  getProduct(id: string): Promise<IProduct | null>;
  getProductsByArtist(artistId: string): Promise<IProduct[]>;
  createProduct(product: InsertProduct): Promise<IProduct>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<IProduct | null>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string, limit?: number): Promise<IProduct[]>;

  // Event operations
  getEvent(id: string): Promise<IEvent | null>;
  getEventsByArtist(artistId: string): Promise<IEvent[]>;
  getUpcomingEvents(limit?: number): Promise<IEvent[]>;
  createEvent(event: InsertEvent): Promise<IEvent>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<IEvent | null>;
  deleteEvent(id: string): Promise<void>;
  searchEvents(query: string, limit?: number): Promise<IEvent[]>;

  // Order operations
  getOrder(id: string): Promise<IOrder | null>;
  getOrdersByUser(userId: string): Promise<IOrder[]>;
  createOrder(order: InsertOrder): Promise<IOrder>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<IOrder | null>;

  // Ticket operations
  getTicket(id: string): Promise<ITicket | null>;
  getTicketsByUser(userId: string): Promise<ITicket[]>;
  getTicketsByEvent(eventId: string): Promise<ITicket[]>;
  createTicket(ticket: InsertTicket): Promise<ITicket>;
  updateTicket(id: string, updates: Partial<InsertTicket>): Promise<ITicket | null>;

  // Blog operations
  getBlog(id: string): Promise<IBlog | null>;
  getBlogsByAuthor(authorId: string): Promise<IBlog[]>;
  getPublishedBlogs(limit?: number): Promise<IBlog[]>;
  createBlog(blog: InsertBlog): Promise<IBlog>;
  updateBlog(id: string, updates: Partial<InsertBlog>): Promise<IBlog | null>;
  deleteBlog(id: string): Promise<void>;

  // Blog comment operations
  getBlogComment(id: string): Promise<IBlogComment | null>;
  getBlogCommentsByBlog(blogId: string): Promise<IBlogComment[]>;
  createBlogComment(comment: InsertBlogComment): Promise<IBlogComment>;
  updateBlogComment(id: string, updates: Partial<InsertBlogComment>): Promise<IBlogComment | null>;
  deleteBlogComment(id: string): Promise<void>;

  // Follow operations
  followArtist(followerId: string, artistId: string): Promise<IFollow>;
  unfollowArtist(followerId: string, artistId: string): Promise<void>;
  getFollowedArtists(userId: string): Promise<IArtist[]>;
  isFollowing(followerId: string, artistId: string): Promise<boolean>;

  // Like operations
  likeSong(userId: string, songId: string): Promise<ILike>;
  unlikeSong(userId: string, songId: string): Promise<void>;
  getLikedSongs(userId: string): Promise<ISong[]>;
  isLiked(userId: string, songId: string): Promise<boolean>;

  // Analytics operations
  trackEvent(analytics: InsertAnalytics): Promise<IAnalytics>;
  getAnalytics(filters: { userId?: string; eventType?: string; startDate?: Date; endDate?: Date }): Promise<IAnalytics[]>;

  // Notification operations
  getNotification(id: string): Promise<INotification | null>;
  getNotificationsByUser(userId: string): Promise<INotification[]>;
  createNotification(notification: InsertNotification): Promise<INotification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Report operations
  getReport(id: string): Promise<IReport | null>;
  getReports(status?: string): Promise<IReport[]>;
  createReport(report: InsertReport): Promise<IReport>;
  updateReport(id: string, updates: Partial<InsertReport>): Promise<IReport | null>;

  // Ad operations
  getAd(id: string): Promise<IAd | null>;
  getActiveAds(): Promise<IAd[]>;
  createAd(ad: InsertAd): Promise<IAd>;
  updateAd(id: string, updates: Partial<InsertAd>): Promise<IAd | null>;
  deleteAd(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private User = User;
  private Artist = Artist;
  private Song = Song;
  private Album = Album;
  private Playlist = Playlist;
  private Subscription = Subscription;
  private Product = Product;
  private Event = Event;
  private Order = Order;
  private Ticket = Ticket;
  private Blog = Blog;
  private BlogComment = BlogComment;
  private Ad = Ad;
  private Analytics = Analytics;
  private Notification = Notification;
  private Report = Report;
  private Follow = Follow;
  private Like = Like;

  // ---------------- USER ----------------
  async getUser(id: string): Promise<IUser | null> {
    return this.User.findById(id);
  }
  async getUserByEmail(email: string): Promise<IUser | null> {
    return this.User.findOne({ email });
  }
  async createUser(user: InsertUser): Promise<IUser> {
    return new this.User(user).save();
  }
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<IUser | null> {
    return this.User.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteUser(id: string): Promise<void> {
    await this.User.findByIdAndDelete(id);
  }

  // ---------------- ARTIST ----------------
  async getArtist(id: string): Promise<IArtist | null> {
    return this.Artist.findById(id);
  }
  async getArtistByUserId(userId: string): Promise<IArtist | null> {
    return this.Artist.findOne({ userId });
  }
  async createArtist(artist: InsertArtist): Promise<IArtist> {
    return new this.Artist(artist).save();
  }
  async updateArtist(id: string, updates: Partial<InsertArtist>): Promise<IArtist | null> {
    return this.Artist.findByIdAndUpdate(id, updates, { new: true });
  }
  async getFeaturedArtists(limit = 10): Promise<IArtist[]> {
    // Return random artists if no featured flag exists
    const count = await this.Artist.countDocuments();
    if (count === 0) return [];
    
    // Get random artists as featured
    const randomSkip = Math.floor(Math.random() * Math.max(1, count - limit));
    return this.Artist.find({}).skip(randomSkip).limit(limit);
  }
  async searchArtists(query: string, limit = 20): Promise<IArtist[]> {
    return this.Artist.find({ name: { $regex: query, $options: "i" } })
      .limit(limit)
      .lean();
  }

  // ---------------- SONG ----------------
  async getSong(id: string): Promise<ISong | null> {
    return this.Song.findById(id);
  }
  async getSongsByArtist(artistId: string, limit = 50): Promise<ISong[]> {
    return this.Song.find({ artistId }).sort({ createdAt: -1 }).limit(limit);
  }
  async createSong(song: InsertSong): Promise<ISong> {
    return new this.Song(song).save();
  }
  async updateSong(id: string, updates: Partial<InsertSong>): Promise<ISong | null> {
    return this.Song.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteSong(id: string): Promise<void> {
    await this.Song.findByIdAndDelete(id);
  }
  async getTrendingSongs(limit = 20): Promise<ISong[]> {
    return this.Song.find({ visibility: "public" })
      .sort({ "analytics.trendingScore": -1 })
      .limit(limit);
  }
  async searchSongs(query: string, limit = 50): Promise<ISong[]> {
    return this.Song.find({
      visibility: "public",
      $or: [
        { title: { $regex: query, $options: "i" } },
        { genre: { $regex: query, $options: "i" } },
      ],
    }).limit(limit);
  }
  
  async getSongs(options: {
    visibility?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    genre?: string;
  } = {}): Promise<ISong[]> {
    const {
      visibility = "public",
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      genre
    } = options;

    const query: any = { visibility };
    if (genre && genre !== "all") {
      query.genre = genre;
    }

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    return this.Song.find(query).sort(sortObj).limit(limit);
  }

  // ---------------- ALBUM ----------------
  async getAlbum(id: string): Promise<IAlbum | null> {
    return this.Album.findById(id);
  }
  async getAlbumsByArtist(artistId: string): Promise<IAlbum[]> {
    return this.Album.find({ artistId }).sort({ releaseDate: -1 });
  }
  async createAlbum(album: InsertAlbum): Promise<IAlbum> {
    return new this.Album(album).save();
  }
  async updateAlbum(id: string, updates: Partial<InsertAlbum>): Promise<IAlbum | null> {
    return this.Album.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteAlbum(id: string): Promise<void> {
    await this.Album.findByIdAndDelete(id);
  }

  // ---------------- PLAYLIST ----------------
  async getPlaylist(id: string): Promise<IPlaylist | null> {
    return this.Playlist.findById(id);
  }
  async getPlaylistsByUser(userId: string): Promise<IPlaylist[]> {
    return this.Playlist.find({ ownerId: userId }).sort({ updatedAt: -1 });
  }
  async createPlaylist(playlist: InsertPlaylist): Promise<IPlaylist> {
    return new this.Playlist(playlist).save();
  }
  async updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<IPlaylist | null> {
    return this.Playlist.findByIdAndUpdate(id, updates, { new: true });
  }
  async deletePlaylist(id: string): Promise<void> {
    await this.Playlist.findByIdAndDelete(id);
  }

  // ---------------- SUBSCRIPTION ----------------
  async getSubscription(id: string): Promise<ISubscription | null> {
    return this.Subscription.findById(id);
  }
  async getSubscriptionsByFan(fanId: string): Promise<ISubscription[]> {
    return this.Subscription.find({ fanId }).sort({ createdAt: -1 });
  }
  async getSubscriptionsByArtist(artistId: string): Promise<ISubscription[]> {
    return this.Subscription.find({ artistId }).sort({ createdAt: -1 });
  }
  async createSubscription(subscription: InsertSubscription): Promise<ISubscription> {
    return new this.Subscription(subscription).save();
  }
  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<ISubscription | null> {
    return this.Subscription.findByIdAndUpdate(id, updates, { new: true });
  }
  async cancelSubscription(id: string): Promise<void> {
    await this.Subscription.findByIdAndUpdate(id, { status: "cancelled" });
  }

  // ---------------- PRODUCT ----------------
  async getProduct(id: string): Promise<IProduct | null> {
    return this.Product.findById(id);
  }
  async getProductsByArtist(artistId: string): Promise<IProduct[]> {
    return this.Product.find({ artistId, isActive: true }).sort({ createdAt: -1 });
  }
  async createProduct(product: InsertProduct): Promise<IProduct> {
    return new this.Product(product).save();
  }
  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<IProduct | null> {
    return this.Product.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteProduct(id: string): Promise<void> {
    await this.Product.findByIdAndUpdate(id, { isActive: false });
  }
  async searchProducts(query: string, limit = 50): Promise<IProduct[]> {
    return this.Product.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).limit(limit);
  }

  // ---------------- EVENT ----------------
  async getEvent(id: string): Promise<IEvent | null> {
    return this.Event.findById(id);
  }
  async getEventsByArtist(artistId: string): Promise<IEvent[]> {
    return this.Event.find({ artistId }).sort({ dateTime: 1 });
  }
  async getUpcomingEvents(limit = 20): Promise<IEvent[]> {
    return this.Event.find({ status: "published", dateTime: { $gt: new Date() } })
      .sort({ dateTime: 1 })
      .limit(limit);
  }
  async createEvent(event: InsertEvent): Promise<IEvent> {
    return new this.Event(event).save();
  }
  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<IEvent | null> {
    return this.Event.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteEvent(id: string): Promise<void> {
    await this.Event.findByIdAndDelete(id);
  }
  async searchEvents(query: string, limit = 50): Promise<IEvent[]> {
    return this.Event.find({
      status: "published",
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).limit(limit);
  }

  // ---------------- ORDER ----------------
  async getOrder(id: string): Promise<IOrder | null> {
    return this.Order.findById(id);
  }
  async getOrdersByUser(userId: string): Promise<IOrder[]> {
    return this.Order.find({ buyerId: userId }).sort({ createdAt: -1 });
  }
  async createOrder(order: InsertOrder): Promise<IOrder> {
    return new this.Order(order).save();
  }
  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<IOrder | null> {
    return this.Order.findByIdAndUpdate(id, updates, { new: true });
  }

  // ---------------- TICKET ----------------
  async getTicket(id: string): Promise<ITicket | null> {
    return this.Ticket.findById(id);
  }
  async getTicketsByUser(userId: string): Promise<ITicket[]> {
    return this.Ticket.find({ buyerId: userId }).sort({ createdAt: -1 });
  }
  async getTicketsByEvent(eventId: string): Promise<ITicket[]>{
    return this.Ticket.find({ eventId }).sort({ createdAt: -1 });
  }
  async createTicket(ticket: InsertTicket): Promise<ITicket> {
    return new this.Ticket(ticket).save();
  }
  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<ITicket | null> {
    return this.Ticket.findByIdAndUpdate(id, updates, { new: true });
  }

  // ---------------- BLOG ----------------
  async getBlog(id: string): Promise<IBlog | null> {
    return this.Blog.findById(id);
  }
  async getBlogsByAuthor(authorId: string): Promise<IBlog[]> {
    return this.Blog.find({ authorId }).sort({ createdAt: -1 });
  }
  async getPublishedBlogs(limit = 20): Promise<IBlog[]> {
    return this.Blog.find({ status: "published" }).sort({ publishedAt: -1 }).limit(limit);
  }
  async createBlog(blog: InsertBlog): Promise<IBlog> {
    return new this.Blog(blog).save();
  }
  async updateBlog(id: string, updates: Partial<InsertBlog>): Promise<IBlog | null> {
    return this.Blog.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteBlog(id: string): Promise<void> {
    await this.Blog.findByIdAndDelete(id);
  }

  // ---------------- BLOG COMMENT ----------------
  async getBlogComment(id: string): Promise<IBlogComment | null> {
    return this.BlogComment.findById(id);
  }
  async getBlogCommentsByBlog(blogId: string): Promise<IBlogComment[]> {
    return this.BlogComment.find({ blogId }).sort({ createdAt: -1 });
  }
  async createBlogComment(comment: InsertBlogComment): Promise<IBlogComment> {
    return new this.BlogComment(comment).save();
  }
  async updateBlogComment(id: string, updates: Partial<InsertBlogComment>): Promise<IBlogComment | null> {
    return this.BlogComment.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteBlogComment(id: string): Promise<void> {
    await this.BlogComment.findByIdAndDelete(id);
  }

  // ---------------- FOLLOW ----------------
  async followArtist(followerId: string, artistId: string): Promise<IFollow> {
    return new this.Follow({ followerId, followingId: artistId }).save();
  }
  async unfollowArtist(followerId: string, artistId: string): Promise<void> {
    await this.Follow.findOneAndDelete({ followerId, followingId: artistId });
  }
  async getFollowedArtists(userId: string): Promise<IArtist[]> {
    const follows = await this.Follow.find({ followerId: userId }).populate("followingId");
    return follows.map((f) => f.followingId as any);
  }
  async isFollowing(followerId: string, artistId: string): Promise<boolean> {
    return !!(await this.Follow.findOne({ followerId, followingId: artistId }));
  }

  // ---------------- LIKE ----------------
  async likeSong(userId: string, songId: string): Promise<ILike> {
    return new this.Like({ userId, songId }).save();
  }
  async unlikeSong(userId: string, songId: string): Promise<void> {
    await this.Like.findOneAndDelete({ userId, songId });
  }
  async getLikedSongs(userId: string): Promise<ISong[]> {
    const likes = await this.Like.find({ userId }).populate("songId");
    return likes.map((l) => l.songId as any);
  }
  async isLiked(userId: string, songId: string): Promise<boolean> {
    return !!(await this.Like.findOne({ userId, songId }));
  }

  // ---------------- ANALYTICS ----------------
  async trackEvent(analyticsData: InsertAnalytics): Promise<IAnalytics> {
    return new this.Analytics(analyticsData).save();
  }
  async getAnalytics(filters: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IAnalytics[]> {
    const query: any = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }
    return this.Analytics.find(query).sort({ timestamp: -1 });
  }

  // ---------------- NOTIFICATIONS ----------------
  async getNotification(id: string): Promise<INotification | null> {
    return this.Notification.findById(id);
  }
  async getNotificationsByUser(userId: string): Promise<INotification[]> {
    return this.Notification.find({ recipientId: userId }).sort({ createdAt: -1 });
  }
  async createNotification(notification: InsertNotification): Promise<INotification> {
    return new this.Notification(notification).save();
  }
  async markNotificationAsRead(id: string): Promise<void> {
    await this.Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });
  }
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.Notification.updateMany(
      { recipientId: userId },
      { isRead: true, readAt: new Date() }
    );
  }

  // ---------------- REPORT ----------------
  async getReport(id: string): Promise<IReport | null> {
    return this.Report.findById(id);
  }
  async getReports(status?: string): Promise<IReport[]> {
    const query = status ? { status } : {};
    return this.Report.find(query).sort({ createdAt: -1 });
  }
  async createReport(report: InsertReport): Promise<IReport> {
    return new this.Report(report).save();
  }
  async updateReport(id: string, updates: Partial<InsertReport>): Promise<IReport | null> {
    return this.Report.findByIdAndUpdate(id, updates, { new: true });
  }

  // ---------------- ADS ----------------
  async getAd(id: string): Promise<IAd | null> {
    return this.Ad.findById(id);
  }
  async getActiveAds(): Promise<IAd[]>{
    return this.Ad.find({ status: "active" }).sort({ createdAt: -1 });
  }
  async createAd(ad: InsertAd): Promise<IAd> {
    return new this.Ad(ad).save();
  }
  async updateAd(id: string, updates: Partial<InsertAd>): Promise<IAd | null> {
    return this.Ad.findByIdAndUpdate(id, updates, { new: true });
  }
  async deleteAd(id: string): Promise<void> {
    await this.Ad.findByIdAndDelete(id);
  }
}

export const storage = new DatabaseStorage();