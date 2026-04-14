// components/Room_Info/Campus.tsx
"use client";

import { useBooking } from '@/app/contexts/BookingContext';
import { DORM_LABELS } from '@/utils/constants';
import React from 'react'

interface CampusProps {
  handleSelectRegion: (region: string) => void;
}

const Campus = ({ handleSelectRegion }: CampusProps) => {
  const REGIONS = ["rangsit", "thaprachan", "lampang", "pattaya"];
  const { formRoom } = useBooking();

  return (
    <div className="mt-2">
      <hr className="my-2 border-gray-300" />
      {/* Campus Selection */}
      <h2 className="text-[16px] font-medium text-gray-700 mb-4">Desired campus / เลือกวิทยาเขต <span className="text-red-500">*</span></h2>
      <div className="flex flex-col gap-10 max-w-2xl">
        {REGIONS.map((region) => (
          <div key={region} onClick={() => handleSelectRegion(region)} className="cursor-pointer">
            <div className={`relative bg-white p-3 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${formRoom.campus === region ? "ring-2 ring-[#006633]" : ""}`}>
              <div className="overflow-hidden rounded-[12px] aspect-[16/10]">
                <img src={`/images/dorms/${region}.png`} alt={region} className="w-full h-full object-cover" />
              </div>
              <p className={`mt-2 pl-2 text-[16px] ${formRoom.campus === region ? "text-[#006633] font-extrabold" : "text-black font-medium"}`}>{DORM_LABELS.CAMPUS[region as keyof typeof DORM_LABELS.CAMPUS] || region}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Campus
