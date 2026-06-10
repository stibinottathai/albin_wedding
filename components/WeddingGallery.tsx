"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, Heart } from "lucide-react";
import { getGalleryImages, getWeddingInfo, GalleryImage } from "../lib/db";
import { getSupabaseImageUrl } from "../lib/supabase";

export const WeddingGallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | GalleryImage["category"]>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

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
    setVisibleCount(6);
  }, [activeTab]);

  const [categories, setCategories] = useState<{ id: string; label: string }[]>([{ id: "all", label: "All" }]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const info = await getWeddingInfo();
        if (info.galleryCategories) {
          const parsed: string[] = typeof info.galleryCategories === "string"
            ? JSON.parse(info.galleryCategories)
            : info.galleryCategories;
          if (parsed.length > 0) {
            setCategories([
              { id: "all", label: "All" },
              ...parsed.map((cat) => ({
                id: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " "),
              })),
            ]);
            return;
          }
        }
      } catch (e) {
        console.error("Error loading gallery categories:", e);
      }
      // Fallback: derive categories from actual images
      if (images.length > 0) {
        const uniqueCats = Array.from(new Set(images.map((img) => img.category).filter(Boolean)));
        if (uniqueCats.length > 0) {
          setCategories([
            { id: "all", label: "All" },
            ...uniqueCats.map((cat) => ({
              id: cat,
              label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " "),
            })),
          ]);
        }
      }
    };
    loadCategories();
  }, [images]);

  const filteredImages = activeTab === "all"
    ? images
    : images.filter((img) => img.category === activeTab);
  const displayedImages = filteredImages.slice(0, visibleCount);

  const openLightbox = (src: string) => {
    const idx = filteredImages.findIndex((img) => img.src === src);
    setLightboxIndex(idx >= 0 ? idx : null);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const handleNext = () => {
    if (lightboxIndex !== null && filteredImages.length > 0) {
      setLightboxIndex((prev) => (prev! + 1) % filteredImages.length);
    }
  };

  const handlePrev = () => {
    if (lightboxIndex !== null && filteredImages.length > 0) {
      setLightboxIndex((prev) => (prev! - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleNext();
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePrev();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === "ArrowRight") {
          handleNext();
        } else if (e.key === "ArrowLeft") {
          handlePrev();
        } else if (e.key === "Escape") {
          closeLightbox();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredImages]);

  // Masonry height pattern for visual variety
  const getImageAspect = (index: number): string => {
    const patterns = [
      "aspect-[3/4]",   // portrait
      "aspect-square",  // square
      "aspect-[4/5]",   // tall-ish
      "aspect-[3/4]",   // portrait
      "aspect-[4/3]",   // landscape
      "aspect-[3/4]",   // portrait
    ];
    return patterns[index % patterns.length];
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* Category Tabs Skeleton */}
        <div className="flex flex-wrap gap-3 justify-center mb-12 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-24 h-9 bg-[var(--parchment)] animate-pulse rounded-full" />
          ))}
        </div>
        
        {/* Grid Skeleton */}
        <div className="columns-2 md:columns-3 gap-5 px-2 space-y-5 max-w-5xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="w-full bg-[var(--parchment)] animate-pulse rounded-2xl break-inside-avoid"
              style={{ height: i % 2 === 0 ? "280px" : "360px" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="bg-white/60 border border-[var(--border-warm)]/30 rounded-3xl p-10 max-w-md shadow-[0_15px_50px_-15px_rgba(115,92,0,0.06)]">
          <Heart className="w-8 h-8 text-[var(--primary)] mx-auto mb-4 opacity-40" />
          <p className="serif italic text-2xl text-[var(--primary)] mb-3">Beautiful Moments Are Coming</p>
          <p className="sans text-xs text-[var(--muted-text)] leading-relaxed">
            Our wedding gallery is currently empty. We will upload photos soon! Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-12 px-4">
        {categories.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2 rounded-full sans text-[10px] uppercase tracking-[0.15em] transition-all duration-400 font-semibold border cursor-pointer ${
              activeTab === tab.id
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_4px_20px_-4px_rgba(115,92,0,0.3)]"
                : "bg-white/70 text-[var(--muted-text)] border-[var(--border-warm)]/40 hover:border-[var(--primary)]/50 hover:text-[var(--primary)] hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {displayedImages.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted-text)]/60 italic serif text-sm">
          No photos in this category yet.
        </div>
      ) : (
        <div className="max-h-[65vh] md:max-h-[720px] overflow-y-auto pr-1 pb-4 styled-scrollbar">
          <motion.div
            layout
            className="columns-2 md:columns-3 gap-4 md:gap-5 px-1 space-y-4 md:space-y-5 max-w-5xl mx-auto"
          >
            <AnimatePresence mode="popLayout">
              {displayedImages.map((img, index) => (
                <motion.div
                  key={img.id || img.src}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  className="relative break-inside-avoid group cursor-pointer"
                  onClick={() => openLightbox(img.src)}
                >
                  {/* Outer frame */}
                  <div className="rounded-2xl overflow-hidden bg-white p-[5px] shadow-[0_8px_30px_-8px_rgba(115,92,0,0.08)] border border-[var(--border-warm)]/25 hover:shadow-[0_15px_40px_-8px_rgba(115,92,0,0.15)] hover:-translate-y-1 transition-all duration-500">
                    {/* Inner image container */}
                    <div className="relative overflow-hidden rounded-[12px]">
                      <Image
                        src={getSupabaseImageUrl(img.src, 'thumb')}
                        alt={img.alt || "Wedding moment"}
                        width={600}
                        height={index % 3 === 0 ? 750 : index % 3 === 1 ? 600 : 500}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-[1.06]"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4="
                      />
                      
                      {/* Soft inner shadow for depth */}
                      <div className="absolute inset-0 rounded-[12px] shadow-[inset_0_0_20px_rgba(0,0,0,0.04)] pointer-events-none" />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-end justify-center pb-6">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
                          <ZoomIn className="h-3.5 w-3.5" />
                          <span className="sans text-[9px] uppercase tracking-[0.15em] font-semibold">View</span>
                        </div>
                      </div>
                    </div>

                    {/* Caption bar */}
                    {img.alt && (
                      <div className="px-3 py-2.5 text-center">
                        <p className="sans text-[9px] uppercase tracking-[0.12em] text-[var(--muted-text)]/70 font-medium truncate">{img.alt}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Load More / Show Less */}
          {filteredImages.length > visibleCount && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="group px-8 py-3 bg-white border border-[var(--border-warm)]/40 text-[var(--primary)] rounded-full sans text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] hover:shadow-[0_8px_25px_-6px_rgba(115,92,0,0.25)] cursor-pointer"
              >
                Load More Photos
              </button>
            </div>
          )}
          {visibleCount > 6 && visibleCount >= filteredImages.length && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setVisibleCount(6)}
                className="px-8 py-3 bg-[var(--parchment)] text-[var(--muted-text)] rounded-full sans text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 hover:bg-[var(--border-warm)] cursor-pointer"
              >
                Show Less
              </button>
            </div>
          )}
        </div>
      )}

      {/* Premium Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredImages[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 z-50 text-white/50 hover:text-white bg-white/5 hover:bg-white/15 p-2.5 rounded-full transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image Counter */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
              <span className="sans text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">
                {lightboxIndex + 1} / {filteredImages.length}
              </span>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={showPrev}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white bg-white/5 hover:bg-white/15 p-3 rounded-full transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={showNext}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white bg-white/5 hover:bg-white/15 p-3 rounded-full transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Selected Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(e, info) => {
                const swipeThreshold = 50;
                if (info.offset.x < -swipeThreshold) {
                  handleNext();
                } else if (info.offset.x > swipeThreshold) {
                  handlePrev();
                }
              }}
              className="w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col items-center select-none touch-none cursor-grab active:cursor-grabbing px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Frame for lightbox image */}
              <div className="relative w-full h-[60vh] sm:h-[75vh] bg-white/5 rounded-2xl p-1 border border-white/10">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src={getSupabaseImageUrl(filteredImages[lightboxIndex].src, 'full')}
                    alt={filteredImages[lightboxIndex].alt || "Wedding moment"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1280px"
                    priority
                    className="object-contain"
                  />
                </div>
              </div>
              {filteredImages[lightboxIndex].alt && (
                <p className="text-white/40 sans text-[10px] mt-4 uppercase tracking-[0.2em] font-medium">
                  {filteredImages[lightboxIndex].alt}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeddingGallery;
