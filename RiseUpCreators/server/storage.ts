import { MongoClient, Db, ObjectId, Collection } from "mongodb";
import bcrypt from "bcryptjs";
import {
  User, InsertUser, Song, InsertSong,
  Merch, InsertMerch, Event, InsertEvent, Order, InsertOrder,
  Subscription, InsertSubscription, Analytics, InsertAnalytics, Blog, InsertBlog
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Artist methods (working with User collection)
  getArtistByUserId(userId: string): Promise<User | undefined>;
  getFeaturedArtists(limit?: number): Promise<User[]>;
  getAllArtists(limit?: number): Promise<User[]>;

  // Song methods
  getSong(id: string): Promise<Song | undefined>;
  getSongsByArtist(artistId: string): Promise<Song[]>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: string, updates: Partial<Song>): Promise<Song | undefined>;
  deleteSong(id: string): Promise<boolean>;
  getTrendingSongs(limit?: number): Promise<Song[]>;
  searchSongs(query: string): Promise<Song[]>;
  getAllSongs(options?: { genre?: string; sort?: string; limit?: number }): Promise<Song[]>;

  // Merch methods
  getMerch(id: string): Promise<Merch | undefined>;
  getMerchByArtist(artistId: string): Promise<Merch[]>;
  createMerch(merch: InsertMerch): Promise<Merch>;
  updateMerch(id: string, updates: Partial<Merch>): Promise<Merch | undefined>;
  deleteMerch(id: string): Promise<boolean>;
  getAllMerch(): Promise<Merch[]>;
  getAllMerchFiltered(filters: any): Promise<Merch[]>;

  // Event methods
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByArtist(artistId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  getUpcomingEvents(): Promise<Event[]>;
  getAllEventsFiltered(filters: any): Promise<Event[]>;

  // Order methods
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;

  // Subscription methods
  getSubscription(id: string): Promise<Subscription | undefined>;
  getSubscriptionsByUser(userId: string): Promise<Subscription[]>;
  getSubscriptionsByArtist(artistId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Blog methods
  getBlog(id: string): Promise<Blog | undefined>;
  getBlogsByArtist(artistId: string): Promise<Blog[]>;
  getAllBlogs(): Promise<Blog[]>;
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: string, updates: Partial<Blog>): Promise<Blog | undefined>;
  deleteBlog(id: string): Promise<boolean>;

  // Analytics methods
  logAnalytics(analytics: InsertAnalytics): Promise<void>;

  // Additional methods for dashboard
  getRecentPlaysByUser(userId: string): Promise<Song[]>;
  getArtistNameByProfileId(artistId: string): Promise<string>;
  getSongsWithArtistNames(options?: { genre?: string; sort?: string; limit?: number }): Promise<(Song & { artistName: string })[]>;
  getEventsWithArtistNames(filters: any): Promise<(Event & { artistName: string })[]>;
  getMerchWithArtistNames(filters: any): Promise<(Merch & { artistName: string })[]>;
}

// MongoDB document types (with ObjectId)
interface UserDoc extends Omit<User, '_id'> {
  _id: ObjectId;
}

interface SongDoc extends Omit<Song, '_id'> {
  _id: ObjectId;
}

interface MerchDoc extends Omit<Merch, '_id'> {
  _id: ObjectId;
}

interface EventDoc extends Omit<Event, '_id'> {
  _id: ObjectId;
}

interface OrderDoc extends Omit<Order, '_id'> {
  _id: ObjectId;
}

interface SubscriptionDoc extends Omit<Subscription, '_id'> {
  _id: ObjectId;
}

interface AnalyticsDoc extends Omit<Analytics, '_id'> {
  _id: ObjectId;
}

interface BlogDoc extends Omit<Blog, '_id'> {
  _id: ObjectId;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  public db: Db;

  private users: Collection<UserDoc>;
  private songs: Collection<SongDoc>;
  private merch: Collection<MerchDoc>;
  private events: Collection<EventDoc>;
  private orders: Collection<OrderDoc>;
  private subscriptions: Collection<SubscriptionDoc>;
  private analytics: Collection<AnalyticsDoc>;
  private blogs: Collection<BlogDoc>;

  constructor() {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sajag:urHyCMEosGgXBGRj@cluster1.l89vj.mongodb.net/riseup4?retryWrites=true&w=majority&authSource=admin";
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db("riseup4");

    this.users = this.db.collection("users");
    this.songs = this.db.collection("songs");
    this.merch = this.db.collection("merch");
    this.events = this.db.collection("events");
    this.orders = this.db.collection("orders");
    this.subscriptions = this.db.collection("subscriptions");
    this.analytics = this.db.collection("analytics");
    this.blogs = this.db.collection("blogs");
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      
      // Verify collections are accessible
      const collections = await this.db.listCollections().toArray();
      console.log(`📚 Database collections initialized: ${collections.map(c => c.name).join(', ')}`);
      
      // Create indexes for better performance
      await this.createIndexes();
    } catch (error) {
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Create essential indexes
      await this.users.createIndex({ email: 1 }, { unique: true });
      await this.users.createIndex({ role: 1 });
      await this.songs.createIndex({ artistId: 1 });
      await this.songs.createIndex({ plays: -1 });
      await this.events.createIndex({ artistId: 1 });
      await this.events.createIndex({ date: 1 });
      await this.merch.createIndex({ artistId: 1 });
      await this.orders.createIndex({ userId: 1 });
      await this.analytics.createIndex({ userId: 1, timestamp: -1 });
      await this.blogs.createIndex({ artistId: 1 });
      
      console.log("📈 Database indexes created successfully");
    } catch (error) {
      if (error instanceof Error) {
        console.warn("⚠️  Some indexes may already exist:", error.message);
      } else {
        console.warn("⚠️  Some indexes may already exist:", error);
      }
    }
  }

  private convertUserDoc(doc: UserDoc): User {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }


  private convertSongDoc(doc: SongDoc): Song {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }

  private convertMerchDoc(doc: MerchDoc): Merch {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }

  private convertEventDoc(doc: EventDoc): Event {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }

  private convertOrderDoc(doc: OrderDoc): Order {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }

  private convertSubscriptionDoc(doc: SubscriptionDoc): Subscription {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }

  private convertAnalyticsDoc(doc: AnalyticsDoc): Analytics {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }

  private convertBlogDoc(doc: BlogDoc): Blog {
    return {
      ...doc,
      _id: doc._id.toString()
    };
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;
      const user = await this.users.findOne({ _id: new ObjectId(id) });
      return user ? this.convertUserDoc(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await this.users.findOne({ email });
      return user ? this.convertUserDoc(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.passwordHash, 10);
    const userDoc: Omit<UserDoc, '_id'> = {
      ...user,
      passwordHash: hashedPassword,
      createdAt: new Date()
    };

    const result = await this.users.insertOne(userDoc as UserDoc);
    const newUser = await this.users.findOne({ _id: result.insertedId });
    return this.convertUserDoc(newUser!);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;

      // Remove _id from updates if present to avoid conflicts
      const { _id, ...updateData } = updates;

      await this.users.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      return this.getUser(id);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Artist methods (using User collection with embedded artist data)
  async getArtistByUserId(userId: string): Promise<User | undefined> {
    try {
      if (!ObjectId.isValid(userId)) {
        console.log(`Invalid ObjectId: ${userId}`);
        return undefined;
      }
      
      const user = await this.users.findOne({ _id: new ObjectId(userId), role: 'artist' });
      
      if (!user) {
        console.log(`No artist found for userId: ${userId}`);
        return undefined;
      }

      // Ensure artist object exists on user
      if (!user.artist) {
        console.log(`User ${userId} has role 'artist' but no artist profile data. Creating default artist profile.`);
        
        // Create default artist profile
        const updatedUser = await this.updateUser(userId, {
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
        
        return updatedUser;
      }

      return this.convertUserDoc(user);
    } catch (error) {
      console.error('Error getting artist by user ID:', error);
      return undefined;
    }
  }


  async getFeaturedArtists(limit = 6): Promise<User[]> {
    try {
      // Get featured artists first, then fall back to all artists if no featured ones exist
      let users = await this.users.find({ 
        role: 'artist', 
        'artist.featured': true 
      }).limit(limit).toArray();

      // If no featured artists, get the most recent artists
      if (users.length === 0) {
        users = await this.users.find({ role: 'artist' }).sort({ createdAt: -1 }).limit(limit).toArray();
      }

      return users.map(u => this.convertUserDoc(u));
    } catch (error) {
      console.error('Error getting featured artists:', error);
      return [];
    }
  }

  async getAllArtists(limit = 20): Promise<User[]> {
    try {
      const users = await this.users.find({ role: 'artist' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return users.map(u => this.convertUserDoc(u));
    } catch (error) {
      console.error('Error getting all artists:', error);
      return [];
    }
  }

  // Song methods
  async getSong(id: string): Promise<Song | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;
      const song = await this.songs.findOne({ _id: new ObjectId(id) });
      return song ? this.convertSongDoc(song) : undefined;
    } catch (error) {
      console.error('Error getting song:', error);
      return undefined;
    }
  }

  async getSongsByArtist(artistId: string): Promise<Song[]> {
    try {
      const songs = await this.songs.find({ artistId }).toArray();
      return songs.map(s => this.convertSongDoc(s));
    } catch (error) {
      console.error('Error getting songs by artist:', error);
      return [];
    }
  }

  async createSong(song: InsertSong): Promise<Song> {
    const songDoc: Omit<SongDoc, '_id'> = {
      ...song,
      createdAt: new Date()
    };

    const result = await this.songs.insertOne(songDoc as SongDoc);
    const newSong = await this.songs.findOne({ _id: result.insertedId });
    return this.convertSongDoc(newSong!);
  }

  async updateSong(id: string, updates: Partial<Song>): Promise<Song | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;

      const { _id, ...updateData } = updates;

      await this.songs.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return this.getSong(id);
    } catch (error) {
      console.error('Error updating song:', error);
      return undefined;
    }
  }

  async deleteSong(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) return false;
      const result = await this.songs.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting song:', error);
      return false;
    }
  }

  async getTrendingSongs(limit = 10): Promise<Song[]> {
    try {
      const songs = await this.songs.find({
        visibility: "PUBLIC"
      })
        .sort({ plays: -1, likes: -1, createdAt: -1 })
        .limit(limit)
        .toArray();
      return songs.map(s => this.convertSongDoc(s));
    } catch (error) {
      console.error('Error getting trending songs:', error);
      return [];
    }
  }

  async searchSongs(query: string): Promise<Song[]> {
    try {
      const songs = await this.songs.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { genre: { $regex: query, $options: 'i' } }
        ]
      }).toArray();
      return songs.map(s => this.convertSongDoc(s));
    } catch (error) {
      console.error('Error searching songs:', error);
      return [];
    }
  }

  async getAllSongs(options: { genre?: string; sort?: string; limit?: number } = {}): Promise<Song[]> {
    try {
      const { genre, sort = 'latest', limit = 20 } = options;

      // Build query
      const query: any = {
        visibility: "PUBLIC"  // Only show public songs
      };
      if (genre && genre !== 'all') {
        query.genre = { $regex: genre, $options: 'i' };
      }

      // Build sort
      let sortQuery: any = {};
      switch (sort) {
        case 'popular':
          sortQuery = { plays: -1, likes: -1 };
          break;
        case 'trending':
          sortQuery = { plays: -1, createdAt: -1 };
          break;
        case 'alphabetical':
          sortQuery = { title: 1 };
          break;
        case 'latest':
        default:
          sortQuery = { createdAt: -1 };
          break;
      }

      const songs = await this.songs.find(query)
        .sort(sortQuery)
        .limit(limit)
        .toArray();

      return songs.map(s => this.convertSongDoc(s));
    } catch (error) {
      console.error('Error getting all songs:', error);
      return [];
    }
  }

  // Merch methods
  async getMerch(id: string): Promise<Merch | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;
      const item = await this.merch.findOne({ _id: new ObjectId(id) });
      return item ? this.convertMerchDoc(item) : undefined;
    } catch (error) {
      console.error('Error getting merch:', error);
      return undefined;
    }
  }

async getMerchByArtist(artistId: string): Promise<Merch[]> {
    try {
      if (!artistId) return [];
      const merchItems = await this.merch.find({ artistId: artistId }).toArray();
      return merchItems.map(m => this.convertMerchDoc(m));
    } catch (error) {
      console.error('Error getting merch by artist:', error);
      return [];
    }
  }

  async createMerch(merch: InsertMerch): Promise<Merch> {
    const merchDoc: Omit<MerchDoc, '_id'> = {
      ...merch,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.merch.insertOne(merchDoc as MerchDoc);
    const newMerch = await this.merch.findOne({ _id: result.insertedId });
    return this.convertMerchDoc(newMerch!);
  }

  async updateMerch(id: string, updates: Partial<Merch>): Promise<Merch | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;

      const { _id, ...updateData } = updates;

      await this.merch.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      return this.getMerch(id);
    } catch (error) {
      console.error('Error updating merch:', error);
      return undefined;
    }
  }

  async deleteMerch(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) return false;
      const result = await this.merch.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting merch:', error);
      return false;
    }
  }

  async getAllMerch(): Promise<Merch[]> {
    try {
      const items = await this.merch.find({}).toArray();
      return items.map(m => this.convertMerchDoc(m));
    } catch (error) {
      console.error('Error getting all merch:', error);
      return [];
    }
  }

  async getAllMerchFiltered(filters: any): Promise<Merch[]> {
    try {
      const items = await this.merch.find(filters).toArray();
      return items.map(m => this.convertMerchDoc(m));
    } catch (error) {
      console.error('Error getting filtered merch:', error);
      return [];
    }
  }

  // Event methods
  async getEvent(id: string): Promise<Event | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;
      const event = await this.events.findOne({ _id: new ObjectId(id) });
      return event ? this.convertEventDoc(event) : undefined;
    } catch (error) {
      console.error('Error getting event:', error);
      return undefined;
    }
  }

  async getEventsByArtist(artistId: string): Promise<Event[]> {
    try {
      if (!artistId) return [];
      const events = await this.events.find({ artistId: artistId }).toArray();
      return events.map(e => this.convertEventDoc(e));
    } catch (error) {
      console.error('Error getting events by artist:', error);
      return [];
    }
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const eventDoc: Omit<EventDoc, '_id'> = {
      ...event,
      createdAt: new Date()
    };

    const result = await this.events.insertOne(eventDoc as EventDoc);
    const newEvent = await this.events.findOne({ _id: result.insertedId });
    return this.convertEventDoc(newEvent!);
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;

      const { _id, ...updateData } = updates;

      await this.events.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return this.getEvent(id);
    } catch (error) {
      console.error('Error updating event:', error);
      return undefined;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) return false;
      const result = await this.events.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  async getUpcomingEvents(): Promise<Event[]> {
    try {
      const events = await this.events.find({
        date: { $gte: new Date() }
      }).sort({ date: 1 }).toArray();
      return events.map(e => this.convertEventDoc(e));
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  async getAllEventsFiltered(filters: any): Promise<Event[]> {
    try {
      const events = await this.events.find(filters)
        .sort({ date: 1 })
        .toArray();
      return events.map(e => this.convertEventDoc(e));
    } catch (error) {
      console.error('Error getting filtered events:', error);
      return [];
    }
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;
      const order = await this.orders.findOne({ _id: new ObjectId(id) });
      return order ? this.convertOrderDoc(order) : undefined;
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    try {
      const orders = await this.orders.find({ userId }).toArray();
      return orders.map(o => this.convertOrderDoc(o));
    } catch (error) {
      console.error('Error getting orders by user:', error);
      return [];
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderDoc: Omit<OrderDoc, '_id'> = {
      ...order,
      createdAt: new Date()
    };

    const result = await this.orders.insertOne(orderDoc as OrderDoc);
    const newOrder = await this.orders.findOne({ _id: result.insertedId });
    return this.convertOrderDoc(newOrder!);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;

      const { _id, ...updateData } = updates;

      await this.orders.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return this.getOrder(id);
    } catch (error) {
      console.error('Error updating order:', error);
      return undefined;
    }
  }

  // Subscription methods
  async getSubscription(id: string): Promise<Subscription | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;
      const sub = await this.subscriptions.findOne({ _id: new ObjectId(id) });
      return sub ? this.convertSubscriptionDoc(sub) : undefined;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return undefined;
    }
  }

  async getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
    try {
      const subs = await this.subscriptions.find({ fanId: userId }).toArray();
      return subs.map(s => this.convertSubscriptionDoc(s));
    } catch (error) {
      console.error('Error getting subscriptions by user:', error);
      return [];
    }
  }

  async getSubscriptionsByArtist(artistId: string): Promise<Subscription[]> {
    try {
      const subs = await this.subscriptions.find({ artistId }).toArray();
      return subs.map(s => this.convertSubscriptionDoc(s));
    } catch (error) {
      console.error('Error getting subscriptions by artist:', error);
      return [];
    }
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const subDoc: Omit<SubscriptionDoc, '_id'> = {
      ...subscription,
      createdAt: new Date()
    };

    const result = await this.subscriptions.insertOne(subDoc as SubscriptionDoc);
    const newSub = await this.subscriptions.findOne({ _id: result.insertedId });
    return this.convertSubscriptionDoc(newSub!);
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;

      const { _id, ...updateData } = updates;

      await this.subscriptions.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      return this.getSubscription(id);
    } catch (error) {
      console.error('Error updating subscription:', error);
      return undefined;
    }
  }

  // Blog methods
  async getBlog(id: string): Promise<Blog | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;
      const blog = await this.blogs.findOne({ _id: new ObjectId(id) });
      return blog ? this.convertBlogDoc(blog) : undefined;
    } catch (error) {
      console.error('Error getting blog:', error);
      return undefined;
    }
  }

  async getBlogsByArtist(artistId: string): Promise<Blog[]> {
    try {
      const blogs = await this.blogs.find({ artistId }).toArray();
      return blogs.map(b => this.convertBlogDoc(b));
    } catch (error) {
      console.error('Error getting blogs by artist:', error);
      return [];
    }
  }

  async createBlog(blog: InsertBlog): Promise<Blog> {
    const blogDoc: Omit<BlogDoc, '_id'> = {
      ...blog,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.blogs.insertOne(blogDoc as BlogDoc);
    const newBlog = await this.blogs.findOne({ _id: result.insertedId });
    return this.convertBlogDoc(newBlog!);
  }

  async updateBlog(id: string, updates: Partial<Blog>): Promise<Blog | undefined> {
    try {
      if (!ObjectId.isValid(id)) return undefined;

      const { _id, ...updateData } = updates;

      await this.blogs.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      return this.getBlog(id);
    } catch (error) {
      console.error('Error updating blog:', error);
      return undefined;
    }
  }

  async deleteBlog(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) return false;
      const result = await this.blogs.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting blog:', error);
      return false;
    }
  }

  async getAllBlogs(): Promise<Blog[]> {
    try {
      const blogs = await this.blogs.find({}).sort({ createdAt: -1 }).toArray();
      return blogs.map(b => this.convertBlogDoc(b));
    } catch (error) {
      console.error('Error getting all blogs:', error);
      return [];
    }
  }

  // Analytics methods
  async logAnalytics(analytics: InsertAnalytics): Promise<void> {
    try {
      const analyticsDoc: Omit<AnalyticsDoc, '_id'> = {
        ...analytics,
        timestamp: new Date()
      };

      await this.analytics.insertOne(analyticsDoc as AnalyticsDoc);
    } catch (error) {
      console.error('Error logging analytics:', error);
    }
  }

  // Additional methods for dashboard
  async getRecentPlaysByUser(userId: string): Promise<(Song & { artistName: string })[]> {
    try {
      const recentAnalytics = await this.analytics.find({
        userId,
        action: "play"
      }).sort({ timestamp: -1 }).limit(10).toArray();

      const songIds = recentAnalytics
        .map(a => a.songId)
        .filter(Boolean)
        .filter(id => ObjectId.isValid(id!));

      if (songIds.length === 0) return [];

      const songs = await this.songs.find({
        _id: { $in: songIds.map(id => new ObjectId(id!)) }
      }).toArray();

      // Get songs with artist names
      const songsWithArtistNames = await Promise.all(
        songs.map(async (song) => {
          const artist = await this.getArtistByUserId(song.artistId);
          return {
            ...this.convertSongDoc(song),
            artistName: artist?.name || "Unknown Artist"
          };
        })
      );

      return songsWithArtistNames;
    } catch (error) {
      console.error('Error getting recent plays by user:', error);
      return [];
    }
  }

  // Helper method to get artist name by artist profile ID
  async getArtistNameByProfileId(artistId: string): Promise<string> {
    try {
      const artist = await this.getArtistByUserId(artistId);
      return artist?.name || "Unknown Artist";
    } catch (error) {
      console.error("Error getting artist name:", error);
      return "Unknown Artist";
    }
  }

  // Enhanced method to get songs with artist names
  async getSongsWithArtistNames(options: { genre?: string; sort?: string; limit?: number } = {}): Promise<(Song & { artistName: string })[]> {
    try {
      const songs = await this.getAllSongs(options);

      const songsWithNames = await Promise.all(
        songs.map(async (song) => ({
          ...song,
          artistName: await this.getArtistNameByProfileId(song.artistId)
        }))
      );

      return songsWithNames;
    } catch (error) {
      console.error('Error getting songs with artist names:', error);
      return [];
    }
  }

  // Enhanced method to get events with artist names
  async getEventsWithArtistNames(filters: any): Promise<(Event & { artistName: string })[]> {
    try {
      const events = await this.getAllEventsFiltered(filters);

      const eventsWithNames = await Promise.all(
        events.map(async (event) => ({
          ...event,
          artistName: await this.getArtistNameByProfileId(event.artistId)
        }))
      );

      return eventsWithNames;
    } catch (error) {
      console.error('Error getting events with artist names:', error);
      return [];
    }
  }

  // Enhanced method to get merch with artist names
  async getMerchWithArtistNames(filters: any): Promise<(Merch & { artistName: string })[]> {
    try {
      const merchItems = await this.getAllMerchFiltered(filters);

      const merchWithNames = await Promise.all(
        merchItems.map(async (item) => ({
          ...item,
          artistName: await this.getArtistNameByProfileId(item.artistId)
        }))
      );

      return merchWithNames;
    } catch (error) {
      console.error('Error getting merch with artist names:', error);
      return [];
    }
  }
}

export const storage = new MongoStorage();