import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Mic, MicOff, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'สวัสดีค่ะ! ยินดีต้อนรับสู่ระบบจองโรงแรมของเรา ฉันชื่อ AI Assistant พร้อมช่วยคุณจองโรงแรมที่ใช่ ลองบอกฉันเกี่ยวกับการเดินทางของคุณสิคะ',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = getAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('กรุงเทพ') || input.includes('bangkok')) {
      return 'เยี่ยมเลยค่ะ! เรามีโรงแรมในกรุงเทพฯ หลายแห่งให้เลือก ตั้งแต่ luxury hotel ระดับ 5 ดาวไปจนถึง boutique hotel สุดชิค คุณต้องการพักในย่านไหนคะ? สุขุมวิท, สยาม, หรือเจ้าพระยา?';
    }
    if (input.includes('เชียงใหม่') || input.includes('chiang mai')) {
      return 'เชียงใหม่! เมืองแห่งวัฒนธรรมล้านนา เรามีโรงแรมบรรยากาศสบายๆ ทั้งในเมืองเก่าและใกล้ภูเขา คุณสนใจพักแบบไหนคะ?';
    }
    if (input.includes('ภูเก็ต') || input.includes('phuket')) {
      return 'ภูเก็ตเป็นทางเลือกที่ยอดเยี่ยม! เรามี beach resort ริมทะเลสวยๆ มากมาย ทั้งป่าตอง, กะตะ, และกะรน คุณชอบอยู่ใกล้ชายหาดไหนคะ?';
    }
    if (input.includes('ราคา') || input.includes('price') || input.includes('เท่าไหร่')) {
      return 'โรงแรมของเรามีหลากหลายราคาค่ะ ตั้งแต่ 1,500 บาท/คืน สำหรับห้องมาตรฐาน ไปจนถึง 15,000+ บาท/คืน สำหรับห้อง suite หรู คุณมีงบประมาณประมาณเท่าไหร่คะ?';
    }
    if (input.includes('จอง') || input.includes('book')) {
      return 'ยินดีช่วยจองให้ค่ะ! กรุณาเลือกโรงแรมที่คุณสนใจจากรายการด้านบน หรือบอกชื่อโรงแรมที่ต้องการ แล้วฉันจะช่วยดำเนินการจองให้เลยค่ะ';
    }
    if (input.includes('สระว่ายน้ำ') || input.includes('pool')) {
      return 'โรงแรมส่วนใหญ่ของเรามีสระว่ายน้ำค่ะ! บางแห่งมี infinity pool ชมวิวสวยๆ ด้วย ฉันจะกรองเฉพาะโรงแรมที่มีสระว่ายน้ำให้นะคะ';
    }

    return 'ขอบคุณสำหรับข้อมูลค่ะ ฉันจะหาโรงแรมที่เหมาะกับคุณที่สุด มีอะไรอยากทราบเพิ่มเติมไหมคะ เช่น สิ่งอำนวยความสะดวก, ทำเลที่ตั้ง หรือราคาที่ต้องการ?';
  };

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    if (!isVoiceActive) {
      setTimeout(() => {
        const voiceMessage: Message = {
          id: Date.now().toString(),
          text: 'กำลังรับฟังเสียงของคุณ... (นี่เป็นการจำลอง Voice Assistant)',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, voiceMessage]);
      }, 1000);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 bg-black text-white p-5 rounded-full shadow-xl hover:bg-gray-900 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <MessageCircle className="w-7 h-7" />
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full border-2 border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-50 w-[450px] h-[650px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <div className="h-full flex flex-col">
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-xl text-black" style={{ fontFamily: 'var(--font-display)' }}>
                      AI Assistant
                    </h3>
                    <p className="text-sm text-gray-500">พร้อมให้บริการตลอด 24 ชั่วโมง</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-black" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl ${
                        message.sender === 'user'
                          ? 'bg-black text-white rounded-br-sm'
                          : 'bg-white text-black border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className="text-[10px] mt-1.5 opacity-50">
                        {message.timestamp.toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-gray-200 p-4 rounded-xl rounded-bl-sm">
                      <div className="flex space-x-2">
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleVoice}
                    className={`p-3 rounded-full transition-all ${
                      isVoiceActive
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-full outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-3 bg-black text-white rounded-full hover:bg-gray-900 transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
