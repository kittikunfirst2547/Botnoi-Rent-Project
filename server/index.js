import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const dataDir = join(__dirname, "data");
const bookingsFile = join(dataDir, "bookings.json");
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
  apiBaseUrl: process.env.BOTNOI_API_BASE_URL ?? "",
  apiUrl: process.env.BOTNOI_API_URL ?? "",
  token: process.env.BOTNOI_TOKEN ?? process.env.BOTNOI_API_KEY ?? "",
  botId: process.env.BOTNOI_BOT_ID ?? "69c39e5ab114409d08f2979a",
};

const hotels = [
  "Anantara Siam Resort & Spa",
  "The Peninsula Bangkok",
  "Four Seasons Chiang Mai",
  "Amanpuri Phuket",
  "Rayavadee Krabi",
  "Six Senses Samui",
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
  if (!botnoiConfig.apiUrl || !botnoiConfig.token) return "";

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

function parseBody(req) {
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

  const dateRangeMatch = text.match(/(?:วันที่|วัน)?\s*(\d{1,2}\s*[^\d\s]+)\s*(?:ถึง|จนถึง|-)\s*(\d{1,2}\s*[^\d\s]+)/);
  if (dateRangeMatch) {
    const monthText = dateRangeMatch[1].replace(/\d/g, "").trim() || dateRangeMatch[2].replace(/\d/g, "").trim();
    booking.checkIn = parseDate(`${dateRangeMatch[1]} ${monthText}`);
    booking.checkOut = parseDate(`${dateRangeMatch[2]} ${monthText}`);
  } else {
    const date = parseDate(text);
    if (date && !booking.checkIn) booking.checkIn = date;
  }

  const guestsMatch = text.match(/(\d{1,2})\s*(?:คน|ท่าน|guest|guests)/i);
  if (guestsMatch) booking.guests = Number(guestsMatch[1]);

  const phoneMatch = text.match(/0\d[\d\s-]{7,12}\d/);
  if (phoneMatch) booking.phone = phoneMatch[0].replace(/\D/g, "");

  const nameMatch = text.match(/(?:ชื่อ|ผมชื่อ|ฉันชื่อ|ดิฉันชื่อ)\s*([ก-๙A-Za-z ]{2,40})(?:\s+เบอร์|\s+โทร|\s+พัก|\s*$)/);
  if (nameMatch) booking.customerName = nameMatch[1].trim();

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

async function handleAiBooking(req, res) {
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
    console.warn(error instanceof Error ? error.message : error);
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
  await handleAiBooking(req, res);
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

    if (req.method === "POST" && url.pathname === "/api/botnoi/booking-conversation") {
      await handleBotnoiBooking(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/botnoi/create-template") {
      await handleCreateBotnoiTemplate(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
}

await ensureDatabase();

const port = Number(process.env.PORT ?? 3001);
createServer(requestHandler).listen(port, () => {
  console.log(`AI booking backend is running on http://localhost:${port}`);
});
