import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'talk-time-uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp3', 'wav', 'mp4'],
    resource_type: 'auto'
  }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    url: req.file.path,
    name: req.file.originalname,
    size: req.file.size,
    mime_type: req.file.mimetype
  });
});

export default router;
