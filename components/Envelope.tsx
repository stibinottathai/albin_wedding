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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15231e] px-4 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#c59b27_1px,transparent_1px)] [background-size:24px_24px]" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-lg aspect-[4/3] flex items-center justify-center"
      >
        {/* Envelope Body */}
        <div className="relative w-full h-full rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] bg-[#ede7d9] overflow-visible border border-[#d6cfbe]">
          
          {/* Back Flap (visible when envelope is open) */}
          <div className="absolute inset-0 rounded-2xl bg-[#e5dfd1] border-b border-[#cbd5e1] overflow-hidden">
            <div className="w-full h-full bg-[linear-gradient(to_bottom,rgba(197,168,128,0.08)_1px,transparent_1px)] bg-[size:100%_40px]" />
          </div>

          {/* Dynamic Invitation Card sliding out */}
          <AnimatePresence>
            <motion.div
              className="absolute left-4 right-4 bg-white rounded-xl shadow-lg border border-[#e5dfd1] p-6 text-center select-none flex flex-col justify-between"
              style={{
                top: "10%",
                height: "80%",
                zIndex: isCardSlidOut ? 30 : 5,
              }}
              initial={{ y: 0, scale: 0.95 }}
              animate={
                isCardSlidOut
                  ? { y: "-50%", scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }
                  : isFlapOpen
                  ? { y: "-15%", scale: 0.98 }
                  : { y: 0, scale: 0.95 }
              }
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <div className="border border-double border-[#c59b27] h-full w-full rounded-lg p-6 flex flex-col items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-[#a37f1e] font-semibold">
                  {t("saveTheDate")}
                </span>

                <div className="my-2">
                  <h2 className="calligraphy text-4xl text-[#1c1a17] font-serif my-1 font-bold">
                    Albin & Stella
                  </h2>
                  <p className="text-sm font-sans tracking-wide text-muted-foreground mt-2">
                    {t("youAreInvited")}
                  </p>
                </div>

                <div className="w-12 h-[1px] bg-[#c59b27] my-1" />

                {/* Personalized Greeting */}
                <div className="text-center font-serif italic text-base text-[#c59b27] max-w-[280px]">
                  {guestName ? (
                    <span>{guestName}</span>
                  ) : (
                    <span>{t("personalizedGreeting")}</span>
                  )}
                </div>

                <ChevronDown className="h-5 w-5 text-[#c59b27] animate-bounce mt-2" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Front Left/Right/Bottom triangles */}
          {/* Left Flap */}
          <div 
            className="absolute inset-0 bg-[#e0d9c9] rounded-2xl shadow-inner pointer-events-none"
            style={{
              clipPath: "polygon(0% 0%, 50% 50%, 0% 100%)",
              zIndex: 10,
              borderRight: "1px solid rgba(0,0,0,0.05)"
            }}
          />
          {/* Right Flap */}
          <div 
            className="absolute inset-0 bg-[#e0d9c9] rounded-2xl shadow-inner pointer-events-none"
            style={{
              clipPath: "polygon(100% 0%, 50% 50%, 100% 100%)",
              zIndex: 10,
              borderLeft: "1px solid rgba(0,0,0,0.05)"
            }}
          />
          {/* Bottom Flap */}
          <div 
            className="absolute inset-0 bg-[#d7cfbe] rounded-2xl pointer-events-none"
            style={{
              clipPath: "polygon(0% 100%, 50% 50%, 100% 100%)",
              zIndex: 15,
              borderTop: "1px solid rgba(255,255,255,0.4)"
            }}
          />

          {/* Top Flap (folding / rotating) */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-1/2 bg-[#ede7d9] origin-top border-t border-white"
            style={{
              clipPath: "polygon(0% 0%, 50% 100%, 100% 0%)",
              zIndex: isFlapOpen ? 4 : 20,
              transformStyle: "preserve-3d"
            }}
            animate={isOpening ? { rotateX: 180 } : { rotateX: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />

          {/* Wax Seal / Button */}
          {!isFlapOpen && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 25 }}>
              <motion.button
                onClick={handleOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={isOpening ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : { scale: [1, 1.05, 1] }}
                transition={isOpening ? { duration: 0.6 } : { repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="relative flex items-center justify-center w-20 h-20 rounded-full cursor-pointer"
              >
                {/* Gold glowing circle */}
                <div className="absolute inset-0 bg-[#c59b27] rounded-full blur-[10px] opacity-40 animate-pulse" />
                
                {/* Realistic Wax Seal */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#981e2b] via-[#bd2939] to-[#df4a5b] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.3)] border border-[#a61725] flex items-center justify-center">
                  {/* Wax Seal Inner details */}
                  <div className="w-[82%] h-[82%] rounded-full border border-dashed border-[#ff8e9b] opacity-30 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-[#ffcbd1]" />
                  </div>
                </div>
              </motion.button>
            </div>
          )}

          {/* Hint Overlay */}
          {!isOpening && (
            <div className="absolute -bottom-12 left-0 right-0 text-center text-[#e5dfd1] text-xs tracking-wider animate-pulse uppercase pointer-events-none">
              {t("clickSeal")}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Envelope;
