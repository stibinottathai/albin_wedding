"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Calendar, MapPin, Phone, MessageCircle, Mail, Send,
  ChevronDown, Check, Users, User, ArrowRight, ExternalLink, Heart,
  Menu, X, MousePointer2, Clock
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import Image from "next/image";
import { getSupabaseImageUrl } from "../lib/supabase";
import {
  getWeddingInfo, getEvents, updateRSVP, incrementInviteOpened,
  getStories, getFaqs, WeddingInfo, WeddingEvent, Guest, StoryMilestone, FaqItem
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
  t: any;
  weddingInfo?: WeddingInfo;
}

function ParallaxHero({
  label,
  petals,
  isDateRevealed,
  handleDateReveal,
  weddingDate,
  locationName,
  handleShare,
  t,
  weddingInfo
}: ParallaxHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden py-24 md:py-28 scroll-mt-24" id="home">
      {/* Background Image with Parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-[1.12] z-0">
        <Image
          src="https://images.unsplash.com/photo-1519225424757-3f303f8a483a?q=80&w=2400"
          alt={`${weddingInfo?.groomName} & ${weddingInfo?.brideName}`}
          fill
          priority
          sizes="100vw"
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
          {weddingInfo?.groomName} &amp; {weddingInfo?.brideName}
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
        <div className="w-full flex flex-col items-center justify-center pointer-events-auto mt-8">
          <AnimatePresence mode="wait">
            {!isDateRevealed ? (
              <motion.div
                key="reveal-btn-wrapper"
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="relative group perspective-1000">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      boxShadow: [
                        "0 10px 40px -10px rgba(115, 92, 0, 0.3)",
                        "0 15px 50px -5px rgba(115, 92, 0, 0.5)",
                        "0 10px 40px -10px rgba(115, 92, 0, 0.3)"
                      ]
                    }}
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      scale: { type: "spring", stiffness: 400, damping: 17 },
                      boxShadow: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                    }}
                    onClick={handleDateReveal}
                    className="relative overflow-hidden inline-flex items-center gap-4 bg-gradient-to-br from-[#c59b27] to-[#735c00] text-white sans uppercase tracking-[0.2em] px-10 py-5 rounded-xl transition-all duration-300 font-bold cursor-pointer z-20 shadow-xl border border-white/20"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
                    
                    <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm">{t("revealDate")}</span>
                  </motion.button>
                  
                  {/* Clicking Hand Indicator */}
                  <motion.div
                    animate={{ 
                      y: [0, -12, 0],
                      scale: [1, 0.9, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5, 
                      ease: "easeInOut" 
                    }}
                    className="absolute -bottom-8 -right-6 text-[#735c00] z-30 drop-shadow-md pointer-events-none"
                  >
                    <MousePointer2 className="w-8 h-8 fill-white/80" />
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="sans text-xs uppercase tracking-[0.3em] text-[#735c00] font-semibold mt-4 flex items-center gap-2"
                >
                  <span className="w-8 h-[1px] bg-[#c59b27]/40 block"></span>
                  {t("revealDateGuide")}
                  <span className="w-8 h-[1px] bg-[#c59b27]/40 block"></span>
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
                    <p className="serif italic text-2xl text-[var(--charcoal)] font-light">
                      {new Date(weddingDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p className="sans text-[10px] text-[var(--primary)] tracking-widest mt-1.5 uppercase font-bold">
                      {new Date(weddingDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · Holy Matrimony
                    </p>
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
  initialWeddingInfo?: WeddingInfo | null;
}

export const InvitationMain: React.FC<InvitationMainProps> = ({ guest, initialWeddingInfo }) => {
  const { t, language, setLanguage } = useLanguage();

  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(!guest);
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(initialWeddingInfo || null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [stories, setStories] = useState<StoryMilestone[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isDateRevealed, setIsDateRevealed] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<"accepted" | "declined">("accepted");
  const [rsvpAttendees, setRsvpAttendees] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState("");
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
      const sts = await getStories();
      setStories(sts);
      const faqList = await getFaqs();
      setFaqs(faqList);
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
      const sections = ["home", "our-story", "events", "gallery", "well-wishes", "family", "rsvp"];
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
      if (guest?.id) {
        const res = await fetch(`/api/rsvp/${guest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rsvpStatus,
            rsvpAttendees,
            rsvpMessage: rsvpMessage,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          console.error("RSVP API error:", data.error);
        }
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
    const text = `You're invited to the wedding of ${weddingInfo?.groomName} & ${weddingInfo?.brideName}! ${url}`;
    const enc = encodeURIComponent(text);
    if (platform === "whatsapp") window.open(`https://api.whatsapp.com/send?text=${enc}`, "_blank");
    else if (platform === "telegram") window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${enc}`, "_blank");
    else window.open(`mailto:?subject=Wedding Invitation — ${weddingInfo?.groomName} %26 ${weddingInfo?.brideName}&body=${enc}`, "_self");
  };

  // FAQs are loaded dynamically from the database

  if (!weddingInfo) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--cream)]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
          className="serif italic text-3xl text-[var(--primary)] font-light">
          <Heart className="w-10 h-10 text-[var(--primary)] fill-[var(--primary)] animate-pulse" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[var(--rose-light)] selection:text-[var(--charcoal)] relative">
      <MusicPlayer ref={musicPlayerRef} url={weddingInfo.bgMusicUrl} />

      {/* Envelope overlay */}
      <AnimatePresence mode="wait">
        {!isEnvelopeOpened && (
          <Envelope guestName={guest?.greeting} onOpened={handleEnvelopeOpened} weddingInfo={weddingInfo} />
        )}
      </AnimatePresence>

      {isEnvelopeOpened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>

          {/* ── 1. TopNavBar (Premium Glassmorphic Header) ── */}
          <nav className="fixed top-0 w-full z-50 bg-[var(--background)]/85 backdrop-blur-md border-b border-[var(--border-warm)]/30 shadow-sm transition-all duration-300 pointer-events-auto">
            <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6 md:px-12 py-3 flex-nowrap gap-4">
              {/* Brand Logo */}
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 text-[var(--primary)] hover:opacity-85 transition-opacity duration-200 shrink-0 cursor-pointer bg-transparent border-none">
                <motion.div
                  animate={{ scale: [1, 1.25, 1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Heart className="w-5 h-5 fill-[var(--primary)] text-[var(--primary)]" />
                </motion.div>
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="font-display-lg text-lg md:text-xl tracking-tighter serif font-medium"
                >Love</motion.span>
                <motion.div
                  animate={{ scale: [1, 1.25, 1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, delay: 0.2 }}
                >
                  <Heart className="w-5 h-5 fill-[var(--primary)] text-[var(--primary)]" />
                </motion.div>
              </button>

              {/* Navigation Links */}
              <div className="hidden xl:flex items-center gap-4 xl:gap-8 flex-nowrap shrink-0">
                <a className={`font-label-md text-[11px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeSection === "home" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#home">
                  {t("saveTheDate")}
                </a>
                <a className={`font-label-md text-[11px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeSection === "our-story" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#our-story">
                  {t("ourStory")}
                </a>
                <a className={`font-label-md text-[11px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeSection === "events" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#events">
                  {t("schedule")}
                </a>
                <a className={`font-label-md text-[11px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeSection === "gallery" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#gallery">
                  {t("gallery")}
                </a>
                <a className={`font-label-md text-[11px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeSection === "well-wishes" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#well-wishes">
                  {t("wishes")}
                </a>
                <a className={`font-label-md text-[11px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${activeSection === "family" ? "text-[var(--primary)] font-bold border-b border-[var(--primary)] pb-1" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`} href="#family">
                  {t("family")}
                </a>
              </div>

              {/* Actions: Bilingual Toggle & Hamburger */}
              <div className="flex items-center gap-4 flex-nowrap shrink-0">
                <div className="flex gap-1 bg-[var(--parchment)]/60 rounded-full p-1 border border-[var(--border-warm)]/30 shrink-0">
                  {["en", "ml"].map((lang) => (
                    <button key={lang} onClick={() => setLanguage(lang as "en" | "ml")}
                      className={`text-[10px] uppercase tracking-wider transition-all duration-300 px-2.5 py-1 rounded-full ${language === lang ? "bg-[var(--primary)] text-white font-medium" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`}>
                      {lang === "en" ? "EN" : "മല"}
                    </button>
                  ))}
                </div>

                {/* Hamburger Toggle (Mobile + Tablet) */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="xl:hidden p-1.5 rounded-lg hover:bg-[var(--parchment)]/65 text-[var(--primary)] transition-colors focus:outline-none cursor-pointer shrink-0"
                  aria-label="Toggle Navigation Menu"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Mobile/Tablet Navigation Drawer */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="xl:hidden w-full bg-[var(--background)]/95 backdrop-blur-lg border-t border-[var(--border-warm)]/30 shadow-lg overflow-hidden"
                >
                  <div className="flex flex-col px-6 py-6 gap-6">
                    {[
                      { href: "#home", label: t("saveTheDate"), section: "home" },
                      { href: "#our-story", label: t("ourStory"), section: "our-story" },
                      { href: "#events", label: t("schedule"), section: "events" },
                      { href: "#gallery", label: t("gallery"), section: "gallery" },
                      { href: "#well-wishes", label: t("wishes"), section: "well-wishes" },
                      { href: "#family", label: t("family"), section: "family" }
                    ].map((link) => (
                      <button
                        key={link.href}
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (link.href.startsWith("#")) {
                            const targetId = link.href.substring(1);
                            setTimeout(() => {
                              const el = document.getElementById(targetId);
                              if (el) {
                                const navHeight = 72;
                                const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
                                window.scrollTo({ top, behavior: "smooth" });
                              }
                            }, 350);
                          } else {
                            setTimeout(() => {
                              window.location.href = link.href;
                            }, 350);
                          }
                        }}
                        className={`font-label-md text-xs uppercase tracking-widest py-2 text-left transition-all duration-300 ${activeSection === link.section ? "text-[var(--primary)] font-bold pl-2 border-l-2 border-[var(--primary)]" : "text-[var(--muted-text)] hover:text-[var(--primary)]"}`}
                      >
                        {link.label}
                      </button>
                    ))}
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
            weddingInfo={weddingInfo}
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
              {stories.length === 0 ? (
                <div className="text-center py-12 text-xs italic text-[var(--muted-text)]">
                  Our love story timeline is being written... Please check back soon!
                </div>
              ) : (
                stories.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`relative flex flex-col md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""} justify-between items-stretch mb-20 group`}
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
                          <Image
                            src={getSupabaseImageUrl(item.imageUrl, 'thumb')}
                            alt={language === "en" ? item.titleEn : item.titleMl}
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-[1.04]"
                          />
                          <div className="absolute inset-0 bg-[var(--sage-dark)]/5 pointer-events-none" />
                        </div>

                        <span className="sans text-[10px] uppercase tracking-[0.25em] text-[var(--dusty-rose)] font-bold block mb-1">{item.year}</span>
                        <h3 className="serif text-2xl font-light italic text-[var(--charcoal)] mb-3">
                          {language === "en" ? item.titleEn : item.titleMl}
                        </h3>
                        <p className="sans text-xs text-[var(--muted-text)] leading-relaxed">
                          {language === "en" ? item.textEn : item.textMl}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
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

              <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                {events.map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="w-full sm:w-[280px] bg-[var(--cream)] rounded-2xl border border-[var(--border-warm)]/30 text-center relative overflow-hidden group hover:border-[var(--primary)]/50 hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(115,92,0,0.12)] transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(115,92,0,0.04)] flex flex-col justify-between"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative overflow-hidden h-44 border-b border-[var(--border-warm)]/20">
                        <Image
                          src={getSupabaseImageUrl(ev.imageUrl, 'thumb')}
                          alt={ev.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 300px"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-4">
                          <span className="bg-[var(--cream)] text-[var(--primary)] sans text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold shadow-sm">
                            {ev.date.includes('-') ? `${ev.date.split('-')[2]}/${ev.date.split('-')[1]}/${ev.date.split('-')[0].slice(-2)}` : ev.date}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <h3 className="serif text-xl font-light italic text-[var(--charcoal)] mb-2 group-hover:text-[var(--primary)] transition-colors">{ev.title}</h3>
                        <p className="sans text-xs text-[var(--muted-text)] leading-relaxed mb-4">{ev.description}</p>
                        
                        <div className="flex flex-col gap-2 items-center my-3 px-2">
                          <div className="flex items-center gap-1.5 text-[var(--primary)]">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="sans text-[11px] font-semibold text-center leading-tight">{ev.time}</span>
                          </div>
                          <div className="flex items-start justify-center gap-1.5 text-[var(--muted-text)]">
                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span className="sans text-[11px] font-semibold text-center leading-tight">{ev.venue}</span>
                          </div>
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

              <div className="max-w-2xl mx-auto">
                <div className="flex flex-col justify-between">
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
              <WishesWall 
                groomName={weddingInfo?.groomName} 
                brideName={weddingInfo?.brideName} 
              />
            </div>
          </section>

          {/* ── 9. RSVP Section (Stitch Style Adaptations) ── */}
          {guest && (
            <section className="py-24 px-6 bg-[var(--surface-container-low)]" id="rsvp">
              <div className="max-w-[700px] mx-auto bg-[var(--cream)] rounded-3xl p-8 md:p-14 border border-[var(--border-warm)]/20 shadow-[0_15px_50px_-15px_rgba(115,92,0,0.06)] relative overflow-hidden">
              {/* Watercolor decorative blurs */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--rose-light)]/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--primary-container)]/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10" id="rsvp-container">
                <div className="text-center mb-10">
                  <h2 className="font-headline-lg text-4xl text-[var(--primary)] mb-2 serif font-light">RSVP</h2>
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
          )}

          {/* ── 9.5 Family Section ── */}
          <section className="py-24 px-6 bg-[var(--cream)] border-t border-[var(--border-warm)]/20 scroll-mt-20" id="family">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">
                  {language === "en" ? "Loving Families" : "സ്നേഹനിധികളായ കുടുംബാംഗങ്ങൾ"}
                </p>
                <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">{t("family")}</h2>
                <SectionDivider />
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Groom's Family */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="bg-[var(--surface-container-low)] rounded-3xl p-8 border border-[var(--border-warm)]/30 text-center shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="sans text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold mb-3 block">
                      {t("groomSide")}
                    </span>
                    <h3 className="serif text-2xl italic text-[var(--charcoal)] mb-6">
                      {weddingInfo.groomName}&apos;s Family
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] font-bold mb-2">
                          {t("parents")}
                        </h4>
                        <p className="serif text-lg text-[var(--charcoal)] font-light">
                          {weddingInfo.groomParents}
                        </p>
                      </div>

                      {weddingInfo.groomSiblings && (
                        <div>
                          <div className="w-12 h-[1px] bg-[var(--border-warm)]/40 mx-auto my-4" />
                          <h4 className="sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] font-bold mb-2">
                            {t("siblings")}
                          </h4>
                          <p className="sans text-sm text-[var(--charcoal)]">
                            {weddingInfo.groomSiblings}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Bride's Family */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="bg-[var(--surface-container-low)] rounded-3xl p-8 border border-[var(--border-warm)]/30 text-center shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="sans text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold mb-3 block">
                      {t("brideSide")}
                    </span>
                    <h3 className="serif text-2xl italic text-[var(--charcoal)] mb-6">
                      {weddingInfo.brideName}&apos;s Family
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] font-bold mb-2">
                          {t("parents")}
                        </h4>
                        <p className="serif text-lg text-[var(--charcoal)] font-light">
                          {weddingInfo.brideParents}
                        </p>
                      </div>

                      {weddingInfo.brideSiblings && (
                        <div>
                          <div className="w-12 h-[1px] bg-[var(--border-warm)]/40 mx-auto my-4" />
                          <h4 className="sans text-[10px] uppercase tracking-widest text-[var(--muted-text)] font-bold mb-2">
                            {t("siblings")}
                          </h4>
                          <p className="sans text-sm text-[var(--charcoal)]">
                            {weddingInfo.brideSiblings}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── 10. FAQ Section ── */}
          {faqs.length > 0 && (
          <section className="py-24 px-6 bg-[var(--cream)] border-t border-[var(--border-warm)]/20">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--muted-text)] font-semibold mb-2">Good to Know</p>
                <h2 className="font-headline-lg text-4xl md:text-5xl text-[var(--primary)] mb-4 serif font-light">FAQs</h2>
                <SectionDivider />
              </div>

              <div className="flex flex-col divide-y divide-[var(--border-warm)]/40 border-b border-[var(--border-warm)]/40">
                {faqs.map((faq, i) => (
                  <div key={faq.id} className="py-2">
                    <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full py-4 flex justify-between items-center text-left gap-4 group">
                      <span className="serif text-lg italic text-[var(--charcoal)] group-hover:text-[var(--primary)] transition-colors">{faq.question}</span>
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
                          <p className="sans text-xs text-[var(--muted-text)] leading-relaxed pb-5">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>
          )}

          {/* ── 11. Footer Component ── */}
          <footer className="bg-[var(--charcoal)] text-[var(--cream)] py-16 px-6 text-center relative border-t border-[var(--border-warm)]/10">
            <h3 className="serif italic text-3xl mb-4 text-[var(--sage-light)]">{weddingInfo.groomName} &amp; {weddingInfo.brideName}</h3>
            <div className="w-16 h-px bg-[var(--sage-light)]/30 mx-auto my-6" />
            <p className="sans text-[10px] text-white/50 tracking-[0.2em] uppercase font-semibold">
              {new Date(weddingInfo.weddingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {weddingInfo.locationName}
            </p>
            <p className="sans text-[9px] text-white/30 mt-4">
              © {new Date().getFullYear()} {weddingInfo.groomName} &amp; {weddingInfo.brideName}. Forever &amp; Always. ·{" "}
              <a href="/admin" className="text-[11px] font-medium hover:text-[var(--sage-light)] transition-colors underline">Admin Login</a>
            </p>
            
            {/* Developer Contact Link */}
            <div className="mt-8 md:mt-0 md:absolute md:right-6 md:bottom-6 text-center md:text-right">
              <a
                href="https://wa.me/918848053964"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 sans text-[9px] text-white/35 hover:text-[var(--sage-light)] transition-all uppercase tracking-[0.15em] font-medium hover:underline"
              >
                <span>Create a website like this or any custom website</span>
                <span className="w-1 h-1 bg-[var(--sage-light)]/40 rounded-full" />
                <MessageCircle className="w-3 h-3 text-[#25D366]" />
              </a>
            </div>
          </footer>

        </motion.div>
      )}
    </div>
  );
};

export default InvitationMain;
