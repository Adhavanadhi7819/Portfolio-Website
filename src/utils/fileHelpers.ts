/**
 * Utility functions for persistent server-backed media uploads (images, videos, PDF/DOCX resumes)
 */
import { uploadAssetToServer } from './portfolioServerSync';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, commaIdx);
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const base64 = dataUrl.slice(commaIdx + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Compresses an image file cleanly before uploading to the server.
 * Scales down dimensions if they exceed maxWidth/maxHeight and encodes as JPEG.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.8
): Promise<string> {
  // If not an image or SVG/GIF, return standard data URL
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return readFileAsDataUrl(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file (compressed first unless SVG/GIF) to the persistent server asset store.
 * Returns a permanent `/api/assets/...` URL accessible across all devices and browsers.
 */
export async function uploadImageAsset(
  file: File,
  maxWidth = 1400,
  maxHeight = 1100,
  quality = 0.82
): Promise<string> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || !file.type.startsWith('image/')) {
    const uploaded = await uploadAssetToServer(file, file.name, file.type);
    return uploaded.url;
  }

  const compressedDataUrl = await compressImageFile(file, maxWidth, maxHeight, quality);
  const compressedBlob = dataUrlToBlob(compressedDataUrl);
  const jpgName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  const uploaded = await uploadAssetToServer(compressedBlob, jpgName, 'image/jpeg');
  return uploaded.url;
}

/**
 * Uploads a video file (MP4, WebM, MOV) to the persistent server asset store.
 * Returns a permanent `/api/assets/...` streaming URL accessible across all devices.
 */
export async function uploadVideoAsset(file: File): Promise<string> {
  const uploaded = await uploadAssetToServer(file, file.name, file.type || 'video/mp4');
  return uploaded.url;
}

/**
 * Uploads a document/resume file (PDF, DOCX, image) to the persistent server asset store.
 */
export async function uploadDocumentAsset(file: File): Promise<{
  url: string;
  fileName: string;
  fileSize: string;
}> {
  const uploaded = await uploadAssetToServer(
    file,
    file.name,
    file.type || 'application/octet-stream'
  );
  return {
    url: uploaded.url,
    fileName: file.name,
    fileSize: formatFileSize(file.size)
  };
}
