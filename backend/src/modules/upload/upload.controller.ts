import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request, Response } from 'express';

const uploadDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed for KYC verification.'));
    }
  },
});

export function handleFileUpload(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: 'No document file uploaded.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.status(200).json({
    success: true,
    message: 'KYC Document uploaded successfully.',
    fileUrl,
    filename: req.file.filename,
    sizeBytes: req.file.size,
  });
}
