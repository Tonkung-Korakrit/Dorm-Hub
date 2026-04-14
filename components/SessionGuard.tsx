// components/SessionGuard.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConfirmModal from "./Loading/ConfirmModal";
import { signOut } from "next-auth/react";

function SessionGuardContent() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleExpired = () => setIsOpen(true);
    window.addEventListener('session-expired', handleExpired);

    if (searchParams.get("reason") === "expired") {
      setIsOpen(true);
    }

    return () => window.removeEventListener('session-expired', handleExpired);
  }, [searchParams]);

  const handleConfirm = async () => {
    setIsOpen(false);

    // 1. ถ้ามี Next-auth ให้ใช้ signOut เพื่อล้างคุกกี้ฝั่ง Client ให้สะอาด
    // 2. redirect: true จะทำการโหลดหน้าใหม่ไปยัง callbackUrl ให้เอง
    await signOut({ callbackUrl: '/', redirect: true });
    
    // หรือถ้าไม่ได้ใช้ Next-auth ให้ใช้แบบเดิมที่คุณเขียนไว้ (ดีที่สุดสำหรับการล้างทุกอย่าง)
    // window.location.href = "/"; 
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onConfirm={handleConfirm}
      title="Session Expired / เซสชันหมดอายุ"
      message={`Your login session has expired. Please sign in again to continue.\nเซสชันการเข้าสู่ระบบของคุณหมดอายุแล้ว โปรดเข้าสู่ระบบอีกครั้งเพื่อดำเนินการต่อ`}
      confirmText="ตกลง (Login Again)"
      type="warning"
      isLoading={false}
      showCancel={false}
    />
  );
}

export default function SessionGuard() {
  return (
    <Suspense fallback={null}>
      <SessionGuardContent />
    </Suspense>
  );
}