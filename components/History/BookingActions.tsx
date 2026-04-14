// components/History/BookingActions.tsx
import React from 'react';
import Link from 'next/link';
import { BookingStatus, MyBookingResponse } from "@/utils/types";
import { RiHomeSmileFill } from "react-icons/ri";
import { MdInfoOutline, MdClose, MdPayment, MdEdit } from "react-icons/md";

interface BookingActionsProps {
  booking: MyBookingResponse;
  openCancelModal: () => void; // กำหนดว่าเป็นฟังก์ชันที่ไม่คืนค่า
  isCancelling: boolean;
  newBookingHref?: string;
  paymentHref?: string;
  editHref?: string;
}

const BookingActions: React.FC<BookingActionsProps> = (props) => {
  const { booking, openCancelModal, isCancelling, newBookingHref, paymentHref, editHref } = props;

  if (!booking) return null;

  // 1. สร้างด่านตรวจสีและข้อความ (Configuration)
  const getStatusConfig = (status) => {
    switch (status) {
      case BookingStatus.CANCELLED:
      case BookingStatus.EXPIRED:
      case BookingStatus.REJECTED:
        return {
          containerClass: "bg-green-50 border-green-100",
          iconContainer: "bg-green-100 text-green-500",
          icon: <RiHomeSmileFill size={20} />,
          title: "New Booking",
          titleTh: "เริ่มจองใหม่",
          titleClass: "text-green-800"
        };
      case BookingStatus.PENDING_CORRECTION:
        return {
          containerClass: "bg-orange-50 border-orange-100",
          iconContainer: "bg-orange-100 text-orange-500",
          icon: <MdInfoOutline size={20} />,
          title: "Action Required",
          titleTh: "กรุณาแก้ไขข้อมูล",
          titleClass: "text-orange-800"
        };
      default: // PENDING, VERIFYING
        return {
          containerClass: "bg-red-50 border-red-100",
          iconContainer: "bg-red-100 text-red-500",
          icon: <MdInfoOutline size={20} />,
          title: "Cancellation",
          titleTh: "สละสิทธิ์การจอง",
          titleClass: "text-gray-800"
        };
    }
  };

  const config = getStatusConfig(booking.status);
  const showActions = ["PENDING", "VERIFYING", "CANCELLED", "REJECTED", "EXPIRED", "PENDING_CORRECTION"].includes(booking.status);

  if (!showActions) return null;

  return (
    <div className={`flex flex-col md:flex-row justify-center items-center p-2 gap-4 rounded-2xl border transition-colors duration-300 ${config.containerClass}`}>

      {/* --- ส่วนข้อความ (Left Side) --- */}
      <div className="flex items-start gap-3 flex-1">
        <div className={`mt-2 p-2 rounded-lg ${config.iconContainer}`}>
          {config.icon}
        </div>

        <div className="text-left pt-2">
          <h5 className={`font-bold text-[12px] mb-1 uppercase tracking-wider flex items-center gap-2 ${config.titleClass}`}>
            {config.title}
            <span className="text-gray-500 font-medium font-thai">/ {config.titleTh}</span>
          </h5>

          <div className="text-[12px] leading-relaxed">
            {/* ข้อความอธิบายแยกตามสถานะ */}
            {["CANCELLED", "EXPIRED"].includes(booking.status) && (
              <p className="text-gray-600">
                Your booking has been cancelled. You can now make a new reservation.
                <span className="block text-[11px] text-gray-500 italic font-thai">รายการจองถูกยกเลิกแล้ว คุณสามารถเริ่มจองใหม่ได้ทันที</span>
              </p>
            )}

            {booking.status === BookingStatus.PENDING && (
              <p className="text-gray-700 font-semibold">
                Relinquish your booking to return the room to the system.
                <span className="block text-[11px] text-gray-500 italic font-thai">สละสิทธิ์เพื่อคืนห้องพักกลับเข้าสู่ระบบ</span>
              </p>
            )}

            {booking.status === BookingStatus.VERIFYING && (
              <p className="text-gray-700 font-semibold">
                Note: Deposit is non-refundable upon cancellation.
                <span className="block text-[11px] text-gray-500 italic font-thai">การยกเลิกตอนนี้จะทำให้ 'ไม่ได้รับเงินมัดจำคืน'</span>
              </p>
            )}

            {booking.status === BookingStatus.PENDING_CORRECTION && (
              <div className="mt-1 p-3 bg-white/60 border border-orange-200 rounded-xl shadow-sm">
                <p className="text-[11px] font-bold text-orange-800 uppercase mb-1">Reason from Admin:</p>
                <p className="text-[13px] text-orange-900 font-medium font-thai">"{booking.remark || "ข้อมูลไม่ถูกต้องตามเงื่อนไข"}"</p>
              </div>
            )}
            
            {booking.status === BookingStatus.REJECTED && (
              <div className="mt-1 p-3 bg-white/60 border border-red-200 rounded-xl shadow-sm">
                <p className="text-[11px] font-bold text-red-800 uppercase mb-1">Reason from Admin:</p>
                <p className="text-[13px] text-red-900 font-medium font-thai">"{booking.remark || "ข้อมูลไม่ถูกต้องตามเงื่อนไข"}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ส่วนปุ่ม (Right Side) --- */}
      <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">

        {/* ปุ่มยกเลิก (ยังต้องใช้ Button เพราะเปิด Modal) */}
        {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.VERIFYING) && (
          <button
            onClick={openCancelModal}
            disabled={isCancelling}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-2.5 text-white bg-red-500 hover:bg-red-50 border border-red-100 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50"
          >
            <MdClose size={18} />
            {isCancelling ? "Cancelling..." : "Cancel Booking / ยกเลิก?"}
          </button>
        )}

        {/* ปุ่มจ่ายเงิน - ใช้ Link */}
        {booking.status === BookingStatus.PENDING && (
          <Link
            href={paymentHref}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-2.5 text-white bg-yellow-500 hover:opacity-[80%] rounded-xl text-sm font-black transition-all shadow-lg shadow-green-100"
          >
            <MdPayment size={18} />
            Pay Now / ชำระเงิน
          </Link>
        )}

        {/* ปุ่มจองใหม่ - ใช้ Link */}
        {["CANCELLED", "EXPIRED", "REJECTED"].includes(booking.status) && (
          <Link
            href={newBookingHref}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-3 bg-[#006633] hover:opacity-[80%] text-white rounded-xl text-sm font-black transition-all shadow-md"
          >
            <RiHomeSmileFill size={20} />
            Book Again / จองใหม่
          </Link>
        )}

        {/* ปุ่มแก้ไข - ใช้ Link */}
        {booking.status === (BookingStatus.PENDING_CORRECTION) && (
          <Link
            href={editHref}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-amber-100"
          >
            <MdEdit size={24} />
            Edit / แก้ไขข้อมูล
          </Link>
        )}
      </div>
    </div>
  );
};

export default BookingActions;