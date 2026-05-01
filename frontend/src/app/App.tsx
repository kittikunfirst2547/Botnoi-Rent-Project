"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Sun, Moon, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { hotels } from "../data/hotels";
import { HotelCard } from "./components/HotelCard";
import { SearchBar } from "./components/SearchBar";
import { BookingModal } from "./components/BookingModal";
import { BotnoiChat } from "./components/BotnoiChat";
import { BookingChoiceModal } from "./components/BookingChoiceModal";
import { VoiceBookingCallModal } from "./components/VoiceBookingCallModal";
import { TravelIdeaAssistant } from "./components/TravelIdeaAssistant";

export default function App() {
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [bookingMode, setBookingMode] = useState<"choice" | "voice" | "form" | null>(null);
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

  const handleBooking = (hotelId: string) => {
    setSelectedHotel(hotelId);
    setBookingMode("choice");
  };

  const selectedHotelData = hotels.find((h) => h.id === selectedHotel);
  const closeBooking = () => {
    setSelectedHotel(null);
    setBookingMode(null);
  };

  return (
    <div
      className="min-h-screen bg-[var(--background)] transition-colors duration-500"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl transition-colors duration-500">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-brand)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1
                  className="m-0 text-lg font-semibold text-[var(--foreground)] transition-colors duration-500"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Javis
                </h1>
                <p className="m-0 text-[11px] tracking-wide text-[var(--muted-foreground)]">
                  AI Hotel Booking
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <nav className="hidden items-center gap-6 md:flex">
                {["โรงแรม", "โปรโมชัน", "เกี่ยวกับเรา"].map((label, i) => (
                  <a
                    key={label}
                    href="#"
                    className={`text-sm transition-colors duration-200 ${
                      i === 0
                        ? "font-medium text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </nav>

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
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--accent-brand)] opacity-[0.04] blur-[120px]" />

        <div className="mx-auto max-w-6xl px-6 pt-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs text-[var(--muted-foreground)] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-brand)]" />
              AI-Powered Hotel Booking
            </div>
            <h2
              className="mx-auto mb-5 max-w-xl text-[var(--foreground)] text-3xl font-semibold leading-tight tracking-tight transition-colors duration-500 md:text-[42px] md:leading-[1.15]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ค้นหาที่พักที่ใช่
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-brand)] to-teal-400 bg-clip-text text-transparent">
                ง่ายๆ ด้วย AI
              </span>
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
              จองโรงแรมระดับพรีเมียมทั่วไทย พร้อม AI Assistant
              ที่ช่วยแนะนำสถานที่ท่องเที่ยวให้คุณ
            </p>
          </motion.div>

          <SearchBar />
        </div>
      </section>

      {/* Hotels Grid */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h3
                className="text-xl font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                โรงแรมแนะนำ
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                คัดสรรโรงแรมที่ดีที่สุดจากทั่วประเทศไทย
              </p>
            </div>
            <a
              href="#"
              className="hidden items-center gap-1 text-sm font-medium text-[var(--accent-brand)] transition-colors hover:text-[var(--accent-brand-hover)] md:flex"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.05 }}
              >
                <HotelCard {...hotel} onBook={handleBooking} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--border)] transition-colors duration-500">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-brand)]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span
                  className="text-base font-semibold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Javis
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                แพลตฟอร์มจองโรงแรมด้วย AI ที่ทันสมัยที่สุด
              </p>
            </div>
            {[
              { title: "บริการ", links: ["จองโรงแรม", "AI Assistant", "โปรโมชัน"] },
              { title: "บริษัท", links: ["เกี่ยวกับเรา", "ติดต่อเรา", "ร่วมงานกับเรา"] },
              { title: "ช่วยเหลือ", links: ["ศูนย์ช่วยเหลือ", "นโยบายความเป็นส่วนตัว", "เงื่อนไขการใช้งาน"] },
            ].map((section) => (
              <div key={section.title}>
                <h5 className="mb-3 text-sm font-medium text-[var(--foreground)]">{section.title}</h5>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--muted-foreground)]">
            <p>© 2026 Javis. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <BotnoiChat />
      <TravelIdeaAssistant />

      {selectedHotelData && (
        <>
          <BookingChoiceModal
            isOpen={bookingMode === "choice"}
            hotelName={selectedHotelData.name}
            onClose={closeBooking}
            onSelectVoice={() => setBookingMode("voice")}
            onSelectForm={() => setBookingMode("form")}
          />
          <VoiceBookingCallModal
            isOpen={bookingMode === "voice"}
            onClose={closeBooking}
            hotelName={selectedHotelData.name}
            price={selectedHotelData.price}
          />
          <BookingModal
            isOpen={bookingMode === "form"}
            onClose={closeBooking}
            hotelName={selectedHotelData.name}
            price={selectedHotelData.price}
          />
        </>
      )}
    </div>
  );
}
