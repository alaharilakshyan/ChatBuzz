import multer from 'multer';

// Use memory storage to capture buffer for uploadMedia helper
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
