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
