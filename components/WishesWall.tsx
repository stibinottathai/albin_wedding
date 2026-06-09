"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Check, Heart, Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface Wish {
  id: string;
  guestName: string;
  message: string;
  approved: boolean;
  timestamp: string;
}

const ITEMS_PER_PAGE = 10;

function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-8 max-w-md mx-auto">
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#e5dfd1]" />
      <Heart className="w-3.5 h-3.5 text-[#735c00] fill-[#735c00] opacity-60" />
      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#e5dfd1]" />
    </div>
  );
}

export const WishesWall: React.FC<{ groomName?: string; brideName?: string }> = ({ 
  groomName = "Albin", 
  brideName = "Sandra" 
}) => {
  const { t } = useLanguage();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const loadWishes = async (currentOffset: number = 0, append: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wishes?limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`);
      if (!res.ok) throw new Error("Failed to fetch wishes");
      const result = await res.json();
      
      const newWishes = Array.isArray(result.data) ? result.data : [];
      
      if (append) {
        setWishes(prev => [...prev, ...newWishes]);
      } else {
        setWishes(newWishes);
      }
      
      setTotal(result.total || 0);
      setHasMore(currentOffset + ITEMS_PER_PAGE < (result.total || 0));
    } catch (err) {
      console.error("Failed to load wishes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishes(0, false);
  }, []);

  const handleLoadMore = () => {
    const nextOffset = offset + ITEMS_PER_PAGE;
    setOffset(nextOffset);
    loadWishes(nextOffset, true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !message.trim()) return;
    if (name.trim().length > 20 || message.trim().length > 200) return;

    // Optimistic UI update
    const optimisticWish: Wish = {
      id: Math.random().toString(36).substring(2, 11),
      guestName: name.trim(),
      message: message.trim(),
      approved: true, // Optimistically show it
      timestamp: new Date().toISOString()
    };
    
    // Add to top of list immediately
    setWishes(prev => [optimisticWish, ...prev]);
    setTotal(prev => prev + 1);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: name.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit wish");
        return;
      }

      const data = await res.json();

      setName("");
      setMessage("");
      // Update optimistic wish with actual data
      setWishes(prev => prev.map(w => 
        w.id === optimisticWish.id ? { ...w, ...data } : w
      ));
      setIsPending(data.approved === false);
      
      // Delay showing the success text until after loading finishes
      setTimeout(() => {
        setSubmitted(false);
        setIsPending(false);
      }, 5000);
      
    } catch (err) {
      console.error(err);
      setError("Failed to submit wish. Please try again.");
    } finally {
      setIsSubmitting(false);
      if (!error) {
        setSubmitted(true);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      
      {/* Wishes Display Wall */}
      <div className="relative">
        <div className="text-center mb-8">
          <h3 className="font-serif italic text-3xl text-[#1c1a17] font-bold">Wishes Wall</h3>
          <p className="text-[#735c00] mt-1 text-sm">{total} beautiful wishes</p>
          <div className="w-16 h-px bg-[#c59b27] mx-auto mt-4" />
        </div>

        {wishes.length === 0 && !isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#735c00]/60 italic font-serif bg-white/30 backdrop-blur-sm rounded-2xl border border-[#e5dfd1] border-dashed">
            <MessageSquare className="h-10 w-10 mb-3 opacity-40 text-[#c59b27]" />
            <p className="text-lg">No wishes posted yet.</p>
            <p className="text-sm">Be the first to bless the couple!</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto pr-3 pl-1 pb-4 styled-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-4">
              <AnimatePresence mode="popLayout">
                {wishes.map((w, index) => (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index % ITEMS_PER_PAGE * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="bg-white/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow p-6 rounded-xl border border-[#e5dfd1] flex flex-col justify-between relative group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#c59b27] to-[#735c00] rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="mb-4 text-left relative">
                      <span className="text-[#c59b27]/20 text-4xl absolute -top-4 -left-2 font-serif select-none">"</span>
                      <p className="text-[15px] font-sans italic text-[#4d4635] leading-relaxed relative z-10 pl-3 pt-2">
                        {w.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-[#f2ece0] pt-3 mt-auto">
                      <span className="text-sm font-serif font-bold text-[#735c00]">
                        — {w.guestName}
                      </span>
                      <span className="text-[10px] text-[#4d4635]/50 font-sans tracking-wide">
                        {new Date(w.timestamp).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {hasMore && wishes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-6 mb-4"
              >
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-full border border-[#c59b27] text-[#735c00] font-semibold text-xs uppercase tracking-widest hover:bg-[#c59b27] hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Messages"
                  )}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="text-center mb-10 mt-20">
        <p className="sans text-xs uppercase tracking-[0.25em] text-[#4d4635] font-semibold mb-2">Blessings</p>
        <h2 className="font-headline-lg text-4xl md:text-5xl text-[#735c00] mb-4 serif font-light">{t("wishes") || "Wishes Wall"}</h2>
        <SectionDivider />
      </div>

      {/* Redesigned Wishes Submitting Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#c59b27]/30 shadow-xl relative overflow-hidden mt-12 bg-white/40 backdrop-blur-md max-w-2xl mx-auto"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#c59b27]/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#735c00]/10 to-transparent rounded-tr-full" />
        
        <div className="text-center mb-6">
          <Heart className="w-6 h-6 mx-auto text-[#c59b27] mb-2" />
          <h3 className="font-serif italic text-2xl text-[#1c1a17] font-bold">
            {t("sendWish") || "Bless the Couple"}
          </h3>
          <p className="text-sm text-[#4d4635] mt-2">Leave a special message for {groomName} and {brideName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs uppercase tracking-wider text-[#4d4635] font-semibold">
                {t("yourName") || "Your Name"}
              </label>
              <span className={`text-[10px] ${name.length > 18 ? "text-amber-600 font-bold" : "text-[#4d4635]/60"}`}>
                {name.length}/20
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={20}
              disabled={isSubmitting}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-xl border border-[#e5dfd1] bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#735c00]/40 focus:border-[#735c00] text-sm transition-all shadow-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs uppercase tracking-wider text-[#4d4635] font-semibold">
                {t("wishesLabel") || "Your Wish"}
              </label>
              <span className={`text-[10px] ${message.length > 180 ? "text-amber-600 font-bold" : "text-[#4d4635]/60"}`}>
                {message.length}/200
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={200}
              disabled={isSubmitting}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("writeWishMsg") || "Write your warmest wishes here..."}
              className="w-full px-4 py-3 rounded-xl border border-[#e5dfd1] bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#735c00]/40 focus:border-[#735c00] text-sm transition-all resize-none shadow-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium border border-emerald-100"
                >
                  <Check className="h-4 w-4" />
                  {isPending ? "Wishes submitted! Thank you for your wishes." : (t("wishPosted") || "Successfully posted!")}
                </motion.div>
              ) : (
                <div key="empty" />
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: "#735c00", color: "#fff" }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-xs uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ml-auto"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t("postWish") || "Send Wish"}
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

          </div>
  );
};
export default WishesWall;
