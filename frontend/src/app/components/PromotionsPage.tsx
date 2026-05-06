"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  Sparkles,
  Sun,
  Moon,
  ArrowRight,
  Clock,
  Tag,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  Zap,
  Crown,
  Heart,
  Bird,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { promotions, type Promotion } from "../../data/promotions";
import { hotels } from "../../data/hotels";

type CategoryFilter = "all" | Promotion["category"];

const categoryLabels: Record<CategoryFilter, string> = {
  all: "ทั้งหมด",
  seasonal: "ตามฤดูกาล",
  flash: "Flash Sale",
  member: "สมาชิก",
  package: "แพ็คเกจ",
  "early-bird": "จองล่วงหน้า",
};

const categoryIcons: Record<CategoryFilter, React.ReactNode> = {
  all: <Tag className="h-3.5 w-3.5" />,
  seasonal: <CalendarDays className="h-3.5 w-3.5" />,
  flash: <Zap className="h-3.5 w-3.5" />,
  member: <Crown className="h-3.5 w-3.5" />,
  package: <Heart className="h-3.5 w-3.5" />,
  "early-bird": <Bird className="h-3.5 w-3.5" />,
};

const badgeColorMap: Record<Promotion["badgeColor"], string> = {
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  amber:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  green:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  purple:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
};

function CountdownTimer({ validUntil }: { validUntil: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const end = new Date(validUntil + "T23:59:59");
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("หมดเขตแล้ว");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 30) {
        setTimeLeft(`เหลือ ${days} วัน`);
      } else if (days > 0) {
        setTimeLeft(`เหลือ ${days} วัน ${hours} ชม.`);
      } else {
        setTimeLeft(`เหลือ ${hours} ชม. ${mins} นาที`);
      }
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [validUntil]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  );
}

function PromoCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group/copy inline-flex items-center gap-2 rounded-lg border border-dashed border-[var(--accent-brand)]/40 bg-[var(--accent-brand)]/5 px-3.5 py-2 text-sm font-mono font-medium text-[var(--accent-brand)] transition-all duration-200 hover:border-[var(--accent-brand)] hover:bg-[var(--accent-brand)]/10 active:scale-[0.97]"
    >
      <span>{code}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover/copy:opacity-100" />
      )}
    </button>
  );
}

function LinkedHotels({ hotelIds }: { hotelIds: string[] }) {
  const linkedHotels = hotels.filter((h) => hotelIds.includes(h.id));
  if (linkedHotels.length === 0) return null;

  return (
    <div className="mt-5 space-y-2.5">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
        โรงแรมที่ร่วมรายการ
      </p>
      <div className="flex flex-col gap-2">
        {linkedHotels.map((hotel) => (
          <Link
            key={hotel.id}
            href={`/hotel/${hotel.id}`}
            className="group/hotel flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-3 no-underline transition-all duration-200 hover:border-[var(--accent-brand)]/30 hover:bg-[var(--muted)]"
          >
            <img
              src={hotel.imageUrl}
              alt={hotel.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)] transition-colors group-hover/hotel:text-[var(--accent-brand)]">
                {hotel.name}
              </p>
              <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate text-xs">{hotel.location}</span>
                <span className="text-xs">•</span>
                <Star className="h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-400" />
                <span className="text-xs">{hotel.rating}</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--muted-foreground)] transition-all duration-200 group-hover/hotel:translate-x-0.5 group-hover/hotel:text-[var(--accent-brand)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function PromotionCard({
  promo,
  index,
}: {
  promo: Promotion;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-white/[0.03]"
    >
      {/* Image Header */}
      <div className="relative h-52 overflow-hidden bg-[var(--muted)]">
        <img
          src={promo.imageUrl}
          alt={promo.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Badge */}
        <div
          className={`absolute top-3 left-3 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm ${badgeColorMap[promo.badgeColor]}`}
        >
          {promo.badge}
        </div>

        {/* Discount */}
        <div className="absolute right-3 bottom-3 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: "var(--font-display)" }}>
            {promo.discountPercent}%
          </span>
          <span className="text-sm font-medium text-white/80">OFF</span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-3 left-3 right-20">
          <h3
            className="text-lg font-semibold leading-tight text-white drop-shadow-md"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {promo.title}
          </h3>
          <p className="mt-0.5 text-sm text-white/75">{promo.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Countdown & dates */}
        <div className="mb-4 flex items-center justify-between">
          <CountdownTimer validUntil={promo.validUntil} />
          <span className="text-xs text-[var(--muted-foreground)]">
            {new Date(promo.validFrom).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
            })}{" "}
            -{" "}
            {new Date(promo.validUntil).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {promo.description}
        </p>

        {/* Price info */}
        {promo.originalPrice && promo.promoPrice && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--muted)]/60 px-4 py-3">
            <div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                ราคาปกติ
              </p>
              <p className="text-sm text-[var(--muted-foreground)] line-through">
                ฿{promo.originalPrice.toLocaleString()}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            <div>
              <p className="text-[11px] text-[var(--accent-brand)]">
                ราคาโปรโมชัน
              </p>
              <p
                className="text-xl font-semibold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ฿{promo.promoPrice.toLocaleString()}
              </p>
            </div>
            <span className="ml-auto text-xs text-[var(--muted-foreground)]">
              /คืน
            </span>
          </div>
        )}

        {/* Promo Code */}
        {promo.code && (
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs text-[var(--muted-foreground)]">
              ใช้โค้ด:
            </span>
            <PromoCodeCopy code={promo.code} />
          </div>
        )}

        {/* Expandable terms */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between rounded-lg px-0 py-2 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <span>เงื่อนไขและรายละเอียด</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ul className="mb-4 space-y-1.5 pt-1">
                {promo.terms.map((term, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]"
                  >
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--muted-foreground)]" />
                    {term}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Linked Hotels */}
        <LinkedHotels hotelIds={promo.hotelIds} />

        {/* CTA */}
        <div className="mt-5 flex gap-3">
          {promo.hotelIds.length === 1 ? (
            <Link
              href={`/hotel/${promo.hotelIds[0]}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent-brand)] px-5 py-2.5 text-sm font-medium text-white no-underline transition-all duration-200 hover:bg-[var(--accent-brand-hover)] active:scale-[0.97]"
            >
              จองเลย
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={`/hotel/${promo.hotelIds[0]}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent-brand)] px-5 py-2.5 text-sm font-medium text-white no-underline transition-all duration-200 hover:bg-[var(--accent-brand-hover)] active:scale-[0.97]"
            >
              ดูโรงแรมที่ร่วมรายการ
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PromotionsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[var(--muted)] rounded" />
            <div className="h-64 bg-[var(--muted)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const filteredPromos =
    activeCategory === "all"
      ? promotions
      : promotions.filter((p) => p.category === activeCategory);

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
                {[
                  { label: "โรงแรม", href: "/" },
                  { label: "โปรโมชัน", href: "/promotions" },
                  { label: "เกี่ยวกับเรา", href: "/about" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-sm no-underline transition-colors duration-200 ${
                      item.label === "โปรโมชัน"
                        ? "font-medium text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <button
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                aria-label="Toggle dark mode"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--accent-brand)] opacity-[0.04] blur-[120px]" />

        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs text-[var(--muted-foreground)] shadow-sm">
              <Tag className="h-3.5 w-3.5 text-[var(--accent-brand)]" />
              โปรโมชันพิเศษ
            </div>
            <h2
              className="mx-auto mb-4 max-w-lg text-[var(--foreground)] text-3xl font-semibold leading-tight tracking-tight transition-colors duration-500 md:text-[42px] md:leading-[1.15]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ดีลสุดพิเศษ
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-brand)] to-teal-400 bg-clip-text text-transparent">
                เฉพาะที่ Javis
              </span>
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
              รวมโปรโมชันจากโรงแรมชั้นนำทั่วไทย ประหยัดสูงสุด 50%
              พร้อมสิทธิพิเศษมากมาย
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mx-auto max-w-6xl px-6 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
        >
          {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "border-[var(--accent-brand)] bg-[var(--accent-brand)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent-brand)]/40 hover:text-[var(--foreground)]"
              }`}
            >
              {categoryIcons[cat]}
              {categoryLabels[cat]}
            </button>
          ))}
        </motion.div>
      </section>

      {/* Promotions Grid */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filteredPromos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPromos.map((promo, index) => (
                  <PromotionCard key={promo.id} promo={promo} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--muted)]">
                  <Tag className="h-7 w-7 text-[var(--muted-foreground)]" />
                </div>
                <h3
                  className="mb-2 text-lg font-semibold text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  ไม่พบโปรโมชัน
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  ยังไม่มีโปรโมชันในหมวดหมู่นี้
                  ลองเลือกหมวดหมู่อื่นดูนะคะ
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] transition-colors duration-500">
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
              {
                title: "บริการ",
                links: [
                  { label: "จองโรงแรม", href: "/" },
                  { label: "AI Assistant", href: "/" },
                  { label: "โปรโมชัน", href: "/promotions" },
                ],
              },
              {
                title: "บริษัท",
                links: [
                  { label: "เกี่ยวกับเรา", href: "/about" },
                  { label: "ติดต่อเรา", href: "#" },
                  { label: "ร่วมงานกับเรา", href: "#" },
                ],
              },
              {
                title: "ช่วยเหลือ",
                links: [
                  { label: "ศูนย์ช่วยเหลือ", href: "#" },
                  { label: "นโยบายความเป็นส่วนตัว", href: "#" },
                  { label: "เงื่อนไขการใช้งาน", href: "#" },
                ],
              },
            ].map((section) => (
              <div key={section.title}>
                <h5 className="mb-3 text-sm font-medium text-[var(--foreground)]">
                  {section.title}
                </h5>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--muted-foreground)] no-underline transition-colors hover:text-[var(--foreground)]"
                      >
                        {link.label}
                      </Link>
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
    </div>
  );
}
