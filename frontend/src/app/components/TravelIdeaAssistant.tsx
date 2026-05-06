"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Mic, MicOff, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getHotelByName } from "../../data/hotels";

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
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

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
      const response = await fetch(`${API_URL}/api/ai/hotel-recommendation`, {
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
      {/* Floating Mic Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`fixed bottom-6 left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95 ${
          isListening
            ? "bg-[var(--accent-brand)] text-white shadow-[var(--accent-brand)]/30"
            : "bg-[var(--foreground)] text-[var(--background)] hover:shadow-xl"
        }`}
        aria-label={isListening ? "หยุดรับเสียง" : "เปิดไมค์เพื่อให้ AI แนะนำโรงแรม"}
      >
        {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--border)] p-4">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-brand)] text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">AI แนะนำที่พัก</h2>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">บอกโจทย์การพักผ่อน แล้วให้ AI เลือกให้</p>
                </div>
              </div>
              <button onClick={closePanel} className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]" aria-label="ปิด">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[50vh] space-y-3 overflow-y-auto p-4">
              <div className="rounded-xl bg-[var(--muted)] p-3.5 text-sm leading-relaxed text-[var(--foreground)]">
                {reply}
              </div>

              {recommendations.length > 0 && (
                <div className="space-y-2">
                  {recommendations.map((hotel) => {
                    const hotelData = getHotelByName(hotel.name);
                    const hotelId = hotelData?.id;

                    const CardContent = (
                      <div className="rounded-xl border border-[var(--border)] p-3.5 transition-colors hover:border-[var(--accent-brand)]/40 bg-[var(--card)]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{hotel.name}</h3>
                            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{hotel.location}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-[var(--accent-brand)]">
                            ฿{hotel.price.toLocaleString()}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-0.5 text-xs text-[var(--muted-foreground)]">
                          {hotel.reasons.slice(0, 2).map((reason) => (
                            <li key={reason}>• {reason}</li>
                          ))}
                        </ul>
                        {onBook && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onBook(hotel.name);
                              closePanel();
                            }}
                            className="mt-2.5 w-full rounded-lg bg-[var(--accent-brand)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-brand-hover)]"
                          >
                            จองเลย
                          </button>
                        )}
                      </div>
                    );

                    return hotelId ? (
                      <Link
                        key={hotel.name}
                        href={`/hotel/${hotelId}`}
                        onClick={closePanel}
                        className="block cursor-pointer"
                      >
                        {CardContent}
                      </Link>
                    ) : (
                      <div key={hotel.name}>
                        {CardContent}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void askRecommendation(input);
                  }}
                  placeholder="เช่น อยากไปภูเก็ต ใกล้ทะเล งบไม่เกิน 30000"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)]"
                />
                <button
                  onClick={() => void askRecommendation(input)}
                  disabled={isSending}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-brand)] text-white transition-colors hover:bg-[var(--accent-brand-hover)] disabled:opacity-50"
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
