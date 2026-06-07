import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  increment
} from "firebase/firestore";

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
}

const mockDb = new MockDB();

// --- Unified API Service ---

export const getWeddingInfo = async (): Promise<WeddingInfo> => {
  if (db) {
    try {
      const docRef = doc(db, "wedding_info", "main");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as WeddingInfo;
      }
      // Populate firestore if empty
      await setDoc(docRef, DEFAULT_WEDDING_INFO);
      return DEFAULT_WEDDING_INFO;
    } catch (e) {
      console.error("Firestore getWeddingInfo error:", e);
    }
  }
  return mockDb.getWeddingInfo();
};

export const saveWeddingInfo = async (info: WeddingInfo): Promise<void> => {
  if (db) {
    try {
      const docRef = doc(db, "wedding_info", "main");
      await setDoc(docRef, info, { merge: true });
      return;
    } catch (e) {
      console.error("Firestore saveWeddingInfo error:", e);
    }
  }
  mockDb.saveWeddingInfo(info);
};

export const getEvents = async (): Promise<WeddingEvent[]> => {
  if (db) {
    try {
      const colRef = collection(db, "events");
      const querySnap = await getDocs(colRef);
      if (!querySnap.empty) {
        const events: WeddingEvent[] = [];
        querySnap.forEach((doc) => {
          events.push({ id: doc.id, ...doc.data() } as WeddingEvent);
        });
        return events;
      }
      // Pre-populate Firestore if empty
      for (const ev of DEFAULT_EVENTS) {
        await setDoc(doc(db, "events", ev.id), ev);
      }
      return DEFAULT_EVENTS;
    } catch (e) {
      console.error("Firestore getEvents error:", e);
    }
  }
  return mockDb.getEvents();
};

export const saveEvent = async (event: WeddingEvent): Promise<void> => {
  if (db) {
    try {
      await setDoc(doc(db, "events", event.id), event);
      return;
    } catch (e) {
      console.error("Firestore saveEvent error:", e);
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
  if (db) {
    try {
      const docRef = doc(db, "guests", guestId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Guest;
      }
      return null;
    } catch (e) {
      console.error("Firestore getGuest error:", e);
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
  if (db) {
    try {
      const docRef = doc(db, "guests", guestId);
      await updateDoc(docRef, {
        rsvpStatus,
        rsvpAttendees,
        rsvpMessage,
        updatedAt
      });
      return;
    } catch (e) {
      console.error("Firestore updateRSVP error:", e);
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
  if (db) {
    try {
      const docRef = doc(db, "guests", guestId);
      await updateDoc(docRef, {
        openedCount: increment(1)
      });
      return;
    } catch (e) {
      console.error("Firestore incrementInviteOpened error:", e);
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
    approved: false, // Moderated by default
    timestamp: new Date().toISOString(),
    emoji
  };

  if (db) {
    try {
      await setDoc(doc(db, "wishes", wish.id), wish);
      return wish;
    } catch (e) {
      console.error("Firestore submitWish error:", e);
    }
  }
  const wishes = mockDb.getWishes();
  wishes.unshift(wish);
  mockDb.saveWishes(wishes);
  return wish;
};

export const getWishes = async (includeUnapproved = false): Promise<Wish[]> => {
  if (db) {
    try {
      const colRef = collection(db, "wishes");
      let q = query(colRef, orderBy("timestamp", "desc"));
      if (!includeUnapproved) {
        q = query(colRef, where("approved", "==", true), orderBy("timestamp", "desc"));
      }
      const querySnap = await getDocs(q);
      const wishes: Wish[] = [];
      querySnap.forEach((doc) => {
        wishes.push(doc.data() as Wish);
      });
      return wishes;
    } catch (e) {
      console.error("Firestore getWishes error:", e);
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
  if (db) {
    try {
      await updateDoc(doc(db, "wishes", wishId), { approved });
      return;
    } catch (e) {
      console.error("Firestore updateWishStatus error:", e);
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
  if (db) {
    try {
      await deleteDoc(doc(db, "wishes", wishId));
      return;
    } catch (e) {
      console.error("Firestore deleteWish error:", e);
    }
  }
  const wishes = mockDb.getWishes();
  const filtered = wishes.filter(w => w.id !== wishId);
  mockDb.saveWishes(filtered);
};

export const getGuests = async (): Promise<Guest[]> => {
  if (db) {
    try {
      const colRef = collection(db, "guests");
      const querySnap = await getDocs(colRef);
      const guests: Guest[] = [];
      querySnap.forEach((doc) => {
        guests.push(doc.data() as Guest);
      });
      return guests;
    } catch (e) {
      console.error("Firestore getGuests error:", e);
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

  if (db) {
    try {
      await setDoc(doc(db, "guests", newGuest.id), newGuest);
      return newGuest;
    } catch (e) {
      console.error("Firestore createGuest error:", e);
    }
  }
  const guests = mockDb.getGuests();
  guests.push(newGuest);
  mockDb.saveGuests(guests);
  return newGuest;
};

export const deleteGuest = async (guestId: string): Promise<void> => {
  if (db) {
    try {
      await deleteDoc(doc(db, "guests", guestId));
      return;
    } catch (e) {
      console.error("Firestore deleteGuest error:", e);
    }
  }
  const guests = mockDb.getGuests();
  const filtered = guests.filter(g => g.id !== guestId);
  mockDb.saveGuests(filtered);
};

export const getAnalytics = async (): Promise<Analytics> => {
  if (db) {
    try {
      const guests = await getGuests();
      const infoSnap = await getDoc(doc(db, "analytics", "traffic"));
      let totalVisitors = 1;
      if (infoSnap.exists()) {
        totalVisitors = infoSnap.data().totalVisitors || 1;
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
      console.error("Firestore getAnalytics error:", e);
    }
  }
  return mockDb.getAnalytics();
};

export const incrementPageVisit = async (): Promise<void> => {
  if (db) {
    try {
      const docRef = doc(db, "analytics", "traffic");
      await setDoc(docRef, { totalVisitors: increment(1) }, { merge: true });
      return;
    } catch (e) {
      console.error("Firestore incrementPageVisit error:", e);
    }
  }
  mockDb.incrementVisitorCount();
};
