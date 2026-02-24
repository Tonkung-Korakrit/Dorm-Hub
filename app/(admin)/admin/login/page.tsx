"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdLockOutline, MdOutlineEmail, MdError, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { createAdminSession } from "./actions";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // เพิ่มสถานะแสดง/ซ่อนรหัสผ่าน
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // แก้ปัญหา Hydration อย่างยั่งยืน
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "การเข้าสู่ระบบล้มเหลว");
      }

      // เซ็ต Cookie ผ่าน Server Action (ปลอดภัยกว่า)
      // await createAdminSession(data.token);

      // สลับไปหน้า Dashboard ทันที
      router.push("/admin/dashboard");
      router.refresh(); 

    } catch (err: any) {
      setError(err.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-2xl mb-4 shadow-xl">
            <MdLockOutline size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">Dormitory Management System</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm animate-shake">
                <MdError size={20} className="shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Admin Email
              </label>
              <div className="relative group">
                <MdOutlineEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-gray-900 focus:bg-white focus:border-gray-900 transition-all outline-none font-medium"
                  placeholder="admin@tu.ac.th"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <MdLockOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gray-900 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl py-4 pl-12 pr-12 text-gray-900 focus:bg-white focus:border-gray-900 transition-all outline-none font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:bg-gray-400 disabled:shadow-none mt-2 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  Authenticating...
                </span>
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-gray-400 text-xs">
          &copy; 2026 Thammasat University. Authorized Personnel Only.
        </p>
      </div>
    </div>
  );
}