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
        cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'));
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

// Product images upload middleware (mainImage + additional images)
export const uploadProductImages = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size per file
        files: 6 // 1 main + 5 additional
    }
}).fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 5 }
]);
