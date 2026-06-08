"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Heart } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface EnvelopeProps {
  guestName?: string;
  onOpened: () => void;
}

export const Envelope: React.FC<EnvelopeProps> = ({ guestName, onOpened }) => {
  const { t } = useLanguage();
  const [isOpening, setIsOpening] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [isCardSlidOut, setIsCardSlidOut] = useState(false);

  const handleOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    setTimeout(() => setIsFlapOpen(true), 400);
    setTimeout(() => setIsCardSlidOut(true), 1200);
    setTimeout(() => onOpened(), 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2c241e 0%, #1f1b17 50%, #151210 100%)" }}>

      {/* Subtle gold floral pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, var(--sage) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Top text */}
      <AnimatePresence>
        {!isOpening && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.5 }} className="mb-12 text-center">
            <p className="sans text-[10px] uppercase tracking-[0.4em] text-[var(--sage-light)] font-semibold mb-2">
              {t("youAreInvited")}
            </p>
            <h2 className="serif italic text-3xl md:text-4xl text-[var(--cream)] font-light">Albin & Stella</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The Envelope ── */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.08, opacity: 0, filter: "blur(12px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md px-4"
        style={{ perspective: "2000px" }}
      >
        {/* Envelope shadow */}
        <div className="absolute -inset-x-4 bottom-0 h-12 blur-2xl opacity-40"
          style={{ background: "linear-gradient(to right, var(--sage), var(--dusty-rose))" }} />

        {/* Envelope body */}
        <div className="relative w-full rounded-2xl overflow-visible"
          style={{
            boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(210,197,175,0.15)",
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

            {/* Invitation card inside */}
            <motion.div
              className="absolute rounded-xl overflow-hidden"
              style={{
                left: "8%", right: "8%", top: "6%", height: "88%",
                zIndex: isCardSlidOut ? 30 : 5,
                background: "var(--cream)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              }}
              initial={{ y: 0 }}
              animate={
                isCardSlidOut
                  ? { y: "-50%", scale: 1.04, boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }
                  : isFlapOpen ? { y: "-14%" } : { y: 0 }
              }
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Card inner border */}
              <div className="absolute inset-3 border border-[var(--primary)]/20 rounded-lg pointer-events-none" />

              {/* Corner ornaments */}
              {[["top-2 left-2", "border-t border-l"], ["top-2 right-2", "border-t border-r"],
                ["bottom-2 left-2", "border-b border-l"], ["bottom-2 right-2", "border-b border-r"]].map(([pos, border], i) => (
                <div key={i} className={`absolute ${pos} w-4 h-4 ${border} border-[var(--primary)]/40`} />
              ))}

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                <span className="sans text-[9px] uppercase tracking-[0.35em] text-[var(--sage-dark)] font-semibold">
                  {t("saveTheDate")}
                </span>

                {/* Decorative sprig */}
                <div className="flex items-center gap-2 opacity-60">
                  <div className="h-px w-8 bg-[var(--primary)]" />
                  <Heart className="w-2 h-2 text-[var(--primary)] fill-[var(--primary)]" />
                  <div className="h-px w-8 bg-[var(--primary)]" />
                </div>

                <h2 className="serif italic font-light text-3xl md:text-4xl text-[var(--charcoal)] text-center leading-tight">
                  Albin <span className="text-xl text-[var(--muted-text)]">&amp;</span> Stella
                </h2>

                <div className="flex items-center gap-2 opacity-60 mt-0.5">
                  <div className="h-px w-8 bg-[var(--primary)]" />
                  <Heart className="w-2 h-2 text-[var(--primary)] fill-[var(--primary)]" />
                  <div className="h-px w-8 bg-[var(--primary)]" />
                </div>

                <div className="text-center space-y-0.5 mt-0.5">
                  <p className="sans text-[10px] text-[var(--charcoal)] tracking-widest uppercase font-semibold">November 28, 2026</p>
                  <p className="sans text-[9px] text-[var(--muted-text)] tracking-[0.2em] uppercase">Kochi · Kerala</p>
                </div>

                {guestName && (
                  <div className="mt-1.5 text-center border-t border-[var(--border-warm)]/40 pt-2 w-full">
                    <p className="sans text-[8px] uppercase tracking-[0.2em] text-[var(--muted-text)] mb-0.5">For</p>
                    <p className="serif italic text-base text-[var(--primary)] font-semibold">{guestName}</p>
                  </div>
                )}

                <ChevronDown className="w-3.5 h-3.5 text-[var(--primary)] animate-bounce mt-0.5 opacity-70" />
              </div>
            </motion.div>

            {/* Top flap */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-1/2 origin-top"
              style={{
                clipPath: "polygon(0 0, 50% 100%, 100% 0)",
                background: "linear-gradient(to bottom, #fffdfb, #f5ece5)",
                zIndex: isFlapOpen ? 4 : 20,
                transformStyle: "preserve-3d",
              }}
              animate={isOpening ? { rotateX: 180 } : { rotateX: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Wax seal */}
            {!isFlapOpen && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 25 }}>
                <motion.button
                  onClick={handleOpen}
                  animate={isOpening
                    ? { scale: [1, 1.15, 0], opacity: [1, 1, 0] }
                    : { scale: [1, 1.03, 1] }}
                  transition={isOpening
                    ? { duration: 0.7, ease: "anticipate" }
                    : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className="relative w-20 h-20 flex items-center justify-center focus:outline-none cursor-pointer"
                >
                  {/* Warm glow */}
                  <div className="absolute inset-0 rounded-full blur-xl opacity-40"
                    style={{ background: "radial-gradient(circle, var(--sage), var(--dusty-rose))" }} />

                  {/* Wax seal body — Champagne Gold */}
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, var(--sage), var(--sage-dark))",
                      boxShadow: "0 8px 20px rgba(115,92,0,0.4), inset 0 2px 4px rgba(255,255,255,0.25)",
                    }}>
                    {/* Inner ring */}
                    <div className="absolute inset-[6px] rounded-full border border-[var(--sage-light)]/45" />
                    {/* Monogram */}
                    <span className="serif italic text-white text-xl font-light" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                      A&S
                    </span>
                  </div>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hint */}
      <AnimatePresence>
        {!isOpening && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            className="mt-10 sans text-[10px] uppercase tracking-[0.3em] text-[var(--sage-light)] animate-pulse">
            {t("clickSeal")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Envelope;

