// payment/components/PaymentAllocation.tsx
import React from 'react'

// icons
import { FaRegQuestionCircle } from 'react-icons/fa'

const PaymentAllocation = () => {
  return (
    <div className="mt-4 py-4">
      <div className="flex items-center gap-2 mb-4 text-gray-800">
        <div className="p-1.5 bg-green-50 rounded-lg text-[#126A31]">
          <FaRegQuestionCircle size={18} />
        </div>
        <span className="text-sm font-bold">Payment Allocation - ยอดเงินนี้จะนำไปใช้ทำอะไร?</span>
      </div>

      {/* ข้อมูลการหักเงิน (Modern List) */}
      <div className="space-y-3">
        {/* Item 1 */}
        <div className="flex justify-between items-start gap-4 p-3 bg-gray-50/50 rounded-xl border border-gray-100 shadow-inner">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500 font-black text-xs">
            1
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-gray-800 leading-tight">
              Security Deposit
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-tight">
              หักลบค่าประกันหอพัก
            </span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-white text-[#126A31] text-[10px] font-bold rounded-lg border border-green-100 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#126A31]" /> {/* animate-pulse */}
            Full Amount
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex justify-between items-start gap-4 p-3 bg-gray-50/50 rounded-xl border border-gray-100 shadow-inner">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500 font-black text-xs">
            2
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-gray-800 leading-tight">
              First Month Rent
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-tight">
              หักลบค่าหอพักงวดแรก
            </span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-white text-[#126A31] text-[10px] font-bold rounded-lg border border-green-100 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#126A31]" />
            Full Amount
          </div>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-[#126A31]/80 leading-relaxed italic text-center font-medium">
        * ยอดนี้จะถูกนำไปหักลบกับค่าใช้จ่ายจริงในวันทำสัญญา
      </p>
    </div>
  )
}

export default PaymentAllocation
