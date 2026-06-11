-- 1. Create wedding_tasks table
CREATE TABLE IF NOT EXISTS wedding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, COMPLETED
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Disable Row Level Security on the new table
-- This matches the security model of the other tables in this application
ALTER TABLE wedding_tasks DISABLE ROW LEVEL SECURITY;
