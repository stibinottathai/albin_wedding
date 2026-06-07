"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  swayDuration: number;
}

export const GoldParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate particles
    const generated: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage of screen width
      y: Math.random() * 100, // initial height offset
      size: Math.random() * 6 + 2, // size in px
      duration: Math.random() * 20 + 20, // vertical float duration
      delay: Math.random() * -20, // negative delay so they start scattered
      swayDuration: Math.random() * 6 + 4, // sway cycle duration
    }));
    setParticles(generated);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-tr from-[#b88728] via-[#f7e6a7] to-[#e2c070] opacity-40 blur-[0.5px]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ["110vh", "-10vh"],
            x: [
              `calc(${p.x}vw - 0px)`,
              `calc(${p.x}vw - 30px)`,
              `calc(${p.x}vw + 30px)`,
              `calc(${p.x}vw - 0px)`
            ]
          }}
          transition={{
            y: {
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            },
            x: {
              duration: p.swayDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
        />
      ))}
    </div>
  );
};
export default GoldParticles;
