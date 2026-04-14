import { useBooking } from '@/app/contexts/BookingContext'
import Link from 'next/link'
import React from 'react'

interface ButtonProps {
  href?: string
  handleNextStep?: () => void
  handleBackStep?: () => void
  handleNextSummary?: () => void
  isEditMode?: boolean
}

const Button = (props: ButtonProps) => {
  const { href, handleNextStep, handleBackStep, handleNextSummary, isEditMode } = props;
  // const { currentBooking, ownerInfo } = useBooking();
  return (
    <div className={`flex justify-start w-[1/2] gap-2 mt-6 font-bold ${isEditMode ? "text-[16px]" : "text-[16px]"}`}>
      {href ? (
        <Link
          href={href}
          className="flex items-center bg-[#7D856C] hover:opacity-80 text-white font-bold px-[52px] py-3 rounded-xl shadow transition-all"
          suppressHydrationWarning
        >
          Back
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleBackStep}
          className="flex items-center bg-[#7D856C] hover:opacity-80 text-white font-bold px-[52px] py-3 rounded-xl shadow transition-all"
          suppressHydrationWarning
        >
          Back
        </button>
      )}

      {(handleNextStep || handleNextSummary) && (
        <button
          type="button"
          onClick={handleNextStep}
          className={`flex items-center bg-[#006633] hover:opacity-80 text-white
          font-bold px-[52px] py-3 rounded-xl shadow transition-all`}
          suppressHydrationWarning
        >
          {/* {isEditMode ? "Next to Summary" : "Next"} */}
          Next
        </button>
      )}
    </div >

    // ProfileStep
    // <div className="flex gap-2 mt-12">
    //     <button
    //       onClick={() => setStep(1)}
    //       className="flex-1 bg-[#7D856C] text-white py-3 rounded-2xl font-bold hover:bg-black transition-all"
    //     >
    //       Back
    //     </button>
    //     <button
    //       onClick={() => {
    //         // if (!faceImage || !idCardImage) {
    //         //   toast.error("กรุณาอัปโหลดรูปให้ครบทั้ง 2 รายการ", { id: 'upload-error' });
    //         //   return;
    //         // }
    //         setStep(3);
    //       }}
    //       className="flex-1 bg-[#006633] text-white py-3 rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-black transition-all"
    //     >
    //       Next
    //     </button>
    //   </div>
  )
}


export default Button
