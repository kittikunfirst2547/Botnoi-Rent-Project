import {
  Sparkles,
  Target,
  Eye,
  Heart,
  Shield,
  Zap,
  Users,
  Globe,
  Award,
  TrendingUp,
  Building2,
  Bot,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

const stats = [
  { icon: <Users className="w-5 h-5" />, value: "500K+", label: "ผู้ใช้งาน", color: "from-blue-500 to-cyan-500" },
  { icon: <Building2 className="w-5 h-5" />, value: "2,000+", label: "โรงแรมพันธมิตร", color: "from-violet-500 to-purple-500" },
  { icon: <Globe className="w-5 h-5" />, value: "50+", label: "จังหวัดทั่วไทย", color: "from-emerald-500 to-teal-500" },
  { icon: <Award className="w-5 h-5" />, value: "4.9/5", label: "คะแนนรีวิว", color: "from-amber-500 to-orange-500" },
];

const values = [
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI-First Approach",
    description: "เราใช้เทคโนโลยี AI ล้ำสมัยในการวิเคราะห์และแนะนำที่พักที่ตรงใจคุณที่สุด",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "ความน่าเชื่อถือ",
    description: "ทุกโรงแรมผ่านการตรวจสอบคุณภาพ พร้อมระบบชำระเงินที่ปลอดภัย 100%",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "ใส่ใจทุกรายละเอียด",
    description: "ทีมงานพร้อมดูแลคุณตลอด 24 ชั่วโมง ตั้งแต่การจองจนถึงเช็คเอาท์",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "รวดเร็วทันใจ",
    description: "จองห้องพักได้ภายใน 30 วินาที ด้วย Voice AI หรือแชทบอทอัจฉริยะ",
    gradient: "from-amber-500 to-orange-500",
  },
];

const timeline = [
  { year: "2023", title: "ก่อตั้ง Javis", desc: "เริ่มต้นจากไอเดียการจองโรงแรมด้วย AI ของทีมนักพัฒนาชาวไทย" },
  { year: "2024", title: "เปิดตัว AI Assistant", desc: "เปิดตัวระบบ AI แนะนำโรงแรมและจองด้วยเสียงเป็นรายแรกในไทย" },
  { year: "2025", title: "ขยายเครือข่าย", desc: "ครอบคลุมโรงแรมกว่า 2,000 แห่งใน 50+ จังหวัดทั่วประเทศ" },
  { year: "2026", title: "ก้าวสู่อนาคต", desc: "พัฒนา Javis 2.0 พร้อม Personalized AI ที่เข้าใจคุณมากกว่าเดิม" },
];

const teamMembers = [
  {
    name: "สมชาย วิทยาการ",
    role: "CEO & Co-founder",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=200&h=200",
  },
  {
    name: "สุภาพร นวัตกรรม",
    role: "CTO & Co-founder",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=200&h=200",
  },
  {
    name: "ธนพล ดิจิทัล",
    role: "Head of AI",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=200&h=200",
  },
  {
    name: "พิมพ์ใจ สร้างสรรค์",
    role: "Head of Design",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=200&h=200",
  },
];

export function AboutPage() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-8 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl overflow-hidden mb-16"
      >
        <div className="relative h-[340px] md:h-[420px]">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Javis Office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/20">
                  <Sparkles className="w-4 h-4" />
                  เกี่ยวกับเรา
                </div>
              </div>
              <h2
                className="text-white text-4xl md:text-5xl font-bold mb-4 max-w-lg"
                style={{ fontFamily: "var(--font-display)", lineHeight: "1.2" }}
              >
                เปลี่ยนการจองโรงแรม
                <br />
                <span className="bg-gradient-to-r from-blue-300 to-violet-400 bg-clip-text text-transparent">
                  ด้วยพลัง AI
                </span>
              </h2>
              <p className="text-white/80 text-base md:text-lg max-w-md">
                Javis คือแพลตฟอร์มจองโรงแรมด้วย AI ที่ทันสมัยที่สุดในประเทศไทย
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all hover:shadow-lg dark:hover:shadow-black/30 text-center"
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mx-auto mb-3`}
            >
              {stat.icon}
            </div>
            <p
              className="text-black dark:text-white text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Mission & Vision */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20"
      >
        <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30 rounded-2xl p-8 border border-blue-100 dark:border-blue-900/50">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white mb-5">
            <Target className="w-6 h-6" />
          </div>
          <h3
            className="text-black dark:text-white text-2xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            พันธกิจของเรา
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            เราตั้งใจสร้างประสบการณ์การจองโรงแรมที่ดีที่สุดด้วยเทคโนโลยี AI
            ทำให้ทุกคนสามารถค้นหาและจองที่พักในฝันได้อย่างง่ายดาย รวดเร็ว
            และได้ราคาที่คุ้มค่าที่สุด
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-8 border border-amber-100 dark:border-amber-900/50">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white mb-5">
            <Eye className="w-6 h-6" />
          </div>
          <h3
            className="text-black dark:text-white text-2xl font-bold mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            วิสัยทัศน์ของเรา
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            เป็นแพลตฟอร์มจองโรงแรมอันดับ 1 ของประเทศไทย
            ที่ขับเคลื่อนด้วย AI อัจฉริยะ เข้าใจความต้องการของผู้ใช้
            และมอบประสบการณ์ที่เป็นส่วนตัวสูงสุด
          </p>
        </div>
      </motion.div>

      {/* Core Values */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="text-center mb-10">
          <h3
            className="text-black dark:text-white text-3xl font-bold mb-2 transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            คุณค่าหลักของเรา
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            สิ่งที่ขับเคลื่อน Javis ให้ก้าวไปข้างหน้า
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all hover:shadow-lg dark:hover:shadow-black/30"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${v.gradient} flex items-center justify-center text-white mb-4`}
              >
                {v.icon}
              </div>
              <h4 className="text-black dark:text-white font-bold text-sm mb-2">
                {v.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {v.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="text-center mb-10">
          <h3
            className="text-black dark:text-white text-3xl font-bold mb-2 transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            เส้นทางของเรา
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            จากจุดเริ่มต้นสู่แพลตฟอร์ม AI ชั้นนำ
          </p>
        </div>
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-[23px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
          {timeline.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative flex items-start gap-6 mb-10 last:mb-0 md:flex-row ${
                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Dot */}
              <div className="absolute left-[16px] md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-black dark:bg-white border-4 border-white dark:border-gray-900 z-10 shadow-md" />
              {/* Content */}
              <div
                className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${
                  i % 2 === 0 ? "md:text-right md:pr-8" : "md:text-left md:pl-8 md:ml-auto"
                }`}
              >
                <span className="inline-block px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full mb-2">
                  {item.year}
                </span>
                <h4 className="text-black dark:text-white font-bold text-base mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Team */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-20"
      >
        <div className="text-center mb-10">
          <h3
            className="text-black dark:text-white text-3xl font-bold mb-2 transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ทีมผู้บริหาร
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            ผู้อยู่เบื้องหลังความสำเร็จของ Javis
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {teamMembers.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all hover:shadow-lg dark:hover:shadow-black/30 text-center"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gray-100 dark:border-gray-800">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-black dark:text-white font-bold text-sm mb-1">
                {member.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl px-12 py-10 border border-gray-200 dark:border-gray-700 inline-block">
          <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-4" />
          <h4
            className="text-black dark:text-white text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            พร้อมเริ่มต้นการเดินทางกับ Javis?
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            สัมผัสประสบการณ์จองโรงแรมแบบใหม่ ที่ AI เข้าใจคุณ
          </p>
          <div className="flex items-center gap-3 justify-center">
            <motion.a
              href="#home"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              เริ่มจองเลย
              <ArrowRight className="w-4 h-4" />
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-xl font-semibold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ติดต่อเรา
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
