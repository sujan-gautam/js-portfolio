import axios from "axios";
import { API_BASE } from "@/config";

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Uploads a file in chunks directly to Cloudinary.
 * This bypasses server payload limits and allows for large file uploads with progress tracking.
 */
export async function uploadFileChunked(
  file: File,
  onProgress?: ProgressCallback
): Promise<string> {
  // 1. Get signing details from our backend
  const { data: signData } = await axios.get(`${API_BASE}/upload/sign`);
  const { signature, timestamp, api_key, cloud_name, upload_preset, folder, resource_type } = signData;

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uniqueUploadId = `chunked_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  let uploadedBytes = 0;
  let finalUrl = "";

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("api_key", api_key);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    if (upload_preset) formData.append("upload_preset", upload_preset);
    formData.append("folder", folder);
    if (resource_type) formData.append("resource_type", resource_type);
    
    // Cloudinary specific chunking headers
    const contentRange = `bytes ${start}-${end - 1}/${file.size}`;
    
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
        formData,
        {
          headers: {
            "X-Unique-Upload-Id": uniqueUploadId,
            "Content-Range": contentRange,
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.loaded) {
              const currentChunkLoaded = progressEvent.loaded;
              const totalLoaded = uploadedBytes + currentChunkLoaded;
              onProgress({
                loaded: totalLoaded,
                total: file.size,
                percent: Math.round((totalLoaded / file.size) * 100),
              });
            }
          },
        }
      );

      uploadedBytes += chunk.size;

      if (i === totalChunks - 1) {
        finalUrl = response.data.secure_url || response.data.url;
      }
    } catch (error: any) {
      console.error("Chunk upload failed:", error.response?.data || error.message);
      throw new Error(`Upload failed at chunk ${i + 1}: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  return finalUrl;
}
