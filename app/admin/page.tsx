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
  Calendar
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
  WeddingInfo, 
  Guest, 
  Analytics,
  GalleryImage,
  StoryMilestone,
  WeddingEvent
} from "../../lib/db";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"analytics" | "rsvp" | "guests" | "wishes" | "settings" | "gallery" | "stories" | "events">("analytics");
  const [rsvpFilter, setRsvpFilter] = useState<"all" | "accepted" | "declined" | "pending">("all");
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [storyMilestones, setStoryMilestones] = useState<StoryMilestone[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  
  // Form states for Wedding Events
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState(""); // Stores 24h format "HH:MM"
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
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCategory, setNewImageCategory] = useState<GalleryImage["category"]>("pre-wedding");
  const [newImageAlt, setNewImageAlt] = useState("");
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
      const info = await getWeddingInfo();
      setWeddingInfo(info);
      // Load guests via API route to bypass RLS
      const guestRes = await fetch("/api/rsvp");
      const guestList = guestRes.ok ? await guestRes.json() : await getGuests();
      setGuests(Array.isArray(guestList) ? guestList : []);
      const wishesRes = await fetch("/api/wishes?all=true");
      const wishesList = wishesRes.ok ? await wishesRes.json() : [];
      setWishes(Array.isArray(wishesList) ? wishesList : []);
      const stats = await getAnalytics();
      setAnalytics(stats);
      const galleryList = await getGalleryImages();
      setGalleryImages(Array.isArray(galleryList) ? galleryList : []);
      const storiesList = await getStories();
      setStoryMilestones(Array.isArray(storiesList) ? storiesList : []);
      if (Array.isArray(storiesList)) {
        setNewStoryOrderIndex(storiesList.length + 1);
      }
      const eventsList = await getEvents();
      setEvents(Array.isArray(eventsList) ? eventsList : []);
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Resolve Categories list dynamically
  const guestCategories: string[] = weddingInfo?.categories
    ? JSON.parse(weddingInfo.categories)
    : ["General", "Family", "Friends", "Relatives"];

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

  // Download digital invitation card
  const handleDownloadCard = () => {
    if (!canvasRef.current || !sharingGuest) return;
    const link = document.createElement("a");
    link.download = `Invitation_${sharingGuest.name.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // Delete Guest Action
  const handleDeleteGuest = async (id: string) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      try {
        await deleteGuest(id);
        loadAdminData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Moderation: Approve/Reject Wish
  const handleToggleWish = async (id: string, approved: boolean) => {
    try {
      await fetch(`/api/wishes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Moderation: Delete Wish
  const handleDeleteWish = async (id: string) => {
    if (confirm("Delete this message?")) {
      try {
        await fetch(`/api/wishes/${id}`, { method: "DELETE" });
        loadAdminData();
      } catch (err) {
        console.error(err);
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

    let src = "";

    if (uploadType === "url") {
      if (!newImageUrl.trim()) {
        setUploadError("Please enter an image URL.");
        return;
      }
      src = newImageUrl.trim();
    } else {
      if (!newImageFile) {
        setUploadError("Please select an image file to upload.");
        return;
      }

      setUploading(true);
      try {
        if (isSupabaseConfigured) {
          const fileExt = newImageFile.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from("gallery")
            .upload(filePath, newImageFile, {
              cacheControl: "3600",
              upsert: false
            });

          if (uploadErr) {
            throw new Error(`Supabase Storage upload failed: ${uploadErr.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from("gallery")
            .getPublicUrl(filePath);

          src = publicUrl;
        } else {
          // Local fallback: convert to base64
          src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(newImageFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
        }
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || "Failed to upload image. Please try using an Image URL instead.");
        setUploading(false);
        return;
      }
    }

    try {
      const newImage: GalleryImage = {
        id: `gal-${Math.random().toString(36).substring(2, 9)}`,
        src,
        category: newImageCategory,
        alt: newImageAlt.trim() || `${newImageCategory} photo`,
        createdAt: new Date().toISOString()
      };

      await saveGalleryImage(newImage);
      
      // Reset form
      setNewImageFile(null);
      setNewImageUrl("");
      setNewImageAlt("");
      // Clear file input DOM element if present
      const fileInput = document.getElementById("gallery-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      loadAdminData();
    } catch (err: any) {
      setUploadError(err.message || "Failed to save gallery image.");
    } finally {
      setUploading(false);
    }
  };

  // Gallery: Delete photo
  const handleDeleteImage = async (id: string, src: string) => {
    if (confirm("Are you sure you want to delete this image from the gallery?")) {
      try {
        await deleteGalleryImage(id);

        // Optional: If it's a Supabase storage URL, try to delete the file from storage bucket
        if (isSupabaseConfigured && src.includes("/storage/v1/object/public/gallery/")) {
          const fileName = src.split("/gallery/").pop();
          if (fileName) {
            await supabase.storage.from("gallery").remove([fileName]);
          }
        }
        loadAdminData();
      } catch (err) {
        console.error("Failed to delete image:", err);
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
        if (isSupabaseConfigured) {
          const fileExt = newStoryImageFile.name.split(".").pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from("stories")
            .upload(filePath, newStoryImageFile, {
              cacheControl: "3600",
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
          // Local fallback: convert to base64
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(newStoryImageFile);
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
      try {
        await deleteStory(id);

        // Delete from storage if it is a Supabase object
        if (isSupabaseConfigured && imageUrl.includes("/storage/v1/object/public/stories/")) {
          const fileName = imageUrl.split("/stories/").pop();
          if (fileName) {
            await supabase.storage.from("stories").remove([fileName]);
          }
        }
        loadAdminData();
      } catch (err) {
        console.error("Failed to delete story:", err);
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
    if (!newEventTime.trim()) {
      setEventError("Please select an event time.");
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
        if (isSupabaseConfigured) {
          const fileExt = newEventImageFile.name.split(".").pop();
          const fileName = `event_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from("gallery")
            .upload(filePath, newEventImageFile, {
              cacheControl: "3600",
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
          // Local fallback: convert to base64
          imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(newEventImageFile);
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

    try {
      const eventTime12 = convert24to12(newEventTime);
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
      setNewEventTime("");
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
    setNewEventTime(convert12to24(event.time) || "");
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
    setNewEventTime("");
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
      try {
        await deleteEvent(id);

        // Delete from storage if it is a Supabase object
        if (isSupabaseConfigured && imageUrl.includes("/storage/v1/object/public/gallery/")) {
          const fileName = imageUrl.split("/gallery/").pop();
          if (fileName) {
            await supabase.storage.from("gallery").remove([fileName]);
          }
        }
        loadAdminData();
      } catch (err) {
        console.error("Failed to delete event:", err);
      }
    }
  };

  // Handle setting updates locally before submit
  const handleSettingChange = (field: keyof WeddingInfo, value: string) => {
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
          <div className="serif italic text-3xl text-[#d4af37] font-light mb-1">A & S</div>
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded bg-[#d4af37] text-slate-950 flex items-center justify-center font-bold">A</div>
            <div>
              <h2 className="font-serif text-white font-bold text-base leading-tight">Albin & Stella</h2>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Wedding Admin</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "analytics" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4 text-[#d4af37]" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("guests")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "guests" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4 text-[#d4af37]" />
              Guest List
            </button>
            <button
              onClick={() => setActiveTab("rsvp")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "rsvp" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <ClipboardList className="h-4 w-4 text-[#d4af37]" />
              RSVP Responses
            </button>
            <button
              onClick={() => setActiveTab("wishes")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "wishes" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4 text-[#d4af37]" />
              Wishes Moderation
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "gallery" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Camera className="h-4 w-4 text-[#d4af37]" />
              Wedding Gallery
            </button>
            <button
              onClick={() => setActiveTab("stories")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "stories" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <BookOpen className="h-4 w-4 text-[#d4af37]" />
              Our Story
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "events" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Calendar className="h-4 w-4 text-[#d4af37]" />
              Wedding Events
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all ${
                activeTab === "settings" ? "bg-slate-800 text-white border-l-4 border-[#d4af37]" : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <SettingsIcon className="h-4 w-4 text-[#d4af37]" />
              Site Settings
            </button>
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
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        {/* Tab Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 capitalize">
              {activeTab === "settings" ? "Site Settings" : 
               activeTab === "rsvp" ? "RSVP Responses" : 
               activeTab === "wishes" ? "Wishes Moderation" : 
               activeTab === "gallery" ? "Wedding Gallery" : 
               activeTab === "stories" ? "Our Story" : 
               activeTab === "events" ? "Wedding Events" : 
               activeTab}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage all wedding content, RSVPs, and configurations.</p>
          </div>
        </div>

        {/* Tab 1: Analytics */}
        {activeTab === "analytics" && analytics && (
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
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
                    {guests
                      .filter(g => rsvpFilter === "all" || g.rsvpStatus === rsvpFilter)
                      .map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50 transition-colors">
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
                    {guests.filter(g => rsvpFilter === "all" || g.rsvpStatus === rsvpFilter).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                          No {rsvpFilter === "all" ? "" : rsvpFilter} responses yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
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
                    {guests
                      .filter(g => guestFilterCategory === "All" || g.category === guestFilterCategory)
                      .map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50">
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Wishes Moderation */}
        {activeTab === "wishes" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {wishes.length === 0 ? (
                <div className="p-12 text-center italic text-slate-400">No wishes found.</div>
              ) : (
                wishes.map((w) => (
                  <div key={w.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-serif font-bold text-slate-900">{w.guestName}</span>
                        <span className="text-xs text-slate-400">• {new Date(w.timestamp).toLocaleDateString()}</span>
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
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Wedding Gallery */}
        {activeTab === "gallery" && (
          <div className="space-y-8 animate-fadeIn">
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
                      <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Select Image File</label>
                      <input
                        key="gallery-file-input-node"
                        id="gallery-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewImageFile(e.target.files[0]);
                          }
                        }}
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
                    <select
                      value={newImageCategory}
                      onChange={(e) => setNewImageCategory(e.target.value as any)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="pre-wedding">Pre-Wedding</option>
                      <option value="engagement">Engagement</option>
                      <option value="family">Family / Relatives</option>
                      <option value="memories">Memories</option>
                    </select>
                  </div>

                  {/* Alt Text Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Description / Alt Text</label>
                    <input
                      type="text"
                      value={newImageAlt || ""}
                      onChange={(e) => setNewImageAlt(e.target.value)}
                      placeholder="e.g. Groom looking at bride during church ceremony"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    {uploadError && <p className="text-xs text-rose-600 font-medium">{uploadError}</p>}
                    {uploadSuccess && <p className="text-xs text-emerald-600 font-medium">Photo added to gallery successfully!</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {uploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add Photo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* List of current images */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-6 border-b pb-2">Gallery Photos ({galleryImages.length})</h3>

              {galleryImages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">No photos in the gallery. Add some above!</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {galleryImages.map((img) => (
                    <div key={img.id} className="group relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                      {/* Image Thumbnail */}
                      <div className="aspect-video relative overflow-hidden bg-slate-200">
                        <img 
                          src={img.src} 
                          alt={img.alt} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          {img.category}
                        </span>
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
                          
                          <button
                            onClick={() => handleDeleteImage(img.id, img.src)}
                            className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Event Time</label>
                    <input
                      type="time"
                      required
                      value={newEventTime || ""}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    />
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
      </main>

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

              {/* Download Action */}
              <button
                onClick={handleDownloadCard}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                Download Invitation Card (PNG)
              </button>
            </div>

            {/* Right Column: Message & Share */}
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-5">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Invite via WhatsApp</h3>
                  <p className="text-xs text-slate-500 mt-1">Send a pre-crafted message with the invitation link directly to the guest.</p>
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
