import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import cors from "cors";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const dataDir = join(rootDir, "src", "data");
const bookingsFile = join(dataDir, "bookings.json");
const bookingsSqliteFile = join(dataDir, "bookings.sqlite");
const usersFile = join(dataDir, "users.json");
const paymentsFile = join(dataDir, "payments.json");
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
  try {
    await readFile(usersFile, "utf8");
  } catch {
    await writeFile(usersFile, "[]\n", "utf8");
  }
  try {
    await readFile(paymentsFile, "utf8");
  } catch {
    await writeFile(paymentsFile, "[]\n", "utf8");
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

function generateBookingId(bookings) {
  const existingIds = new Set(bookings.map((booking) => String(booking.id)));

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = String(randomInt(10000, 100000));
    if (!existingIds.has(id)) return id;
  }

  throw new Error("Unable to generate a unique booking id");
}

function generateReceiptId() {
  return `RCPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomInt(10000, 100000)}`;
}

async function readJsonArray(file) {
  await ensureDatabase();
  const parsed = JSON.parse(await readFile(file, "utf8"));
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
}

async function writeJsonArray(file, rows) {
  await writeFile(file, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    createdAt: user.createdAt,
  };
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash ?? "").split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

function createAuthToken(user) {
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    nonce: randomBytes(8).toString("hex"),
  })).toString("base64url");
  const secret = process.env.AUTH_SECRET || process.env.BOTNOI_TOKEN || "javis-dev-secret";
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function getBearerToken(req) {
  const auth = req.headers.authorization ?? "";
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

async function getAuthUser(req) {
  const token = getBearerToken(req);
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const secret = process.env.AUTH_SECRET || process.env.BOTNOI_TOKEN || "javis-dev-secret";
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) return null;
  const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!session.userId || Date.now() > Number(session.exp)) return null;
  const users = await readJsonArray(usersFile);
  return users.find((user) => user.id === session.userId) ?? null;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "").trim());
}

function isValidIsoDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ""))) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function isCheckOutAfterCheckIn(checkIn, checkOut) {
  if (!checkIn || !checkOut || !isValidIsoDate(checkIn) || !isValidIsoDate(checkOut)) return true;
  return new Date(checkOut) > new Date(checkIn);
}

function getHotelMeta(name) {
  return hotelCatalog.find((hotel) => hotel.name.toLowerCase() === String(name ?? "").toLowerCase()) ?? null;
}

function parseStableDate(text, fallbackYear = new Date().getFullYear()) {
  const normalized = normalizeThaiDigits(String(text ?? ""));
  const isoMatch = normalized.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;

  const months = [
    ["\u0e21\u0e01\u0e23\u0e32\u0e04\u0e21", "\u0e21.\u0e04.", "jan", "january"],
    ["\u0e01\u0e38\u0e21\u0e20\u0e32\u0e1e\u0e31\u0e19\u0e18\u0e4c", "\u0e01.\u0e1e.", "feb", "february"],
    ["\u0e21\u0e35\u0e19\u0e32\u0e04\u0e21", "\u0e21\u0e35.\u0e04.", "mar", "march"],
    ["\u0e40\u0e21\u0e29\u0e32\u0e22\u0e19", "\u0e40\u0e21.\u0e22.", "apr", "april"],
    ["\u0e1e\u0e24\u0e29\u0e20\u0e32\u0e04\u0e21", "\u0e1e.\u0e04.", "may"],
    ["\u0e21\u0e34\u0e16\u0e38\u0e19\u0e32\u0e22\u0e19", "\u0e21\u0e34.\u0e22.", "jun", "june"],
    ["\u0e01\u0e23\u0e01\u0e0e\u0e32\u0e04\u0e21", "\u0e01.\u0e04.", "jul", "july"],
    ["\u0e2a\u0e34\u0e07\u0e2b\u0e32\u0e04\u0e21", "\u0e2a.\u0e04.", "aug", "august"],
    ["\u0e01\u0e31\u0e19\u0e22\u0e32\u0e22\u0e19", "\u0e01.\u0e22.", "sep", "september"],
    ["\u0e15\u0e38\u0e25\u0e32\u0e04\u0e21", "\u0e15.\u0e04.", "oct", "october"],
    ["\u0e1e\u0e24\u0e28\u0e08\u0e34\u0e01\u0e32\u0e22\u0e19", "\u0e1e.\u0e22.", "nov", "november"],
    ["\u0e18\u0e31\u0e19\u0e27\u0e32\u0e04\u0e21", "\u0e18.\u0e04.", "dec", "december"],
  ];

  for (let index = 0; index < months.length; index += 1) {
    for (const monthName of months[index]) {
      const escapedMonth = monthName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const dayMatch = normalized.match(new RegExp(`(\\d{1,2})\\s*(?:${escapedMonth})`, "i"));
      if (dayMatch) return `${fallbackYear}-${String(index + 1).padStart(2, "0")}-${dayMatch[1].padStart(2, "0")}`;
    }
  }

  return "";
}

function enhanceBookingFromMessage(message, booking) {
  const text = normalizeThaiDigits(String(message ?? "").trim());
  const enhanced = { ...booking };
  const lowerText = text.toLowerCase();

  const matchedHotel = hotels.find((hotel) => lowerText.includes(hotel.toLowerCase()));
  if (matchedHotel) enhanced.hotelName = matchedHotel;

  const isoDates = [...text.matchAll(/20\d{2}[-/]\d{1,2}[-/]\d{1,2}/g)].map((match) => parseStableDate(match[0])).filter(Boolean);
  if (isoDates.length >= 2) {
    enhanced.checkIn = isoDates[0];
    enhanced.checkOut = isoDates[1];
  } else if (isoDates.length === 1) {
    if (!enhanced.checkIn) enhanced.checkIn = isoDates[0];
    else if (!enhanced.checkOut) enhanced.checkOut = isoDates[0];
  }

  const thaiRange = text.match(/(\d{1,2})\s*([ก-๙A-Za-z.]+)\s*(?:ถึง|จนถึง|to|-)\s*(\d{1,2})\s*([ก-๙A-Za-z.]*)/i);
  if (isoDates.length < 2 && thaiRange) {
    const firstMonth = thaiRange[2];
    const secondMonth = thaiRange[4] || firstMonth;
    const checkIn = parseStableDate(`${thaiRange[1]} ${firstMonth}`);
    const checkOut = parseStableDate(`${thaiRange[3]} ${secondMonth}`);
    if (checkIn) enhanced.checkIn = checkIn;
    if (checkOut) enhanced.checkOut = checkOut;
  }

  const guestsMatch = text.match(/(\d{1,2})\s*(?:คน|ท่าน|guest|guests)/i);
  if (guestsMatch) enhanced.guests = Number(guestsMatch[1]);

  const phoneMatch = text.match(/0\d[\d\s-]{7,12}\d/);
  if (phoneMatch) enhanced.phone = phoneMatch[0].replace(/\D/g, "");

  const nameMatch = text.match(/(?:ชื่อ|ผมชื่อ|ฉันชื่อ|ดิฉันชื่อ|หนูชื่อ|ผู้จองชื่อ|จองในชื่อ|เรียกว่า)\s*([ก-๙A-Za-z][ก-๙A-Za-z\s.'-]{1,39})(?:\s+เบอร์|\s+โทร|\s+พัก|\s+เช็ค|\s+วันที่|\s*$)/);
  if (nameMatch) enhanced.customerName = nameMatch[1].trim();
  else if (!enhanced.customerName && getMissingField(booking) === "customerName" && looksLikePlainCustomerName(text)) {
    enhanced.customerName = text;
  }

  return enhanced;
}

function calculateNights(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  const nights = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Number.isFinite(nights) && nights > 0 ? nights : 1;
}

function buildReceipt({ receiptId, booking, payment }) {
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  return {
    id: receiptId,
    bookingId: booking.id,
    paymentId: payment.id,
    hotelName: booking.hotelName,
    customerName: booking.customerName,
    email: booking.email,
    phone: booking.phone,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    nights,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    issuedAt: payment.createdAt,
  };
}

function receiptText(receipt) {
  return [
    "Javis booking receipt",
    `Receipt: ${receipt.id}`,
    `Booking: ${receipt.bookingId}`,
    `Hotel: ${receipt.hotelName}`,
    `Guest: ${receipt.customerName}`,
    `Stay: ${receipt.checkIn} to ${receipt.checkOut} (${receipt.nights} night${receipt.nights > 1 ? "s" : ""})`,
    `Guests: ${receipt.guests}`,
    `Paid: ${receipt.currency} ${Number(receipt.amount).toLocaleString()}`,
    `Status: ${receipt.status}`,
  ].join("\n");
}

function getEmailAddress(value) {
  const text = String(value ?? "").trim();
  const bracketMatch = text.match(/<([^>]+)>/);
  return (bracketMatch?.[1] ?? text).trim().toLowerCase();
}

function isPublicEmailDomain(domain) {
  return new Set([
    "gmail.com",
    "googlemail.com",
    "hotmail.com",
    "live.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "me.com",
    "msn.com",
  ]).has(String(domain ?? "").toLowerCase());
}

function resolveReceiptSender() {
  const fallback = "Javis <onboarding@resend.dev>";
  const configured = process.env.RECEIPT_FROM_EMAIL?.trim() || fallback;
  const email = getEmailAddress(configured);
  const domain = email.split("@").pop() ?? "";

  if (isPublicEmailDomain(domain)) {
    return {
      from: fallback,
      warning: `RECEIPT_FROM_EMAIL uses ${domain}, which Resend cannot send from unless that domain is verified. Falling back to onboarding@resend.dev.`,
    };
  }

  return { from: configured, warning: "" };
}

function getResendErrorMessage(data) {
  return data?.message || data?.error?.message || data?.name || "email request failed";
}

async function sendReceiptEmail(receipt) {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const { from, warning } = resolveReceiptSender();
  if (!apiKey || !receipt.email) {
    return {
      sent: false,
      provider: "resend",
      reason: !apiKey ? "RESEND_API_KEY is missing" : "receipt email is missing",
      ...(warning ? { warning } : {}),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.EMAIL_TIMEOUT_MS ?? 10000));

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [receipt.email],
        subject: `Javis booking receipt ${receipt.bookingId}`,
        text: receiptText(receipt),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        sent: false,
        provider: "resend",
        reason: getResendErrorMessage(data),
        status: response.status,
        ...(warning ? { warning } : {}),
      };
    }
    return { sent: true, provider: "resend", id: data?.id ?? "", ...(warning ? { warning } : {}) };
  } catch (err) {
    return {
      sent: false,
      provider: "resend",
      reason: err?.name === "AbortError" ? "email request timed out" : `email request failed: ${err.message}`,
      ...(warning ? { warning } : {}),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function saveBooking(booking) {
  await ensureDatabase();
  const bookings = JSON.parse(await readFile(bookingsFile, "utf8"));
  const savedBooking = {
    id: generateBookingId(bookings),
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
  };
  return questions[missingField] ?? "";
}

function buildSummary(booking) {
  const destination = booking.hotelName || `โรงแรมใน${booking.location}`;
  return `สรุปการจอง ${destination} เช็คอิน ${booking.checkIn} เช็คเอาท์ ${booking.checkOut} พัก ${booking.guests} ท่าน ชื่อผู้จอง ${booking.customerName} ยืนยันการจองไหมคะ`;
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

app.post("/api/auth/register", async (req, res) => {
  const { name = "", email = "", password = "", phone = "" } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedName = String(name).trim();

  if (!normalizedName || !validateEmail(normalizedEmail) || String(password).length < 6) {
    return res.status(400).json({ error: "name, valid email, and password with at least 6 characters are required" });
  }

  const users = await readJsonArray(usersFile);
  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ error: "email already registered" });
  }

  const user = {
    id: `usr_${randomBytes(12).toString("hex")}`,
    name: normalizedName,
    email: normalizedEmail,
    phone: String(phone).trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeJsonArray(usersFile, users);

  const token = createAuthToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email = "", password = "" } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const users = await readJsonArray(usersFile);
  const user = users.find((row) => row.email === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const token = createAuthToken(user);
  res.json({ token, user: publicUser(user) });
});

app.get("/api/auth/me", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: publicUser(user) });
});

app.post("/api/payments/checkout", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "login required before payment" });

  const { booking = {}, payment = {} } = req.body;
  const hotel = getHotelMeta(booking.hotelName);
  const checkIn = String(booking.checkIn ?? "");
  const checkOut = String(booking.checkOut ?? "");
  const guests = Number(booking.guests ?? 0);
  const email = String(booking.email || user.email).trim().toLowerCase();
  const phone = String(booking.phone || user.phone || "").replace(/\D/g, "");
  const customerName = String(booking.customerName || booking.name || user.name).trim();

  if (!hotel || !isValidIsoDate(checkIn) || !isValidIsoDate(checkOut) || !isCheckOutAfterCheckIn(checkIn, checkOut) || !guests || !customerName || !validateEmail(email)) {
    return res.status(400).json({ error: "complete booking details are required before payment" });
  }

  const nights = calculateNights(checkIn, checkOut);
  const amount = hotel.price * nights;
  const cardLast4 = String(payment.cardNumber ?? "").replace(/\D/g, "").slice(-4);
  const paidAt = new Date().toISOString();
  const savedBooking = await saveBooking({
    userId: user.id,
    hotelName: hotel.name,
    location: hotel.province,
    checkIn,
    checkOut,
    guests,
    customerName,
    email,
    phone,
  });

  const paymentRecord = {
    id: `pay_${randomBytes(10).toString("hex")}`,
    bookingId: savedBooking.id,
    userId: user.id,
    amount,
    currency: "THB",
    method: payment.method ?? "card",
    reference: payment.reference ?? "",
    cardLast4,
    status: "paid",
    createdAt: paidAt,
  };
  const payments = await readJsonArray(paymentsFile);
  payments.push(paymentRecord);
  await writeJsonArray(paymentsFile, payments);

  const receipt = buildReceipt({ receiptId: generateReceiptId(), booking: savedBooking, payment: paymentRecord });
  const emailResult = await sendReceiptEmail(receipt);

  res.json({
    saved: true,
    booking: savedBooking,
    payment: paymentRecord,
    receipt,
    email: emailResult,
    reply: `Booking confirmed. Booking number ${savedBooking.id}. Receipt ${receipt.id}${emailResult.sent ? " was emailed." : " is ready."}`,
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
    const paymentBooking = { ...currentBooking, status: "payment_required" };
    sessions.set(sessionId, emptyBooking());
    return res.json({
      reply: "ขอบคุณค่ะ ปิดไมค์แล้วนะคะ ขั้นตอนถัดไปคือสแกน QR เพื่อชำระเงินแบบ demo ค่ะ",
      booking: paymentBooking,
      saved: false,
      needsPayment: true,
    });
  }

  const ruleBasedBooking = enhanceBookingFromMessage(normalizedMessage, extractBooking(normalizedMessage, currentBooking));
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
    const paymentBooking = { ...currentBooking, status: "payment_required" };
    sessions.set(sessionId, emptyBooking());
    const reply = "ขอบคุณค่ะ ปิดไมค์แล้วนะคะ ขั้นตอนถัดไปคือสแกน QR เพื่อชำระเงินแบบ demo ค่ะ";
    
    // Stream the confirmation
    for (const char of reply) {
      res.write(`data: ${JSON.stringify({ text: char })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    res.write(`data: ${JSON.stringify({ done: true, saved: false, needsPayment: true, booking: paymentBooking })}\n\n`);
    res.end();
    return;
  }

  const ruleBasedBooking = enhanceBookingFromMessage(normalizedMessage, extractBooking(normalizedMessage, currentBooking));
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
