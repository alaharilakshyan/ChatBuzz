"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMedia = uploadMedia;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = require("cloudinary");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET
});
const ALLOWED_EXTENSIONS = {
    images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico'],
    videos: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'],
    audio: ['mp3', 'wav', 'ogg', 'aac', 'opus', 'm4a'],
    documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', '7z']
};
async function uploadMedia(fileBuffer, originalName, mimeType, folder) {
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const size = fileBuffer.length;
    // Calculate file checksum
    const checksum = crypto_1.default.createHash('md5').update(fileBuffer).digest('hex');
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
    let resourceType = 'raw';
    if (ALLOWED_EXTENSIONS.images.includes(extension)) {
        resourceType = 'image';
    }
    else if (ALLOWED_EXTENSIONS.videos.includes(extension) || ALLOWED_EXTENSIONS.audio.includes(extension)) {
        resourceType = 'video';
    }
    // Local storage fallback check (if credentials are mock or not configured)
    const isCloudinaryMock = env_1.env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' || !env_1.env.CLOUDINARY_API_KEY;
    if (isCloudinaryMock) {
        logger_1.logger.info('📦 Storage fallback: Saving file to local storage directory.');
        const uploadDir = path_1.default.join(__dirname, '../../uploads', folder);
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const uniqueName = `${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex')}.${extension}`;
        const filePath = path_1.default.join(uploadDir, uniqueName);
        fs_1.default.writeFileSync(filePath, fileBuffer);
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
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: `chatbuzz/${folder}`,
            resource_type: resourceType
        }, (error, result) => {
            if (error || !result) {
                logger_1.logger.error(error, '❌ Cloudinary upload error:');
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
        });
        uploadStream.end(fileBuffer);
    });
}
