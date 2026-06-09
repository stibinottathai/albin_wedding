"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Settings as SettingsIcon, 
  MessageSquare, 
  BarChart3, 
  Copy, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Lock,
  ArrowRight,
  Globe,
  ExternalLink,
  ClipboardList,
  Filter,
  Camera,
  BookOpen,
  Edit,
  Calendar,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  getWeddingInfo, 
  saveWeddingInfo, 
  getGuests, 
  createGuest, 
  updateGuest,
  deleteGuest, 
  getAnalytics, 
  getGalleryImages,
  saveGalleryImage,
  deleteGalleryImage,
  getStories,
  saveStory,
  deleteStory,
  getEvents,
  saveEvent,
  deleteEvent,
  getFaqs,
  saveFaq,
  deleteFaq,
  WeddingInfo, 
  Guest, 
  Analytics,
  GalleryImage,
  StoryMilestone,
  WeddingEvent,
  FaqItem
} from "../../lib/db";
import { supabase, isSupabaseConfigured, compressImage } from "../../lib/supabase";

interface Wish {
  id: string;
  guestName: string;
  message: string;
  approved: boolean;
  timestamp: string;
  emoji?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const storyFormRef = React.useRef<HTMLDivElement>(null);
  const faqFormRef = React.useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"analytics" | "rsvp" | "guests" | "wishes" | "settings" | "gallery" | "stories" | "events" | "faq">("analytics");
  const [rsvpFilter, setRsvpFilter] = useState<"all" | "accepted" | "declined" | "pending">("all");
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [storyMilestones, setStoryMilestones] = useState<StoryMilestone[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // FAQ form states
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [faqSuccess, setFaqSuccess] = useState(false);
  const [faqError, setFaqError] = useState("");
  
  // Form states for Wedding Events
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [eventTimeValue, setEventTimeValue] = useState(""); // Stores HH:MM format e.g. "10:30"
  const [eventTimeAmpm, setEventTimeAmpm] = useState("AM"); // Stores AM or PM
  const [newEventVenue, setNewEventVenue] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventImageUrl, setNewEventImageUrl] = useState("");
  const [newEventImageFile, setNewEventImageFile] = useState<File | null>(null);
  const [newEventGoogleCalendarUrl, setNewEventGoogleCalendarUrl] = useState("");
  const [eventUploadType, setEventUploadType] = useState<"file" | "url">("file");
  const [eventUploading, setEventUploading] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);
  const [eventError, setEventError] = useState("");

  const eventFormRef = React.useRef<HTMLDivElement>(null);

  // Time conversion helpers
  const convert24to12 = (time24: string): string => {
    if (!time24) return "";
    const [hoursStr, minutesStr] = time24.split(":");
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    const hoursFormatted = hours < 10 ? "0" + hours : hours;
    return `${hoursFormatted}:${minutesFormatted} ${ampm}`;
  };

  const convert12to24 = (time12: string): string => {
    if (!time12) return "";
    const m = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return "";
    let hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    const hoursFormatted = hours < 10 ? "0" + hours : hours;
    const minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    return `${hoursFormatted}:${minutesFormatted}`;
  };
  
  // Form states for Our Story milestones
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [newStoryYear, setNewStoryYear] = useState("");
  const [newStoryTitleEn, setNewStoryTitleEn] = useState("");
  const [newStoryTitleMl, setNewStoryTitleMl] = useState("");
  const [newStoryTextEn, setNewStoryTextEn] = useState("");
  const [newStoryTextMl, setNewStoryTextMl] = useState("");
  const [newStoryImageUrl, setNewStoryImageUrl] = useState("");
  const [newStoryImageFile, setNewStoryImageFile] = useState<File | null>(null);
  const [newStoryOrderIndex, setNewStoryOrderIndex] = useState(1);
  const [storyUploadType, setStoryUploadType] = useState<"file" | "url">("file");
  const [storyUploading, setStoryUploading] = useState(false);
  const [storySuccess, setStorySuccess] = useState(false);
  const [storyError, setStoryError] = useState("");

  // Form states for gallery upload
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; id: string; preview: string; alt: string; uploadStatus?: "pending" | "uploading" | "success" | "error" }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCategory, setNewImageCategory] = useState<string>("pre-wedding");

  // Cleanup object URLs for selected files to prevent memory leaks
  useEffect(() => {
    return () => {
      newImageFiles.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, [newImageFiles]);
  const [newImageAlt, setNewImageAlt] = useState("");
  const [galleryFilterCategory, setGalleryFilterCategory] = useState("All");
  const [isAddingCustomGalleryCategory, setIsAddingCustomGalleryCategory] = useState(false);
  const [customGalleryCategoryInput, setCustomGalleryCategoryInput] = useState("");
  const [editingGalleryCatIndex, setEditingGalleryCatIndex] = useState<number | null>(null);
  const [editingGalleryCatValue, setEditingGalleryCatValue] = useState("");
  const [visibleGalleryCount, setVisibleGalleryCount] = useState(12);
  const [loadingMoreGallery, setLoadingMoreGallery] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form states for creating new guest
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestGreeting, setNewGuestGreeting] = useState("");
  const [newGuestAttendees, setNewGuestAttendees] = useState(2);
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestCategory, setNewGuestCategory] = useState("General");
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [guestFilterCategory, setGuestFilterCategory] = useState("All");

  // WhatsApp Card Sharing Modal
  const [sharingGuest, setSharingGuest] = useState<Guest | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<"floral" | "gold" | "modern" | "gallery">("floral");
  const [selectedGalleryImage, setSelectedGalleryImage] = useState("");
  const [sharePhone, setSharePhone] = useState("");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [viewingRsvpMessage, setViewingRsvpMessage] = useState<{ name: string; greeting: string; message: string } | null>(null);
  
  // Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Table Pagination states
  const PAGE_SIZE = 10;
  const [guestsPage, setGuestsPage] = useState(1);
  const [rsvpsPage, setRsvpsPage] = useState(1);

  // Reset pagination to page 1 when filters change
  useEffect(() => {
    setGuestsPage(1);
  }, [guestFilterCategory]);

  useEffect(() => {
    setRsvpsPage(1);
  }, [rsvpFilter]);

  useEffect(() => {
    setVisibleGalleryCount(12);
  }, [galleryFilterCategory]);

  // Clamp page indices when dataset size shrinks (e.g. deletion of the last item on a page)
  useEffect(() => {
    const filtered = guests.filter(
      (g) => guestFilterCategory === "All" || g.category === guestFilterCategory
    );
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    if (guestsPage > totalPages) {
      setGuestsPage(totalPages);
    }
  }, [guests, guestFilterCategory, guestsPage]);

  useEffect(() => {
    const filtered = guests.filter(
      (g) => rsvpFilter === "all" || g.rsvpStatus === rsvpFilter
    );
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    if (rsvpsPage > totalPages) {
      setRsvpsPage(totalPages);
    }
  }, [guests, rsvpFilter, rsvpsPage]);

  // Wishes lazy loading/pagination states
  const [visibleWishesCount, setVisibleWishesCount] = useState(10);
  const [loadingMoreWishes, setLoadingMoreWishes] = useState(false);

  const handleLoadMoreWishes = () => {
    setLoadingMoreWishes(true);
    setTimeout(() => {
      setVisibleWishesCount((prev) => prev + 10);
      setLoadingMoreWishes(false);
    }, 300);
  };

  const handleLoadMoreGallery = () => {
    setLoadingMoreGallery(true);
    setTimeout(() => {
      setVisibleGalleryCount((prev) => prev + 12);
      setLoadingMoreGallery(false);
    }, 300);
  };

  // Helper to generate premium page numbers with ellipsis
  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) {
      pages.push("ellipsis-start");
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push("ellipsis-end");
    }
    pages.push(total);
    return pages;
  };

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Authenticate Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (data?.user) {
          if (data.user.email === "stibinaugustine3047@gmail.com") {
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            setAuthError("Unauthorized email address.");
            await supabase.auth.signOut();
          }
        }
      } catch (err: any) {
        setAuthError(err.message || "Sign in failed.");
      }
    } else {
      // Local fallback logic
      if (email.trim() === "stibinaugustine3047@gmail.com" && password === "12345678") {
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("admin_authed", "true");
        }
      } else {
        setAuthError("Incorrect email or password.");
      }
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem("admin_authed");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/");
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      if (typeof window !== "undefined") {
        const authed = sessionStorage.getItem("admin_authed");
        if (authed === "true") {
          setIsAuthenticated(true);
        }
      }
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (session.user.email === "stibinaugustine3047@gmail.com") {
            setUser(session.user);
            setIsAuthenticated(true);
          } else {
            setAuthError(`Unauthorized email: ${session.user.email}`);
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (session.user.email === "stibinaugustine3047@gmail.com") {
          setUser(session.user);
          setIsAuthenticated(true);
          setAuthError("");
        } else {
          setAuthError(`Unauthorized email: ${session.user.email}`);
          setIsAuthenticated(false);
          setUser(null);
          await supabase.auth.signOut();
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      const [
        info,
        guestRes,
        wishesRes,
        stats,
        galleryList,
        storiesList,
        eventsList,
        faqsList
      ] = await Promise.all([
        getWeddingInfo(),
        fetch("/api/rsvp"),
        fetch("/api/wishes?all=true"),
        getAnalytics(),
        getGalleryImages(),
        getStories(),
        getEvents(),
        getFaqs()
      ]);

      setWeddingInfo(info);

      // Resolve JSON parsing sequentially but it's very fast
      const guestList = guestRes.ok ? await guestRes.json() : await getGuests();
      setGuests(Array.isArray(guestList) ? guestList : []);

      const wishesResult = wishesRes.ok ? await wishesRes.json() : null;
      const wishesList = wishesResult && Array.isArray(wishesResult.data) ? wishesResult.data : [];
      setWishes(wishesList);

      setAnalytics(stats);
      setGalleryImages(Array.isArray(galleryList) ? galleryList : []);
      
      setStoryMilestones(Array.isArray(storiesList) ? storiesList : []);
      if (Array.isArray(storiesList)) {
        setNewStoryOrderIndex(storiesList.length + 1);
      }
      
      setEvents(Array.isArray(eventsList) ? eventsList : []);
      setFaqs(Array.isArray(faqsList) ? faqsList : []);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await getWeddingInfo();
        setWeddingInfo(info);
      } catch (err) {
        console.error("Failed to load wedding info on mount:", err);
      }
    };
    fetchInfo();
  }, []);

  useEffect(() => {
    if (weddingInfo) {
      document.title = `${weddingInfo.groomName} & ${weddingInfo.brideName} | Admin Dashboard`;
    } else {
      document.title = "Wedding Admin Dashboard";
    }
  }, [weddingInfo]);

  // Resolve Categories list dynamically
  const guestCategories: string[] = weddingInfo?.categories
    ? JSON.parse(weddingInfo.categories)
    : ["General", "Family", "Friends", "Relatives"];

  // Resolve Gallery Categories list dynamically
  const galleryCategories: string[] = weddingInfo?.galleryCategories
    ? JSON.parse(weddingInfo.galleryCategories)
    : ["pre-wedding", "engagement", "family", "memories"];

  // Re-render Canvas Invitation Card
  useEffect(() => {
    if (!sharingGuest || !canvasRef.current || !weddingInfo) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const renderCanvasText = (
      context: CanvasRenderingContext2D,
      cvs: HTMLCanvasElement,
      textColor: string,
      accentColor: string
    ) => {
      const drawCenterText = (text: string, y: number, font: string, color: string) => {
        context.fillStyle = color;
        context.font = font;
        context.textAlign = "center";
        context.fillText(text, cvs.width / 2, y);
      };

      // 1. Save The Date Monogram
      drawCenterText("SAVE THE DATE", 110, "bold 14px sans-serif", accentColor);

      // 2. Names of Groom & Bride
      const groom = weddingInfo?.groomName || "Albin";
      const bride = weddingInfo?.brideName || "Stella";
      drawCenterText(`${groom}  &  ${bride}`, 200, "italic 44px Georgia, serif", textColor);

      // 3. Separation line
      context.strokeStyle = accentColor;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(cvs.width / 2 - 80, 240);
      context.lineTo(cvs.width / 2 + 80, 240);
      context.stroke();

      // 4. Specially Invited
      drawCenterText("SPECIALLY INVITED:", 295, "bold 11px sans-serif", selectedTemplate === "gold" || selectedTemplate === "gallery" ? "#cccccc" : "#6b7280");
      
      // 5. Guest Greeting
      drawCenterText(sharingGuest?.greeting || "", 355, "italic 30px Georgia, serif", accentColor);

      // 6. Venue & Date Info
      const dateObj = new Date(weddingInfo?.weddingDate || "");
      const dateStr = weddingInfo?.weddingDate && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : weddingInfo?.weddingDate || "";

      drawCenterText(dateStr, 430, "bold 14px sans-serif", textColor);
      drawCenterText(weddingInfo?.locationName || "", 470, "16px sans-serif", textColor);
      
      // 7. Footer invitation line
      drawCenterText("Please view our digital invitation card for details and RSVP.", 525, "italic 13px sans-serif", selectedTemplate === "gold" || selectedTemplate === "gallery" ? "#cccccc" : "#4b5563");
    };

    if (selectedTemplate === "gallery" && selectedGalleryImage) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Avoid tainted canvas
      img.src = selectedGalleryImage;
      img.onload = () => {
        // Draw image covered
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let dWidth = canvas.width;
        let dHeight = canvas.height;
        let sx = 0;
        let sy = 0;
        let sWidth = img.width;
        let sHeight = img.height;

        if (imgRatio > canvasRatio) {
          sWidth = img.height * canvasRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / canvasRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);

        // Semi-transparent dark overlay so text is legible
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gold border
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        renderCanvasText(ctx, canvas, "#ffffff", "#d4af37");
      };
      img.onerror = () => {
        // Fallback to floral template on error
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#fffcf9");
        grad.addColorStop(1, "#fcf1e5");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        renderCanvasText(ctx, canvas, "#1f2937", "#d4af37");
      };
    } else {
      let textColor = "#1f2937";
      let accentColor = "#d4af37";

      if (selectedTemplate === "floral") {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#fffcf9");
        grad.addColorStop(1, "#fcf1e5");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        // Corner accents
        ctx.fillStyle = "#8d795b";
        ctx.font = "italic 32px serif";
        ctx.fillText("❀", 60, 80);
        ctx.fillText("❀", canvas.width - 90, 80);
        ctx.fillText("❀", 60, canvas.height - 70);
        ctx.fillText("❀", canvas.width - 90, canvas.height - 70);
      } else if (selectedTemplate === "gold") {
        ctx.fillStyle = "#1b1816";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 6;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        ctx.strokeStyle = "#eec960";
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        textColor = "#ffffff";
      } else {
        // Modern Minimalist
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        accentColor = "#1f2937";
      }

      renderCanvasText(ctx, canvas, textColor, accentColor);
    }
  }, [sharingGuest, selectedTemplate, selectedGalleryImage, weddingInfo]);

  // Copy invitation link to clipboard
  const handleCopyLink = (guestId: string) => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const inviteUrl = `${origin}/invite/${guestId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(guestId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add/Edit Guest Action
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    try {
      if (editingGuest) {
        await updateGuest(editingGuest.id, {
          name: newGuestName.trim(),
          greeting: newGuestGreeting.trim() || newGuestName.trim(),
          allowedAttendees: newGuestAttendees,
          email: newGuestEmail.trim() || undefined,
          category: newGuestCategory
        });
        setEditingGuest(null);
      } else {
        await createGuest(
          newGuestName.trim(), 
          newGuestGreeting.trim() || newGuestName.trim(), 
          newGuestAttendees, 
          newGuestEmail.trim() || undefined,
          newGuestCategory
        );
      }
      setNewGuestName("");
      setNewGuestGreeting("");
      setNewGuestAttendees(2);
      setNewGuestEmail("");
      setNewGuestCategory("General");
      loadAdminData(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setNewGuestName(guest.name || "");
    setNewGuestGreeting(guest.greeting || "");
    setNewGuestAttendees(guest.allowedAttendees || 2);
    setNewGuestEmail(guest.email || "");
    setNewGuestCategory(guest.category || "General");
  };

  const handleCancelEditGuest = () => {
    setEditingGuest(null);
    setNewGuestName("");
    setNewGuestGreeting("");
    setNewGuestAttendees(2);
    setNewGuestEmail("");
    setNewGuestCategory("General");
  };

  // Add custom category in dropdown
  const handleSaveCustomCategory = async () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    if (guestCategories.includes(trimmed)) {
      setNewGuestCategory(trimmed);
      setIsAddingCustomCategory(false);
      setCustomCategoryInput("");
      return;
    }

    const updatedCategories = [...guestCategories, trimmed];
    if (weddingInfo) {
      const updatedInfo = {
        ...weddingInfo,
        categories: JSON.stringify(updatedCategories)
      };
      try {
        await saveWeddingInfo(updatedInfo);
        setWeddingInfo(updatedInfo);
      } catch (err) {
        console.error("Failed to save custom category:", err);
      }
    }
    setNewGuestCategory(trimmed);
    setIsAddingCustomCategory(false);
    setCustomCategoryInput("");
  };

  // Add custom gallery category in dropdown
  const handleSaveCustomGalleryCategory = async () => {
    const trimmed = customGalleryCategoryInput.trim();
    if (!trimmed) return;
    if (galleryCategories.includes(trimmed)) {
      setNewImageCategory(trimmed);
      setIsAddingCustomGalleryCategory(false);
      setCustomGalleryCategoryInput("");
      return;
    }
    if (galleryCategories.length >= 6) {
      alert("Maximum 6 gallery categories allowed.");
      return;
    }

    const updatedCategories = [...galleryCategories, trimmed];
    if (weddingInfo) {
      const updatedInfo = {
        ...weddingInfo,
        galleryCategories: JSON.stringify(updatedCategories)
      };
      try {
        await saveWeddingInfo(updatedInfo);
        setWeddingInfo(updatedInfo);
      } catch (err) {
        console.error("Failed to save custom gallery category:", err);
      }
    }
    setNewImageCategory(trimmed);
    setIsAddingCustomGalleryCategory(false);
    setCustomGalleryCategoryInput("");
  };

  const handleRenameGalleryCategory = async (index: number) => {
    const newName = editingGalleryCatValue.trim();
    const oldName = galleryCategories[index];
    if (!newName || newName === oldName) {
      setEditingGalleryCatIndex(null);
      return;
    }
    if (galleryCategories.includes(newName)) {
      alert("A category with this name already exists.");
      return;
    }
    const updatedCategories = [...galleryCategories];
    updatedCategories[index] = newName;
    // Update all images using the old category name
    const updatedImages = galleryImages.map((img) =>
      img.category === oldName ? { ...img, category: newName } : img
    );
    if (weddingInfo) {
      const updatedInfo = { ...weddingInfo, galleryCategories: JSON.stringify(updatedCategories) };
      try {
        await saveWeddingInfo(updatedInfo);
        setWeddingInfo(updatedInfo);
        // Update each affected image in the database
        for (const img of updatedImages.filter((i) => i.category === newName)) {
          await saveGalleryImage(img);
        }
        setGalleryImages(updatedImages);
        if (newImageCategory === oldName) setNewImageCategory(newName);
        if (galleryFilterCategory === oldName) setGalleryFilterCategory(newName);
      } catch (err) {
        console.error("Failed to rename gallery category:", err);
      }
    }
    setEditingGalleryCatIndex(null);
    setEditingGalleryCatValue("");
  };

  const handleDeleteGalleryCategory = async (index: number) => {
    const catToDelete = galleryCategories[index];
    const hasImages = galleryImages.some((img) => img.category === catToDelete);
    if (hasImages) {
      if (!confirm(`"${catToDelete}" has images assigned. They will be moved to "${galleryCategories[0] === catToDelete ? galleryCategories[1] || "uncategorized" : galleryCategories[0]}". Continue?`)) return;
    } else {
      if (!confirm(`Delete category "${catToDelete}"?`)) return;
    }
    const updatedCategories = galleryCategories.filter((_, i) => i !== index);
    const fallback = updatedCategories[0] || "uncategorized";
    const updatedImages = galleryImages.map((img) =>
      img.category === catToDelete ? { ...img, category: fallback } : img
    );
    if (weddingInfo) {
      const updatedInfo = { ...weddingInfo, galleryCategories: JSON.stringify(updatedCategories) };
      try {
        await saveWeddingInfo(updatedInfo);
        setWeddingInfo(updatedInfo);
        for (const img of updatedImages.filter((i) => i.category === fallback && galleryImages.find((o) => o.id === i.id)?.category === catToDelete)) {
          await saveGalleryImage(img);
        }
        setGalleryImages(updatedImages);
        if (newImageCategory === catToDelete) setNewImageCategory(fallback);
        if (galleryFilterCategory === catToDelete) setGalleryFilterCategory("All");
      } catch (err) {
        console.error("Failed to delete gallery category:", err);
      }
    }
    setEditingGalleryCatIndex(null);
  };

  // Handle file selection for gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedList = Array.from(e.target.files);
      if (selectedList.length + newImageFiles.length > 10) {
        setUploadError("You can upload a maximum of 10 photos at a time.");
        return;
      }
      setUploadError("");
      const newItems = selectedList.map(file => ({
        file,
        id: `file-${Math.random().toString(36).substring(2, 9)}`,
        preview: URL.createObjectURL(file),
        alt: ""
      }));
      setNewImageFiles(prev => [...prev, ...newItems]);
    }
  };

  // Remove a file from the selected list
  const handleRemoveSelectedFile = (id: string) => {
    const itemToRemove = newImageFiles.find(item => item.id === id);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.preview);
    }
    setNewImageFiles(prev => prev.filter(item => item.id !== id));
  };

  // Download digital invitation card
  const handleDownloadCard = () => {
    if (!canvasRef.current || !sharingGuest) return;
    const link = document.createElement("a");
    link.download = `Invitation_${sharingGuest.name.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // Copy invitation card image to clipboard
  const handleCopyCardImage = async () => {
    if (!canvasRef.current || !sharingGuest) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          alert("Failed to generate invitation card image blob.");
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          alert("Personalized Invitation Card copied to clipboard! You can now paste (Ctrl+V) it directly into WhatsApp.");
        } catch (err: any) {
          console.error("Clipboard write error:", err);
          alert("Could not copy card image to clipboard automatically. Please use the Download button instead.");
        }
      }, "image/png");
    } catch (err) {
      console.error(err);
      alert("Failed to capture invitation card.");
    }
  };

  // Delete Guest Action
  const handleDeleteGuest = async (id: string) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      // Optimistic UI update
      setGuests(prev => prev.filter(g => g.id !== id));
      try {
        await deleteGuest(id);
      } catch (err) {
        console.error(err);
        loadAdminData(); // Revert on failure
      }
    }
  };

  // Moderation: Approve/Reject Wish
  const handleToggleWish = async (id: string, approved: boolean) => {
    // Optimistic UI update
    setWishes(prev => prev.map(w => w.id === id ? { ...w, approved } : w));
    try {
      await fetch(`/api/wishes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
    } catch (err) {
      console.error(err);
      loadAdminData(); // Revert on failure
    }
  };

  // Moderation: Delete Wish
  const handleDeleteWish = async (id: string) => {
    if (confirm("Delete this message?")) {
      // Optimistic UI update
      setWishes(prev => prev.filter(w => w.id !== id));
      try {
        await fetch(`/api/wishes/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error(err);
        loadAdminData(); // Revert on failure
      }
    }
  };

  // Moderation: Delete All Wishes
  const handleDeleteAllWishes = async () => {
    if (confirm("Are you sure you want to delete ALL wishes? This action cannot be undone.")) {
      // Optimistic UI update
      setWishes([]);
      try {
        await fetch(`/api/wishes`, { method: "DELETE" });
      } catch (err) {
        console.error(err);
        loadAdminData(); // Revert on failure
      }
    }
  };

  // Settings: Save Wedding Details
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingInfo) return;

    try {
      await saveWeddingInfo(weddingInfo);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Gallery: Upload and Save photo
  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(false);

    if (uploadType === "url") {
      if (!newImageUrl.trim()) {
        setUploadError("Please enter an image URL.");
        return;
      }
      setUploading(true);
      try {
        const newImage: GalleryImage = {
          id: `gal-${Math.random().toString(36).substring(2, 9)}`,
          src: newImageUrl.trim(),
          category: newImageCategory,
          alt: newImageAlt.trim() || `${newImageCategory} photo`,
          createdAt: new Date().toISOString()
        };
        await saveGalleryImage(newImage);

        // Reset URL form
        setNewImageUrl("");
        setNewImageAlt("");
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        loadAdminData();
      } catch (err: any) {
        setUploadError(err.message || "Failed to save gallery image.");
      } finally {
        setUploading(false);
      }
    } else {
      // File mode
      if (newImageFiles.length === 0) {
        setUploadError("Please select at least one image file to upload.");
        return;
      }

      setUploading(true);
      try {
        const successfulIds: string[] = [];
        let hasError = false;

        for (const item of newImageFiles) {
          try {
            setNewImageFiles(prev => prev.map(p => p.id === item.id ? { ...p, uploadStatus: "uploading" } : p));
            
            let src = "";
            // Compress image client-side to maximum 1920px (full scale for lightbox)
            const compressedBlob = await compressImage(item.file, 1920, 0.82);

            if (isSupabaseConfigured) {
              // We now compress all images as WebP
              const fileExt = compressedBlob.type === 'image/webp' ? 'webp' : item.file.name.split(".").pop();
              const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
              const filePath = `${fileName}`;

              const { error: uploadErr } = await supabase.storage
                .from("gallery")
                .upload(filePath, compressedBlob, {
                  cacheControl: "public, max-age=31536000, immutable",
                  contentType: item.file.type,
                  upsert: false
                });

              if (uploadErr) {
                throw new Error(`Supabase Storage upload failed for ${item.file.name}: ${uploadErr.message}`);
              }

              const { data: { publicUrl } } = supabase.storage
                .from("gallery")
                .getPublicUrl(filePath);

              src = publicUrl;
            } else {
              // Local fallback: convert compressed image to base64 (avoids storage quota limits)
              src = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressedBlob);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (err) => reject(err);
              });
            }

            const newImage: GalleryImage = {
              id: `gal-${Math.random().toString(36).substring(2, 9)}`,
              src,
              category: newImageCategory,
              alt: item.alt.trim() || newImageAlt.trim() || `${newImageCategory} photo`,
              createdAt: new Date().toISOString()
            };

            await saveGalleryImage(newImage);
            
            setNewImageFiles(prev => prev.map(p => p.id === item.id ? { ...p, uploadStatus: "success" } : p));
            successfulIds.push(item.id);
          } catch (innerErr) {
            console.error(innerErr);
            setNewImageFiles(prev => prev.map(p => p.id === item.id ? { ...p, uploadStatus: "error" } : p));
            hasError = true;
          }
        }

        // Wait briefly so user sees the success checkmarks
        await new Promise(r => setTimeout(r, 1200));

        // Cleanup object URLs for successful ones
        newImageFiles.forEach(item => {
          if (successfulIds.includes(item.id)) {
            URL.revokeObjectURL(item.preview);
          }
        });
        
        // Reset file form but keep errored ones
        setNewImageFiles(prev => prev.filter(p => !successfulIds.includes(p.id)));

        const fileInput = document.getElementById("gallery-file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        if (!hasError) {
          setNewImageAlt("");
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          setUploadError("Some images failed to upload. Check their status.");
        }
        
        loadAdminData();
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || "Failed to upload images.");
      } finally {
        setUploading(false);
      }
    }
  };

  // Gallery: Delete photo
  const handleDeleteImage = async (id: string, src: string) => {
    if (confirm("Are you sure you want to delete this image from the gallery?")) {
      setDeletingImageId(id);
      try {
        await deleteGalleryImage(id);

        // Optional: If it's a Supabase storage URL, try to delete the file from storage bucket
        if (isSupabaseConfigured && src.includes("/storage/v1/object/public/gallery/")) {
          const fileName = src.split("/gallery/").pop();
          if (fileName) {
            await supabase.storage.from("gallery").remove([fileName]);
          }
        }
        
        // Optimistically update the UI instead of reloading all admin data
        setGalleryImages(prev => prev.filter(img => img.id !== id));
      } catch (err) {
        console.error("Failed to delete image:", err);
      } finally {
        setDeletingImageId(null);
      }
    }
  };

  // Gallery: Delete all photos
  const handleDeleteAllGalleryImages = async () => {
    if (galleryImages.length === 0) return;
    if (confirm("Are you ABSOLUTELY sure you want to delete ALL photos from the gallery? This action cannot be undone.")) {
      setDeletingImageId("all");
      try {
        // Delete all records from database sequentially to avoid overwhelming
        for (const img of galleryImages) {
          await deleteGalleryImage(img.id);
        }

        // Delete all from Supabase storage in one batch
        if (isSupabaseConfigured) {
          const filesToRemove = galleryImages
            .map(img => {
              if (img.src.includes("/storage/v1/object/public/gallery/")) {
                return img.src.split("/gallery/").pop();
              }
              return null;
            })
            .filter(Boolean) as string[];
            
          if (filesToRemove.length > 0) {
            await supabase.storage.from("gallery").remove(filesToRemove);
          }
        }
        
        // Optimistically update the UI
        setGalleryImages([]);
      } catch (err) {
        console.error("Failed to delete all images:", err);
        alert("Failed to delete some images. Please refresh and try again.");
      } finally {
        setDeletingImageId(null);
      }
    }
  };

  // Gallery: Delete selected photos
  const handleDeleteSelectedImages = async () => {
    if (selectedImages.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedImages.length} selected photos?`)) {
      setDeletingImageId("selected");
      try {
        // Delete records from database sequentially
        for (const id of selectedImages) {
          await deleteGalleryImage(id);
        }

        // Delete from Supabase storage in one batch
        if (isSupabaseConfigured) {
          const filesToRemove = galleryImages
            .filter(img => selectedImages.includes(img.id))
            .map(img => {
              if (img.src.includes("/storage/v1/object/public/gallery/")) {
                return img.src.split("/gallery/").pop();
              }
              return null;
            })
            .filter(Boolean) as string[];
            
          if (filesToRemove.length > 0) {
            await supabase.storage.from("gallery").remove(filesToRemove);
          }
        }
        
        // Optimistically update the UI
        setGalleryImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
        setSelectedImages([]);
        setIsSelectionMode(false);
      } catch (err) {
        console.error("Failed to delete selected images:", err);
        alert("Failed to delete some images. Please refresh and try again.");
      } finally {
        setDeletingImageId(null);
      }
    }
  };

  // Our Story: Upload and Save milestone
  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoryError("");
    setStorySuccess(false);

    if (!newStoryYear.trim()) {
      setStoryError("Please enter a year (e.g. June 2022).");
      return;
    }
    if (!newStoryTitleEn.trim() || !newStoryTitleMl.trim()) {
      setStoryError("Please enter both English and Malayalam titles.");
      return;
    }

    let imageUrl = newStoryImageUrl.trim();

    if (storyUploadType === "file" && newStoryImageFile) {
      setStoryUploading(true);
      try {
        // Compress image client-side to maximum 1200px (timeline images are smaller)
        const compressedBlob = await compressImage(newStoryImageFile, 1200, 0.8);

        if (isSupabaseConfigured) {
          const fileExt = compressedBlob.type === 'image/webp' ? 'webp' : newStoryImageFile.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from("stories")
            .upload(filePath, compressedBlob, {
              cacheControl: "public, max-age=31536000, immutable",
              contentType: newStoryImageFile.type,
              upsert: false
            });

          if (uploadErr) {
            throw new Error(`Supabase Storage upload failed: ${uploadErr.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from("stories")
            .getPublicUrl(filePath);

          imageUrl = publicUrl;
        } else {
          // Local fallback: convert compressed image to base64 (avoids storage quota limits)
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(compressedBlob);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
        }
      } catch (err: any) {
        console.error(err);
        setStoryError(err.message || "Failed to upload image. Please try pasting a URL instead.");
        setStoryUploading(false);
        return;
      }
    } else if (storyUploadType === "file" && !editingMilestoneId) {
      setStoryError("Please select an image file to upload.");
      return;
    }

    try {
      const milestone: StoryMilestone = {
        id: editingMilestoneId || `story-${Math.random().toString(36).substring(2, 9)}`,
        year: newStoryYear.trim(),
        titleEn: newStoryTitleEn.trim(),
        titleMl: newStoryTitleMl.trim(),
        textEn: newStoryTextEn.trim(),
        textMl: newStoryTextMl.trim(),
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800",
        orderIndex: newStoryOrderIndex,
        createdAt: new Date().toISOString()
      };

      await saveStory(milestone);
      
      // Reset form
      setEditingMilestoneId(null);
      setNewStoryYear("");
      setNewStoryTitleEn("");
      setNewStoryTitleMl("");
      setNewStoryTextEn("");
      setNewStoryTextMl("");
      setNewStoryImageUrl("");
      setNewStoryImageFile(null);
      setNewStoryOrderIndex(storyMilestones.length + 2);
      
      const fileInput = document.getElementById("story-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setStorySuccess(true);
      setTimeout(() => setStorySuccess(false), 3000);
      loadAdminData();
    } catch (err: any) {
      setStoryError(err.message || "Failed to save milestone.");
    } finally {
      setStoryUploading(false);
    }
  };

  const handleEditStory = (milestone: StoryMilestone) => {
    setEditingMilestoneId(milestone.id);
    setNewStoryYear(milestone.year || "");
    setNewStoryTitleEn(milestone.titleEn || "");
    setNewStoryTitleMl(milestone.titleMl || "");
    setNewStoryTextEn(milestone.textEn || "");
    setNewStoryTextMl(milestone.textMl || "");
    setNewStoryImageUrl(milestone.imageUrl || "");
    setNewStoryOrderIndex(milestone.orderIndex || 1);
    setStoryUploadType("url"); // Set to URL to show the current image URL

    // Smoothly scroll to the Story Form container
    storyFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEditStory = () => {
    setEditingMilestoneId(null);
    setNewStoryYear("");
    setNewStoryTitleEn("");
    setNewStoryTitleMl("");
    setNewStoryTextEn("");
    setNewStoryTextMl("");
    setNewStoryImageUrl("");
    setNewStoryImageFile(null);
    setNewStoryOrderIndex(storyMilestones.length + 1);
  };

  const handleDeleteStory = async (id: string, imageUrl: string) => {
    if (confirm("Are you sure you want to delete this story milestone?")) {
      // Optimistic UI update
      setStoryMilestones(prev => prev.filter(story => story.id !== id));
      try {
        await deleteStory(id);

        // Delete from storage if it is a Supabase object
        if (isSupabaseConfigured && imageUrl.includes("/storage/v1/object/public/stories/")) {
          const fileName = imageUrl.split("/stories/").pop();
          if (fileName) {
            await supabase.storage.from("stories").remove([fileName]);
          }
        }
      } catch (err) {
        console.error("Failed to delete story:", err);
        loadAdminData(); // Revert on failure
      }
    }
  };

  // Wedding Events: Upload and Save event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError("");
    setEventSuccess(false);

    if (!newEventTitle.trim()) {
      setEventError("Please enter an event title.");
      return;
    }
    if (!newEventDate.trim()) {
      setEventError("Please select an event date.");
      return;
    }
    if (!eventTimeValue.trim()) {
      setEventError("Please enter an event time.");
      return;
    }
    if (!newEventVenue.trim()) {
      setEventError("Please enter a venue.");
      return;
    }
    if (!newEventDescription.trim()) {
      setEventError("Please enter a description.");
      return;
    }

    let imageUrl = newEventImageUrl.trim();

    if (eventUploadType === "file" && newEventImageFile) {
      setEventUploading(true);
      try {
        // Compress image client-side to maximum 1200px (event cards are smaller)
        const compressedBlob = await compressImage(newEventImageFile, 1200, 0.8);

        if (isSupabaseConfigured) {
          const fileExt = compressedBlob.type === 'image/webp' ? 'webp' : newEventImageFile.name.split(".").pop();
          const fileName = `event_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from("gallery")
            .upload(filePath, compressedBlob, {
              cacheControl: "public, max-age=31536000, immutable",
              contentType: newEventImageFile.type,
              upsert: false
            });

          if (uploadErr) {
            throw new Error(`Supabase Storage upload failed: ${uploadErr.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from("gallery")
            .getPublicUrl(filePath);

          imageUrl = publicUrl;
        } else {
          // Local fallback: convert compressed image to base64 (avoids storage quota limits)
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(compressedBlob);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
        }
      } catch (err: any) {
        console.error(err);
        setEventError(err.message || "Failed to upload image. Please try pasting a URL instead.");
        setEventUploading(false);
        return;
      }
    } else if (eventUploadType === "file" && !editingEventId) {
      setEventError("Please select an image file to upload.");
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]$/;
    if (!timeRegex.test(eventTimeValue.trim())) {
      setEventError("Please enter a valid time in HH:MM format (between 01:00 and 12:59).");
      setEventUploading(false);
      return;
    }

    try {
      const eventTime12 = `${eventTimeValue.trim()} ${eventTimeAmpm}`;
      const event: WeddingEvent = {
        id: editingEventId || `event-${Math.random().toString(36).substring(2, 9)}`,
        title: newEventTitle.trim(),
        date: newEventDate.trim(),
        time: eventTime12,
        venue: newEventVenue.trim(),
        description: newEventDescription.trim(),
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600",
        googleCalendarUrl: newEventGoogleCalendarUrl.trim() || undefined
      };

      await saveEvent(event);
      
      // Reset form
      setEditingEventId(null);
      setNewEventTitle("");
      setNewEventDate("");
      setEventTimeValue("");
      setEventTimeAmpm("AM");
      setNewEventVenue("");
      setNewEventDescription("");
      setNewEventImageUrl("");
      setNewEventImageFile(null);
      setNewEventGoogleCalendarUrl("");
      setEventUploadType("file");
      
      const fileInput = document.getElementById("event-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setEventSuccess(true);
      setTimeout(() => setEventSuccess(false), 3000);
      loadAdminData();
    } catch (err: any) {
      setEventError(err.message || "Failed to save event.");
    } finally {
      setEventUploading(false);
    }
  };

  const handleEditEvent = (event: WeddingEvent) => {
    setEditingEventId(event.id);
    setNewEventTitle(event.title || "");
    setNewEventDate(event.date || "");
    
    // Parse time (e.g. "10:30 AM") into value and AM/PM
    const m = (event.time || "").match(/(\d{1,2}:\d{2})\s*(AM|PM)/i);
    if (m) {
      setEventTimeValue(m[1]);
      setEventTimeAmpm(m[2].toUpperCase());
    } else {
      setEventTimeValue("");
      setEventTimeAmpm("AM");
    }
    
    setNewEventVenue(event.venue || "");
    setNewEventDescription(event.description || "");
    setNewEventImageUrl(event.imageUrl || "");
    setNewEventGoogleCalendarUrl(event.googleCalendarUrl || "");
    setEventUploadType("url");

    // Smoothly scroll to the Event Form container
    eventFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEditEvent = () => {
    setEditingEventId(null);
    setNewEventTitle("");
    setNewEventDate("");
    setEventTimeValue("");
    setEventTimeAmpm("AM");
    setNewEventVenue("");
    setNewEventDescription("");
    setNewEventImageUrl("");
    setNewEventImageFile(null);
    setNewEventGoogleCalendarUrl("");
    setEventUploadType("file");
    
    const fileInput = document.getElementById("event-file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleDeleteEvent = async (id: string, imageUrl: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      // Optimistic UI update
      setEvents(prev => prev.filter(e => e.id !== id));
      try {
        await deleteEvent(id);

        // Delete from storage if it is a Supabase object
        if (isSupabaseConfigured && imageUrl.includes("/storage/v1/object/public/gallery/")) {
          const fileName = imageUrl.split("/gallery/").pop();
          if (fileName) {
            await supabase.storage.from("gallery").remove([fileName]);
          }
        }
      } catch (err) {
        console.error("Failed to delete event:", err);
        loadAdminData(); // Revert on failure
      }
    }
  };

  // Handle setting updates locally before submit
  const handleSettingChange = (field: keyof WeddingInfo, value: string | boolean) => {
    if (!weddingInfo) return;
    setWeddingInfo({
      ...weddingInfo,
      [field]: value
    });
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #2c241e 0%, #1f1b17 50%, #151210 100%)" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#d4af37] font-semibold tracking-widest uppercase sans">Checking Authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center px-4 py-8 overflow-y-auto"
        style={{ background: "linear-gradient(135deg, #2c241e 0%, #1f1b17 50%, #151210 100%)" }}>
        
        {/* Decorative gold background light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#d4af37]/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-sm bg-[#1f1b17]/95 rounded-3xl border border-[#d4af37]/35 shadow-2xl p-6 sm:p-8 text-center">
          {/* Brand Monogram */}
          <div className="serif italic text-3xl text-[#d4af37] font-light mb-1">
            {weddingInfo ? `${weddingInfo.groomName[0]} & ${weddingInfo.brideName[0]}` : "A & S"}
          </div>
          <div className="w-12 h-px bg-[#d4af37]/30 mx-auto mb-6" />

          <h1 className="font-serif text-2xl text-white font-medium mb-1">Admin Dashboard</h1>
          <p className="sans text-[10px] text-white/55 tracking-wider uppercase mb-8">Sign in to manage wedding data</p>
          
          <form onSubmit={handleLogin} className="space-y-5 text-left">
            <div>
              <label className="block sans text-[10px] uppercase tracking-widest text-[#d4af37] mb-2 font-bold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-[#151210]/60 border border-[#d4af37]/30 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-xs transition-colors"
              />
            </div>
            <div>
              <label className="block sans text-[10px] uppercase tracking-widest text-[#d4af37] mb-2 font-bold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#151210]/60 border border-[#d4af37]/30 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 text-xs transition-colors"
              />
              {authError && <p className="text-xs text-red-400 mt-3 text-center bg-red-950/45 border border-red-900/40 py-2 px-3 rounded-lg">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-[#d4af37] hover:bg-[#ffe699] hover:text-[#1f1b17] hover:scale-[1.01] active:scale-[0.99] text-[#1f1b17] font-semibold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6 cursor-pointer shadow-md"
            >
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="border-t border-[#d4af37]/15 mt-8 pt-6">
            <p className="sans text-[10px] text-white/50 leading-relaxed">
              {isSupabaseConfigured 
                ? "Authorized account credentials required." 
                : <>Fallback Mode Enabled<br/>Email: <span className="text-white/80 font-mono">stibinaugustine3047@gmail.com</span><br/>Password: <span className="text-white/80 font-mono">12345678</span></>
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Helper: navigate to tab and close mobile sidebar
  const goToTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // Filtered and sliced datasets for pagination
  const filteredRsvps = guests.filter(
    (g) => rsvpFilter === "all" || g.rsvpStatus === rsvpFilter
  );
  const totalRsvpPages = Math.ceil(filteredRsvps.length / PAGE_SIZE) || 1;
  const displayedRsvps = filteredRsvps.slice(
    (rsvpsPage - 1) * PAGE_SIZE,
    rsvpsPage * PAGE_SIZE
  );

  const filteredGuests = guests.filter(
    (g) => guestFilterCategory === "All" || g.category === guestFilterCategory
  );
  const totalGuestPages = Math.ceil(filteredGuests.length / PAGE_SIZE) || 1;
  const displayedGuests = filteredGuests.slice(
    (guestsPage - 1) * PAGE_SIZE,
    guestsPage * PAGE_SIZE
  );

  const displayedWishes = wishes.slice(0, visibleWishesCount);
  const hasMoreWishes = wishes.length > visibleWishesCount;

  const filteredGalleryImages = galleryImages.filter(
    (img) => galleryFilterCategory === "All" || img.category === galleryFilterCategory
  );
  const displayedGalleryImages = filteredGalleryImages.slice(0, visibleGalleryCount);
  const hasMoreGallery = filteredGalleryImages.length > visibleGalleryCount;

  const adminSidebarGroom = weddingInfo?.groomName || "Albin";
  const adminSidebarBride = weddingInfo?.brideName || "Stella";
  const adminSidebarInitial = adminSidebarGroom.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">

      {/* ── Mobile Top Header Bar ── */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#d4af37] text-slate-950 flex items-center justify-center font-bold text-xs">{adminSidebarInitial}</div>
          <span className="font-serif text-white font-bold text-sm">{adminSidebarGroom} &amp; {adminSidebarBride} Admin</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-[#d4af37]" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Mobile Overlay Backdrop ── */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar Navigation ── */}
        <aside className={`
          fixed top-0 left-0 h-full z-50 w-72 bg-slate-900 text-slate-300 p-6 flex flex-col justify-between shrink-0
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:w-64 md:translate-x-0 md:h-auto md:z-auto
        `}>
          <div>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#d4af37] text-slate-950 flex items-center justify-center font-bold">{adminSidebarInitial}</div>
                <div>
                  <h2 className="font-serif text-white font-bold text-base leading-tight">{adminSidebarGroom} &amp; {adminSidebarBride}</h2>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Wedding Admin</span>
                </div>
              </div>
              {/* Close button — mobile only */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {[
                { id: "analytics" as const, icon: <BarChart3 className="h-4 w-4 text-[#d4af37]" />, label: "Analytics" },
                { id: "guests" as const, icon: <Users className="h-4 w-4 text-[#d4af37]" />, label: "Guest List" },
                { id: "rsvp" as const, icon: <ClipboardList className="h-4 w-4 text-[#d4af37]" />, label: "RSVP Responses" },
                { id: "wishes" as const, icon: <MessageSquare className="h-4 w-4 text-[#d4af37]" />, label: "Wishes Moderation" },
                { id: "gallery" as const, icon: <Camera className="h-4 w-4 text-[#d4af37]" />, label: "Wedding Gallery" },
                { id: "stories" as const, icon: <BookOpen className="h-4 w-4 text-[#d4af37]" />, label: "Our Story" },
                { id: "events" as const, icon: <Calendar className="h-4 w-4 text-[#d4af37]" />, label: "Wedding Events" },
                { id: "faq" as const, icon: <MessageSquare className="h-4 w-4 text-[#d4af37]" />, label: "FAQ" },
                { id: "settings" as const, icon: <SettingsIcon className="h-4 w-4 text-[#d4af37]" />, label: "Site Settings" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                    activeTab === item.id ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-xs">
            <a href="/" target="_blank" className="hover:text-white flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              View Site
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Panel Content */}
        <main className="flex-1 flex flex-col h-screen md:max-h-screen overflow-hidden">
          {/* Tab Header */}
          <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4 bg-slate-50 border-b border-slate-200 shrink-0 z-20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif font-bold text-slate-900 capitalize">
                  {activeTab === "settings" ? "Site Settings" : 
                   activeTab === "rsvp" ? "RSVP Responses" : 
                   activeTab === "wishes" ? "Wishes Moderation" : 
                   activeTab === "gallery" ? "Wedding Gallery" : 
                   activeTab === "stories" ? "Our Story" : 
                   activeTab === "events" ? "Wedding Events" : 
                   activeTab === "faq" ? "FAQ Manager" :
                   activeTab}
                </h1>
                <p className="text-xs text-slate-500 mt-1">Manage all wedding content, RSVPs, and configurations.</p>
              </div>
            </div>
          </div>

          {/* Scrollable Tab Content Container */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto">

        {/* Tab 1: Analytics */}
        {activeTab === "analytics" && (
          !analytics ? (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-pulse">
                    <div className="h-3 bg-slate-200 rounded-full w-24 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded-lg w-16 mb-1"></div>
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-md animate-pulse">
                <div className="h-6 bg-slate-200 rounded-lg w-32 mb-6"></div>
                <div className="space-y-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                        <div className="h-4 bg-slate-200 rounded w-10"></div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-200 rounded-full w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Total Page Visits</span>
                <span className="text-3xl font-semibold font-serif text-slate-900">{analytics.totalVisitors}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Invitation Opens</span>
                <span className="text-3xl font-semibold font-serif text-slate-900">
                  {analytics.invitationOpens} <span className="text-xs text-slate-400">({guests.length ? Math.round((analytics.invitationOpens / guests.length) * 100) : 0}%)</span>
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">RSVPs Submitted</span>
                <span className="text-3xl font-semibold font-serif text-slate-900">
                  {analytics.rsvpAccepted + analytics.rsvpDeclined} <span className="text-xs text-slate-400">/ {guests.length}</span>
                </span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Guests Attending</span>
                <span className="text-3xl font-semibold font-serif text-emerald-600">
                  {analytics.totalGuestsAttending} <span className="text-xs text-slate-400">/ {analytics.totalGuestsAllowed} allowed</span>
                </span>
              </div>
            </div>

            {/* RSVP status charts / splits */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-md">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">RSVP Splits</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Accepted ({analytics.rsvpAccepted})</span>
                    <span>{guests.length ? Math.round((analytics.rsvpAccepted / guests.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${guests.length ? (analytics.rsvpAccepted / guests.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Declined ({analytics.rsvpDeclined})</span>
                    <span>{guests.length ? Math.round((analytics.rsvpDeclined / guests.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${guests.length ? (analytics.rsvpDeclined / guests.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Pending ({guests.length - (analytics.rsvpAccepted + analytics.rsvpDeclined)})</span>
                    <span>{guests.length ? Math.round(((guests.length - (analytics.rsvpAccepted + analytics.rsvpDeclined)) / guests.length) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${guests.length ? ((guests.length - (analytics.rsvpAccepted + analytics.rsvpDeclined)) / guests.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* Tab RSVP: RSVP Responses */}
        {activeTab === "rsvp" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Invited</span>
                <span className="text-3xl font-semibold font-serif text-slate-900">{guests.length}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500">Accepted</span>
                <span className="text-3xl font-semibold font-serif text-emerald-600">
                  {guests.filter(g => g.rsvpStatus === "accepted").length}
                </span>
                <span className="text-xs text-slate-400">
                  {guests.filter(g => g.rsvpStatus === "accepted").reduce((s, g) => s + (g.rsvpAttendees || 0), 0)} guests attending
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400">Declined</span>
                <span className="text-3xl font-semibold font-serif text-rose-500">
                  {guests.filter(g => g.rsvpStatus === "declined").length}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Awaiting</span>
                <span className="text-3xl font-semibold font-serif text-amber-600">
                  {guests.filter(g => g.rsvpStatus === "pending").length}
                </span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {(["all", "accepted", "declined", "pending"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRsvpFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all ${
                    rsvpFilter === f
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {f === "all" ? "All Responses" : f}
                </button>
              ))}
            </div>

            {/* RSVP Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4">Guest Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Attending</th>
                      <th className="px-6 py-4">Allowed</th>
                      <th className="px-6 py-4">Message / Meal</th>
                      <th className="px-6 py-4">Responded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRsvps
                      .map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50 transition-colors animate-fadeIn">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{g.name}</div>
                            <div className="text-[11px] text-slate-400 italic">{g.greeting}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              g.rsvpStatus === "accepted"
                                ? "bg-emerald-100 text-emerald-700"
                                : g.rsvpStatus === "declined"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {g.rsvpStatus === "accepted" && <Check className="h-3 w-3" />}
                              {g.rsvpStatus === "declined" && <X className="h-3 w-3" />}
                              {g.rsvpStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {g.rsvpStatus === "accepted" ? g.rsvpAttendees : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{g.allowedAttendees}</td>
                          <td className="px-6 py-4 max-w-xs whitespace-nowrap">
                            {g.rsvpMessage ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500 italic max-w-[120px] truncate block">"{g.rsvpMessage}"</span>
                                <button
                                  onClick={() => setViewingRsvpMessage({ name: g.name, greeting: g.greeting, message: g.rsvpMessage })}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-all cursor-pointer border border-slate-200"
                                  title="View Message"
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                            {g.updatedAt
                              ? new Date(g.updatedAt).toLocaleDateString("en-GB", {
                                  day: "2-digit", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    {filteredRsvps.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                          No {rsvpFilter === "all" ? "" : rsvpFilter} responses yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {filteredRsvps.length > 0 ? (rsvpsPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(rsvpsPage * PAGE_SIZE, filteredRsvps.length)} of {filteredRsvps.length} responses
                </span>
                
                {totalRsvpPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      onClick={() => setRsvpsPage((prev) => Math.max(prev - 1, 1))}
                      disabled={rsvpsPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers(rsvpsPage, totalRsvpPages).map((p, idx) => {
                      if (p === "ellipsis-start" || p === "ellipsis-end") {
                        return (
                          <span key={`ell-${idx}`} className="px-2 text-xs text-slate-400 font-bold select-none">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setRsvpsPage(p as number)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            rsvpsPage === p
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => setRsvpsPage((prev) => Math.min(prev + 1, totalRsvpPages))}
                      disabled={rsvpsPage === totalRsvpPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                      title="Next Page"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guest List */}
        {activeTab === "guests" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Add/Edit Guest Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4">
                {editingGuest ? "Edit Invitation" : "Add Invitation"}
              </h3>
              <form onSubmit={handleCreateGuest} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Guest Name</label>
                  <input
                    type="text"
                    required
                    value={newGuestName || ""}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    placeholder="e.g. Uncle Jacob"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Greeting Label</label>
                  <input
                    type="text"
                    value={newGuestGreeting || ""}
                    onChange={(e) => setNewGuestGreeting(e.target.value)}
                    placeholder="e.g. Uncle Jacob & Aunt Susan"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Allowed Attendees</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newGuestAttendees}
                    onChange={(e) => setNewGuestAttendees(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Category</label>
                  {isAddingCustomCategory ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="text"
                        required
                        value={customCategoryInput || ""}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="New Category..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomCategory}
                        className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Add Category"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCustomCategory(false);
                          setCustomCategoryInput("");
                          setNewGuestCategory("General");
                        }}
                        className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={newGuestCategory || "General"}
                      onChange={(e) => {
                        if (e.target.value === "__new__") {
                          setIsAddingCustomCategory(true);
                        } else {
                          setNewGuestCategory(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      {guestCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__new__">+ Add Custom...</option>
                    </select>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    type="submit"
                    className="flex-1 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer h-[38px]"
                  >
                    {editingGuest ? (
                      <>
                        <Check className="h-4 w-4" />
                        Save
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add Guest
                      </>
                    )}
                  </button>
                  {editingGuest && (
                    <button
                      type="button"
                      onClick={handleCancelEditGuest}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer h-[38px]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => setGuestFilterCategory("All")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  guestFilterCategory === "All"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                All Categories
              </button>
              {guestCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGuestFilterCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                    guestFilterCategory === cat
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Guests List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4">Guest Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Allowed</th>
                      <th className="px-6 py-4">Views</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">RSVP Attending</th>
                      <th className="px-6 py-4">RSVP Message</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedGuests
                      .map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50 transition-colors animate-fadeIn">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div>{g.name}</div>
                            <span className="text-[11px] text-slate-400 italic font-normal">{g.greeting}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {g.category || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-4">{g.allowedAttendees}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${g.openedCount > 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"}`}>
                              {g.openedCount} opens
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                              g.rsvpStatus === "accepted" ? "bg-emerald-100 text-emerald-800" :
                              g.rsvpStatus === "declined" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {g.rsvpStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {g.rsvpStatus === "accepted" ? `${g.rsvpAttendees} / ${g.allowedAttendees}` : "—"}
                          </td>
                          <td className="px-6 py-4 max-w-xs whitespace-nowrap">
                            {g.rsvpMessage ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500 italic max-w-[120px] truncate block">"{g.rsvpMessage}"</span>
                                <button
                                  onClick={() => setViewingRsvpMessage({ name: g.name, greeting: g.greeting, message: g.rsvpMessage })}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-all cursor-pointer border border-slate-200"
                                  title="View Message"
                                >
                                  View
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2.5 shrink-0 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSharingGuest(g);
                                setSharePhone("");
                                setSelectedTemplate("floral");
                                if (galleryImages.length > 0) {
                                  setSelectedGalleryImage(galleryImages[0].src);
                                }
                              }}
                              className="text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1 text-xs cursor-pointer font-semibold"
                              title="Share on WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.498 1.451 5.42 1.453 5.518 0 10.007-4.488 10.01-10.008.002-2.673-1.038-5.186-2.93-7.078-1.892-1.891-4.407-2.934-7.086-2.935-5.525 0-10.015 4.487-10.018 10.007-.001 1.93.502 3.818 1.456 5.42l-.95 3.47 3.543-.93zm11.367-7.834c-.312-.156-1.848-.912-2.128-1.012-.282-.102-.487-.156-.692.154-.204.312-.792.992-.972 1.196-.18.204-.36.23-.672.074-.312-.156-1.318-.486-2.51-1.549-.928-.827-1.554-1.849-1.737-2.16-.18-.312-.02-.482.137-.636.141-.138.312-.36.468-.541.156-.18.208-.3.312-.51.104-.209.052-.394-.026-.55-.078-.157-.692-1.668-.948-2.285-.249-.597-.502-.516-.692-.526-.178-.008-.384-.01-.591-.01-.205 0-.54.077-.822.384-.282.308-1.077 1.053-1.077 2.566s1.102 2.978 1.257 3.184c.154.204 2.168 3.31 5.253 4.641.733.317 1.307.507 1.753.649.737.234 1.407.2 1.938.122.59-.087 1.848-.756 2.11-.1447.261-.708.261-1.314.183-1.423-.079-.11-.283-.167-.595-.323z" />
                              </svg>
                              Invite
                            </button>
                            <button
                              onClick={() => handleCopyLink(g.id)}
                              className="text-slate-500 hover:text-slate-950 inline-flex items-center gap-1 text-xs cursor-pointer font-semibold"
                              title="Copy Invitation Link"
                            >
                              {copiedId === g.id ? (
                                <span className="text-emerald-600 flex items-center gap-0.5 font-semibold">
                                  <Check className="h-3.5 w-3.5" /> Copied
                                </span>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" /> Link
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleEditGuest(g)}
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-xs cursor-pointer font-semibold"
                              title="Edit Guest Details"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(g.id)}
                              className="text-rose-500 hover:text-rose-700 inline-flex cursor-pointer"
                              title="Delete Guest"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {filteredGuests.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic animate-fadeIn">
                          No guests found in this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {filteredGuests.length > 0 ? (guestsPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(guestsPage * PAGE_SIZE, filteredGuests.length)} of {filteredGuests.length} guests
                </span>
                
                {totalGuestPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      onClick={() => setGuestsPage((prev) => Math.max(prev - 1, 1))}
                      disabled={guestsPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers(guestsPage, totalGuestPages).map((p, idx) => {
                      if (p === "ellipsis-start" || p === "ellipsis-end") {
                        return (
                          <span key={`ell-${idx}`} className="px-2 text-xs text-slate-400 font-bold select-none">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setGuestsPage(p as number)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            guestsPage === p
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => setGuestsPage((prev) => Math.min(prev + 1, totalGuestPages))}
                      disabled={guestsPage === totalGuestPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 disabled:opacity-50 disabled:hover:border-slate-200 transition-all cursor-pointer shadow-sm disabled:cursor-default"
                      title="Next Page"
                    >
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Wishes Moderation */}
        {activeTab === "wishes" && (
          <div className="space-y-6 animate-fadeIn">
            {wishes.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleDeleteAllWishes}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Wishes
                </button>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {wishes.length === 0 ? (
                <div className="p-12 text-center italic text-slate-400">No wishes found.</div>
              ) : (
                <>
                  {displayedWishes.map((w) => (
                    <div key={w.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 animate-fadeIn">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-serif font-bold text-slate-900">{w.guestName}</span>
                          <span className="text-xs text-slate-400">• {new Date(w.timestamp).toLocaleDateString()}</span>
                          {!w.approved && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 italic">"{w.message}"</p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {w.approved ? (
                          <button
                            onClick={() => handleToggleWish(w.id, false)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                          >
                            Revoke Approval
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleWish(w.id, true)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteWish(w.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 gap-4">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing {Math.min(displayedWishes.length, wishes.length)} of {wishes.length} wishes
                    </span>
                    {hasMoreWishes && (
                      <button
                        onClick={handleLoadMoreWishes}
                        disabled={loadingMoreWishes}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer h-[36px] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {loadingMoreWishes ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Load More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab: Wedding Gallery */}
        {activeTab === "gallery" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Manage Categories */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="font-serif font-bold text-lg text-slate-900">Manage Categories ({galleryCategories.length}/6)</h3>
                {galleryCategories.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomGalleryCategory(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Category
                  </button>
                )}
              </div>

              {/* Add new category inline */}
              {isAddingCustomGalleryCategory && (
                <div className="flex gap-2 items-center mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-fadeIn">
                  <input
                    type="text"
                    value={customGalleryCategoryInput}
                    onChange={(e) => setCustomGalleryCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveCustomGalleryCategory(); } }}
                    placeholder="New category name..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomGalleryCategory}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                    title="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCustomGalleryCategory(false); setCustomGalleryCategoryInput(""); }}
                    className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {galleryCategories.length === 0 ? (
                <p className="text-center py-6 text-slate-400 italic text-sm">No categories yet. Add your first one!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryCategories.map((cat, idx) => (
                    <div
                      key={`${cat}-${idx}`}
                      className="flex items-center justify-between gap-2 p-3 border border-slate-200 rounded-xl hover:border-slate-300 transition-all bg-slate-50/50"
                    >
                      {editingGalleryCatIndex === idx ? (
                        <div className="flex gap-1.5 items-center flex-1">
                          <input
                            type="text"
                            value={editingGalleryCatValue}
                            onChange={(e) => setEditingGalleryCatValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRenameGalleryCategory(idx); } if (e.key === "Escape") setEditingGalleryCatIndex(null); }}
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-500 min-w-0"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameGalleryCategory(idx)}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGalleryCatIndex(null)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0" />
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " ")}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              ({galleryImages.filter((img) => img.category === cat).length})
                            </span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => { setEditingGalleryCatIndex(idx); setEditingGalleryCatValue(cat); }}
                              className="p-1.5 text-slate-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all cursor-pointer"
                              title="Rename"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryCategory(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload form */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4 border-b pb-2">Add New Photo</h3>
              
              <form onSubmit={handleUploadImage} className="space-y-6">
                {/* Upload Type toggle */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="uploadType" 
                      checked={uploadType === "file"}
                      onChange={() => setUploadType("file")}
                      className="accent-slate-900" 
                    />
                    Upload Image File
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="uploadType" 
                      checked={uploadType === "url"}
                      onChange={() => setUploadType("url")}
                      className="accent-slate-900" 
                    />
                    Image URL (External)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source Input */}
                  {uploadType === "file" ? (
                    <div key="gallery-file-input-wrapper">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Select Image File(s)</label>
                      <input
                        key="gallery-file-input-node"
                        id="gallery-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {!isSupabaseConfigured && "Supabase is not configured. Uploaded files will be stored locally as Base64 in this browser."}
                        {isSupabaseConfigured && "Uploaded files will be uploaded directly to Supabase storage bucket 'gallery'."}
                      </span>
                    </div>
                  ) : (
                    <div key="gallery-url-input-wrapper">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Image URL</label>
                      <input
                        key="gallery-url-input-node"
                        type="text"
                        value={newImageUrl || ""}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Category</label>
                    {isAddingCustomGalleryCategory ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          required
                          value={customGalleryCategoryInput || ""}
                          onChange={(e) => setCustomGalleryCategoryInput(e.target.value)}
                          placeholder="New Category..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCustomGalleryCategory}
                          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Add Category"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCustomGalleryCategory(false);
                            setCustomGalleryCategoryInput("");
                            setNewImageCategory("pre-wedding");
                          }}
                          className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={newImageCategory || "pre-wedding"}
                        onChange={(e) => {
                          if (e.target.value === "__new__") {
                            setIsAddingCustomGalleryCategory(true);
                          } else {
                            setNewImageCategory(e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        {galleryCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                        ))}
                        {galleryCategories.length < 6 && (
                          <option value="__new__">+ Add Custom...</option>
                        )}
                      </select>
                    )}
                  </div>

                  {/* Alt Text Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">
                      {uploadType === "file" && newImageFiles.length > 0 ? "Global Description / Alt Text (applied to photos without custom description)" : "Description / Alt Text"}
                    </label>
                    <input
                      type="text"
                      value={newImageAlt || ""}
                      onChange={(e) => setNewImageAlt(e.target.value)}
                      placeholder="e.g. Groom looking at bride during church ceremony"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Selected files previews grid */}
                  {uploadType === "file" && newImageFiles.length > 0 && (
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-2">
                        Selected Photos Preview ({newImageFiles.length} of 10)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {newImageFiles.map((item) => (
                          <div key={item.id} className="relative group bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-col justify-between animate-fadeIn">
                            {/* Image Thumbnail with remove button */}
                            <div className="aspect-video relative overflow-hidden bg-slate-200 rounded-lg">
                              <img 
                                src={item.preview} 
                                alt="preview" 
                                className={`w-full h-full object-cover transition-opacity ${item.uploadStatus === "uploading" ? "opacity-50" : ""}`}
                              />
                              {(!item.uploadStatus || item.uploadStatus === "pending" || item.uploadStatus === "error") && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedFile(item.id)}
                                  className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow transition-colors cursor-pointer border-none"
                                  title="Remove photo"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                              
                              {/* Status Indicators */}
                              {item.uploadStatus === "uploading" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                              {item.uploadStatus === "success" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/80">
                                  <Check className="h-8 w-8 text-white" />
                                </div>
                              )}
                              {item.uploadStatus === "error" && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-500/80">
                                  <X className="h-8 w-8 text-white mb-1" />
                                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Failed</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Individual description input */}
                            <input
                              type="text"
                              value={item.alt}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewImageFiles(prev => prev.map(p => p.id === item.id ? { ...p, alt: val } : p));
                              }}
                              disabled={item.uploadStatus === "uploading" || item.uploadStatus === "success"}
                              placeholder="Add description..."
                              className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded mt-2 focus:outline-none focus:border-slate-400 disabled:opacity-50 disabled:bg-slate-100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    {uploadError && <p className="text-xs text-rose-600 font-medium">{uploadError}</p>}
                    {uploadSuccess && <p className="text-xs text-emerald-600 font-medium">Photos added to gallery successfully!</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {uploadType === "file" && newImageFiles.length > 0 
                          ? `Add Photos (${newImageFiles.length})` 
                          : "Add Photo"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List of current images */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b pb-2">
                <h3 className="font-serif font-bold text-lg text-slate-900">Gallery Photos ({galleryImages.length})</h3>
                {galleryImages.length > 0 && (
                  <div className="flex gap-2 items-center">
                    {isSelectionMode ? (
                      <>
                        <button
                          onClick={() => {
                            if (selectedImages.length === displayedGalleryImages.length) {
                              setSelectedImages([]);
                            } else {
                              setSelectedImages(displayedGalleryImages.map(img => img.id));
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                        >
                          {selectedImages.length === displayedGalleryImages.length ? "Deselect All" : "Select All"}
                        </button>
                        <button
                          onClick={() => { setIsSelectionMode(false); setSelectedImages([]); }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteSelectedImages}
                          disabled={selectedImages.length === 0 || deletingImageId !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete ({selectedImages.length})
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsSelectionMode(true)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                        >
                          Select Photos
                        </button>
                        <button
                          onClick={handleDeleteAllGalleryImages}
                          disabled={deletingImageId !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete All
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {galleryImages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">No photos in the gallery. Add some above!</div>
              ) : (
                <>
                  {/* Category Filter Tabs for Gallery */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setGalleryFilterCategory("All")}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                        galleryFilterCategory === "All"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      All Categories
                    </button>
                    {galleryCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setGalleryFilterCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                          galleryFilterCategory === cat
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>

                  {filteredGalleryImages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 italic">No photos found in this category.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {displayedGalleryImages.map((img) => (
                        <div 
                          key={img.id} 
                          className={`group relative bg-slate-50 border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between transition-all ${isSelectionMode ? 'cursor-pointer hover:border-slate-400' : 'border-slate-200'} ${selectedImages.includes(img.id) ? 'border-slate-800 ring-2 ring-slate-800' : ''}`}
                          onClick={() => {
                            if (isSelectionMode) {
                              setSelectedImages(prev => prev.includes(img.id) ? prev.filter(i => i !== img.id) : [...prev, img.id]);
                            }
                          }}
                        >
                          {/* Image Thumbnail */}
                          <div className="aspect-video relative overflow-hidden bg-slate-200">
                            <img 
                              src={img.src} 
                              alt={img.alt} 
                              className={`w-full h-full object-cover transition-transform duration-300 ${isSelectionMode && selectedImages.includes(img.id) ? "scale-105 opacity-70" : "group-hover:scale-105"}`}
                            />
                            
                            {isSelectionMode && (
                              <div className="absolute top-2 right-2 z-10">
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedImages.includes(img.id) ? "bg-slate-900 border-slate-900" : "bg-white/50 border-white"}`}>
                                  {selectedImages.includes(img.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                            )}

                            {!isSelectionMode && (
                              <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                {img.category}
                              </span>
                            )}
                          </div>

                          {/* Info and Actions */}
                          <div className="p-3.5 flex flex-col justify-between flex-1">
                            <p className="text-xs text-slate-700 italic font-medium line-clamp-2 mb-3">
                              "{img.alt || 'No description'}"
                            </p>
                            
                            <div className="flex items-center justify-between border-t pt-2.5 mt-auto">
                              <span className="text-[9px] text-slate-400 uppercase font-mono">
                                {img.id.startsWith("gal-") && img.id.length < 15 ? "Seeded" : "Uploaded"}
                              </span>
                              
                              {!isSelectionMode && (
                                <button
                                  onClick={() => handleDeleteImage(img.id, img.src)}
                                  disabled={deletingImageId === img.id}
                                  className="text-rose-500 hover:text-rose-700 disabled:text-rose-300 p-1 hover:bg-rose-50 disabled:bg-transparent rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                                  title="Delete Image"
                                >
                                  {deletingImageId === img.id ? (
                                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination/Load More controls for Gallery */}
                  {hasMoreGallery && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={handleLoadMoreGallery}
                        disabled={loadingMoreGallery}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer h-[36px] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {loadingMoreGallery ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Load More
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab: Our Story Timeline */}
        {activeTab === "stories" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Add/Edit Story Milestone Form */}
            <div ref={storyFormRef} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4 border-b pb-2">
                {editingMilestoneId ? "Edit Story Milestone" : "Add New Story Milestone"}
              </h3>
              
              <form onSubmit={handleSaveStory} className="space-y-6">
                {/* Upload Type toggle */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="storyUploadType" 
                      checked={storyUploadType === "file"}
                      onChange={() => setStoryUploadType("file")}
                      className="accent-slate-900" 
                    />
                    Upload Image File
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="storyUploadType" 
                      checked={storyUploadType === "url"}
                      onChange={() => setStoryUploadType("url")}
                      className="accent-slate-900" 
                    />
                    Image URL (External)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Timeframe Year Input */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Timeframe / Year</label>
                    <input
                      type="text"
                      required
                      value={newStoryYear || ""}
                      onChange={(e) => setNewStoryYear(e.target.value)}
                      placeholder="e.g. June 2022"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Order Index */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Order Index (Sort position)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newStoryOrderIndex}
                      onChange={(e) => setNewStoryOrderIndex(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Image Source Input */}
                  {storyUploadType === "file" ? (
                    <div key="story-file-input-wrapper">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Upload Image</label>
                      <input
                        key="story-file-input-node"
                        id="story-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewStoryImageFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                    </div>
                  ) : (
                    <div key="story-url-input-wrapper">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Image URL</label>
                      <input
                        key="story-url-input-node"
                        type="text"
                        value={newStoryImageUrl || ""}
                        onChange={(e) => setNewStoryImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {/* English Title */}
                  <div className="md:col-span-1">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">English Title</label>
                    <input
                      type="text"
                      required
                      value={newStoryTitleEn || ""}
                      onChange={(e) => setNewStoryTitleEn(e.target.value)}
                      placeholder="e.g. First Meeting"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Malayalam Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Malayalam Title</label>
                    <input
                      type="text"
                      required
                      value={newStoryTitleMl || ""}
                      onChange={(e) => setNewStoryTitleMl(e.target.value)}
                      placeholder="e.g. ആദ്യ കൂടിക്കാഴ്ച"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* English Story text */}
                  <div className="md:col-span-3">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">English Story Content</label>
                    <textarea
                      rows={3}
                      value={newStoryTextEn || ""}
                      onChange={(e) => setNewStoryTextEn(e.target.value)}
                      placeholder="Describe what happened in English..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                    />
                  </div>

                  {/* Malayalam Story text */}
                  <div className="md:col-span-3">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Malayalam Story Content</label>
                    <textarea
                      rows={3}
                      value={newStoryTextMl || ""}
                      onChange={(e) => setNewStoryTextMl(e.target.value)}
                      placeholder="Describe what happened in Malayalam..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    {storyError && <p className="text-xs text-rose-600 font-medium">{storyError}</p>}
                    {storySuccess && <p className="text-xs text-emerald-600 font-medium">Milestone saved successfully!</p>}
                  </div>

                  <div className="flex gap-2">
                    {editingMilestoneId && (
                      <button
                        type="button"
                        onClick={handleCancelEditStory}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={storyUploading}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      {storyUploading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          {editingMilestoneId ? "Save Milestone" : "Add Milestone"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Timeline Milestones list */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-6 border-b pb-2">Timeline Milestones ({storyMilestones.length})</h3>

              {storyMilestones.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">No milestones in the timeline yet. Add some above!</div>
              ) : (
                <div className="space-y-4">
                  {storyMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all gap-4">
                      {/* Image Thumbnail & details */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                          <img src={milestone.imageUrl} alt={milestone.titleEn} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 font-serif text-sm">{milestone.titleEn}</span>
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">({milestone.year})</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-semibold">Position: {milestone.orderIndex}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{milestone.textEn}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                        <button
                          onClick={() => handleEditStory(milestone)}
                          className="px-3 py-1.5 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStory(milestone.id, milestone.imageUrl)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          title="Delete Milestone"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Wedding Events */}
        {activeTab === "events" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Add/Edit Event Form */}
            <div ref={eventFormRef} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-4 border-b pb-2">
                {editingEventId ? "Edit Scheduled Event" : "Schedule New Event"}
              </h3>
              
              <form onSubmit={handleSaveEvent} className="space-y-6">
                {/* Upload Type toggle */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="eventUploadType" 
                      checked={eventUploadType === "file"}
                      onChange={() => setEventUploadType("file")}
                      className="accent-slate-900" 
                    />
                    Upload Image File
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600 cursor-pointer">
                    <input 
                      type="radio" 
                      name="eventUploadType" 
                      checked={eventUploadType === "url"}
                      onChange={() => setEventUploadType("url")}
                      className="accent-slate-900" 
                    />
                    Image URL (External)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Event Title */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      value={newEventTitle || ""}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Holy Matrimony"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Event Date */}
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Event Date</label>
                    <input
                      type="date"
                      required
                      value={newEventDate || ""}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                  </div>

                  {/* Event Time */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Event Time</label>
                      <input
                        type="text"
                        required
                        value={eventTimeValue || ""}
                        onChange={(e) => setEventTimeValue(e.target.value)}
                        placeholder="e.g. 10:30"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">AM / PM</label>
                      <select
                        value={eventTimeAmpm}
                        onChange={(e) => setEventTimeAmpm(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white animate-fadeIn"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Event Venue */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Venue / Location</label>
                    <input
                      type="text"
                      required
                      value={newEventVenue || ""}
                      onChange={(e) => setNewEventVenue(e.target.value)}
                      placeholder="e.g. St. Mary's Cathedral, Kochi"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Image Source Input */}
                  {eventUploadType === "file" ? (
                    <div key="event-file-input-wrapper">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Upload Event Thumbnail</label>
                      <input
                        key="event-file-input-node"
                        id="event-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewEventImageFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                    </div>
                  ) : (
                    <div key="event-url-input-wrapper">
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Image URL</label>
                      <input
                        key="event-url-input-node"
                        type="text"
                        value={newEventImageUrl || ""}
                        onChange={(e) => setNewEventImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {/* Google Calendar Link (Optional) */}
                  <div className="md:col-span-3">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Custom Google Calendar Link (Optional)</label>
                    <input
                      type="text"
                      value={newEventGoogleCalendarUrl || ""}
                      onChange={(e) => setNewEventGoogleCalendarUrl(e.target.value)}
                      placeholder="Leave blank to automatically auto-generate from event details"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-3">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Event Description</label>
                    <textarea
                      rows={3}
                      required
                      value={newEventDescription || ""}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="Describe what will happen at the event..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    {eventError && <p className="text-xs text-rose-600 font-medium">{eventError}</p>}
                    {eventSuccess && <p className="text-xs text-emerald-600 font-medium">Event saved successfully!</p>}
                  </div>

                  <div className="flex gap-2">
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={handleCancelEditEvent}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={eventUploading}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      {eventUploading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          {editingEventId ? "Save Event" : "Schedule Event"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* List of current events */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-6 border-b pb-2">Scheduled Events ({events.length})</h3>

              {events.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">No events scheduled yet. Add one above!</div>
              ) : (
                <div className="space-y-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all gap-4">
                      {/* Thumbnail & details */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                          <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900 font-serif text-sm">{ev.title}</span>
                            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[9px] font-semibold border border-amber-200">
                              {ev.date} @ {ev.time}
                            </span>
                            <span className="text-slate-400 text-xs truncate max-w-[200px]">{ev.venue}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ev.description}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                        <button
                          onClick={() => handleEditEvent(ev)}
                          className="px-3 py-1.5 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.imageUrl)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: FAQ Manager */}
        {activeTab === "faq" && (
          <div className="space-y-8 animate-fadeIn">
            {/* FAQ Add/Edit Form */}
            <div ref={faqFormRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-4">
                {editingFaqId ? "✏️ Edit FAQ" : "➕ Add New FAQ"}
              </h3>

              {faqSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs font-semibold">
                  <Check className="h-4 w-4" /> FAQ saved successfully!
                </div>
              )}
              {faqError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs font-semibold">
                  <X className="h-4 w-4" /> {faqError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Question</label>
                  <input
                    type="text"
                    placeholder="e.g. What is the dress code?"
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Answer</label>
                  <textarea
                    rows={4}
                    placeholder="Write a clear and helpful answer..."
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
                        setFaqError("Both question and answer are required.");
                        return;
                      }
                      setFaqError("");
                      const faq: FaqItem = {
                        id: editingFaqId || `faq-${Date.now()}`,
                        question: newFaqQuestion.trim(),
                        answer: newFaqAnswer.trim(),
                        orderIndex: editingFaqId
                          ? (faqs.find(f => f.id === editingFaqId)?.orderIndex ?? faqs.length + 1)
                          : faqs.length + 1,
                      };
                      await saveFaq(faq);
                      const updated = await getFaqs();
                      setFaqs(updated);
                      setNewFaqQuestion("");
                      setNewFaqAnswer("");
                      setEditingFaqId(null);
                      setFaqSuccess(true);
                      setTimeout(() => setFaqSuccess(false), 3000);
                    }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
                  >
                    {editingFaqId ? "Update FAQ" : "Add FAQ"}
                  </button>
                  {editingFaqId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaqId(null);
                        setNewFaqQuestion("");
                        setNewFaqAnswer("");
                        setFaqError("");
                      }}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* FAQ List */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-6">
                Current FAQs ({faqs.length})
              </h3>

              {faqs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No FAQs added yet. Use the form above to add your first FAQ.
                </div>
              ) : (
                <div className="space-y-4">
                  {faqs.map((faq, idx) => (
                    <div
                      key={faq.id}
                      className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 hover:border-[#d4af37]/40 transition-all"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 mb-1">{faq.question}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaqId(faq.id);
                            setNewFaqQuestion(faq.question);
                            setNewFaqAnswer(faq.answer);
                            setFaqError("");
                            setTimeout(() => {
                              faqFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 50);
                          }}
                          className="p-2 text-slate-400 hover:text-[#d4af37] hover:bg-[#d4af37]/10 rounded-lg transition-all cursor-pointer"
                          title="Edit FAQ"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Delete this FAQ?")) return;
                            await deleteFaq(faq.id);
                            const updated = await getFaqs();
                            setFaqs(updated);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Delete FAQ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Site Settings */}
        {activeTab === "settings" && weddingInfo && (
          <div className="space-y-8 animate-fadeIn">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-4">Wedding Metadata</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Name</label>
                    <input
                      type="text"
                      required
                      value={weddingInfo.groomName || ""}
                      onChange={(e) => handleSettingChange("groomName", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Name</label>
                    <input
                      type="text"
                      required
                      value={weddingInfo.brideName || ""}
                      onChange={(e) => handleSettingChange("brideName", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Tagline</label>
                    <input
                      type="text"
                      required
                      value={weddingInfo.tagline || ""}
                      onChange={(e) => handleSettingChange("tagline", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Wedding Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={weddingInfo.weddingDate || ""}
                      onChange={(e) => handleSettingChange("weddingDate", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Background Music URL</label>
                    <input
                      type="text"
                      value={weddingInfo.bgMusicUrl || ""}
                      onChange={(e) => handleSettingChange("bgMusicUrl", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Video Showcase URL</label>
                    <input
                      type="text"
                      value={weddingInfo.videoUrl || ""}
                      onChange={(e) => handleSettingChange("videoUrl", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-sm font-bold text-slate-800">Wishes Moderation</label>
                      <p className="text-xs text-slate-500">Require admin approval before wishes are publicly displayed.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weddingInfo.isWishesModerationEnabled || false}
                        onChange={(e) => handleSettingChange("isWishesModerationEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-4">Venue & Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Location Venue Name</label>
                    <input
                      type="text"
                      value={weddingInfo.locationName || ""}
                      onChange={(e) => handleSettingChange("locationName", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Location Address</label>
                    <input
                      type="text"
                      value={weddingInfo.locationAddress || ""}
                      onChange={(e) => handleSettingChange("locationAddress", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Parking Instructions</label>
                    <textarea
                      rows={2}
                      value={weddingInfo.parkingInfo || ""}
                      onChange={(e) => handleSettingChange("parkingInfo", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Google Maps Embed URL</label>
                    <input
                      type="text"
                      value={weddingInfo.googleMapEmbedUrl || ""}
                      onChange={(e) => handleSettingChange("googleMapEmbedUrl", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Paste Google Maps embed code, embed URL, or any Google Maps link"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Contact Phone</label>
                    <input
                      type="text"
                      value={weddingInfo.contactGroom || ""}
                      onChange={(e) => handleSettingChange("contactGroom", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Contact Phone</label>
                    <input
                      type="text"
                      value={weddingInfo.contactBride || ""}
                      onChange={(e) => handleSettingChange("contactBride", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <h3 className="font-serif font-bold text-lg text-slate-900 border-b pb-2 mb-4">Family Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Parents</label>
                    <input
                      type="text"
                      value={weddingInfo.groomParents || ""}
                      onChange={(e) => handleSettingChange("groomParents", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Parents</label>
                    <input
                      type="text"
                      value={weddingInfo.brideParents || ""}
                      onChange={(e) => handleSettingChange("brideParents", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Groom Siblings</label>
                    <input
                      type="text"
                      value={weddingInfo.groomSiblings || ""}
                      onChange={(e) => handleSettingChange("groomSiblings", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Bride Siblings</label>
                    <input
                      type="text"
                      value={weddingInfo.brideSiblings || ""}
                      onChange={(e) => handleSettingChange("brideSiblings", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Form submit footer */}
              <div className="flex items-center justify-between">
                {saveSuccess ? (
                  <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <Check className="h-4 w-4" /> Settings Saved Successfully!
                  </span>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  className="px-8 py-3 bg-[#d4af37] hover:bg-[#bfa032] text-black font-semibold text-xs uppercase tracking-widest rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}
          </div> {/* End of Scrollable Tab Content Container */}
      </main>
    </div>

      {/* WhatsApp Invite & Canvas Card Modal */}
      {sharingGuest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 md:p-8 relative grid grid-cols-1 md:grid-cols-2 gap-8 text-left animate-fadeIn">
            
            {/* Close Button */}
            <button
              onClick={() => setSharingGuest(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              title="Close Modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Canvas Preview */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-1">Personalized Card Preview</h3>
              <p className="text-xs text-slate-500">Live generated card with the guest's personalized greeting label.</p>
              
              {/* Canvas Card */}
              <div className="flex justify-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={450}
                  className="w-full max-w-sm aspect-[4/3] rounded-xl border border-slate-200 shadow-sm bg-white"
                />
              </div>

              {/* Design Template Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-bold">Select Theme Design</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setSelectedTemplate("floral")}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedTemplate === "floral" ? "border-amber-500 bg-amber-50/50 text-amber-700" : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    Classic Floral
                  </button>
                  <button
                    onClick={() => setSelectedTemplate("gold")}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedTemplate === "gold" ? "border-amber-500 bg-slate-900 text-white" : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    Royal Gold
                  </button>
                  <button
                    onClick={() => setSelectedTemplate("modern")}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedTemplate === "modern" ? "border-slate-900 bg-slate-50 text-slate-900" : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    Modern Slate
                  </button>
                  <button
                    onClick={() => setSelectedTemplate("gallery")}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedTemplate === "gallery" ? "border-amber-500 bg-amber-50/50 text-amber-700" : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    Wedding Photo
                  </button>
                </div>
              </div>

              {/* Gallery Image Picker if Wedding Photo Selected */}
              {selectedTemplate === "gallery" && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-bold">Choose Wedding Gallery Photo</label>
                  {galleryImages.length === 0 ? (
                    <p className="text-xs text-rose-500 font-medium italic">No gallery photos available. Upload some in the Wedding Gallery tab!</p>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin max-w-sm">
                      {galleryImages.map((img) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedGalleryImage(img.src)}
                          className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                            selectedGalleryImage === img.src ? "border-amber-500 scale-95" : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Download & Copy Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm font-bold"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={handleCopyCardImage}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm font-bold"
                >
                  Copy Card Image
                </button>
              </div>
            </div>

            {/* Right Column: Message & Share */}
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Invite via WhatsApp</h3>
                  <p className="text-xs text-slate-500 mt-1">Send a pre-crafted message with the invitation link directly to the guest.</p>
                  
                  {/* Premium Tip Alert */}
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                    <strong>Tip:</strong> WhatsApp doesn't support attaching images automatically through a link. We recommend clicking <strong>Copy Card Image</strong> on the left and pasting (Ctrl+V) it directly into your WhatsApp message.
                  </div>
                </div>

                {/* Direct Phone Number Input */}
                <div>
                  <label className="block text-xs uppercase font-bold text-[#d4af37] mb-1 font-bold">WhatsApp Number (Optional)</label>
                  <input
                    type="text"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value.replace(/[^\d+]/g, ""))}
                    placeholder="e.g. +919876543210 (with country code)"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Include country code (e.g. +91 or +1) without spaces or hyphens. If left empty, WhatsApp contact selection opens.</span>
                </div>

                {/* Invitation Text Box */}
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Pre-crafted Text Message</label>
                  <textarea
                    rows={8}
                    readOnly
                    value={`Dearest ${sharingGuest.greeting},\n\nWe are delighted to invite you to celebrate our wedding. Please find our digital invitation card and RSVP details at the link below:\n\n${
                      typeof window !== "undefined" ? window.location.origin : ""
                    }/invite/${sharingGuest.id}\n\nWith love,\nAlbin & Stella`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 resize-none font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => {
                    const text = `Dearest ${sharingGuest.greeting},\n\nWe are delighted to invite you to celebrate our wedding. Please find our digital invitation card and RSVP details at the link below:\n\n${
                      typeof window !== "undefined" ? window.location.origin : ""
                    }/invite/${sharingGuest.id}\n\nWith love,\nAlbin & Stella`;
                    navigator.clipboard.writeText(text);
                    alert("Invitation text copied to clipboard!");
                  }}
                  className="py-3 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer text-center font-bold"
                >
                  Copy Message
                </button>
                <a
                  href={`https://api.whatsapp.com/send?${
                    sharePhone.trim() ? `phone=${encodeURIComponent(sharePhone.trim())}&` : ""
                  }text=${encodeURIComponent(
                    `Dearest ${sharingGuest.greeting},\n\nWe are delighted to invite you to celebrate our wedding. Please find our digital invitation card and RSVP details at the link below:\n\n${
                      typeof window !== "undefined" ? window.location.origin : ""
                    }/invite/${sharingGuest.id}\n\nWith love,\nAlbin & Stella`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5 font-bold"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.498 1.451 5.42 1.453 5.518 0 10.007-4.488 10.01-10.008.002-2.673-1.038-5.186-2.93-7.078-1.892-1.891-4.407-2.934-7.086-2.935-5.525 0-10.015 4.487-10.018 10.007-.001 1.93.502 3.818 1.456 5.42l-.95 3.47 3.543-.93zm11.367-7.834c-.312-.156-1.848-.912-2.128-1.012-.282-.102-.487-.156-.692.154-.204.312-.792.992-.972 1.196-.18.204-.36.23-.672.074-.312-.156-1.318-.486-2.51-1.549-.928-.827-1.554-1.849-1.737-2.16-.18-.312-.02-.482.137-.636.141-.138.312-.36.468-.541.156-.18.208-.3.312-.51.104-.209.052-.394-.026-.55-.078-.157-.692-1.668-.948-2.285-.249-.597-.502-.516-.692-.526-.178-.008-.384-.01-.591-.01-.205 0-.54.077-.822.384-.282.308-1.077 1.053-1.077 2.566s1.102 2.978 1.257 3.184c.154.204 2.168 3.31 5.253 4.641.733.317 1.307.507 1.753.649.737.234 1.407.2 1.938.122.59-.087 1.848-.756 2.11-.1447.261-.708.261-1.314.183-1.423-.079-.11-.283-.167-.595-.323z" />
                  </svg>
                  Share WhatsApp
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RSVP Message Viewer Modal */}
      {viewingRsvpMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative text-left animate-fadeIn">
            <button
              onClick={() => setViewingRsvpMessage(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer border-none"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RSVP Message From</span>
              <h4 className="font-serif font-bold text-lg text-slate-900 mt-0.5">{viewingRsvpMessage.name}</h4>
              <span className="text-xs text-slate-400 italic">Greeting Label: "{viewingRsvpMessage.greeting}"</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              "{viewingRsvpMessage.message}"
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingRsvpMessage(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs uppercase tracking-wider font-semibold cursor-pointer border-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
