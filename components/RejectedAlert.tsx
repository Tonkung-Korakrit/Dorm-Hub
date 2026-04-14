// components/RejectedAlert.tsx

import { useBooking } from '@/app/contexts/BookingContext';
import React from 'react'
import { MdCheck, MdInfoOutline } from 'react-icons/md';

interface RejectedAlertProps {
  editId: string;
  step?: number;
}

const RejectedAlert = ({ editId, step }: RejectedAlertProps) => {
  if (!editId || step >= 8) return null;
  const { currentBooking } = useBooking();

  return (
    <div className="w-full bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 shadow-sm flex items-start gap-4">
      {/* Icon ขนาดพอดีๆ */}
      <div className="mt-0.5 text-amber-500 flex-shrink-0">
        <MdInfoOutline size={22} />
      </div>

      <div className="flex-1">
        {/* Header & Remark ในบรรทัดเดียวกันเพื่อประหยัดที่ */}
        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 mb-1">
          <span className="text-amber-900 font-bold text-[13px] uppercase tracking-tight shrink-0">
            Reason from Admin:
          </span>
          <span className="text-amber-900 text-[15px] font-thai font-medium italic">
            "{currentBooking.remark || "Please check your information"}"
          </span>
        </div>

        {/* คำแนะนำภาษาอังกฤษ/ไทย แบบตัวเล็ก (Secondary Text) */}
        <div className="space-y-0.5 opacity-80">
          <p className="text-amber-800 text-[12px] font-medium">
            Revised according to the remarks <br /> Please click "Submit" when finished.
          </p>
          <p className="text-amber-700 text-[11px] italic font-thai">
            แก้ไขข้อมูลตามคำแนะนำ และกดส่งเพื่อตรวจสอบอีกครั้ง
          </p>
        </div>
      </div>
    </div>
  );
}

export default RejectedAlert
