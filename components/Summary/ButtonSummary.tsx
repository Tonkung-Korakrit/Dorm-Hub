// components/Summary/Button.tsx
import React from 'react'

interface SummaryButtonProps {
  // href?: string
  isAcceptAgreement: boolean
  isSubmitting: boolean
  isResubmitting: boolean
  handleBackStep: () => void;
  handleFinalConfirm?: () => Promise<void>;
}

const SummaryButton = (props: SummaryButtonProps) => {
  const { handleBackStep, handleFinalConfirm,
    isAcceptAgreement, isSubmitting, isResubmitting } = props;

  // console.log("isResubmitting: ", isResubmitting)

  return (
    <div className={`flex justify-start w-[1/2] gap-2 mt-6 font-bold`}> {/* ${isEditMode ? "text-[12px]" : "text-[16px]"} */}
      <button
        type="button"
        onClick={handleBackStep}
        className="flex-1 flex items-center justify-center bg-[#7D856C] hover:opacity-80 text-white font-bold py-3 rounded-xl shadow transition-all"
      >
        Back
      </button>

      <button
        disabled={!isAcceptAgreement || isSubmitting}
        onClick={handleFinalConfirm}
        className={`flex-1 flex items-center justify-center hover:opacity-80 text-white font-bold py-3 rounded-xl shadow transition-all
          ${(!isAcceptAgreement || isSubmitting)
            ? "bg-gray-300 cursor-not-allowed shadow-none"
            : isResubmitting
              ? "bg-amber-500 hover:bg-amber-700 shadow-amber-100" // สีส้มตอนกดได้
              : "bg-[#126A31] hover:bg-[#093218] shadow-green-100" // สีเขียวตอนกดได้
          }`}
      >
        {isSubmitting ? "Processing..." : isResubmitting ? "Resubmit" : "Confirm"}
      </button>
    </div>
  )
}

export default SummaryButton
