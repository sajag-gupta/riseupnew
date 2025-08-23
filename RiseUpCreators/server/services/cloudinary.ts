import { v2 as cloudinary } from "cloudinary";

// ------------------------ Config ------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dmt03mwbi",
  api_key: process.env.CLOUDINARY_API_KEY || "191484393995139",
  api_secret: process.env.CLOUDINARY_API_SECRET || "RckmQmNFCp70I1nOVs6FRQIcbrM",
});

export interface UploadOptions {
  folder?: string;
  resource_type?: "auto" | "image" | "video" | "raw";
  transformation?: any[];
  public_id?: string;
  format?: string;
}

// ------------------------ Helpers ------------------------
function uploadBuffer(buffer: Buffer, options: UploadOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      if (!result) return reject(new Error("Cloudinary returned no result"));
      resolve(result);
    });
    stream.end(buffer);
  });
}

// ------------------------ Cloudinary Service ------------------------
export class CloudinaryService {
  async uploadFile(
    file: Buffer | string,
    mimetype?: string,
    options: UploadOptions = {}
  ): Promise<any> {
    try {
      const uploadOptions: UploadOptions = {
        resource_type: options.resource_type || "auto",
        folder: options.folder || "ruc",
        ...options,
      };

      let result;

      if (typeof file === "string") {
        // base64 string or remote URL
        result = await cloudinary.uploader.upload(file, uploadOptions);
      } else {
        // Buffer → use stream
        result = await uploadBuffer(file, uploadOptions);
      }

      return {
        url: result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        original_filename: result.original_filename,
        etag: result.etag,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload file to Cloudinary");
    }
  }

  // ------------------------ Specialized Uploads ------------------------
  async uploadAudio(file: Buffer, mimetype: string, options: Partial<UploadOptions> = {}) {
    return this.uploadFile(file, mimetype, {
      ...options,
      resource_type: "video", // ✅ audio must be uploaded as video
      folder: options.folder || "ruc/audio",
      // format left undefined → Cloudinary auto-detects mp3/wav/flac correctly
    });
  }

  async uploadImage(file: Buffer, mimetype: string, options: Partial<UploadOptions> = {}) {
    return this.uploadFile(file, mimetype, {
      ...options,
      resource_type: "image",
      folder: options.folder || "ruc/images",
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" },
        ...(options.transformation || []),
      ],
    });
  }

  async uploadArtwork(file: Buffer, mimetype: string, options: Partial<UploadOptions> = {}) {
    return this.uploadFile(file, mimetype, {
      ...options,
      resource_type: "image",
      folder: options.folder || "ruc/artwork",
      transformation: [
        { width: 1000, height: 1000, crop: "fill" },
        { quality: "auto" },
        { fetch_format: "auto" },
        ...(options.transformation || []),
      ],
    });
  }

  // ------------------------ Deletion ------------------------
  async deleteFile(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("Failed to delete file from Cloudinary");
    }
  }

  async deleteAudio(publicId: string): Promise<void> {
    return this.deleteFile(publicId, "video");
  }

  async deleteArtwork(publicId: string): Promise<void> {
    return this.deleteFile(publicId, "image");
  }

  // ------------------------ Utilities ------------------------
  async generateWaveform(audioUrl: string): Promise<number[]> {
    return Array.from({ length: 100 }, () => Math.random() * 100);
  }

  getTransformedUrl(publicId: string, transformations: any[] = []): string {
    return cloudinary.url(publicId, { transformation: transformations });
  }

  getOptimizedImageUrl(publicId: string, width?: number, height?: number): string {
    const transformations: any[] = [{ quality: "auto" }, { fetch_format: "auto" }];
    if (width || height) transformations.push({ width, height, crop: "fill" });
    return this.getTransformedUrl(publicId, transformations);
  }
}

// ------------------------ Singleton Export ------------------------
export const cloudinaryService = new CloudinaryService();
