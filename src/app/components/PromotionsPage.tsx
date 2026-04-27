import { useState, useEffect } from "react";
import {
  Flame,
  Clock,
  Percent,
  Gift,
  Zap,
  Crown,
  ArrowRight,
  Star,
  MapPin,
  Sparkles,
  Tag,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discount: number;
  discountType: "percent" | "fixed";
  code: string;
  validUntil: Date;
  imageUrl: string;
  tag: string;
  tagColor: string;
  tagIcon: React.ReactNode;
  hotelName?: string;
  location?: string;
  originalPrice?: number;
  conditions: string[];
}

const promotions: Promotion[] = [
  {
    id: "1",
    title: "Summer Escape Deal",
    subtitle: "พักผ่อนสุดพิเศษช่วงซัมเมอร์",
    description:
      "รับส่วนลดสูงสุด 40% สำหรับโรงแรมริมทะเลทั่วประเทศ พร้อมอาหารเช้าฟรี และ Late checkout จนถึง 14:00 น.",
    discount: 40,
    discountType: "percent",
    code: "SUMMER40",
    validUntil: new Date("2026-06-30"),
    imageUrl:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tag: "Hot Deal",
    tagColor: "from-red-500 to-orange-500",
    tagIcon: <Flame className="w-3.5 h-3.5" />,
    hotelName: "Amanpuri Phuket",
    location: "ภูเก็ต",
    originalPrice: 28500,
    conditions: ["จองขั้นต่ำ 2 คืน", "ใช้ได้ถึง 30 มิ.ย. 2026"],
  },
  {
    id: "2",
    title: "Early Bird Saver",
    subtitle: "จองล่วงหน้า ประหยัดกว่า",
    description:
      "จองล่วงหน้า 30 วัน รับส่วนลด 25% ทุกโรงแรมในเครือ พร้อมอัปเกรดห้องฟรี (ขึ้นอยู่กับห้องว่าง)",
    discount: 25,
    discountType: "percent",
    code: "EARLY25",
    validUntil: new Date("2026-08-31"),
    imageUrl:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tag: "แนะนำ",
    tagColor: "from-violet-500 to-purple-600",
    tagIcon: <Crown className="w-3.5 h-3.5" />,
    hotelName: "Four Seasons Chiang Mai",
    location: "เชียงใหม่",
    originalPrice: 11200,
    conditions: ["จองล่วงหน้าอย่างน้อย 30 วัน", "ไม่สามารถยกเลิกได้"],
  },
  {
    id: "3",
    title: "Weekend Getaway",
    subtitle: "หนีเที่ยวสุดสัปดาห์",
    description:
      "พักศุกร์-อาทิตย์ รับราคาพิเศษ 3,500 บาท/คืน รวมอาหารเช้า สปา 60 นาที และ Minibar ฟรี",
    discount: 3500,
    discountType: "fixed",
    code: "WEEKEND",
    validUntil: new Date("2026-07-31"),
    imageUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tag: "Flash Sale",
    tagColor: "from-amber-500 to-yellow-500",
    tagIcon: <Zap className="w-3.5 h-3.5" />,
    hotelName: "The Peninsula Bangkok",
    location: "กรุงเทพฯ",
    originalPrice: 15800,
    conditions: ["เฉพาะวันศุกร์-อาทิตย์", "จำกัด 50 ห้อง/สัปดาห์"],
  },
  {
    id: "4",
    title: "Honeymoon Package",
    subtitle: "แพ็คเกจฮันนีมูนสุดโรแมนติก",
    description:
      "แพ็คเกจพิเศษสำหรับคู่รัก พร้อม Candle Light Dinner, สปาคู่ และตกแต่งห้องพิเศษ รับส่วนลด 30%",
    discount: 30,
    discountType: "percent",
    code: "LOVE30",
    validUntil: new Date("2026-12-31"),
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tag: "Romantic",
    tagColor: "from-pink-500 to-rose-500",
    tagIcon: <Gift className="w-3.5 h-3.5" />,
    hotelName: "Six Senses Samui",
    location: "เกาะสมุย",
    originalPrice: 21500,
    conditions: ["จองขั้นต่ำ 3 คืน", "รวมอาหารเย็น 1 มื้อ"],
  },
  {
    id: "5",
    title: "Member Exclusive",
    subtitle: "สิทธิพิเศษสมาชิก Javis",
    description:
      "สมาชิก Javis รับส่วนลดเพิ่ม 15% ทุกการจอง พร้อม Welcome Drink และ Late checkout ฟรี ตลอดปี",
    discount: 15,
    discountType: "percent",
    code: "MEMBER15",
    validUntil: new Date("2026-12-31"),
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tag: "สมาชิก",
    tagColor: "from-emerald-500 to-teal-500",
    tagIcon: <Star className="w-3.5 h-3.5" />,
    hotelName: "Rayavadee Krabi",
    location: "กระบี่",
    originalPrice: 18900,
    conditions: ["เฉพาะสมาชิก Javis", "ใช้ร่วมกับโปรอื่นไม่ได้"],
  },
  {
    id: "6",
    title: "Long Stay Savings",
    subtitle: "พักยาว จ่ายน้อย",
    description:
      "พัก 5 คืนขึ้นไป รับส่วนลด 35% พร้อมบริการรถรับ-ส่งสนามบินฟรี และซักรีดฟรี 3 ชิ้น/วัน",
    discount: 35,
    discountType: "percent",
    code: "LONGSTAY35",
    validUntil: new Date("2026-09-30"),
    imageUrl:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tag: "Best Value",
    tagColor: "from-blue-500 to-cyan-500",
    tagIcon: <Tag className="w-3.5 h-3.5" />,
    hotelName: "Anantara Siam Resort",
    location: "กรุงเทพฯ",
    originalPrice: 12500,
    conditions: ["พักขั้นต่ำ 5 คืน", "รวมรถรับ-ส่งสนามบิน"],
  },
];

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calculateTimeLeft(targetDate: Date) {
  const diff = targetDate.getTime() - new Date().getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate);
  const units = [
    { label: "วัน", value: days },
    { label: "ชม.", value: hours },
    { label: "นาที", value: minutes },
    { label: "วินาที", value: seconds },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[44px] text-center">
              <span className="text-lg font-bold text-black dark:text-white tabular-nums">
                {String(unit.value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {unit.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-black/30 dark:text-white/30 font-bold text-lg mb-4">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 bg-black/5 dark:bg-white/10 border border-dashed border-black/20 dark:border-white/20 rounded-lg px-4 py-2 hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
    >
      <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <span className="font-mono font-bold text-sm text-black dark:text-white tracking-wider">
        {code}
      </span>
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
          >
            คัดลอกแล้ว!
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-xs text-gray-400 dark:text-gray-500"
          >
            คัดลอก
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function PromotionCard({ promo, index }: { promo: Promotion; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const discountedPrice = promo.originalPrice
    ? promo.discountType === "percent"
      ? promo.originalPrice * (1 - promo.discount / 100)
      : promo.discount
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/40"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={promo.imageUrl}
          alt={promo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Tag Badge */}
        <div className="absolute top-4 left-4">
          <div
            className={`flex items-center gap-1.5 bg-gradient-to-r ${promo.tagColor} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}
          >
            {promo.tagIcon}
            {promo.tag}
          </div>
        </div>

        {/* Discount Badge */}
        <div className="absolute top-4 right-4">
          <motion.div
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="bg-white dark:bg-gray-900 text-black dark:text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1"
          >
            <Percent className="w-3.5 h-3.5" />
            {promo.discountType === "percent"
              ? `${promo.discount}% OFF`
              : `฿${promo.discount.toLocaleString()}`}
          </motion.div>
        </div>

        {/* Bottom info on image */}
        {promo.hotelName && (
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/80 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {promo.location}
            </p>
            <p className="text-white text-base font-semibold mt-0.5">
              {promo.hotelName}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3
          className="text-black dark:text-white text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {promo.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {promo.subtitle}
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          {promo.description}
        </p>

        {/* Price */}
        {discountedPrice && promo.originalPrice && (
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold text-black dark:text-white" style={{ fontFamily: "var(--font-display)" }}>
              ฿{Math.round(discountedPrice).toLocaleString()}
            </span>
            <span className="text-sm text-gray-400 line-through">
              ฿{promo.originalPrice.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">/คืน</span>
          </div>
        )}

        {/* Promo Code */}
        <div className="flex items-center justify-between mb-4">
          <CopyCodeButton code={promo.code} />
        </div>

        {/* Countdown */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>เหลือเวลา</span>
          </div>
          <CountdownTimer targetDate={promo.validUntil} />
        </div>

        {/* Expandable Conditions */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <CalendarDays className="w-3 h-3" />
          เงื่อนไข
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="inline-block"
          >
            ▾
          </motion.span>
        </motion.button>
        <AnimatePresence>
          {isExpanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 space-y-1"
            >
              {promo.conditions.map((c, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-5 px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-semibold text-sm flex items-center justify-center gap-2 group/btn"
        >
          จองตอนนี้
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export function PromotionsPage() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-8 py-12">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl overflow-hidden mb-16"
      >
        <div className="relative h-[340px] md:h-[400px]">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Promotions Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/20">
                  <Sparkles className="w-4 h-4" />
                  โปรโมชันพิเศษ
                </div>
              </div>
              <h2
                className="text-white text-4xl md:text-5xl font-bold mb-4 max-w-lg"
                style={{
                  fontFamily: "var(--font-display)",
                  lineHeight: "1.2",
                }}
              >
                ดีลพิเศษ
                <br />
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  สำหรับคุณ
                </span>
              </h2>
              <p className="text-white/80 text-base md:text-lg max-w-md mb-6">
                รวมโปรโมชันที่ดีที่สุดจากโรงแรมชั้นนำทั่วประเทศ
                จองวันนี้ในราคาสุดคุ้ม
              </p>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <div className="flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  <span>6 โปรโมชันพิเศษ</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4" />
                  <span>ส่วนลดสูงสุด 40%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <h3
            className="text-black dark:text-white text-3xl font-bold transition-colors duration-300"
            style={{ fontFamily: "var(--font-display)" }}
          >
            โปรโมชันทั้งหมด
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            เลือกดีลที่ใช่สำหรับคุณ
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>อัปเดตล่าสุด</span>
        </div>
      </motion.div>

      {/* Promotion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promotions.map((promo, index) => (
          <PromotionCard key={promo.id} promo={promo} index={index} />
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 text-center"
      >
        <div className="relative inline-block">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl px-12 py-10 border border-gray-200 dark:border-gray-700">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-4" />
            <h4
              className="text-black dark:text-white text-2xl font-bold mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ยังหาดีลที่ใช่ไม่เจอ?
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              ให้ Javis AI ช่วยแนะนำโปรโมชันที่เหมาะกับคุณ
              เพียงบอกความต้องการของคุณ
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              ถาม Javis AI
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
