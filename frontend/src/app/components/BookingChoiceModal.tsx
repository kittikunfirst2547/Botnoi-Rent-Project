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

            <div className="grid gap-4 p-5 sm:grid-cols-[1.15fr_0.85fr]">
              <button
                onClick={onSelectVoice}
                className="group relative min-h-48 overflow-hidden rounded-xl border border-[#23a55a]/35 bg-[#0d1f16] p-5 text-left text-white shadow-[0_18px_44px_rgba(35,165,90,0.22)] transition hover:-translate-y-0.5 hover:border-[#23a55a]/70 hover:shadow-[0_22px_54px_rgba(35,165,90,0.32)]"
              >
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-[#7dffa8]">
                  <Sparkles className="h-3.5 w-3.5" />
                  แนะนำ
                </span>
                <span className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-[#23a55a]/25 blur-2xl" />
                <span className="relative flex h-full flex-col justify-between gap-5">
                  <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[#23a55a] text-white shadow-[0_0_34px_rgba(35,165,90,0.7)] transition group-hover:scale-105">
                    <span className="absolute inset-[-8px] rounded-full border border-[#23a55a]/50 shadow-[0_0_28px_rgba(35,165,90,0.58)]" />
                    <Mic className="relative h-8 w-8" />
                  </span>
                  <span>
                    <span className="block text-xl font-semibold">คุยกับ AI</span>
                    <span className="mt-2 block text-sm leading-relaxed text-white/72">
                      พูดหรือพิมพ์ให้ AI ถามข้อมูลทีละขั้น แล้วสรุปก่อนยืนยันการจอง
                    </span>
                  </span>
                  <span className="inline-flex w-fit items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0d1f16] transition group-hover:bg-[#eafff0]">
                    เริ่มคุยเลย
                  </span>
                </span>
              </button>

              <button
                onClick={onSelectForm}
                className="group flex min-h-48 flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center transition hover:-translate-y-0.5 hover:border-black hover:bg-white dark:border-gray-800 dark:bg-[#0b0b0b] dark:hover:border-white dark:hover:bg-[#151515]"
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
