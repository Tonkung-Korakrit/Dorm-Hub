// app/new-booking/fail/page.tsx
import Link from "next/link";
import { MdError, MdRefresh, MdContactSupport, MdArrowBack } from "react-icons/md";

export default async function BookingFailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; reason?: string }>;
}) {
  const { id, reason } = await searchParams;

  // Logic การแสดงข้อความตามสาเหตุ
  const isTimeout = reason === "timeout";
  const title = isTimeout ? "Payment Timeout" : "Payment Failed";
  const description = isTimeout
    ? "ขออภัย! คุณชำระเงินไม่ทันภายในเวลาที่กำหนด หากยังต้องการจองห้องนี้ กรุณาเริ่มขั้นตอนใหม่"
    : "ขออภัย! ระบบไม่สามารถดำเนินการชำระเงินได้ในขณะนี้ กรุณาตรวจสอบยอดเงินหรือลองใหม่อีกครั้ง";

  return (
    <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-[2.5rem] shadow-xl border border-red-50 text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-red-50 p-6 rounded-full relative">
          <MdError className="text-red-500" size={64} />
          <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-20"></div>
        </div>
      </div>

      <h1 className="text-2xl font-black text-gray-800 mb-2">{title}</h1>
      <p className="text-sm text-gray-500 mb-4 px-4 leading-relaxed">
        {description}
      </p>

      {/* <div className="space-y-3 mb-8">
        <Link 
          href={id ? `/new-booking/payment/${id}` : "/my-booking"} 
          className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
        >
          <MdRefresh size={20} /> {isTimeout ? "Re-initiate Booking" : "Try Payment Again"}
        </Link>
        
        <button className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-100">
          <MdContactSupport size={20} /> Contact Support
        </button>
      </div> */}

      <Link href="/" className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2">
        <MdArrowBack className="group-hover:-translate-x-1 transition-transform" /> Back to Homepage
      </Link>
    </div>
  );
}