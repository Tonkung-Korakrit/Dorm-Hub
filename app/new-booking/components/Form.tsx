// /new-booking/BookRoomForm.tsx
"use client";

import { useState, useEffect, ChangeEvent, SetStateAction, useRef } from "react";
// import { useRouter } from "next/navigation";
import { useBooking } from "@/app/contexts/BookingContext";
import { StudentInfoForm } from "./StudentInfoForm";
import { CampusSelector } from "./CampusSelector";
// import { BookingSummary } from "./BookingSummary";
import { HiIdentification } from "react-icons/hi";
import { FaUser, FaCar } from "react-icons/fa";
import { RiHomeSmileFill } from "react-icons/ri";
import { HiDocumentMagnifyingGlass } from "react-icons/hi2";

import { VehicleStep } from "./Vehicle";
import { ProfileStep } from "./Profile";
import { DormSelector } from "./DormSelector";
import { RoomGridSelection } from "./RoomGridSelection";

import { BookRoomFormProps, BookingStatus } from "@/types/booking";
import { BookingSummary } from "./BookingSummary";
import { PaymentPage } from "./Payment";
import { FormBookSkeleton } from "@/app/loading/components/ิbook/FormBookSkeleton";
import { customFetch } from "@/lib/api";
import router from "next/router";

export default function BookRoomForm({ user }: BookRoomFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState<number>(1);
  const { formResident, setFormResident, formRoom, setFormRoom, currentBooking, setCurrentBooking } = useBooking();
  const scrollRef = useRef<HTMLDivElement>(null);
  // const router = useRouter();

  useEffect(() => {
    if (user) setFormResident(user);
  }, [user, setFormResident]);

  useEffect(() => {
    if (scrollRef.current) {
      // สั่งให้เลื่อนขึ้นบนสุดของ div นี้ทุกครั้งที่ step เปลี่ยน
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  useEffect(() => {
    // ให้มั่นใจว่า Component พร้อมทำงานบน Client
    setIsMounted(true);
    if (user) setFormResident(user);
  }, [user, setFormResident]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // ใช้ customFetch ที่เราทำไว้เพื่อให้จัดการ 401 (Expired) ให้ในตัว
        const res = await customFetch("/api/bookings/my-booking");

        if (res.ok) {
          const data = await res.json();
          setCurrentBooking(data);

          // ถ้าเช็คแล้วว่ามีการจองค้างอยู่ (PENDING) ให้ดีดไปหน้า 8 ทันที
          if (data?.status === "PENDING") {
            setStep(8);
          }
        }
      } catch (err) {
        console.error("ไม่สามารถโหลดข้อมูลได้:", err);
      }
    };

    // เรียกใช้งานครั้งเดียวตอน Mount
    fetchBooking();
  }, []); // [] คือทำงานครั้งเดียวตอนโหลดหน้าเว็บ

  // แสดง Skeleton ขณะกำลัง Load
  if (!isMounted || !user) {
    return <FormBookSkeleton />;
  }

  return (
    <div className="w-full h-screen flex flex-col bg-transparent overflow-hidden">

      {/* 1. ส่วน STEPPER BAR - โปร่งใส และเส้นชิดซ้ายสุด */}
      <div className="flex-none w-full relative pt-12 pb-2">

        {/* --- เส้นพื้นหลัง (Background Line) --- */}
        <div className="absolute left-0 top-[64px] sm:top-[72px] w-[87.5%] sm:w-[75%] h-[6px] sm:h-[12px] bg-[#8ACCA1] z-0" />

        {/* --- เส้นความคืบหน้า (Active Progress Line) --- */}
        {/* <div
          className="absolute left-0 top-[64px] sm:top-[72px] h-[6px] sm:h-[12px] bg-[#006432] z-0 transition-all duration-700 ease-in-out"
          style={{ width: step === 1 ? '15%' : step === 2 ? '40%' : step === 3 ? '65%' : '90%' }}
        /> */}
        <div
          className={`absolute left-0 top-[64px] sm:top-[72px] h-[6px] sm:h-[12px] bg-[#006432] z-0 transition-all duration-700 ease-in-out 
            ${step === 1 ? 'w-[15%] sm:w-[25%]' : ''}
            ${step === 2 ? 'w-[30%] sm:w-[37.5%]' : ''}
            ${step === 3 ? 'w-[50%] sm:w-[50%]' : ''}
            ${step === 4 ? 'w-[70%] sm:w-[62.5%]' : ''}
            ${step === 5 ? 'w-[70%] sm:w-[62.5%]' : ''}
            ${step === 6 ? 'w-[70%] sm:w-[62.5%]' : ''}
            ${step === 7 ? 'w-[90%] sm:w-[75%]' : ''}
            ${step === 8 ? 'w-[90%] sm:w-[75%]' : ''}
          `}
        />

        {/* 2. Container สำหรับไอคอน - ลบ <Line /> ออกทั้งหมดเพื่อแก้ปัญหา "ขีดประหลาด" */}
        <div className="max-w-4xl mx-auto flex justify-between items-start relative z-10 px-6 md:px-10">
          <StepIcon
            icon={<FaUser size={20} />}
            label="Student"
            active={step >= 1}
            current={step === 1}
            onClick={() => setStep(1)}
          />
          <StepIcon
            icon={<HiIdentification size={26} />}
            label="Profile"
            active={step >= 2}
            current={step === 2}
            onClick={() => setStep(2)}
          />
          <StepIcon
            icon={<FaCar size={24} />}
            label="Vehicle"
            active={step >= 3}
            current={step === 3}
            onClick={() => setStep(3)}
          />
          <StepIcon
            icon={<RiHomeSmileFill size={24} />}
            label="Room"
            active={step >= 4}
            current={step >= 4 && step <= 6}
            onClick={() => setStep(4)}
          />
          <StepIcon
            icon={<HiDocumentMagnifyingGlass size={24} />}
            label="Summary"
            active={step >= 7} // กรณีจบขั้นตอนสุดท้าย
            current={step === 7}
          />
        </div>
      </div>

      {/* 3. ส่วนเนื้อหาฟอร์ม (Content Section) */}
      <div className="flex-1 flex justify-center overflow-hidden">
        <div
          ref={scrollRef} // เชื่อมต่อ ref ตรงนี้
          className="w-full max-w-4xl overflow-y-auto md:px-8 custom-scrollbar"
        >
          <div className="w-full max-w-4xl overflow-y-auto pl-1 pr-0 pb-1 md:px-8 custom-scrollbar">
            {step === 1 && <StudentInfoForm setStep={setStep} />}
            {step === 2 && <ProfileStep setStep={setStep} />}
            {step === 3 && <VehicleStep setStep={setStep} />}
            {step === 4 && <CampusSelector setStep={setStep} />}
            {step === 5 && <DormSelector setStep={setStep} />}
            {step === 6 && <RoomGridSelection setStep={setStep} />}
            {step === 7 && <BookingSummary setStep={setStep} isSubmitting={false} />}
            {step === 8 && <PaymentPage />}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper StepIcon ปรับแต่งให้มี Double Ring ตามภาพ image_8944f7.png ---

function StepIcon({ icon, label, active, current, onClick }: { icon: any, label: string, active?: boolean, current?: boolean, onClick?: () => void }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300
        ${active ? "cursor-pointer hover:scale-105" : "cursor-default"} 
      `}
      onClick={active ? onClick : undefined} // 2. ให้กดได้เฉพาะ Step ที่ active แล้ว (หรือจะให้กดได้หมดก็ได้)
    >
      {/* วงกลมไอคอน */}
      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative
        ${active ? "bg-[#006432] text-white shadow-md" : "bg-[#8ACCA1] text-white"}
        ${current ? "ring-4 ring-white/30" : ""} 
      `}>
        {icon}
      </div>

      {/* ตัวหนังสือด้านล่าง */}
      <span className={`text-[12px] md:text-[14px] font-bold tracking-tight text-white
        ${active ? "opacity-100" : "opacity-60"}`}>
        {label}
      </span>
    </div>
  );
}