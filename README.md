# 🏨 Javis — AI Hotel Booking Platform

> แพลตฟอร์มจองโรงแรมด้วย AI ที่ทันสมัย พัฒนาด้วย React + Vite + TailwindCSS พร้อม Botnoi AI Chatbot

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)

---

## ✨ Features

- 🤖 **AI Chatbot** — Botnoi AI assistant สำหรับแนะนำโรงแรมและช่วยจอง
- 🌙 **Dark Mode** — สลับ Light/Dark mode พร้อม animation เนียนนุ่ม
- 🏨 **Hotel Listing** — แสดงรายการโรงแรมแนะนำพร้อมรูปภาพ ราคา และสิ่งอำนวยความสะดวก
- 🔍 **Search Bar** — ค้นหาโรงแรมตามสถานที่และวันที่เช็คอิน/เช็คเอาท์
- 📅 **Booking Modal** — ระบบจองห้องพักแบบ interactive
- 🎨 **Smooth Animations** — ใช้ Framer Motion (motion/react) สำหรับ animation ทุกส่วน
- 📱 **Responsive Design** — รองรับทุกขนาดหน้าจอ

---

## 🛠️ Tech Stack

| Category      | Technology                          |
|---------------|-------------------------------------|
| Framework     | React 18 + TypeScript               |
| Build Tool    | Vite 6                              |
| Styling       | TailwindCSS 4 + shadcn/ui           |
| Animation     | Motion (Framer Motion)              |
| UI Components | Radix UI + shadcn/ui                |
| Icons         | Lucide React + MUI Icons            |
| AI Chatbot    | Botnoi Voice AI Widget              |
| Date Picker   | React Day Picker                    |
| Charts        | Recharts                            |
| Package Mgr   | npm / pnpm                          |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm หรือ pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/kittikunfirst2547/Botnoi-Rent-Project.git
cd Botnoi-Rent-Project

# Install dependencies
npm install
# หรือใช้ pnpm
pnpm install
```

### Run Development Server

```bash
npm run dev
# หรือ
pnpm dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
javis-project/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Main application component
│   │   └── components/
│   │       ├── HotelCard.tsx          # Hotel listing card
│   │       ├── SearchBar.tsx          # Search & filter bar
│   │       ├── BookingModal.tsx       # Booking dialog modal
│   │       ├── BotnoiChat.tsx         # Botnoi AI chatbot widget
│   │       ├── AIAssistant.tsx        # AI assistant component
│   │       ├── figma/
│   │       │   └── ImageWithFallback.tsx
│   │       └── ui/                    # shadcn/ui components
│   ├── styles/
│   │   ├── index.css                  # Global styles
│   │   ├── tailwind.css               # Tailwind base
│   │   ├── theme.css                  # Design tokens / CSS variables
│   │   └── fonts.css                  # Font imports
│   └── main.tsx                       # App entry point
├── package.json
├── vite.config.ts
├── postcss.config.mjs
└── README.md
```

---

## 🤖 Botnoi AI Chatbot

โปรเจกต์นี้รวม **Botnoi Voice AI** chatbot ไว้ที่มุมล่างขวาของหน้าเว็บ ผู้ใช้สามารถ:
- พิมพ์ข้อความสอบถามเกี่ยวกับโรงแรม
- ขอคำแนะนำสถานที่ท่องเที่ยว
- สอบถามราคาและโปรโมชัน

---

## 🌙 Dark Mode

กดไอคอนดวงจันทร์/ดวงอาทิตย์ที่ Navigation Bar เพื่อสลับ theme  
ระบบจะจำค่าที่เลือกไว้ใน `localStorage` สำหรับการใช้งานครั้งต่อไป

---

## 🏨 Hotels Available

| โรงแรม | สถานที่ | ราคา/คืน |
|--------|---------|-----------|
| Anantara Siam Resort & Spa | สุขุมวิท, กรุงเทพฯ | ฿12,500 |
| The Peninsula Bangkok | แม่น้ำเจ้าพระยา, กรุงเทพฯ | ฿15,800 |
| Four Seasons Chiang Mai | แม่ริม, เชียงใหม่ | ฿11,200 |
| Amanpuri Phuket | กะตะน้อย, ภูเก็ต | ฿28,500 |
| Rayavadee Krabi | อ่าวนาง, กระบี่ | ฿18,900 |
| Six Senses Samui | เกาะสมุย, สุราษฎร์ธานี | ฿21,500 |

---

## 📄 License

This project is private and proprietary.  
© 2026 Javis. All rights reserved.

---

## 👨‍💻 Developer

**Kittikun** — [@kittikunfirst2547](https://github.com/kittikunfirst2547)
