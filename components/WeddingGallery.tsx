"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getGalleryImages, GalleryImage } from "../lib/db";

export const WeddingGallery: React.FC = () => {
  const { t } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GalleryImage["category"]>("pre-wedding");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const data = await getGalleryImages();
        setImages(data);
      } catch (err) {
        console.error("Error loading gallery images:", err);
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, []);

  useEffect(() => {
    setShowAll(false);
  }, [activeTab]);

  const categories = [
    { id: "pre-wedding", label: t("gallery") + " - Pre" },
    { id: "engagement", label: t("storyEngagement") },
    { id: "family", label: t("family") },
    { id: "memories", label: "Memories" },
  ];

  const filteredImages = images.filter((img) => img.category === activeTab);
  const displayedImages = showAll ? filteredImages : filteredImages.slice(0, 6);

  const openLightbox = (src: string) => {
    const idx = filteredImages.findIndex((img) => img.src === src);
    setLightboxIndex(idx >= 0 ? idx : null);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && filteredImages.length > 0) {
      setLightboxIndex((prev) => (prev! + 1) % filteredImages.length);
    }
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && filteredImages.length > 0) {
      setLightboxIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* Category Tabs Skeleton */}
        <div className="flex flex-wrap gap-2 justify-center mb-8 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-24 h-8 bg-slate-200 dark:bg-[#1e332c]/20 animate-pulse rounded-full" />
          ))}
        </div>
        
        {/* Masonry Columns Skeleton */}
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 px-4 space-y-4 max-w-5xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="w-full bg-slate-200 dark:bg-[#1e332c]/20 animate-pulse rounded-xl break-inside-avoid border border-[#e5dfd1] dark:border-[#223830]"
              style={{ height: i % 2 === 0 ? "280px" : "380px" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="bg-white/40 dark:bg-[#1e332c]/10 border border-[#e5dfd1] dark:border-[#223830] rounded-3xl p-8 max-w-md shadow-sm backdrop-blur-sm">
          <p className="font-serif italic text-xl text-primary mb-2">Beautiful Moments Are Coming</p>
          <p className="sans text-xs text-muted-foreground leading-relaxed">
            Our wedding gallery is currently empty. Capturing all beautiful memories, we will upload photos soon! Please check back later.
          </p>
        </div>
      </div>
    );
  }

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
                ? "bg-[#8b755e] text-white shadow-md"
                : "bg-white/50 dark:bg-[#1e332c]/30 text-muted-foreground hover:bg-white dark:hover:bg-[#1e332c]/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Masonry-like Grid */}
      {displayedImages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/60 italic text-xs">
          No photos in this category yet.
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="columns-1 sm:columns-2 md:columns-3 gap-4 px-4 space-y-4 max-w-5xl mx-auto"
          >
            <AnimatePresence mode="popLayout">
              {displayedImages.map((img) => (
                <motion.div
                  key={img.id || img.src}
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
                    alt={img.alt || "Wedding moment"}
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

          {filteredImages.length > 6 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2.5 bg-[#8b755e] hover:bg-[#705e4c] text-white text-xs uppercase tracking-widest font-semibold rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              >
                {showAll ? "Show Less" : `View All (${filteredImages.length})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredImages[lightboxIndex] && (
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
                src={filteredImages[lightboxIndex].src}
                alt={filteredImages[lightboxIndex].alt || "Wedding moment"}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <p className="text-white/60 text-xs mt-3 uppercase tracking-widest">
                {filteredImages[lightboxIndex].alt || "Wedding moment"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeddingGallery;
