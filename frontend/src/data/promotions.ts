export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discountLabel: string;
  discountPercent: number;
  originalPrice?: number;
  promoPrice?: number;
  code?: string;
  validFrom: string;
  validUntil: string;
  imageUrl: string;
  badge: string;
  badgeColor: "red" | "amber" | "green" | "blue" | "purple";
  hotelIds: string[]; // linked hotel IDs
  terms: string[];
  category: "seasonal" | "flash" | "member" | "package" | "early-bird";
}

export const promotions: Promotion[] = [
  {
    id: "promo-1",
    title: "Summer Escape ลด 40%",
    subtitle: "หนีร้อนไปพักผ่อนริมทะเล",
    description:
      "สัมผัสความสุขริมชายหาดกับส่วนลดสูงสุด 40% สำหรับรีสอร์ทริมทะเลในภูเก็ตและกระบี่ รวมอาหารเช้าและสปาฟรี 1 ครั้ง",
    discountLabel: "ลดสูงสุด 40%",
    discountPercent: 40,
    originalPrice: 28500,
    promoPrice: 17100,
    code: "SUMMER40",
    validFrom: "2026-05-01",
    validUntil: "2026-07-31",
    imageUrl:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    badge: "🔥 Hot Deal",
    badgeColor: "red",
    hotelIds: ["4", "5"],
    terms: [
      "จองขั้นต่ำ 2 คืน",
      "ไม่สามารถใช้ร่วมกับโปรโมชันอื่นได้",
      "รวมอาหารเช้าสำหรับ 2 ท่าน",
      "สปาฟรี 1 ครั้งต่อการเข้าพัก",
    ],
    category: "seasonal",
  },
  {
    id: "promo-2",
    title: "Flash Sale 48 ชั่วโมง",
    subtitle: "โอกาสสุดท้าย ราคาพิเศษสุด!",
    description:
      "ดีลพิเศษจำกัดเวลา 48 ชั่วโมงเท่านั้น! รับส่วนลด 50% สำหรับห้องพักทุกประเภทที่ The Peninsula Bangkok พร้อมอัปเกรดห้องฟรี",
    discountLabel: "ลด 50%",
    discountPercent: 50,
    originalPrice: 15800,
    promoPrice: 7900,
    code: "FLASH50",
    validFrom: "2026-05-04",
    validUntil: "2026-05-06",
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    badge: "⚡ Flash Sale",
    badgeColor: "amber",
    hotelIds: ["2"],
    terms: [
      "จำกัดจำนวนห้อง",
      "ไม่สามารถยกเลิกหรือเปลี่ยนแปลงได้",
      "อัปเกรดห้องขึ้นอยู่กับห้องว่าง",
      "ชำระเงินทันทีเมื่อจอง",
    ],
    category: "flash",
  },
  {
    id: "promo-3",
    title: "สมาชิก Javis Elite ลดเพิ่ม 25%",
    subtitle: "สิทธิพิเศษเฉพาะสมาชิก",
    description:
      "สมาชิก Javis Elite รับส่วนลดเพิ่มอีก 25% สำหรับโรงแรมทุกแห่งในเครือ พร้อม Late Check-out ฟรีและเลานจ์ส่วนตัว",
    discountLabel: "ลดเพิ่ม 25%",
    discountPercent: 25,
    code: "ELITE25",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
    imageUrl:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    badge: "👑 Member Only",
    badgeColor: "purple",
    hotelIds: ["1", "2", "3", "4", "5", "6"],
    terms: [
      "เฉพาะสมาชิก Javis Elite เท่านั้น",
      "Late Check-out ถึง 16:00 น.",
      "เข้าใช้ Executive Lounge",
      "ใช้ได้ตลอดปี 2026",
    ],
    category: "member",
  },
  {
    id: "promo-4",
    title: "แพ็คเกจฮันนีมูน สมุย",
    subtitle: "โรแมนติก 3 วัน 2 คืน",
    description:
      "แพ็คเกจฮันนีมูนสุดโรแมนติกที่ Six Senses Samui รวมอาหารทุกมื้อ คอร์สสปาคู่ Sunset Cruise และตกแต่งห้องพิเศษ",
    discountLabel: "เริ่มต้น ฿35,900/คู่",
    discountPercent: 30,
    originalPrice: 51300,
    promoPrice: 35900,
    code: "HONEYMOON",
    validFrom: "2026-05-01",
    validUntil: "2026-09-30",
    imageUrl:
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    badge: "💕 Honeymoon",
    badgeColor: "red",
    hotelIds: ["6"],
    terms: [
      "แพ็คเกจ 3 วัน 2 คืน",
      "รวมอาหารเช้า กลางวัน เย็น",
      "คอร์สสปาคู่ 90 นาที",
      "Sunset Cruise พร้อมแชมเปญ",
    ],
    category: "package",
  },
  {
    id: "promo-5",
    title: "Early Bird เชียงใหม่ ลด 35%",
    subtitle: "จองล่วงหน้า ประหยัดกว่า",
    description:
      "จองล่วงหน้า 30 วัน รับส่วนลด 35% ที่ Four Seasons Chiang Mai พร้อมรถรับส่งสนามบินฟรีและคลาสทำอาหารไทย",
    discountLabel: "จองล่วงหน้าลด 35%",
    discountPercent: 35,
    originalPrice: 11200,
    promoPrice: 7280,
    code: "EARLYBIRD35",
    validFrom: "2026-05-01",
    validUntil: "2026-08-31",
    imageUrl:
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    badge: "🐦 Early Bird",
    badgeColor: "green",
    hotelIds: ["3"],
    terms: [
      "จองล่วงหน้าอย่างน้อย 30 วัน",
      "ไม่สามารถยกเลิกภายใน 14 วันก่อนเข้าพัก",
      "รถรับส่งสนามบินฟรี",
      "คลาสทำอาหารไทย 1 ครั้ง",
    ],
    category: "early-bird",
  },
  {
    id: "promo-6",
    title: "Staycation กรุงเทพฯ ลด 30%",
    subtitle: "เที่ยวกรุงเทพ ไม่ต้องไปไกล",
    description:
      "Staycation สุดคุ้มที่ Anantara Siam ลด 30% พร้อม Credit ค่าอาหาร ฿2,000 และ Late Check-out ถึง 16:00 น.",
    discountLabel: "ลด 30% + Credit ฿2,000",
    discountPercent: 30,
    originalPrice: 12500,
    promoPrice: 8750,
    code: "STAYCATION30",
    validFrom: "2026-05-01",
    validUntil: "2026-06-30",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    badge: "🏙️ Staycation",
    badgeColor: "blue",
    hotelIds: ["1"],
    terms: [
      "จองขั้นต่ำ 1 คืน",
      "Credit ค่าอาหาร ฿2,000 ต่อการเข้าพัก",
      "Late Check-out ถึง 16:00 น.",
      "ยกเลิกฟรีล่วงหน้า 3 วัน",
    ],
    category: "seasonal",
  },
];

export function getPromotionById(id: string): Promotion | undefined {
  return promotions.find((p) => p.id === id);
}

export function getPromotionsByHotelId(hotelId: string): Promotion[] {
  return promotions.filter((p) => p.hotelIds.includes(hotelId));
}

export function getPromotionsByCategory(category: Promotion["category"]): Promotion[] {
  return promotions.filter((p) => p.category === category);
}
