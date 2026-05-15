// app/new-booking/components/Form.tsx
"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { Booking, Resident } from "@/utils/types";

// components
import Stepper from "@/components/Stepper";
import StepRenderer from "@/components/StepRenderer";
import RejectedAlert from "@/components/RejectedAlert";
import { useScrollTop } from "@/hooks/useScrollTop";

interface FormProps {
  resident: Resident;
  editId: number;
  initialBooking: Booking;
}

const Form = ({ resident, editId, initialBooking }: FormProps) => {
  const [step, setStep] = useState(1);
  const {
    setFormResident,
    setFormRoom,
    currentBooking,
    setCurrentBooking,
    // setVehicle,
  } = useBooking();

  // const searchParams = useSearchParams();
  // const editId = searchParams.get("edit");

  // useEffect(() => {
  //   if (resident) {
  //     setFormResident(resident);
  //     if (resident.vehicleInfo) {
  //       setVehicle(resident.vehicleInfo);
  //     }
  //   }
  // }, [resident, setFormResident, setVehicle]);

  // useEffect(() => {
  //   const fetchBooking = async () => {
  //     try {
  //       // กรณีที่ 1: เข้ามาเพื่อ "แก้ไข" (มาจากปุ่ม Edit & Resubmit)
  //       if (editId) {
  //         const res = await customFetch(`/api/bookings/${editId}`);
  //         if (res.ok) {
  //           const data = await res.json();
  //           setCurrentBooking(data);

  //           setFormResident(data.cus_users);
  //           setFormRoom(data.room);
  //         }
  //         return;
  //       }

  //       // ใช้ customFetch เพื่อให้จัดการ 401 (Expired)
  //       const res = await customFetch("/api/bookings/my-booking");

  //       if (res.ok) {
  //         const data = await res.json();
  //         setCurrentBooking(data);
  //       }
  //     } catch (err) {
  //       console.error("ไม่สามารถโหลดข้อมูลได้:", err);
  //     }
  //   };

  //   fetchBooking();
  // }, [editId]);

  useEffect(() => {
    // 1. เซตข้อมูล Resident พื้นฐาน
    if (resident) {
      setFormResident(resident);
      // if (resident.vehicleInfo) {
      // setVehicle(resident.vehicleInfo);
      // }
    }

    // 2. เซตข้อมูล Booking ที่โหลดมาจาก Server (ถ้ามี)
    if (initialBooking) {
      setCurrentBooking(initialBooking);

      // ถ้าเป็นเคสแก้ไข (editId) หรือมีข้อมูลห้องในระบบอยู่แล้ว
      if (initialBooking?.room) {
        setFormRoom(initialBooking?.room);
      }

      // ถ้าข้อมูลผู้พักใน Booking ต่างจาก Profile ปกติ (กรณีมีการแก้ไขข้อมูลในฟอร์มจอง)
      if (initialBooking?.cus_users) {
        setFormResident(initialBooking?.cus_users);
      }
    }

    // Dependencies: รันเมื่อข้อมูลจาก Server เปลี่ยน หรือฟังก์ชันของ Context พร้อม
  }, [
    resident,
    initialBooking,
    setFormResident,
    setFormRoom,
    setCurrentBooking,
    // setVehicle,
  ]);

  useScrollTop();

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
};

export default Form;
