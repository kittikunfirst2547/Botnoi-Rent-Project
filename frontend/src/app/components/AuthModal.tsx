"use client";

import { useEffect, useState } from "react";
import { Lock, LogIn, Mail, Phone, UserRound, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";

export function AuthModal() {
  const { authModalOpen, authMode, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(authMode);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(authMode);
    setError("");
  }, [authMode, authModalOpen]);

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent-brand)] focus:ring-1 focus:ring-[var(--accent-brand)]";

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm"
            onClick={closeAuthModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="fixed left-1/2 top-1/2 z-[90] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-[var(--border)] p-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  ใช้บัญชีนี้สำหรับจอง ชำระเงิน และรับใบเสร็จ
                </p>
              </div>
              <button
                onClick={closeAuthModal}
                className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {mode === "register" && (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                    <UserRound className="h-3.5 w-3.5" />
                    ชื่อผู้ใช้
                  </span>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                  <Mail className="h-3.5 w-3.5" />
                  อีเมล
                </span>
                <input
                  className={inputClass}
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="example@email.com"
                />
              </label>

              {mode === "register" && (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                    <Phone className="h-3.5 w-3.5" />
                    เบอร์โทร
                  </span>
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="0812345678"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                  <Lock className="h-3.5 w-3.5" />
                  รหัสผ่าน
                </span>
                <input
                  className={inputClass}
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                />
              </label>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <button
                onClick={submit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-brand)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--accent-brand-hover)] disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สมัครและเข้าสู่ระบบ"}
              </button>

              <button
                onClick={() => {
                  setError("");
                  setMode(mode === "login" ? "register" : "login");
                }}
                className="w-full text-sm font-medium text-[var(--accent-brand)]"
              >
                {mode === "login" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
