"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  Sparkles,
  Sun,
  Moon,
  Shield,
  Zap,
  Heart,
  Globe,
  Users,
  Award,
  Target,
  Lightbulb,
  HeadphonesIcon,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";

const stats = [
  { label: "โรงแรมพันธมิตร", value: "500+", icon: Globe },
  { label: "ผู้ใช้งาน", value: "100K+", icon: Users },
  { label: "รีวิว 5 ดาว", value: "50K+", icon: Award },
  { label: "จังหวัดครอบคลุม", value: "77", icon: MapPin },
];

const values = [
  {
    icon: Shield,
    title: "ปลอดภัย & น่าเชื่อถือ",
    description: "ระบบชำระเงินที่ปลอดภัย การจองได้รับการยืนยันทันที พร้อมนโยบายคืนเงินที่ชัดเจน",
  },
  {
    icon: Zap,
    title: "รวดเร็วด้วย AI",
    description: "เทคโนโลยี AI ช่วยค้นหาโรงแรมที่ใช่ในไม่กี่วินาที พร้อมจองด้วยเสียงได้ทันที",
  },
  {
    icon: Heart,
    title: "ใส่ใจทุกรายละเอียด",
    description: "ทีมงานคัดสรรโรงแรมคุณภาพ ตรวจสอบมาตรฐานอย่างสม่ำเสมอ เพื่อประสบการณ์ที่ดีที่สุด",
  },
  {
    icon: HeadphonesIcon,
    title: "ซัพพอร์ต 24/7",
    description: "ทีมดูแลลูกค้าพร้อมให้บริการตลอด 24 ชั่วโมง ทั้งแชท โทรศัพท์ และอีเมล",
  },
];

const team = [
  { name: "สมชาย วงศ์ดี", role: "CEO & Founder", emoji: "👨‍💼" },
  { name: "สมหญิง รักดี", role: "CTO", emoji: "👩‍💻" },
  { name: "วิชัย สร้างสรรค์", role: "Head of Design", emoji: "🎨" },
  { name: "พิมพ์ใจ ใจดี", role: "Head of Customer Success", emoji: "💬" },
];

const milestones = [
  { year: "2023", title: "ก่อตั้ง Javis", desc: "เริ่มต้นจากไอเดียเรื่องการจองโรงแรมด้วย AI" },
  { year: "2024", title: "เปิดตัว Beta", desc: "เปิดให้บริการครั้งแรกกับโรงแรม 50 แห่ง" },
  { year: "2025", title: "ขยายทั่วประเทศ", desc: "ครอบคลุม 77 จังหวัด กว่า 500 โรงแรม" },
  { year: "2026", title: "AI Voice Booking", desc: "เปิดตัวระบบจองด้วยเสียง AI ครั้งแรกในไทย" },
];

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

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

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-500" style={{ fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl transition-colors duration-500">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-brand)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="m-0 text-lg font-semibold text-[var(--foreground)] transition-colors duration-500" style={{ fontFamily: "var(--font-display)" }}>Javis</h1>
                <p className="m-0 text-[11px] tracking-wide text-[var(--muted-foreground)]">AI Hotel Booking</p>
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <nav className="hidden items-center gap-6 md:flex">
                {[
                  { label: "โรงแรม", href: "/" },
                  { label: "โปรโมชัน", href: "/promotions" },
                  { label: "เกี่ยวกับเรา", href: "/about" },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className={`text-sm no-underline transition-colors duration-200 ${item.label === "เกี่ยวกับเรา" ? "font-medium text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[var(--border)] hover:text-[var(--foreground)]" aria-label="Toggle dark mode">
                {resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--accent-brand)] opacity-[0.04] blur-[120px]" />
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs text-[var(--muted-foreground)] shadow-sm">
              <Lightbulb className="h-3.5 w-3.5 text-[var(--accent-brand)]" />
              เกี่ยวกับเรา
            </div>
            <h2 className="mx-auto mb-4 max-w-lg text-[var(--foreground)] text-3xl font-semibold leading-tight tracking-tight transition-colors duration-500 md:text-[42px] md:leading-[1.15]" style={{ fontFamily: "var(--font-display)" }}>
              เปลี่ยนการจองโรงแรม
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-brand)] to-teal-400 bg-clip-text text-transparent">ให้ง่ายด้วย AI</span>
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
              Javis คือแพลตฟอร์มจองโรงแรมที่ขับเคลื่อนด้วย AI เพื่อให้คุณค้นหาที่พักที่ใช่ได้ง่ายและรวดเร็วที่สุด
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }} className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-white/[0.02]">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-brand)]/10 text-[var(--accent-brand)] transition-transform duration-300 group-hover:scale-110">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>{stat.value}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--muted)]/50 p-8 md:p-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-brand)] text-white">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2" style={{ fontFamily: "var(--font-display)" }}>วิสัยทัศน์ของเรา</h3>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)] md:text-base">
                เราเชื่อว่าเทคโนโลยีสามารถเปลี่ยนประสบการณ์การท่องเที่ยวให้ดีขึ้นได้ Javis ถูกสร้างขึ้นมาเพื่อให้ทุกคนเข้าถึงโรงแรมคุณภาพได้อย่างง่ายดาย — ไม่ว่าจะเป็นนักท่องเที่ยวครั้งแรก หรือนักเดินทางตัวยง เราใช้ AI เพื่อเรียนรู้ความชอบของคุณ แนะนำที่พักที่เหมาะสม และทำให้ทุกการจองเป็นเรื่องที่สนุกและไร้กังวล
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>สิ่งที่เราให้ความสำคัญ</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">ค่านิยมหลักที่ขับเคลื่อนทุกสิ่งที่เราทำ</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {values.map((val, i) => (
              <motion.div key={val.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-white/[0.02]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-brand)]/10 text-[var(--accent-brand)] transition-transform duration-300 group-hover:scale-110">
                  <val.icon className="h-5 w-5" />
                </div>
                <h4 className="mb-2 text-base font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>{val.title}</h4>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{val.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>เส้นทางของเรา</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">จากไอเดียเล็กๆ สู่แพลตฟอร์มจองโรงแรม AI ชั้นนำ</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border)] md:left-1/2 md:-translate-x-px" />
            {milestones.map((m, i) => (
              <motion.div key={m.year} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className={`relative mb-8 flex items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} md:text-${i % 2 === 0 ? "right" : "left"}`}>
                <div className="hidden md:block md:w-1/2" />
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--accent-brand)] bg-[var(--card)] z-10">
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-brand)]" />
                </div>
                <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                    <span className="text-xs font-semibold text-[var(--accent-brand)]">{m.year}</span>
                    <h4 className="mt-1 text-base font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>{m.title}</h4>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{m.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div className="mb-8 text-center">
            <h3 className="text-xl font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>ทีมของเรา</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">ผู้คนเบื้องหลังที่ทำให้ Javis เป็นจริง</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {team.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-center transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-white/[0.02]">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--muted)] text-3xl transition-transform duration-300 group-hover:scale-110">{member.emoji}</div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{member.name}</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-brand)]/5 to-[var(--card)] p-8 text-center md:p-12">
          <h3 className="mb-3 text-xl font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>ติดต่อเรา</h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-[var(--muted-foreground)]">มีคำถามหรือข้อเสนอแนะ? ทีมงานของเรายินดีรับฟังเสมอ</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:hello@javis.ai" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] no-underline transition-all duration-200 hover:border-[var(--accent-brand)]/40 hover:shadow-md">
              <Mail className="h-4 w-4 text-[var(--accent-brand)]" />
              hello@javis.ai
            </a>
            <a href="tel:+6621234567" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] no-underline transition-all duration-200 hover:border-[var(--accent-brand)]/40 hover:shadow-md">
              <Phone className="h-4 w-4 text-[var(--accent-brand)]" />
              02-123-4567
            </a>
          </div>
        </motion.div>
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
                <span className="text-base font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>Javis</span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">แพลตฟอร์มจองโรงแรมด้วย AI ที่ทันสมัยที่สุด</p>
            </div>
            {[
              { title: "บริการ", links: [{ label: "จองโรงแรม", href: "/" }, { label: "AI Assistant", href: "/" }, { label: "โปรโมชัน", href: "/promotions" }] },
              { title: "บริษัท", links: [{ label: "เกี่ยวกับเรา", href: "/about" }, { label: "ติดต่อเรา", href: "#" }, { label: "ร่วมงานกับเรา", href: "#" }] },
              { title: "ช่วยเหลือ", links: [{ label: "ศูนย์ช่วยเหลือ", href: "#" }, { label: "นโยบายความเป็นส่วนตัว", href: "#" }, { label: "เงื่อนไขการใช้งาน", href: "#" }] },
            ].map((section) => (
              <div key={section.title}>
                <h5 className="mb-3 text-sm font-medium text-[var(--foreground)]">{section.title}</h5>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-[var(--muted-foreground)] no-underline transition-colors hover:text-[var(--foreground)]">{link.label}</Link>
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
