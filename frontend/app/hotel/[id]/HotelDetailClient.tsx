"use client";

import { useState, useEffect } from "react";
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
import { VoiceBookingCallModal } from "../../../src/app/components/VoiceBookingCallModal";

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

export default function HotelDetailClient({ hotel }: { hotel: Hotel }) {
  const [bookingMode, setBookingMode] = useState<"choice" | "voice" | "form" | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode, mounted]);

  return (
    <div
      className="min-h-screen bg-[var(--background)] transition-colors duration-500"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl transition-colors duration-500">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--border)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-brand)]">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span
                className="text-base font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Javis
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]">
              <Heart className="h-[18px] w-[18px]" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]">
              <Share2 className="h-[18px] w-[18px]" />
            </button>
            {mounted && (
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Gallery */}
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]"
        >
          {/* Main image */}
          <div className="relative h-[320px] overflow-hidden rounded-2xl bg-[var(--muted)] md:h-[420px]">
            <img
              src={hotel.images[activeImage]}
              alt={hotel.name}
              className="h-full w-full object-cover transition-all duration-500"
            />
            <div className="absolute bottom-4 left-4 flex gap-1.5">
              {hotel.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeImage ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
          {/* Side images */}
          <div className="hidden flex-col gap-3 md:flex">
            {hotel.images.slice(1, 3).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i + 1)}
                className={`relative h-full flex-1 overflow-hidden rounded-2xl bg-[var(--muted)] transition-all ${
                  activeImage === i + 1 ? "ring-2 ring-[var(--accent-brand)]" : "hover:opacity-90"
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
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
            <div className="sticky top-20 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-colors">
              <div className="mb-5">
                <p className="text-xs text-[var(--muted-foreground)]">ราคาเริ่มต้น</p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl font-semibold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ฿{hotel.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-[var(--muted-foreground)]">/ คืน</span>
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--muted-foreground)]">เช็คอิน</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent-brand)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--muted-foreground)]">เช็คเอาท์</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent-brand)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--muted-foreground)]">ผู้เข้าพัก</label>
                  <select className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent-brand)]">
                    <option>1 คน</option>
                    <option>2 คน</option>
                    <option>3 คน</option>
                    <option>4 คน</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setBookingMode("choice")}
                className="mb-3 w-full rounded-xl bg-[var(--accent-brand)] px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--accent-brand-hover)] active:scale-[0.98]"
              >
                จองเลย
              </button>
              <p className="text-center text-xs text-[var(--muted-foreground)]">ยังไม่ถูกเรียกเก็บเงิน</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modals */}
      <BookingChoiceModal
        isOpen={bookingMode === "choice"}
        hotelName={hotel.name}
        onClose={() => setBookingMode(null)}
        onSelectVoice={() => setBookingMode("voice")}
        onSelectForm={() => setBookingMode("form")}
      />
      <VoiceBookingCallModal
        isOpen={bookingMode === "voice"}
        onClose={() => setBookingMode(null)}
        hotelName={hotel.name}
        price={hotel.price}
      />
      <BookingModal
        isOpen={bookingMode === "form"}
        onClose={() => setBookingMode(null)}
        hotelName={hotel.name}
        price={hotel.price}
      />
    </div>
  );
}
