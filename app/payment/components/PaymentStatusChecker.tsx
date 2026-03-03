'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingStatus } from "@/types/booking";

// เพิ่ม Prop initialSeconds เพื่อรับเวลาที่เหลือจริงจาก Server
export default function PaymentStatusChecker({
  bookingId,
  initialSeconds
}: {
  bookingId: number,
  initialSeconds: number
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. ฟังก์ชันเช็คสถานะ (แยกออกมาให้เรียกซ้ำได้)
  const checkStatus = useCallback(async () => {
    if (isProcessing) return false;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`);
      if (!res.ok) return false;
      const data = await res.json();

      if (data.bookingStatus === BookingStatus.VERIFYING) {
        setIsProcessing(true);
        router.push(`/new-booking/success?id=${bookingId}`);
        return true;
      }
      if (data.bookingStatus === BookingStatus.EXPIRED) {
        setIsProcessing(true);
        router.push(`/new-booking/fail?id=${bookingId}`);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, [bookingId, isProcessing, router]);

  // 2. ฟังก์ชันจัดการเมื่อเวลาหมด (Double Check ก่อน Cancel)
  const handleExpire = useCallback(async () => {
    if (isProcessing) return;

    // 🚀 เช็คสถานะ "นาทีสุดท้าย" เผื่อ Webhook เพิ่งทำงานเสร็จ
    const isPaid = await checkStatus();
    if (isPaid) return;

    setIsProcessing(true);
    try {
      await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, isExpired: true })
      });
      router.push(`/new-booking/fail?reason=timeout&id=${bookingId}`);
    } catch (err) {
      router.push(`/new-booking/fail?reason=timeout&id=${bookingId}`);
    }
  }, [bookingId, checkStatus, isProcessing, router]);

  // 3. Timer Effect (ลดเวลาอย่างเดียว ไม่ต้องรีเซ็ต Polling)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); // รันครั้งเดียวเมื่อ Mount

  // 4. Watcher สำหรับเวลาหมด
  useEffect(() => {
    if (timeLeft === 0) handleExpire();
  }, [timeLeft, handleExpire]);

  // 5. Polling Effect (แยกอิสระ รันทุก 4 วินาที)
  useEffect(() => {
    const poll = setInterval(checkStatus, 4000);
    return () => clearInterval(poll);
  }, [checkStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="mt-4 p-4">
      <div className={`font-bold text-sm mb-2 flex items-center justify-center gap-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-orange-500'
        }`}>
        <span className="text-lg">⏱️</span>
        {timeLeft > 0
          ? `กรุณาชำระเงินภายใน ${formatTime(timeLeft)} นาที`
          : 'หมดเวลาชำระเงิน'}
      </div>

      <div className="flex items-center justify-center gap-2 text-blue-500 text-sm font-medium">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
        {isProcessing ? 'กำลังยืนยันข้อมูล...' : 'ระบบกำลังรอรับการชำระเงิน...'}
      </div>
    </div>
  );
}