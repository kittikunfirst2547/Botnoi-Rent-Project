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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90%] max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-white border-b border-gray-200 p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl mb-2 text-black font-semibold" style={{ fontFamily: 'var(--font-display)' }}>จองห้องพัก</h2>
                  <p className="text-gray-500">{hotelName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-gray-100 p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all font-medium ${
                        step >= s
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`w-32 h-0.5 mx-3 transition-all ${
                          step > s ? 'bg-black' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 max-h-[400px] overflow-y-auto">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <h3 className="text-black mb-6 text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    รายละเอียดการเข้าพัก
                  </h3>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      วันเช็คอิน
                    </label>
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      วันเช็คเอาท์
                    </label>
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">
                      <Users className="w-4 h-4 inline mr-2" />
                      จำนวนผู้เข้าพัก
                    </label>
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <h3 className="text-black mb-6 text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    ข้อมูลผู้จอง
                  </h3>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="กรุณาระบุชื่อ-นามสกุล"
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">อีเมล</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0xx-xxx-xxxx"
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <h3 className="text-black mb-6 text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    ชำระเงิน
                  </h3>

                  <div className="bg-black p-6 rounded-xl text-white">
                    <p className="text-sm opacity-70 mb-2">ยอดรวมทั้งหมด</p>
                    <p className="text-4xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      ฿{price.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2 font-medium">
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      หมายเลขบัตร
                    </label>
                    <input
                      type="text"
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2 font-medium">วันหมดอายุ</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2 font-medium">CVV</label>
                      <input
                        type="text"
                        placeholder="xxx"
                        className="w-full px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-black transition-all border border-transparent focus:border-black"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="bg-white border-t border-gray-200 p-8">
                <div className="flex justify-between gap-4">
                  <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="px-8 py-3.5 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium text-lg"
                  >
                    ย้อนกลับ
                  </button>
                  <motion.button
                    onClick={handleConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-8 py-3.5 bg-black text-white rounded-xl hover:bg-gray-900 transition-all font-medium text-lg"
                  >
                    {step === 3 ? 'ยืนยันการจอง' : 'ถัดไป'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
