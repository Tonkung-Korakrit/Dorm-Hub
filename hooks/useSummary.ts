// hooks/useSummary.ts
"use client"

import React, { ChangeEvent, useState } from 'react'
import { useBooking } from '@/app/contexts/BookingContext';
import { BookingStatus } from "@/utils/types";
import { useRouter } from 'next/navigation';
import { customFetch } from '@/utils/custom-api';

const useSummary = (setStep: (step: number) => void) => {
  const { formResident, formRoom, currentBooking, setCurrentBooking,
    ownerInfo, setIsEditMode, vehicle } = useBooking();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAcceptAgreement, setIsAccepstAgreement] = useState(false);
  const isResubmitting = currentBooking?.status === BookingStatus.PENDING_CORRECTION;
  const [bookingError, setBookingError] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
  } | null>(null);

  const router = useRouter();

  const handleEdit = (targetStep: number) => {
    setIsEditMode(true);
    setStep(targetStep);
  };

  const handleCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
    setIsAccepstAgreement(e.target.checked)
  }

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    try {
      const endpoint = isResubmitting ? "/api/bookings/update-rejected" : "/api/bookings";
      const method = isResubmitting ? "PUT" : "POST";

      const res = await customFetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: currentBooking?.id,
          user: formResident,
          room: formRoom,
          vehicle: vehicle,
          type: currentBooking.type,
          groupId: ownerInfo?.studentId,
        }),
      });

      const data = await res.json();

      console.log("Data summary (/api/bookings): ", data)

      if (!data.success) {
        // ดักจับ Error ที่มาจาก Error Throw ใน Transaction
        // เช่น "ห้องพักนี้เต็มแล้ว" หรือ "มีคนชิงจองตัดหน้าคุณไปแล้ว"
        setBookingError({
          isOpen: true,
          title: "Booking Failed / จองไม่สำเร็จ",
          message: data.error || "ขออภัย มีผู้ใช้ท่านอื่นจองห้องนี้ตัดหน้าคุณไปแล้วเล็กน้อย กรุณาเลือกห้องอื่นใหม่อีกครั้ง"
        });
        return;
      }

      // console.log("data in BookingSummary: ", data);

      // if (data.success) {
      //   // เพิ่มการยิงไปสร้าง Charge ที่ Omise ทันที
      //   await customFetch("/api/bookings/payment", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       bookingId: data.booking.id,
      //       amount: formRoom.price
      //       // amount: 20
      //     }),
      //   });

      // }

      setCurrentBooking((prev: any) => ({
        ...prev,
        id: data.booking.id,
        status: data.booking.status,
        type: data.booking.type,
        createdAt: data.booking.createdAt,
        cus_users: formResident,
        room: formRoom,
        payments: {
          amount: formRoom.price
        }
      }));

      // isResubmitting ? router.push("/my-booking") : setStep(8); // ไปหน้า Payment
        isResubmitting ? router.push("/my-booking") : router.push(`/payment/${data.booking.id}`); // ไปหน้า Payment

    } catch (err: any) {
      setBookingError({
        isOpen: true,
        title: "Connection Error / เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackStep = () => {
    setStep(isResubmitting ? 3 : ownerInfo?.studentId ? 4 : 6)
  }

  return {
    isSubmitting, isResubmitting, isAcceptAgreement, bookingError, setBookingError,
    handleEdit, handleCheckbox, handleFinalConfirm, handleBackStep
  }
}

export default useSummary
