import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dmt03mwbi',
  api_key: process.env.CLOUDINARY_API_KEY || '191484393995139',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'RckmQmNFCp70I1nOVs6FRQIcbrM',
});

export interface UploadOptions {
  folder?: string;
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  transformation?: any[];
  public_id?: string;
}

export class CloudinaryService {
  async uploadFile(
    file: Buffer | string,
    options: UploadOptions = {}
  ): Promise<{
    url: string;
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
  }> {
    try {
      const uploadOptions = {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'ruc',
        ...options,
      };

      const result = await cloudinary.uploader.upload(file as string, uploadOptions);
      
      return {
        url: result.url,
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  async uploadAudio(file: Buffer | string, options: Partial<UploadOptions> = {}) {
    return this.uploadFile(file, {
      ...options,
      resource_type: 'video', // Audio files are handled as video in Cloudinary
      folder: options.folder || 'ruc/audio',
    });
  }

  async uploadImage(file: Buffer | string, options: Partial<UploadOptions> = {}) {
    return this.uploadFile(file, {
      ...options,
      resource_type: 'image',
      folder: options.folder || 'ruc/images',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
        ...(options.transformation || []),
      ],
    });
  }

  async uploadArtwork(file: Buffer | string, options: Partial<UploadOptions> = {}) {
    return this.uploadImage(file, {
      ...options,
      folder: 'ruc/artwork',
      transformation: [
        { width: 800, height: 800, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
        ...(options.transformation || []),
      ],
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete file from Cloudinary');
    }
  }

  async generateWaveform(audioUrl: string): Promise<number[]> {
    // This is a placeholder implementation
    // In a real implementation, you would use Web Audio API or a service like WavesSurfer.js
    // to generate actual waveform data from the audio file
    
    // For now, return mock waveform data
    const waveformLength = 100;
    const waveform = [];
    
    for (let i = 0; i < waveformLength; i++) {
      waveform.push(Math.random() * 100);
    }
    
    return waveform;
  }

  getTransformedUrl(publicId: string, transformations: any[] = []): string {
    return cloudinary.url(publicId, {
      transformation: transformations,
    });
  }

  getOptimizedImageUrl(publicId: string, width?: number, height?: number): string {
    const transformations = [
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ];

    if (width || height) {
      transformations.push({
        width,
        height,
        crop: 'fill',
      });
    }

    return this.getTransformedUrl(publicId, transformations);
  }
}

export const cloudinaryService = new CloudinaryService();
