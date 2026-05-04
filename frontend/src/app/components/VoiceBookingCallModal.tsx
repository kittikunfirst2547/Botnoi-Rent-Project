import { useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Minus, PhoneOff, Send, X } from "lucide-react";
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
  booking?: {
    hotelName: string;
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    customerName: string;
    phone: string;
    status: string;
  } | null;
}

interface BotnoiTtsResponse {
  ok: boolean;
  result?: {
    skipped?: boolean;
    reason?: string;
    audioUrl?: string;
    audio_url?: string;
    audioBase64?: string;
    audio_base64?: string;
    mimeType?: string;
    mime_type?: string;
  };
  error?: string;
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
  const [isMinimized, setIsMinimized] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const keepListeningRef = useRef(false);
  const handledSpeechErrorRef = useRef(false);
  const sessionId = useMemo(() => createId(), []);

  const addMessage = (sender: ConversationMessage["sender"], text: string) => {
    setMessages((current) => [...current, { id: createId(), sender, text }]);
  };

  const speak = (text: string) => {
    void playBotnoiVoice(text);
  };

  const playBrowserVoice = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  };

  const playBotnoiVoice = async (text: string) => {
    try {
      const response = await fetch("/api/botnoi/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = (await response.json()) as BotnoiTtsResponse;
      if (!response.ok) throw new Error(data.error || "Botnoi voice failed");
      if (data.result?.skipped) {
        playBrowserVoice(text);
        return;
      }

      const audioUrl = data.result?.audioUrl ?? data.result?.audio_url;
      const audioBase64 = data.result?.audioBase64 ?? data.result?.audio_base64;
      const mimeType = data.result?.mimeType ?? data.result?.mime_type ?? "audio/mpeg";
      const source = audioUrl || (audioBase64 ? `data:${mimeType};base64,${audioBase64}` : "");

      if (!source) throw new Error("Botnoi voice did not return audio");

      setCallStatus("กำลังเล่นเสียง...");
      const audio = new Audio(source);
      audio.onended = () => setCallStatus("กำลังคุยอยู่");
      await audio.play();
    } catch {
      playBrowserVoice(text);
    }
  };

 const sendToBotnoi = async (text: string, useStreaming = true) => {
  const message = text.trim();
  if (!message) return;

  addMessage("user", message);
  setManualText("");
  setIsSending(true);
  setCallStatus("AI กำลังคิด...");

  // ✅ สร้าง id ก่อน แล้วเพิ่ม message พร้อม id นั้นเลย
  const aiMessageId = createId();
  setMessages((current) => [
    ...current,
    { id: aiMessageId, sender: "ai", text: "" },
  ]);

  try {
    if (useStreaming) {
      const response = await fetch("/api/ai/booking/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId, hotelName, price }),
      });

      if (!response.ok) throw new Error("เชื่อมต่อ AI ไม่สำเร็จ");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let isDone = false;
      let savedStatus = false;

      while (reader && !isDone) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as {
                text?: string;
                done?: boolean;
                saved?: boolean;
              };

              if (data.text) {
                fullText += data.text;
                // ✅ update ถูก message เพราะ id ตรงกัน
                setMessages((current) =>
                  current.map((msg) =>
                    msg.id === aiMessageId ? { ...msg, text: fullText } : msg
                  )
                );
              }

              if (data.done) {
                isDone = true;
                savedStatus = data.saved ?? false;
              }
            } catch {
              // ignore
            }
          }
        }
      }

      if (fullText) speak(fullText);
      setCallStatus(savedStatus ? "จองสำเร็จ ✓" : "กำลังคุยอยู่");

    } else {
      // non-streaming fallback
      const response = await fetch("/api/ai/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId, hotelName, price }),
      });

      const data = (await response.json()) as VoiceBookingResponse;
      if (!response.ok) throw new Error(data.reply || "เชื่อมต่อ AI ไม่สำเร็จ");

      setMessages((current) =>
        current.map((msg) =>
          msg.id === aiMessageId ? { ...msg, text: data.reply } : msg
        )
      );

      speak(data.reply);
      setCallStatus(data.saved ? "จองสำเร็จ ✓" : "กำลังคุยอยู่");
    }

  } catch (error) {
    const reply = error instanceof Error ? error.message : "เชื่อมต่อ AI ไม่สำเร็จ";
    setMessages((current) =>
      current.map((msg) =>
        msg.id === aiMessageId ? { ...msg, text: reply } : msg
      )
    );
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
    keepListeningRef.current = true;
    const recognition = new SpeechRecognitionApi();
    recognition.lang = "th-TH";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      handledSpeechErrorRef.current = true;
      const transcript = event.results[0][0].transcript;
      setCallStatus(`ได้ยินว่า: ${transcript}`);
      void sendToBotnoi(transcript);
    };
    recognition.onend = () => {
      if (!keepListeningRef.current) {
        setIsListening(false);
        return;
      }

      try {
        recognition.start();
      } catch {
        setIsListening(false);
        keepListeningRef.current = false;
      }
    };
    recognition.onerror = (event) => {
      if (handledSpeechErrorRef.current) return;
      handledSpeechErrorRef.current = true;
      setIsListening(false);
      keepListeningRef.current = false;

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
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setCallStatus("พักสาย");
  };

  const closeCall = () => {
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - only show when not minimized */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMinimized(true)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
          )}

          {/* Full Modal */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="fixed left-1/2 top-1/2 z-[70] flex h-[680px] max-h-[92vh] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[var(--border)] p-5">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Voice Booking</p>
                  <h2 className="mt-0.5 text-base font-semibold text-[var(--foreground)]">{hotelName}</h2>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">เริ่มต้น ฿{price.toLocaleString()} / คืน</p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Minimize Button */}
                  <button 
                    onClick={() => setIsMinimized(true)} 
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]" 
                    aria-label="พับจอ"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  {/* Close Button */}
                  <button 
                    onClick={closeCall} 
                    className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]" 
                    aria-label="ปิด"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Mic indicator + status */}
              <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-4">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                    isListening
                      ? "bg-[var(--accent-brand)] text-white shadow-lg shadow-[var(--accent-brand)]/30"
                      : "bg-[var(--muted)] text-[var(--foreground)]"
                  }`}
                >
                  {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--foreground)]">{callStatus}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">ตอบว่า "ยืนยัน" เมื่อข้อมูลถูกต้อง</p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[84%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
                        message.sender === "user"
                          ? "bg-[var(--accent-brand)] text-white"
                          : "bg-[var(--muted)] text-[var(--foreground)]"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="space-y-3 border-t border-[var(--border)] p-4">
                <div className="flex gap-2">
                  <input
                    value={manualText}
                    onChange={(event) => setManualText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void sendToBotnoi(manualText);
                    }}
                    placeholder="พิมพ์แทนการพูดได้..."
                    className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)]"
                  />
                  <button
                    onClick={() => void sendToBotnoi(manualText)}
                    disabled={isSending}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-brand)] text-white transition-colors hover:bg-[var(--accent-brand-hover)] disabled:opacity-50"
                    aria-label="ส่งข้อความ"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isSending || isSpeechUnavailable}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40 ${
                      isListening
                        ? "bg-[var(--accent-brand)] text-white hover:bg-[var(--accent-brand-hover)]"
                        : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isSpeechUnavailable ? "พิมพ์แทน" : isListening ? "หยุดฟัง" : "เปิดไมค์"}
                  </button>
                  <button
                    onClick={closeCall}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
                  >
                    <PhoneOff className="h-4 w-4" />
                    วางสาย
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Minimized Floating Card */}
          {isMinimized && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              onClick={() => setIsMinimized(false)}
              className="fixed bottom-6 right-6 z-[70] flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-xl transition-all hover:shadow-2xl hover:scale-105"
            >
              {/* Mic indicator */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  isListening
                    ? "bg-[var(--accent-brand)] text-white shadow-lg shadow-[var(--accent-brand)]/30"
                    : "bg-[var(--muted)] text-[var(--foreground)]"
                }`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </div>
              {/* Info */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--foreground)]">Voice Booking</span>
                <span className="text-xs text-[var(--muted-foreground)]">{callStatus}</span>
              </div>
              {/* Expand hint */}
              <div className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--muted)]">
                <span className="text-xs text-[var(--muted-foreground)]">↗</span>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
