import express from 'express';
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { sendSuccess, sendError } from '../utils/response.js';

const router = express.Router();
const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let upload;
let storageMode = 'gridfs';

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'talk-time-app',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg', 'pdf', 'txt'],
      public_id: (req, file) => {
        const name = file.originalname.replace(/\.[^/.]+$/, '');
        return `talk-time-app/${Date.now()}-${name}`;
      },
    },
  });

  upload = multer({ storage: cloudinaryStorage });
  storageMode = 'cloudinary';
} else {
  const gridFsStorage = new GridFsStorage({
    url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talk-time',
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });

  upload = multer({ storage: gridFsStorage });
}

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return sendError(res, 'Bad Request', 'No file uploaded', 'NO_FILE_UPLOADED', 400);
  }

  const fileUrl = useCloudinary
    ? (req.file.secure_url || req.file.path || req.file.url)
    : `${req.protocol}://${req.get('host')}/api/uploads/files/${req.file.filename}`;

  return sendSuccess(res, {
    url: fileUrl,
    name: req.file.originalname || req.file.filename || 'file',
    size: req.file.size || req.file.bytes || null,
    mime_type: req.file.mimetype || req.file.contentType || null,
    storageMode,
  });
});

router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    // Expect filename to contain dot extension, can validate string length
    if (typeof filename !== 'string' || filename.length < 5) {
      return sendError(res, 'Validation Error', 'Invalid filename format', 'VALIDATION_ERROR', 400);
    }

    const conn = mongoose.connection;
    const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    const files = await gfs.find({ filename }).toArray();
    if (!files || files.length === 0) {
      return sendError(res, 'Not Found', 'File not found', 'FILE_NOT_FOUND', 404);
    }
    
    res.set('Content-Type', files[0].contentType);
    const readStream = gfs.openDownloadStreamByName(filename);
    return readStream.pipe(res);
  } catch (error) {
    console.error('Error fetching uploaded file:', error);
    return sendError(res, 'Server Error', 'Error fetching file', 'SERVER_ERROR', 500);
  }
});

export default router;
