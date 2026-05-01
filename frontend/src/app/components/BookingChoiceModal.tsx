import { ClipboardList, Mic, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface BookingChoiceModalProps {
  isOpen: boolean;
  hotelName: string;
  onClose: () => void;
  onSelectForm: () => void;
  onSelectVoice: () => void;
}

export function BookingChoiceModal({
  isOpen,
  hotelName,
  onClose,
  onSelectForm,
  onSelectVoice,
}: BookingChoiceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--border)] p-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">เลือกวิธีจอง</h2>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{hotelName}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Options */}
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {/* Voice AI Option */}
              <button
                onClick={onSelectVoice}
                className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-xl border border-[var(--accent-brand)]/30 bg-[var(--accent-brand-light)] p-5 text-left transition-all duration-200 hover:border-[var(--accent-brand)]/60 hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-brand)] text-white transition-transform group-hover:scale-105">
                    <Mic className="h-5 w-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-brand)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-brand)]">
                    <Sparkles className="h-3 w-3" />
                    แนะนำ
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-semibold text-[var(--foreground)]">คุยกับ AI</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--muted-foreground)]">
                    พูดหรือพิมพ์ให้ AI ถามข้อมูลทีละขั้น แล้วสรุปก่อนยืนยัน
                  </span>
                </div>
              </button>

              {/* Form Option */}
              <button
                onClick={onSelectForm}
                className="group flex flex-col items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 text-left transition-all duration-200 hover:border-[var(--foreground)]/20 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-transform group-hover:scale-105">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-sm font-semibold text-[var(--foreground)]">กรอกฟอร์ม</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--muted-foreground)]">
                    ใส่รายละเอียดด้วยตัวเอง
                  </span>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
