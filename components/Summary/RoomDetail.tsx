// components/summary/RoomDetail.tsx

import React from 'react'
import { useBooking } from '@/app/contexts/BookingContext';
import { DORM_LABELS } from '@/utils/constants';

import { MdOutlinePerson } from 'react-icons/md';

interface RoomDetailProps {
  isResubmitting: boolean
  setStep: (step: number) => void;
}

const RoomDetail = (props: RoomDetailProps) => {
  const { isResubmitting, setStep } = props;
  const { formRoom, currentBooking, ownerInfo } = useBooking();

  // console.log("isResubmitting: ", isResubmitting)
  // console.log("currentBooking?.type: ", currentBooking?.type)
  // console.log("formRoom: ", formRoom)

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-[#006432]">2. Booking & Room Detail</h3>
        {(!isResubmitting && (currentBooking?.type !== "CO_RESIDENT")) && (
          <button onClick={() => setStep(4)} className="text-sm text-blue-500 hover:text-blue-700 font-semibold">Edit</button>
        )}
      </div>

      {/* <div className="bg-[#f0f7f0] p-4 rounded-[2rem] border-2 border-[#e0ede0]"> */}
      <div className="mt-4 p-4 bg-[#f0f7f0] border border-[#e0ede0] rounded-2xl flex flex-col gap-2 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[15px]">
          <p><span className="text-gray-500">Booking Type:</span> {DORM_LABELS.RESIDENT_TYPE[currentBooking?.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || currentBooking?.type}</p>
          <p><span className="text-gray-500">Campus:</span> {DORM_LABELS.CAMPUS[formRoom?.campus as keyof typeof DORM_LABELS.CAMPUS] || formRoom?.campus}</p>
          <p><span className="text-gray-500">Dorm & Floor:</span> {formRoom?.dorm?.name} & Floor {formRoom.floor}</p>
          <p><span className="text-gray-500">Room Type:</span> {DORM_LABELS.ROOM_TYPES[formRoom?.roomType as keyof typeof DORM_LABELS.ROOM_TYPES]?.label || formRoom?.roomType}</p>
          <p><span className="text-gray-500">Monthly Price:</span> <span className="font-bold text-gray-800">{formRoom.price?.toLocaleString()} THB/MONTH</span></p>
        </div>

        {/* ส่วนแสดง Room Number ใหญ่ๆ */}
        <div className="mt-5 pt-5 border-t border-green-200 flex justify-between items-end">
          <div>
            <span className="text-green-700/60 block text-xs font-bold uppercase tracking-wider mb-1">Room Number</span>
            <span className="text-5xl font-black text-[#126A31]">{formRoom.roomId || "N/A"}</span>
          </div>
        </div>
        {currentBooking?.type === "CO_RESIDENT" && ownerInfo && (
          <div className="flex items-center gap-4 bg-gray-50/50 px-2 py-2 rounded-3xl border border-gray-100 w-full md:w-auto">
            <div className="w-12 h-12 bg-[#126A31] rounded-2xl flex items-center justify-center text-white shadow-inner">
              <MdOutlinePerson size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-green-700 uppercase">Staying with</p>
              <p className="text-sm font-black text-gray-800">{ownerInfo.name}</p>
              <p className="text-sm font-bold text-gray-500">{ownerInfo.studentId}</p>
              <p className="text-[10px] text-gray-400">Verified Resident</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default RoomDetail
