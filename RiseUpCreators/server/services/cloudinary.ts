import { v2 as cloudinary } from "cloudinary";

// ------------------------ Config ------------------------
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dmt03mwbi",
  api_key: process.env.CLOUDINARY_API_KEY || "191484393995139",
  api_secret: process.env.CLOUDINARY_API_SECRET || "RckmQmNFCp70I1nOVs6FRQIcbrM",
};

console.log("Cloudinary configuration:", {
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key ? `${cloudinaryConfig.api_key.slice(0, 4)}...` : "NOT SET",
  api_secret: cloudinaryConfig.api_secret ? "SET" : "NOT SET"
});

cloudinary.config(cloudinaryConfig);

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
    console.log("Starting buffer upload to Cloudinary...", {
      bufferSize: buffer.length,
      options: { ...options, transformation: options.transformation ? '[hidden]' : undefined }
    });

    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) {
        console.error("Cloudinary stream upload error:", {
          message: err.message,
          error: err.error,
          http_code: err.http_code
        });
        return reject(err);
      }
      if (!result) {
        console.error("Cloudinary returned no result");
        return reject(new Error("Cloudinary returned no result"));
      }
      console.log("Buffer upload successful:", result.public_id);
      resolve(result);
    });

    stream.on('error', (streamErr) => {
      console.error("Stream error:", streamErr);
      reject(streamErr);
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

      console.log("Cloudinary upload options:", {
        resource_type: uploadOptions.resource_type,
        folder: uploadOptions.folder,
        public_id: uploadOptions.public_id,
        fileType: typeof file,
        fileSize: file instanceof Buffer ? file.length : file.length,
        mimetype
      });

      let result;

      if (typeof file === "string") {
        // base64 string or remote URL
        result = await cloudinary.uploader.upload(file, uploadOptions);
      } else {
        // Buffer → use stream
        result = await uploadBuffer(file, uploadOptions);
      }

      console.log("Cloudinary upload successful:", {
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration
      });

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
    } catch (error: any) {
      console.error("Cloudinary upload error:", {
        message: error.message,
        error: error.error,
        http_code: error.http_code,
        stack: error.stack
      });
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
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
