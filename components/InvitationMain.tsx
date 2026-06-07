"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Phone, 
  Share2, 
  Info, 
  Music, 
  Volume2, 
  Check, 
  User, 
  Users, 
  ExternalLink,
  MessageCircle,
  Mail,
  Send,
  ChevronDown
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { 
  getWeddingInfo, 
  getEvents, 
  updateRSVP, 
  incrementInviteOpened, 
  WeddingInfo, 
  WeddingEvent, 
  Guest 
} from "../lib/db";
import { 
  triggerConfettiBurst, 
  triggerConfettiCannon, 
  triggerGoldShower 
} from "../lib/confetti";
import Envelope from "./Envelope";
import MusicPlayer, { MusicPlayerRef } from "./MusicPlayer";
import LiveCountdown from "./LiveCountdown";
import WeddingGallery from "./WeddingGallery";
import WishesWall from "./WishesWall";
import GoldParticles from "./GoldParticles";

interface InvitationMainProps {
  guest?: Guest | null;
}

export const InvitationMain: React.FC<InvitationMainProps> = ({ guest }) => {
  const { t, language, setLanguage } = useLanguage();
  
  // State variables
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfo | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isDateRevealed, setIsDateRevealed] = useState(false);
  
  // RSVP Form States
  const [rsvpStatus, setRsvpStatus] = useState<"accepted" | "declined">("accepted");
  const [rsvpAttendees, setRsvpAttendees] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [isRsvpSubmitting, setIsRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // FAQ Expanded index state
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Music Player Reference
  const musicPlayerRef = useRef<MusicPlayerRef>(null);

  // Fetch wedding info & events
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
    // Play music once envelope is opened
    setTimeout(() => {
      musicPlayerRef.current?.play();
    }, 500);

    // Track invite open in DB if dynamic guest link
    if (guest) {
      try {
        await incrementInviteOpened(guest.id);
      } catch (err) {
        console.error("Failed to track open:", err);
      }
    }
  };

  const handleDateReveal = () => {
    if (isDateRevealed) return;
    setIsDateRevealed(true);
    
    // Play audio/music if not playing
    musicPlayerRef.current?.play();

    // Trigger high-fidelity gold confetti animations
    triggerConfettiBurst();
    setTimeout(triggerConfettiCannon, 500);
    setTimeout(triggerGoldShower, 1500);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guest?.id) {
      setIsRsvpSubmitting(true);
      try {
        await updateRSVP(guest.id, rsvpStatus, rsvpAttendees, rsvpMessage);
        setRsvpSuccess(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsRsvpSubmitting(false);
      }
    } else {
      // General guests submit as temporary
      setIsRsvpSubmitting(true);
      try {
        // Save using temporary mock profile or alert
        setRsvpSuccess(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsRsvpSubmitting(false);
      }
    }
  };

  // Google Calendar URL helper
  const getGoogleCalendarUrl = (ev: WeddingEvent) => {
    const dateStr = ev.date.replace(/-/g, "");
    // Formulate 2 hours event
    const timeMatch = ev.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hours = 12;
    let mins = 0;
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      mins = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const startHour = pad(hours);
    const startMin = pad(mins);
    const endHour = pad((hours + 3) % 24); // Assume 3 hour duration

    const startDate = `${dateStr}T${startHour}${startMin}00`;
    const endDate = `${dateStr}T${endHour}${startMin}00`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.venue)}`;
  };

  // Share invitation links
  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const handleShare = (platform: "whatsapp" | "telegram" | "email") => {
    const text = `You are cordially invited to the wedding of Albin and Stella. Open our digital invitation link here: ${getShareUrl()}`;
    const encText = encodeURIComponent(text);
    
    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encText}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent("Join Albin & Stella's wedding celebration!")}`, "_blank");
    } else if (platform === "email") {
      window.open(`mailto:?subject=Wedding invitation of Albin & Stella&body=${encText}`, "_self");
    }
  };

  // FAQ Items
  const faqItems = [
    {
      q: language === "en" ? "What is the dress code?" : "വസ്ത്രധാരണ രീതി എങ്ങനെയുള്ളതാണ്?",
      a: language === "en" 
        ? "We request guests to wear formal or traditional attire. Pastel shades, champagne gold, or elegant white/cream are highly welcome." 
        : "ഫോർമൽ അല്ലെങ്കിൽ പരമ്പരാഗത വസ്ത്രങ്ങൾ ധരിക്കാൻ അഭ്യർത്ഥിക്കുന്നു. ലൈറ്റ് ഷേഡുകൾ, ഷാംപെയ്ൻ ഗോൾഡ് വസ്ത്രങ്ങൾ കൂടുതൽ അനുയോജ്യമാണ്.",
    },
    {
      q: language === "en" ? "Where can I park my vehicle?" : "വാഹനം പാർക്ക് ചെയ്യാനുള്ള സൗകര്യം ഉണ്ടോ?",
      a: language === "en"
        ? "Complimentary valet parking is available directly at the entrance of Grand Palace Ballroom, Kochi."
        : "കൊച്ചി ഗ്രാൻഡ് പാലസ് ബാൾറൂമിന്റെ പ്രവേശന കവാടത്തിൽ സൗജന്യ വാലറ്റ് പാർക്കിംഗ് ലഭ്യമാണ്.",
    },
    {
      q: language === "en" ? "Can I bring my family or extra guests?" : "എന്റെ കുടുംബത്തെയും അധിക അതിഥികളെയും കൊണ്ടുവരാമോ?",
      a: language === "en"
        ? `Yes! Your invitation is configured for up to ${guest?.allowedAttendees || 2} attendees. Kindly specify the count during RSVP submission.`
        : `തീർച്ചയായും! നിങ്ങളുടെ ക്ഷണക്കത്തിൽ പരമാവധി ${guest?.allowedAttendees || 2} പേർക്ക് പങ്കെടുക്കാം. ദയവായി RSVP ചെയ്യുമ്പോൾ എണ്ണം അറിയിക്കുക.`,
    },
    {
      q: language === "en" ? "What time should I arrive at the venue?" : "ഞാൻ ഏത് സമയത്ത് വേദിയിൽ എത്തണം?",
      a: language === "en"
        ? "The Church ceremony starts sharp at 10:30 AM. We recommend arriving 15 minutes early to secure your seats."
        : "ദേവാലയത്തിലെ ചടങ്ങുകൾ കൃത്യം 10:30 ന് ആരംഭിക്കും. 15 മിനിറ്റ് മുമ്പ് എത്തുവാൻ താല്പര്യപ്പെടുന്നു.",
    }
  ];

  if (!weddingInfo) {
    return (
      <div className="fixed inset-0 bg-[#0f1c18] flex items-center justify-center text-[#d4af37]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="font-serif italic tracking-widest text-sm uppercase">Loading Experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full overflow-hidden flex flex-col">
      {/* Background Floating Gold Flakes */}
      <GoldParticles />

      {/* Floating Audio controller (rendered in fixed space via React portal/DOM) */}
      <MusicPlayer ref={musicPlayerRef} url={weddingInfo.bgMusicUrl} />

      {/* Animate Envelope Landing view */}
      <AnimatePresence mode="wait">
        {!isEnvelopeOpened && (
          <Envelope 
            guestName={guest?.greeting} 
            onOpened={handleEnvelopeOpened} 
          />
        )}
      </AnimatePresence>

      {/* Main Wedding Content Section (Displays once Envelope is opened) */}
      {isEnvelopeOpened && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="flex-1 flex flex-col items-center w-full"
        >
          {/* Header & Language Selector */}
          <header className="w-full max-w-4xl mx-auto flex items-center justify-between p-6 z-30">
            <span className="font-serif italic text-[#c59b27] font-semibold text-lg">A & S</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  language === "en" ? "bg-primary text-white" : "bg-white/40 text-[#766f64] hover:bg-white/70"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("ml")}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  language === "ml" ? "bg-primary text-white" : "bg-white/40 text-[#766f64] hover:bg-white/70"
                }`}
              >
                മലയാളം
              </button>
            </div>
          </header>

          {/* 1. Hero Section */}
          <section className="relative w-full max-w-2xl mx-auto text-center px-6 py-12 md:py-20 flex flex-col items-center justify-center z-20">
            <motion.span 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-xs uppercase tracking-widest text-[#a37f1e] font-semibold block mb-4"
            >
              {t("youAreInvited")}
            </motion.span>

            {/* Couple calligraphy names */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="font-serif italic text-6xl md:text-7xl font-bold leading-tight my-2 text-foreground gold-gradient-text"
            >
              {weddingInfo.groomName} <span className="text-4xl md:text-5xl font-light italic text-[#c59b27]">&</span> {weddingInfo.brideName}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xs md:text-sm font-sans tracking-widest text-muted-foreground max-w-sm mt-3 uppercase"
            >
              {weddingInfo.tagline}
            </motion.p>

            {/* Save The Date / Reveal Ceremony */}
            <div className="mt-12 w-full flex flex-col items-center justify-center relative min-h-[200px]">
              <AnimatePresence mode="wait">
                {!isDateRevealed ? (
                  <motion.button
                    key="reveal-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDateReveal}
                    className="gold-gradient text-white px-8 py-4 rounded-full font-medium text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 duration-300 flex items-center gap-2 border border-yellow-200"
                  >
                    <Calendar className="h-4 w-4" />
                    {t("revealDate")}
                  </motion.button>
                ) : (
                  <motion.div
                    key="revealed-details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full text-center flex flex-col items-center"
                  >
                    <div className="gold-border rounded-2xl p-6 glass-card max-w-md w-full shadow-lg">
                      <span className="text-xs uppercase tracking-widest text-primary font-bold">The Vows Begin In</span>
                      
                      {/* Interactive Countdown */}
                      <LiveCountdown targetDate={weddingInfo.weddingDate} />

                      {/* Display Date Detail */}
                      <div className="border-t border-[#f2ece0] pt-4 mt-3">
                        <p className="font-serif italic text-2xl text-foreground font-semibold">
                          Saturday, November 28, 2026
                        </p>
                        <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground mt-1">
                          10:30 AM • Church Ceremony
                        </p>
                        <p className="text-xs font-serif text-[#c59b27] italic mt-2">
                          {weddingInfo.locationName}
                        </p>
                      </div>

                      {/* Share and Save Triggers */}
                      <div className="flex justify-center gap-3 mt-5 border-t border-[#f2ece0] pt-4">
                        <button
                          onClick={() => handleShare("whatsapp")}
                          className="glass-panel text-primary hover:text-accent p-2.5 rounded-full hover:scale-105 transition-transform"
                          title={t("shareWhatsapp")}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleShare("telegram")}
                          className="glass-panel text-primary hover:text-accent p-2.5 rounded-full hover:scale-105 transition-transform"
                          title="Share on Telegram"
                        >
                          <Send className="h-4 w-4 -rotate-45" />
                        </button>
                        <button
                          onClick={() => handleShare("email")}
                          className="glass-panel text-primary hover:text-accent p-2.5 rounded-full hover:scale-105 transition-transform"
                          title="Share via Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* 2. Couple Story Section */}
          <section className="w-full max-w-4xl mx-auto px-6 py-16 z-20">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Our Journey</span>
              <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                {t("ourStory")}
              </h2>
              <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
            </div>

            {/* Alternating Timeline Layout */}
            <div className="relative border-l-2 border-[#e5dfd1] dark:border-[#223830] ml-4 md:ml-0 md:grid md:grid-cols-2 md:gap-x-12 md:space-y-0 space-y-12">
              {/* Story 1: First Meeting */}
              <div className="relative pl-8 md:pl-0 md:text-right md:col-start-1 md:pr-8">
                {/* Timeline dot */}
                <div className="absolute left-[-9px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary border-4 border-background md:left-auto md:right-[-9px]" />
                <motion.div 
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -30 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="glass-card p-5 rounded-2xl border border-[#e5dfd1]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=400"
                    alt="First Meeting"
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest block mb-1">June 2022</span>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">{t("storyFirstMeeting")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "en" 
                      ? "A simple hello over aromatic coffee in Kochi sparked a conversation that went on for hours. We knew right away there was a spark." 
                      : "കൊച്ചിയിലെ ഒരു കഫേയിൽ വെച്ചുള്ള ലളിതമായ കൂടിക്കാഴ്ച മണിക്കൂറുകളോളം നീണ്ട സംഭാഷണമായി മാറി. അതൊരു പുതിയ തുടക്കമായിരുന്നു."}
                  </p>
                </motion.div>
              </div>

              {/* Story 2: Friendship */}
              <div className="relative pl-8 md:pl-8 md:col-start-2 md:pt-16">
                {/* Timeline dot */}
                <div className="absolute left-[-9px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary border-4 border-background md:left-[-9px]" />
                <motion.div 
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: 30 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="glass-card p-5 rounded-2xl border border-[#e5dfd1]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1529636798458-92182e65f133?q=80&w=400"
                    alt="Friendship"
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest block mb-1">December 2023</span>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">{t("storyFriendship")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "en"
                      ? "Late night drives, sharing playlists, and understanding each other's dreams. Friendship became the anchor of our lives."
                      : "രാത്രി യാത്രകളും, ഒരേ സംഗീതവും, സ്വപ്നങ്ങളും പരസ്പരം പങ്കുവെച്ച നാളുകൾ. ആ സൗഹൃദം ഞങ്ങളുടെ ജീവിതത്തിന്റെ നങ്കൂരമായി മാറി."}
                  </p>
                </motion.div>
              </div>

              {/* Story 3: Love Story */}
              <div className="relative pl-8 md:pl-0 md:text-right md:col-start-1 md:pr-8 md:pt-16">
                {/* Timeline dot */}
                <div className="absolute left-[-9px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary border-4 border-background md:left-auto md:right-[-9px]" />
                <motion.div 
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -30 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="glass-card p-5 rounded-2xl border border-[#e5dfd1]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400"
                    alt="Love Story"
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest block mb-1">February 2025</span>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">{t("storyLove")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "en"
                      ? "On a quiet sunset cruise along the backwaters, we realized that we didn't just want to be best friends—we wanted to spend forever together."
                      : "കായലിലൂടെയുള്ള ഒരു വൈകുന്നേരത്തെ യാത്രയിൽ, വെറും സുഹൃത്തുക്കൾ എന്നതിലുപരി ഒരുമിച്ചുള്ള ഒരു ജീവിതമാണ് ഞങ്ങൾ ആഗ്രഹിക്കുന്നതെന്ന് മനസ്സിലാക്കി."}
                  </p>
                </motion.div>
              </div>

              {/* Story 4: Engagement */}
              <div className="relative pl-8 md:pl-8 md:col-start-2 md:pt-16">
                {/* Timeline dot */}
                <div className="absolute left-[-9px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary border-4 border-background md:left-[-9px]" />
                <motion.div 
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: 30 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="glass-card p-5 rounded-2xl border border-[#e5dfd1]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400"
                    alt="Engagement"
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest block mb-1">June 2026</span>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">{t("storyEngagement")}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "en"
                      ? "Surrounded by families and loved ones, we put rings on each other's fingers, promising to walk side by side."
                      : "കുടുംബാംഗങ്ങളുടെയും പ്രിയപ്പെട്ടവരുടെയും സാന്നിധ്യത്തിൽ ഞങ്ങൾ മോതിരം മാറി, പരസ്പരം താങ്ങായിരിക്കുമെന്ന് പ്രതിജ്ഞ ചെയ്തു."}
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* 3. Event Schedule Section */}
          <section className="w-full bg-[#f4efe2] dark:bg-[#152721]/60 py-16 px-6 z-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs uppercase tracking-widest text-primary font-bold">The Celebrations</span>
                <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                  {t("schedule")}
                </h2>
                <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
              </div>

              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {events.map((ev, index) => (
                  <motion.div
                    key={ev.id}
                    whileInView={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 30 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="glass-card rounded-2xl overflow-hidden border border-[#e5dfd1] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6">
                        <span className="text-[10px] uppercase tracking-widest text-[#a37f1e] font-bold bg-[#faf8f5] px-2.5 py-1 rounded-full border border-primary/20">
                          {ev.date} • {ev.time}
                        </span>
                        <h3 className="font-serif text-xl font-bold text-foreground mt-4 mb-2">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                          {ev.description}
                        </p>
                        <div className="flex items-start gap-2 text-xs text-foreground/80 mt-2 font-medium">
                          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{ev.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-2">
                      <a
                        href={getGoogleCalendarUrl(ev)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 border border-primary text-primary hover:bg-primary hover:text-white rounded-full font-medium text-xs uppercase tracking-wider transition-all"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {t("googleCalendar")}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Venue Section */}
          <section className="w-full max-w-4xl mx-auto px-6 py-16 z-20">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">The Location</span>
              <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                {t("venue")}
              </h2>
              <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              {/* Map detail info */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <div className="glass-card p-6 rounded-2xl border border-[#e5dfd1] h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                      {weddingInfo.locationName}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                      {weddingInfo.locationAddress}
                    </p>

                    <div className="border-t border-[#f2ece0] pt-4 space-y-4">
                      <div>
                        <h4 className="text-xs uppercase tracking-wider font-bold text-primary mb-1">
                          {t("parking")}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {weddingInfo.parkingInfo}
                        </p>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-xs uppercase tracking-wider font-bold text-primary mb-1">
                          {t("contact")}
                        </h4>
                        <div className="space-y-2 text-xs">
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span>Groom side: {weddingInfo.contactGroom}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span>Bride side: {weddingInfo.contactBride}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(weddingInfo.locationAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-full font-medium text-xs uppercase tracking-wider shadow-md hover:bg-accent active:scale-95 transition-all"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("viewMap")}
                    </a>
                  </div>
                </div>
              </div>

              {/* Embedded Map iframe */}
              <div className="md:col-span-7 h-[300px] md:h-auto min-h-[350px] rounded-2xl overflow-hidden border border-[#e5dfd1] shadow-md">
                <iframe
                  src={weddingInfo.googleMapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Venue Google Map"
                />
              </div>
            </div>
          </section>

          {/* 5. RSVP Attendance Form Section */}
          <section className="w-full bg-[#ede7d9] dark:bg-[#152721] py-16 px-6 z-20">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-xs uppercase tracking-widest text-[#a37f1e] font-bold">R.S.V.P</span>
                <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                  {t("rsvp")}
                </h2>
                <p className="text-xs text-muted-foreground tracking-wide mt-2">
                  {t("rsvpSub")}
                </p>
                <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
              </div>

              {/* RSVP Form Card */}
              <div className="bg-white dark:bg-[#152721]/80 rounded-2xl border border-double border-[#c59b27] shadow-xl p-8 relative overflow-hidden">
                {rsvpSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-foreground">
                      {t("rsvpSuccess")}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      {rsvpStatus === "accepted"
                        ? `We are thrilled to celebrate our special day with you! We've registered ${rsvpAttendees} attendee(s) from your party.`
                        : "We are sorry you won't be able to join us. Your blessings and warm wishes mean a lot to us."}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="space-y-6">
                    {/* Dynamic greeting displaying guest name */}
                    <div className="p-4 rounded-xl bg-[#faf8f5] dark:bg-[#1e332c]/30 border border-[#e5dfd1] text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Invited Guest</p>
                      <h4 className="font-serif italic text-lg font-semibold text-primary mt-1">
                        {guest ? guest.greeting : "Family & Friends"}
                      </h4>
                    </div>

                    {/* Attendance Radio Selection */}
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                        Attendance
                      </span>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setRsvpStatus("accepted")}
                          className={`py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 ${
                            rsvpStatus === "accepted"
                              ? "bg-primary text-white border-primary shadow-md"
                              : "border-[#e5dfd1] bg-white/50 text-[#766f64] hover:bg-white"
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          {t("rsvpAccept")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRsvpStatus("declined")}
                          className={`py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 ${
                            rsvpStatus === "declined"
                              ? "bg-[#981e2b] text-white border-[#981e2b] shadow-md"
                              : "border-[#e5dfd1] bg-white/50 text-[#766f64] hover:bg-white"
                          }`}
                        >
                          <User className="h-4 w-4" />
                          {t("rsvpDecline")}
                        </button>
                      </div>
                    </div>

                    {/* Attendees Count (only visible if accepted) */}
                    {rsvpStatus === "accepted" && (
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                          {t("guestsCount")}
                        </label>
                        <select
                          value={rsvpAttendees}
                          onChange={(e) => setRsvpAttendees(parseInt(e.target.value, 10))}
                          className="w-full px-4 py-3 rounded-xl border border-[#e5dfd1] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        >
                          {Array.from({ length: guest?.allowedAttendees || 5 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1} {i === 0 ? "Person" : "People"} (Max {guest?.allowedAttendees || 5})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Personal Message */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                        {t("wishesLabel")}
                      </label>
                      <textarea
                        rows={3}
                        value={rsvpMessage}
                        onChange={(e) => setRsvpMessage(e.target.value)}
                        placeholder="Write a warm note for Albin & Stella..."
                        className="w-full px-4 py-3 rounded-xl border border-[#e5dfd1] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isRsvpSubmitting}
                      className="w-full py-4 bg-primary text-white rounded-full font-medium text-xs uppercase tracking-widest shadow-md hover:bg-accent active:scale-95 disabled:bg-muted-foreground transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      {isRsvpSubmitting ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {t("submitRsvp")}
                          <Send className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* 6. Wedding Gallery Section */}
          <section className="w-full max-w-5xl mx-auto px-6 py-16 z-20">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Captured Moments</span>
              <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                {t("gallery")}
              </h2>
              <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
            </div>

            <WeddingGallery />
          </section>

          {/* 7. Video Section */}
          <section className="w-full bg-[#f4efe2] dark:bg-[#152721]/60 py-16 px-6 z-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs uppercase tracking-widest text-primary font-bold">Featured Video</span>
                <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                  {t("video")}
                </h2>
                <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
              </div>

              {/* Custom Video Wrapper */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl border border-[#e5dfd1]">
                <video
                  src={weddingInfo.videoUrl}
                  controls
                  preload="metadata"
                  className="w-full h-full object-cover"
                  poster="https://images.unsplash.com/photo-1519225495810-7517cbd14560?q=80&w=800"
                />
              </div>
            </div>
          </section>

          {/* 8. Wishes Wall Section */}
          <section className="w-full max-w-4xl mx-auto px-6 py-16 z-20">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Blessings board</span>
              <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                {t("wishes")}
              </h2>
              <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
            </div>

            <WishesWall />
          </section>

          {/* 9. Family Section */}
          <section className="w-full bg-[#ede7d9] dark:bg-[#152721] py-16 px-6 z-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs uppercase tracking-widest text-[#a37f1e] font-bold">Loved Ones</span>
                <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                  {t("family")}
                </h2>
                <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Groom's Family */}
                <motion.div 
                  whileInView={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 30 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-[#152721]/80 rounded-2xl p-8 border border-[#e5dfd1] shadow-lg text-center"
                >
                  <span className="text-xs uppercase tracking-widest text-primary font-bold">{t("groomSide")}</span>
                  
                  <div className="my-6 space-y-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Parents</h4>
                      <p className="font-serif text-lg font-bold text-foreground mt-1">{weddingInfo.groomParents}</p>
                    </div>
                    
                    <div className="w-12 h-[1px] bg-[#e5dfd1] mx-auto" />

                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Siblings</h4>
                      <p className="font-serif text-lg font-bold text-foreground mt-1">{weddingInfo.groomSiblings}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Bride's Family */}
                <motion.div 
                  whileInView={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 30 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-[#152721]/80 rounded-2xl p-8 border border-[#e5dfd1] shadow-lg text-center"
                >
                  <span className="text-xs uppercase tracking-widest text-primary font-bold">{t("brideSide")}</span>
                  
                  <div className="my-6 space-y-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Parents</h4>
                      <p className="font-serif text-lg font-bold text-foreground mt-1">{weddingInfo.brideParents}</p>
                    </div>
                    
                    <div className="w-12 h-[1px] bg-[#e5dfd1] mx-auto" />

                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Siblings</h4>
                      <p className="font-serif text-lg font-bold text-foreground mt-1">{weddingInfo.brideSiblings}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* 10. FAQ Section */}
          <section className="w-full max-w-2xl mx-auto px-6 py-16 z-20">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Quick Guide</span>
              <h2 className="font-serif italic text-3xl md:text-4xl text-foreground font-bold mt-1">
                {t("faq")}
              </h2>
              <div className="w-16 h-[1px] bg-primary mx-auto mt-3" />
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <div 
                    key={index} 
                    className="border border-[#e5dfd1] rounded-xl overflow-hidden glass-card transition-all duration-300"
                  >
                    <button
                      onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left text-foreground font-serif font-bold text-sm tracking-wide bg-white/30 hover:bg-white/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-4 w-4 text-primary" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 pt-2 text-xs text-muted-foreground leading-relaxed border-t border-[#f2ece0]">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full py-10 text-center border-t border-[#e5dfd1] bg-[#faf8f5] dark:bg-[#0f1c18] text-xs text-muted-foreground z-20 mt-auto">
            <p className="font-serif italic text-base text-[#1c1a17] dark:text-[#fdfcf7] font-semibold mb-1">
              Albin & Stella
            </p>
            <p className="tracking-widest uppercase mb-4 text-[9px]">November 28, 2026 • Kochi, India</p>
            <p className="opacity-75">Made with love for our special day.</p>
          </footer>
        </motion.div>
      )}
    </div>
  );
};

export default InvitationMain;
