// app/new-booking/fail/page.tsx

// components
import HomeButton from "@/components/HomeButton";

// icons
import { MdError } from "react-icons/md";

interface BookingFailPageProps {
  searchParams: Promise<{
    id?: string;
    reason?: string;
  }>;
}

const BookingFailPage = async ({ searchParams }: BookingFailPageProps) => {
  const { id, reason } = await searchParams;

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

      <HomeButton isSuccess={false} />
    </div>
  );
};

export default BookingFailPage;
