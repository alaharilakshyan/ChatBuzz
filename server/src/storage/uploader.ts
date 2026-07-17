import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

export interface UploadedMedia {
  url: string;
  publicId?: string;
  mimeType: string;
  extension: string;
  size: number;
  checksum: string;
  width?: number;
  height?: number;
  duration?: number;
  folder: string;
}

const ALLOWED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico'],
  videos: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'opus', 'm4a'],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', '7z']
};

// Local storage fallback check (if credentials are mock or not configured)
export const isCloudinaryMock =
  env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ||
  env.CLOUDINARY_API_KEY === 'mock_key' ||
  env.CLOUDINARY_API_SECRET === 'mock_secret' ||
  !env.CLOUDINARY_CLOUD_NAME ||
  !env.CLOUDINARY_API_KEY ||
  !env.CLOUDINARY_API_SECRET;

export async function uploadMedia(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string
): Promise<UploadedMedia> {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  const size = fileBuffer.length;
  
  // Calculate file checksum
  const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

  // Verify file extension
  const allAllowed = [
    ...ALLOWED_EXTENSIONS.images,
    ...ALLOWED_EXTENSIONS.videos,
    ...ALLOWED_EXTENSIONS.audio,
    ...ALLOWED_EXTENSIONS.documents
  ];
  if (!allAllowed.includes(extension)) {
    throw new Error(`File extension .${extension} not supported.`);
  }

  // Determine media type
  let resourceType: 'image' | 'video' | 'raw' = 'raw';
  if (ALLOWED_EXTENSIONS.images.includes(extension)) {
    resourceType = 'image';
  } else if (ALLOWED_EXTENSIONS.videos.includes(extension) || ALLOWED_EXTENSIONS.audio.includes(extension)) {
    resourceType = 'video';
  }

  if (isCloudinaryMock) {
    logger.info('📦 Storage fallback: Saving file to local storage directory.');
    const uploadDir = path.join(__dirname, '../../uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);

    const relativeUrl = `/uploads/${folder}/${uniqueName}`;
    return {
      url: relativeUrl,
      mimeType,
      extension,
      size,
      checksum,
      folder
    };
  }

  // Standard Cloudinary upload pipeline
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `chatbuzz/${folder}`,
        resource_type: resourceType
      },
      (error, result) => {
        if (error || !result) {
          logger.error(error, '❌ Cloudinary upload error:');
          return reject(new Error('Cloudinary media upload failed.'));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          mimeType,
          extension,
          size,
          checksum,
          width: result.width,
          height: result.height,
          duration: result.duration,
          folder
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
}
