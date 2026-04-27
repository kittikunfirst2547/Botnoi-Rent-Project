import { ClipboardList, Mic, X } from "lucide-react";
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
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#111]"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-gray-800">
              <div>
                <h2 className="text-2xl font-semibold text-black dark:text-white">เลือกวิธีจอง</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{hotelName}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-black transition hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <button
                onClick={onSelectVoice}
                className="group flex min-h-40 flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center transition hover:border-black hover:bg-white dark:border-gray-800 dark:bg-[#0b0b0b] dark:hover:border-white dark:hover:bg-[#151515]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-black text-white transition group-hover:scale-105 dark:bg-white dark:text-black">
                  <Mic className="h-8 w-8" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-black dark:text-white">คุยกับ AI</span>
                  <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">เปิดไมค์แล้วจองด้วยเสียง</span>
                </span>
              </button>

              <button
                onClick={onSelectForm}
                className="group flex min-h-40 flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center transition hover:border-black hover:bg-white dark:border-gray-800 dark:bg-[#0b0b0b] dark:hover:border-white dark:hover:bg-[#151515]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-black text-white transition group-hover:scale-105 dark:bg-white dark:text-black">
                  <ClipboardList className="h-8 w-8" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-black dark:text-white">กรอกฟอร์ม</span>
                  <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">ใส่รายละเอียดด้วยตัวเอง</span>
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
