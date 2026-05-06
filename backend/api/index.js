import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const dataDir = join(rootDir, "src", "data");
const bookingsFile = join(dataDir, "bookings.json");
const bookingsSqliteFile = join(dataDir, "bookings.sqlite");
let bookingsDb;
const sessions = new Map();

// Load env
const envFile = join(rootDir, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const val = trimmed.slice(sep + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

const config = {
  port: Number(process.env.PORT ?? 3001),
  botnoi: {
    apiBaseUrl: process.env.BOTNOI_API_BASE_URL ?? "https://api-voice.botnoi.ai/api/voicebot",
    apiUrl: process.env.BOTNOI_API_URL ?? "",
    ttsUrl: process.env.BOTNOI_TTS_URL ?? "",
    token: process.env.BOTNOI_TOKEN ?? process.env.BOTNOI_API_KEY ?? "",
    botId: process.env.BOTNOI_BOT_ID ?? "69c39e5ab114409d08f2979a",
    speakerId: process.env.BOTNOI_SPEAKER_ID ?? "523",
  },
};

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
        id, hotel_name, location, check_in, check_out, guests, customer_name, phone, status, created_at
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

function extractBooking(message, currentBooking) {
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
    if (date && !booking.checkIn) {
      booking.checkIn = date;
    } else if (date && !booking.checkOut) {
      booking.checkOut = date;
    }
  }

  const guestsMatch = text.match(/(\d{1,2})\s*(?:คน|ท่าน|guest|guests)/i);
  if (guestsMatch) booking.guests = Number(guestsMatch[1]);

  const phoneMatch = text.match(/0\d[\d\s-]{7,12}\d/);
  if (phoneMatch) booking.phone = phoneMatch[0].replace(/\D/g, "");

  // ✅ ใหม่
if (getMissingField(currentBooking) === "customerName" || !booking.customerName) {
  // รูปแบบที่ 1: มีคำนำหน้าชื่อ
  const nameMatch = text.match(
    /(?:ชื่อ|ผมชื่อ|ฉันชื่อ|ดิฉันชื่อ|หนูชื่อ|เรียกว่า)\s*([ก-๙A-Za-z][ก-๙A-Za-z\s.'-]{1,39})(?:\s+เบอร์|\s+โทร|\s+พัก|\s*$)/
  );
  if (nameMatch) {
    booking.customerName = nameMatch[1].trim();
  } else {
    // รูปแบบที่ 2: พูด/พิมพ์ชื่อล้วนๆ
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

function getRecommendationSignals(text) {
  const normalized = normalizeThaiDigits(String(text ?? "").trim().toLowerCase());
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
    if (group.words.some((word) => normalized.includes(word))) {
      signals.add(group.signal);
    }
  }

  return [...signals];
}

function recommendHotels(message) {
  const signals = getRecommendationSignals(message);
  const normalized = normalizeThaiDigits(String(message ?? "").trim().toLowerCase());
  const budgetMatch = normalized.match(/(?:งบ|budget|ไม่เกิน|ต่ำกว่า)\s*(\d{4,6})/);
  const budget = budgetMatch ? Number(budgetMatch[1]) : 0;

  const scoredHotels = hotelCatalog
    .map((hotel) => {
      let score = 0;
      const matchedSignals = [];

      for (const signal of signals) {
        if (hotel.tags.includes(signal) || hotel.province.toLowerCase().includes(signal)) {
          score += 3;
          matchedSignals.push(signal);
        }
      }

      if (budget && hotel.price <= budget) score += 2;
      if (signals.includes("beach") && hotel.tags.includes("sea")) score += 2;
      if (normalized.includes(hotel.province.toLowerCase())) score += 3;

      return { hotel, score, matchedSignals };
    })
    .sort((a, b) => b.score - a.score || a.hotel.price - b.hotel.price);

  return scoredHotels.filter((item) => item.score > 0).slice(0, 3);
}

function pickBotnoiAudio(payload) {
  if (!payload || typeof payload !== "object") return {};

  const audioUrl =
    payload.audio_url ??
    payload.audioUrl ??
    payload.url ??
    payload.file_url ??
    payload.fileUrl ??
    payload.result?.audio_url ??
    payload.result?.audioUrl ??
    payload.result?.url ??
    payload.data?.audio_url ??
    payload.data?.audioUrl ??
    payload.data?.url ??
    "";

  const audioBase64 =
    payload.audio_base64 ??
    payload.audioBase64 ??
    payload.base64 ??
    payload.audio ??
    payload.result?.audio_base64 ??
    payload.result?.audioBase64 ??
    payload.result?.base64 ??
    payload.result?.audio ??
    payload.data?.audio_base64 ??
    payload.data?.audioBase64 ??
    payload.data?.base64 ??
    payload.data?.audio ??
    "";

  const mimeType =
    payload.mime_type ??
    payload.mimeType ??
    payload.result?.mime_type ??
    payload.result?.mimeType ??
    payload.data?.mime_type ??
    payload.data?.mimeType ??
    "audio/mpeg";

  return { audioUrl, audioBase64, mimeType };
}

async function synthesizeBotnoiSpeech(text) {
  if (!config.botnoi.ttsUrl || !config.botnoi.token) {
    return { skipped: true, reason: "BOTNOI_TTS_URL and BOTNOI_TOKEN are required" };
  }

  const response = await fetch(config.botnoi.ttsUrl, {
    method: "POST",
    headers: {
      "botnoi-token": config.botnoi.token,
      "Content-Type": "application/json",
    },
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
  if (!response.ok) {
    throw new Error(`Botnoi TTS error: ${response.status} ${JSON.stringify(payload)}`);
  }

  const audio = pickBotnoiAudio(payload);
  if (!audio.audioUrl && !audio.audioBase64) {
    throw new Error("Botnoi TTS did not return audio");
  }

  return audio;
}

// Create Express app
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", async (req, res) => {
  res.json({ ok: true });
});

// Hotel recommendation
app.post("/api/ai/hotel-recommendation", async (req, res) => {
  const { message = "" } = req.body;
  const normalizedMessage = String(message).trim();

  if (!normalizedMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  const recommendations = recommendHotels(normalizedMessage);

  if (!recommendations.length) {
    return res.json({
      reply: "อยากพักแนวไหนคะ เช่น ใกล้ทะเล ภูเขา ในเมือง เงียบ ๆ หรู ๆ หรือมีงบประมาณประมาณเท่าไหร่",
      recommendations: [],
      needsMoreInfo: true,
    });
  }

  const top = recommendations[0].hotel;
  const reply = `จากโจทย์ของคุณ แนะนำ ${top.name} ที่${top.location} เพราะ${top.reasons[0]}ค่ะ`;

  res.json({
    reply,
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
});

// Botnoi TTS
app.post("/api/botnoi/tts", async (req, res) => {
  const { text = "" } = req.body;
  const normalizedText = String(text).trim();

  if (!normalizedText) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    const result = await synthesizeBotnoiSpeech(normalizedText);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "TTS failed" });
  }
});

// AI Booking (non-streaming)
app.post("/api/ai/booking", async (req, res) => {
  const { message = "", sessionId = "default", hotelName = "" } = req.body;
  const currentBooking = { ...(sessions.get(sessionId) ?? emptyBooking()) };
  
  if (hotelName && !currentBooking.hotelName) {
    currentBooking.hotelName = String(hotelName);
  }
  
  const normalizedMessage = String(message).trim();

  if (!normalizedMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  if (currentBooking.status === "awaiting_confirmation" && /^(ยืนยัน|ตกลง|confirm|ok|โอเค)/i.test(normalizedMessage)) {
    const savedBooking = await saveBooking(currentBooking);
    sessions.set(sessionId, emptyBooking());
    return res.json({
      reply: `จองเรียบร้อยค่ะ หมายเลขการจอง ${savedBooking.id}`,
      booking: savedBooking,
      saved: true,
    });
  }

  const booking = extractBooking(normalizedMessage, currentBooking);
  const missingField = getMissingField(booking);

  if (missingField) {
    sessions.set(sessionId, { ...booking, status: "collecting" });
    return res.json({
      reply: buildQuestion(booking),
      booking: { ...booking, status: "collecting" },
      saved: false,
    });
  }

  const awaitingBooking = { ...booking, status: "awaiting_confirmation" };
  sessions.set(sessionId, awaitingBooking);
  res.json({
    reply: buildSummary(awaitingBooking),
    booking: awaitingBooking,
    saved: false,
  });
});

// AI Booking (streaming)
app.post("/api/ai/booking/stream", async (req, res) => {
  const { message = "", sessionId = "default", hotelName = "" } = req.body;
  const currentBooking = { ...(sessions.get(sessionId) ?? emptyBooking()) };
  
  if (hotelName && !currentBooking.hotelName) {
    currentBooking.hotelName = String(hotelName);
  }
  
  const normalizedMessage = String(message).trim();

  if (!normalizedMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  if (currentBooking.status === "awaiting_confirmation" && /^(ยืนยัน|ตกลง|confirm|ok|โอเค)/i.test(normalizedMessage)) {
    const savedBooking = await saveBooking(currentBooking);
    sessions.set(sessionId, emptyBooking());
    const reply = `จองเรียบร้อยค่ะ หมายเลขการจอง ${savedBooking.id}`;
    
    // Stream the confirmation
    for (const char of reply) {
      res.write(`data: ${JSON.stringify({ text: char })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    res.write(`data: ${JSON.stringify({ done: true, saved: true, booking: savedBooking })}\n\n`);
    res.end();
    return;
  }

  const booking = extractBooking(normalizedMessage, currentBooking);
  const missingField = getMissingField(booking);

  let replyText;
  if (missingField) {
    sessions.set(sessionId, { ...booking, status: "collecting" });
    replyText = buildQuestion(booking);
  } else {
    const awaitingBooking = { ...booking, status: "awaiting_confirmation" };
    sessions.set(sessionId, awaitingBooking);
    replyText = buildSummary(awaitingBooking);
  }

  // Stream the response
  for (const char of replyText) {
    res.write(`data: ${JSON.stringify({ text: char })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  
  res.write(`data: ${JSON.stringify({ done: true, saved: false, booking: missingField ? { ...booking, status: "collecting" } : sessions.get(sessionId) })}\n\n`);
  res.end();
});

// Export for Vercel
export default app;
