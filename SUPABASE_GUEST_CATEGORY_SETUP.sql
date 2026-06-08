-- 1. Add category column to guests table if it does not exist
ALTER TABLE guests ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';

-- 2. Add categories column to wedding_info table to store the list of categories as JSON array
ALTER TABLE wedding_info ADD COLUMN IF NOT EXISTS categories text DEFAULT '["General","Family","Friends","Relatives"]';
