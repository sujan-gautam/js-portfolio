import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

console.log("Cloudinary Config Loaded with Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPrivate = req.headers['x-members-only'] === 'true' || req.body?.isMembersOnly === 'true';
    return {
      folder: 'exact-echo',
      resource_type: 'auto',
      type: isPrivate ? 'authenticated' : 'upload'
    };
  }
});

export const parser = multer({ storage: storage });
