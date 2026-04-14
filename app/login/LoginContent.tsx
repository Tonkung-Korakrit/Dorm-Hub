// app/login/LoginContent.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react";

// loadings
import toast from 'react-hot-toast'
import { LoadingOverlay } from '@/components/Loading/LoadingOverlay'
import { StatusPopup } from '@/components/Loading/StatusPopup'

// icons
import { PiEyesFill } from "react-icons/pi";
import { RiEyeCloseLine } from "react-icons/ri";
import { FcGoogle } from "react-icons/fc";

const LoginContent = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popupStatus, setPopupStatus] = useState<{ type: "success" | "error"; message: string }>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const isLogout = searchParams.get("logout");

  useEffect(() => {
    if (isLogout === "true") {
      toast.success("คุณออกจากระบบสำเร็จแล้ว", {
        id: "logout-success",
        duration: 3000,
        style: {
          borderRadius: '10px',
          background: '#00FF00',
          color: '#fff',
        },
      });

      window.history.replaceState(null, "", "/login")
    }
  }, [isLogout])

  useEffect(() => {
    setMounted(true); // จะทำงานเมื่อถึงฝั่ง Client แล้วเท่านั้น
  }, []);

  // ถ้ายังไม่ Mount (ยังอยู่ที่ Server) ให้คืนค่าว่างหรือ Loader ไปก่อน
  if (!mounted) return null;

  const handleLoginByTU = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length !== 10) {
      toast.error('Please enter your 10-digit studentID'), {
        id: "studentID",
        duration: 1000,
        style: {
          borderRadius: '10px',
          background: '#990000',
          color: '#fff',
        },
      };
      return;
    }

    if (password.length == 0) {
      toast.error('Please enter your password'), {
        id: "password",
        duration: 1000,
        style: {
          borderRadius: '10px',
          background: '#990000',
          color: '#fff',
        },
      }
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
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
          // window.location.href = "/my-booking";
          // แต่ถ้าต้องการ SPA Navigate (เร็วกว่า)
          router.push("/my-booking");
          router.refresh();
        }, 700);
      } else {
        setPopupStatus({
          type: "error",
          message: "ชื่อผู้ใช้ หรือรหัสผ่านของท่านไม่ถูกต้อง กรุณาติดต่อ LINE ICT TU Helpdesk https://lin.ee/vBxlVav"
        });
      }
    } catch (error) {
      setPopupStatus({
        type: "error",
        message: "ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay message="Logging in...." />}

      {popupStatus && (
        <StatusPopup
          type={popupStatus.type}
          message={popupStatus.message}
          onClose={() => setPopupStatus(null)}
        />
      )}

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
            inputMode="numeric"
            className="w-[216px] sm:w-[244px] border-b border-black py-0.5 ml-4 text-[16px] focus:outline-none focus:border-[#91b838] transition-colors text-black bg-transparent"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
            }}
            minLength={10}
            maxLength={10}
            placeholder="68xxxxxxxx"
            required
            suppressHydrationWarning={true}
          />
        </div>

        {/* Password Input */}
        <div className="relative mt-2">
          <label className="text-[16px] font-normal text-black ml-2">Password</label>
          <div className="relative w-[244px]">
            <input
              type={showPassword ? "text" : "password"}
              className="w-[216px] sm:w-[244px] ml-4 border-b border-black py-0.5 text-[16px] focus:outline-none focus:border-[#91b838] transition-colors text-black bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••••'
              required
              suppressHydrationWarning={true}
            />

            {/* ปุ่มเปิด-ปิดตา */}
            <button
              type="button"
              className="absolute right-3 sm:-right-4 bottom-2 text-gray-500 hover:text-[#91b838] transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
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
      </form>

      <div className="absolute bottom-[10%] left-[calc(10%+12px)] right-[calc(10%-12px)] text-center">
        <p className="text-[14px] text-gray-500 mb-2 mr-10 font-light">
          or Sign in with another provider
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/my-booking", redirect: true })}
          className="inline-flex items-center justify-center p-1.5 mr-10 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm bg-white"
          suppressHydrationWarning={true}
        >
          <FcGoogle size={24} />
        </button>
      </div>
    </>
  )
}

export default LoginContent
