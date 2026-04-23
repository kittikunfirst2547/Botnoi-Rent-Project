import { useState, useEffect } from "react";
import { Sparkles, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { HotelCard } from "./components/HotelCard";
import { SearchBar } from "./components/SearchBar";
import { BookingModal } from "./components/BookingModal";
import { BotnoiChat } from "./components/BotnoiChat";

const hotels = [
  {
    id: "1",
    name: "Anantara Siam Resort & Spa",
    location: "สุขุมวิท, กรุงเทพฯ",
    rating: 4.9,
    reviews: 1284,
    price: 12500,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949948-56b52db111dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    amenities: ["WiFi", "Pool", "Breakfast"],
  },
  {
    id: "2",
    name: "The Peninsula Bangkok",
    location: "แม่น้ำเจ้าพระยา, กรุงเทพฯ",
    rating: 4.8,
    reviews: 956,
    price: 15800,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    amenities: ["WiFi", "Pool", "Breakfast"],
  },
  {
    id: "3",
    name: "Four Seasons Chiang Mai",
    location: "แม่ริม, เชียงใหม่",
    rating: 4.9,
    reviews: 743,
    price: 11200,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949712-1c51422693d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    amenities: ["WiFi", "Pool", "Breakfast"],
  },
  {
    id: "4",
    name: "Amanpuri Phuket",
    location: "กะตะน้อย, ภูเก็ต",
    rating: 5.0,
    reviews: 892,
    price: 28500,
    imageUrl:
      "https://images.unsplash.com/photo-1729708475316-88ec2dc0083e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    amenities: ["WiFi", "Pool", "Breakfast"],
  },
  {
    id: "5",
    name: "Rayavadee Krabi",
    location: "อ่าวนาง, กระบี่",
    rating: 4.8,
    reviews: 671,
    price: 18900,
    imageUrl:
      "https://images.unsplash.com/photo-1729717949780-46e511489c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    amenities: ["WiFi", "Pool", "Breakfast"],
  },
  {
    id: "6",
    name: "Six Senses Samui",
    location: "เกาะสมุย, สุราษฎร์ธานี",
    rating: 4.9,
    reviews: 834,
    price: 21500,
    imageUrl:
      "https://images.unsplash.com/photo-1729708790867-53bff22daa17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    amenities: ["WiFi", "Pool", "Breakfast"],
  },
];

export default function App() {
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleBooking = (hotelId: string) => {
    setSelectedHotel(hotelId);
  };

  const selectedHotelData = hotels.find((h) => h.id === selectedHotel);

  return (
    <div
      className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="relative overflow-hidden">
        <header className="relative z-10 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-8 py-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-colors duration-300">
                  <Sparkles className="w-5 h-5 text-white dark:text-black transition-colors duration-300" />
                </div>
                <div>
                  <h1
                    className="text-black dark:text-white m-0 text-2xl font-semibold transition-colors duration-300"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Javis
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 m-0 transition-colors duration-300">
                    AI Hotel Booking
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <nav className="flex space-x-8">
                  <a
                    href="#"
                    className="text-sm font-medium text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    โรงแรม
                  </a>
                  <a
                    href="#"
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    โปรโมชัน
                  </a>
                  <a
                    href="#"
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    เกี่ยวกับเรา
                  </a>
                  <a
                    href="#"
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    ติดต่อเรา
                  </a>
                </nav>

                {/* Dark Mode Toggle */}
                <motion.button
                  onClick={() => setDarkMode(!darkMode)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                  aria-label="Toggle dark mode"
                >
                  <AnimatePresence mode="wait">
                    {darkMode ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun className="w-5 h-5 text-yellow-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon className="w-5 h-5 text-gray-700" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </header>

        <section className="relative z-10 max-w-7xl mx-auto px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 text-center"
          >
            <h2
              className="mb-3 text-black dark:text-white text-5xl font-semibold transition-colors duration-300"
              style={{ fontFamily: "var(--font-display)", lineHeight: "1.2" }}
            >
              ค้นหาที่พักของคุณขเองคุณได้ง่ายๆ ด้วย Javis AI Assistant
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 transition-colors duration-300">
              จองโรงแรมง่ายๆ ด้วย AI Assistant
              ที่ช่วยแนะนำสถานที่ท่องเที่ยวให้คุณ
            </p>
          </motion.div>
          <SearchBar />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-8">
              <h3
                className="text-black dark:text-white text-3xl font-semibold transition-colors duration-300"
                style={{ fontFamily: "var(--font-display)" }}
              >
                โรงแรมแนะนำ
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel, index) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <HotelCard {...hotel} onBook={handleBooking} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <footer className="relative z-10 mt-24 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h4
                  className="mb-4 text-black dark:text-white text-lg font-semibold transition-colors duration-300"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Javis
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  แพลตฟอร์มจองโรงแรมด้วย AI ที่ทันสมัยที่สุด
                </p>
              </div>
              <div>
                <h5 className="mb-4 text-black dark:text-white font-semibold transition-colors duration-300">
                  บริการ
                </h5>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      จองโรงแรม
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      AI Assistant
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      โปรโมชัน
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="mb-4 text-black dark:text-white font-semibold transition-colors duration-300">
                  บริษัท
                </h5>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      เกี่ยวกับเรา
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      ติดต่อเรา
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      ร่วมงานกับเรา
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="mb-4 text-black dark:text-white font-semibold transition-colors duration-300">
                  ช่วยเหลือ
                </h5>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      ศูนย์ช่วยเหลือ
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      นโยบายความเป็นส่วนตัว
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-black dark:hover:text-white transition-colors"
                    >
                      เงื่อนไขการใช้งาน
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-400 dark:text-gray-500 transition-colors duration-300">
              <p>
                © 2026 Javis. All rights reserved. Powered by AI Technology.
              </p>
            </div>
          </div>
        </footer>
      </div>

      <BotnoiChat />

      {selectedHotelData && (
        <BookingModal
          isOpen={!!selectedHotel}
          onClose={() => setSelectedHotel(null)}
          hotelName={selectedHotelData.name}
          price={selectedHotelData.price}
        />
      )}
    </div>
  );
}
