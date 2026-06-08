"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Heart } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { WeddingInfo } from "../lib/db";

interface EnvelopeProps {
  guestName?: string;
  onOpened: () => void;
  weddingInfo: WeddingInfo;
}

export const Envelope: React.FC<EnvelopeProps> = ({ guestName, onOpened, weddingInfo }) => {
  const { t } = useLanguage();
  const [isOpening, setIsOpening] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);

  // Snappy, simplified timing without the upward slide-out delay
  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    // Seal fades immediately (0 - 200ms)
    // Flap starts rotating open at 300ms
    setTimeout(() => setIsFlapOpen(true), 300);
    // Entire envelope fades out to show the main landing page at 1300ms
    setTimeout(() => onOpened(), 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4 py-6"
      style={{ background: "linear-gradient(135deg, #2c241e 0%, #1f1b17 50%, #151210 100%)" }}>

      {/* Subtle gold floral pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, var(--sage) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Top text (Responsive font size and margin) */}
      <AnimatePresence>
        {!isOpening && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.3 }} 
            className="mb-6 sm:mb-10 text-center"
          >
            <p className="sans text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-[var(--sage-light)] font-semibold mb-2">
              {t("youAreInvited")}
            </p>
            <h2 className="serif italic text-2xl sm:text-3xl md:text-4xl text-[var(--cream)] font-light">{weddingInfo.groomName} & {weddingInfo.brideName}</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The Envelope (Responsive max width for narrow screens) ── */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.08, opacity: 0, filter: "blur(12px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[340px] sm:max-w-md"
        style={{ perspective: "2000px" }}
      >
        {/* Envelope shadow */}
        <div className="absolute -inset-x-4 bottom-0 h-10 blur-2xl opacity-40"
          style={{ background: "linear-gradient(to right, var(--sage), var(--dusty-rose))" }} />

        {/* Envelope body */}
        <div className="relative w-full rounded-2xl overflow-visible"
          style={{
            boxShadow: "0 30px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(210,197,175,0.15)",
          }}>

          {/* Envelope base */}
          <div className="relative bg-[#fdf8f5] rounded-2xl overflow-hidden"
            style={{ aspectRatio: "1.6 / 1" }}>

            {/* Envelope inner lining (subtle dusty rose / gold pattern) */}
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "linear-gradient(135deg, var(--rose-light) 25%, transparent 25%, transparent 50%, var(--rose-light) 50%, var(--rose-light) 75%, transparent 75%, transparent)", backgroundSize: "14px 14px" }} />

            {/* Left side panel */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ clipPath: "polygon(0 0, 50% 52%, 0 100%)", background: "linear-gradient(to right, #fbf2eb, #f5ece5)" }} />
            {/* Right side panel */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ clipPath: "polygon(100% 0, 50% 52%, 100% 100%)", background: "linear-gradient(to left, #fbf2eb, #f5ece5)" }} />
            {/* Bottom flap */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ clipPath: "polygon(0 100%, 50% 52%, 100% 100%)", background: "linear-gradient(to top, #f0e7df, #f5ece5)" }} />

            {/* Invitation card inside (stays in the envelope, lifts slightly for card peek effect) */}
            <motion.div
              className="absolute rounded-xl overflow-hidden"
              style={{
                left: "8%", right: "8%", top: "6%", height: "88%",
                zIndex: 5,
                background: "var(--cream)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                willChange: "transform",
              }}
              initial={{ y: 0 }}
              animate={
                isFlapOpen ? { y: "-8%" } : { y: 0 }
              }
              transition={{ type: "spring", stiffness: 85, damping: 14 }}
            >
              {/* Card inner border */}
              <div className="absolute inset-2 sm:inset-3 border border-[var(--primary)]/20 rounded-lg pointer-events-none" />

              {/* Corner ornaments */}
              {[["top-2 left-2", "border-t border-l"], ["top-2 right-2", "border-t border-r"],
                ["bottom-2 left-2", "border-b border-l"], ["bottom-2 right-2", "border-b border-r"]].map(([pos, border], i) => (
                <div key={i} className={`absolute ${pos} w-3 h-3 sm:w-4 sm:h-4 ${border} border-[var(--primary)]/40`} />
              ))}

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 sm:gap-3 p-3 sm:p-4">
                <span className="sans text-[8px] sm:text-[9px] uppercase tracking-[0.35em] text-[var(--sage-dark)] font-semibold">
                  {t("saveTheDate")}
                </span>

                {/* Decorative sprig */}
                <div className="flex items-center gap-1.5 sm:gap-2 opacity-60">
                  <div className="h-px w-6 sm:w-8 bg-[var(--primary)]" />
                  <Heart className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-[var(--primary)] fill-[var(--primary)]" />
                  <div className="h-px w-6 sm:w-8 bg-[var(--primary)]" />
                </div>

                <h2 className="serif italic font-light text-2xl sm:text-3xl md:text-4xl text-[var(--charcoal)] text-center leading-tight">
                  {weddingInfo.groomName} <span className="text-lg sm:text-xl text-[var(--muted-text)]">&amp;</span> {weddingInfo.brideName}
                </h2>

                <div className="flex items-center gap-1.5 sm:gap-2 opacity-60 mt-0.5">
                  <div className="h-px w-6 sm:w-8 bg-[var(--primary)]" />
                  <Heart className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-[var(--primary)] fill-[var(--primary)]" />
                  <div className="h-px w-6 sm:w-8 bg-[var(--primary)]" />
                </div>

                <div className="text-center space-y-0.5 mt-0.5">
                  <p className="sans text-[8px] sm:text-[9px] text-[var(--muted-text)] tracking-[0.2em] uppercase">Kochi · Kerala</p>
                </div>

                {guestName && (
                  <div className="mt-1 sm:mt-1.5 text-center border-t border-[var(--border-warm)]/40 pt-1.5 sm:pt-2 w-full">
                    <p className="sans text-[8px] uppercase tracking-[0.2em] text-[var(--muted-text)] mb-0.5">For</p>
                    <p className="serif italic text-sm sm:text-base text-[var(--primary)] font-semibold truncate px-2">{guestName}</p>
                  </div>
                )}

                <ChevronDown className="w-3.5 h-3.5 text-[var(--primary)] animate-bounce mt-0.5 opacity-70" />
              </div>
            </motion.div>

            {/* Top flap (Responsive 3D rotation with spring animation) */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-1/2 origin-top"
              style={{
                clipPath: "polygon(0 0, 50% 100%, 100% 0)",
                background: "linear-gradient(to bottom, #fffdfb, #f5ece5)",
                zIndex: isFlapOpen ? 4 : 20,
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                willChange: "transform",
              }}
              animate={isOpening ? { rotateX: 180 } : { rotateX: 0 }}
              transition={{ type: "spring", stiffness: 95, damping: 15 }}
            />

            {/* Wax seal (Pops closed immediately to prevent overlapping) */}
            {!isFlapOpen && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 25 }}>
                <motion.button
                  onClick={handleOpen}
                  animate={isOpening
                    ? { scale: 0, opacity: 0 }
                    : { scale: [1, 1.03, 1] }}
                  transition={isOpening
                    ? { duration: 0.2, ease: "easeOut" }
                    : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="relative w-20 h-20 flex items-center justify-center focus:outline-none cursor-pointer"
                >
                  {/* Warm glow */}
                  <div className="absolute inset-0 rounded-full blur-xl opacity-40"
                    style={{ background: "radial-gradient(circle, var(--sage), var(--dusty-rose))" }} />

                  {/* Wax seal body — Champagne Gold */}
                  <div className="relative w-15 h-15 rounded-full flex items-center justify-center"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, var(--sage), var(--sage-dark))",
                      boxShadow: "0 8px 18px rgba(115,92,0,0.35), inset 0 2px 4px rgba(255,255,255,0.25)",
                    }}>
                    {/* Inner ring */}
                    <div className="absolute inset-[5px] rounded-full border border-[var(--sage-light)]/45" />
                    {/* Monogram */}
                    <span className="serif italic text-white text-lg font-light shadow-sm">
                      {weddingInfo.groomName[0]}&{weddingInfo.brideName[0]}
                    </span>
                  </div>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hint (Responsive margins) */}
      <AnimatePresence>
        {!isOpening && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 sm:mt-10 sans text-[9px] uppercase tracking-[0.3em] text-[var(--sage-light)] animate-pulse"
          >
            {t("clickSeal")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Envelope;
