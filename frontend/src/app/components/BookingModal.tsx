import { X, Check, Calendar, Users, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelName: string;
  price: number;
}

export function BookingModal({ isOpen, onClose, hotelName, price }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
    name: '',
    email: '',
    phone: '',
  });

  const handleConfirm = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setTimeout(() => {
        alert('การจองสำเร็จ! คุณจะได้รับอีเมลยืนยันในไม่ช้า');
        onClose();
        setStep(1);
      }, 1500);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)] focus:ring-1 focus:ring-[var(--accent-brand)]";

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
            className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          >
            {/* Header */}
            <div className="border-b border-[var(--border)] p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2
                    className="text-xl font-semibold text-[var(--foreground)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    จองห้องพัก
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{hotelName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Steps */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                        step >= s
                          ? 'bg-[var(--accent-brand)] text-white'
                          : 'border border-[var(--border)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`h-px w-12 transition-colors ${
                          step > s ? 'bg-[var(--accent-brand)]' : 'bg-[var(--border)]'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="max-h-[380px] overflow-y-auto p-6">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3
                    className="mb-2 text-base font-medium text-[var(--foreground)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    รายละเอียดการเข้าพัก
                  </h3>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Calendar className="h-3.5 w-3.5" />
                      วันเช็คอิน
                    </label>
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Calendar className="h-3.5 w-3.5" />
                      วันเช็คเอาท์
                    </label>
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Users className="h-3.5 w-3.5" />
                      จำนวนผู้เข้าพัก
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className={inputClass}
                    >
                      <option value="1">1 คน</option>
                      <option value="2">2 คน</option>
                      <option value="3">3 คน</option>
                      <option value="4">4 คน</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3
                    className="mb-2 text-base font-medium text-[var(--foreground)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    ข้อมูลผู้จอง
                  </h3>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="กรุณาระบุชื่อ-นามสกุล"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">อีเมล</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0xx-xxx-xxxx"
                      className={inputClass}
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3
                    className="mb-2 text-base font-medium text-[var(--foreground)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    ชำระเงิน
                  </h3>

                  <div className="rounded-xl bg-[var(--accent-brand)] p-5 text-white">
                    <p className="text-xs opacity-80">ยอดรวมทั้งหมด</p>
                    <p className="mt-1 text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      ฿{price.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <CreditCard className="h-3.5 w-3.5" />
                      หมายเลขบัตร
                    </label>
                    <input type="text" placeholder="xxxx xxxx xxxx xxxx" className={inputClass} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">วันหมดอายุ</label>
                      <input type="text" placeholder="MM/YY" className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">CVV</label>
                      <input type="text" placeholder="xxx" className={inputClass} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-[var(--border)] p-5">
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-[var(--accent-brand)] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--accent-brand-hover)] active:scale-[0.98]"
                >
                  {step === 3 ? 'ยืนยันการจอง' : 'ถัดไป'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
