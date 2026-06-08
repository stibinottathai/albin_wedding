"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Calendar, MapPin, Phone, MessageCircle, Mail, Send,
  ChevronDown, Check, Users, User, ArrowRight, ExternalLink, Heart,
  Menu, X
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  getWeddingInfo, getEvents, updateRSVP, incrementInviteOpened,
  WeddingInfo, WeddingEvent, Guest
} from "../lib/db";
import Envelope from "./Envelope";
import MusicPlayer, { MusicPlayerRef } from "./MusicPlayer";
import LiveCountdown from "./LiveCountdown";
import WeddingGallery from "./WeddingGallery";
import WishesWall from "./WishesWall";

/* ─── ParallaxHero — styled according to Stitch specifications ─── */
interface ParallaxHeroProps {
  label: string;
  petals: { id: number; size: number; left: number; duration: number; delay: number }[];
  isDateRevealed: boolean;
  handleDateReveal: () => void;
  weddingDate: string;
  locationName: string;
  handleShare: (platform: "whatsapp" | "telegram" | "email") => void;
  t: (key: string) => string;
}

function ParallaxHero({
  label,
  petals,
  isDateRevealed,
  handleDateReveal,
  weddingDate,
  locationName,
  handleShare,
  t
}: ParallaxHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden py-24 md:py-28" id="home">
      {/* Background Image with Parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-[1.12] z-0">
        <img
          src="https://images.unsplash.com/photo-1519225424757-3f303f8a483a?q=80&w=2400"
          alt="Albin & Stella"
          className="w-full h-full object-cover"
        />
        {/* Soft overlay to ensure readability */}
        <div className="absolute inset-0 bg-[var(--cream)]/35 backdrop-blur-[1.5px] pointer-events-none" />
      </motion.div>

      {/* Floating Rose Petals Container */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {petals.map((p) => (
          <div
            key={p.id}
            className="petal"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center px-6 md:px-12 max-w-[1200px] mx-auto flex flex-col items-center justify-center w-full pt-12 md:pt-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-display-lg text-5xl md:text-7xl text-[var(--primary)] mb-4 drop-shadow-sm serif font-medium"
        >
          Albin &amp; Stella
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-body-lg text-xs md:text-sm text-[var(--muted-text)] mb-6 tracking-[0.25em] uppercase font-semibold"
        >
          {label}
        </motion.p>

        {/* Tap to Reveal Date */}
        <div className="w-full flex flex-col items-center justify-center pointer-events-auto">
          <AnimatePresence mode="wait">
            {!isDateRevealed ? (
              <motion.div
                key="reveal-btn-wrapper"
                className="flex flex-col items-center gap-3.5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: [1, 1.04, 1],
                    boxShadow: [
                      "0 4px 14px 0 rgba(115, 92, 0, 0.25)",
                      "0 8px 24px 6px rgba(115, 92, 0, 0.45)",
                      "0 4px 14px 0 rgba(115, 92, 0, 0.25)"
                    ]
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    opacity: { duration: 0.4 },
                    scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                    boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                  }}
                  onClick={handleDateReveal}
                  className="inline-flex items-center gap-3 bg-[var(--primary)] text-white sans text-xs uppercase tracking-widest px-8 py-4 rounded hover:bg-[var(--primary-container)] hover:text-[var(--charcoal)] transition-all duration-300 font-semibold cursor-pointer z-20"
                >
                  <Calendar className="w-4 h-4 animate-bounce" />
                  {t("revealDate")}
                </motion.button>
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: [0.45, 0.95, 0.45] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                  className="sans text-[10px] uppercase tracking-[0.25em] text-[var(--primary)] font-bold mt-1"
                >
                  ✦ {t("revealDateGuide")} ✦
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="revealed-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center gap-6 w-full z-20"
              >
                {/* Revealed Card */}
                <div className="bg-[var(--cream)]/90 backdrop-blur-md rounded-3xl border border-[var(--border-warm)]/30 shadow-[0_15px_50px_-15px_rgba(115,92,0,0.06)] p-4 sm:p-8 w-full max-w-md">
                  <p className="sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] font-bold mb-3">The Celebration Begins In</p>
                  
                  <LiveCountdown targetDate={weddingDate} />
                  
                  <div className="border-t border-[var(--border-warm)]/40 mt-6 pt-6">
                    <p className="serif italic text-2xl text-[var(--charcoal)] font-light">Saturday, November 28, 2026</p>
                    <p className="sans text-[10px] text-[var(--primary)] tracking-widest mt-1.5 uppercase font-bold">10:30 AM · Holy Matrimony</p>
                    <p className="sans text-xs text-[var(--muted-text)] mt-1">{locationName}</p>
                  </div>
                </div>

                {/* Sharing actions */}
                <div className="flex flex-wrap justify-center gap-3 text-[var(--muted-text)]">
                  {[
                    { icon: <MessageCircle className="w-4 h-4" />, label: "WhatsApp", fn: "whatsapp" as const },
                    { icon: <Send className="w-4 h-4 -rotate-45" />, label: "Telegram", fn: "telegram" as const },
                    { icon: <Mail className="w-4 h-4" />, label: "Email", fn: "email" as const },
                  ].map((s) => (
                    <button key={s.fn} onClick={() => handleShare(s.fn)}
                      className="flex items-center gap-2 border border-[var(--border-warm)]/60 rounded px-4 py-2 sans text-xs hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors cursor-pointer bg-[var(--cream)]/90 backdrop-blur-md shadow-sm">
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 animate-bounce">
          <a className="text-[var(--primary)] opacity-70 hover:opacity-100 transition-opacity" href="#our-story">
            <ChevronDown className="w-8 h-8" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Premium Floral/Line Divider ─── */
function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-8 max-w-md mx-auto">
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[var(--border-warm)]" />
      <Heart className="w-3.5 h-3.5 text-[var(--primary)] fill-[var(--primary)] opacity-60" />
      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[var(--border-warm)]" />
    </div>
  );
}

interface InvitationMainProps {
  guest?: Guest | null;
}

export const InvitationMain: React.FC<InvitationMainProps> = ({ guest }) => {
  const { t, language, setLanguage } = useLanguage();

  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isDateRevealed, setIsDateRevealed] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<"accepted" | "declined">("accepted");
  const [rsvpAttendees, setRsvpAttendees] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("");
  const [isRsvpSubmitting, setIsRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("");
  const [petals, setPetals] = useState<{ id: number; size: number; left: number; duration: number; delay: number }[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const musicPlayerRef = useRef<MusicPlayerRef>(null);

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      const info = await getWeddingInfo();
      setWeddingInfo(info);
      const evs = await getEvents();
      setEvents(evs);
    };
    fetchData();
  }, []);

  // Initialize petals client-side to prevent Next.js hydration mismatches
  useEffect(() => {
    const generatedPetals = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.random() * 12 + 10,
      left: Math.random() * 100,
      duration: Math.random() * 15 + 12,
      delay: Math.random() * 8,
    }));
    setPetals(generatedPetals);
  }, []);

  // Active section scroll spy listener
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "our-story", "events", "gallery", "well-wishes", "rsvp"];
      let current = "";
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 250) {
            current = sectionId;
            break;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleEnvelopeOpened = async () => {
    setIsEnvelopeOpened(true);
    setTimeout(() => musicPlayerRef.current?.play(), 500);
    if (guest) {
      try { await incrementInviteOpened(guest.id); } catch (_) {}
    }
  };

  const handleDateReveal = () => {
    if (isDateRevealed) return;
    setIsDateRevealed(true);
    musicPlayerRef.current?.play();
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRsvpSubmitting(true);
    try {
      // Append meal choice to message elegantly to maintain database compatibility
      const combinedMessage = rsvpMessage
        ? `${rsvpMessage}${selectedMeal ? ` (Meal Choice: ${selectedMeal})` : ""}`
        : selectedMeal ? `(Meal Choice: ${selectedMeal})` : "";

      if (guest?.id) {
        await updateRSVP(guest.id, rsvpStatus, rsvpAttendees, combinedMessage);
      }
      setRsvpSuccess(true);
    } catch (err) {
      console.error("RSVP Submission error:", err);
    } finally {
      setIsRsvpSubmitting(false);
    }
  };

  const getGoogleCalendarUrl = (ev: WeddingEvent) => {
    const dateStr = ev.date.replace(/-/g, "");
    let hours = 12, mins = 0;
    const m = ev.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (m) {
      hours = parseInt(m[1], 10); mins = parseInt(m[2], 10);
      if (m[3].toUpperCase() === "PM" && hours < 12) hours += 12;
      if (m[3].toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dateStr}T${pad(hours)}${pad(mins)}00/${dateStr}T${pad((hours + 3) % 24)}${pad(mins)}00&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.venue)}`;
  };

  const handleShare = (platform: "whatsapp" | "telegram" | "email") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `You're invited to the wedding of Albin & Stella! ${url}`;
    const enc = encodeURIComponent(text);
    if (platform === "whatsapp") window.open(`https://api.whatsapp.com/send?text=${enc}`, "_blank");
    else if (platform === "telegram") window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${enc}`, "_blank");
    else window.open(`mailto:?subject=Wedding Invitation — Albin %26 Stella&body=${enc}`, "_self");
  };

  const faqItems = [
    {
      q: "What is the dress code?",
      a: "We request guests to wear formal or traditional attire. Pastels, champagne, or elegant cream tones are highly welcome.",
    },
    {
      q: "Is parking available?",
      a: "Complimentary valet parking is available directly at the entrance of Grand Palace Ballroom, Kochi.",
    },
    {
      q: "Can I bring extra guests?",
      a: `Your invitation is configured for up to ${guest?.allowedAttendees ?? 2} attendees. Please specify the count when you RSVP.`,
    },
    {
      q: "What time should I arrive?",
      a: "The Church ceremony starts sharp at 10:30 AM. We recommend arriving 15 minutes early to find your seats.",
    },
  ];

  if (!weddingInfo) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--cream)]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
          className="serif italic text-3xl text-[var(--primary)] font-light">A & S</motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[var(--rose-light)] selection:text-[var(--charcoal)] relative">
      <MusicPlayer ref={musicPlayerRef} url={weddingInfo.bgMusicUrl} />

      {/* Envelope overlay */}
      <AnimatePresence mode="wait">
        {!isEnvelopeOpened && (
          <Envelope guestName={guest?.greeting} onOpened={handleEnvelopeOpened} />
        )}
      </AnimatePresence>

      {isEnvelopeOpened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>

          {/* ── 1. TopNavBar (Premium Glassmorphic Header) ── */}
          <nav className="fixed top-0 w-full z-50 bg-[var(--background)]/85 backdrop-blur-md border-b border-[var(--border-warm)]/30 shadow-sm transition-all duration-300 pointer-events-auto">
            <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6 md:px-12 py-3 flex-nowrap gap-4">
              {/* Brand Logo */}
              <a className="font-display-lg text-2xl md:text-3xl tracking-tighter text-[var(--primary)] hover:opacity-85 transition-opacity duration-200 serif font-medium whitespace-nowrap shrink-0" href="#home">
                ALBIN &amp; STELLA
              </a>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-3 lg:gap-6 flex-nowrap shrink-0">
                <a className={`font-label-md text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeSection === "home" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#home">
                  {t("saveTheDate")}
                </a>
                <a className={`font-label-md text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeSection === "our-story" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#our-story">
                  {t("ourStory")}
                </a>
                <a className={`font-label-md text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeSection === "events" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#events">
                  {t("schedule")}
                </a>
                <a className={`font-label-md text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeSection === "gallery" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#gallery">
                  {t("gallery")}
                </a>
                <a className={`font-label-md text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeSection === "well-wishes" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#well-wishes">
                  {t("wishes")}
                </a>
                <a className={`font-label-md text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeSection === "rsvp" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#rsvp">
                  {t("rsvp")}
                </a>
                <a className="font-label-md text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap text-[var(--muted-text)] hover:text-[var(--primary)]" href="/admin">
                  {t("login")}
                </a>
              </div>

              {/* Actions: Bilingual Toggle, RSVP & Hamburger */}
              <div className="flex items-center gap-4 flex-nowrap shrink-0">
                <div className="flex gap-1 bg-[var(--parchment)]/60 rounded-full p-1 border border-[var(--border-warm)]/30 shrink-0">
                  {["en", "ml"].map((lang) => (
                    <button key={lang} onClick={() => setLanguage(lang as "en" | "ml")}
                      className={`text-[10px] uppercase tracking-wider transition-all duration-300 px-2.5 py-1 rounded-full ${language === lang ? "bg-[var(--primary)] text-white font-medium" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`}>
                      {lang === "en" ? "EN" : "മല"}
                    </button>
                  ))}
                </div>
                
                {/* Desktop RSVP Button */}
                <a className="hidden md:inline-flex items-center justify-center px-5 py-2 bg-[var(--primary)] text-white font-semibold text-xs uppercase tracking-widest rounded hover:bg-[var(--primary-container)] hover:text-[var(--charcoal)] transition-all duration-300 shadow-sm whitespace-nowrap shrink-0" href="#rsvp">
                  RSVP
                </a>

                {/* Hamburger Toggle (Mobile Only) */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-[var(--parchment)]/65 text-[var(--primary)] transition-colors focus:outline-none cursor-pointer shrink-0"
                  aria-label="Toggle Navigation Menu"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="md:hidden w-full bg-[var(--background)]/95 backdrop-blur-lg border-t border-[var(--border-warm)]/30 shadow-lg overflow-hidden"
                >
                  <div className="flex flex-col px-6 py-6 gap-4">
                    {[
                      { href: "#home", label: t("saveTheDate"), section: "home" },
                      { href: "#our-story", label: t("ourStory"), section: "our-story" },
                      { href: "#events", label: t("schedule"), section: "events" },
                      { href: "#gallery", label: t("gallery"), section: "gallery" },
                      { href: "#well-wishes", label: t("wishes"), section: "well-wishes" },
                      { href: "#rsvp", label: t("rsvp"), section: "rsvp" },
                      { href: "/admin", label: t("login"), section: "admin" }
                    ].map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`font-label-md text-xs uppercase tracking-widest py-2 transition-all duration-300 ${activeSection === link.section ? "text-[var(--primary)] font-bold pl-2 border-l-2 border-[var(--primary)]" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`}
                      >
                        {link.label}
                      </a>
                    ))}
                    
                    {/* Mobile Menu RSVP Button */}
                    <a
                      href="#rsvp"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center py-3.5 mt-2 bg-[var(--primary)] text-white font-semibold text-xs uppercase tracking-widest rounded hover:bg-[var(--primary-container)] hover:text-[var(--charcoal)] transition-all duration-300 shadow-sm"
                    >
                      RSVP
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* ── 2. Hero Section (Parallax & Floating Petals) ── */}
          <ParallaxHero
            label={t("youAreInvited")}
            petals={petals}
            isDateRevealed={isDateRevealed}
            handleDateReveal={handleDateReveal}
            weddingDate={weddingInfo.weddingDate}
            locationName={weddingInfo.locationName}
            handleShare={handleShare}
            t={t}
          />

          {/* ── 4. Our Story Section (Timeline with Grayscale Hover Effects) ── */}
          <section className="py-24 px-6 bg-[var(--cream)] relative overflow-hidden" id="our-story">
            {/* Subtle decorative background blur */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--rose-light)]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="max-w-[800px] mx-auto text-center mb-20">
              <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">Our Journey</p>
              <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">{t("ourStory")}</h2>
              <SectionDivider />
            </div>

            <div className="max-w-[850px] mx-auto relative">
              {/* Timeline Center Line */}
              <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-[var(--border-warm)]/60 md:-translate-x-1/2" />

              {/* Milestones */}
              {[
                {
                  year: "June 2022", title: t("storyFirstMeeting"), reverse: false,
                  img: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900",
                  text: language === "en"
                    ? "A simple hello over aromatic coffee in Kochi sparked a conversation that went on for hours. We knew right away there was a spark."
                    : "കൊച്ചിയിലെ ഒരു കഫേയിൽ വെച്ചുള്ള കൂടിക്കാഴ്ച മണിക്കൂറുകളോളം നീണ്ട സംഭാഷണമായി മാറി.",
                },
                {
                  year: "December 2023", title: t("storyFriendship"), reverse: true,
                  img: "https://images.unsplash.com/photo-1529636798458-92182e65f133?q=80&w=900",
                  text: language === "en"
                    ? "Late night drives, shared playlists, and whispered dreams. Friendship became the anchor of our lives."
                    : "രാത്രി യാത്രകളും ഒരേ സംഗീതവും സ്വപ്നങ്ങളും പരസ്പരം പങ്കുവെച്ച നാളുകൾ.",
                },
                {
                  year: "February 2025", title: t("storyLove"), reverse: false,
                  img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=900",
                  text: language === "en"
                    ? "On a quiet sunset cruise along the backwaters, we realised we wanted to spend forever together."
                    : "കായലിലൂടെയുള്ള ഒരു വൈകുന്നേരത്തെ യാത്രയിൽ ഒരുമിച്ചുള്ള ഒരു ജീവിതമാണ് ഞങ്ങൾ ആഗ്രഹിക്കുന്നതെന്ന് മനസ്സിലാക്കി.",
                },
                {
                  year: "June 2026", title: t("storyEngagement"), reverse: true,
                  img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=900",
                  text: language === "en"
                    ? "Surrounded by family and loved ones, we exchanged rings and promised to walk side by side through every season of life."
                    : "കുടുംബത്തിന്റെ സാന്നിദ്ധ്യത്തിൽ മോതിരം മാറി ഒരുമിച്ചുണ്ടാകുമെന്ന് പ്രതിജ്ഞ ചെയ്തു.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`relative flex flex-col md:flex-row ${item.reverse ? "md:flex-row-reverse" : ""} justify-between items-stretch mb-20 group`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[20px] md:left-1/2 w-9 h-9 bg-[var(--background)] border border-[var(--primary)] rounded-full md:-translate-x-1/2 flex items-center justify-center z-10 group-hover:bg-[var(--primary)] transition-colors duration-300">
                    <Heart className="w-3.5 h-3.5 text-[var(--primary)] group-hover:text-white transition-colors duration-300" />
                  </div>

                  {/* Empty spacer / visual alignment column */}
                  <div className="hidden md:block w-[45%]" />

                  {/* Content Column */}
                  <div className="pl-12 md:pl-0 w-full md:w-[45%] flex flex-col justify-center">
                    <div className="bg-[var(--surface-container-low)] rounded-2xl p-6 border border-[var(--border-warm)]/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                      {/* Image representation for Mobile & Desktop inside */}
                      <div className="relative overflow-hidden rounded-xl aspect-[16/10] bg-[var(--parchment)] mb-6 shadow-sm border border-[var(--border-warm)]/20">
                        <img
                          src={item.img}
                          alt={item.title}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-[var(--sage-dark)]/5 pointer-events-none" />
                      </div>

                      <span className="sans text-[10px] uppercase tracking-[0.25em] text-[var(--dusty-rose)] font-bold block mb-1">{item.year}</span>
                      <h3 className="serif text-2xl font-light italic text-[var(--charcoal)] mb-3">{item.title}</h3>
                      <p className="sans text-xs text-[var(--muted-text)] leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── 5. The Celebration Section (Events with Premium Card layout) ── */}
          <section className="py-24 px-6 bg-[var(--surface-container-low)] relative" id="events">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">The Celebration</p>
                <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">{t("schedule")}</h2>
                <SectionDivider />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {events.map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="bg-[var(--cream)] rounded-2xl border border-[var(--border-warm)]/30 text-center relative overflow-hidden group hover:border-[var(--primary)]/50 hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(115,92,0,0.12)] transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(115,92,0,0.04)] flex flex-col justify-between"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative overflow-hidden h-44 border-b border-[var(--border-warm)]/20">
                        <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-4">
                          <span className="bg-[var(--cream)] text-[var(--primary)] sans text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold shadow-sm">
                            {ev.date}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <h3 className="serif text-xl font-light italic text-[var(--charcoal)] mb-2 group-hover:text-[var(--primary)] transition-colors">{ev.title}</h3>
                        <p className="sans text-xs text-[var(--muted-text)] leading-relaxed mb-4">{ev.description}</p>
                        
                        <div className="flex items-start justify-center gap-1.5 text-[var(--primary)] my-3 px-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="sans text-[11px] font-semibold text-center leading-tight">{ev.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-0 mt-auto">
                      <a href={getGoogleCalendarUrl(ev)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 border border-[var(--primary)]/50 text-[var(--primary)] rounded py-2 sans text-[10px] uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all duration-300 w-full font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("googleCalendar")}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-16 text-center">
                <p className="sans text-xs text-[var(--muted-text)] tracking-wider italic">Dress Code: Formal Attire (Champagne, Pastel, or Cream tones highly welcome)</p>
              </div>
            </div>
          </section>

          {/* ── 6. Venue Section (Clean editorial layouts and Map) ── */}
          <section className="py-24 px-6 bg-[var(--cream)] relative" id="venue">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">The Location</p>
                <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">{t("venue")}</h2>
                <SectionDivider />
              </div>

              <div className="grid md:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
                <div className="md:col-span-5 flex flex-col justify-between">
                  <div className="bg-[var(--surface-container-low)] rounded-3xl p-8 border border-[var(--border-warm)]/30 h-full flex flex-col justify-between shadow-sm">
                    <div>
                      <h3 className="serif text-2xl italic text-[var(--charcoal)] mb-2">{weddingInfo.locationName}</h3>
                      <p className="sans text-xs text-[var(--muted-text)] leading-relaxed mb-6">{weddingInfo.locationAddress}</p>

                      <div className="border-t border-[var(--border-warm)]/40 pt-6 space-y-4">
                        <div>
                          <p className="sans text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold mb-1">{t("parking")}</p>
                          <p className="sans text-xs text-[var(--muted-text)] leading-relaxed">{weddingInfo.parkingInfo}</p>
                        </div>
                        <div>
                          <p className="sans text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold mb-2">{t("contact")}</p>
                          <div className="space-y-1.5">
                            <p className="flex items-center gap-2 sans text-xs text-[var(--muted-text)]">
                              <Phone className="w-3.5 h-3.5 text-[var(--primary)]" /> Groom: <span className="font-semibold">{weddingInfo.contactGroom}</span>
                            </p>
                            <p className="flex items-center gap-2 sans text-xs text-[var(--muted-text)]">
                              <Phone className="w-3.5 h-3.5 text-[var(--primary)]" /> Bride: <span className="font-semibold">{weddingInfo.contactBride}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(weddingInfo.locationAddress)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-8 flex items-center justify-center gap-2 bg-[var(--primary)] text-white rounded py-3 sans text-[10px] uppercase tracking-widest hover:bg-[var(--primary-container)] hover:text-[var(--charcoal)] transition-colors duration-300 w-full font-semibold shadow-sm">
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("viewMap")}
                    </a>
                  </div>
                </div>

                <div className="md:col-span-7 min-h-[360px] rounded-3xl overflow-hidden border border-[var(--border-warm)]/30 shadow-md">
                  <iframe src={weddingInfo.googleMapEmbedUrl} width="100%" height="100%"
                    style={{ border: 0, minHeight: "360px" }} allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" title="Venue Map" />
                </div>
              </div>
            </div>
          </section>

          {/* ── 7. Captured Moments (Gallery) ── */}
          <section className="py-24 px-6 bg-[var(--surface-container-low)]" id="gallery">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">Moments</p>
                <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">{t("gallery")}</h2>
                <SectionDivider />
              </div>
              <WeddingGallery />
            </div>
          </section>

          {/* ── 8. Wishes Wall ── */}
          <section className="py-24 px-6 bg-[var(--cream)]" id="well-wishes">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">Blessings</p>
                <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">{t("wishes")}</h2>
                <SectionDivider />
              </div>
              <WishesWall />
            </div>
          </section>

          {/* ── 9. RSVP Section (Stitch Style Adaptations) ── */}
          <section className="py-24 px-6 bg-[var(--surface-container-low)]" id="rsvp">
            <div className="max-w-[700px] mx-auto bg-[var(--cream)] rounded-3xl p-8 md:p-14 border border-[var(--border-warm)]/20 shadow-[0_15px_50px_-15px_rgba(115,92,0,0.06)] relative overflow-hidden">
              {/* Watercolor decorative blurs */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--rose-light)]/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--primary-container)]/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10" id="rsvp-container">
                <div className="text-center mb-10">
                  <h2 className="font-headline-lg text-4xl text-[var(--primary)] mb-2 serif font-light">RSVP</h2>
                  <p className="sans text-[10px] text-[var(--muted-text)] tracking-[0.25em] uppercase font-bold">{t("rsvpSub")}</p>
                </div>

                {rsvpSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                      <Check className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <h3 className="serif text-2xl italic text-[var(--primary)]">{t("rsvpSuccess")}</h3>
                    <p className="sans text-xs text-[var(--muted-text)] max-w-xs leading-relaxed">
                      {rsvpStatus === "accepted"
                        ? `We are thrilled to celebrate with you! We've noted ${rsvpAttendees} attendee(s).`
                        : "We are sorry you won't be joining us. Your warm wishes mean everything."}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="space-y-8">
                    {/* Guest Greeting Badge */}
                    {guest && (
                      <div className="text-center bg-[var(--parchment)]/70 rounded-2xl p-4 border border-[var(--border-warm)]/20">
                        <p className="sans text-[8px] uppercase tracking-widest text-[var(--muted-text)] mb-0.5">Reserved For</p>
                        <p className="serif italic text-lg text-[var(--primary)] font-semibold">{guest.greeting}</p>
                      </div>
                    )}

                    {/* Name Field (for general public/fallback or just displays if guest not loaded) */}
                    {!guest && (
                      <div>
                        <label className="block sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] mb-2 font-bold" htmlFor="fullName">Full Name</label>
                        <input
                          className="w-full bg-transparent border-0 border-b border-[var(--border-warm)]/60 focus:ring-0 focus:border-b-2 focus:border-[var(--primary)] text-xs py-2.5 px-0 transition-colors placeholder:text-[var(--muted-text)]/40"
                          id="fullName"
                          type="text"
                          required
                          placeholder="Please enter your name"
                        />
                      </div>
                    )}

                    {/* Attendance Radio Buttons (Stitch Adaptations) */}
                    <div>
                      <label className="block sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] mb-3 font-bold">Will you be attending?</label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 cursor-pointer">
                          <input
                            className="peer sr-only"
                            name="attendance"
                            type="radio"
                            checked={rsvpStatus === "accepted"}
                            onChange={() => setRsvpStatus("accepted")}
                          />
                          <div className="w-full text-center py-3 px-4 rounded border border-[var(--border-warm)]/40 peer-checked:bg-[var(--rose-light)]/40 peer-checked:border-[var(--primary)] peer-checked:text-[var(--primary)] text-[var(--muted-text)] font-semibold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.01]">
                            Joyfully Accept
                          </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input
                            className="peer sr-only"
                            name="attendance"
                            type="radio"
                            checked={rsvpStatus === "declined"}
                            onChange={() => setRsvpStatus("declined")}
                          />
                          <div className="w-full text-center py-3 px-4 rounded border border-[var(--border-warm)]/40 peer-checked:bg-[var(--parchment)] peer-checked:border-[var(--border-warm)] peer-checked:text-[var(--charcoal)] text-[var(--muted-text)] font-semibold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.01]">
                            Regretfully Decline
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Guest Count (conditional accepts) */}
                    <AnimatePresence>
                      {rsvpStatus === "accepted" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-6">
                          <div>
                            <label className="block sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] mb-2 font-bold">{t("guestsCount")}</label>
                            <select
                              value={rsvpAttendees}
                              onChange={(e) => setRsvpAttendees(parseInt(e.target.value, 10))}
                              className="w-full bg-transparent border-0 border-b border-[var(--border-warm)]/60 focus:ring-0 focus:border-b-2 focus:border-[var(--primary)] text-xs py-2.5 px-0 cursor-pointer"
                            >
                              {Array.from({ length: guest?.allowedAttendees ?? 5 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "Person" : "People"}</option>
                              ))}
                            </select>
                          </div>

                          {/* Meal Preference Selection */}
                          <div>
                            <label className="block sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] mb-2 font-bold" htmlFor="meal">Meal Preference</label>
                            <select
                              id="meal"
                              value={selectedMeal}
                              onChange={(e) => setSelectedMeal(e.target.value)}
                              className="w-full bg-transparent border-0 border-b border-[var(--border-warm)]/60 focus:ring-0 focus:border-b-2 focus:border-[var(--primary)] text-xs py-2.5 px-0 cursor-pointer"
                            >
                              <option value="">Select an option</option>
                              <option value="Traditional Sadya">Traditional Kerala Sadya</option>
                              <option value="Herb-Crusted Filet Mignon">Herb-Crusted Filet Mignon</option>
                              <option value="Pan-Seared Sea Bass">Pan-Seared Sea Bass</option>
                              <option value="Truffle Wild Mushroom Risotto">Truffle Wild Mushroom Risotto</option>
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Wishes/Notes Textarea */}
                    <div>
                      <label className="block sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] mb-2 font-bold" htmlFor="message">A Note for the Couple (Optional)</label>
                      <textarea
                        id="message"
                        rows={3}
                        value={rsvpMessage}
                        onChange={(e) => setRsvpMessage(e.target.value)}
                        placeholder="Leave a wish or dietary note..."
                        className="w-full bg-transparent border-0 border-b border-[var(--border-warm)]/60 focus:ring-0 focus:border-b-2 focus:border-[var(--primary)] text-xs py-2 px-0 resize-none transition-colors placeholder:text-[var(--muted-text)]/40"
                      />
                    </div>

                    {/* Submit RSVP Button */}
                    <div className="text-center pt-2">
                      <button
                        type="submit"
                        disabled={isRsvpSubmitting}
                        className="inline-flex items-center justify-center px-12 py-3.5 bg-[var(--primary)] text-white font-semibold text-xs uppercase tracking-widest rounded hover:bg-[var(--primary-container)] hover:text-[var(--charcoal)] active:scale-95 transition-all duration-300 w-full sm:w-auto shadow-[0_4px_14px_0_rgba(115,92,0,0.3)] hover:shadow-[0_6px_20px_rgba(115,92,0,0.2)] disabled:opacity-50"
                      >
                        {isRsvpSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>{t("submitRsvp")}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* ── 10. FAQ Section ── */}
          <section className="py-24 px-6 bg-[var(--cream)] border-t border-[var(--border-warm)]/20">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">Good to Know</p>
                <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">FAQs</h2>
                <SectionDivider />
              </div>

              <div className="flex flex-col divide-y divide-[var(--border-warm)]/40 border-b border-[var(--border-warm)]/40">
                {faqItems.map((faq, i) => (
                  <div key={i} className="py-2">
                    <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full py-4 flex justify-between items-center text-left gap-4 group">
                      <span className="serif text-lg italic text-[var(--charcoal)] group-hover:text-[var(--primary)] transition-colors">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-[var(--primary)] shrink-0 transition-transform duration-300 ${expandedFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="sans text-xs text-[var(--muted-text)] leading-relaxed pb-5">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── 11. Footer Component ── */}
          <footer className="bg-[var(--charcoal)] text-[var(--cream)] py-16 px-6 text-center relative border-t border-[var(--border-warm)]/10">
            <h3 className="serif italic text-3xl mb-4 text-[var(--sage-light)]">Albin &amp; Stella</h3>
            <div className="w-16 h-px bg-[var(--sage-light)]/30 mx-auto my-6" />
            <p className="sans text-[10px] text-white/50 tracking-[0.2em] uppercase font-semibold">November 28, 2026 · Kochi, Kerala</p>
            <p className="sans text-[9px] text-white/30 mt-4">
              © 2026 Albin &amp; Stella. Forever &amp; Always. ·{" "}
              <a href="/admin" className="hover:text-[var(--sage-light)] transition-colors underline">Admin Login</a>
            </p>
          </footer>

        </motion.div>
      )}
    </div>
  );
};

export default InvitationMain;
