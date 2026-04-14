// hooks/useDorms.ts
"use client"

import React, { Dispatch, SetStateAction, useState } from 'react'
import { useBooking } from '@/app/contexts/BookingContext';
import { customFetch } from '@/utils/custom-api';
import { Dorm, GenderType } from '@/utils/types';
import useSWR from 'swr';

const useDorms = (setStep: Dispatch<SetStateAction<number>>) => {
  const { formResident, formRoom, setFormRoom } = useBooking();

  const dormImages: Record<string, string> = {
    B: "/images/zones/B.png",
    C: "/images/zones/C.png",
    F: "/images/zones/F.png",
    M: "/images/zones/M.png",
  };

  // SWR = Stale-While-Revalidate
  const { data: dorms, error, isLoading } = useSWR(
    formRoom.campus ? `/api/dorms?campus=${formRoom.campus}` : null,
    (url) => customFetch(url).then(res => res.json())
  );

  const filteredDorms = dorms?.filter((dorm) => {
    const userGender = formResident.gender;
    const userPrefix = formResident.titleName;  // "นาย", "นางสาว", "นาง"
    const zoneGender = dorm.genderType;         // "MALE", "FEMALE", "LGBTQ"

    // กรณีโซนสำหรับผู้ชาย (MALE) -> อนุญาตเฉพาะคำนำหน้า "นาย"
    if ((userGender === GenderType.MALE || userGender === GenderType.LGBTQ) && userPrefix === "Mr.") {
      return zoneGender === "MALE";
    }

    // กรณีโซนสำหรับผู้หญิง (FEMALE) -> อนุญาตเฉพาะ "นางสาว" หรือ "นาง"
    if ((userGender === GenderType.FEMALE || userGender === GenderType.LGBTQ) && (userPrefix === "Mrs." || userPrefix === "Ms.")) {
      return zoneGender === "FEMALE";
    }
  });

  const handleSelectDorm = (selectedDorm: Dorm) => {
    setFormRoom((prev: any) => ({
      ...prev, // รักษาค่าอื่นๆ ใน formRoom (เช่น campus)
      dorm: {
        ...selectedDorm,
      }
    }));
    setStep(6); // ไปหน้าแผนผังห้อง
  };

  return { filteredDorms, dormImages, error, isLoading, handleSelectDorm }
}

export default useDorms
