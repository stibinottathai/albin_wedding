import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-supabase-project-id.supabase.co" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your-supabase-anon-key"
);

export default supabase;

/**
 * Appends width and quality transformation parameters to Supabase Storage URLs.
 * If the URL is not a Supabase URL, it returns the original URL.
 * 
 * @param url The image URL
 * @param preset 'thumb' (600px, 75% quality) or 'full' (1920px, 85% quality)
 */
export function getSupabaseImageUrl(url: string, preset: 'thumb' | 'full'): string {
  if (!url) return '';

  const isSupabaseUrl = url.includes('.supabase.co/storage/v1/object/public/');
  if (!isSupabaseUrl) return url;

  const width = preset === 'thumb' ? 600 : 1920;
  const quality = preset === 'thumb' ? 75 : 85;

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', width.toString());
    urlObj.searchParams.set('quality', quality.toString());
    return urlObj.toString();
  } catch (e) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}`;
  }
}

/**
 * Compresses an image file client-side using Canvas.
 * Resizes the image so that its width/height does not exceed a maximum dimension,
 * and outputs a compressed JPEG or PNG blob.
 * 
 * @param file The original File object
 * @param maxDimension Maximum width or height in pixels (defaults to 1920)
 * @param quality Quality factor between 0 and 1 (defaults to 0.8)
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve) => {
    // If we're not in a browser environment or the file is not an image, resolve with the original file
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Use WebP for all compressed images for optimal size vs quality ratio
      const mimeType = "image/webp";

      canvas.toBlob(
        (blob) => {
          // Add a custom type property so the upload logic knows it's WebP now
          if (blob) {
            Object.defineProperty(blob, 'type', { value: mimeType });
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      resolve(file);
    };
  });
}
