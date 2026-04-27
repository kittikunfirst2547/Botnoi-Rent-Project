import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, Mic, MicOff, Send, Volume2 } from "lucide-react";
import { motion } from "motion/react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: "aborted" | "audio-capture" | "bad-grammar" | "language-not-supported" | "network" | "no-speech" | "not-allowed" | "service-not-allowed";
}

interface VoiceBookingResponse {
  reply: string;
  saved: boolean;
  booking?: {
    hotelName?: string;
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    customerName?: string;
    phone?: string;
    status?: string;
  };
}

interface ConversationMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const fallbackSessionId = crypto.randomUUID();

export function VoiceBookingAssistant() {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "สวัสดีค่ะ กดปุ่มไมค์แล้วบอกข้อมูลการจองได้เลย เช่น อยากจอง The Peninsula Bangkok วันที่ 10 พฤษภาคม ถึง 12 พฤษภาคม พัก 2 คน ชื่อกิตติคุณ เบอร์ 0812345678",
    },
  ]);
  const [manualText, setManualText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("พร้อมรับเสียงภาษาไทย");
  const [isSpeechUnavailable, setIsSpeechUnavailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const handledSpeechErrorRef = useRef(false);
  const sessionId = useMemo(() => fallbackSessionId, []);

  const addMessage = (sender: ConversationMessage["sender"], text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        sender,
        text,
      },
    ]);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const sendToAssistant = async (text: string) => {
    const message = text.trim();
    if (!message) return;

    addMessage("user", message);
    setManualText("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, sessionId }),
      });

      const data = (await response.json()) as VoiceBookingResponse;
      if (!response.ok) throw new Error(data.reply || "ส่งข้อความไม่สำเร็จ");

      addMessage("ai", data.reply);
      speak(data.reply);
    } catch (error) {
      const reply = error instanceof Error ? error.message : "เชื่อมต่อ AI ไม่สำเร็จ";
      addMessage("ai", reply);
      speak(reply);
    } finally {
      setIsSending(false);
    }
  };

  const startListening = () => {
    const SpeechRecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      const reply = "เบราว์เซอร์นี้ยังไม่รองรับการพูด ลองใช้ Chrome หรือพิมพ์ข้อความแทนได้ค่ะ";
      setVoiceStatus("ไม่รองรับการพูดใน browser นี้");
      addMessage("ai", reply);
      speak(reply);
      return;
    }

    handledSpeechErrorRef.current = false;
    const recognition = new SpeechRecognitionApi();
    recognition.lang = "th-TH";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      handledSpeechErrorRef.current = true;
      const transcript = event.results[0][0].transcript;
      setVoiceStatus(`ได้ยินว่า: ${transcript}`);
      void sendToAssistant(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      if (handledSpeechErrorRef.current) return;
      handledSpeechErrorRef.current = true;
      setIsListening(false);

      const replies: Record<SpeechRecognitionErrorEvent["error"], string> = {
        aborted: "การรับเสียงถูกยกเลิกค่ะ ลองกดไมค์อีกครั้งได้เลย",
        "audio-capture": "ยังเข้าถึงไมค์ไม่ได้ค่ะ ตรวจสอบว่าเครื่องมีไมค์ และ browser ได้รับสิทธิ์ใช้ไมค์แล้ว",
        "bad-grammar": "รับเสียงไม่สำเร็จค่ะ ลองพูดอีกครั้ง หรือพิมพ์ข้อความแทนได้",
        "language-not-supported": "browser นี้ยังไม่รองรับการรับเสียงภาษาไทยค่ะ ลองใช้ Chrome หรือพิมพ์ข้อความแทนได้",
        network: "บริการถอดเสียงของ browser เชื่อมต่อไม่ได้ค่ะ ลองใหม่อีกครั้ง หรือพิมพ์ข้อความแทนได้",
        "no-speech": "ยังไม่ได้ยินเสียงค่ะ ลองกดไมค์แล้วพูดใกล้ไมค์อีกครั้ง",
        "not-allowed": "ไมค์ยังไม่ได้รับอนุญาตค่ะ กรุณาอนุญาต Microphone ใน browser แล้วลองใหม่",
        "service-not-allowed": "browser ไม่อนุญาตให้ใช้บริการถอดเสียงค่ะ ลองเปิดด้วย Chrome ปกติ หรือพิมพ์ข้อความแทนได้",
      };

      const reply = replies[event.error] ?? "รับเสียงไม่สำเร็จ ลองกดไมค์แล้วพูดอีกครั้งนะคะ";
      if (event.error === "network" || event.error === "service-not-allowed" || event.error === "language-not-supported") {
        setIsSpeechUnavailable(true);
      }
      setVoiceStatus(`สถานะไมค์: ${event.error}`);
      addMessage("ai", reply);
      speak(reply);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    setVoiceStatus("กำลังฟังอยู่...");
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus("หยุดรับเสียงแล้ว");
  };

  return (
    <section className="fixed bottom-8 left-8 z-50 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#111]">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">Voice Booking AI</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{voiceStatus}</p>
          </div>
          <Volume2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto bg-gray-50 p-4 dark:bg-[#0b0b0b]">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                message.sender === "user"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-gray-200 bg-white text-black dark:border-gray-800 dark:bg-[#171717] dark:text-white"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void sendToAssistant(manualText);
            }}
            placeholder="พิมพ์แทนการพูดได้..."
            className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-gray-800 dark:bg-[#0b0b0b] dark:text-white dark:focus:border-white"
          />
          <button
            onClick={() => void sendToAssistant(manualText)}
            disabled={isSending}
            className="grid h-10 w-10 place-items-center rounded-xl bg-black text-white transition hover:bg-gray-900 disabled:opacity-50 dark:bg-white dark:text-black"
            aria-label="ส่งข้อความ"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <motion.button
          onClick={isListening ? stopListening : startListening}
          disabled={isSending || isSpeechUnavailable}
          whileTap={{ scale: 0.98 }}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
            isListening
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black"
          } disabled:opacity-50`}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {isSpeechUnavailable ? "ใช้การพิมพ์แทนใน browser นี้" : isListening ? "กำลังฟัง..." : "กดเพื่อพูดกับ AI"}
        </motion.button>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            {isSpeechUnavailable
              ? "In-app browser อาจไม่รองรับถอดเสียง ลองเปิดด้วย Chrome ปกติ หรือพิมพ์ข้อความแทน"
              : "พูดว่า “ยืนยัน” หลัง AI สรุป เพื่อบันทึกลงฐานข้อมูล"}
          </span>
        </div>
      </div>
    </section>
  );
}
