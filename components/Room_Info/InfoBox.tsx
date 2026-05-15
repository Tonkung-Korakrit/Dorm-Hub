// components/Room_Info/InfoBox.tsx
"use client";

import React from 'react'

import { BookingType, GenderType } from "@/utils/types";
import { DORM_LABELS } from '@/utils/constants';
import { useBooking } from '@/app/contexts/BookingContext';

interface InfoBoxProps {
  gender: GenderType
  bookingType: BookingType
  campus: string
  dorm?: string
  lifestyle?: []
  lifestyleNote?: string
}

const InfoBox = (props: InfoBoxProps) => {
  const { gender, bookingType, campus, dorm, lifestyle, lifestyleNote } = props
  const { currentBooking } = useBooking()
  return (
    <div className="grid grid-cols-1 gap-x-12 text-[16px] text-gray-600 mt-2 px-2 py-2 bg-green-50 border border-green-300 rounded-xl animate-fadeIn">
      <div className="flex flex-col gap-1">
        <span className="font-bold text-black shrink-0">Gender / เพศ:</span>
        <span className="text-gray-700">
          {/* {formResident?.gender || "-"} */}
          {DORM_LABELS.GENDER[gender as keyof typeof DORM_LABELS.GENDER] || gender}
        </span>
      </div>

      <div className="flex flex-col gap-1 mt-1">
        <span className="font-bold text-black shrink-0">Resident Type / ประเภทของผู้พัก:</span>
        <span className="text-gray-700">
          {/* {currentBooking?.type || "-"} */}
          {DORM_LABELS.RESIDENT_TYPE[bookingType as keyof typeof DORM_LABELS.RESIDENT_TYPE] || bookingType}
        </span>
      </div>

      <div className="flex flex-col gap-1 mt-1">
        <span className="font-bold text-black shrink-0">Selected Campus / วิทยาเขต:</span>
        <span className="text-gray-700">
          {/* {formRoom?.campus || "-"} */}
          {DORM_LABELS.CAMPUS[campus as keyof typeof DORM_LABELS.CAMPUS] || campus}
        </span>
      </div>

      {dorm && (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-black">Selected Dorm / หอพักโซน:</span>
          <span className="text-gray-700">
            {dorm}
          </span>
        </div>
      )}

      {currentBooking?.type === "NOT_CHARTER" && (
        <div className="md:col-span-2 flex flex-col gap-1 mt-1 bg-gray-50/50 rounded-2xl">
          <div className="gap-2">
            {/* <div className="w-1.5 h-6 bg-[#006633] rounded-full"></div> เส้นแถบสีเขียวข้างหน้า */}
            <span className="font-bold text-gray-800 text-[16px]">Vibe Roommate / เพื่อนร่วมห้องที่เข้ากันได้ดี</span>
          </div>


          <div className="flex flex-wrap gap-2.5">
            {lifestyle?.length > 0 ? (
              lifestyle.map((id: string) => {
                // ดึงค่า Config จาก Constants
                const config = DORM_LABELS.LIFESTYLE[id as keyof typeof DORM_LABELS.LIFESTYLE];

                if (!config) return null;

                const Icon = config.icon;

                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-100 text-[#126A31] text-[10px] md:text-[14px] rounded-xl shadow-sm transition-all duration-200 group" //hover:border-[#126A31]/30
                  >
                    {/* แสดง Icon พร้อมสีที่เป็นเอกลักษณ์ opacity-80 group-hover:opacity-100*/}
                    <Icon size={16} className="text-[#126A31]" />

                    {/* แสดง Label ภาษาไทย/อังกฤษ ที่เป็นทางการ */}
                    <span className="font-bold">
                      {config.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-400 italic text-[13px] py-1 ml-3">
                ไม่ได้ระบุไลฟ์สไตล์เพิ่มเติม
              </div>
            )}
          </div>

          {lifestyleNote && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Note from Roommate / หมายเหตุเพิ่มเติม</p>
              <p className="text-[12px] text-gray-600 italic">
                "{lifestyleNote}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InfoBox
