// hooks/useCampus.ts
"use client"

import React, { Dispatch, SetStateAction, useState } from 'react'

// contexts
import { useBooking } from '@/app/contexts/BookingContext';

import { BookingType, Resident } from "@/utils/types";
import { customFetch } from '@/utils/custom-api';

import toast from "react-hot-toast";

const useCampus = (setStep: Dispatch<SetStateAction<number>>) => {
  const { formResident, setFormResident, setFormRoom,
    setCurrentBooking, setOwnerInfo } = useBooking();

  const [ownerStudentId, setOwnerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [noteError, setNoteError] = useState("");
  // const [showStatus, setShowStatus] = useState<{ type: "success" | "error"; title?: string; message: string } | null>(null);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as BookingType;

    setCurrentBooking((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        type: selectedType
      };
    });
  };

  const handleSelectRegion = (selectedCampus: string) => {
    setFormRoom((prev: any) => ({ ...prev, campus: selectedCampus }));
    setStep(5);
  };

  const handleLifestyle = (id: string) => {
    if (!setFormResident || !formResident) return;

    const currentLifestyle = formResident.lifestyle || [];
    const isSelected = currentLifestyle.includes(id);

    if (!isSelected && currentLifestyle.length >= 10) {
      toast.error("เลือกได้สูงสุด 10 อย่างครับ เพื่อการจับคู่ที่แม่นยำที่สุด", { id: "limit" });
      return;
    }

    setFormResident((prev: Resident) => {
      const nextLifestyle = isSelected
        ? (prev.lifestyle || []).filter((item: string) => item !== id)
        : [...(prev.lifestyle || []), id];

      return {
        ...prev,
        lifestyle: nextLifestyle,
      };
    });
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const validation = validateLifestyleNote(value);

    setNoteError(validation.message);
    setFormResident({ ...formResident, lifestyleNote: value });
  };

  const BAD_WORDS_TH = [
    "กู", "มึง", "ควย", "หี", "เย็ด", "สัส", "เหี้ย", "ดอกทอง", "ชิบหาย"
  ];

  const validateLifestyleNote = (text: string): { isValid: boolean; message: string } => {
    const hasBadWord = BAD_WORDS_TH.some(word => text.includes(word));

    if (hasBadWord) {
      return { isValid: false, message: "⚠️ ขอความร่วมมือใช้ถ้อยคำที่สุภาพเพื่อสังคมที่น่าอยู่ครับ" };
    }

    return { isValid: true, message: "" };
  };

  const handleVerifyOwner = async () => {
    if (!ownerStudentId) {
      toast.error('กรุณากรอกรหัสนักศึกษาของผู้เหมาห้องด้วยครับ', {
        position: 'top-center',
        duration: 2000,
        id: 'incomplete-studentId',
      });
      return;
    }

    setIsLoading(true);
    setOwnerInfo(null);
    // setShowStatus(null);
    try {
      const res = await customFetch(`/api/bookings/check-owner?studentId=${ownerStudentId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setOwnerInfo((prev: any) => ({
          ...prev,
          studentId: data.booking.cus_users.studentId,
          name: data.booking.cus_users.name_th,
          dorm: data.booking.room.dorm.name,
          roomId: data.booking.room.roomId,
        }));

        setFormRoom((prev: any) => ({
          ...prev,
          id: data.booking.room.id,
          campus: data.booking.room.dorm.campus.name,
          dorm: data.booking.room.dorm.name,
          floor: data.booking.room.floor,
          roomId: data.booking.room.roomId,
          price: data.booking.room.price,
          roomType: data.booking.room.roomType,
        }));

        toast.success("พบข้อมูลเจ้าของห้องแล้ว", {
          position: 'top-center',
          duration: 2000,
          id: "verify-success",
        });
      } else {
        toast.error("ไม่พบข้อมูลการจองแบบเหมาห้อง (Charter) ของรหัสนักศึกษานี้ในระบบ", {
          position: 'top-center',
          duration: 2000,
          id: "verify-failed"
        });
        setOwnerInfo(null);

        // setShowStatus({
        //   type: "error",
        //   title: "ไม่พบข้อมูลการจอง",
        //   message: data.message || "ไม่พบข้อมูลการจองแบบเหมาห้อง (Charter) ของรหัสนักศึกษานี้ในระบบ",
        // });
      }
    } catch (error) {
      console.error("Verify Error:", error);
      toast.error("เกิดข้อผิดพลาด ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง", {
        position: 'top-center',
        duration: 2000,
        id: "server-error"
      });
      setIsLoading(false);

      // setShowStatus({
      //   type: "error",
      //   title: "เกิดข้อผิดพลาด",
      //   message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
      // });
    } finally {
      setIsLoading(false);
    }
  };

  // const handleContinue = () => {
  //   // 1. ถ้าอยู่ในโหมดแก้ไข (มาจากหน้า Summary)
  //   if (isEditMode) {
  //     // ปิดโหมดแก้ไขและส่งกลับหน้าสรุปทันที
  //     setIsEditMode(false);
  //     setStep(7); // เลข Step ของหน้า Summary
  //     toast.success("อัปเดตไลฟ์สไตล์เรียบร้อย");
  //   } else {
  //     // 2. ถ้าเป็น Flow ปกติ (กำลังจองครั้งแรก)
  //     // ตรวจสอบเงื่อนไขตามปกติ แล้วไปหน้าเลือกห้อง (Step 5)
  //     setStep(5);
  //   }
  // };

  return {
    errors, setErrors, ownerStudentId, setOwnerId, isLoading,
    noteError, handleTypeChange, handleVerifyOwner, handleSelectRegion,
    handleLifestyle, handleNoteChange, validateLifestyleNote
  }
}

export default useCampus
