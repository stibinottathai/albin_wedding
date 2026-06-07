"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ChevronDown } from "lucide-react";
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

    // Timeline of animations:
    // 1. Open the flap (0.8s)
    setTimeout(() => {
      setIsFlapOpen(true);
    }, 400);

    // 2. Slide the card out (1s)
    setTimeout(() => {
      setIsCardSlidOut(true);
    }, 1200);

    // 3. Fade out the envelope and reveal the website (1.2s)
    setTimeout(() => {
      onOpened();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0c1612] via-[#15231e] to-[#0a120f] px-4 overflow-hidden">
      {/* Rich Gold Dust Background patterns */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg aspect-[4/3] flex items-center justify-center perspective-[2000px]"
      >
        {/* Envelope Body with 3D drop shadow */}
        <div className="relative w-full h-full rounded-lg shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),0_20px_40px_-10px_rgba(212,175,55,0.1)] bg-[#fdfbf7] overflow-visible border border-[#e8dfc8]">
          
          {/* Subtle Paper Texture inside envelope */}
          <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none rounded-lg bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />

          {/* Back Flap (visible when envelope is open) */}
          <div className="absolute inset-0 rounded-lg bg-[#f0eadd] border-b border-[#d8cbb0] overflow-hidden">
            {/* Elegant Inner Lining pattern */}
            <div className="w-full h-full opacity-40 bg-[linear-gradient(45deg,transparent_25%,rgba(212,175,55,0.1)_25%,rgba(212,175,55,0.1)_50%,transparent_50%,transparent_75%,rgba(212,175,55,0.1)_75%,rgba(212,175,55,0.1)_100%)] bg-[size:20px_20px]" />
          </div>

          {/* Dynamic Invitation Card sliding out */}
          <AnimatePresence>
            <motion.div
              className="absolute left-4 right-4 bg-gradient-to-br from-[#ffffff] via-[#fdfcf8] to-[#f4f0e6] rounded shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,1),inset_0_0_20px_rgba(212,175,55,0.05)] border border-[#e8dfc8] p-3 text-center select-none flex flex-col justify-between"
              style={{
                top: "6%",
                height: "88%",
                zIndex: isCardSlidOut ? 30 : 5,
              }}
              initial={{ y: 0, scale: 0.95 }}
              animate={
                isCardSlidOut
                  ? { y: "-48%", scale: 1.05, rotate: -1.5, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5), 0 20px 30px -10px rgba(212,175,55,0.15), inset 0 2px 5px rgba(255,255,255,1)" }
                  : isFlapOpen
                  ? { y: "-15%", scale: 0.98 }
                  : { y: 0, scale: 0.95 }
              }
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Subtle Botanical/Damask Watermark */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/floral-flourish.png')] mix-blend-multiply" />
              
              {/* Inner Frame - Double border style */}
              <div className="relative h-full w-full p-6 flex flex-col items-center justify-between border-[1px] border-[#d4af37]/60">
                <div className="absolute inset-1 border-[0.5px] border-[#d4af37]/30" />
                
                {/* Intricate Corner Ornaments (using CSS borders to simulate) */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#d4af37] bg-[#fcfbf8] shadow-[inset_1px_1px_0_rgba(255,255,255,1)]" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#d4af37] bg-[#fcfbf8] shadow-[inset_-1px_1px_0_rgba(255,255,255,1)]" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#d4af37] bg-[#fcfbf8] shadow-[inset_1px_-1px_0_rgba(255,255,255,1)]" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#d4af37] bg-[#fcfbf8] shadow-[inset_-1px_-1px_0_rgba(255,255,255,1)]" />

                <div className="relative flex flex-col items-center space-y-5 pt-6 z-10">
                  <span className="text-[9px] tracking-[0.4em] uppercase text-[#a68a29] font-semibold drop-shadow-[0_1px_0_rgba(255,255,255,1)]">
                    {t("saveTheDate")}
                  </span>

                  <div className="my-4 text-center">
                    {/* Gold Foil Text Effect */}
                    <h2 
                      className="calligraphy text-5xl md:text-6xl font-serif mb-3 font-medium"
                      style={{
                        background: "linear-gradient(to bottom right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.15)) drop-shadow(0px -1px 0px rgba(255,255,255,0.8))"
                      }}
                    >
                      Albin & Stella
                    </h2>
                    <p className="text-[10px] tracking-[0.25em] text-[#706654] mt-4 uppercase font-medium drop-shadow-[0_1px_0_rgba(255,255,255,1)]">
                      {t("youAreInvited")}
                    </p>
                  </div>
                </div>

                {/* Decorative Centerpiece Divider */}
                <div className="relative flex items-center justify-center w-full my-6 opacity-80 z-10">
                  <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                  <div className="mx-3 flex items-center justify-center rotate-45 w-2 h-2 border border-[#d4af37] bg-[#fcfbf8] shadow-[0_0_2px_rgba(212,175,55,0.5)]">
                    <div className="w-1 h-1 bg-[#d4af37]" />
                  </div>
                  <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                </div>

                {/* Personalized Greeting */}
                <div className="text-center pb-6 z-10">
                  <div className="font-serif italic text-xl text-[#8c7324] max-w-[280px]">
                    {guestName ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#a68a29] mb-3 font-sans not-italic font-medium">For our special guest</span>
                        <span className="px-8 py-2 border-b border-[#d4af37]/40 block text-2xl drop-shadow-[0_1px_0_rgba(255,255,255,1)]">{guestName}</span>
                      </div>
                    ) : (
                      <span className="text-[#a68a29] drop-shadow-[0_1px_0_rgba(255,255,255,1)]">{t("personalizedGreeting")}</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#d4af37] animate-bounce mx-auto mt-8 opacity-80" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Front Left/Right/Bottom triangles */}
          {/* Left Flap */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-[#f5f1e6] to-[#f0eadd] rounded-lg shadow-inner pointer-events-none border-r border-white/40"
            style={{
              clipPath: "polygon(0% 0%, 50% 50%, 0% 100%)",
              zIndex: 10,
            }}
          />
          {/* Right Flap */}
          <div 
            className="absolute inset-0 bg-gradient-to-l from-[#f5f1e6] to-[#f0eadd] rounded-lg shadow-inner pointer-events-none border-l border-white/40"
            style={{
              clipPath: "polygon(100% 0%, 50% 50%, 100% 100%)",
              zIndex: 10,
            }}
          />
          {/* Bottom Flap */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-[#e8dfc8] to-[#f5f1e6] rounded-lg pointer-events-none shadow-[-5px_-5px_15px_rgba(0,0,0,0.03)] border-t border-white/50"
            style={{
              clipPath: "polygon(0% 100%, 50% 50%, 100% 100%)",
              zIndex: 15,
            }}
          />

          {/* Top Flap (folding / rotating) */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#fdfbf7] to-[#f5f1e6] origin-top rounded-t-lg drop-shadow-md"
            style={{
              clipPath: "polygon(0% 0%, 50% 100%, 100% 0%)",
              zIndex: isFlapOpen ? 4 : 20,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
            animate={isOpening ? { rotateX: 180 } : { rotateX: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top flap inner shadow to simulate thickness */}
            <div className="absolute inset-0 border-b border-white/60 pointer-events-none" style={{ clipPath: "polygon(0% 0%, 50% 100%, 100% 0%)" }} />
          </motion.div>

          {/* Wax Seal / Button */}
          {!isFlapOpen && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 25 }}>
              <motion.button
                onClick={handleOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isOpening ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : { scale: [1, 1.02, 1] }}
                transition={isOpening ? { duration: 0.8, ease: "anticipate" } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative flex items-center justify-center w-24 h-24 rounded-full cursor-pointer focus:outline-none"
              >
                {/* Ambient Gold Glow */}
                <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-[20px] opacity-30 animate-pulse" />
                
                {/* Realistic Wax Seal Base */}
                <div className="absolute inset-2 bg-gradient-to-br from-[#80101b] via-[#5c0b13] to-[#40070c] rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center border border-[#300508]">
                  
                  {/* Irregular Wax Edge simulation */}
                  <div className="absolute inset-0 rounded-full border-[3px] border-[#80101b]/40 mix-blend-overlay" style={{ filter: 'blur(1px)' }} />
                  
                  {/* Wax Seal Stamped Area */}
                  <div className="w-[75%] h-[75%] rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.6),0_1px_1px_rgba(255,255,255,0.1)] bg-gradient-to-br from-[#5c0b13] to-[#750e18] flex items-center justify-center">
                    <Mail className="h-6 w-6 text-[#d4af37] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] opacity-90" strokeWidth={1.5} />
                  </div>
                </div>
              </motion.button>
            </div>
          )}

          {/* Hint Overlay */}
          {!isOpening && (
            <div className="absolute -bottom-16 left-0 right-0 text-center text-[#d4af37] text-xs tracking-[0.2em] animate-pulse uppercase pointer-events-none drop-shadow-md">
              {t("clickSeal")}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Envelope;
