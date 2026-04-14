// payment/components/PaymentInstructions.tsx
import React from 'react'

// icons
import { MdOutlineEventNote } from 'react-icons/md'

const PaymentInstructions = () => {
  return (
    <div className="my-2">
      <div className="flex items-center gap-2 mb-4 text-gray-800">
        <div className="p-1.5 bg-green-50 rounded-lg text-[#126A31]">
          <MdOutlineEventNote size={18} />
        </div>
        <span className="text-sm font-bold">Payment process - ขั้นตอนชำระเงิน</span>
      </div>

      {/* กล่องขั้นตอน Step-by-Step */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-start gap-4 p-3 bg-gray-50/50 rounded-xl border border-gray-100 shadow-inner">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500 font-black text-xs">
            1
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            กดปุ่ม <span className="font-bold text-gray-800">"บันทึกรูปภาพ QR Code"</span> ด้านบนลงในโทรศัพท์ของคุณ
          </p>
        </div>

        <div className="flex items-start gap-4 p-3 bg-gray-50/50 rounded-xl border border-gray-100 shadow-inner">
          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500 font-black text-xs">
            2
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed">
            เปิด <span className="font-bold text-gray-800">แอปธนาคารของคุณ</span> เลือกเมนูสแกน และเลือก <span className="font-bold text-gray-800">"รูปภาพจากแกลเลอรี่"</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentInstructions
