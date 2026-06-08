"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Calendar, MapPin, Phone, MessageCircle, Mail, Send,
  ChevronDown, Check, Users, User, ArrowRight, ExternalLink, Heart
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

/* ─── ParallaxHero — owns its own ref so useScroll only fires after mount ─── */
function ParallaxHero({ label }: { label: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden flex items-end">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-[1.15]">
        <img
          src="https://images.unsplash.com/photo-1519225424757-3f303f8a483a?q=80&w=2400"
          alt="Albin & Stella"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e2f26]/80 via-[#1e2f26]/20 to-transparent" />
      </motion.div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col gap-4"
        >
          <p className="sans text-xs uppercase tracking-[0.3em] text-white/70 font-medium">{label}</p>
          <h1 className="serif text-white leading-none">
            <span className="block text-7xl md:text-[9rem] font-light italic">Albin</span>
            <span className="block text-4xl md:text-6xl font-light text-white/50 my-1">&</span>
            <span className="block text-7xl md:text-[9rem] font-light italic">Stella</span>
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-px w-10 bg-white/30" />
            <p className="sans text-xs text-white/60 tracking-[0.2em] uppercase">
              November 28, 2026 · Kochi, Kerala
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="absolute bottom-6 right-6 flex flex-col items-center gap-2 text-white/40 z-10"
      >
        <span className="sans text-[9px] uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
}

/* ─── Small reusables ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--sage)] font-medium mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-[var(--border-warm)]" />
      <Heart className="w-3 h-3 text-[var(--dusty-rose)] fill-[var(--dusty-rose)]" />
      <div className="flex-1 h-px bg-[var(--border-warm)]" />
    </div>
  );
}

/* ─── Main Component ─── */
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
  const [isRsvpSubmitting, setIsRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const musicPlayerRef = useRef<MusicPlayerRef>(null);

  useEffect(() => {
    const fetchData = async () => {
      const info = await getWeddingInfo();
      setWeddingInfo(info);
      const evs = await getEvents();
      setEvents(evs);
    };
    fetchData();
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
      if (guest?.id) await updateRSVP(guest.id, rsvpStatus, rsvpAttendees, rsvpMessage);
      setRsvpSuccess(true);
    } catch (err) {
      console.error(err);
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

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  if (!weddingInfo) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--warm-white)]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
          className="serif italic text-3xl text-[var(--sage-dark)]">A & S</motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--warm-white)] text-[var(--charcoal)]">
      <MusicPlayer ref={musicPlayerRef} url={weddingInfo.bgMusicUrl} />

      {/* Envelope overlay */}
      <AnimatePresence mode="wait">
        {!isEnvelopeOpened && (
          <Envelope guestName={guest?.greeting} onOpened={handleEnvelopeOpened} />
        )}
      </AnimatePresence>

      {isEnvelopeOpened && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>

          {/* ── NAV ── */}
          <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex justify-between items-center pointer-events-none">
            <div className="bg-[var(--warm-white)]/80 backdrop-blur-md rounded-full px-5 py-2 border border-[var(--border-warm)] shadow-sm pointer-events-auto">
              <span className="serif italic text-[var(--sage-dark)] text-xl">A & S</span>
            </div>
            <div className="bg-[var(--warm-white)]/80 backdrop-blur-md rounded-full px-5 py-2 border border-[var(--border-warm)] shadow-sm flex gap-4 pointer-events-auto">
              {["en", "ml"].map((lang) => (
                <button key={lang} onClick={() => setLanguage(lang as "en" | "ml")}
                  className={`sans text-xs uppercase tracking-wider transition-colors ${language === lang ? "text-[var(--sage-dark)] font-medium" : "text-[var(--muted-text)]"}`}>
                  {lang === "en" ? "English" : "മലയാളം"}
                </button>
              ))}
            </div>
          </nav>

          {/* ═══════════════════════════════════
              1. HERO — ParallaxHero (self-contained)
          ═══════════════════════════════════ */}
          <ParallaxHero label={t("youAreInvited")} />

          {/* ═══════════════════════════════════
              2. SAVE THE DATE — Countdown
          ═══════════════════════════════════ */}
          <section className="bg-[var(--parchment)] py-24 px-6">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <SectionLabel>Save the Date</SectionLabel>
                <h2 className="serif text-4xl md:text-5xl font-light italic text-[var(--charcoal)] mb-2">
                  {weddingInfo.tagline || "A Day to Remember"}
                </h2>
                <Divider />

                <AnimatePresence mode="wait">
                  {!isDateRevealed ? (
                    <motion.button
                      key="reveal"
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDateReveal}
                      className="inline-flex items-center gap-3 bg-[var(--sage-dark)] text-white sans text-xs uppercase tracking-widest px-8 py-4 rounded-full hover:bg-[var(--sage)] transition-colors duration-300"
                    >
                      <Calendar className="w-4 h-4" />
                      {t("revealDate")}
                    </motion.button>
                  ) : (
                    <motion.div key="revealed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-8">
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-[var(--border-warm)] shadow-lg p-8 w-full max-w-md">
                        <p className="sans text-xs uppercase tracking-widest text-[var(--sage)] mb-1">The Vows Begin In</p>
                        <LiveCountdown targetDate={weddingInfo.weddingDate} />
                        <div className="border-t border-[var(--border-warm)] mt-4 pt-4">
                          <p className="serif italic text-2xl text-[var(--charcoal)]">Saturday, November 28, 2026</p>
                          <p className="sans text-xs text-[var(--muted-text)] tracking-widest mt-1 uppercase">10:30 AM · Church Ceremony</p>
                          <p className="sans text-xs text-[var(--sage)] mt-1">{weddingInfo.locationName}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 text-[var(--muted-text)]">
                        {[
                          { icon: <MessageCircle className="w-4 h-4" />, label: "WhatsApp", fn: "whatsapp" as const },
                          { icon: <Send className="w-4 h-4 -rotate-45" />, label: "Telegram", fn: "telegram" as const },
                          { icon: <Mail className="w-4 h-4" />, label: "Email", fn: "email" as const },
                        ].map((s) => (
                          <button key={s.fn} onClick={() => handleShare(s.fn)}
                            className="flex items-center gap-2 border border-[var(--border-warm)] rounded-full px-4 py-2 sans text-xs hover:border-[var(--sage)] hover:text-[var(--sage-dark)] transition-colors">
                            {s.icon} {s.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════
              3. OUR STORY
          ═══════════════════════════════════ */}
          <section className="py-24 px-6 bg-[var(--warm-white)]">
            <div className="max-w-5xl mx-auto">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                <SectionLabel>Our Journey</SectionLabel>
                <h2 className="serif text-4xl md:text-5xl font-light italic">{t("ourStory")}</h2>
              </motion.div>

              <div className="flex flex-col gap-24">
                {[
                  {
                    year: "June 2022", title: t("storyFirstMeeting"), reverse: false,
                    img: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900",
                    text: language === "en"
                      ? "A simple hello over aromatic coffee in Kochi sparked a conversation that went on for hours. We knew right away there was a spark."
                      : "കൊച്ചിയിലെ ഒരു കഫേയിൽ വെച്ചുള്ള ലളിതമായ കൂടിക്കാഴ്ച മണിക്കൂറുകളോളം നീണ്ട സംഭാഷണമായി മാറി.",
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
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
                    className={`flex flex-col ${item.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-10 md:gap-16 items-center`}
                  >
                    <div className="w-full md:w-1/2">
                      <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-[var(--parchment)]">
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-[var(--sage-dark)]/10" />
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                      <span className="sans text-xs uppercase tracking-[0.25em] text-[var(--dusty-rose)] font-medium mb-3">{item.year}</span>
                      <h3 className="serif text-3xl md:text-4xl font-light italic text-[var(--charcoal)] mb-4">{item.title}</h3>
                      <div className="w-8 h-px bg-[var(--sage)] mb-4" />
                      <p className="sans text-sm text-[var(--muted-text)] leading-relaxed">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════
              4. EVENTS
          ═══════════════════════════════════ */}
          <section className="py-24 px-6 bg-[var(--parchment)]">
            <div className="max-w-5xl mx-auto">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                <SectionLabel>The Celebrations</SectionLabel>
                <h2 className="serif text-4xl md:text-5xl font-light italic">{t("schedule")}</h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[var(--warm-white)] rounded-3xl overflow-hidden border border-[var(--border-warm)] shadow-sm hover:shadow-xl transition-shadow duration-500 flex flex-col"
                  >
                    <div className="relative overflow-hidden h-56">
                      <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-[var(--warm-white)] text-[var(--sage-dark)] sans text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full font-medium">
                          {ev.date} · {ev.time}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="serif text-2xl font-light italic text-[var(--charcoal)] mb-2">{ev.title}</h3>
                        <p className="sans text-sm text-[var(--muted-text)] leading-relaxed mb-4">{ev.description}</p>
                        <div className="flex items-start gap-2 text-[var(--sage-dark)]">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="sans text-xs font-medium">{ev.venue}</span>
                        </div>
                      </div>
                      <a href={getGoogleCalendarUrl(ev)} target="_blank" rel="noopener noreferrer"
                        className="mt-6 flex items-center justify-center gap-2 border border-[var(--sage-dark)] text-[var(--sage-dark)] rounded-full py-2.5 sans text-xs uppercase tracking-widest hover:bg-[var(--sage-dark)] hover:text-white transition-all duration-300">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("googleCalendar")}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════
              5. VENUE
          ═══════════════════════════════════ */}
          <section className="py-24 px-6 bg-[var(--warm-white)]">
            <div className="max-w-5xl mx-auto">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                <SectionLabel>The Location</SectionLabel>
                <h2 className="serif text-4xl md:text-5xl font-light italic">{t("venue")}</h2>
              </motion.div>

              <div className="grid md:grid-cols-12 gap-8 items-stretch">
                <div className="md:col-span-5">
                  <div className="bg-[var(--parchment)] rounded-3xl p-8 border border-[var(--border-warm)] h-full flex flex-col justify-between">
                    <div>
                      <h3 className="serif text-2xl italic text-[var(--charcoal)] mb-2">{weddingInfo.locationName}</h3>
                      <p className="sans text-sm text-[var(--muted-text)] leading-relaxed mb-6">{weddingInfo.locationAddress}</p>
                      <div className="border-t border-[var(--border-warm)] pt-6 space-y-4">
                        <div>
                          <p className="sans text-xs uppercase tracking-widest text-[var(--sage)] font-medium mb-1">{t("parking")}</p>
                          <p className="sans text-sm text-[var(--muted-text)] leading-relaxed">{weddingInfo.parkingInfo}</p>
                        </div>
                        <div>
                          <p className="sans text-xs uppercase tracking-widest text-[var(--sage)] font-medium mb-2">{t("contact")}</p>
                          <div className="space-y-1">
                            <p className="flex items-center gap-2 sans text-sm text-[var(--muted-text)]">
                              <Phone className="w-3.5 h-3.5 text-[var(--sage)]" /> Groom: {weddingInfo.contactGroom}
                            </p>
                            <p className="flex items-center gap-2 sans text-sm text-[var(--muted-text)]">
                              <Phone className="w-3.5 h-3.5 text-[var(--sage)]" /> Bride: {weddingInfo.contactBride}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(weddingInfo.locationAddress)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-8 flex items-center justify-center gap-2 bg-[var(--sage-dark)] text-white rounded-full py-3 sans text-xs uppercase tracking-widest hover:bg-[var(--sage)] transition-colors duration-300">
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("viewMap")}
                    </a>
                  </div>
                </div>
                <div className="md:col-span-7 min-h-[360px] rounded-3xl overflow-hidden border border-[var(--border-warm)] shadow-md">
                  <iframe src={weddingInfo.googleMapEmbedUrl} width="100%" height="100%"
                    style={{ border: 0, minHeight: "360px" }} allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" title="Venue Map" />
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════
              6. RSVP
          ═══════════════════════════════════ */}
          <section className="py-24 px-6 bg-[var(--sage-dark)]">
            <div className="max-w-4xl mx-auto">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                <p className="sans text-xs uppercase tracking-[0.25em] text-[var(--sage-light)] font-medium mb-3">Kindly Reply</p>
                <h2 className="serif text-4xl md:text-5xl font-light italic text-white">{t("rsvp")}</h2>
                <p className="sans text-sm text-white/60 mt-3">{t("rsvpSub")}</p>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-[var(--warm-white)] rounded-3xl p-8 md:p-12 max-w-lg mx-auto shadow-2xl">
                {rsvpSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 flex flex-col items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-[var(--sage-dark)] flex items-center justify-center">
                      <Check className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="serif text-2xl italic">{t("rsvpSuccess")}</h3>
                    <p className="sans text-sm text-[var(--muted-text)] max-w-xs leading-relaxed">
                      {rsvpStatus === "accepted"
                        ? `We are thrilled to celebrate with you! We've noted ${rsvpAttendees} attendee(s).`
                        : "We are sorry you won't be joining us. Your warm wishes mean everything."}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="flex flex-col gap-6">
                    {guest && (
                      <div className="text-center bg-[var(--parchment)] rounded-2xl p-4">
                        <p className="sans text-xs uppercase tracking-widest text-[var(--muted-text)] mb-1">Reserved For</p>
                        <p className="serif italic text-xl text-[var(--sage-dark)]">{guest.greeting}</p>
                      </div>
                    )}

                    <div>
                      <p className="sans text-xs uppercase tracking-widest text-[var(--muted-text)] mb-3 font-medium">Attendance</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { val: "accepted", label: t("rsvpAccept"), icon: <Users className="w-4 h-4" /> },
                          { val: "declined", label: t("rsvpDecline"), icon: <User className="w-4 h-4" /> },
                        ].map((opt) => (
                          <button type="button" key={opt.val}
                            onClick={() => setRsvpStatus(opt.val as "accepted" | "declined")}
                            className={`flex items-center justify-center gap-2 py-3 rounded-2xl border sans text-xs uppercase tracking-wider transition-all duration-200 ${
                              rsvpStatus === opt.val
                                ? opt.val === "accepted"
                                  ? "bg-[var(--sage-dark)] text-white border-[var(--sage-dark)]"
                                  : "bg-[var(--terracotta)] text-white border-[var(--terracotta)]"
                                : "border-[var(--border-warm)] text-[var(--muted-text)] hover:border-[var(--sage)]"
                            }`}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {rsvpStatus === "accepted" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <label className="sans text-xs uppercase tracking-widest text-[var(--muted-text)] block mb-2 font-medium">{t("guestsCount")}</label>
                          <select value={rsvpAttendees} onChange={(e) => setRsvpAttendees(parseInt(e.target.value, 10))}
                            className="w-full px-4 py-3 rounded-2xl border border-[var(--border-warm)] bg-[var(--parchment)] sans text-sm focus:outline-none focus:border-[var(--sage)] transition-colors">
                            {Array.from({ length: guest?.allowedAttendees ?? 5 }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "person" : "people"}</option>
                            ))}
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label className="sans text-xs uppercase tracking-widest text-[var(--muted-text)] block mb-2 font-medium">{t("wishesLabel")}</label>
                      <textarea rows={3} value={rsvpMessage} onChange={(e) => setRsvpMessage(e.target.value)}
                        placeholder="Write a warm note for Albin & Stella..."
                        className="w-full px-4 py-3 rounded-2xl border border-[var(--border-warm)] bg-[var(--parchment)] sans text-sm focus:outline-none focus:border-[var(--sage)] transition-colors resize-none placeholder:text-[var(--muted-text)]/50" />
                    </div>

                    <button type="submit" disabled={isRsvpSubmitting}
                      className="flex items-center justify-center gap-2 bg-[var(--sage-dark)] text-white rounded-full py-4 sans text-xs uppercase tracking-widest hover:bg-[var(--sage)] disabled:opacity-50 transition-colors duration-300">
                      {isRsvpSubmitting
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><span>{t("submitRsvp")}</span><ArrowRight className="w-3.5 h-3.5" /></>
                      }
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════
              7. GALLERY
          ═══════════════════════════════════ */}
          <section className="py-24 px-6 bg-[var(--warm-white)]">
            <div className="max-w-6xl mx-auto">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                <SectionLabel>Captured Moments</SectionLabel>
                <h2 className="serif text-4xl md:text-5xl font-light italic">{t("gallery")}</h2>
              </motion.div>
              <WeddingGallery />
            </div>
          </section>

          {/* ═══════════════════════════════════
              8. WISHES WALL
          ═══════════════════════════════════ */}
          <section className="py-24 px-6 bg-[var(--parchment)]">
            <div className="max-w-4xl mx-auto">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                <SectionLabel>Warm Wishes</SectionLabel>
                <h2 className="serif text-4xl md:text-5xl font-light italic">{t("wishesWall")}</h2>
              </motion.div>
              <WishesWall />
            </div>
          </section>

          {/* ═══════════════════════════════════
              9. FAQ
          ═══════════════════════════════════ */}
          <section className="py-24 px-6 bg-[var(--warm-white)]">
            <div className="max-w-2xl mx-auto">
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
                <SectionLabel>Good to Know</SectionLabel>
                <h2 className="serif text-4xl md:text-5xl font-light italic">FAQs</h2>
              </motion.div>

              <div className="flex flex-col divide-y divide-[var(--border-warm)]">
                {faqItems.map((faq, i) => (
                  <div key={i}>
                    <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full py-5 flex justify-between items-center text-left gap-4">
                      <span className="serif text-lg italic text-[var(--charcoal)]">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-[var(--sage)] shrink-0 transition-transform duration-300 ${expandedFaq === i ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {expandedFaq === i && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <p className="sans text-sm text-[var(--muted-text)] leading-relaxed pb-5">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-[var(--charcoal)] text-white py-16 px-6 text-center">
            <h3 className="serif italic text-4xl mb-4">Albin & Stella</h3>
            <Divider />
            <p className="sans text-xs text-white/40 tracking-widest uppercase">November 28, 2026 · Kochi, Kerala</p>
            <p className="sans text-xs text-white/30 mt-4">Made with ♥ for our special day</p>
          </footer>

        </motion.div>
      )}
    </div>
  );
};

export default InvitationMain;
