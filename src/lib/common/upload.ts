import multer from 'multer';
import CustomError from '../error/CustomError';

// Use memory storage to keep files in memory as Buffer
const storage = multer.memoryStorage();

// File filter to only accept images
const imageFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(CustomError.getWithMessage('Only image files are allowed (JPEG, PNG, WebP, GIF)', 400));
    }
};

// Single image upload middleware
export const uploadSingleImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    }
}).single('image');

// Multiple images upload middleware (for products)
export const uploadMultipleImages = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size per file
        files: 5 // max 5 files
    }
}).array('images', 5);
