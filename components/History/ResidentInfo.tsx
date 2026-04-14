// components/booking/ResidentInfo
import React from 'react'
import { Tag, InfoRow } from "@/components/History/TagInfo";
import { DORM_LABELS } from "@/utils/constants";

// icon
import { FaUser } from "react-icons/fa";
import { MyBookingResponse } from '@/utils/types';

interface ResidentInfoProps {
  booking: MyBookingResponse;
}

const ResidentInfo = ({ booking }: ResidentInfoProps) => {
  return (
    <>
      {/* ResidentInfo */}
      <div className="flex flex-col">
        <h4 className="text-gray-900 font-bold text-sm flex items-center gap-2 mb-3">
          <FaUser className="text-[#006633] text-lg" />Resident Information
        </h4>
        <div className="bg-gray-100 p-5 rounded-3xl border border-gray-200 space-y-3 h-full">
          <InfoRow label="Student ID / เลขประจำตัวนักศึกษา" value={booking?.cus_users?.studentId} />
          <InfoRow label="Name / ชื่อ-นามสกุล" value={`${booking?.cus_users?.name_en} - ${booking?.cus_users?.name_th}`} />
          <InfoRow label="Type of Booking / ประเภทการจอง" value={DORM_LABELS.RESIDENT_TYPE[booking?.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || booking?.type} />
          <InfoRow label="Email / อีเมล" value={booking?.cus_users?.email} />
          <InfoRow label="Phone / เบอร์ติดต่อ" value={booking?.cus_users?.mobilePhone} />
          <InfoRow label="Gender / เพศ" value={DORM_LABELS.GENDER[booking?.cus_users?.gender as keyof typeof DORM_LABELS.GENDER] || booking?.cus_users?.gender} />
          <InfoRow label="Scholarship Student / นักศึกษาทุน" value={booking?.cus_users?.isScholarshipStudent ? "Yes" : "No"} />
          <InfoRow label="Disabled Student / นักศึกษาพิการ" value={booking?.cus_users?.isDisabled ? "Yes" : "No"} />
          <InfoRow label="Faculty / คณะ" value={booking?.cus_users?.faculty_department} />
        </div>
      </div>
    </>
  )
}

export default ResidentInfo
