// components/Room_Info/TypeCoResident.tsx
"use client";

import React, { Dispatch, SetStateAction } from 'react'
import { useBooking } from '@/app/contexts/BookingContext';
import ButtonRoom from './ButtonRoom';
import { MdPersonSearch } from 'react-icons/md';

interface TypeCoResidentProps {
  errors: string[];
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
  ownerStudentId: string;
  setOwnerId: (id: string) => void;
  handleVerifyOwner: () => void;
  setStep: Dispatch<SetStateAction<number>>;
}

const TypeCoResident = (props: TypeCoResidentProps) => {
  const { errors, setErrors, ownerStudentId,
    setOwnerId, handleVerifyOwner, setStep } = props;
  const { ownerInfo } = useBooking();

  const handleBackStep = () => {
    setStep(3)
  }

  const handleNextSummary = () => {
    setStep(7)
  }

  return (
    <>
      <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
        <h5 className="text-[16px] font-bold text-emerald-800 mb-3 flex items-center gap-2">
          <MdPersonSearch size={20} />
          Search for Room Owner / ค้นหาเจ้าของห้องหลัก
        </h5>
        <div className="space-y-3">
          <label className="block text-[12px] text-emerald-700 mb-1 ml-1">Owner Student ID / รหัสนักศึกษาเจ้าของห้อง</label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-4 py-2.5 bg-white border border-emerald-300 rounded-xl outline-none text-black text-sm"
              placeholder="เช่น 6601xxxx"
              type="text"
              name="ownerStudentId"
              value={ownerStudentId}
              onChange={(e) => setOwnerId(e.target.value)}
              minLength={10}
              maxLength={10}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
              }}
              onBlur={(e) => {
                const value = e.target.value;
                let isInvalid = false;
                if (value && value.length !== 10) isInvalid = true;
                if (isInvalid) {
                  if (!errors.includes("studentId")) {
                    setErrors([...errors, "studentId"]);
                  }
                }
                else {
                  setErrors(errors.filter((item) => item !== "studentId"));
                }
              }}
              suppressHydrationWarning
            />
            <button onClick={handleVerifyOwner} className="px-2 py-2.5 bg-[#006633] text-white rounded-xl font-bold text-[12px]">Check</button>
          </div>
          {errors.includes("studentId") && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              * กรุณากรอกเลขทะเบียนนักศึกษาของผู้เหมาห้องให้ถูกต้อง (10 หลัก)
            </p>
          )}
          {ownerInfo && (
            <div className="bg-white/60 p-3 rounded-lg border border-emerald-100 text-[12px] text-emerald-900">
              <p>✅ <b>พบข้อมูล: </b>เจ้าของ {ownerInfo.name || ""}</p>
              <p>หอพักโซน {ownerInfo.dorm || ""} - ห้อง {ownerInfo.roomId || ""}</p>
            </div>
          )}
        </div>
      </div>
      <ButtonRoom handleBackStep={handleBackStep} handleNextSummary={handleNextSummary} />
    </>
  )
}

export default TypeCoResident
