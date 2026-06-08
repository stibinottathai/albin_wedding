-- Add galleryCategories column to wedding_info table to store the list of categories as JSON array
ALTER TABLE wedding_info ADD COLUMN IF NOT EXISTS "galleryCategories" text DEFAULT '["pre-wedding","engagement","family","memories"]';
