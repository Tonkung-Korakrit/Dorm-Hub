// /login/page.tsx
"use client";

import { useState, useEffect } from "react";
// import axios from "axios";
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { PiEyesFill } from "react-icons/pi";
import { RiEyeCloseLine } from "react-icons/ri";
import Image from "next/image";

// interface LoginResult {
//   error?: string;
//   ok?: boolean;
//   [key: string]: any;
// }

export default function ExternalLogin() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  // const [result, setResult] = useState<LoginResult | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const router = useRouter();

  const handleLoginByTU = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // const res = await axios.post("../api/auth/login", { username, password });
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        // router.push("/dashboard");
        // ใช้ window.location เพื่อให้ Middleware ทำงานใหม่แบบสดๆ
        window.location.href = "/my-booking";
      } else {
        // setResult({ error: res.data.error || "Login failed" });
        setErrorMessage("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        setShowPopup(true);
      }
    } catch (error: any) {
      // setResult({ error: error.response?.data || "Login failed" });
      const msg = error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง";
      setErrorMessage(msg);
      setShowPopup(true);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-transparent" />;
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] relative pt-[44px] sm:pt-[12px]">

      {/* 1. Container สำหรับรูปภาพและฟอร์ม */}
      <div className="relative w-full max-w-[400px] aspect-[6/10]">

        {/* 2. รูปภาพพื้นหลัง (image_2.png) */}
        <Image
          src="/images/login_card_pc.png"
          alt="Login Card Background"
          fill
          sizes="366px"
          className="object-contain z-0"
          priority
        />

        {/* 3. ตัวฟอร์ม วางซ้อนทับ (Absolute Positioning) */}
        {/* ต้องปรับค่า top, left, right, padding เพื่อให้ลงล็อกกับช่องว่างในรูป */}
        <form
          onSubmit={handleLoginByTU}
          className="absolute z-10 top-[37%] left-[10%] right-[10%] flex flex-col"
        >
          <div className="text-[14px] font-light text-gray-600">
            Sign in with credentails
          </div>

          {/* Student ID Input */}
          <div className="relative">
            <label className="text-[16px] font-normal text-black ml-2">Student ID</label>
            <br />
            <input
              type="text"
              className="w-[216px] sm:w-[244px] border-b border-black py-0.5 ml-4 text-[16px] focus:outline-none focus:border-[#91b838] transition-colors text-black bg-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="relative mt-2">
            <label className="text-[16px] font-normal text-black ml-2">Password</label>
            <br />
            <div className="relative w-[244px]">
              <input
                type={showPassword ? "text" : "password"}
                className="w-[216px] sm:w-[244px] ml-4 border-b border-black py-0.5 text-[16px] focus:outline-none focus:border-[#91b838] transition-colors text-black bg-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* ปุ่มเปิด-ปิดตา */}
              <button
                type="button"
                className="absolute right-3 sm:-right-4 bottom-2 text-gray-500 hover:text-[#91b838] transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <PiEyesFill size={20} /> : <RiEyeCloseLine size={20} />}
              </button>
            </div>
            <div className="text-right mr-14">
              {/* <button
                type="button"
                className="text-[10px] text-gray-400 hover:text-gray-600"
                onClick={() => alert('ขออภัย! ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา')}
              >
                Forgot Password?
              </button> */}
              <a
                href="https://accounts.tu.ac.th/Login.aspx"
                target="_blank" // เปิดใน Tab ใหม่
                rel="noopener noreferrer" // เพื่อความปลอดภัยเมื่อเปิดลิงก์ภายนอก
                className="text-[10px] text-gray-400 hover:text-gray-600 inline-block cursor-pointer"
              >
                Forgot Password?
              </a>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="flex justify-center pt-4 sm:pt-8 pr-9 ">
            <button
              type="submit"
              className="border border-[#459A3B] text-[#459A3B] bg-white px-8 py-1.5 rounded-lg font-semibold hover:bg-[#91b838] hover:text-white transition-all duration-300 shadow-md text-sm"
            >
              Sign in
            </button>
          </div>
        </form>

        {/* Social Login & Error - วางแยกออกมาด้านล่างฟอร์ม */}
        <div className="absolute z-10 bottom-[10%] left-0 right-0 text-center">
          <p className="text-[14px] text-gray-500 mb-2 mr-10 font-light">
            or Sign in with another provider
          </p>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/book", redirect: true })}
            className="inline-flex items-center justify-center p-1.5 mr-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm bg-white"
          >
            <FcGoogle size={24} />
          </button>

          {/* {result?.error && (
            <p className="mt-2 text-center text-xs text-red-500 bg-white/80 p-1 rounded">{result.error}</p>
          )} */}

          {showPopup && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 w-[90%] max-w-[320px] shadow-2xl text-center animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <RiEyeCloseLine size={32} className="text-red-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">เข้าสู่ระบบไม่สำเร็จ</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-full py-2.5 bg-[#91b838] text-white rounded-xl font-semibold hover:bg-[#7a9b2f] transition-colors shadow-md"
                >
                  ตกลง
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}