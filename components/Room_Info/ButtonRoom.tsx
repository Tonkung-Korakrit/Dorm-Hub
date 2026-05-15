// components/Room_Info/ButtonRoom.tsx
"use client";

import React from 'react'
import { useBooking } from '@/app/contexts/BookingContext';

interface ButtonRoomProps {
  handleBackStep: () => void;
  handleNextSummary?: () => void;
}

const ButtonRoom = (props: ButtonRoomProps) => {
  const { handleBackStep, handleNextSummary } = props;
  const { ownerInfo, currentBooking } = useBooking();

  // const handleBackStep = () => {
  //   setStep(3)
  // }

  return (
    <div className={`flex justify-start w-[1/2] gap-2 mt-6 font-bold`}> {/* ${isEditMode ? "text-[12px]" : "text-[16px]"} */}
      <button
        type="button"
        onClick={handleBackStep}
        className="flex items-center bg-[#7D856C] hover:opacity-80 text-white font-bold px-[52px] py-3 rounded-xl shadow transition-all"
      >
        Back
      </button>

      {(ownerInfo && (currentBooking?.type === "CO_RESIDENT")) && (
        <button
          disabled={!ownerInfo}
          onClick={handleNextSummary}
          className={`flex-1 py-3 rounded-xl font-bold ${ownerInfo ? "bg-[#006633] text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
        >
          Next
        </button>
      )}
    </div>
  )
}

export default ButtonRoom
