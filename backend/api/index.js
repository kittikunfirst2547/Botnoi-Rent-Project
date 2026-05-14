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

const openRouterApiKey = process.env.OPENROUTER_API_KEY ?? "";
const openRouterModel = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.2-3b-instruct:free";
const openRouterModels = openRouterModel
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const openRouterApiUrl = process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const openRouterTimeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 10000);
const openRouterRateLimitCooldownMs = Number(process.env.OPENROUTER_RATE_LIMIT_COOLDOWN_MS ?? 600000);
const aiMode = openRouterApiKey ? "openrouter" : "rule-based";
let openRouterUnavailableUntil = 0;
let lastOpenRouterError = "";
const groqApiKey = process.env.GROQ_API_KEY ?? "";
const groqModel = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
const groqApiUrl = process.env.GROQ_API_URL ?? "https://api.groq.com/openai/v1/chat/completions";
const groqTimeoutMs = Number(process.env.GROQ_TIMEOUT_MS ?? 10000);
let lastGroqError = "";
const aiExtractionMode = process.env.AI_EXTRACTION_MODE ?? "always";
const activeAiMode = groqApiKey ? "groq" : aiMode;

async function chatWithGroq(prompt) {
  if (!groqApiKey) return "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), groqTimeoutMs);

  try {
    const response = await fetch(groqApiUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel,
        temperature: 0,
        max_tokens: 180,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      let errorMessage = `Groq HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.error?.message || errorMessage;
      } catch {
        // Keep the HTTP status when Groq returns a non-JSON error page.
      }

      lastGroqError = errorMessage;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    lastGroqError = "";
    return data?.choices?.[0]?.message?.content?.trim?.() ?? "";
  } catch (err) {
    console.warn("Groq chat failed:", err.message);
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAiText(prompt) {
  const groqReply = await chatWithGroq(prompt);
  if (groqReply) return groqReply;

  return await chatWithOpenRouter(prompt);
}

function parseJsonObjectFromAiText(text) {
  const cleaned = String(text ?? "").replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Some providers append notes after the JSON. Extract the first balanced object.
  }

  const start = cleaned.indexOf("{");
  if (start === -1) {
    throw new Error("AI response did not contain a JSON object");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, index + 1));
      }
    }
  }

  throw new Error("AI response contained incomplete JSON");
}

async function chatWithOpenRouter(prompt) {
  if (!openRouterApiKey) return "";
  if (Date.now() < openRouterUnavailableUntil) return "";

  for (const model of openRouterModels) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), openRouterTimeoutMs);

    try {
      const response = await fetch(openRouterApiUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 180,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        let errorMessage = `OpenRouter HTTP ${response.status}`;
        try {
          const errorBody = await response.json();
          const errorCode = errorBody?.error?.code;
          const providerMessage = errorBody?.error?.metadata?.raw;
          errorMessage = [errorCode, errorBody?.error?.message, providerMessage]
            .filter(Boolean)
            .join(": ") || errorMessage;
        } catch {
          // Keep the HTTP status when OpenRouter returns a non-JSON error page.
        }

        if (response.status === 429) {
          const retryAfterSeconds = Number(response.headers.get("retry-after"));
          const cooldownMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds * 1000
            : openRouterRateLimitCooldownMs;
          openRouterUnavailableUntil = Date.now() + cooldownMs;
        }

        lastOpenRouterError = `${model}: ${errorMessage}`;
        throw new Error(lastOpenRouterError);
      }

      const data = await response.json();
      lastOpenRouterError = "";
      return data?.choices?.[0]?.message?.content?.trim?.() ?? "";
    } catch (err) {
      console.warn("OpenRouter chat failed:", err.message);
      if (Date.now() < openRouterUnavailableUntil) return "";
    } finally {
      clearTimeout(timeout);
    }
  }

  return "";
}

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

async function extractBookingWithAI(message, currentBooking) {
  if (activeAiMode === "rule-based") return null;

  const prompt = `วิเคราะห์ข้อความของลูกค้าและดึงข้อมูลการจองโรงแรมออกมา

ข้อมูลการจองปัจจุบัน:
${JSON.stringify(currentBooking, null, 2)}

โรงแรมที่รับจอง:
${hotels.join(", ")}

ข้อความลูกค้า: "${message}"

ตอบเป็น JSON เท่านั้น:
{
  "hotelName": "ชื่อโรงแรมเต็ม หรือ '' ถ้าไม่พบ",
  "location": "จังหวัด หรือ '' ถ้าไม่พบ",
  "checkIn": "YYYY-MM-DD หรือ '' ถ้าไม่พบ",
  "checkOut": "YYYY-MM-DD หรือ '' ถ้าไม่พบ",
  "guests": 0,
  "customerName": "ชื่อลูกค้า หรือ '' ถ้าไม่พบ",
  "phone": "เบอร์โทร หรือ '' ถ้าไม่พบ"
}

กฎ:
- ถ้ามีค่าเดิมอยู่แล้ว ห้ามลบด้วยค่าว่าง
- hotelName ต้องตรงกับรายการโรงแรมที่มีให้เท่านั้น
- checkIn และ checkOut ให้เป็น YYYY-MM-DD เสมอ
- phone ให้เหลือเฉพาะตัวเลข`;

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

async function askAiAssistant(message, currentBooking) {
  if (activeAiMode === "rule-based") return "";

  const missing = getMissingField(currentBooking);
  const missingLabel = {
    destination: "โรงแรมหรือจังหวัดที่ต้องการพัก",
    checkIn: "วันเช็กอิน",
    checkOut: "วันเช็กเอาต์",
    guests: "จำนวนผู้เข้าพัก",
    customerName: "ชื่อผู้จอง",
    phone: "เบอร์โทรศัพท์",
  };

  const prompt = `คุณคือพนักงานรับจองโรงแรมชื่อ "จ้าว" พูดภาษาไทยสุภาพ ลงท้ายด้วย "ค่ะ"

โรงแรมที่รับจอง: ${hotels.join(", ")}

ข้อมูลการจองที่มี:
${JSON.stringify(currentBooking, null, 2)}

ข้อมูลที่ยังขาด: ${missing ? missingLabel[missing] : "ครบแล้ว"}

ข้อความลูกค้า: "${message}"

คำสั่ง:
- ถ้าข้อมูลยังไม่ครบ ให้ถามเฉพาะ "${missing ? missingLabel[missing] : ""}" ทีละอย่าง
- ถ้าข้อมูลครบแล้ว ให้สรุปและขอยืนยัน
- ตอบสั้น ไม่เกิน 2 ประโยค
- ห้ามแต่งข้อมูลเพิ่ม`;

  try {
    return await generateAiText(prompt);
  } catch (err) {
    console.warn("AI askAssistant failed:", err.message);
    return "";
  }
}

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

function mergeBookingFromAi(aiBooking, fallbackBooking) {
  if (!aiBooking) {
    return { booking: fallbackBooking, source: "rule-based" };
  }

  const booking = {
    hotelName: aiBooking.hotelName || fallbackBooking.hotelName || "",
    location: aiBooking.location || fallbackBooking.location || "",
    checkIn: aiBooking.checkIn || fallbackBooking.checkIn || "",
    checkOut: aiBooking.checkOut || fallbackBooking.checkOut || "",
    guests: aiBooking.guests || fallbackBooking.guests || 0,
    customerName: aiBooking.customerName || fallbackBooking.customerName || "",
    phone: aiBooking.phone || fallbackBooking.phone || "",
    status: aiBooking.status || fallbackBooking.status || "collecting",
  };

  const usedFallback = ["hotelName", "location", "checkIn", "checkOut", "guests", "customerName", "phone"]
    .some((key) => !aiBooking[key] && Boolean(fallbackBooking[key]));

  return { booking, source: usedFallback ? "ai+rule-based" : "ai" };
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

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*path", cors()); // handle preflight
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", async (req, res) => {
  res.json({
    ok: true,
    ai: activeAiMode,
    aiExtractionMode,
    groqModel: groqApiKey ? groqModel : null,
    model: openRouterModel,
    timeoutMs: openRouterTimeoutMs,
    rateLimitedUntil: openRouterUnavailableUntil ? new Date(openRouterUnavailableUntil).toISOString() : null,
    lastAiError: lastGroqError || lastOpenRouterError || null,
  });
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

  const ruleBasedBooking = extractBooking(normalizedMessage, currentBooking);
  const shouldTryAiExtraction =
    activeAiMode !== "rule-based" &&
    (aiExtractionMode === "always" || getMissingField(ruleBasedBooking) === getMissingField(currentBooking));
  const aiExtracted = shouldTryAiExtraction
    ? await extractBookingWithAI(normalizedMessage, currentBooking)
    : null;
  const { booking, source: extractionSource } = mergeBookingFromAi(aiExtracted, ruleBasedBooking);
  const missingField = getMissingField(booking);

  if (missingField) {
    sessions.set(sessionId, { ...booking, status: "collecting" });
    return res.json({
      reply: buildQuestion(booking),
      booking: { ...booking, status: "collecting" },
      saved: false,
      extractionSource,
      aiTried: shouldTryAiExtraction,
    });
  }

  const awaitingBooking = { ...booking, status: "awaiting_confirmation" };
  sessions.set(sessionId, awaitingBooking);
  res.json({
    reply: buildSummary(awaitingBooking),
    booking: awaitingBooking,
    saved: false,
    extractionSource,
    aiTried: shouldTryAiExtraction,
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

  const ruleBasedBooking = extractBooking(normalizedMessage, currentBooking);
  const shouldTryAiExtraction =
    activeAiMode !== "rule-based" &&
    (aiExtractionMode === "always" || getMissingField(ruleBasedBooking) === getMissingField(currentBooking));
  const aiExtracted = shouldTryAiExtraction
    ? await extractBookingWithAI(normalizedMessage, currentBooking)
    : null;
  const { booking, source: extractionSource } = mergeBookingFromAi(aiExtracted, ruleBasedBooking);
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
  
  res.write(`data: ${JSON.stringify({ done: true, saved: false, booking: missingField ? { ...booking, status: "collecting" } : sessions.get(sessionId), extractionSource, aiTried: shouldTryAiExtraction })}\n\n`);
  res.end();
});

// Export for Vercel
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`AI mode: ${activeAiMode === "groq" ? `✅ Groq (${groqModel})` : activeAiMode === "openrouter" ? `✅ OpenRouter (${openRouterModel})` : "⚠️  Rule-based (set GROQ_API_KEY or OPENROUTER_API_KEY to enable AI)"}`);
});

export default app;
