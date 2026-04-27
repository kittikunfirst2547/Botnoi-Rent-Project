import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Headphones,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const contactInfo = [
  {
    icon: <Phone className="w-5 h-5" />,
    title: "โทรศัพท์",
    value: "02-123-4567",
    subtitle: "จันทร์ - ศุกร์ 9:00 - 18:00",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: "อีเมล",
    value: "support@javis.co.th",
    subtitle: "ตอบกลับภายใน 24 ชั่วโมง",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: "ที่อยู่",
    value: "อาคาร Javis Tower ชั้น 25",
    subtitle: "ถ.สุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "เวลาทำการ",
    value: "จันทร์ - ศุกร์",
    subtitle: "09:00 - 18:00 น.",
    color: "from-amber-500 to-orange-500",
  },
];

const faqItems = [
  {
    q: "จองโรงแรมแล้วสามารถยกเลิกได้ไหม?",
    a: "สามารถยกเลิกได้ฟรีก่อนเข้าพัก 48 ชั่วโมง สำหรับโปรโมชัน Early Bird จะไม่สามารถยกเลิกได้ กรุณาตรวจสอบเงื่อนไขก่อนจอง",
  },
  {
    q: "ชำระเงินได้ช่องทางไหนบ้าง?",
    a: "รองรับบัตรเครดิต/เดบิต (Visa, MasterCard, JCB), โอนผ่านธนาคาร, PromptPay และ TrueMoney Wallet",
  },
  {
    q: "Javis AI Assistant ช่วยอะไรได้บ้าง?",
    a: "AI Assistant สามารถช่วยค้นหาโรงแรมตามงบประมาณ, แนะนำสถานที่ท่องเที่ยวใกล้เคียง, เปรียบเทียบราคา และจองห้องพักให้คุณโดยอัตโนมัติ",
  },
  {
    q: "สมัครสมาชิก Javis มีค่าใช้จ่ายไหม?",
    a: "สมัครสมาชิกฟรี! สมาชิกจะได้รับส่วนลดพิเศษ 15% ทุกการจอง พร้อมสิทธิ์ Early Access สำหรับโปรโมชันใหม่",
  },
];

function FAQItem({ item, index }: { item: typeof faqItems[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-sm font-semibold text-black dark:text-white pr-4">
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 flex-shrink-0 text-lg"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-8 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Headphones className="w-4 h-4" />
          พร้อมช่วยเหลือคุณเสมอ
        </div>
        <h2
          className="text-black dark:text-white text-4xl md:text-5xl font-bold mb-4 transition-colors"
          style={{ fontFamily: "var(--font-display)", lineHeight: "1.2" }}
        >
          ติดต่อ
          <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
            {" "}เรา
          </span>
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto">
          มีคำถามหรือต้องการความช่วยเหลือ? ทีมงาน Javis พร้อมดูแลคุณ
        </p>
      </motion.div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
        {contactInfo.map((info, i) => (
          <motion.div
            key={info.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all hover:shadow-lg dark:hover:shadow-black/30"
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center text-white mb-4`}
            >
              {info.icon}
            </div>
            <h4 className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-1">
              {info.title}
            </h4>
            <p className="text-black dark:text-white font-semibold text-sm mb-1">
              {info.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {info.subtitle}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Form + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h3
                className="text-black dark:text-white text-xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ส่งข้อความถึงเรา
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-black dark:text-white text-lg font-bold mb-2">
                    ส่งข้อความเรียบร้อย!
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    เราจะติดต่อกลับภายใน 24 ชั่วโมง
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        ชื่อ-นามสกุล
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all placeholder:text-gray-400"
                        placeholder="กรุณากรอกชื่อ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        อีเมล
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all placeholder:text-gray-400"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      หัวข้อ
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="เช่น สอบถามเรื่องการจอง"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      ข้อความ
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all resize-none placeholder:text-gray-400"
                      placeholder="กรุณาระบุรายละเอียด..."
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    ส่งข้อความ
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Map / Location Visual */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <div className="relative flex-1 min-h-[300px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.7!2d100.56!3d13.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQzJzQ4LjAiTiAxMDDCsDMzJzM2LjAiRQ!5e0!3m2!1sth!2sth!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "300px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
              title="Javis Office Location"
            />
          </div>

          {/* Quick Contact CTA */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 text-white border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">ต้องการคำตอบเร็วกว่านี้?</h4>
                <p className="text-xs text-gray-400 mb-3">
                  ใช้ Javis AI Assistant ถามคำถามได้ตลอด 24 ชั่วโมง
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  เปิด AI Assistant
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <h3
            className="text-black dark:text-white text-3xl font-bold mb-2 transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            คำถามที่พบบ่อย
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            คำตอบสำหรับคำถามยอดนิยมของลูกค้า
          </p>
        </div>
        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <FAQItem key={i} item={item} index={i} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
