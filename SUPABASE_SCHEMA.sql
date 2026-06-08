-- 1. Create wedding_info table
create table if not exists wedding_info (
  id text primary key default 'main',
  "groomName" text not null,
  "brideName" text not null,
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

-- 2. Create events table
create table if not exists events (
  id text primary key,
  title text not null,
  date text not null,
  time text not null,
  venue text not null,
  description text,
  "imageUrl" text,
  "googleCalendarUrl" text
);

-- 3. Create guests table
create table if not exists guests (
  id text primary key,
  name text not null,
  greeting text not null,
  email text,
  "allowedAttendees" integer not null default 1,
  "openedCount" integer not null default 0,
  "rsvpStatus" text not null default 'pending' check ("rsvpStatus" in ('pending', 'accepted', 'declined')),
  "rsvpAttendees" integer not null default 0,
  "rsvpMessage" text default '',
  "updatedAt" text
);

-- 4. Create wishes table
create table if not exists wishes (
  id text primary key,
  "guestName" text not null,
  message text not null,
  approved boolean not null default false,
  timestamp text not null,
  emoji text default '❤️'
);

-- 5. Create analytics table
create table if not exists analytics (
  id text primary key default 'traffic',
  "totalVisitors" integer not null default 0
);

-- 6. Insert initial traffic row if not present
insert into analytics (id, "totalVisitors") values ('traffic', 0) on conflict (id) do nothing;
