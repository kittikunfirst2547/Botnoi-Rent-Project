import { useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff, PhoneOff, Send, Volume2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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

interface VoiceBookingCallModalProps {
  isOpen: boolean;
  hotelName: string;
  price: number;
  onClose: () => void;
}

interface ConversationMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
}

interface VoiceBookingResponse {
  reply: string;
  saved: boolean;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function VoiceBookingCallModal({ isOpen, hotelName, price, onClose }: VoiceBookingCallModalProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `สวัสดีค่ะ กำลังจอง ${hotelName} ให้คุณอยู่ บอกวันเช็คอิน เช็คเอาท์ จำนวนผู้เข้าพัก ชื่อ และเบอร์โทรได้เลยค่ะ`,
    },
  ]);
  const [manualText, setManualText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [callStatus, setCallStatus] = useState("พร้อมคุยกับ AI");
  const [isSpeechUnavailable, setIsSpeechUnavailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const handledSpeechErrorRef = useRef(false);
  const sessionId = useMemo(() => createId(), []);

  const addMessage = (sender: ConversationMessage["sender"], text: string) => {
    setMessages((current) => [...current, { id: createId(), sender, text }]);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };

  const sendToBotnoi = async (text: string) => {
    const message = text.trim();
    if (!message) return;

    addMessage("user", message);
    setManualText("");
    setIsSending(true);
    setCallStatus("AI กำลังตอบ...");

    try {
      const response = await fetch("/api/botnoi/booking-conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          sessionId,
          hotelName,
          price,
        }),
      });

      const data = (await response.json()) as VoiceBookingResponse;
      if (!response.ok) throw new Error(data.reply || "เชื่อมต่อ Botnoi ไม่สำเร็จ");

      addMessage("ai", data.reply);
      speak(data.reply);
      setCallStatus(data.saved ? "จองสำเร็จ" : "กำลังคุยอยู่");
    } catch (error) {
      const reply = error instanceof Error ? error.message : "เชื่อมต่อ AI ไม่สำเร็จ";
      addMessage("ai", reply);
      speak(reply);
      setCallStatus("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setIsSending(false);
    }
  };

  const startListening = () => {
    const SpeechRecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      const reply = "เบราว์เซอร์นี้ยังไม่รองรับการพูด ลองเปิดด้วย Chrome หรือพิมพ์ข้อความแทนได้ค่ะ";
      setIsSpeechUnavailable(true);
      setCallStatus("ไม่รองรับไมค์");
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
      setCallStatus(`ได้ยินว่า: ${transcript}`);
      void sendToBotnoi(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      if (handledSpeechErrorRef.current) return;
      handledSpeechErrorRef.current = true;
      setIsListening(false);

      const replies: Record<SpeechRecognitionErrorEvent["error"], string> = {
        aborted: "การรับเสียงถูกยกเลิกค่ะ ลองกดไมค์อีกครั้งได้เลย",
        "audio-capture": "ยังเข้าถึงไมค์ไม่ได้ค่ะ ตรวจสอบสิทธิ์ Microphone แล้วลองใหม่",
        "bad-grammar": "รับเสียงไม่สำเร็จค่ะ ลองพูดอีกครั้ง หรือพิมพ์ข้อความแทนได้",
        "language-not-supported": "browser นี้ยังไม่รองรับการรับเสียงภาษาไทยค่ะ ลองใช้ Chrome หรือพิมพ์ข้อความแทนได้",
        network: "บริการถอดเสียงของ browser เชื่อมต่อไม่ได้ค่ะ ถ้าต้องการเสียงจริงทุก browser ให้ต่อ Botnoi STT ฝั่ง backend",
        "no-speech": "ยังไม่ได้ยินเสียงค่ะ ลองกดไมค์แล้วพูดใกล้ไมค์อีกครั้ง",
        "not-allowed": "ไมค์ยังไม่ได้รับอนุญาตค่ะ กรุณาอนุญาต Microphone ใน browser แล้วลองใหม่",
        "service-not-allowed": "browser ไม่อนุญาตให้ใช้บริการถอดเสียงค่ะ ลองเปิดด้วย Chrome ปกติ หรือพิมพ์ข้อความแทนได้",
      };

      if (event.error === "network" || event.error === "service-not-allowed" || event.error === "language-not-supported") {
        setIsSpeechUnavailable(true);
      }

      const reply = replies[event.error] ?? "รับเสียงไม่สำเร็จ ลองกดไมค์แล้วพูดอีกครั้งนะคะ";
      setCallStatus(`สถานะไมค์: ${event.error}`);
      addMessage("ai", reply);
      speak(reply);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    setCallStatus("กำลังฟัง...");
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setCallStatus("พักสาย");
  };

  const closeCall = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCall}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            className="fixed left-1/2 top-1/2 z-[70] flex h-[720px] max-h-[92vh] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#101010] text-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-sm text-white/50">Botnoi Voice Booking</p>
                <h2 className="mt-1 text-xl font-semibold">{hotelName}</h2>
                <p className="mt-1 text-sm text-white/60">เริ่มต้น ฿{price.toLocaleString()} / คืน</p>
              </div>
              <button onClick={closeCall} className="rounded-full p-2 text-white/80 transition hover:bg-white/10" aria-label="ปิด">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center gap-5 overflow-hidden px-5 py-6">
              <motion.div
                animate={isListening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: isListening ? Infinity : 0, duration: 1.3 }}
                className="grid h-28 w-28 place-items-center rounded-full bg-white text-black shadow-[0_0_60px_rgba(255,255,255,0.25)]"
              >
                {isListening ? <MicOff className="h-11 w-11" /> : <Mic className="h-11 w-11" />}
              </motion.div>

              <div className="text-center">
                <p className="text-lg font-semibold">{callStatus}</p>
                <p className="mt-1 text-sm text-white/50">ตอบว่า “ยืนยัน” เมื่อข้อมูลถูกต้อง</p>
              </div>

              <div className="min-h-0 w-full flex-1 space-y-3 overflow-y-auto rounded-xl bg-white/[0.04] p-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[84%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        message.sender === "user" ? "bg-white text-black" : "bg-white/10 text-white"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  value={manualText}
                  onChange={(event) => setManualText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void sendToBotnoi(manualText);
                  }}
                  placeholder="พิมพ์แทนการพูดได้..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                />
                <button
                  onClick={() => void sendToBotnoi(manualText)}
                  disabled={isSending}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black transition hover:bg-white/90 disabled:opacity-50"
                  aria-label="ส่งข้อความ"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isSending || isSpeechUnavailable}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-45"
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isSpeechUnavailable ? "พิมพ์แทน" : isListening ? "หยุดฟัง" : "เปิดไมค์"}
                </button>
                <Volume2 className="h-5 w-5 text-white/50" />
                <button
                  onClick={closeCall}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <PhoneOff className="h-5 w-5" />
                  วางสาย
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
