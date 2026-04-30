import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { motion } from 'motion/react';

export function SearchBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm transition-colors duration-300"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ปลายทาง"
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all border border-transparent focus:border-black dark:focus:border-white"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="เช็คอิน - เช็คเอาท์"
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all border border-transparent focus:border-black dark:focus:border-white"
          />
        </div>

        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ผู้เข้าพัก"
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all border border-transparent focus:border-black dark:focus:border-white"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-xl hover:bg-gray-900 dark:hover:bg-gray-200 transition-all"
        >
          <Search className="w-5 h-5" />
          <span className="font-medium">ค้นหา</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
