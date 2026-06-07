"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Heart, Send, Check } from "lucide-react";
import { getWishes, submitWish, Wish } from "../lib/db";
import { useLanguage } from "../context/LanguageContext";

export const WishesWall: React.FC = () => {
  const { t } = useLanguage();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("❤️");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emojis = ["❤️", "💍", "✨", "🎉", "🥂", "🌸", "⛪"];

  const loadWishes = async () => {
    try {
      const data = await getWishes(false); // only approved wishes
      setWishes(data);
    } catch (err) {
      console.error("Failed to load wishes:", err);
    }
  };

  useEffect(() => {
    loadWishes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await submitWish(name.trim(), message.trim(), selectedEmoji);
      setName("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      loadWishes(); // reload list
    } catch (err) {
      console.error(err);
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
            No messages posted yet. Be the first to bless the couple!
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
                    "{w.message}"
                  </p>
                  <div className="flex items-center justify-between border-t border-[#f2ece0] pt-2">
                    <span className="text-xs font-serif font-semibold text-primary">
                      — {w.guestName}
                    </span>
                    <span className="text-base select-none" role="img" aria-label="emoji decoration">
                      {w.emoji}
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
            <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              {t("yourName")}
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 rounded-lg border border-[#e5dfd1] bg-white/50 focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              {t("wishesLabel")}
            </label>
            <textarea
              required
              rows={3}
              disabled={isSubmitting}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("writeWishMsg")}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e5dfd1] bg-white/50 focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all resize-none"
            />
          </div>

          {/* Emoji Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Select Emoji
            </label>
            <div className="flex gap-2 flex-wrap">
              {emojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setSelectedEmoji(em)}
                  className={`text-lg p-1.5 rounded-lg transition-transform active:scale-90 ${
                    selectedEmoji === em ? "bg-primary/20 border border-primary scale-110" : "bg-white/30 border border-transparent"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium"
                >
                  <Check className="h-4 w-4" />
                  {t("wishPosted")}
                </motion.div>
              ) : (
                <div />
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-medium text-xs uppercase tracking-wider transition-all hover:bg-accent active:scale-95 disabled:bg-muted-foreground"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t("postWish")}
                  <Send className="h-3 w-3" />
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
