"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface GalleryImage {
  src: string;
  category: "pre-wedding" | "engagement" | "family" | "memories";
  alt: string;
}

const GALLERY_IMAGES: GalleryImage[] = [
  // Pre-Wedding
  {
    src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800",
    category: "pre-wedding",
    alt: "Pre-wedding sunset walking",
  },
  {
    src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=800",
    category: "pre-wedding",
    alt: "Pre-wedding embrace",
  },
  {
    src: "https://images.unsplash.com/photo-1529636798458-92182e65f133?q=80&w=800",
    category: "pre-wedding",
    alt: "Romantic forest stroll",
  },
  // Engagement
  {
    src: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800",
    category: "engagement",
    alt: "Ring exchange betrothal",
  },
  {
    src: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?q=80&w=800",
    category: "engagement",
    alt: "Proposal ring view",
  },
  {
    src: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=800",
    category: "engagement",
    alt: "Happy engaged couple laughing",
  },
  // Family
  {
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800",
    category: "family",
    alt: "Wedding toast with relatives",
  },
  {
    src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=800",
    category: "family",
    alt: "Family portraits during reception",
  },
  {
    src: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800",
    category: "family",
    alt: "Bridesmaids laughing together",
  },
  // Memories
  {
    src: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800",
    category: "memories",
    alt: "Bride and Groom floral aisle",
  },
  {
    src: "https://images.unsplash.com/photo-1519225495810-7517cbd14560?q=80&w=800",
    category: "memories",
    alt: "Groom looking at bride church",
  },
  {
    src: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=800",
    category: "memories",
    alt: "Bridal dance first waltz",
  },
];

export const WeddingGallery: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"all" | GalleryImage["category"]>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = [
    { id: "all", label: "All" },
    { id: "pre-wedding", label: t("gallery") + " - Pre" },
    { id: "engagement", label: t("storyEngagement") },
    { id: "family", label: t("family") },
    { id: "memories", label: "Memories" },
  ];

  const filteredImages = activeTab === "all"
    ? GALLERY_IMAGES
    : GALLERY_IMAGES.filter((img) => img.category === activeTab);

  const openLightbox = (src: string) => {
    const idx = GALLERY_IMAGES.findIndex((img) => img.src === src);
    setLightboxIndex(idx >= 0 ? idx : null);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! + 1) % GALLERY_IMAGES.length);
    }
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev! - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
    }
  };

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-8 px-4">
        {categories.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-all font-medium duration-300 ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-md"
                : "bg-white/50 dark:bg-[#1e332c]/30 text-muted-foreground hover:bg-white dark:hover:bg-[#1e332c]/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Masonry-like Grid */}
      <motion.div
        layout
        className="columns-1 sm:columns-2 md:columns-3 gap-4 px-4 space-y-4 max-w-5xl mx-auto"
      >
        <AnimatePresence mode="popLayout">
          {filteredImages.map((img) => (
            <motion.div
              key={img.src}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="relative break-inside-avoid rounded-xl overflow-hidden shadow-md group cursor-pointer border border-[#e5dfd1] dark:border-[#223830]"
              onClick={() => openLightbox(img.src)}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white">
                  <ZoomIn className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all duration-300"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={showPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all duration-300"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={showNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all duration-300"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Selected Image */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl max-h-[85vh] overflow-hidden rounded-lg flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={GALLERY_IMAGES[lightboxIndex].src}
                alt={GALLERY_IMAGES[lightboxIndex].alt}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <p className="text-white/60 text-xs mt-3 uppercase tracking-widest">
                {GALLERY_IMAGES[lightboxIndex].alt}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default WeddingGallery;
