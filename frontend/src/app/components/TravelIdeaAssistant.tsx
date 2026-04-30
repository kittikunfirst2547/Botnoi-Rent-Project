"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type TravelSpeechRecognitionConstructor = new () => TravelSpeechRecognition;

interface TravelSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: TravelSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface TravelSpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface Recommendation {
  name: string;
  location: string;
  province: string;
  price: number;
  reasons: string[];
}

interface RecommendationResponse {
  reply: string;
  recommendations: Recommendation[];
  needsMoreInfo: boolean;
  error?: string;
}

interface TravelIdeaAssistantProps {
  onBook?: (hotelName: string) => void;
}

const introMessage = "ยังไม่รู้จะไปไหนดีใช่ไหมคะ กดไมค์แล้วบอกโจทย์มาได้เลย เช่น อยากไปภูเก็ต ใกล้ทะเล เงียบ ๆ";

export function TravelIdeaAssistant({ onBook }: TravelIdeaAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState(introMessage);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const recognitionRef = useRef<TravelSpeechRecognition | null>(null);

  const askRecommendation = async (message: string) => {
    const text = message.trim();
    if (!text) return;

    setInput("");
    setIsSending(true);
    setReply("กำลังหาโรงแรมที่เหมาะกับคุณ...");

    try {
      const response = await fetch("/api/ai/hotel-recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });
      const data = (await response.json()) as RecommendationResponse;
      if (!response.ok) throw new Error(data.error || "แนะนำโรงแรมไม่สำเร็จ");

      setReply(data.reply);
      setRecommendations(data.recommendations);
    } catch (error) {
      setReply(error instanceof Error ? error.message : "ขออภัยค่ะ ตอนนี้ยังแนะนำไม่ได้");
      setRecommendations([]);
    } finally {
      setIsSending(false);
    }
  };

  const startListening = () => {
    setIsOpen(true);
    const speechWindow = window as typeof window & {
      SpeechRecognition?: TravelSpeechRecognitionConstructor;
      webkitSpeechRecognition?: TravelSpeechRecognitionConstructor;
    };
    const SpeechRecognitionApi = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setReply("เบราว์เซอร์นี้ยังไม่รองรับไมค์ ลองพิมพ์โจทย์แทนได้ค่ะ");
      return;
    }

    const recognition = new SpeechRecognitionApi() as TravelSpeechRecognition;
    recognition.lang = "th-TH";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      void askRecommendation(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setReply("รับเสียงไม่สำเร็จค่ะ ลองกดไมค์อีกครั้ง หรือพิมพ์โจทย์แทนได้");
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    setReply("กำลังฟังโจทย์ของคุณ...");
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const closePanel = () => {
    stopListening();
    setIsOpen(false);
  };

  return (
    <>
      <motion.button
        onClick={isListening ? stopListening : startListening}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={`fixed bottom-7 left-1/2 z-50 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full text-white transition ${
          isListening ? "bg-[#23a55a] shadow-[0_0_42px_rgba(35,165,90,0.78)]" : "bg-black shadow-[0_16px_40px_rgba(0,0,0,0.28)] dark:bg-white dark:text-black"
        }`}
        aria-label={isListening ? "หยุดรับเสียง" : "เปิดไมค์เพื่อให้ AI แนะนำโรงแรม"}
      >
        {isListening && <span className="absolute inset-[-10px] rounded-full border border-[#23a55a]/60 shadow-[0_0_34px_rgba(35,165,90,0.75)]" />}
        {isListening ? <MicOff className="relative h-7 w-7" /> : <Mic className="relative h-7 w-7" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="fixed bottom-28 left-1/2 z-50 w-[92%] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#101010]"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 dark:border-gray-800">
              <div className="flex gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#23a55a] text-white shadow-[0_0_26px_rgba(35,165,90,0.45)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white">AI แนะนำที่พัก</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">บอกโจทย์การพักผ่อน แล้วให้ AI เลือกจากโรงแรมที่มี</p>
                </div>
              </div>
              <button onClick={closePanel} className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="ปิด">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:bg-white/[0.05] dark:text-gray-200">
                {reply}
              </div>

              {recommendations.length > 0 && (
                <div className="space-y-3">
                  {recommendations.map((hotel) => (
                    <div key={hotel.name} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 transition hover:border-[#23a55a]/50 dark:hover:border-[#23a55a]/50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-black dark:text-white">{hotel.name}</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hotel.location}</p>
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold text-black dark:text-white">฿{hotel.price.toLocaleString()}</span>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        {hotel.reasons.slice(0, 2).map((reason) => (
                          <li key={reason}>- {reason}</li>
                        ))}
                      </ul>
                      {onBook && (
                        <motion.button
                          onClick={() => {
                            onBook(hotel.name);
                            closePanel();
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="mt-3 w-full rounded-lg bg-[#23a55a] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(35,165,90,0.3)] transition hover:bg-[#1e8f4e] hover:shadow-[0_6px_20px_rgba(35,165,90,0.4)]"
                        >
                          จองเลย
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void askRecommendation(input);
                  }}
                  placeholder="เช่น อยากไปภูเก็ต ใกล้ทะเล งบไม่เกิน 30000"
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-black dark:border-gray-800 dark:bg-[#0b0b0b] dark:text-white dark:focus:border-white"
                />
                <button
                  onClick={() => void askRecommendation(input)}
                  disabled={isSending}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-black text-white transition hover:bg-gray-900 disabled:opacity-50 dark:bg-white dark:text-black"
                  aria-label="ส่งโจทย์"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
