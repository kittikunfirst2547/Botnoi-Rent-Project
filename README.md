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

### Environment Setup

สร้างไฟล์ `.env` จากตัวอย่างก่อนรัน backend:

```bash
cp .env.example .env
```

จากนั้นใส่ค่า Botnoi API ที่ต้องใช้ใน `.env` เช่น `BOTNOI_TOKEN`, `BOTNOI_API_URL`, `BOTNOI_TTS_URL` และค่าอื่น ๆ ตามที่ทีมได้รับมา

ถ้าต้องการเปิด AI booking assistant แบบใช้ฟรี ให้เพิ่มค่าเหล่านี้ใน `backend/.env`:

```bash
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TIMEOUT_MS=10000
AI_EXTRACTION_MODE=always
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
OPENROUTER_TIMEOUT_MS=10000
OPENROUTER_RATE_LIMIT_COOLDOWN_MS=600000
```

ถ้ามี `GROQ_API_KEY` ระบบจะใช้ Groq ก่อน เพราะ free models ของ OpenRouter อาจโดน upstream rate limit ได้บ่อย จากนั้นค่อย fallback ไป OpenRouter ถ้า Groq ใช้ไม่ได้
ค่า `AI_EXTRACTION_MODE=always` จะให้ AI ช่วยดึงข้อมูลทุกข้อความ ส่วนคำตอบที่แสดงกับลูกค้ายังเป็น flow สั้น ๆ ของ backend เพื่อกัน AI ตอบมั่ว
ค่า `OPENROUTER_MODEL` สามารถใส่ได้หลายโมเดลโดยคั่นด้วย comma ระบบจะลองตามลำดับ เช่นโมเดลที่ลงท้ายด้วย `:free`
ค่า `OPENROUTER_TIMEOUT_MS` คือเวลารอ AI สูงสุด หน่วยเป็นมิลลิวินาที ถ้า AI ช้าเกินนี้ระบบจะใช้ flow สั้น ๆ ของ backend แทน
ค่า `OPENROUTER_RATE_LIMIT_COOLDOWN_MS` คือเวลาพักการเรียก OpenRouter หลังเจอ rate limit เพื่อไม่ให้ยิงซ้ำจนเสีย quota เพิ่ม

> ถ้ายังไม่ได้ใส่ค่า Botnoi บางตัว ระบบ backend ยังรันได้ แต่ endpoint ที่ต้องเรียก Botnoi จริงอาจตอบกลับว่า config ยังไม่ครบ

> ตอนนี้ backend จะพยายามใช้ `OpenRouter` ก่อน ถ้าไม่มี `OPENROUTER_API_KEY` จะ fallback ไป `GEMINI_API_KEY` และถ้าไม่มีทั้งคู่จะใช้ rule-based flow

### Run Backend

เปิด terminal แรก แล้วรัน:

```bash
npm run server
# หรือ
pnpm server
```

backend จะทำงานที่ [http://localhost:3001](http://localhost:3001)

ทดสอบว่า backend พร้อมใช้งานได้ที่:

```bash
curl http://localhost:3001/api/health
```

ควรได้ response ประมาณนี้:

```json
{"ok":true,"ai":"openrouter"}
```

### Run Frontend

เปิด terminal ที่สอง แล้วรัน:

```bash
npm run dev
# หรือ
pnpm dev
```

เปิด browser ที่ [http://localhost:3000](http://localhost:3000)

ในโหมด development frontend ใช้ Next.js และจะ rewrite request ที่ขึ้นต้นด้วย `/api` ไปที่ Express backend `http://localhost:3001` อัตโนมัติ ดังนั้นควรรัน backend และ frontend พร้อมกัน

### Quick Start

```bash
# Terminal 1: backend
npm run server

# Terminal 2: frontend
npm run dev
```

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
