// /login/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { LoginSkeleton } from "./loading/components/login/LoginSkeleton";
import { LoadingOverlay } from "./loading/components/LoadingOverlay";
import { StatusPopup } from "./loading/components/StatusPopup";

import { FcGoogle } from "react-icons/fc";
import { PiEyesFill } from "react-icons/pi";
import { RiEyeCloseLine } from "react-icons/ri";
import Image from "next/image";
import toast from 'react-hot-toast';

function LoginContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [popupStatus, setPopupStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // const [isSessionExpired, setIsSessionExpired] = useState(false);
  // const searchParams = useSearchParams();
  // const reason = searchParams.get('reason');

  useEffect(() => {
    setIsMounted(true);

    // ตรวจสอบว่าโดนดีดกลับมาเพราะ Session หมดอายุหรือไม่
    // if (reason === 'expired') {
    //   setIsSessionExpired(true);

    //   // redirect: false เพื่อไม่ให้มันเด้งไปหน้าอื่นเองซ้ำซ้อน
    //   signOut({ redirect: false });

    //   // ลบ Query Parameter ออกเพื่อให้ URL คลีนและไม่แสดง Modal ซ้ำเมื่อ Refresh
    //   const newUrl = window.location.pathname;
    //   window.history.replaceState(null, '', newUrl);
    // }
  }, []);

  const handleLoginByTU = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        // setPopupStatus({ type: "success", message: "เข้าสู่ระบบสำเร็จ กำลังพาคุณไปหน้าถัดไป..." });
        toast.success('Welcome! Logging in....', {
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#459A3B',
            color: '#fff',
          },
        });

        setTimeout(() => {
          // ใช้ window.location เพื่อให้ Middleware ทำงานใหม่แบบสดๆ
          window.location.href = "/my-booking";
        }, 700);
      } else {
        setPopupStatus({ type: "error", message: "ชื่อผู้ใช้ หรือรหัสผ่านของท่านไม่ถูกต้อง กรุณาติดต่อ LINE ICT TU Helpdesk https://lin.ee/vBxlVav" });
      }
    } catch (error: any) {
      setPopupStatus({ type: "error", message: "ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return <LoginSkeleton />;
  }

  return (
    <>
      <div className="relative w-full max-w-[400px] aspect-[6/10]">
        <div className="absolute left-[8px] w-full h-full">
          <Image
            src="/images/login_card_pc.png"
            alt="Card Login"
            fill
            sizes="366px"
            priority
          />
        </div>

        {/* ตัวฟอร์ม วางซ้อนทับ (Absolute Positioning) */}
        <form
          onSubmit={handleLoginByTU}
          className="absolute z-10 top-[37%] left-[calc(10%+8px)] right-[calc(10%-8px)] flex flex-col"
        >
          <div className="text-[14px] font-light text-gray-600">
            Sign in with credentails
          </div>

          {/* Student ID Input */}
          <div className="relative">
            <label className="text-[16px] font-normal text-black ml-2">Student ID</label>
            <br />
            <input
              type="tel"
              className="w-[216px] sm:w-[244px] border-b border-black py-0.5 ml-4 text-[16px] focus:outline-none focus:border-[#91b838] transition-colors text-black bg-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
              }}
              minLength={10}
              maxLength={10}
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
              disabled={isLoading}
              className="border border-[#459A3B] text-[#459A3B] bg-white px-8 py-1.5 rounded-lg font-semibold hover:bg-[#91b838] hover:text-white transition-all duration-300 shadow-md text-sm"
            >
              Sign in
            </button>
          </div>

          {isLoading && <LoadingOverlay message="Logging in...." />}

          {popupStatus && (
            <StatusPopup
              type={popupStatus.type}
              message={popupStatus.message}
              onClose={() => setPopupStatus(null)}
            />
          )}

        </form>

        {/* Social Login & Error - วางแยกออกมาด้านล่างฟอร์ม */}
        <div className="absolute bottom-[10%] left-[calc(10%+12px)] right-[calc(10%-12px)] text-center">
          <p className="text-[14px] text-gray-500 mb-2 mr-10 font-light">
            or Sign in with another provider
          </p>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/my-booking", redirect: true })}
            className="inline-flex items-center justify-center p-1.5 mr-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm bg-white"
          >
            <FcGoogle size={24} />
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Main Page Component: ทำหน้าที่เป็น Shell และกำหนด Suspense Boundary
 * เพื่อแก้ปัญหา 'useSearchParams() should be wrapped in a suspense boundary'
 */
export default function ExternalLogin() {
  return (
    // <div className="flex items-center justify-center min-h-[80vh] relative pt-10 sm:pt-4">
    <div className="flex items-center justify-center min-h-[80vh] relative pt-[44px] sm:pt-[12px]">
      {/* สำคัญมาก: useSearchParams จะต้องอยู่ภายใต้ Suspense เสมอ เพื่อให้ Next.js สามารถ Build แบบ Static ได้โดยไม่ระเบิด */}
      <Suspense fallback={<LoginSkeleton />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}