// app/(admin)/admin/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MdLockOutline, MdOutlineEmail, MdError, 
  MdVisibility, MdVisibilityOff, MdSecurity 
} from "react-icons/md";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

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
      if (!response.ok) throw new Error(data.message || "การเข้าสู่ระบบล้มเหลว");

      // await createAdminSession(data.token); // เปิดใช้งานตามระบบของต้น
      router.push("/admin/dashboard");
      router.refresh(); 
    } catch (err: any) {
      setError(err.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Background Decor - เพิ่มลูกเล่นให้ดูไม่จืดชืด */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>

      <div className="max-w-[440px] w-full relative z-10">
        
        {/* --- Header & Brand --- */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white shadow-2xl shadow-green-900/10 rounded-[2rem] mb-6 group transition-transform hover:scale-105">
             <MdSecurity className="text-[#126A31]" size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
            Dorm<span className="text-[#126A31]">Hub</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-[1px] w-8 bg-slate-200"></div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Admin Portal</p>
            <div className="h-[1px] w-8 bg-slate-200"></div>
          </div>
        </div>

        {/* --- Login Card --- */}
        <div className="bg-white/80 backdrop-blur-xl p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs animate-in fade-in zoom-in duration-300">
                <MdError size={18} className="shrink-0" />
                <span className="font-bold tracking-tight">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Internal Email
              </label>
              <div className="relative group">
                <MdOutlineEmail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#126A31] transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-4 text-slate-900 text-sm focus:bg-white focus:border-[#126A31] focus:ring-4 focus:ring-green-500/5 transition-all outline-none font-semibold placeholder:text-slate-300"
                  placeholder="admin@tu.ac.th"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Secure Password
              </label>
              <div className="relative group">
                <MdLockOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#126A31] transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-14 text-slate-900 text-sm focus:bg-white focus:border-[#126A31] focus:ring-4 focus:ring-green-500/5 transition-all outline-none font-semibold placeholder:text-••••••••"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#126A31] transition-colors"
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#126A31] text-white rounded-[1.5rem] font-bold hover:bg-[#093218] active:scale-[0.98] transition-all shadow-xl shadow-green-900/10 disabled:bg-slate-300 disabled:shadow-none mt-2 relative overflow-hidden group"
            >
              <span className={`flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                Access Dashboard
              </span>
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* --- Footer --- */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            &copy; 2026 Thammasat University
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-400 text-[9px] font-black uppercase">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            System Online
          </div>
        </div>
      </div>
    </div>
  );
}