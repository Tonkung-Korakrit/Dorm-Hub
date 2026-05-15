// hooks/useBookingActions.ts
"use client";

import { useState, startTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cancelBookingAction } from "@/action/booking-actions";
import { BookingStatus } from "@/utils/types";

interface useBookingActionsProps {
  bookingId?: number;
  currentStatus?: BookingStatus;
}

export const useBookingActions = ({
  bookingId,
  currentStatus,
}: useBookingActionsProps) => {
  const router = useRouter();
  const [isLogout, setIsLogout] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false });

  // state = ผลลัพธ์ที่ return จาก action (success/message)
  // formAction(คำสั่งยิง) = ฟังก์ชันที่จะไปแปะที่ <form action={...}>
  // isPending(สถานะโหลด) = ตัวพระเอก! จะเป็น true อัตโนมัติเมื่อกด Submit และเป็น false เมื่อเสร็จ
  const [state, cancelAction, isPending] = useActionState(
    cancelBookingAction,
    null,
  );

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const handleLogout = () => {
    setModalConfig({
      isOpen: true,
      type: "danger",
      title: "Sign Out / ออกจากระบบ",
      message:
        "Do you want to sign out now?\n" +
        "คุณต้องการออกจากระบบตอนนี้หรือไม่?",
      confirmText: "Sign Out / ออกจากระบบ",
      action: async () => {
        closeModal();
        setIsLogout(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          await signOut({ redirect: false });
          router.push("/?logout=true");
        } catch (e) {
          setIsLogout(false);
        }
      },
    });
  };

  const openCancelModal = () => {
    const isPaid = currentStatus === BookingStatus.VERIFYING;
    setModalConfig({
      isOpen: true,
      type: "warning",
      title: "Confirm Cancellation",
      message: isPaid
        ? "Important: Deposit is Non-Refundable\n" +
          "As you have already paid the deposit, please be aware that it will not be refunded upon cancellation.\n" +
          "หมายเหตุสำคัญ: ไม่คืนเงินมัดจำ\n" +
          "เนื่องจากคุณชำระเงินมัดจำแล้ว การยกเลิกจะทำให้ไม่ได้รับเงินคืนตามระเบียบของหอพัก"
        : "Are you sure you want to cancel this booking?\n" +
          "This room will be returned to the system for others to book.\n\n" +
          "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้? ห้องพักจะถูกคืนเข้าสู่ระบบเพื่อให้ผู้ใช้อื่นจองต่อ",
      confirmText: "Confirm Cancellation / ยืนยันการยกเลิก",
      // cancelText: "Keep Booking / รักษาการจอง",

      action: () => {
        const formData = new FormData();
        formData.append("bookingId", String(bookingId));
        formData.append("isExpired", "false");

        // ยิงคำสั่ง Action ทันที!
        startTransition(() => {
          cancelAction(formData);
        });

        closeModal();
      },
    });
  };

  return {
    modalConfig,
    isLogout,
    state,
    isCancelling: isPending,
    handleLogout,
    openCancelModal,
    closeModal,
  };
};
