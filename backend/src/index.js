import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import health from "./routes/health.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const bookingsFile = join(dataDir, "bookings.json");
const bookingsSqliteFile = join(dataDir, "bookings.sqlite");
let bookingsDb;
const sessions = new Map();

// ─── NVIDIA NIM Setup ─────────────────────────────────────────────────────────
const nvidiaApiKey = process.env.NVIDIA_API_KEY ?? "";
const nvidiaModel = process.env.NVIDIA_MODEL ?? "openai/gpt-oss-120b";
const aiMode = nvidiaApiKey ? "nvidia" : "rule-based";

async function chatWithNvidia(prompt) {
  if (!nvidiaApiKey) return "";

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nvidiaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: nvidiaModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      console.warn("NVIDIA API error:", response.status);
      return "";
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    console.warn("NVIDIA chat failed:", err.message);
    return "";
  }
}

async function generateAiText(prompt) {
  return await chatWithNvidia(prompt);
}

function parseJsonObjectFromAiText(text) {
  const cleaned = String(text ?? "").replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // ignore
  }

  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("AI response did not contain a JSON object");

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === "\"") inString = false;
      continue;
    }
    if (char === "\"") inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(cleaned.slice(start, index + 1));
    }
  }

  throw new Error("AI response contained incomplete JSON");
}

// ─── Hotel Data ───────────────────────────────────────────────────────────────
const hotels = [
  "Anantara Siam Resort & Spa",
  "The Peninsula Bangkok",
  "Four Seasons Chiang Mai",
  "Amanpuri Phuket",
  "Rayavadee Krabi",
  "Six Senses Samui",
];

const hotelCatalog = [
  {
    name: "Anantara Siam Resort & Spa",
    location: "กรุงเทพฯ สุขุมวิท",
    province: "กรุงเทพ",
    price: 12500,
    tags: ["city", "luxury", "shopping", "spa", "bangkok"],
    reasons: ["เหมาะกับการพักผ่อนในเมือง", "เดินทางสะดวก", "มีสปาและบริการระดับหรู"],
  },
  {
    name: "The Peninsula Bangkok",
    location: "ริมแม่น้ำเจ้าพระยา กรุงเทพฯ",
    province: "กรุงเทพ",
    price: 15800,
    tags: ["river", "luxury", "romantic", "city", "view", "bangkok"],
    reasons: ["วิวแม่น้ำสวย", "เหมาะกับคู่รัก", "บรรยากาศเงียบกว่ากลางเมือง"],
  },
  {
    name: "Four Seasons Chiang Mai",
    location: "แม่ริม เชียงใหม่",
    province: "เชียงใหม่",
    price: 11200,
    tags: ["mountain", "nature", "quiet", "wellness", "chiang mai"],
    reasons: ["เหมาะกับคนอยากพักใจท่ามกลางธรรมชาติ", "บรรยากาศเงียบ", "วิวภูเขาและทุ่งนา"],
  },
  {
    name: "Amanpuri Phuket",
    location: "กะตะน้อย ภูเก็ต",
    province: "ภูเก็ต",
    price: 28500,
    tags: ["beach", "sea", "luxury", "private", "phuket"],
    reasons: ["เหมาะกับโจทย์ใกล้ทะเล", "บรรยากาศเป็นส่วนตัว", "เหมาะกับการพักผ่อนหรู"],
  },
  {
    name: "Rayavadee Krabi",
    location: "อ่าวนาง กระบี่",
    province: "กระบี่",
    price: 18900,
    tags: ["beach", "sea", "nature", "cliff", "krabi"],
    reasons: ["ใกล้ทะเลและธรรมชาติ", "เหมาะกับสายวิวหน้าผาและชายหาด", "บรรยากาศโรแมนติก"],
  },
  {
    name: "Six Senses Samui",
    location: "เกาะสมุย สุราษฎร์ธานี",
    province: "สมุย",
    price: 21500,
    tags: ["beach", "sea", "wellness", "quiet", "samui"],
    reasons: ["เหมาะกับการพักผ่อนเงียบ ๆ ใกล้ทะเล", "เน้น wellness", "วิวทะเลสวย"],
  },
];

// ─── AI Functions ─────────────────────────────────────────────────────────────

async function extractBookingWithAI(message, currentBooking) {
  if (aiMode === "rule-based") return null;

  const prompt = `วิเคราะห์ข้อความของลูกค้าและดึงข้อมูลการจองโรงแรมออกมา

ข้อมูลการจองปัจจุบัน (ที่มีอยู่แล้ว):
${JSON.stringify(currentBooking, null, 2)}

โรงแรมที่รับจอง:
${hotels.join(", ")}

ข้อความลูกค้า: "${message}"

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบาย ไม่ต้องมี markdown:
{
  "hotelName": "ชื่อโรงแรมเต็ม หรือ '' ถ้าไม่พบ",
  "location": "จังหวัด หรือ '' ถ้าไม่พบ",
  "checkIn": "YYYY-MM-DD หรือ '' ถ้าไม่พบ",
  "checkOut": "YYYY-MM-DD หรือ '' ถ้าไม่พบ",
  "guests": จำนวนคน (number) หรือ 0 ถ้าไม่พบ,
  "customerName": "ชื่อลูกค้า หรือ '' ถ้าไม่พบ",
  "phone": "เบอร์โทร หรือ '' ถ้าไม่พบ"
}

กฎ:
- ถ้าข้อมูลปัจจุบันมีค่าอยู่แล้ว ให้คงค่าเดิมไว้ อย่า overwrite ด้วยค่าว่าง
- hotelName ต้องตรงกับชื่อโรงแรมในรายการเท่านั้น
- checkIn และ checkOut ให้แปลงเป็น YYYY-MM-DD เสมอ ปีปัจจุบันคือ ${new Date().getFullYear()}
- phone ให้เอาแค่ตัวเลข ไม่ต้องมีขีด หรือวรรค`;

  try {
    const text = await generateAiText(prompt);
    if (!text) return null;
    const parsed = parseJsonObjectFromAiText(text);

    return {
      hotelName: parsed.hotelName || currentBooking.hotelName || "",
      location: parsed.location || currentBooking.location || "",
      checkIn: parsed.checkIn || currentBooking.checkIn || "",
      checkOut: parsed.checkOut || currentBooking.checkOut || "",
      guests: parsed.guests || currentBooking.guests || 0,
      customerName: parsed.customerName || currentBooking.customerName || "",
      phone: parsed.phone || currentBooking.phone || "",
      status: currentBooking.status || "collecting",
    };
  } catch (err) {
    console.warn("AI extractBooking failed:", err.message);
    return null;
  }
}

// ─── Database ─────────────────────────────────────────────────────────────────

const emptyBooking = () => ({
  hotelName: "",
  location: "",
  checkIn: "",
  checkOut: "",
  guests: 0,
  customerName: "",
  phone: "",
  status: "collecting",
});

function looksLikePlainCustomerName(text) {
  const value = text.trim();
  if (value.length < 2 || value.length > 40) return false;
  if (/\d/.test(value)) return false;

  // ❌ ห้ามรับคำที่เป็น greeting หรือคำทั่วไป
  const blocklist = [
    "สวัสดี", "หวัดดี", "ดี", "hello", "hi", "hey",
    "จอง", "ต้องการ", "อยาก", "ขอ", "ช่วย",
    "confirm", "ok", "yes", "no", "โอเค", "ยืนยัน", "ตกลง",
    "ครับ", "ค่ะ", "คะ", "นะ", "จ้า", "จ้ะ",
    "ใช่", "ไม่", "ได้", "ไป", "มา", "แล้ว",
  ];
  if (blocklist.some((word) => value.toLowerCase() === word.toLowerCase())) return false;

  // ✅ ต้องมีอักษรไทยหรืออังกฤษเป็นหลัก ไม่มีอักขระแปลกๆ
  return /^[A-Za-zก-๙\s.'-]+$/.test(value);
}

async function ensureDatabase() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(bookingsFile, "utf8");
  } catch {
    await writeFile(bookingsFile, "[]\n", "utf8");
  }

  if (!bookingsDb) {
    bookingsDb = new DatabaseSync(bookingsSqliteFile);
    bookingsDb.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        hotel_name TEXT NOT NULL,
        location TEXT,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        guests INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }
}

async function saveBooking(booking) {
  await ensureDatabase();
  const bookings = JSON.parse(await readFile(bookingsFile, "utf8"));
  const savedBooking = {
    id: randomUUID(),
    ...booking,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  bookings.push(savedBooking);
  await writeFile(bookingsFile, `${JSON.stringify(bookings, null, 2)}\n`, "utf8");
  bookingsDb
    .prepare(
      `INSERT INTO bookings (
        id, hotel_name, location, check_in, check_out,
        guests, customer_name, phone, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      savedBooking.id,
      savedBooking.hotelName,
      savedBooking.location,
      savedBooking.checkIn,
      savedBooking.checkOut,
      savedBooking.guests,
      savedBooking.customerName,
      savedBooking.phone,
      savedBooking.status,
      savedBooking.createdAt
    );
  return savedBooking;
}

// ─── Rule-based Fallback ──────────────────────────────────────────────────────

function normalizeThaiDigits(text) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";
  return text.replace(/[๐-๙]/g, (digit) => String(thaiDigits.indexOf(digit)));
}

function parseDate(text, fallbackYear = new Date().getFullYear()) {
  const normalized = normalizeThaiDigits(text);
  const months = [
    ["มกราคม", "ม.ค.", "jan", "january"],
    ["กุมภาพันธ์", "ก.พ.", "feb", "february"],
    ["มีนาคม", "มี.ค.", "mar", "march"],
    ["เมษายน", "เม.ย.", "apr", "april"],
    ["พฤษภาคม", "พ.ค.", "may"],
    ["มิถุนายน", "มิ.ย.", "jun", "june"],
    ["กรกฎาคม", "ก.ค.", "jul", "july"],
    ["สิงหาคม", "ส.ค.", "aug", "august"],
    ["กันยายน", "ก.ย.", "sep", "september"],
    ["ตุลาคม", "ต.ค.", "oct", "october"],
    ["พฤศจิกายน", "พ.ย.", "nov", "november"],
    ["ธันวาคม", "ธ.ค.", "dec", "december"],
  ];

  const isoMatch = normalized.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  for (let index = 0; index < months.length; index += 1) {
    const monthName = months[index].find((name) => normalized.toLowerCase().includes(name.toLowerCase()));
    if (!monthName) continue;
    const dayMatch = normalized.match(new RegExp(`(?:วันที่|วัน)?\\s*(\\d{1,2})\\s*(?:${monthName.replace(".", "\\.")})`, "i"));
    if (dayMatch) {
      return `${fallbackYear}-${String(index + 1).padStart(2, "0")}-${dayMatch[1].padStart(2, "0")}`;
    }
  }
  return "";
}

function extractBookingRuleBased(message, currentBooking) {
  const text = normalizeThaiDigits(message.trim());
  const lowerText = text.toLowerCase();
  const booking = { ...currentBooking };

  const matchedHotel = hotels.find((hotel) => lowerText.includes(hotel.toLowerCase()));
  if (matchedHotel) booking.hotelName = matchedHotel;

  if (lowerText.includes("กรุงเทพ") || lowerText.includes("bangkok")) booking.location = "กรุงเทพ";
  if (lowerText.includes("เชียงใหม่") || lowerText.includes("chiang mai")) booking.location = "เชียงใหม่";
  if (lowerText.includes("ภูเก็ต") || lowerText.includes("phuket")) booking.location = "ภูเก็ต";
  if (lowerText.includes("กระบี่") || lowerText.includes("krabi")) booking.location = "กระบี่";
  if (lowerText.includes("สมุย") || lowerText.includes("samui")) booking.location = "สมุย";

  const dateRangeMatch =
    text.match(/(?:วันที่|วัน)?\s*(\d{1,2}\s*[^\d\s]+)\s*(?:ถึง|จนถึง|to|-)\s*(\d{1,2}\s*[^\d\s]+)/i) ??
    text.match(/(?:วันที่|วัน)?\s*(\d{1,2})\s*([^\d\s]+)\s*(?:ถึง|จนถึง|to|-)\s*(\d{1,2})\s*(?:\2)?/i);
  if (dateRangeMatch) {
    if (dateRangeMatch.length >= 4) {
      booking.checkIn = parseDate(`${dateRangeMatch[1]} ${dateRangeMatch[2]}`);
      booking.checkOut = parseDate(`${dateRangeMatch[3]} ${dateRangeMatch[2]}`);
    } else {
      const monthText = dateRangeMatch[1].replace(/\d/g, "").trim() || dateRangeMatch[2].replace(/\d/g, "").trim();
      booking.checkIn = parseDate(`${dateRangeMatch[1]} ${monthText}`);
      booking.checkOut = parseDate(`${dateRangeMatch[2]} ${monthText}`);
    }
  } else {
    const date = parseDate(text);
    if (date && !booking.checkIn) booking.checkIn = date;
    else if (date && !booking.checkOut) booking.checkOut = date;
  }

  const guestsMatch = text.match(/(\d{1,2})\s*(?:คน|ท่าน|guest|guests)/i);
  if (guestsMatch) booking.guests = Number(guestsMatch[1]);

  const phoneMatch = text.match(/0\d[\d\s-]{7,12}\d/);
  if (phoneMatch) booking.phone = phoneMatch[0].replace(/\D/g, "");

  // Name extraction
  if (getMissingField(currentBooking) === "customerName") { //ถ้า missingField = customerName ให้ดึงชื่อลูกค้า
    const nameMatch = text.match(
      /(?:ชื่อ|ผมชื่อ|ฉันชื่อ|ดิฉันชื่อ|หนูชื่อ|เรียกว่า)\s*([ก-๙A-Za-z][ก-๙A-Za-z\s.'-]{1,39})(?:\s+เบอร์|\s+โทร|\s+พัก|\s*$)/
    );
    if (nameMatch) {
      booking.customerName = nameMatch[1].trim();
    } else {
      const cleanedText = text
        .replace(/^(คุณ|ครับ|ค่ะ|ผม|ดิฉัน|ฉัน|หนู)\s+/g, "")
        .replace(/\s*(ครับ|ค่ะ|จ้า|จ้ะ|นะคะ|นะครับ|เอ่อ|อ่า|หืม|ฮืม)$/g, "")
        .trim();
      if (looksLikePlainCustomerName(cleanedText)) {
        booking.customerName = cleanedText;
      }
    }
  }

  return booking;
}

function getMissingField(booking) {
  if (!booking.hotelName && !booking.location) return "destination";
  if (!booking.checkIn) return "checkIn";
  if (!booking.checkOut) return "checkOut";
  if (!booking.guests) return "guests";
  if (!booking.customerName) return "customerName";
  if (!booking.phone) return "phone";
  return "";
}

function buildQuestion(booking) {
  const missingField = getMissingField(booking);
  const questions = {
    destination: "ต้องการจองโรงแรมที่ไหนคะ บอกชื่อโรงแรมหรือจังหวัดที่อยากพักได้เลยค่ะ",
    checkIn: "ต้องการเช็คอินวันไหนคะ",
    checkOut: "แล้วเช็คเอาท์วันไหนคะ",
    guests: "เข้าพักกี่ท่านคะ",
    customerName: "ขอชื่อผู้จองด้วยค่ะ",
    phone: "ขอเบอร์โทรสำหรับยืนยันการจองค่ะ",
  };
  return questions[missingField] ?? "";
}

function buildSummary(booking) {
  const destination = booking.hotelName || `โรงแรมใน${booking.location}`;
  return `สรุปการจอง ${destination} เช็คอิน ${booking.checkIn} เช็คเอาท์ ${booking.checkOut} พัก ${booking.guests} ท่าน ชื่อผู้จอง ${booking.customerName} เบอร์ ${booking.phone} ยืนยันการจองไหมคะ`;
}

function mergeBookingFromAi(aiBooking, fallbackBooking) {
  if (!aiBooking) return { booking: fallbackBooking, source: "rule-based" };

  return {
    booking: {
      hotelName: aiBooking.hotelName || fallbackBooking.hotelName || "",
      location: aiBooking.location || fallbackBooking.location || "",
      checkIn: aiBooking.checkIn || fallbackBooking.checkIn || "",
      checkOut: aiBooking.checkOut || fallbackBooking.checkOut || "",
      guests: aiBooking.guests || fallbackBooking.guests || 0,
      customerName: aiBooking.customerName || fallbackBooking.customerName || "",
      phone: aiBooking.phone || fallbackBooking.phone || "",
      status: aiBooking.status || fallbackBooking.status || "collecting",
    },
    source: "nvidia",
  };
}

// ─── Botnoi TTS ───────────────────────────────────────────────────────────────

function pickBotnoiAudio(payload) {
  if (!payload || typeof payload !== "object") return {};

  const audioUrl =
    payload.audio_url ?? payload.audioUrl ?? payload.url ??
    payload.result?.audio_url ?? payload.result?.audioUrl ??
    payload.data?.audio_url ?? payload.data?.audioUrl ?? "";

  const audioBase64 =
    payload.audio_base64 ?? payload.audioBase64 ?? payload.base64 ?? payload.audio ??
    payload.result?.audio_base64 ?? payload.result?.audioBase64 ?? payload.result?.audio ??
    payload.data?.audio_base64 ?? payload.data?.audioBase64 ?? payload.data?.audio ?? "";

  const mimeType =
    payload.mime_type ?? payload.mimeType ??
    payload.result?.mime_type ?? payload.result?.mimeType ??
    payload.data?.mime_type ?? payload.data?.mimeType ?? "audio/mpeg";

  return { audioUrl, audioBase64, mimeType };
}

async function synthesizeBotnoiSpeech(text) {
  if (!config.botnoi.ttsUrl || !config.botnoi.token) {
    return { skipped: true, reason: "BOTNOI_TTS_URL and BOTNOI_TOKEN are required" };
  }

  const response = await fetch(config.botnoi.ttsUrl, {
    method: "POST",
    headers: { "botnoi-token": config.botnoi.token, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      speaker: config.botnoi.speakerId,
      volume: 1,
      speed: 1,
      type_media: "mp3",
      save_file: "true",
      language: "th",
      page: "user",
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.startsWith("audio/")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return { audioBase64: buffer.toString("base64"), mimeType: contentType };
  }

  const payload = await response.json();
  if (!response.ok) throw new Error(`Botnoi TTS error: ${response.status} ${JSON.stringify(payload)}`);

  const audio = pickBotnoiAudio(payload);
  if (!audio.audioUrl && !audio.audioBase64) throw new Error("Botnoi TTS did not return audio");
  return audio;
}

// ─── Hotel Recommendation ─────────────────────────────────────────────────────

function normalizeSearchText(text) {
  return normalizeThaiDigits(String(text ?? "").trim().toLowerCase());
}

function getRecommendationSignals(text) {
  const normalized = normalizeSearchText(text);
  const signals = new Set();

  const groups = [
    { signal: "phuket", words: ["ภูเก็ต", "phuket"] },
    { signal: "krabi", words: ["กระบี่", "krabi"] },
    { signal: "samui", words: ["สมุย", "samui", "เกาะ"] },
    { signal: "chiang mai", words: ["เชียงใหม่", "chiang mai", "ภูเขา", "ธรรมชาติ", "เงียบ", "พักใจ"] },
    { signal: "bangkok", words: ["กรุงเทพ", "bangkok", "เมือง", "สุขุมวิท", "เจ้าพระยา"] },
    { signal: "beach", words: ["ทะเล", "ชายหาด", "beach", "sea", "หาด", "ติดทะเล", "ใกล้ทะเล"] },
    { signal: "river", words: ["แม่น้ำ", "เจ้าพระยา", "river"] },
    { signal: "luxury", words: ["หรู", "luxury", "พรีเมียม", "ส่วนตัว"] },
    { signal: "quiet", words: ["เงียบ", "สงบ", "พักผ่อน", "ชิล", "relax"] },
    { signal: "wellness", words: ["สปา", "wellness", "สุขภาพ"] },
    { signal: "romantic", words: ["คู่รัก", "โรแมนติก", "แฟน", "honeymoon"] },
  ];

  for (const group of groups) {
    if (group.words.some((word) => normalized.includes(word))) signals.add(group.signal);
  }
  return [...signals];
}

function recommendHotels(message) {
  const signals = getRecommendationSignals(message);
  const normalized = normalizeSearchText(message);
  const budgetMatch = normalized.match(/(?:งบ|budget|ไม่เกิน|ต่ำกว่า)\s*(\d{4,6})/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : 0;

  const scoredHotels = hotelCatalog
    .map((hotel) => {
      let score = 0;
      for (const signal of signals) {
        if (hotel.tags.includes(signal) || hotel.province.toLowerCase().includes(signal)) score += 3;
      }
      if (budget && hotel.price <= budget) score += 2;
      if (signals.includes("beach") && hotel.tags.includes("sea")) score += 2;
      if (normalized.includes(hotel.province.toLowerCase())) score += 3;
      return { hotel, score };
    })
    .sort((a, b) => b.score - a.score || a.hotel.price - b.hotel.price);

  return scoredHotels.filter((item) => item.score > 0).slice(0, 3);
}

// ─── Request Helpers ──────────────────────────────────────────────────────────

function parseBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) { req.destroy(); reject(new Error("Request body is too large")); }
    });
    req.on("end", () => {
      if (!body) { resolve({}); return; }
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

async function handleHotelRecommendation(req, res) {
  const { message = "" } = await parseBody(req);
  const normalizedMessage = String(message).trim();
  if (!normalizedMessage) { sendJson(res, 400, { error: "message is required" }); return; }

  const recommendations = recommendHotels(normalizedMessage);
  if (!recommendations.length) {
    sendJson(res, 200, {
      reply: "อยากพักแนวไหนคะ เช่น ใกล้ทะเล ภูเขา ในเมือง เงียบ ๆ หรู ๆ หรือมีงบประมาณประมาณเท่าไหร่",
      recommendations: [],
      needsMoreInfo: true,
    });
    return;
  }

  const top = recommendations[0].hotel;
  sendJson(res, 200, {
    reply: `จากโจทย์ของคุณ แนะนำ ${top.name} ที่${top.location} เพราะ${top.reasons[0]}ค่ะ`,
    recommendations: recommendations.map(({ hotel, score }) => ({
      name: hotel.name,
      location: hotel.location,
      province: hotel.province,
      price: hotel.price,
      reasons: hotel.reasons,
      score,
    })),
    needsMoreInfo: false,
  });
}

async function handleAiBooking(req, res, options = {}) {
  const { stream = false } = options;
  const { message = "", sessionId = "default", hotelName = "" } = await parseBody(req);
  const currentBooking = { ...(sessions.get(sessionId) ?? emptyBooking()) };

  if (hotelName && !currentBooking.hotelName) currentBooking.hotelName = String(hotelName);

  const normalizedMessage = String(message).trim();
  if (!normalizedMessage) { sendJson(res, 400, { error: "message is required" }); return; }

  // ─── ยืนยันการจอง ───────────────────────────────────────────────────────────
  if (currentBooking.status === "awaiting_confirmation" && /^(ยืนยัน|ตกลง|confirm|ok|โอเค)/i.test(normalizedMessage)) {
    const savedBooking = await saveBooking(currentBooking);
    sessions.set(sessionId, emptyBooking());
    const reply = `จองเรียบร้อยค่ะ หมายเลขการจอง ${savedBooking.id}`;

    if (stream) {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" });
      for (const chunk of reply.split("")) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        await new Promise((r) => setTimeout(r, 30));
      }
      res.write(`data: ${JSON.stringify({ done: true, saved: true, booking: savedBooking })}\n\n`);
      res.end();
      return;
    }

    sendJson(res, 200, { reply, booking: savedBooking, saved: true });
    return;
  }

  // ─── ดึงข้อมูล: NVIDIA AI ก่อน ถ้าไม่ได้ใช้ rule-based ─────────────────────
  const ruleBasedBooking = extractBookingRuleBased(normalizedMessage, currentBooking);
  const aiExtracted = aiMode !== "rule-based"
    ? await extractBookingWithAI(normalizedMessage, currentBooking)
    : null;
  const { booking, source: extractionSource } = mergeBookingFromAi(aiExtracted, ruleBasedBooking);
  const missingField = getMissingField(booking);

  // ─── สร้างคำตอบ ─────────────────────────────────────────────────────────────
 // ─── สร้างคำตอบ ─────────────────────────────────────────────────────────────
if (missingField) {
  sessions.set(sessionId, { ...booking, status: "collecting" });

  // ให้ NVIDIA ตอบแทน buildQuestion
  const aiReply = await generateAiText(`คุณคือพนักงานจองโรงแรม ตอบภาษาไทย สั้นมาก ลงท้าย "ค่ะ"

ข้อมูลที่มีแล้ว: ${JSON.stringify(booking)}
ลูกค้าพูดว่า: "${normalizedMessage}"
ข้อมูลที่ยังขาด: ${missingField}

กฎเข้ม:
- ถามเฉพาะ "${missingField}" เท่านั้น ห้ามถามอื่น
- ถ้าลูกค้าบอกข้อมูลมาแล้ว ให้รับทราบสั้นๆ แล้วถามข้อถัดไป
- ห้ามพูดซ้ำข้อมูลที่ลูกค้าบอกมาแล้ว
- ตอบ 1 ประโยคเท่านั้น`);

  const replyText = aiReply || buildQuestion(booking); // fallback ถ้า AI ไม่ตอบ

    if (stream) {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" });
      for (const chunk of replyText.split("")) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        await new Promise((r) => setTimeout(r, 30));
      }
      res.write(`data: ${JSON.stringify({ done: true, saved: false, booking: { ...booking, status: "collecting" }, extractionSource })}\n\n`);
      res.end();
      return;
    }

    sendJson(res, 200, { reply: replyText, booking: { ...booking, status: "collecting" }, saved: false, extractionSource });
    return;
  }

  // ─── ข้อมูลครบ รอยืนยัน ────────────────────────────────────────────────────
  const awaitingBooking = { ...booking, status: "awaiting_confirmation" };
sessions.set(sessionId, awaitingBooking);

// ให้ NVIDIA สรุปแทน buildSummary
const aiSummary = await generateAiText(`คุณคือพนักงานจองโรงแรม ตอบภาษาไทย ลงท้าย "ค่ะ"

สรุปการจองนี้ให้กระชับ แล้วถามยืนยัน:
- โรงแรม: ${booking.hotelName}
- เช็คอิน: ${booking.checkIn}
- เช็คเอาท์: ${booking.checkOut}
- จำนวน: ${booking.guests} ท่าน
- ชื่อ: ${booking.customerName}
- เบอร์: ${booking.phone}

กฎ: สรุป 1-2 บรรทัด แล้วถามยืนยัน 1 ประโยค รวมไม่เกิน 3 ประโยค`);

const replyText = aiSummary || buildSummary(awaitingBooking); // fallback ถ้า AI ไม่ตอบ

  if (stream) {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" });
    for (const chunk of replyText.split("")) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 30));
    }
    res.write(`data: ${JSON.stringify({ done: true, saved: false, booking: awaitingBooking, extractionSource })}\n\n`);
    res.end();
    return;
  }

  sendJson(res, 200, { reply: replyText, booking: awaitingBooking, saved: false, extractionSource });
}

async function handleAiBookingStream(req, res) {
  await handleAiBooking(req, res, { stream: true });
}

async function handleBotnoiTts(req, res) {
  const { text = "" } = await parseBody(req);
  const normalizedText = String(text).trim();
  if (!normalizedText) { sendJson(res, 400, { error: "text is required" }); return; }
  const result = await synthesizeBotnoiSpeech(normalizedText);
  sendJson(res, 200, { ok: true, result });
}

// ─── Request Router ───────────────────────────────────────────────────────────

async function requestHandler(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, ai: aiMode, model: nvidiaModel });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/ai/booking") {
      await handleAiBooking(req, res); return;
    }
    if (req.method === "POST" && url.pathname === "/api/ai/booking/stream") {
      await handleAiBookingStream(req, res); return;
    }
    if (req.method === "POST" && url.pathname === "/api/ai/hotel-recommendation") {
      await handleHotelRecommendation(req, res); return;
    }
    if (req.method === "POST" && url.pathname === "/api/botnoi/tts") {
      await handleBotnoiTts(req, res); return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

await ensureDatabase();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://botnoi-rent-project-frontend.vercel.app",
    "https://botnoi-rent-project-frontend-ilzc.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.options("*", cors());
app.use(express.json({ limit: "1mb" }));
app.use(requestHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`AI mode: ${aiMode === "nvidia" ? `✅ NVIDIA NIM (${nvidiaModel})` : "⚠️  Rule-based (set NVIDIA_API_KEY to enable AI)"}`);
});