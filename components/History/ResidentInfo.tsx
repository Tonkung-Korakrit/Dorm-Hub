// components/booking/ResidentInfo.tsx
// "use server"
import { InfoRow } from "@/components/History/TagInfo";
import { DORM_LABELS } from "@/utils/constants";
import { Booking } from '@/utils/types';

// icons
import { FaUser } from "react-icons/fa";

interface ResidentInfoProps {
  initialBooking: Booking;
}

const ResidentInfo = ({ initialBooking }: ResidentInfoProps) => {
  // const formatThaiDate = (date: string | Date | undefined) => {
  //   if (!date) return "-";
    
  //   return new Date(date).toLocaleDateString('th-TH', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //   });
  // };

  const formatThaiDateCE = (date: string | Date | undefined) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory', // ระบุปฏิทินเป็น Gregorian (ค.ศ.)
    }).format(new Date(date));
  };
  return (
    <>
      {/* ResidentInfo */}
      <div className="flex flex-col">
        <h4 className="text-gray-900 font-bold text-[16px] flex items-center gap-2 mb-3">
          <FaUser className="text-[#006633] text-[20px] shrink-0" />Resident Information / ข้อมูลของผู้จอง
        </h4>
        {/* <div className="bg-gray-100 p-5 rounded-3xl border border-gray-200 space-y-3 h-full"> */}
        <div className="bg-gray-100 p-5 rounded-3xl border border-gray-200 h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-4">
          <div className="space-y-3">
            <InfoRow label="Citizen Type / ประเภทบัตรพลเมือง" value={initialBooking?.cus_users?.citizenType} />
            <InfoRow label="Citizen Number / หมายเลขประจำตัวประชาชน" value={initialBooking?.cus_users?.citizenNumber} />
            <InfoRow label="Student ID / เลขประจำตัวนักศึกษา" value={initialBooking?.cus_users?.studentId} />
            <InfoRow label="Gender / เพศ" value={DORM_LABELS.GENDER[initialBooking?.cus_users?.gender as keyof typeof DORM_LABELS.GENDER] || initialBooking?.cus_users?.gender} />
            <InfoRow label="Title / คำนำหน้า" value={`${initialBooking?.cus_users?.titleName}`} />
            <InfoRow label="Name / ชื่อ-นามสกุล" value={`${initialBooking?.cus_users?.name_en} - ${initialBooking?.cus_users?.name_th}`} />
            <InfoRow label="Type of Booking / ประเภทการจอง" value={DORM_LABELS.RESIDENT_TYPE[initialBooking?.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || initialBooking?.type} />
            <InfoRow label="Email / อีเมล" value={initialBooking?.cus_users?.email} />
            <InfoRow label="Phone / เบอร์ติดต่อ" value={initialBooking?.cus_users?.mobilePhone} />
            <InfoRow label="BirthDate / วันเกิด" value={formatThaiDateCE(initialBooking?.cus_users?.birthDate)} />
            <InfoRow label="Scholarship Student / นักศึกษาทุน" value={initialBooking?.cus_users?.isScholarshipStudent ? "Yes" : "No"} />
            <InfoRow label="Disabled Student / นักศึกษาพิการ" value={initialBooking?.cus_users?.isDisabled ? "Yes" : "No"} />
            <InfoRow label="Faculty / คณะ" value={initialBooking?.cus_users?.faculty_department} />
            <InfoRow label="Address / ที่อยู่อาศัยปัจจุบัน" value={`${initialBooking?.cus_users?.address[0]?.addressDetail} - ${initialBooking?.cus_users?.address[0]?.subDistrict} ${initialBooking?.cus_users?.address[0]?.district} - ${initialBooking?.cus_users?.address[0]?.province} ${initialBooking?.cus_users?.address[0]?.postalCode} ${initialBooking?.cus_users?.address[0]?.country}`} />
          </div>
        </div>
      </div>
    </>
  )
}

export default ResidentInfo
