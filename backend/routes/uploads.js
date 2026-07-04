import express from 'express';
import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';

const router = express.Router();

const storage = new GridFsStorage({
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
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `${req.protocol}://${req.get('host')}/api/uploads/files/${req.file.filename}`;
  
  res.json({
    url: fileUrl,
    name: req.file.originalname,
    size: req.file.size,
    mime_type: req.file.mimetype
  });
});

// Since ClerkExpressRequireAuth protects all of /api/uploads, fetching images would require auth.
// Wait, the client usually just puts the URL in an <img> tag, which doesn't send auth headers!
// Let's create an unprotected route for files? Actually, we can just allow GET /files/:filename without auth.
// BUT this router is mounted with auth in server.js! Let's export an unprotected router just for GET if needed,
// but for now we'll serve it here. We will need to move the /files/:filename route out of auth in server.js.
router.get('/files/:filename', async (req, res) => {
  try {
    const conn = mongoose.connection;
    const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    const files = await gfs.find({ filename: req.params.filename }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.set('Content-Type', files[0].contentType);
    const readStream = gfs.openDownloadStreamByName(req.params.filename);
    readStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching file' });
  }
});

export default router;
