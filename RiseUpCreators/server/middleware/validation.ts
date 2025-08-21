import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';

/**
 * Middleware to validate request body against Zod schema
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(400).json({ message: 'Invalid request body' });
      }
    }
  };
};

/**
 * Middleware to validate query parameters against Zod schema
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Query validation error',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(400).json({ message: 'Invalid query parameters' });
      }
    }
  };
};

/**
 * Middleware to validate route parameters against Zod schema
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Parameter validation error',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(400).json({ message: 'Invalid route parameters' });
      }
    }
  };
};

// Common validation schemas
export const schemas = {
  // ID validation
  mongoId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  
  // Pagination
  pagination: z.object({
    page: z.string().transform(val => parseInt(val) || 1).optional(),
    limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),

  // User schemas
  createUser: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['fan', 'artist']).default('fan'),
  }),

  updateUser: z.object({
    name: z.string().min(2).optional(),
    bio: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    genres: z.array(z.string()).max(10).optional(),
    socialLinks: z.object({
      instagram: z.string().url().optional(),
      twitter: z.string().url().optional(),
      youtube: z.string().url().optional(),
      spotify: z.string().url().optional(),
      website: z.string().url().optional(),
    }).optional(),
  }),

  // Song schemas
  createSong: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    genre: z.string().optional(),
    description: z.string().max(1000).optional(),
    visibility: z.enum(['public', 'subscriber_only', 'private']).default('public'),
    isMonetized: z.boolean().default(true),
    adEnabled: z.boolean().default(true),
    price: z.number().min(0).optional(),
  }),

  updateSong: z.object({
    title: z.string().min(1).max(200).optional(),
    genre: z.string().optional(),
    description: z.string().max(1000).optional(),
    visibility: z.enum(['public', 'subscriber_only', 'private']).optional(),
    isMonetized: z.boolean().optional(),
    adEnabled: z.boolean().optional(),
    price: z.number().min(0).optional(),
  }),

  // Album schemas
  createAlbum: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(1000).optional(),
    type: z.enum(['album', 'ep', 'single']).default('album'),
    genres: z.array(z.string()).max(10).optional(),
    price: z.number().min(0).optional(),
    isPublic: z.boolean().default(true),
    releaseDate: z.string().datetime().optional(),
  }),

  // Playlist schemas
  createPlaylist: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().default(true),
    isCollaborative: z.boolean().default(false),
  }),

  updatePlaylist: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    isPublic: z.boolean().optional(),
    isCollaborative: z.boolean().optional(),
    songs: z.array(z.string()).optional(),
  }),

  // Product schemas
  createProduct: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    category: z.string().min(1, 'Category is required'),
    subcategory: z.string().optional(),
    price: z.number().min(0, 'Price must be positive'),
    currency: z.string().length(3).default('USD'),
    variants: z.array(z.object({
      name: z.string(),
      options: z.array(z.string()),
      priceModifier: z.number().default(0),
      stock: z.number().min(0).default(0),
    })).optional(),
    shipping: z.object({
      dimensions: z.object({
        length: z.number().min(0),
        width: z.number().min(0),
        height: z.number().min(0),
      }).optional(),
      weight: z.number().min(0).optional(),
      processingTime: z.string().optional(),
    }).optional(),
  }),

  // Event schemas
  createEvent: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    dateTime: z.string().datetime('Invalid date format'),
    endDateTime: z.string().datetime().optional(),
    timezone: z.string().default('UTC'),
    isOnline: z.boolean().default(false),
    venue: z.object({
      name: z.string().min(1, 'Venue name is required'),
      address: z.object({
        addressLine1: z.string(),
        addressLine2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string(),
      }),
      capacity: z.number().min(1),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }).optional(),
    }).optional(),
    ticketTypes: z.array(z.object({
      name: z.string().min(1, 'Ticket type name is required'),
      description: z.string().optional(),
      price: z.number().min(0),
      currency: z.string().length(3).default('USD'),
      capacity: z.number().min(1),
      salesStartDate: z.string().datetime().optional(),
      salesEndDate: z.string().datetime().optional(),
    })).min(1, 'At least one ticket type is required'),
  }),

  // Order schemas
  createOrder: z.object({
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      variant: z.string().optional(),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
    })).min(1, 'At least one item is required'),
    shipping: z.object({
      address: z.object({
        fullName: z.string().min(1, 'Full name is required'),
        addressLine1: z.string().min(1, 'Address is required'),
        addressLine2: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        phone: z.string().optional(),
      }),
      method: z.string().min(1, 'Shipping method is required'),
    }),
  }),

  // Blog schemas
  createBlog: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().max(300).optional(),
    tags: z.array(z.string()).max(10).optional(),
    category: z.string().optional(),
    visibility: z.object({
      isPublic: z.boolean().default(true),
      isSubscriberOnly: z.boolean().default(false),
    }).optional(),
    status: z.enum(['draft', 'published']).default('draft'),
  }),

  // Comment schemas
  createComment: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000),
    parentId: z.string().optional(),
  }),

  // Search schemas
  search: z.object({
    q: z.string().min(1, 'Search query is required').max(100),
    type: z.enum(['all', 'songs', 'artists', 'albums', 'playlists', 'events', 'products']).default('all'),
    genre: z.string().optional(),
    sortBy: z.enum(['relevance', 'date', 'popularity', 'alphabetical']).default('relevance'),
    page: z.string().transform(val => parseInt(val) || 1).optional(),
    limit: z.string().transform(val => Math.min(parseInt(val) || 20, 50)).optional(),
  }),

  // Report schemas
  createReport: z.object({
    contentType: z.enum(['song', 'album', 'playlist', 'blog', 'comment', 'user', 'event']),
    contentId: z.string().min(1, 'Content ID is required'),
    reason: z.enum([
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'copyright',
      'inappropriate_content',
      'misinformation',
      'other'
    ]),
    description: z.string().max(1000).optional(),
  }),
};

/**
 * File upload validation middleware
 */
export const createUploadMiddleware = (options: {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  fieldName: string;
}) => {
  const {
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedMimeTypes = [],
    maxFiles = 1,
    fieldName,
  } = options;

  const storage = multer.memoryStorage();

  const fileFilter = (req: any, file: any, cb: any) => {
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
      return;
    }
    cb(null, true);
  };

  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
    },
    fileFilter,
  });

  return maxFiles === 1 ? upload.single(fieldName) : upload.array(fieldName, maxFiles);
};

/**
 * Audio file upload middleware
 */
export const uploadAudio = createUploadMiddleware({
  fieldName: 'audio',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/flac',
    'audio/ogg',
    'audio/aac',
  ],
});

/**
 * Image file upload middleware
 */
export const uploadImage = createUploadMiddleware({
  fieldName: 'image',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
});

/**
 * Multiple images upload middleware
 */
export const uploadImages = createUploadMiddleware({
  fieldName: 'images',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
});

/**
 * General file upload middleware
 */
export const uploadFile = createUploadMiddleware({
  fieldName: 'file',
  maxFileSize: 25 * 1024 * 1024, // 25MB
});

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (req: Request, res: Response, next: NextFunction): void => {
  // Basic HTML sanitization - you might want to use a library like DOMPurify
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  next();
};

/**
 * Request size limit middleware
 */
export const limitRequestSize = (maxSize: number = 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      res.status(413).json({
        message: 'Request entity too large',
        maxSize: `${maxSize} bytes`,
      });
      return;
    }
    
    next();
  };
};
