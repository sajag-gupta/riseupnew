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
  // User operations
  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async createUser(user: InsertUser): Promise<IUser> {
    const newUser = new User(user);
    return await newUser.save();
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteUser(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  }

  // Artist operations
  async getArtist(id: string): Promise<IArtist | null> {
    return await Artist.findById(id);
  }

  async getArtistByUserId(userId: string): Promise<IArtist | null> {
    return await Artist.findOne({ userId });
  }

  async createArtist(artist: InsertArtist): Promise<IArtist> {
    const newArtist = new Artist(artist);
    return await newArtist.save();
  }

  async updateArtist(id: string, updates: Partial<InsertArtist>): Promise<IArtist | null> {
    return await Artist.findByIdAndUpdate(id, updates, { new: true });
  }

  async getFeaturedArtists(limit = 10): Promise<IArtist[]> {
    return await Artist.find({ featured: true })
      .sort({ trendingScore: -1 })
      .limit(limit);
  }

  async searchArtists(query: string, limit = 20): Promise<IArtist[]> {
    return await Artist.find().populate({
        path: 'userId',
        match: { name: { $regex: query, $options: 'i' } }
      }).limit(limit);
  }

  // Song operations
  async getSong(id: string): Promise<ISong | null> {
    return await Song.findById(id);
  }

  async getSongsByArtist(artistId: string, limit = 50): Promise<ISong[]> {
    return await Song.find({ artistId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async createSong(song: InsertSong): Promise<ISong> {
    const newSong = new Song(song);
    return await newSong.save();
  }

  async updateSong(id: string, updates: Partial<InsertSong>): Promise<ISong | null> {
    return await Song.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteSong(id: string): Promise<void> {
    await Song.findByIdAndDelete(id);
  }

  async getTrendingSongs(limit = 20): Promise<ISong[]> {
    return await Song.find({ visibility: 'public' })
      .sort({ 'analytics.trendingScore': -1 })
      .limit(limit);
  }

  async searchSongs(query: string, limit = 50): Promise<ISong[]> {
    return await Song.find({
      visibility: 'public',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { genre: { $regex: query, $options: 'i' } }
      ]
    }).limit(limit);
  }

  // Album operations
  async getAlbum(id: string): Promise<IAlbum | null> {
    return await Album.findById(id);
  }

  async getAlbumsByArtist(artistId: string): Promise<IAlbum[]> {
    return await Album.find({ artistId }).sort({ releaseDate: -1 });
  }

  async createAlbum(album: InsertAlbum): Promise<IAlbum> {
    const newAlbum = new Album(album);
    return await newAlbum.save();
  }

  async updateAlbum(id: string, updates: Partial<InsertAlbum>): Promise<IAlbum | null> {
    return await Album.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteAlbum(id: string): Promise<void> {
    await Album.findByIdAndDelete(id);
  }

  // Playlist operations
  async getPlaylist(id: string): Promise<IPlaylist | null> {
    return await Playlist.findById(id);
  }

  async getPlaylistsByUser(userId: string): Promise<IPlaylist[]> {
    return await Playlist.find({ ownerId: userId }).sort({ updatedAt: -1 });
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<IPlaylist> {
    const newPlaylist = new Playlist(playlist);
    return await newPlaylist.save();
  }

  async updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<IPlaylist | null> {
    return await Playlist.findByIdAndUpdate(id, updates, { new: true });
  }

  async deletePlaylist(id: string): Promise<void> {
    await Playlist.findByIdAndDelete(id);
  }

  // Subscription operations
  async getSubscription(id: string): Promise<ISubscription | null> {
    return await Subscription.findById(id);
  }

  async getSubscriptionsByFan(fanId: string): Promise<ISubscription[]> {
    return await Subscription.find({ fanId }).sort({ createdAt: -1 });
  }

  async getSubscriptionsByArtist(artistId: string): Promise<ISubscription[]> {
    return await Subscription.find({ artistId }).sort({ createdAt: -1 });
  }

  async createSubscription(subscription: InsertSubscription): Promise<ISubscription> {
    const newSubscription = new Subscription(subscription);
    return await newSubscription.save();
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(id, updates, { new: true });
  }

  async cancelSubscription(id: string): Promise<void> {
    await Subscription.findByIdAndUpdate(id, { status: 'cancelled' });
  }

  // Product operations
  async getProduct(id: string): Promise<IProduct | null> {
    return await Product.findById(id);
  }

  async getProductsByArtist(artistId: string): Promise<IProduct[]> {
    return await Product.find({ artistId, isActive: true }).sort({ createdAt: -1 });
  }

  async createProduct(product: InsertProduct): Promise<IProduct> {
    const newProduct = new Product(product);
    return await newProduct.save();
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<IProduct | null> {
    return await Product.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteProduct(id: string): Promise<void> {
    await Product.findByIdAndUpdate(id, { isActive: false });
  }

  async searchProducts(query: string, limit = 50): Promise<IProduct[]> {
    return await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(limit);
  }

  // Event operations
  async getEvent(id: string): Promise<IEvent | null> {
    return await Event.findById(id);
  }

  async getEventsByArtist(artistId: string): Promise<IEvent[]> {
    return await Event.find({ artistId }).sort({ dateTime: 1 });
  }

  async getUpcomingEvents(limit = 20): Promise<IEvent[]> {
    return await Event.find({
      status: 'published',
      dateTime: { $gt: new Date() }
    })
      .sort({ dateTime: 1 })
      .limit(limit);
  }

  async createEvent(event: InsertEvent): Promise<IEvent> {
    const newEvent = new Event(event);
    return await newEvent.save();
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<IEvent | null> {
    return await Event.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteEvent(id: string): Promise<void> {
    await Event.findByIdAndDelete(id);
  }

  async searchEvents(query: string, limit = 50): Promise<IEvent[]> {
    return await Event.find({
      status: 'published',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(limit);
  }

  // Order operations
  async getOrder(id: string): Promise<IOrder | null> {
    return await Order.findById(id);
  }

  async getOrdersByUser(userId: string): Promise<IOrder[]> {
    return await Order.find({ buyerId: userId }).sort({ createdAt: -1 });
  }

  async createOrder(order: InsertOrder): Promise<IOrder> {
    const newOrder = new Order(order);
    return await newOrder.save();
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<IOrder | null> {
    return await Order.findByIdAndUpdate(id, updates, { new: true });
  }

  // Ticket operations
  async getTicket(id: string): Promise<ITicket | null> {
    return await Ticket.findById(id);
  }

  async getTicketsByUser(userId: string): Promise<ITicket[]> {
    return await Ticket.find({ buyerId: userId }).sort({ createdAt: -1 });
  }

  async getTicketsByEvent(eventId: string): Promise<ITicket[]> {
    return await Ticket.find({ eventId }).sort({ createdAt: -1 });
  }

  async createTicket(ticket: InsertTicket): Promise<ITicket> {
    const newTicket = new Ticket(ticket);
    return await newTicket.save();
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<ITicket | null> {
    return await Ticket.findByIdAndUpdate(id, updates, { new: true });
  }

  // Blog operations
  async getBlog(id: string): Promise<IBlog | null> {
    return await Blog.findById(id);
  }

  async getBlogsByAuthor(authorId: string): Promise<IBlog[]> {
    return await Blog.find({ authorId }).sort({ createdAt: -1 });
  }

  async getPublishedBlogs(limit = 20): Promise<IBlog[]> {
    return await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(limit);
  }

  async createBlog(blog: InsertBlog): Promise<IBlog> {
    const newBlog = new Blog(blog);
    return await newBlog.save();
  }

  async updateBlog(id: string, updates: Partial<InsertBlog>): Promise<IBlog | null> {
    return await Blog.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteBlog(id: string): Promise<void> {
    await Blog.findByIdAndDelete(id);
  }

  // Blog comment operations
  async getBlogComment(id: string): Promise<IBlogComment | null> {
    return await BlogComment.findById(id);
  }

  async getBlogCommentsByBlog(blogId: string): Promise<IBlogComment[]> {
    return await BlogComment.find({ blogId }).sort({ createdAt: -1 });
  }

  async createBlogComment(comment: InsertBlogComment): Promise<IBlogComment> {
    const newComment = new BlogComment(comment);
    return await newComment.save();
  }

  async updateBlogComment(id: string, updates: Partial<InsertBlogComment>): Promise<IBlogComment | null> {
    return await BlogComment.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteBlogComment(id: string): Promise<void> {
    await BlogComment.findByIdAndDelete(id);
  }

  // Follow operations
  async followArtist(followerId: string, artistId: string): Promise<IFollow> {
    const follow = new Follow({ followerId, followingId: artistId });
    return await follow.save();
  }

  async unfollowArtist(followerId: string, artistId: string): Promise<void> {
    await Follow.findOneAndDelete({ followerId, followingId: artistId });
  }

  async getFollowedArtists(userId: string): Promise<IArtist[]> {
    const follows = await Follow.find({ followerId: userId }).populate('followingId');
    return follows.map(f => f.followingId as any);
  }

  async isFollowing(followerId: string, artistId: string): Promise<boolean> {
    const follow = await Follow.findOne({ followerId, followingId: artistId });
    return !!follow;
  }

  // Like operations
  async likeSong(userId: string, songId: string): Promise<ILike> {
    const like = new Like({ userId, songId });
    return await like.save();
  }

  async unlikeSong(userId: string, songId: string): Promise<void> {
    await Like.findOneAndDelete({ userId, songId });
  }

  async getLikedSongs(userId: string): Promise<ISong[]> {
    const likes = await Like.find({ userId }).populate('songId');
    return likes.map(l => l.songId as any);
  }

  async isLiked(userId: string, songId: string): Promise<boolean> {
    const like = await Like.findOne({ userId, songId });
    return !!like;
  }

  // Analytics operations
  async trackEvent(analyticsData: InsertAnalytics): Promise<IAnalytics> {
    const analytics = new Analytics(analyticsData);
    return await analytics.save();
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
    if (filters.startDate) query.timestamp = { $gte: filters.startDate };
    if (filters.endDate) query.timestamp = { ...query.timestamp, $lte: filters.endDate };

    return await Analytics.find(query).sort({ timestamp: -1 });
  }

  // Notification operations
  async getNotification(id: string): Promise<INotification | null> {
    return await Notification.findById(id);
  }

  async getNotificationsByUser(userId: string): Promise<INotification[]> {
    return await Notification.find({ recipientId: userId }).sort({ createdAt: -1 });
  }

  async createNotification(notification: InsertNotification): Promise<INotification> {
    const newNotification = new Notification(notification);
    return await newNotification.save();
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { recipientId: userId },
      { isRead: true, readAt: new Date() }
    );
  }

  // Report operations
  async getReport(id: string): Promise<IReport | null> {
    return await Report.findById(id);
  }

  async getReports(status?: string): Promise<IReport[]> {
    const query = status ? { status } : {};
    return await Report.find(query).sort({ createdAt: -1 });
  }

  async createReport(report: InsertReport): Promise<IReport> {
    const newReport = new Report(report);
    return await newReport.save();
  }

  async updateReport(id: string, updates: Partial<InsertReport>): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(id, updates, { new: true });
  }

  // Ad operations
  async getAd(id: string): Promise<IAd | null> {
    return await Ad.findById(id);
  }

  async getActiveAds(): Promise<IAd[]> {
    return await Ad.find({ status: 'active' }).sort({ createdAt: -1 });
  }

  async createAd(ad: InsertAd): Promise<IAd> {
    const newAd = new Ad(ad);
    return await newAd.save();
  }

  async updateAd(id: string, updates: Partial<InsertAd>): Promise<IAd | null> {
    return await Ad.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteAd(id: string): Promise<void> {
    await Ad.findByIdAndDelete(id);
  }
}

export const storage = new DatabaseStorage();