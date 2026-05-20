"use client";

import { X, Check, Calendar, Users, Mail, UserRound, ReceiptText, ShieldCheck, QrCode, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelName: string;
  price: number;
  initialBooking?: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    customerName?: string;
    email?: string;
    phone?: string;
  } | null;
}

interface CheckoutResult {
  booking: { id: string };
  payment: { id: string; amount: number; currency: string; status: string };
  receipt: { id: string; email: string; issuedAt: string };
  email: { sent: boolean; reason?: string };
}

export function BookingModal({ isOpen, onClose, hotelName, price, initialBooking }: BookingModalProps) {
  const { user, token, openAuthModal } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "2",
    customerName: "",
    email: "",
    phone: "",
    paymentRef: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData((current) => ({
      ...current,
      checkIn: current.checkIn || initialBooking?.checkIn || "",
      checkOut: current.checkOut || initialBooking?.checkOut || "",
      guests: current.guests || String(initialBooking?.guests || 2),
      customerName: current.customerName || initialBooking?.customerName || user?.name || "",
      email: current.email || initialBooking?.email || user?.email || "",
      phone: current.phone || initialBooking?.phone || user?.phone || "",
      paymentRef: current.paymentRef || `JV-${Date.now().toString(36).toUpperCase()}`,
    }));
    if (initialBooking?.checkIn && initialBooking?.checkOut && initialBooking?.guests && initialBooking?.customerName) {
      setStep(user?.email ? 3 : 2);
    }
  }, [initialBooking, isOpen, user]);

  const nights = useMemo(() => {
    const start = new Date(`${formData.checkIn}T00:00:00`);
    const end = new Date(`${formData.checkOut}T00:00:00`);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
    return Number.isFinite(diff) && diff > 0 ? diff : 1;
  }, [formData.checkIn, formData.checkOut]);

  const total = price * nights;
  const qrPayload = JSON.stringify({
    type: "JAVIS_DEMO_PAYMENT",
    ref: formData.paymentRef,
    hotel: hotelName,
    amount: total,
    currency: "THB",
    note: "Demo payment only",
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(qrPayload)}`;

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)] focus:ring-1 focus:ring-[var(--accent-brand)]";

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setError("");
      setCheckout(null);
      setSubmitting(false);
    }, 200);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.checkIn || !formData.checkOut) return "กรุณาเลือกวันเช็คอินและเช็คเอาท์";
      if (new Date(formData.checkOut) <= new Date(formData.checkIn)) return "วันเช็คเอาท์ต้องอยู่หลังวันเช็คอิน";
    }
    if (step === 2) {
      if (!formData.customerName.trim() || !formData.email.trim()) return "กรุณากรอกชื่อและอีเมลสำหรับส่งใบเสร็จ";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (step === 3) {
      if (!user || !token) return "กรุณาเข้าสู่ระบบก่อนชำระเงิน";
    }
    return "";
  };

  const submitPayment = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      if (validationError.includes("เข้าสู่ระบบ")) openAuthModal("login");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking: {
            hotelName,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            guests: Number(formData.guests),
            customerName: formData.customerName,
            email: formData.email,
            phone: formData.phone,
          },
          payment: {
            method: "qr",
            reference: formData.paymentRef,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Payment failed");
      setCheckout(data);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      if (validationError.includes("เข้าสู่ระบบ")) openAuthModal("login");
      return;
    }
    setError("");
    if (step < 3) setStep(step + 1);
    else void submitPayment();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          >
            <div className="border-b border-[var(--border)] p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">จองห้องพัก</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{hotelName}</p>
                </div>
                <button
                  onClick={resetAndClose}
                  className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                        step >= item ? "bg-[var(--accent-brand)] text-white" : "border border-[var(--border)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      {step > item ? <Check className="h-4 w-4" /> : item}
                    </div>
                    {item < 4 && <div className={`h-px w-9 ${step > item ? "bg-[var(--accent-brand)]" : "bg-[var(--border)]"}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="max-h-[430px] overflow-y-auto p-6">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h3 className="text-base font-medium text-[var(--foreground)]">รายละเอียดการเข้าพัก</h3>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Calendar className="h-3.5 w-3.5" />
                      วันเช็คอิน
                    </span>
                    <input type="date" value={formData.checkIn} onChange={(event) => setFormData({ ...formData, checkIn: event.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Calendar className="h-3.5 w-3.5" />
                      วันเช็คเอาท์
                    </span>
                    <input type="date" value={formData.checkOut} onChange={(event) => setFormData({ ...formData, checkOut: event.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Users className="h-3.5 w-3.5" />
                      จำนวนผู้เข้าพัก
                    </span>
                    <select value={formData.guests} onChange={(event) => setFormData({ ...formData, guests: event.target.value })} className={inputClass}>
                      <option value="1">1 คน</option>
                      <option value="2">2 คน</option>
                      <option value="3">3 คน</option>
                      <option value="4">4 คน</option>
                    </select>
                  </label>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h3 className="text-base font-medium text-[var(--foreground)]">ข้อมูลผู้จอง</h3>
                  {!user && (
                    <button
                      onClick={() => openAuthModal("login")}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                    >
                      <ShieldCheck className="h-4 w-4 text-[var(--accent-brand)]" />
                      เข้าสู่ระบบก่อนชำระเงิน
                    </button>
                  )}
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <UserRound className="h-3.5 w-3.5" />
                      ชื่อ-นามสกุล
                    </span>
                    <input value={formData.customerName} onChange={(event) => setFormData({ ...formData, customerName: event.target.value })} placeholder="ชื่อผู้จอง" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                      <Mail className="h-3.5 w-3.5" />
                      อีเมลสำหรับใบเสร็จ
                    </span>
                    <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="example@email.com" className={inputClass} />
                  </label>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium text-[var(--foreground)]">ชำระเงินด้วย QR</h3>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">สแกนเพื่อจ่ายแบบ demo แล้วกดยืนยัน</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--accent-brand)]">
                      <QrCode className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="rounded-xl bg-[var(--accent-brand)] p-5 text-white">
                    <p className="text-xs opacity-80">{nights} คืน x ฿{price.toLocaleString()}</p>
                    <p className="mt-1 text-2xl font-semibold">฿{total.toLocaleString()}</p>
                    <p className="mt-2 text-xs opacity-80">Ref: {formData.paymentRef}</p>
                  </div>

                  <div className="mx-auto w-fit rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
                    <img src={qrUrl} alt="Demo payment QR code" className="h-60 w-60" />
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-brand)]" />
                    <div className="text-sm leading-relaxed text-[var(--foreground)]">
                      <p className="font-medium">สแกน QR ด้วยมือถือ</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">นี่เป็น QR สำหรับ demo เท่านั้น ยังไม่ตัดเงินจริง</p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    เมื่อสแกนแล้วให้กดปุ่มด้านล่างเพื่อจำลองว่าชำระเงินสำเร็จ
                  </p>
                </motion.div>
              )}

              {step === 4 && checkout && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">จองสำเร็จ</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      ส่งใบเสร็จไปที่ {checkout.receipt.email} {checkout.email.sent ? "เรียบร้อยแล้ว" : "ไม่สำเร็จ แต่สร้างใบเสร็จไว้แล้ว"}
                    </p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 text-left text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted-foreground)]">Receipt</span>
                      <strong className="text-[var(--foreground)]">{checkout.receipt.id}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted-foreground)]">Paid</span>
                      <strong className="text-[var(--foreground)]">฿{checkout.payment.amount.toLocaleString()}</strong>
                    </div>
                  </div>
                  {!checkout.email.sent && checkout.email.reason && (
                    <p className="text-xs text-[var(--muted-foreground)]">Email note: {checkout.email.reason}</p>
                  )}
                </motion.div>
              )}

              {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            </div>

            <div className="border-t border-[var(--border)] p-5">
              {step === 4 ? (
                <button
                  onClick={resetAndClose}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-brand)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[var(--accent-brand-hover)]"
                >
                  <ReceiptText className="h-4 w-4" />
                  เสร็จสิ้น
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setError("");
                      setStep(Math.max(1, step - 1));
                    }}
                    disabled={step === 1 || submitting}
                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-[var(--accent-brand)] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--accent-brand-hover)] disabled:opacity-60"
                  >
                    {submitting ? "กำลังตรวจสอบ..." : step === 3 ? "ชำระแล้ว ยืนยันการจอง" : "ถัดไป"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
