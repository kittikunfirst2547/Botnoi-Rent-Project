"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";

import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MapPin,
  Wifi,
  Coffee,
  Waves,
  Sparkles,
  Sun,
  Moon,
  Check,
  Heart,
  Share2,
  Dumbbell,
  UtensilsCrossed,
  TreePalm,
  Ship,
  Mountain,
  Compass,
} from "lucide-react";
import { motion } from "motion/react";
import type { Hotel } from "../../../src/data/hotels";
import { BookingChoiceModal } from "../../../src/app/components/BookingChoiceModal";
import { BookingModal } from "../../../src/app/components/BookingModal";
import { ImageGalleryModal } from "../../../src/app/components/ImageGalleryModal";
import { useVoiceBooking } from "../../../src/context/VoiceBookingContext";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";

const amenityMeta: Record<string, { icon: React.ElementType; label: string }> = {
  WiFi: { icon: Wifi, label: "WiFi ฟรี" },
  Pool: { icon: Waves, label: "สระว่ายน้ำ" },
  Breakfast: { icon: Coffee, label: "อาหารเช้า" },
  Spa: { icon: Sparkles, label: "สปา" },
  Fitness: { icon: Dumbbell, label: "ฟิตเนส" },
  Restaurant: { icon: UtensilsCrossed, label: "ร้านอาหาร" },
  "River View": { icon: Compass, label: "วิวแม่น้ำ" },
  Shuttle: { icon: Ship, label: "รถรับส่ง" },
  Nature: { icon: TreePalm, label: "ธรรมชาติ" },
  "Cooking Class": { icon: UtensilsCrossed, label: "เรียนทำอาหาร" },
  "Private Beach": { icon: Waves, label: "ชายหาดส่วนตัว" },
  Yacht: { icon: Ship, label: "เรือยอชท์" },
  Kayak: { icon: Ship, label: "พายเรือ" },
  "Rock Climbing": { icon: Mountain, label: "ปีนหน้าผา" },
  Wellness: { icon: Sparkles, label: "เวลเนส" },
  Yoga: { icon: Sparkles, label: "โยคะ" },
};

// Hotel Image Slider Component - Clean White Theme
interface HotelImageSliderProps {
  images: string[];
  hotelName: string;
  onOpenGallery?: () => void;
}

function HotelImageSlider({ images, hotelName, onOpenGallery }: HotelImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className="relative overflow-hidden rounded-2xl bg-[var(--card)] shadow-xl ring-1 ring-[var(--border)]"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* ✅ container สูงคงที่ ไม่ขึ้นกับรูป */}
        <div className="relative w-full overflow-hidden bg-[var(--muted)]" style={{ height: '500px' }}>

          {/* ✅ render ทุกรูปพร้อมกัน ซ่อนด้วย opacity แทน unmount */}
        {images.map((src, idx) => (
  <div
    key={src}
    className="absolute inset-0 transition-opacity duration-500"
    style={{ opacity: idx === currentIndex ? 1 : 0 }}
  >
    {/* พื้นหลังเบลอ */}
    <img
      src={src}
      className="absolute inset-0 w-full h-full object-cover scale-110"
      style={{ filter: 'blur(16px)', opacity: 0.6 }}
      aria-hidden="true"
    />
    {/* รูปจริง */}
    <img
      src={src}
      alt={`${hotelName} - ${idx + 1}`}
      className="absolute inset-0 w-full h-full object-contain object-center"
      loading={idx === 0 ? "eager" : "lazy"}
      onError={(e) => {
        (e.target as HTMLImageElement).src =
          'https://placehold.co/800x600/e2e8f0/64748b?text=Hotel+Image';
      }}
    />
  </div>
))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

          {/* Counter & Gallery */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <span>{currentIndex + 1}</span>
              <span className="opacity-70">/</span>
              <span>{images.length}</span>
            </div>
            {onOpenGallery && (
              <button
                onClick={onOpenGallery}
                className="flex items-center gap-1.5 rounded-full bg-[var(--card)]/95 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] backdrop-blur-md transition-all hover:bg-[var(--card)] hover:shadow-md"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                <span>แกลเลอรี</span>
              </button>
            )}
          </div>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)]/95 text-[var(--foreground)] shadow-lg backdrop-blur-sm transition-all hover:text-blue-600 hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)]/95 text-[var(--foreground)] shadow-lg backdrop-blur-sm transition-all hover:text-blue-600 hover:scale-105 active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-6 bg-blue-500'
                  : 'w-2 bg-[var(--muted-foreground)]/30 hover:bg-[var(--muted-foreground)]/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default function HotelDetailClient({ hotel }: { hotel: Hotel }) {
  const [bookingMode, setBookingMode] = useState<"choice" | "form" | null>(null);
  const { openVoiceBooking } = useVoiceBooking();
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-[var(--muted)] rounded" />
            <div className="h-64 bg-[var(--muted)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--background)] transition-colors duration-500"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Header - Modern Design */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)] transition-all duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] transition-all duration-200 hover:text-blue-600 hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <Link href="/" className="flex items-center gap-2 no-underline">
            
              <span className="hidden sm:block text-lg font-bold text-[var(--foreground)]">
                Javis
              </span>
            </Link>
          </div>

          {/* Center - Breadcrumb (optional) */}
          <div className="hidden md:flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <span>หน้าแรก</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[var(--foreground)] font-medium">{hotel.name.slice(0, 20)}...</span>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <button className="group flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--accent-brand)] hover:text-[var(--accent-brand)] hover:shadow-md">
              <Heart className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>

            {/* Share Button */}
            <button className="group flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-200 hover:border-[var(--accent-brand)] hover:text-[var(--accent-brand)] hover:shadow-md">
              <Share2 className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Toggle dark mode"
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* CTA Button - Book Now */}
            <button
              onClick={() => setBookingMode("choice")}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold !text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>จองเลย</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Gallery - Slider Style */}
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Image Slider */}
          <HotelImageSlider
            images={hotel.images}
            hotelName={hotel.name}
            onOpenGallery={() => setGalleryOpen(true)}
          />
        </motion.div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left — Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {/* Title block */}
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Star className="h-3 w-3 fill-current" />
                  {hotel.rating}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  ({hotel.reviews.toLocaleString()} รีวิว)
                </span>
              </div>
              <h1
                className="mb-2 text-2xl font-semibold text-[var(--foreground)] md:text-3xl"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                {hotel.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{hotel.location}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2
                className="mb-3 text-base font-medium text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                เกี่ยวกับโรงแรม
              </h2>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{hotel.description}</p>
            </div>

            {/* Highlights */}
            <div className="mb-8">
              <h2
                className="mb-3 text-base font-medium text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                จุดเด่น
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {hotel.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5 rounded-xl bg-[var(--muted)] p-3 transition-colors">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-brand)]" />
                    <span className="text-sm text-[var(--foreground)]">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2
                className="mb-3 text-base font-medium text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                สิ่งอำนวยความสะดวก
              </h2>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((a) => {
                  const meta = amenityMeta[a] ?? { icon: Sparkles, label: a };
                  const Icon = meta.icon;
                  return (
                    <div
                      key={a}
                      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-[var(--foreground)] transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[var(--accent-brand)]" />
                      <span className="text-sm">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right — Booking Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-lg transition-colors">
              {/* Price Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-gray-50">
                <p className="text-xs font-medium text-blue-100 mb-1">ราคาเริ่มต้นต่อคืน</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    ฿{hotel.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-blue-100">/ คืน</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-100">
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5">
                    รวมภาษีแล้ว
                  </span>
                  <span>• ยกเลิกฟรี</span>
                </div>
              </div>

              {/* Booking Form */}
              <div className="p-5 space-y-4">
                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 transition-colors hover:border-[var(--accent-brand)] cursor-pointer">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1">เช็คอิน</label>
                    <input
                      type="date"
                      className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] outline-none cursor-pointer"
                    />
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 transition-colors hover:border-[var(--accent-brand)] cursor-pointer">
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1">เช็คเอาท์</label>
                    <input
                      type="date"
                      className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3 transition-colors hover:border-[var(--accent-brand)]">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)] mb-1">ผู้เข้าพัก</label>
                  <select className="w-full bg-transparent text-sm font-medium text-[var(--foreground)] outline-none cursor-pointer">
                    <option>1 คน</option>
                    <option>2 คน</option>
                    <option>3 คน</option>
                    <option>4 คน</option>
                    <option>5+ คน</option>
                  </select>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 py-3 border-t border-[var(--border)]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">฿{hotel.price.toLocaleString()} x 1 คืน</span>
                    <span className="text-[var(--foreground)]">฿{hotel.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">ค่าบริการ</span>
                    <span className="text-[var(--foreground)]">ฟรี</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-[var(--border)]">
                    <span className="text-[var(--foreground)]">รวม</span>
                    <span className="text-blue-600">฿{hotel.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Book Now Button - Attractive Design */}
                <button
                  onClick={() => setBookingMode("choice")}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-base font-semibold !text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    จองเลย
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>จ่ายปลอดภัย</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>ยกเลิกฟรี 24ชม.</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modals */}
      <BookingChoiceModal
        isOpen={bookingMode === "choice"}
        hotelName={hotel.name}
        onClose={() => setBookingMode(null)}
        onSelectVoice={() => {
          openVoiceBooking(hotel.name, hotel.price);
          setBookingMode(null);
        }}
        onSelectForm={() => setBookingMode("form")}
      />
      <BookingModal
        isOpen={bookingMode === "form"}
        onClose={() => setBookingMode(null)}
        hotelName={hotel.name}
        price={hotel.price}
      />
      <ImageGalleryModal
        images={hotel.images}
        hotelName={hotel.name}
        isOpen={galleryOpen}
        initialIndex={activeImage}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}
