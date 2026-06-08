-- Step 1: Create the wishes table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS wishes (
  id text PRIMARY KEY,
  "guestName" text NOT NULL,
  message text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  timestamp text NOT NULL,
  emoji text DEFAULT '❤️'
);

-- Step 2: Disable Row Level Security on wishes
ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop the incorrect guests table if it was created
DROP TABLE IF EXISTS guests;

-- Step 4: Create the guests table exactly matching the application's Guest interface
CREATE TABLE guests (
  id text PRIMARY KEY,
  name text NOT NULL,
  greeting text NOT NULL,
  email text,
  "allowedAttendees" integer NOT NULL DEFAULT 2,
  "openedCount" integer NOT NULL DEFAULT 0,
  "rsvpStatus" text NOT NULL DEFAULT 'pending',
  "rsvpAttendees" integer NOT NULL DEFAULT 0,
  "rsvpMessage" text,
  "updatedAt" text
);

-- Step 5: Disable Row Level Security on guests
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;

-- Step 6: Create wedding_info table
CREATE TABLE IF NOT EXISTS wedding_info (
  id text PRIMARY KEY,
  "groomName" text,
  "brideName" text,
  tagline text,
  "weddingDate" text,
  "locationName" text,
  "locationAddress" text,
  "googleMapEmbedUrl" text,
  "parkingInfo" text,
  "contactGroom" text,
  "contactBride" text,
  "bgMusicUrl" text,
  "videoUrl" text,
  "groomParents" text,
  "groomSiblings" text,
  "brideParents" text,
  "brideSiblings" text
);

ALTER TABLE wedding_info DISABLE ROW LEVEL SECURITY;

-- Step 7: Create events table
CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  title text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  venue text NOT NULL,
  description text NOT NULL,
  "imageUrl" text NOT NULL,
  "googleCalendarUrl" text
);

ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Step 8: Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id text PRIMARY KEY,
  "totalVisitors" integer NOT NULL DEFAULT 0
);

ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;

