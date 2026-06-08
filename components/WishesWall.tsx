"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface Wish {
  id: string;
  guestName: string;
  message: string;
  approved: boolean;
  timestamp: string;
}

export const WishesWall: React.FC = () => {
  const { t } = useLanguage();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const loadWishes = async () => {
    try {
      const res = await fetch("/api/wishes");
      if (!res.ok) throw new Error("Failed to fetch wishes");
      const data = await res.json();
      setWishes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load wishes:", err);
    }
  };

  useEffect(() => {
    loadWishes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !message.trim()) return;
    if (name.trim().length > 20 || message.trim().length > 300) return;

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

      setName("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      await loadWishes();
    } catch (err) {
      console.error(err);
      setError("Failed to submit wish. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Wishes Display Board */}
      <div className="relative h-[250px] overflow-y-auto mb-10 pr-2 border border-[#e5dfd1] rounded-2xl bg-[#faf8f5] p-4 shadow-inner">
        {wishes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic text-sm">
            <MessageSquare className="h-8 w-8 mb-2 opacity-40 text-primary" />
            No wishes posted yet. Be the first to bless the couple!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {wishes.map((w, index) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.4 }}
                  className="glass-card p-4 rounded-xl border border-double border-[#e5dfd1] flex flex-col justify-between"
                >
                  <p className="text-sm font-sans italic text-foreground mb-3 leading-relaxed">
                    &ldquo;{w.message}&rdquo;
                  </p>
                  <div className="flex items-center border-t border-[#f2ece0] pt-2">
                    <span className="text-xs font-serif font-semibold text-primary">
                      — {w.guestName}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Wishes Submission Form */}
      <motion.div
        layout
        className="glass-panel p-6 rounded-2xl border border-[#c59b27] shadow-lg relative overflow-hidden"
      >
        <h3 className="font-serif italic text-xl text-center text-[#1c1a17] font-bold mb-4">
          {t("sendWish")}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs uppercase tracking-wider text-[#4d4635] font-semibold">
                {t("yourName")}
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
              className="w-full px-4 py-2.5 rounded-lg border border-[#e5dfd1] bg-white/50 focus:outline-none focus:ring-1 focus:ring-[#735c00] text-sm transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs uppercase tracking-wider text-[#4d4635] font-semibold">
                {t("wishesLabel")}
              </label>
              <span className={`text-[10px] ${message.length > 280 ? "text-amber-600 font-bold" : "text-[#4d4635]/60"}`}>
                {message.length}/300
              </span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={300}
              disabled={isSubmitting}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("writeWishMsg")}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e5dfd1] bg-white/50 focus:outline-none focus:ring-1 focus:ring-[#735c00] text-sm transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium"
                >
                  <Check className="h-4 w-4" />
                  {t("wishPosted")}
                </motion.div>
              ) : (
                <div key="empty" />
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: "#735c00", color: "#fff" }}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-xs uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t("postWish")}
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
