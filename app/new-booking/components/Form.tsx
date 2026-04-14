// app/new-booking/components/Form.tsx
"use client";

import { useState, useEffect, ChangeEvent, SetStateAction, useRef } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { useSearchParams } from "next/navigation";

import { customFetch } from "@/utils/custom-api";
import { Resident } from "@/utils/types";

// components
import Stepper from "@/components/Stepper";
import StepRenderer from "@/components/StepRenderer";
import RejectedAlert from "@/components/RejectedAlert";
import { useScrollTop } from "@/hooks/useScrollTop";
// import { FormBookSkeleton } from "@/components/Loading/book/FormBookSkeleton";

interface FormProps {
  resident: Resident;
}

const Form = ({ resident }: FormProps) => {
  const [step, setStep] = useState(1);
  const { setFormResident, setFormRoom, setCurrentBooking } = useBooking();
  // const router = useRouter();
  // const [isMounted, setIsMounted] = useState(false);

  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (resident) setFormResident(resident);
  }, [resident]);

  useScrollTop();

  // useEffect(() => {
  //   // ให้มั่นใจว่า Component พร้อมทำงานบน Client
  //   setIsMounted(true);
  //   if (user) setFormResident(user);
  // }, [user, setFormResident]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // กรณีที่ 1: เข้ามาเพื่อ "แก้ไข" (มาจากปุ่ม Edit & Resubmit)
        if (editId) {
          const res = await customFetch(`/api/bookings/${editId}`);
          if (res.ok) {
            const data = await res.json();
            setCurrentBooking(data);

            // Map ข้อมูลเดิมเข้าสู่ Context
            setFormResident(data.cus_users);
            setFormRoom(data.room);
          }
          return;
        }

        // ใช้ customFetch เพื่อให้จัดการ 401 (Expired)
        const res = await customFetch("/api/bookings/my-booking");

        if (res.ok) {
          const data = await res.json();
          setCurrentBooking(data);
        }
      } catch (err) {
        console.error("ไม่สามารถโหลดข้อมูลได้:", err);
      }
    };

    // เรียกใช้งานครั้งเดียวตอน Mount
    // if (isMounted) 
    fetchBooking();
  }, [editId]);

  // แสดง Skeleton ขณะกำลัง Load
  // if (!isMounted || !user) {
  //   return <FormBookSkeleton />;
  // }

  return (
    <div className="w-full min-h-screen flex flex-col bg-transparent">

      {/* ส่วนแจ้งเตือนกรณี REJECTED */}
      <RejectedAlert editId={editId} step={step} />

      {/* ส่วนเส้นแสดงความคืบหน้า */}
      <Stepper step={step} setStep={setStep} editId={editId} />

      {/* ส่วนเนื้อหาฟอร์ม (Content Section) */}
      <div className="flex-1 flex justify-center">
          <div className="pl-1">
            <StepRenderer step={step} setStep={setStep} />
          </div>
      </div>
    </div>
  );
}

export default Form