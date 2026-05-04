import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// โหลด .env ก่อนอ่านค่า
const envFile = join(__dirname, "../.env");
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

export const config = {
  port: Number(process.env.PORT ?? 3001),
  botnoi: {
    apiBaseUrl:         process.env.BOTNOI_API_BASE_URL ?? "https://api-voice.botnoi.ai/api/voicebot",
    apiUrl:             process.env.BOTNOI_API_URL ?? "",
    ttsUrl:             process.env.BOTNOI_TTS_URL ?? "",
    token:              process.env.BOTNOI_TOKEN ?? process.env.BOTNOI_API_KEY ?? "",
    botId:              process.env.BOTNOI_BOT_ID ?? "69c39e5ab114409d08f2979a",
    speakerId:          process.env.BOTNOI_SPEAKER_ID ?? "523",
    templateId:         process.env.BOTNOI_TEMPLATE_ID ?? "",
    confirmTemplateUrl: process.env.BOTNOI_CONFIRM_TEMPLATE_URL ?? "",
    outboundCallUrl:    process.env.BOTNOI_OUTBOUND_CALL_URL ?? "",
  },
};