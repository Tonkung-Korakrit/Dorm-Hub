// components/booking/RoomInfo.tsx
// "use server"
import { Tag } from "@/components/History/TagInfo";
import { DORM_LABELS } from "@/utils/constants";
import { Booking } from '@/utils/types';

// icons
import { MdCircle } from "react-icons/md";
import { RiHomeSmileFill } from "react-icons/ri";

interface RoomInfoProps {
  initialBooking: Booking;
}

const RoomInfo = ({ initialBooking }: RoomInfoProps) => {
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-500 text-white",
      VERIFYING: "bg-blue-500 text-white",
      COMPLETED: "bg-emerald-500 text-white",
      PENDING_CORRECTION: "bg-orange-500 text-white",
      REJECTED: "bg-red-500 text-white",
      EXPIRED: "bg-slate-500 text-white"
    };
    return styles[status] || "bg-slate-500 text-white";
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-200";
      case "VERIFYING": return "text-blue-200";
      case "COMPLETED": return "text-emerald-200";
      case "PENDING_CORRECTION": return "text-orange-200";
      case "REJECTED": return "text-red-500";
      case "EXPIRED": return "text-orange-200";
      default: return "text-slate-200";
    }
  };

  return (
    <div>
      {/* Room Info Card */}
      <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
        <div className={`px-6 py-3 flex justify-between items-center ${(initialBooking?.status === "PENDING_CORRECTION") ? "text-[12px]" : "text-[16px]"} font-black uppercase tracking-widest border-b ${getStatusStyles(initialBooking?.status)}`}>
          <div className="flex items-center gap-2">
            <MdCircle
              size={8}
              className={`${getStatusDotColor(initialBooking?.status)} ${["PENDING", "VERIFYING"].includes(initialBooking?.status) ? "animate-pulse" : ""
                }`}
            />
            {initialBooking?.status}
          </div>
          <span className="text-white">#{initialBooking?.id}</span>
        </div>

        <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* ไอคอนห้องพัก */}
          <div className={`w-24 h-24 ${getStatusStyles(initialBooking?.status)} rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-gray-50 shrink-0 transform md:-rotate-3`}>
            <RiHomeSmileFill size={48} />
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-end md:gap-4 mb-4">
              <h2 className="text-[52px] md:text-7xl font-black text-gray-900 tracking-tighter leading-none">
                {initialBooking?.room?.roomId}
              </h2>
              <span className="text-xs font-bold text-gray-500 md:mb-2 uppercase tracking-widest">Selected Unit</span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
              <Tag label={`Floor / ชั้น: ${initialBooking?.room?.floor}`} />
              <Tag label={`Dorm / หอพัก: ${initialBooking?.room?.dorm.name}`} />
              <Tag
                label={`Campus / วิทยาเขต: ${DORM_LABELS.CAMPUS[initialBooking?.room?.campus as keyof typeof DORM_LABELS.CAMPUS] || initialBooking?.room?.campus}`}
                className={`${getStatusStyles(initialBooking?.status)} text-white border-none shadow-sm`}
              />
              <Tag label={`Room Type / ประเภทห้อง: ${DORM_LABELS.ROOM_TYPES[initialBooking?.room?.roomType as keyof typeof DORM_LABELS.ROOM_TYPES]?.label || initialBooking?.room?.roomType}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomInfo
