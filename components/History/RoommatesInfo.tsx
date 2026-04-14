import React from 'react'
import { DORM_LABELS } from "@/utils/constants";

//icon
import { FaUsersLine } from "react-icons/fa6";
import { MyBookingResponse } from '@/utils/types';
import { FaGraduationCap } from 'react-icons/fa';
import { MdChatBubbleOutline } from 'react-icons/md';

interface RoommatesInfoProps {
  booking: MyBookingResponse;
}

const RoommatesInfo = ({ booking }: RoommatesInfoProps) => {
  return (
    <div className="flex flex-col gap-6 p-1">
      {/* --- Section 1: Lifestyle Preferences --- */}
      <div className="space-y-3">
        <h4 className="text-gray-800 font-bold text-[15px] flex items-center gap-2.5">
          {/* <div className="p-1.5 bg-green-50 rounded-lg text-[#006633]"> */}
          <FaUsersLine className="text-[#006633] text-[24px]" />
          {/* </div> */}
          Vibe Roommate / บรรยากาศของเพื่อนร่วมห้อง
        </h4>

        <div className="bg-gray-100 p-2 rounded-3xl border border-gray-200 space-y-3">
          <div className="flex flex-wrap gap-2 pl-1">
            {booking.cus_users.lifestyle?.length > 0 ? (
              booking.cus_users.lifestyle.map((v: string) => {
                const config = DORM_LABELS.LIFESTYLE[v as keyof typeof DORM_LABELS.LIFESTYLE];

                if (!config) return (
                  <span key={v} className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-[11px] font-semibold border border-gray-100">
                    #{v}
                  </span>
                );

                const Icon = config.icon;
                return (
                  <span key={v} className="flex items-center gap-2 px-3.5 py-2 bg-white text-[#006633] rounded-xl text-[11px] font-bold border border-green-100 shadow-sm transition-all hover:border-[#006633] hover:shadow-md hover:-translate-y-0.5">
                    <Icon size={14} className="opacity-80" />
                    {config.label}
                  </span>
                );
              })
            ) : (
              <div className="w-full py-3 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-[12px] italic">
                ไม่มีข้อมูลไลฟ์สไตล์ระบุไว้
              </div>
            )}
          </div>

          {booking.cus_users.lifestyleNote && (
            <div className="px-2 border-green-100/50 flex gap-2">
              <MdChatBubbleOutline className="text-green-600 shrink-0" size={14} />
              <p className="text-[11px] text-green-800/80 leading-tight italic line-clamp-2">
                "{booking.cus_users.lifestyleNote}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- Horizontal Divider --- */}
      {/* <div className="h-px bg-gray-100 w-full" /> */}

      {/* --- Section 2: Faculty & Department --- */}
      <div className="space-y-3">
        <h4 className="text-gray-800 font-bold text-[15px] flex items-center gap-2.5">
          {/* <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"> */}
          <FaGraduationCap className="text-[#006633] text-[24px]" />
          {/* </div> */}
          Roommate's Faculty / คณะของเพื่อนร่วมห้อง
        </h4>

        <div className="bg-gray-100 p-2 rounded-3xl border border-gray-200 space-y-3">
          <div className="flex flex-wrap gap-2 pl-1">
            {Array.isArray(booking.room.facultyConfig) && booking.room.facultyConfig.length > 0 ? (
              booking.room.facultyConfig.map((faculty: string, index: number) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 bg-white text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors hover:bg-white hover:border-blue-300"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                  {faculty}
                </div>
              ))
            ) : (
              // <span className="text-gray-400 text-[12px] italic pl-2">ยังไม่มีข้อมูลคณะในห้องนี้</span>
              <div className="w-full py-3 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-[12px] italic">
                ยังไม่มีข้อมูลคณะในห้องนี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoommatesInfo
