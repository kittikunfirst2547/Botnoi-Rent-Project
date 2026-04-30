import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const dataDir = join(__dirname, "data");
const bookingsFile = join(dataDir, "bookings.json");
const bookingsSqliteFile = join(dataDir, "bookings.sqlite");
let bookingsDb;
const sessions = new Map();

function loadEnvFile() {
  const envFile = join(rootDir, ".env");
  if (!existsSync(envFile)) return;

  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const botnoiConfig = {
  apiBaseUrl: process.env.BOTNOI_API_BASE_URL ?? "https://api-voice.botnoi.ai/api/voicebot",
  apiUrl: process.env.BOTNOI_API_URL ?? "",
  ttsUrl: process.env.BOTNOI_TTS_URL ?? "",
  token: process.env.BOTNOI_TOKEN ?? process.env.BOTNOI_API_KEY ?? "",
  botId: process.env.BOTNOI_BOT_ID ?? "69c39e5ab114409d08f2979a",
  speakerId: process.env.BOTNOI_SPEAKER_ID ?? "523",
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

function looksLikePlainCustomerName(text) {
  const value = text.trim();
  if (value.length < 2 || value.length > 60) return false;
  if (/\d/.test(value)) return false;
  if (/confirm|ok|yes|no/i.test(value)) return false;
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
        id,
        hotel_name,
        location,
        check_in,
        check_out,
        guests,
        customer_name,
        phone,
        status,
        created_at
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

function pickBotnoiReply(payload) {
  if (!payload || typeof payload !== "object") return "";

  const candidates = [
    payload.reply,
    payload.message,
    payload.text,
    payload.answer,
    payload.response,
    payload.result?.reply,
    payload.result?.message,
    payload.data?.reply,
    payload.data?.message,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim()) ?? "";
}

async function askBotnoi({ message, sessionId, booking }) {
  if (!botnoiConfig.apiUrl || !botnoiConfig.token) {
    return "";
  }

  const response = await fetch(botnoiConfig.apiUrl, {
    method: "POST",
    headers: {
      "botnoi-token": botnoiConfig.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bot_id: botnoiConfig.botId,
      session_id: sessionId,
      message,
      context: {
        feature: "hotel_booking",
        booking,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Botnoi API error: ${response.status}`);
  }

  return pickBotnoiReply(await response.json());
}

function getBotnoiConfirmTemplateUrl() {
  if (process.env.BOTNOI_CONFIRM_TEMPLATE_URL) {
    return process.env.BOTNOI_CONFIRM_TEMPLATE_URL;
  }

  if (!botnoiConfig.apiBaseUrl) return "";
  return `${botnoiConfig.apiBaseUrl.replace(/\/$/, "")}/confirm/create_template`;
}

function getBotnoiOutboundCallUrl() {
  if (process.env.BOTNOI_OUTBOUND_CALL_URL) {
    return process.env.BOTNOI_OUTBOUND_CALL_URL;
  }

  if (!botnoiConfig.apiBaseUrl) return "";
  return `${botnoiConfig.apiBaseUrl.replace(/\/$/, "")}/confirm/call`;
}

async function createBotnoiConfirmTemplate(template) {
  const url = getBotnoiConfirmTemplateUrl();
  if (!url || !botnoiConfig.token) {
    return {
      skipped: true,
      reason: "BOTNOI_CONFIRM_TEMPLATE_URL or BOTNOI_API_BASE_URL and BOTNOI_TOKEN are required",
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "botnoi-token": botnoiConfig.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(template),
  });

  const text = await response.text();
  let payload = text;
  try {
    payload = JSON.parse(text);
  } catch {
    // Some APIs return plain text on errors.
  }

  if (!response.ok) {
    throw new Error(`Botnoi template API error: ${response.status} ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }

  return payload;
}

async function sendBotnoiOutboundCall(payload) {
  const url = getBotnoiOutboundCallUrl();
  if (!url || !botnoiConfig.token) {
    return {
      skipped: true,
      reason: "BOTNOI_OUTBOUND_CALL_URL or BOTNOI_API_BASE_URL and BOTNOI_TOKEN are required",
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "botnoi-token": botnoiConfig.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let result = text;
  try {
    result = JSON.parse(text);
  } catch {
    // Some APIs return plain text on errors.
  }

  if (!response.ok) {
    throw new Error(`Botnoi outbound call API error: ${response.status} ${typeof result === "string" ? result : JSON.stringify(result)}`);
  }

  return result;
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
  if (!botnoiConfig.ttsUrl || !botnoiConfig.token) {
    return {
      skipped: true,
      reason: "BOTNOI_TTS_URL and BOTNOI_TOKEN are required",
    };
  }

  const response = await fetch(botnoiConfig.ttsUrl, {
    method: "POST",
    headers: {
      "botnoi-token": botnoiConfig.token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      message: text,
      speaker_id: botnoiConfig.speakerId,
    }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.startsWith("audio/")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
      throw new Error(`Botnoi TTS API error: ${response.status}`);
    }
    return {
      audioBase64: buffer.toString("base64"),
      mimeType: contentType,
    };
  }

  const textResponse = await response.text();
  let payload = textResponse;
  try {
    payload = JSON.parse(textResponse);
  } catch {
    // Some APIs return plain text on errors.
  }

  if (!response.ok) {
    throw new Error(`Botnoi TTS API error: ${response.status} ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }

  const audio = pickBotnoiAudio(payload);
  if (!audio.audioUrl && !audio.audioBase64) {
    throw new Error("Botnoi TTS API did not return audio_url or audio_base64");
  }

  return audio;
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

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
    if (group.words.some((word) => normalized.includes(word))) {
      signals.add(group.signal);
    }
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

async function handleHotelRecommendation(req, res) {
  const { message = "" } = await parseBody(req);
  const normalizedMessage = String(message).trim();

  if (!normalizedMessage) {
    sendJson(res, 400, { error: "message is required" });
    return;
  }

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
  const reply = `จากโจทย์ของคุณ แนะนำ ${top.name} ที่${top.location} เพราะ${top.reasons[0]}ค่ะ`;

  sendJson(res, 200, {
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

  const nameMatch = text.match(/(?:ชื่อ|ผมชื่อ|ฉันชื่อ|ดิฉันชื่อ)\s*([ก-๙A-Za-z ]{2,40})(?:\s+เบอร์|\s+โทร|\s+พัก|\s*$)/);
  if (nameMatch) booking.customerName = nameMatch[1].trim();

  if (!booking.customerName && getMissingField(currentBooking) === "customerName" && looksLikePlainCustomerName(text)) {
    booking.customerName = text.trim();
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

async function handleAiBooking(req, res, options = {}) {
  const { requireBotnoi = false } = options;
  const { message = "", sessionId = "default", hotelName = "" } = await parseBody(req);
  const currentBooking = {
    ...(sessions.get(sessionId) ?? emptyBooking()),
  };
  if (hotelName && !currentBooking.hotelName) {
    currentBooking.hotelName = String(hotelName);
  }
  const normalizedMessage = String(message).trim();

  if (!normalizedMessage) {
    sendJson(res, 400, { error: "message is required" });
    return;
  }

  if (currentBooking.status === "awaiting_confirmation" && /^(ยืนยัน|ตกลง|confirm|ok|โอเค)/i.test(normalizedMessage)) {
    const savedBooking = await saveBooking(currentBooking);
    sessions.set(sessionId, emptyBooking());
    sendJson(res, 200, {
      reply: `จองเรียบร้อยค่ะ หมายเลขการจอง ${savedBooking.id}`,
      booking: savedBooking,
      saved: true,
    });
    return;
  }

  const booking = extractBooking(normalizedMessage, currentBooking);
  const missingField = getMissingField(booking);
  let botnoiReply = "";

  try {
    botnoiReply = await askBotnoi({
      message: normalizedMessage,
      sessionId,
      booking,
    });
  } catch (error) {
    if (requireBotnoi) {
      throw error;
    }
    console.warn(error instanceof Error ? error.message : error);
  }

  if (requireBotnoi && !botnoiReply) {
    sendJson(res, 502, {
      error: "Botnoi conversation API is not configured or did not return a reply",
      setup: {
        requiredEnv: ["BOTNOI_TOKEN", "BOTNOI_API_URL"],
        note: "BOTNOI_API_URL must be the Botnoi endpoint for sending a user message to the bot, not the create_template endpoint.",
      },
    });
    return;
  }

  if (missingField) {
    sessions.set(sessionId, { ...booking, status: "collecting" });
    sendJson(res, 200, {
      reply: botnoiReply || buildQuestion(booking),
      booking: { ...booking, status: "collecting" },
      saved: false,
    });
    return;
  }

  const awaitingBooking = { ...booking, status: "awaiting_confirmation" };
  sessions.set(sessionId, awaitingBooking);
  sendJson(res, 200, {
    reply: botnoiReply || buildSummary(awaitingBooking),
    booking: awaitingBooking,
    saved: false,
  });
}

async function handleBotnoiBooking(req, res) {
  await handleAiBooking(req, res, { requireBotnoi: true });
}

async function handleCreateBotnoiTemplate(req, res) {
  const body = await parseBody(req);
  const template = {
    message:
      body.message ??
      "สวัสดีค่ะ จาก {Org_name} คุณมีนัดในวันที่ {Appointment Date} เวลา {Appointment Time} ต้องการยืนยันนัดหมายมั้ยคะ",
    confirm_message:
      body.confirm_message ??
      "ขอบคุณค่ะ คุณได้ยืนยันนัดหมายเรียบร้อยแล้ว เราจะรอคุณในวันที่ {Appointment Date} เวลา {Appointment Time} ค่ะ",
    decline_message:
      body.decline_message ??
      "ขอบคุณค่ะ ยกเลิกนัดหมายเรียบร้อยแล้วนะคะ หากคุณต้องการเปลี่ยนแปลงนัดหมาย สามารถติดต่อกลับหาเราได้เลยนะคะ ขอบคุณค่ะ",
    fallback_message:
      body.fallback_message ??
      "ขอบคุณค่ะ หากคุณต้องการเปลี่ยนแปลงนัดหมาย สามารถแจ้งเราได้เลยนะคะ",
    org_name: body.org_name ?? "Javis AI Hotel Booking",
    speaker_id: body.speaker_id ?? "523",
  };

  const result = await createBotnoiConfirmTemplate(template);
  sendJson(res, 200, { ok: true, result });
}

async function handleBotnoiOutboundCall(req, res) {
  const body = await parseBody(req);
  const phone = body["Tel. Number"] ?? body.phone ?? body.tel ?? body.telNumber;
  const appointmentDate = body["Appointment Date"] ?? body.appointmentDate;
  const appointmentTime = body["Appointment Time"] ?? body.appointmentTime;
  const templateId = body.template_id ?? body.templateId ?? process.env.BOTNOI_TEMPLATE_ID;

  if (!phone || !appointmentDate || !appointmentTime || !templateId) {
    sendJson(res, 400, {
      error: "phone, appointmentDate, appointmentTime, and templateId are required",
      example: {
        phone: "0999999999",
        appointmentDate: "31/07/2025",
        appointmentTime: "00:00",
        templateId: "7735331941",
      },
    });
    return;
  }

  const result = await sendBotnoiOutboundCall({
    "Tel. Number": String(phone),
    "Appointment Date": String(appointmentDate),
    "Appointment Time": String(appointmentTime),
    template_id: String(templateId),
  });
  sendJson(res, 200, { ok: true, result });
}

async function handleBotnoiTts(req, res) {
  const { text = "" } = await parseBody(req);
  const normalizedText = String(text).trim();

  if (!normalizedText) {
    sendJson(res, 400, { error: "text is required" });
    return;
  }

  const result = await synthesizeBotnoiSpeech(normalizedText);
  sendJson(res, 200, { ok: true, result });
}

async function requestHandler(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/ai/booking") {
      await handleAiBooking(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/ai/hotel-recommendation") {
      await handleHotelRecommendation(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/botnoi/booking-conversation") {
      await handleBotnoiBooking(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/botnoi/create-template") {
      await handleCreateBotnoiTemplate(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/botnoi/outbound-call") {
      await handleBotnoiOutboundCall(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/botnoi/tts") {
      await handleBotnoiTts(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

await ensureDatabase();

const port = Number(process.env.PORT ?? 3001);
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(requestHandler);

app.listen(port, () => {
  console.log(`AI booking backend is running on http://localhost:${port}`);
});
