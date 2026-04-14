// payment/components/PaymentStatusChecker
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingStatus } from "@/utils/types";

// icons
import { LuAlarmClock } from "react-icons/lu";

interface PaymentStatusCheckerProps {
  bookingId: number,
  initialSeconds: number
}

export default function PaymentStatusChecker({ bookingId, initialSeconds }: PaymentStatusCheckerProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isProcessing, setIsProcessing] = useState(false);

  const processingRef = useRef(false);

  const stopEverything = useCallback(() => {
    setIsProcessing(true);
    processingRef.current = true;
  }, []);

  // 1. ฟังก์ชันเช็คสถานะ
  const checkStatus = useCallback(async () => {
    // if (isProcessing) return false;
    if (processingRef.current) return true;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`);
      if (!res.ok) return false;
      const data = await res.json();

      if (data.bookingStatus === BookingStatus.VERIFYING) {
        // setIsProcessing(true);
        stopEverything();
        router.replace(`/payment/success?id=${bookingId}`);
        return true;
      }
      if (data.bookingStatus === BookingStatus.EXPIRED) {
        // setIsProcessing(true);
        stopEverything();
        router.replace(`/payment/fail?id=${bookingId}`);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, [bookingId, router, stopEverything]);

  // 2. ฟังก์ชันจัดการเมื่อเวลาหมด
  const handleExpire = useCallback(async () => {
    // if (isProcessing) return;
    if (processingRef.current) return;
    
    stopEverything();

    // เช็คสถานะ "นาทีสุดท้าย" เผื่อ Webhook เพิ่งทำงานเสร็จ
    // const isPaid = await checkStatus();
    // if (isPaid) return;

    // setIsProcessing(true);
    try {
      await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, isExpired: true })
      });
      router.replace(`/new-booking/fail?reason=timeout&id=${bookingId}`);
    } catch (err) {
      router.replace(`/new-booking/fail?reason=timeout&id=${bookingId}`);
    }
  }, [bookingId, router, stopEverything]);

  useEffect(() => {
    const endTime = Date.now() + initialSeconds * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Watcher สำหรับเวลาหมด
  useEffect(() => {
    if (timeLeft === 0) handleExpire();
  }, [timeLeft, handleExpire]);

  // Polling Effect (แยกอิสระ รันทุก 5 วินาที)
  // useEffect(() => {
  //   const poll = setInterval(checkStatus, 5000);
  //   return () => clearInterval(poll);
  // }, [checkStatus]);

  // Polling Effect (ปลอดภัยกว่า setInterval)
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const poll = async () => {
      // ถ้ากำลังเปลี่ยนหน้า หรือสำเร็จไปแล้ว ไม่ต้องยิง
      if (isProcessing) return;

      await checkStatus();

      // หลังจากเช็คเสร็จ (ไม่ว่าจะ OK หรือ Error) 
      // ค่อยตั้งเวลาอีก 5 วินาทีเพื่อยิงรอบถัดไป
      timerId = setTimeout(poll, 5000);
    };

    poll(); // เริ่มยิงครั้งแรก

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [checkStatus, isProcessing]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="mt-2 p-4">
      <div className={`font-bold text-sm mb-2 flex items-center justify-center gap-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-orange-500'
        }`}>
        <LuAlarmClock className="text-lg text-green-700"/>
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