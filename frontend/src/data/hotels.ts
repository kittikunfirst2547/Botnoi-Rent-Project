export interface Hotel {
  id: string;
  name: string;
  location: string;
  province: string;
  rating: number;
  reviews: number;
  price: number;
  imageUrl: string;
  images: string[];
  amenities: string[];
  description: string;
  highlights: string[];
}

export const hotels: Hotel[] = [
  {
    id: "1",
    name: "Anantara Siam Resort & Spa",
    location: "สุขุมวิท, กรุงเทพฯ",
    province: "กรุงเทพ",
    rating: 4.9,
    reviews: 1284,
    price: 12500,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949948-56b52db111dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1729717949948-56b52db111dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ],
    amenities: ["WiFi", "Pool", "Breakfast", "Spa", "Fitness", "Restaurant"],
    description:
      "Anantara Siam Bangkok Hotel เป็นโรงแรมหรูระดับ 5 ดาวตั้งอยู่ใจกลางกรุงเทพฯ ย่านสุขุมวิท ใกล้ BTS ราชดำริ ให้บริการห้องพักหรูหราพร้อมวิวเมืองที่งดงาม สระว่ายน้ำกลางแจ้ง สปาระดับโลก และร้านอาหารชื่อดัง เหมาะสำหรับทั้งนักท่องเที่ยวและนักธุรกิจ",
    highlights: [
      "ใจกลางเมือง ใกล้ BTS ราชดำริ",
      "สปาและ Wellness Center ชั้นนำ",
      "ห้องอาหาร Fine Dining หลายแห่ง",
      "สระว่ายน้ำแบบ Infinity Pool",
    ],
  },
  {
    id: "2",
    name: "The Peninsula Bangkok",
    location: "แม่น้ำเจ้าพระยา, กรุงเทพฯ",
    province: "กรุงเทพ",
    rating: 4.8,
    reviews: 956,
    price: 15800,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ],
    amenities: ["WiFi", "Pool", "Breakfast", "Spa", "River View", "Shuttle"],
    description:
      "The Peninsula Bangkok ตั้งอยู่ริมแม่น้ำเจ้าพระยา เป็นโรงแรมหรูที่ได้รับการยกย่องว่าเป็นหนึ่งในโรงแรมที่ดีที่สุดในเอเชีย ให้บริการห้องพักพร้อมวิวแม่น้ำที่งดงาม มีเรือรับส่งส่วนตัว และบริการระดับ world-class",
    highlights: [
      "วิวแม่น้ำเจ้าพระยา 180 องศา",
      "เรือรับส่งส่วนตัวถึง BTS สะพานตากสิน",
      "สระว่ายน้ำริมแม่น้ำ 3 สระ",
      "Afternoon Tea ที่โด่งดังระดับโลก",
    ],
  },
  {
    id: "3",
    name: "Four Seasons Chiang Mai",
    location: "แม่ริม, เชียงใหม่",
    province: "เชียงใหม่",
    rating: 4.9,
    reviews: 743,
    price: 11200,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949712-1c51422693d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1729717949712-1c51422693d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ],
    amenities: ["WiFi", "Pool", "Breakfast", "Spa", "Nature", "Cooking Class"],
    description:
      "Four Seasons Resort Chiang Mai ตั้งอยู่ท่ามกลางทุ่งนาเขียวขจีและภูเขา บรรยากาศเงียบสงบเหมาะกับการพักผ่อน มีกิจกรรมเรียนทำอาหารไทย โยคะ และเดินป่า ให้คุณสัมผัสวิถีชีวิตล้านนาอย่างหรูหรา",
    highlights: [
      "วิวทุ่งนาและภูเขาที่งดงาม",
      "คลาสสอนทำอาหารไทยพร้อมเชฟมืออาชีพ",
      "วิลล่าส่วนตัวพร้อมสระว่ายน้ำ",
      "กิจกรรมท่องเที่ยวเชิงนิเวศ",
    ],
  },
  {
    id: "4",
    name: "Amanpuri Phuket",
    location: "กะตะน้อย, ภูเก็ต",
    province: "ภูเก็ต",
    rating: 5.0,
    reviews: 892,
    price: 28500,
    imageUrl:
      "https://images.unsplash.com/photo-1729708475316-88ec2dc0083e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1729708475316-88ec2dc0083e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ],
    amenities: ["WiFi", "Pool", "Breakfast", "Spa", "Private Beach", "Yacht"],
    description:
      "Amanpuri คือรีสอร์ทหรูแห่งแรกของ Aman Resorts ตั้งอยู่บนเนินเขาริมหาดพันซี ภูเก็ต ให้บริการ Pavilion และ Villa สุดหรูพร้อมสระว่ายน้ำส่วนตัว ชายหาดส่วนตัว และบริการเรือยอชท์",
    highlights: [
      "ชายหาดส่วนตัวน้ำใส",
      "วิลล่าพร้อมสระว่ายน้ำส่วนตัว",
      "บริการเรือยอชท์สำรวจเกาะ",
      "Holistic Spa & Wellness Immersion",
    ],
  },
  {
    id: "5",
    name: "Rayavadee Krabi",
    location: "อ่าวนาง, กระบี่",
    province: "กระบี่",
    rating: 4.8,
    reviews: 671,
    price: 18900,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949780-46e511489c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1729717949780-46e511489c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ],
    amenities: ["WiFi", "Pool", "Breakfast", "Spa", "Kayak", "Rock Climbing"],
    description:
      "Rayavadee ตั้งอยู่บนคาบสมุทรแหลมพระนาง ล้อมรอบด้วยสามหาดสวย ภายในอุทยานแห่งชาติหาดนพรัตน์ธารา ให้บริการ Pavilion สไตล์ไทยท่ามกลางป่าเขตร้อน พร้อมกิจกรรมทางทะเลและปีนหน้าผา",
    highlights: [
      "ตั้งอยู่ท่ามกลาง 3 หาดสวย",
      "กิจกรรมพายเรือคายัคและดำน้ำ",
      "ร้านอาหารในถ้ำ Grotto",
      "เส้นทางเดินป่าในอุทยานแห่งชาติ",
    ],
  },
  {
    id: "6",
    name: "Six Senses Samui",
    location: "เกาะสมุย, สุราษฎร์ธานี",
    province: "สมุย",
    rating: 4.9,
    reviews: 834,
    price: 21500,
    imageUrl:
      "https://images.unsplash.com/photo-1729708790867-53bff22daa17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    images: [
      "https://images.unsplash.com/photo-1729708790867-53bff22daa17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    ],
    amenities: ["WiFi", "Pool", "Breakfast", "Spa", "Wellness", "Yoga"],
    description:
      "Six Senses Samui ตั้งอยู่บนเนินเขาทางเหนือของเกาะสมุย มองเห็นวิวอ่าวไทยอันกว้างใหญ่ เน้นแนวคิด Wellness & Sustainability มีโปรแกรม Detox, โยคะ, สปาออร์แกนิก และฟาร์มผักของโรงแรมเอง",
    highlights: [
      "วิวอ่าวไทยจากวิลล่าส่วนตัว",
      "โปรแกรม Wellness & Detox ชั้นนำ",
      "สปาออร์แกนิกกลางสวนเขตร้อน",
      "ฟาร์มออร์แกนิกของโรงแรม",
    ],
  },
];

export function getHotelById(id: string): Hotel | undefined {
  return hotels.find((h) => h.id === id);
}

export function getHotelByName(name: string): Hotel | undefined {
  return hotels.find((h) => h.name.toLowerCase() === name.toLowerCase());
}
