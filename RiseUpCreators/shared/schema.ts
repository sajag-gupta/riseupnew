import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Enums
export const userRoles = ['fan', 'artist', 'admin'] as const;
export const verificationStatuses = ['pending', 'approved', 'rejected'] as const;
export const visibilityTypes = ['public', 'subscriber_only', 'private'] as const;
export const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
export const subscriptionStatuses = ['active', 'cancelled', 'expired', 'paused'] as const;
export const eventStatuses = ['draft', 'published', 'cancelled', 'completed'] as const;
export const contentStatuses = ['draft', 'published', 'archived'] as const;
export const adStatuses = ['draft', 'pending', 'active', 'paused', 'completed'] as const;
export const reportStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'] as const;
export const ticketStatuses = ['valid', 'used', 'refunded', 'transferred'] as const;

// User Interface and Schema
export interface IUser extends Document {
  _id: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: typeof userRoles[number];
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: Date;
  genres: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    website?: string;
  };
  settings: {
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
  };
  subscription: {
    isPremium: boolean;
    plan?: string;
    startDate?: Date;
    endDate?: Date;
    autoRenew: boolean;
  };
  analytics: {
    totalPlays: number;
    totalFollowers: number;
    deviceInfo?: any;
  };
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, maxlength: 255 },
  passwordHash: { type: String, maxlength: 255 },
  googleId: { type: String, maxlength: 255 },
  role: { type: String, enum: userRoles, default: 'fan', required: true },
  name: { type: String, required: true, maxlength: 255 },
  avatar: { type: String, maxlength: 500 },
  bio: String,
  location: { type: String, maxlength: 255 },
  dateOfBirth: Date,
  genres: { type: [String], default: [] },
  socialLinks: {
    instagram: String,
    twitter: String,
    youtube: String,
    spotify: String,
    website: String,
    _id: false
  },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    privacy: {
      showListeningActivity: { type: Boolean, default: true },
      showPlaylists: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true },
      _id: false
    },
    adPreferences: {
      personalizedAds: { type: Boolean, default: true },
      frequency: { type: String, default: 'normal' },
      _id: false
    },
    _id: false
  },
  subscription: {
    isPremium: { type: Boolean, default: false },
    plan: String,
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: false },
    _id: false
  },
  analytics: {
    totalPlays: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    deviceInfo: Schema.Types.Mixed,
    _id: false
  },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Artist Interface and Schema
export interface IArtist extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  verification: {
    status: typeof verificationStatuses[number];
    submittedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    notes?: string;
    documents?: string[];
  };
  stats: {
    monthlyListeners: number;
    totalStreams: number;
    totalRevenue: number;
    followerGrowth: { date: Date; count: number }[];
    topCountries: { country: string; percentage: number }[];
  };
  revenue: {
    subscriptions: number;
    merchandise: number;
    events: number;
    ads: number;
    tips: number;
  };
  payout: {
    bankDetails?: any;
    paypalEmail?: string;
    taxInfo?: any;
    pendingAmount: number;
    lastPayoutDate?: Date;
    payoutHistory: any[];
  };
  featured: boolean;
  trendingScore: number;
  followers: string[];
  createdAt: Date;
  updatedAt: Date;
}

const artistSchema = new Schema<IArtist>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  verification: {
    status: { type: String, enum: verificationStatuses, default: 'pending' },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: String,
    notes: String,
    documents: [String],
    _id: false
  },
  stats: {
    monthlyListeners: { type: Number, default: 0 },
    totalStreams: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    followerGrowth: [{ date: Date, count: Number, _id: false }],
    topCountries: [{ country: String, percentage: Number, _id: false }],
    _id: false
  },
  revenue: {
    subscriptions: { type: Number, default: 0 },
    merchandise: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
    ads: { type: Number, default: 0 },
    tips: { type: Number, default: 0 },
    _id: false
  },
  payout: {
    bankDetails: Schema.Types.Mixed,
    paypalEmail: String,
    taxInfo: Schema.Types.Mixed,
    pendingAmount: { type: Number, default: 0 },
    lastPayoutDate: Date,
    payoutHistory: { type: [Schema.Types.Mixed], default: [] },
    _id: false
  },
  featured: { type: Boolean, default: false },
  trendingScore: { type: Number, default: 0 },
  followers: { type: [String], default: [] }
}, { timestamps: true });

// Album Interface and Schema
export interface IAlbum extends Document {
  _id: string;
  title: string;
  artistId: mongoose.Types.ObjectId;
  description?: string;
  releaseDate?: Date;
  type: string;
  artwork?: string;
  genres: string[];
  totalDuration: number;
  price?: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const albumSchema = new Schema<IAlbum>({
  title: { type: String, required: true, maxlength: 255 },
  artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  description: String,
  releaseDate: Date,
  type: { type: String, maxlength: 50, default: 'album' },
  artwork: { type: String, maxlength: 500 },
  genres: { type: [String], default: [] },
  totalDuration: { type: Number, default: 0 },
  price: Number,
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

// Song Interface and Schema
export interface ISong extends Document {
  _id: string;
  title: string;
  artistId: mongoose.Types.ObjectId;
  albumId?: mongoose.Types.ObjectId;
  collaborators: string[];
  genre?: string;
  subGenres: string[];
  duration: number;
  releaseDate: Date;
  files: {
    audioUrl: string;
    audioFileId: string;
    artworkUrl?: string;
    artworkFileId?: string;
    waveformData?: number[];
  };
  metadata: {
    bpm?: number;
    key?: string;
    mood?: string;
    energy?: number;
    danceability?: number;
    tags?: string[];
    lyrics?: string;
    credits?: { role: string; name: string }[];
  };
  visibility: typeof visibilityTypes[number];
  monetization: {
    isMonetized: boolean;
    adEnabled: boolean;
    price?: number;
    royaltySplit?: { collaborator: string; percentage: number }[];
  };
  analytics: {
    playCount: number;
    uniqueListeners: number;
    likeCount: number;
    shareCount: number;
    downloadCount: number;
    trendingScore: number;
    demographics?: any;
    playHistory: { date: Date; plays: number }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const songSchema = new Schema<ISong>({
  title: { type: String, required: true, maxlength: 255 },
  artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  albumId: { type: Schema.Types.ObjectId, ref: 'Album' },
  collaborators: { type: [String], default: [] },
  genre: { type: String, maxlength: 100 },
  subGenres: { type: [String], default: [] },
  duration: { type: Number, required: true },
  releaseDate: { type: Date, default: Date.now },
  files: {
    audioUrl: { type: String, required: true },
    audioFileId: { type: String, required: true },
    artworkUrl: String,
    artworkFileId: String,
    waveformData: [Number],
    _id: false
  },
  metadata: {
    bpm: Number,
    key: String,
    mood: String,
    energy: Number,
    danceability: Number,
    tags: [String],
    lyrics: String,
    credits: [{ role: String, name: String, _id: false }],
    _id: false
  },
  visibility: { type: String, enum: visibilityTypes, default: 'public' },
  monetization: {
    isMonetized: { type: Boolean, default: false },
    adEnabled: { type: Boolean, default: true },
    price: Number,
    royaltySplit: [{ collaborator: String, percentage: Number, _id: false }],
    _id: false
  },
  analytics: {
    playCount: { type: Number, default: 0 },
    uniqueListeners: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 },
    demographics: Schema.Types.Mixed,
    playHistory: [{ date: Date, plays: Number, _id: false }],
    _id: false
  }
}, { timestamps: true });

// Playlist Interface and Schema
export interface IPlaylist extends Document {
  _id: string;
  name: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  songs: string[];
  coverArt?: string;
  isPublic: boolean;
  isCollaborative: boolean;
  collaborators: string[];
  analytics: {
    playCount: number;
    likeCount: number;
    shareCount: number;
    followerCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>({
  name: { type: String, required: true, maxlength: 255 },
  description: String,
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  songs: { type: [String], default: [] },
  coverArt: { type: String, maxlength: 500 },
  isPublic: { type: Boolean, default: false },
  isCollaborative: { type: Boolean, default: false },
  collaborators: { type: [String], default: [] },
  analytics: {
    playCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    _id: false
  }
}, { timestamps: true });

// Subscription Interface and Schema
export interface ISubscription extends Document {
  _id: string;
  fanId: mongoose.Types.ObjectId;
  artistId: mongoose.Types.ObjectId;
  tier: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    perks: string[];
  };
  status: typeof subscriptionStatuses[number];
  startDate: Date;
  endDate?: Date;
  nextBillDate?: Date;
  payment: {
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;
    paymentMethod?: any;
  };
  analytics: {
    totalPaid: number;
    renewalCount: number;
    engagementScore: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  fanId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  tier: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    interval: { type: String, required: true },
    perks: { type: [String], required: true },
    _id: false
  },
  status: { type: String, enum: subscriptionStatuses, default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  nextBillDate: Date,
  payment: {
    razorpaySubscriptionId: String,
    razorpayCustomerId: String,
    paymentMethod: Schema.Types.Mixed,
    _id: false
  },
  analytics: {
    totalPaid: { type: Number, default: 0 },
    renewalCount: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    _id: false
  }
}, { timestamps: true });

// Product Interface and Schema
export interface IProduct extends Document {
  _id: string;
  name: string;
  description?: string;
  artistId: mongoose.Types.ObjectId;
  category?: string;
  subcategory?: string;
  price: number;
  currency: string;
  images: string[];
  mainImage?: string;
  variants: {
    name: string;
    options: string[];
    priceModifier: number;
    stock: number;
  }[];
  inventory: {
    totalStock: number;
    soldCount: number;
    lowStockThreshold: number;
    isInStock: boolean;
  };
  shipping: {
    dimensions: { length: number; width: number; height: number };
    weight: number;
    shippingRates: { region: string; rate: number }[];
    processingTime: string;
  };
  seo: {
    tags: string[];
    metaDescription?: string;
  };
  analytics: {
    viewCount: number;
    addToCartCount: number;
    purchaseCount: number;
    revenue: number;
    conversionRate: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, maxlength: 255 },
  description: String,
  artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  category: { type: String, maxlength: 100 },
  subcategory: { type: String, maxlength: 100 },
  price: { type: Number, required: true },
  currency: { type: String, maxlength: 3, default: 'USD' },
  images: { type: [String], default: [] },
  mainImage: { type: String, maxlength: 500 },
  variants: [{
    name: String,
    options: [String],
    priceModifier: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    _id: false
  }],
  inventory: {
    totalStock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isInStock: { type: Boolean, default: true },
    _id: false
  },
  shipping: {
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      _id: false
    },
    weight: { type: Number, default: 0 },
    shippingRates: [{ region: String, rate: Number, _id: false }],
    processingTime: { type: String, default: '1-3 business days' },
    _id: false
  },
  seo: {
    tags: { type: [String], default: [] },
    metaDescription: String,
    _id: false
  },
  analytics: {
    viewCount: { type: Number, default: 0 },
    addToCartCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    _id: false
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Event Interface and Schema
export interface IEvent extends Document {
  _id: string;
  title: string;
  description?: string;
  artistId: mongoose.Types.ObjectId;
  collaborators: string[];
  dateTime: Date;
  endDateTime?: Date;
  timezone: string;
  venue: {
    name: string;
    address: any;
    capacity?: number;
    coordinates?: { lat: number; lng: number };
  };
  isOnline: boolean;
  streamUrl?: string;
  ticketTypes: {
    name: string;
    description: string;
    price: number;
    currency: string;
    capacity: number;
    sold: number;
    salesStartDate?: Date;
    salesEndDate?: Date;
    perks: string[];
  }[];
  media: {
    bannerImage?: string;
    gallery?: string[];
    promoVideo?: string;
  };
  settings: {
    ageRestriction?: number;
    dresscode?: string;
    refundPolicy?: string;
    transferPolicy?: string;
  };
  analytics: {
    viewCount: number;
    interestedCount: number;
    ticketsSold: number;
    revenue: number;
    attendance?: number;
    satisfaction?: number;
  };
  status: typeof eventStatuses[number];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true, maxlength: 255 },
  description: String,
  artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  collaborators: { type: [String], default: [] },
  dateTime: { type: Date, required: true },
  endDateTime: Date,
  timezone: { type: String, default: 'UTC', maxlength: 50 },
  venue: {
    name: { type: String, required: true },
    address: { type: Schema.Types.Mixed, required: true },
    capacity: Number,
    coordinates: { lat: Number, lng: Number, _id: false },
    _id: false
  },
  isOnline: { type: Boolean, default: false },
  streamUrl: { type: String, maxlength: 500 },
  ticketTypes: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    capacity: { type: Number, required: true },
    sold: { type: Number, default: 0 },
    salesStartDate: Date,
    salesEndDate: Date,
    perks: [String],
    _id: false
  }],
  media: {
    bannerImage: String,
    gallery: [String],
    promoVideo: String,
    _id: false
  },
  settings: {
    ageRestriction: Number,
    dresscode: String,
    refundPolicy: String,
    transferPolicy: String,
    _id: false
  },
  analytics: {
    viewCount: { type: Number, default: 0 },
    interestedCount: { type: Number, default: 0 },
    ticketsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    attendance: Number,
    satisfaction: Number,
    _id: false
  },
  status: { type: String, enum: eventStatuses, default: 'draft' }
}, { timestamps: true });

// Order Interface and Schema
export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  buyerId: mongoose.Types.ObjectId;
  items: {
    productId?: string;
    eventId?: string;
    variant?: string;
    quantity: number;
    price: number;
    artistId: string;
  }[];
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  shipping?: {
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
  };
  payment: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    method: string;
    status: string;
    paidAt?: Date;
  };
  status: typeof orderStatuses[number];
  timeline: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true, maxlength: 50 },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: String,
    eventId: String,
    variant: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    artistId: { type: String, required: true },
    _id: false
  }],
  totals: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, required: true },
    _id: false
  },
  shipping: {
    address: {
      fullName: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
      _id: false
    },
    method: String,
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    _id: false
  },
  payment: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    method: { type: String, required: true },
    status: { type: String, required: true },
    paidAt: Date,
    _id: false
  },
  status: { type: String, enum: orderStatuses, default: 'pending' },
  timeline: [{
    status: String,
    timestamp: Date,
    note: String,
    _id: false
  }]
}, { timestamps: true });

// Ticket Interface and Schema
export interface ITicket extends Document {
  _id: string;
  eventId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  ticketType: string;
  price: number;
  currency: string;
  qrCode?: string;
  ticketNumber: string;
  seatInfo: {
    section?: string;
    row?: string;
    seat?: string;
  };
  status: typeof ticketStatuses[number];
  usedAt?: Date;
  transferredTo?: mongoose.Types.ObjectId;
  payment: {
    razorpayPaymentId?: string;
    purchaseDate: Date;
    refundId?: string;
  };
  additionalInfo: any;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  ticketType: { type: String, required: true, maxlength: 100 },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD', maxlength: 3 },
  qrCode: { type: String, maxlength: 500 },
  ticketNumber: { type: String, required: true, unique: true, maxlength: 50 },
  seatInfo: {
    section: String,
    row: String,
    seat: String,
    _id: false
  },
  status: { type: String, enum: ticketStatuses, default: 'valid' },
  usedAt: Date,
  transferredTo: { type: Schema.Types.ObjectId, ref: 'User' },
  payment: {
    razorpayPaymentId: String,
    purchaseDate: { type: Date, required: true },
    refundId: String,
    _id: false
  },
  additionalInfo: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Blog Interface and Schema
export interface IBlog extends Document {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  authorId: mongoose.Types.ObjectId;
  featuredImage?: string;
  gallery: string[];
  embeddedMedia: {
    type: string;
    url: string;
    metadata?: any;
  }[];
  tags: string[];
  category?: string;
  visibility: typeof visibilityTypes[number];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    slug: string;
  };
  engagement: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    readTime: number;
  };
  status: typeof contentStatuses[number];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true, maxlength: 255 },
  content: { type: String, required: true },
  excerpt: { type: String, maxlength: 500 },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  featuredImage: { type: String, maxlength: 500 },
  gallery: { type: [String], default: [] },
  embeddedMedia: [{
    type: String,
    url: String,
    metadata: Schema.Types.Mixed,
    _id: false
  }],
  tags: { type: [String], default: [] },
  category: { type: String, maxlength: 100 },
  visibility: { type: String, enum: visibilityTypes, default: 'public' },
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: { type: String, required: true },
    _id: false
  },
  engagement: {
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    readTime: { type: Number, default: 0 },
    _id: false
  },
  status: { type: String, enum: contentStatuses, default: 'draft' },
  publishedAt: Date
}, { timestamps: true });

// Blog Comment Interface and Schema
export interface IBlogComment extends Document {
  _id: string;
  blogId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  parentId?: mongoose.Types.ObjectId;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogCommentSchema = new Schema<IBlogComment>({
  blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'BlogComment' },
  likes: { type: Number, default: 0 }
}, { timestamps: true });

// Ad Interface and Schema
export interface IAd extends Document {
  _id: string;
  campaign: {
    name: string;
    advertiser: string;
    contactEmail: string;
    budget: number;
    dailyBudget?: number;
    currency: string;
  };
  creative: {
    type: 'audio' | 'banner' | 'video';
    audioFile?: string;
    bannerImage?: string;
    videoFile?: string;
    duration?: number;
    clickUrl?: string;
    callToAction?: string;
  };
  targeting: {
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
      dayParting?: any;
      timezone: string;
    };
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    cpm: number;
    completionRate: number;
  };
  status: typeof adStatuses[number];
  createdAt: Date;
  updatedAt: Date;
}

const adSchema = new Schema<IAd>({
  campaign: {
    name: { type: String, required: true },
    advertiser: { type: String, required: true },
    contactEmail: { type: String, required: true },
    budget: { type: Number, required: true },
    dailyBudget: Number,
    currency: { type: String, required: true },
    _id: false
  },
  creative: {
    type: { type: String, enum: ['audio', 'banner', 'video'], required: true },
    audioFile: String,
    bannerImage: String,
    videoFile: String,
    duration: Number,
    clickUrl: String,
    callToAction: String,
    _id: false
  },
  targeting: {
    demographics: {
      ageRange: { min: Number, max: Number, _id: false },
      gender: [String],
      locations: [String],
      languages: [String],
      _id: false
    },
    interests: {
      genres: [String],
      artistTypes: [String],
      behaviors: [String],
      _id: false
    },
    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      dayParting: Schema.Types.Mixed,
      timezone: { type: String, required: true },
      _id: false
    },
    _id: false
  },
  performance: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    _id: false
  },
  status: { type: String, enum: adStatuses, default: 'draft' }
}, { timestamps: true });

// Analytics Interface and Schema
export interface IAnalytics extends Document {
  _id: string;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  eventType: string;
  eventData: {
    action: string;
    category: string;
    label?: string;
    value?: number;
    metadata?: any;
  };
  context: {
    page: string;
    userAgent?: string;
    deviceType?: string;
    location?: any;
    referrer?: string;
  };
  timestamp: Date;
}

const analyticsSchema = new Schema<IAnalytics>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, maxlength: 255 },
  eventType: { type: String, required: true, maxlength: 100 },
  eventData: {
    action: { type: String, required: true },
    category: { type: String, required: true },
    label: String,
    value: Number,
    metadata: Schema.Types.Mixed,
    _id: false
  },
  context: {
    page: { type: String, required: true },
    userAgent: String,
    deviceType: String,
    location: Schema.Types.Mixed,
    referrer: String,
    _id: false
  },
  timestamp: { type: Date, default: Date.now }
});

// Notification Interface and Schema
export interface INotification extends Document {
  _id: string;
  recipientId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  priority: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, maxlength: 100 },
  title: { type: String, required: true, maxlength: 255 },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  actionUrl: { type: String, maxlength: 500 },
  priority: { type: String, default: 'medium', maxlength: 20 }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Report Interface and Schema
export interface IReport extends Document {
  _id: string;
  reporterId: mongoose.Types.ObjectId;
  contentType: string;
  contentId: string;
  reason: string;
  description?: string;
  status: typeof reportStatuses[number];
  moderatorId?: mongoose.Types.ObjectId;
  moderatorNotes?: string;
  action?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const reportSchema = new Schema<IReport>({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contentType: { type: String, required: true, maxlength: 50 },
  contentId: { type: String, required: true },
  reason: { type: String, required: true, maxlength: 255 },
  description: String,
  status: { type: String, enum: reportStatuses, default: 'pending' },
  moderatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  moderatorNotes: String,
  action: { type: String, maxlength: 100 },
  resolvedAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } });

// Follow Interface and Schema
export interface IFollow extends Document {
  _id: string;
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>({
  followerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  followingId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Like Interface and Schema
export interface ILike extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  songId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Create Models
export const User = mongoose.model<IUser>('User', userSchema);
export const Artist = mongoose.model<IArtist>('Artist', artistSchema);
export const Album = mongoose.model<IAlbum>('Album', albumSchema);
export const Song = mongoose.model<ISong>('Song', songSchema);
export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
export const Product = mongoose.model<IProduct>('Product', productSchema);
export const Event = mongoose.model<IEvent>('Event', eventSchema);
export const Order = mongoose.model<IOrder>('Order', orderSchema);
export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
export const Blog = mongoose.model<IBlog>('Blog', blogSchema);
export const BlogComment = mongoose.model<IBlogComment>('BlogComment', blogCommentSchema);
export const Ad = mongoose.model<IAd>('Ad', adSchema);
export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const Report = mongoose.model<IReport>('Report', reportSchema);
export const Follow = mongoose.model<IFollow>('Follow', followSchema);
export const Like = mongoose.model<ILike>('Like', likeSchema);

// Zod validation schemas
export const insertUserSchema = z.object({
  email: z.string().email().max(255),
  passwordHash: z.string().max(255).optional(),
  googleId: z.string().max(255).optional(),
  role: z.enum(userRoles).default('fan'),
  name: z.string().max(255),
  avatar: z.string().max(500).optional(),
  bio: z.string().optional(),
  location: z.string().max(255).optional(),
  dateOfBirth: z.date().optional(),
  genres: z.array(z.string()).default([]),
  socialLinks: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    spotify: z.string().optional(),
    website: z.string().optional(),
  }).default({}),
  settings: z.object({
    emailNotifications: z.boolean().default(true),
    pushNotifications: z.boolean().default(true),
    privacy: z.object({
      showListeningActivity: z.boolean().default(true),
      showPlaylists: z.boolean().default(true),
      allowMessages: z.boolean().default(true),
    }),
    adPreferences: z.object({
      personalizedAds: z.boolean().default(true),
      frequency: z.string().default('normal'),
    }),
  }),
  subscription: z.object({
    isPremium: z.boolean().default(false),
    plan: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    autoRenew: z.boolean().default(false),
  }),
  analytics: z.object({
    totalPlays: z.number().default(0),
    totalFollowers: z.number().default(0),
    deviceInfo: z.any().optional(),
  }),
}).partial();

// Zod validation schemas for inserts
export const insertSongSchema = z.object({
  title: z.string().min(1).max(255),
  artistId: z.string(),
  albumId: z.string().optional(),
  collaborators: z.array(z.string()).default([]),
  genre: z.string().max(100).optional(),
  subGenres: z.array(z.string()).default([]),
  duration: z.number(),
  releaseDate: z.date().default(() => new Date()),
  files: z.object({
    audioUrl: z.string(),
    audioFileId: z.string(),
    artworkUrl: z.string().optional(),
    artworkFileId: z.string().optional(),
    waveformData: z.array(z.number()).optional(),
  }),
  metadata: z.object({
    bpm: z.number().optional(),
    key: z.string().optional(),
    mood: z.string().optional(),
    energy: z.number().optional(),
    danceability: z.number().optional(),
    tags: z.array(z.string()).optional(),
    lyrics: z.string().optional(),
    credits: z.array(z.object({
      role: z.string(),
      name: z.string(),
    })).optional(),
  }).optional(),
  visibility: z.enum(visibilityTypes).default('public'),
  monetization: z.object({
    isMonetized: z.boolean().default(false),
    adEnabled: z.boolean().default(true),
    price: z.number().optional(),
    royaltySplit: z.array(z.object({
      collaborator: z.string(),
      percentage: z.number(),
    })).optional(),
  }).optional(),
}).partial();

export const insertAlbumSchema = z.object({
  title: z.string().min(1).max(255),
  artistId: z.string(),
  description: z.string().optional(),
  releaseDate: z.date().optional(),
  type: z.string().max(50).default('album'),
  artwork: z.string().max(500).optional(),
  genres: z.array(z.string()).default([]),
  totalDuration: z.number().default(0),
  price: z.number().optional(),
  isPublic: z.boolean().default(true),
}).partial();

export const insertPlaylistSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: z.string(),
  songs: z.array(z.string()).default([]),
  coverArt: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  isCollaborative: z.boolean().default(false),
  collaborators: z.array(z.string()).default([]),
}).partial();

export const insertProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  artistId: z.string(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  price: z.number(),
  currency: z.string().max(3).default('USD'),
  images: z.array(z.string()).default([]),
  mainImage: z.string().max(500).optional(),
  variants: z.array(z.object({
    name: z.string(),
    options: z.array(z.string()),
    priceModifier: z.number().default(0),
    stock: z.number().default(0),
  })).default([]),
  inventory: z.object({
    totalStock: z.number().default(0),
    soldCount: z.number().default(0),
    lowStockThreshold: z.number().default(5),
    isInStock: z.boolean().default(true),
  }).optional(),
  shipping: z.object({
    dimensions: z.object({
      length: z.number().default(0),
      width: z.number().default(0),
      height: z.number().default(0),
    }),
    weight: z.number().default(0),
    shippingRates: z.array(z.object({
      region: z.string(),
      rate: z.number(),
    })).default([]),
    processingTime: z.string().default('1-3 business days'),
  }).optional(),
  seo: z.object({
    tags: z.array(z.string()).default([]),
    metaDescription: z.string().optional(),
  }).optional(),
  isActive: z.boolean().default(true),
}).partial();

export const insertEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  artistId: z.string(),
  collaborators: z.array(z.string()).default([]),
  dateTime: z.date(),
  endDateTime: z.date().optional(),
  timezone: z.string().max(50).default('UTC'),
  venue: z.object({
    name: z.string(),
    address: z.any(),
    capacity: z.number().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  isOnline: z.boolean().default(false),
  streamUrl: z.string().max(500).optional(),
  ticketTypes: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    currency: z.string().default('USD'),
    capacity: z.number(),
    sold: z.number().default(0),
    salesStartDate: z.date().optional(),
    salesEndDate: z.date().optional(),
    perks: z.array(z.string()).default([]),
  })).default([]),
  media: z.object({
    bannerImage: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    promoVideo: z.string().optional(),
  }).optional(),
  settings: z.object({
    ageRestriction: z.number().optional(),
    dresscode: z.string().optional(),
    refundPolicy: z.string().optional(),
    transferPolicy: z.string().optional(),
  }).optional(),
  status: z.enum(eventStatuses).default('draft'),
}).partial();

export const insertOrderSchema = z.object({
  orderNumber: z.string().max(50),
  buyerId: z.string(),
  items: z.array(z.object({
    productId: z.string().optional(),
    eventId: z.string().optional(),
    variant: z.string().optional(),
    quantity: z.number(),
    price: z.number(),
    artistId: z.string(),
  })),
  totals: z.object({
    subtotal: z.number(),
    shipping: z.number(),
    tax: z.number(),
    discount: z.number(),
    total: z.number(),
    currency: z.string(),
  }),
  shipping: z.object({
    address: z.object({
      fullName: z.string(),
      addressLine1: z.string(),
      addressLine2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
      phone: z.string().optional(),
    }),
    method: z.string(),
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
    estimatedDelivery: z.date().optional(),
  }).optional(),
  payment: z.object({
    razorpayOrderId: z.string().optional(),
    razorpayPaymentId: z.string().optional(),
    method: z.string(),
    status: z.string(),
    paidAt: z.date().optional(),
  }),
  status: z.enum(orderStatuses).default('pending'),
  timeline: z.array(z.object({
    status: z.string(),
    timestamp: z.date(),
    note: z.string().optional(),
  })).default([]),
}).partial();

export const insertSubscriptionSchema = z.object({
  fanId: z.string(),
  artistId: z.string(),
  tier: z.object({
    name: z.string(),
    price: z.number(),
    currency: z.string(),
    interval: z.string(),
    perks: z.array(z.string()),
  }),
  status: z.enum(subscriptionStatuses).default('active'),
  startDate: z.date().default(() => new Date()),
  endDate: z.date().optional(),
  nextBillDate: z.date().optional(),
  payment: z.object({
    razorpaySubscriptionId: z.string().optional(),
    razorpayCustomerId: z.string().optional(),
    paymentMethod: z.any().optional(),
  }).optional(),
}).partial();

export const insertBlogSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  excerpt: z.string().max(500).optional(),
  authorId: z.string(),
  featuredImage: z.string().max(500).optional(),
  gallery: z.array(z.string()).default([]),
  embeddedMedia: z.array(z.object({
    type: z.string(),
    url: z.string(),
    metadata: z.any().optional(),
  })).default([]),
  tags: z.array(z.string()).default([]),
  category: z.string().max(100).optional(),
  visibility: z.enum(visibilityTypes).default('public'),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    slug: z.string(),
  }),
  status: z.enum(contentStatuses).default('draft'),
  publishedAt: z.date().optional(),
}).partial();

export const insertReportSchema = z.object({
  reporterId: z.string(),
  contentType: z.string().max(50),
  contentId: z.string(),
  reason: z.string().max(255),
  description: z.string().optional(),
  status: z.enum(reportStatuses).default('pending'),
  moderatorId: z.string().optional(),
  moderatorNotes: z.string().optional(),
  action: z.string().max(100).optional(),
  resolvedAt: z.date().optional(),
}).partial();

export const insertAdSchema = z.object({
  campaign: z.object({
    name: z.string(),
    advertiser: z.string(),
    contactEmail: z.string(),
    budget: z.number(),
    dailyBudget: z.number().optional(),
    currency: z.string(),
  }),
  creative: z.object({
    type: z.enum(['audio', 'banner', 'video']),
    audioFile: z.string().optional(),
    bannerImage: z.string().optional(),
    videoFile: z.string().optional(),
    duration: z.number().optional(),
    clickUrl: z.string().optional(),
    callToAction: z.string().optional(),
  }),
  targeting: z.object({
    demographics: z.object({
      ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
      gender: z.array(z.string()).optional(),
      locations: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
    }).optional(),
    interests: z.object({
      genres: z.array(z.string()).optional(),
      artistTypes: z.array(z.string()).optional(),
      behaviors: z.array(z.string()).optional(),
    }).optional(),
    schedule: z.object({
      startDate: z.date(),
      endDate: z.date(),
      dayParting: z.any().optional(),
      timezone: z.string(),
    }),
  }),
  status: z.enum(adStatuses).default('draft'),
}).partial();

// Export types using the interfaces
export type User = IUser;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Artist = IArtist;
export type InsertArtist = Partial<Omit<IArtist, '_id' | 'createdAt' | 'updatedAt'>>;
export type Song = ISong;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Album = IAlbum;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Playlist = IPlaylist;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Subscription = ISubscription;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Product = IProduct;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Event = IEvent;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Order = IOrder;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Ticket = ITicket;
export type InsertTicket = Partial<Omit<ITicket, '_id' | 'createdAt' | 'updatedAt'>>;
export type Blog = IBlog;
export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type BlogComment = IBlogComment;
export type InsertBlogComment = Partial<Omit<IBlogComment, '_id' | 'createdAt' | 'updatedAt'>>;
export type Ad = IAd;
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Analytics = IAnalytics;
export type InsertAnalytics = Partial<Omit<IAnalytics, '_id'>>;
export type Notification = INotification;
export type InsertNotification = Partial<Omit<INotification, '_id' | 'createdAt'>>;
export type Report = IReport;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Follow = IFollow;
export type InsertFollow = Partial<Omit<IFollow, '_id' | 'createdAt'>>;
export type Like = ILike;
export type InsertLike = Partial<Omit<ILike, '_id' | 'createdAt'>>;

// Export default mongoose connection
export default mongoose;
