// components/History/EmptyBooking.tsx
import Link from "next/link";
import { RiHomeSmileFill } from "react-icons/ri";

interface EmptyBookingProps {
  newBookingHref: string;
  handleLogout?: () => void;
  isLogout?: boolean;
}

export default function EmptyBooking({ newBookingHref, handleLogout, isLogout }: EmptyBookingProps) {
  return (
    <>
      <div className="flex flex-col items-center justify-center py-4 text-center">
        {/* <div className="flex items-center justify-center h-[calc(100vh-84vh)]"> */}
        <div className="w-20 h-20 bg-green-50 text-[#006633] rounded-full flex items-center justify-center shadow-inner mb-6">
          <RiHomeSmileFill size={40} />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">No booking information found<br />ไม่พบข้อมูลการจอง</h2>
        <p className="text-gray-400 mb-10 text-[12px] max-w-xs mx-auto">
          It seems you don't have any room reservations for this semester. You can easily start making your reservation by clicking the button below. <br />
          ดูเหมือนว่าคุณจะยังไม่มีรายการจองห้องพักในภาคเรียนนี้ เริ่มจองห้องพักของคุณได้ง่ายๆ เพียงกดปุ่มด้านล่าง
        </p>
        <Link
          href={newBookingHref}
          className="w-full bg-[#006633] text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-green-100 hover:bg-[#004d26] active:scale-95 transition-all disabled:opacity-50"
        >
          Book Now - จองทันที
        </Link>
      </div>
    </>
  )
}