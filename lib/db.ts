import { supabase, isSupabaseConfigured } from "./supabase";

// --- Types ---
export interface WeddingInfo {
  groomName: string;
  brideName: string;
  tagline: string;
  weddingDate: string; // ISO date string or YYYY-MM-DDTHH:mm
  locationName: string;
  locationAddress: string;
  googleMapEmbedUrl: string;
  parkingInfo: string;
  contactGroom: string;
  contactBride: string;
  bgMusicUrl: string;
  videoUrl: string;
  groomParents: string;
  groomSiblings: string;
  brideParents: string;
  brideSiblings: string;
}

export interface WeddingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  imageUrl: string;
  googleCalendarUrl?: string;
}

export interface Guest {
  id: string;
  name: string;
  greeting: string; // e.g. "Dearest Uncle Jacob & Family"
  email?: string;
  allowedAttendees: number;
  openedCount: number;
  rsvpStatus: "pending" | "accepted" | "declined";
  rsvpAttendees: number;
  rsvpMessage: string;
  updatedAt?: string;
}

export interface Wish {
  id: string;
  guestName: string;
  message: string;
  approved: boolean;
  timestamp: string;
  emoji?: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  category: "pre-wedding" | "engagement" | "family" | "memories";
  alt: string;
  createdAt: string;
}

export interface StoryMilestone {
  id: string;
  year: string;
  titleEn: string;
  titleMl: string;
  textEn: string;
  textMl: string;
  imageUrl: string;
  orderIndex: number;
  createdAt: string;
}

export interface Analytics {
  totalVisitors: number;
  invitationOpens: number;
  rsvpAccepted: number;
  rsvpDeclined: number;
  totalGuestsAllowed: number;
  totalGuestsAttending: number;
}

// --- Premium Pre-populated Data ---
const DEFAULT_WEDDING_INFO: WeddingInfo = {
  groomName: "Albin",
  brideName: "Stella",
  tagline: "Two Hearts, One Journey of Love & Grace",
  weddingDate: "2026-11-28T10:30", // November 28, 2026
  locationName: "Grand Palace Ballroom",
  locationAddress: "124 Luxury Avenue, Marine Drive, Kochi, Kerala, India",
  googleMapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.610543639893!2d76.2731872758137!3d9.96632427360064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b080d36bb2a95c9%3A0xe54ef9ee1ee5d92c!2sMarine%20Drive%2C%20Kochi%2C%20Kerala!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
  parkingInfo: "Complimentary valet parking is available at the entrance. Multi-level guest parking is located at Gate B.",
  contactGroom: "+91 98765 43210",
  contactBride: "+91 87654 32109",
  bgMusicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Free piano loop
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Test video URL
  groomParents: "Mr. Thomas & Mrs. Mary Ottathai",
  groomSiblings: "Rinoy & Anjali",
  brideParents: "Mr. Joseph & Mrs. Elizabeth Kizhakkekara",
  brideSiblings: "Kevin & Teresa",
};

const DEFAULT_EVENTS: WeddingEvent[] = [
  {
    id: "engagement",
    title: "The Betrothal / Engagement",
    date: "2026-11-27",
    time: "04:30 PM",
    venue: "St. Mary's Cathedral Hall, Kochi",
    description: "Witness the traditional ring exchange and solemn commitment, followed by tea & refreshments.",
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "mehendi",
    title: "Mehendi Night",
    date: "2026-11-27",
    time: "07:30 PM",
    venue: "Lakeside Greens, Kochi",
    description: "An evening of vibrant music, dance, and beautiful henna patterns on hands.",
    imageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "wedding",
    title: "The Holy Matrimony",
    date: "2026-11-28",
    time: "10:30 AM",
    venue: "St. Mary's Cathedral, Kochi",
    description: "The main church ceremony where Albin and Stella exchange holy vows.",
    imageUrl: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "reception",
    title: "The Grand Reception",
    date: "2026-11-28",
    time: "12:30 PM",
    venue: "Grand Palace Ballroom, Kochi",
    description: "Celebrate with us over fine dining, live band, cake cutting, and toasts.",
    imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop",
  }
];

const DEFAULT_GUESTS: Guest[] = [
  {
    id: "guest-1",
    name: "Uncle Jacob & Family",
    greeting: "Uncle Jacob, Aunt Susan & Family",
    email: "jacob@example.com",
    allowedAttendees: 4,
    openedCount: 0,
    rsvpStatus: "pending",
    rsvpAttendees: 0,
    rsvpMessage: "",
  },
  {
    id: "guest-2",
    name: "Diana Rose",
    greeting: "Diana Rose & Guest",
    email: "diana@example.com",
    allowedAttendees: 2,
    openedCount: 0,
    rsvpStatus: "pending",
    rsvpAttendees: 0,
    rsvpMessage: "",
  },
  {
    id: "guest-3",
    name: "Dr. Mathew Thomas",
    greeting: "Dr. Mathew Thomas",
    email: "mathew@example.com",
    allowedAttendees: 1,
    openedCount: 0,
    rsvpStatus: "pending",
    rsvpAttendees: 0,
    rsvpMessage: "",
  }
];

const DEFAULT_WISHES: Wish[] = [
  {
    id: "wish-1",
    guestName: "Roy & Neha",
    message: "Congratulations Albin and Stella! Wishing you both a lifetime of love, laughter, and beautiful memories. Can't wait to celebrate with you!",
    approved: true,
    timestamp: "2026-06-05T14:30:00Z",
    emoji: "❤️",
  },
  {
    id: "wish-2",
    guestName: "Aunt Susan",
    message: "So proud of you two! God bless your marriage. Looking forward to the big day in Kochi.",
    approved: true,
    timestamp: "2026-06-06T09:15:00.000Z",
    emoji: "✨",
  },
  {
    id: "wish-3",
    guestName: "Kevin Kizhakkekara",
    message: "Welcome to the family Albin! Stella is the best sister anyone could ask for. Be happy always!",
    approved: true,
    timestamp: "2026-06-07T11:00:00.000Z",
    emoji: "🎉",
  }
];

const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [];

const DEFAULT_STORIES: StoryMilestone[] = [
  {
    id: "story-1",
    year: "June 2022",
    titleEn: "First Meeting",
    titleMl: "ആദ്യ കൂടിക്കാഴ്ച",
    textEn: "A simple hello over aromatic coffee in Kochi sparked a conversation that went on for hours. We knew right away there was a spark.",
    textMl: "കൊച്ചിയിലെ ഒരു കഫേയിൽ വെച്ചുള്ള കൂടിക്കാഴ്ച മണിക്കൂറുകളോളം നീണ്ട സംഭാഷണമായി മാറി.",
    imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900",
    orderIndex: 1,
    createdAt: "2026-06-08T00:00:01Z"
  },
  {
    id: "story-2",
    year: "December 2023",
    titleEn: "Friendship to Bond",
    titleMl: "സൗഹൃദത്തിന്റെ നാളുകൾ",
    textEn: "Late night drives, shared playlists, and whispered dreams. Friendship became the anchor of our lives.",
    textMl: "രാത്രി യാത്രകളും ഒരേ സംഗീതവും സ്വപ്നങ്ങളും പരസ്പരം പങ്കുവെച്ച നാളുകൾ.",
    imageUrl: "https://images.unsplash.com/photo-1529636798458-92182e65f133?q=80&w=900",
    orderIndex: 2,
    createdAt: "2026-06-08T00:00:02Z"
  },
  {
    id: "story-3",
    year: "February 2025",
    titleEn: "The Proposal",
    titleMl: "പ്രണയ സാഫല്യം",
    textEn: "On a quiet sunset cruise along the backwaters, we realised we wanted to spend forever together.",
    textMl: "കായലിലൂടെയുള്ള ഒരു വൈകുന്നേരത്തെ യാത്രയിൽ ഒരുമിച്ചുള്ള ഒരു ജീവിതമാണ് ഞങ്ങൾ ആഗ്രഹിക്കുന്നതെന്ന് മനസ്സിലാക്കി.",
    imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=900",
    orderIndex: 3,
    createdAt: "2026-06-08T00:00:03Z"
  },
  {
    id: "story-4",
    year: "June 2026",
    titleEn: "The Engagement",
    titleMl: "വിവാഹ നിശ്ചയം",
    textEn: "Surrounded by family and loved ones, we exchanged rings and promised to walk side by side through every season of life.",
    textMl: "കുടുംബത്തിന്റെ സാന്നിദ്ധ്യത്തിൽ മോതിരം മാറി ഒരുമിച്ചുണ്ടാകുമെന്ന് പ്രതിജ്ഞ ചെയ്തു.",
    imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=900",
    orderIndex: 4,
    createdAt: "2026-06-08T00:00:04Z"
  }
];

// --- Local Storage Mock Engine ---
class MockDB {
  private getStorageKey(key: string): string {
    return `wedding_db_${key}`;
  }

  private getData<T>(key: string, defaultVal: T): T {
    if (typeof window === "undefined") return defaultVal;
    const item = localStorage.getItem(this.getStorageKey(key));
    if (!item) {
      this.setData(key, defaultVal);
      return defaultVal;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return defaultVal;
    }
  }

  private setData<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getStorageKey(key), JSON.stringify(data));
  }

  getWeddingInfo(): WeddingInfo {
    return this.getData<WeddingInfo>("info", DEFAULT_WEDDING_INFO);
  }

  saveWeddingInfo(info: WeddingInfo): void {
    this.setData("info", info);
  }

  getEvents(): WeddingEvent[] {
    return this.getData<WeddingEvent[]>("events", DEFAULT_EVENTS);
  }

  saveEvents(events: WeddingEvent[]): void {
    this.setData("events", events);
  }

  getGuests(): Guest[] {
    return this.getData<Guest[]>("guests", DEFAULT_GUESTS);
  }

  saveGuests(guests: Guest[]): void {
    this.setData("guests", guests);
  }

  getWishes(): Wish[] {
    return this.getData<Wish[]>("wishes", DEFAULT_WISHES);
  }

  saveWishes(wishes: Wish[]): void {
    this.setData("wishes", wishes);
  }

  getAnalytics(): Analytics {
    const guests = this.getGuests();
    const totalVisitors = this.getData<number>("visitor_count", 24);
    const invitationOpens = guests.reduce((sum, g) => sum + (g.openedCount > 0 ? 1 : 0), 0);
    const rsvpAccepted = guests.filter(g => g.rsvpStatus === "accepted").length;
    const rsvpDeclined = guests.filter(g => g.rsvpStatus === "declined").length;
    const totalGuestsAllowed = guests.reduce((sum, g) => sum + g.allowedAttendees, 0);
    const totalGuestsAttending = guests.reduce((sum, g) => sum + (g.rsvpStatus === "accepted" ? g.rsvpAttendees : 0), 0);

    return {
      totalVisitors,
      invitationOpens,
      rsvpAccepted,
      rsvpDeclined,
      totalGuestsAllowed,
      totalGuestsAttending,
    };
  }

  incrementVisitorCount(): void {
    const current = this.getData<number>("visitor_count", 24);
    this.setData("visitor_count", current + 1);
  }

  getGalleryImages(): GalleryImage[] {
    return this.getData<GalleryImage[]>("gallery", DEFAULT_GALLERY_IMAGES);
  }

  saveGalleryImages(images: GalleryImage[]): void {
    this.setData("gallery", images);
  }

  getStories(): StoryMilestone[] {
    return this.getData<StoryMilestone[]>("stories", DEFAULT_STORIES);
  }

  saveStories(stories: StoryMilestone[]): void {
    this.setData("stories", stories);
  }
}

const mockDb = new MockDB();

// --- Unified API Service ---

export const getWeddingInfo = async (): Promise<WeddingInfo> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("wedding_info")
        .select("*")
        .eq("id", "main")
        .single();
      if (data) {
        return data as WeddingInfo;
      }
      if (error && error.code === "PGRST116") {
        const { error: insertError } = await supabase
          .from("wedding_info")
          .insert({ id: "main", ...DEFAULT_WEDDING_INFO });
        if (!insertError) return DEFAULT_WEDDING_INFO;
      }
    } catch (e) {
      console.error("Supabase getWeddingInfo error:", e);
    }
  }
  return mockDb.getWeddingInfo();
};

export const saveWeddingInfo = async (info: WeddingInfo): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("wedding_info")
        .upsert({ id: "main", ...info });
      if (!error) return;
    } catch (e) {
      console.error("Supabase saveWeddingInfo error:", e);
    }
  }
  mockDb.saveWeddingInfo(info);
};

export const getEvents = async (): Promise<WeddingEvent[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (data && data.length > 0) {
        return data as WeddingEvent[];
      }
      if (data && data.length === 0) {
        const { error: insertError } = await supabase
          .from("events")
          .insert(DEFAULT_EVENTS);
        if (!insertError) return DEFAULT_EVENTS;
      }
    } catch (e) {
      console.error("Supabase getEvents error:", e);
    }
  }
  return mockDb.getEvents();
};

export const saveEvent = async (event: WeddingEvent): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("events")
        .upsert(event);
      if (!error) return;
    } catch (e) {
      console.error("Supabase saveEvent error:", e);
    }
  }
  const events = mockDb.getEvents();
  const index = events.findIndex(e => e.id === event.id);
  if (index >= 0) {
    events[index] = event;
  } else {
    events.push(event);
  }
  mockDb.saveEvents(events);
};

export const getGuest = async (guestId: string): Promise<Guest | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("id", guestId)
        .single();
      if (data) {
        return data as Guest;
      }
    } catch (e) {
      console.error("Supabase getGuest error:", e);
    }
  }
  const guests = mockDb.getGuests();
  return guests.find(g => g.id === guestId) || null;
};

export const updateRSVP = async (
  guestId: string, 
  rsvpStatus: "accepted" | "declined", 
  rsvpAttendees: number, 
  rsvpMessage: string
): Promise<void> => {
  const updatedAt = new Date().toISOString();
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("guests")
        .update({
          rsvpStatus,
          rsvpAttendees,
          rsvpMessage,
          updatedAt
        })
        .eq("id", guestId);
      if (!error) return;
    } catch (e) {
      console.error("Supabase updateRSVP error:", e);
    }
  }
  const guests = mockDb.getGuests();
  const index = guests.findIndex(g => g.id === guestId);
  if (index >= 0) {
    guests[index] = {
      ...guests[index],
      rsvpStatus,
      rsvpAttendees,
      rsvpMessage,
      updatedAt
    };
    mockDb.saveGuests(guests);
  }
};

export const incrementInviteOpened = async (guestId: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from("guests")
        .select("openedCount")
        .eq("id", guestId)
        .single();
      const currentCount = data?.openedCount || 0;
      await supabase
        .from("guests")
        .update({ openedCount: currentCount + 1 })
        .eq("id", guestId);
      return;
    } catch (e) {
      console.error("Supabase incrementInviteOpened error:", e);
    }
  }
  const guests = mockDb.getGuests();
  const index = guests.findIndex(g => g.id === guestId);
  if (index >= 0) {
    guests[index].openedCount += 1;
    mockDb.saveGuests(guests);
  }
};

export const submitWish = async (guestName: string, message: string, emoji: string = "❤️"): Promise<Wish> => {
  const wish: Wish = {
    id: Math.random().toString(36).substring(2, 11),
    guestName,
    message,
    approved: true,
    timestamp: new Date().toISOString(),
    emoji
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("wishes")
        .insert(wish);
      if (!error) return wish;
    } catch (e) {
      console.error("Supabase submitWish error:", e);
    }
  }
  const wishes = mockDb.getWishes();
  wishes.unshift(wish);
  mockDb.saveWishes(wishes);
  return wish;
};

export const getWishes = async (includeUnapproved = false): Promise<Wish[]> => {
  if (isSupabaseConfigured) {
    try {
      let queryBuilder = supabase
        .from("wishes")
        .select("*")
        .order("timestamp", { ascending: false });
      
      if (!includeUnapproved) {
        queryBuilder = queryBuilder.eq("approved", true);
      }
      
      const { data, error } = await queryBuilder;
      if (data) {
        return data as Wish[];
      }
    } catch (e) {
      console.error("Supabase getWishes error:", e);
    }
  }
  const wishes = mockDb.getWishes();
  let filtered = wishes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (!includeUnapproved) {
    filtered = filtered.filter(w => w.approved);
  }
  return filtered;
};

export const updateWishStatus = async (wishId: string, approved: boolean): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("wishes")
        .update({ approved })
        .eq("id", wishId);
      if (!error) return;
    } catch (e) {
      console.error("Supabase updateWishStatus error:", e);
    }
  }
  const wishes = mockDb.getWishes();
  const index = wishes.findIndex(w => w.id === wishId);
  if (index >= 0) {
    wishes[index].approved = approved;
    mockDb.saveWishes(wishes);
  }
};

export const deleteWish = async (wishId: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("wishes")
        .delete()
        .eq("id", wishId);
      if (!error) return;
    } catch (e) {
      console.error("Supabase deleteWish error:", e);
    }
  }
  const wishes = mockDb.getWishes();
  const filtered = wishes.filter(w => w.id !== wishId);
  mockDb.saveWishes(filtered);
};

export const getGuests = async (): Promise<Guest[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("name", { ascending: true });
      if (data) {
        return data as Guest[];
      }
    } catch (e) {
      console.error("Supabase getGuests error:", e);
    }
  }
  return mockDb.getGuests();
};

export const createGuest = async (name: string, greeting: string, allowedAttendees: number, email?: string): Promise<Guest> => {
  const newGuest: Guest = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    greeting: greeting || name,
    email,
    allowedAttendees,
    openedCount: 0,
    rsvpStatus: "pending",
    rsvpAttendees: 0,
    rsvpMessage: "",
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("guests")
        .insert(newGuest);
      if (!error) return newGuest;
    } catch (e) {
      console.error("Supabase createGuest error:", e);
    }
  }
  const guests = mockDb.getGuests();
  guests.push(newGuest);
  mockDb.saveGuests(guests);
  return newGuest;
};

export const deleteGuest = async (guestId: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", guestId);
      if (!error) return;
    } catch (e) {
      console.error("Supabase deleteGuest error:", e);
    }
  }
  const guests = mockDb.getGuests();
  const filtered = guests.filter(g => g.id !== guestId);
  mockDb.saveGuests(filtered);
};

export const getAnalytics = async (): Promise<Analytics> => {
  if (isSupabaseConfigured) {
    try {
      const guests = await getGuests();
      const { data, error } = await supabase
        .from("analytics")
        .select("totalVisitors")
        .eq("id", "traffic")
        .single();
      
      let totalVisitors = 1;
      if (data) {
        totalVisitors = data.totalVisitors;
      }
      
      const invitationOpens = guests.reduce((sum, g) => sum + (g.openedCount > 0 ? 1 : 0), 0);
      const rsvpAccepted = guests.filter(g => g.rsvpStatus === "accepted").length;
      const rsvpDeclined = guests.filter(g => g.rsvpStatus === "declined").length;
      const totalGuestsAllowed = guests.reduce((sum, g) => sum + g.allowedAttendees, 0);
      const totalGuestsAttending = guests.reduce((sum, g) => sum + (g.rsvpStatus === "accepted" ? g.rsvpAttendees : 0), 0);
      
      return {
        totalVisitors,
        invitationOpens,
        rsvpAccepted,
        rsvpDeclined,
        totalGuestsAllowed,
        totalGuestsAttending,
      };
    } catch (e) {
      console.error("Supabase getAnalytics error:", e);
    }
  }
  return mockDb.getAnalytics();
};

export const incrementPageVisit = async (): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("analytics")
        .select("totalVisitors")
        .eq("id", "traffic")
        .single();
      
      const currentCount = data?.totalVisitors || 0;
      
      await supabase
        .from("analytics")
        .upsert({ id: "traffic", totalVisitors: currentCount + 1 });
      return;
    } catch (e) {
      console.error("Supabase incrementPageVisit error:", e);
    }
  }
  mockDb.incrementVisitorCount();
};

export const getGalleryImages = async (): Promise<GalleryImage[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("createdAt", { ascending: true });
      if (data && data.length > 0) {
        return data as GalleryImage[];
      }
      if (data && data.length === 0) {
        const { error: insertError } = await supabase
          .from("gallery")
          .insert(DEFAULT_GALLERY_IMAGES);
        if (!insertError) return DEFAULT_GALLERY_IMAGES;
      }
    } catch (e) {
      console.error("Supabase getGalleryImages error:", e);
    }
  }
  return mockDb.getGalleryImages();
};

export const saveGalleryImage = async (image: GalleryImage): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("gallery")
        .upsert(image);
      if (!error) return;
    } catch (e) {
      console.error("Supabase saveGalleryImage error:", e);
    }
  }
  const images = mockDb.getGalleryImages();
  const index = images.findIndex(img => img.id === image.id);
  if (index >= 0) {
    images[index] = image;
  } else {
    images.push(image);
  }
  mockDb.saveGalleryImages(images);
};

export const deleteGalleryImage = async (id: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("gallery")
        .delete()
        .eq("id", id);
      if (!error) return;
    } catch (e) {
      console.error("Supabase deleteGalleryImage error:", e);
    }
  }
  const images = mockDb.getGalleryImages();
  const filtered = images.filter(img => img.id !== id);
  mockDb.saveGalleryImages(filtered);
};

export const getStories = async (): Promise<StoryMilestone[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("orderIndex", { ascending: true });
      if (data && data.length > 0) {
        return data as StoryMilestone[];
      }
      if (data && data.length === 0) {
        const { error: insertError } = await supabase
          .from("stories")
          .insert(DEFAULT_STORIES);
        if (!insertError) return DEFAULT_STORIES;
      }
    } catch (e) {
      console.error("Supabase getStories error:", e);
    }
  }
  return mockDb.getStories().sort((a, b) => a.orderIndex - b.orderIndex);
};

export const saveStory = async (story: StoryMilestone): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("stories")
        .upsert(story);
      if (!error) return;
    } catch (e) {
      console.error("Supabase saveStory error:", e);
    }
  }
  const stories = mockDb.getStories();
  const index = stories.findIndex(s => s.id === story.id);
  if (index >= 0) {
    stories[index] = story;
  } else {
    stories.push(story);
  }
  mockDb.saveStories(stories);
};

export const deleteStory = async (id: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", id);
      if (!error) return;
    } catch (e) {
      console.error("Supabase deleteStory error:", e);
    }
  }
  const stories = mockDb.getStories();
  const filtered = stories.filter(s => s.id !== id);
  mockDb.saveStories(filtered);
};
