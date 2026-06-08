"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

interface LiveCountdownProps {
  targetDate: string; // ISO format: YYYY-MM-DDTHH:mm
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const LiveCountdown: React.FC<LiveCountdownProps> = ({ targetDate }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
        setIsCompleted(false);
      } else {
        setIsCompleted(true);
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeItems = [
    { label: t("days"), value: timeLeft.days },
    { label: t("hours"), value: timeLeft.hours },
    { label: t("minutes"), value: timeLeft.minutes },
    { label: t("seconds"), value: timeLeft.seconds },
  ];

  if (isCompleted) {
    return (
      <div className="text-center py-6">
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl font-serif italic text-primary font-semibold tracking-wide"
        >
          ✨ The Celebration Has Begun! ✨
        </motion.p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 md:gap-8 items-center justify-center text-center glass-panel px-6 py-4 md:px-8 md:py-6 rounded-xl border border-[var(--border-warm)]/30 shadow-[0_10px_40px_-10px_rgba(115,92,0,0.1)]">
      {timeItems.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <div className="w-px h-12 bg-[var(--border-warm)]/50 self-center" />}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className="flex flex-col min-w-[60px]"
          >
            <div className="relative overflow-hidden h-9 sm:h-12 w-full flex items-center justify-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={item.value}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  className="text-3xl sm:text-4xl font-light text-[var(--primary)] tracking-tight serif"
                >
                  {String(item.value).padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="sans text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--muted-text)] font-semibold mt-1">
              {item.label}
            </span>
          </motion.div>
        </React.Fragment>
      ))}
    </div>
  );
};
export default LiveCountdown;
