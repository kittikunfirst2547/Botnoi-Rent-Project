import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { motion } from 'motion/react';

export function SearchBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-colors duration-500"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="ปลายทาง"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] py-3 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)] focus:ring-1 focus:ring-[var(--accent-brand)]"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="เช็คอิน - เช็คเอาท์"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] py-3 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)] focus:ring-1 focus:ring-[var(--accent-brand)]"
          />
        </div>

        <div className="relative">
          <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="ผู้เข้าพัก"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] py-3 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)] focus:ring-1 focus:ring-[var(--accent-brand)]"
          />
        </div>

        <button className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-brand)] px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--accent-brand-hover)] active:scale-[0.98]">
          <Search className="h-4 w-4" />
          <span>ค้นหา</span>
        </button>
      </div>
    </motion.div>
  );
}
