// payment/components/PaymentTicket.tsx
import React from 'react'

// components
import CountdownTimer from './CountdownTimer';

interface PaymentTicketProps {
  booking: any;
  currentPayment: any;
  initialRemainingTime: any;
}

const PaymentTicket = (props: PaymentTicketProps) => {
  const { booking, currentPayment, initialRemainingTime } = props;
  return (
    <div className="w-full bg-white rounded-[2.5rem] shadow-2xl shadow-green-900/10 border border-gray-100 overflow-hidden" >

      {/* 1. Header: Room Info */}
      <div className="p-6 border-b border-gray-50 flex justify-between items-center" >
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Booking Room</span>
          <span className="text-xl font-black text-gray-800">{booking.room.roomId}</span>
        </div>
        <div className="bg-green-100 text-[#126A31] px-4 py-1.5 rounded-full text-[10px] font-bold">
          Waiting for Payment
        </div>
      </div>

      {/* 2. Amount Section */}
      <div className="p-8 bg-gradient-to-b from-green-50/50 to-white flex flex-col items-center text-center" >
        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-2">Total Amount to Pay</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-black text-[#126A31] tracking-tighter">
            {Number(currentPayment.amount).toLocaleString()}
          </span>
          <span className="text-sm font-bold text-gray-400">THB</span>
        </div>
      </div>

      {/* 3. Separator (เส้นประใบเสร็จ) */}
      <div className="relative h-6" >
        <div className="absolute inset-0 flex items-center px-2">
          <div className="w-full border-t-2 border-dashed border-gray-100"></div>
        </div>
        <div className="absolute left-0 -top-0 w-6 h-6 bg-gray-50 rounded-full -ml-3 border border-gray-100"></div>
        <div className="absolute right-0 -top-0 w-6 h-6 bg-gray-50 rounded-full -mr-3 border border-gray-100"></div>
      </div>

      {/* 4. QR Code & Timer Section */}
      <div className="p-8 pt-2 flex flex-col items-center" >
        <div className="text-[11px] font-bold text-blue-600 mb-6 bg-blue-50 px-4 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Scan via PromptPay
        </div>

        {/* QR Code Frame */}
        <div className="relative group p-4 bg-white border-2 border-gray-50 rounded-[2rem] shadow-inner mb-4">
          <div className="relative w-48 h-48">
            <img
              src={currentPayment.qr_payload}
              alt="PromptPay QR"
              className="object-contain w-full h-full"
            />
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 shadow-sm border border-gray-100 rounded-md">
            <span className="text-[10px] font-black text-blue-900">Prompt Pay</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-400 mb-6">
          รองรับทุกแอปพลิเคชันธนาคารในประเทศไทย
        </p>

        {/* Timer Section */}
        <div className="w-full flex justify-center">
          <CountdownTimer initialSeconds={initialRemainingTime} />
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 font-medium">
          Please complete the payment within the time limit.
        </p>
      </div>

      {/* 5. Footer (Transaction ID) */}
      <div className="bg-gray-50/80 p-4 border-t border-gray-100 text-center" >
        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
          Transaction ID: {currentPayment.external_id}
        </p>
      </div>
    </div >
  )
}

export default PaymentTicket
