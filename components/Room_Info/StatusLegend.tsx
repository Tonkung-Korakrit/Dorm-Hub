// components/Room_Info/StatusRoom.tsx
"use client";

import React from 'react'
import { MdInfo, MdLock } from 'react-icons/md'
import { RiHomeSmileFill } from 'react-icons/ri'
import { SiGoogleclassroom } from 'react-icons/si'

const StatusLegend = () => {
  return (
    <div>
      <p className="text-[12px] font-medium text-black mb-2">*** Status ***</p>
      <div className="flex flex-wrap gap-2 mb-2 justify-center border-b border-gray-50 pb-2">
        <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
          <span className="w-5 h-5 rounded-md bg-[#126A31] flex items-center justify-center">
            <RiHomeSmileFill size={12} className="text-white" />
          </span>
          <span className="text-[11px] font-bold text-gray-500">AVAILABLE (ว่าง)</span>
        </div>

        <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
          <span className="w-5 h-5 rounded-md bg-yellow-400 flex items-center justify-center">
            <MdInfo size={12} className="text-white" />
          </span>
          <span className="text-[11px] font-bold text-gray-500">PENDING (รอชำระ)</span>
        </div>

        <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
          <span className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center">
            <MdLock size={12} className="text-white" />
          </span>
          <span className="text-[11px] font-bold text-gray-500">FULL (เต็ม)</span>
        </div>

        <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
          <span className="w-5 h-5 rounded-md bg-[#D9D9D9] flex items-center justify-center">
            <SiGoogleclassroom size={12} className="text-gray-500" />
          </span>
          <span className="text-[11px] font-bold text-gray-500">COMMON (ส่วนกลาง)</span>
        </div>
      </div>
    </div>
  )
}

export default StatusLegend
