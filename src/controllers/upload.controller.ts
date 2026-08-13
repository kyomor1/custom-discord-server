import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';

export async function uploadSingleFile(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
}
