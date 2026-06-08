"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
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
        <div className="columns-2 sm:columns-2 md:columns-3 gap-4 px-4 space-y-4 max-w-5xl mx-auto">
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
        <div className="max-h-[60vh] md:max-h-[700px] overflow-y-auto pr-2 pb-4">
          <motion.div
            layout
            className="columns-2 sm:columns-2 md:columns-3 gap-4 px-2 space-y-4 max-w-5xl mx-auto"
          >
            <AnimatePresence mode="popLayout">
              {displayedImages.map((img, index) => (
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
                  <Image
                    src={getSupabaseImageUrl(img.src, 'thumb')}
                    alt={img.alt || "Wedding moment"}
                    width={600}
                    height={index % 2 === 0 ? 450 : 600}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4="
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

          {filteredImages.length > visibleCount && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="px-6 py-2.5 bg-[#8b755e] hover:bg-[#705e4c] text-white text-xs uppercase tracking-widest font-semibold rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              >
                Load More
              </button>
            </div>
          )}
          {visibleCount > 6 && visibleCount >= filteredImages.length && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount(6)}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs uppercase tracking-widest font-semibold rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              >
                Show Less
              </button>
            </div>
          )}
        </div>
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
              className="absolute top-6 right-6 z-50 text-white/70 hover:text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all duration-300 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={showPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all duration-300 cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={showNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/70 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all duration-300 cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Selected Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
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
              className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-lg flex flex-col items-center select-none touch-none cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[65vh] sm:h-[80vh]">
                <Image
                  src={getSupabaseImageUrl(filteredImages[lightboxIndex].src, 'full')}
                  alt={filteredImages[lightboxIndex].alt || "Wedding moment"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1280px"
                  priority
                  className="object-contain rounded-lg shadow-2xl"
                />
              </div>
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
