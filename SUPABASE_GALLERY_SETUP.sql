-- 1. Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id text PRIMARY KEY,
  src text NOT NULL,
  category text NOT NULL,
  alt text,
  "createdAt" text NOT NULL
);

-- Disable Row Level Security on gallery table for ease of use in this wedding site
ALTER TABLE gallery DISABLE ROW LEVEL SECURITY;

-- 2. Create storage bucket for wedding gallery images (if buckets table exists and allows it)
-- Note: You can also create this bucket named 'gallery' in the Supabase Dashboard under Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true) 
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies to allow public reads and uploads/deletes for simplicity
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'gallery');

CREATE POLICY "Public Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Public Delete Access" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'gallery');
