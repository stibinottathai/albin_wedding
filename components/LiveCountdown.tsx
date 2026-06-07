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
    <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto sm:max-w-md my-4">
      {timeItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.6 }}
          className="glass-card rounded-xl py-3 px-1.5 sm:py-4 sm:px-3 text-center flex flex-col items-center justify-center border border-[#e5dfd1] relative overflow-hidden"
        >
          {/* Accent Gold Top Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-accent" />
          
          <div className="relative overflow-hidden h-9 sm:h-12 w-full flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={item.value}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-2xl sm:text-3.5xl font-semibold text-foreground tracking-tight font-serif"
              >
                {String(item.value).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </div>

          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
export default LiveCountdown;
