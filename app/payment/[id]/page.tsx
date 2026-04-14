// payment/[id]/page.tsx

import { notFound } from 'next/navigation';
import { getPaymentData } from '@/services/booking';

// components
import Container from '@/components/Container';
import PaymentStatusChecker from '../components/PaymentStatusChecker';
import PaymentInstructions from '../components/PaymentInstructions';
import PaymentAllocation from '../components/PaymentAllocation';
import PaymentTicket from '../components/PaymentTicket';
import PaymentActions from '../components/PaymentActions';

// ถ้าใช้ Omise version จริง (ต้องติดตั้ง npm install omise ก่อน)
// const omise = require('omise')({ 'publicKey': 'pkey_...', 'secretKey': 'skey_...' });

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const bookingId = parseInt(resolvedParams.id);

  if (isNaN(bookingId)) {
    return <div className="text-center my-10">Invalid Booking ID</div>;
  }

  const data = await getPaymentData(bookingId);
  if (!data) return notFound()

  const { booking, currentPayment } = data;

  // คำนวณเวลาที่เหลือจริงจาก Server
  const EXPIRE_TIME_SEC = 10 * 60; // 10 นาที
  const createdAt = new Date(currentPayment.createdAt).getTime();
  const now = new Date().getTime();
  const diffInSec = Math.floor((now - createdAt) / 1000);
  const initialRemainingTime = Math.max(0, EXPIRE_TIME_SEC - diffInSec);

  // เช็คสถานะการจ่ายเงิน
  // const isVerifying = booking.booking_logs[0]?.status === BookingStatus.VERIFYING;

  // --- VIEW: เมื่อจ่ายสำเร็จแล้ว ---
  // if (booking.booking_logs[0]?.status === BookingStatus.VERIFYING) {
  //   return (
  //     <div className="max-w-md mx-auto my-20 bg-white p-10 rounded-[3rem] shadow-2xl text-center">
  //       <MdCheckCircle className="text-[#126A31] text-7xl mx-auto mb-6 animate-bounce" />
  //       <h1 className="text-xl font-bold text-gray-800">Payment Received!</h1>
  //       <p className="text-gray-500 text-sm mt-2">กำลังพาคุณไปหน้าสรุปข้อมูล...</p>
  //       <PaymentStatusChecker bookingId={bookingId} initialSeconds={initialRemainingTime} />
  //     </div>
  //   );
  // }

  return (
    <Container
      title="Pay a deposit / ชำระเงินค่ามัดจำ"
    >

      {/* ระบบตรวจสอบสถานะอัตโนมัติ */}
      <PaymentStatusChecker
        bookingId={bookingId}
        initialSeconds={initialRemainingTime}
      />

      {/* การแนะนำขั้นตอน และข้อมูลต่างๆ ที่เกี่ยวข้องกับการชำระเงิน */}
      <PaymentInstructions />
      <PaymentAllocation />

      <div className="flex flex-col items-center w-full max-w-md mx-auto gap-6">
        <PaymentTicket
          booking={booking}
          currentPayment={currentPayment}
          initialRemainingTime={initialRemainingTime}
        />

        <PaymentActions bookingId={bookingId} qrUrl={currentPayment.qr_payload}/>

        <div className="w-full p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
          <p className="text-center text-amber-700 text-[11px] leading-relaxed font-medium">
            <span className="font-bold">⚠️ สำคัญ:</span> ระบบล็อกห้องไว้ให้แล้ว แต่ถ้าคุณไม่ชำระเงินให้สำเร็จภายในเวลาที่กำหนด ระบบก็จะยกเลิกการจองของคุณโดยอัตโนมัติ
          </p>
        </div>
      </div>
    </Container >
  )
}