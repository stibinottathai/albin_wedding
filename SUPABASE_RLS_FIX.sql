-- Step 1: Create the wishes table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS wishes (
  id text PRIMARY KEY,
  "guestName" text NOT NULL,
  message text NOT NULL,
  approved boolean NOT NULL DEFAULT true,
  timestamp text NOT NULL,
  emoji text DEFAULT '❤️'
);

-- Step 2: Disable Row Level Security on wishes so the anon key can read/write freely
ALTER TABLE wishes DISABLE ROW LEVEL SECURITY;

-- Step 3: Create the guests table for RSVP tracking (if it doesn't exist)
CREATE TABLE IF NOT EXISTS guests (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  greeting text,
  "allowedAttendees" integer NOT NULL DEFAULT 1,
  "rsvpStatus" text NOT NULL DEFAULT 'pending',
  "rsvpAttendees" integer,
  "rsvpMessage" text,
  "hasOpenedInvite" boolean NOT NULL DEFAULT false,
  "createdAt" text NOT NULL,
  "updatedAt" text,
  "customLink" text NOT NULL
);

-- Step 4: Disable Row Level Security on guests so the anon key can read/write freely
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
