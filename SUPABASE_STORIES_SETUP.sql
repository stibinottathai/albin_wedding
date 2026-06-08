-- 1. Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id text PRIMARY KEY,
  year text NOT NULL,
  "titleEn" text NOT NULL,
  "titleMl" text NOT NULL,
  "textEn" text NOT NULL,
  "textMl" text NOT NULL,
  "imageUrl" text NOT NULL,
  "orderIndex" integer NOT NULL,
  "createdAt" text NOT NULL
);

-- Disable Row Level Security on stories table
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- 2. Create storage bucket for wedding story images (if buckets table exists and allows it)
-- Note: You can also create this bucket named 'stories' in the Supabase Dashboard under Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories', 'stories', true) 
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies to allow public reads and uploads/deletes for simplicity
CREATE POLICY "Public Read Access Stories" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'stories');

CREATE POLICY "Public Upload Access Stories" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'stories');

CREATE POLICY "Public Delete Access Stories" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'stories');
