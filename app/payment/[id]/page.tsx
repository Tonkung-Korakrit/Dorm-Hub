import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PaymentStatusChecker from '../components/PaymentStatusChecker';
import { BookingStatus } from '@/types/booking';
import Link from 'next/link';
import CountdownTimer from '../components/CountdownTimer';
import { MdArrowBack, MdCheckCircle, MdCloudUpload, MdInfoOutline } from 'react-icons/md';
import DownloadQRButton from '../components/DownloadQRButton';

// สมมติว่าคุณใช้ Omise (ติดตั้ง npm install omise ก่อนนะครับ)
// const omise = require('omise')({ 'publicKey': 'pkey_...', 'secretKey': 'skey_...' });

export default async function PaymentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const bookingId = parseInt(resolvedParams.id);

  if (isNaN(bookingId)) {
    return <div className="text-center my-10">Invalid Booking ID</div>;
  }

  // 1. ดึงข้อมูลการจอง
  let booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      booking_logs: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  if (!booking) return notFound();

  // 2. Logic การสร้าง Payment หรือ QR Payload หากยังไม่มี
  // เพื่อป้องกัน Error 404 เมื่อ payments[0] เป็น undefined
  let currentPayment = booking.payments[0];

  if (!currentPayment || !currentPayment.qr_payload) {
    // ในชีวิตจริง: คุณต้องยิง API ไปหา Omise/GBPrime ตรงนี้เพื่อเอา QR
    // const charge = await omise.charges.create({ ... });
    // const qrUrl = charge.source.scannable_code.image.download_uri;

    // จำลอง QR Payload สำหรับทดสอบ (ถ้าใช้จริงให้เปลี่ยนเป็น URL จาก Gateway)
    const mockQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PromptPay_Mockup_Data";
    // const mockQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Tudorm_Payment&format=png";

    if (!currentPayment) {
      // สร้าง Payment Record ใหม่ถ้ายังไม่มีเลย
      currentPayment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.room.price || 5000, // ใช้ราคาห้องหรือค่ามัดจำที่ตั้งไว้
          // amount: 20, // test
          status: 'PENDING',
          qr_payload: mockQrUrl,
          external_id: `temp_${Date.now()}` // ID อ้างอิงชั่วคราว
        }
      });
    } else {
      // มี Record แล้วแต่ขาด QR (เช่น เจนไม่สำเร็จในรอบแรก) ให้ Update เพิ่มเข้าไป
      currentPayment = await prisma.payment.update({
        where: { id: currentPayment.id },
        data: { qr_payload: mockQrUrl }
      });
    }
  }

  // const handleDownloadQR = () => {
  //   const link = document.createElement('a');
  //   link.href = currentPayment.qr_payload;
  //   link.download = `Tudorm-QR-Booking-${bookingId}.png`;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  // 5. คำนวณเวลาที่เหลือจริงจาก Server
  const EXPIRE_TIME_SEC = 5 * 60; // 30 นาที
  const createdAt = new Date(currentPayment.createdAt).getTime();
  const now = new Date().getTime();
  const diffInSec = Math.floor((now - createdAt) / 1000);
  const initialRemainingTime = Math.max(0, EXPIRE_TIME_SEC - diffInSec);

  // 6. เช็คสถานะการจ่ายเงิน
  const isVerifying = booking.booking_logs[0]?.status === BookingStatus.VERIFYING;

  // --- VIEW: เมื่อจ่ายสำเร็จแล้ว ---
  if (isVerifying) {
    return (
      <div className="max-w-md mx-auto my-20 bg-white p-10 rounded-[3rem] shadow-2xl text-center">
        <MdCheckCircle className="text-[#126A31] text-7xl mx-auto mb-6 animate-bounce" />
        <h1 className="text-xl font-bold text-gray-800">Payment Received!</h1>
        <p className="text-gray-500 text-sm mt-2">กำลังพาคุณไปหน้าสรุปข้อมูล...</p>
        <PaymentStatusChecker bookingId={bookingId} initialSeconds={initialRemainingTime} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
      <div className="text-left mb-4">
        <h1 className="text-[24px] font-bold text-gray-700 mb-4 leading-tight">Pay a deposit / ชำระเงินค่ามัดจำ</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mt-1">Dormitory Booking System</p>
        {/* <p className="text-gray-400 text-sm">Please make the payment and upload the receipt to confirm your room reservation - กรุณาชำระเงิน และอัปโหลดสลิปเพื่อยืนยันสิทธิ์การจองห้องพัก</p> */}
      </div>

      {/* ระบบตรวจสอบสถานะอัตโนมัติ */}
      <div className="w-full">
        <PaymentStatusChecker
          bookingId={bookingId}
          initialSeconds={initialRemainingTime}
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-green-900/5 border border-gray-100 overflow-hidden">
        {/* สถานะการนับเวลา (Sticky-ish top) */}
        {/* <div className="bg-orange-50/50 border-b border-orange-100 py-3 px-6 flex justify-center">
            <CountdownTimer initialSeconds={initialRemainingTime} />
          </div> */}

        <div className="pr-4 pl-4">
          {/* ข้อมูลการจองแบบพรีเมียม */}
          <div className="bg-green-50 rounded-3xl p-6 mb-4 border border-green-100">
            <div className="flex gap-2 items-center mb-4">
              <span className="text-gray-400 text-sm font-medium">Room Number :</span>
              <span className="bg-white px-3 py-1 rounded-lg shadow-sm font-black text-gray-800 border border-gray-100">
                {booking.room.roomId}
              </span>
            </div>
            <div className="h-[1px] bg-gray-200/50 w-full mb-4" />
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total payment</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-[#126A31]">
                  {Number(currentPayment.amount).toLocaleString()}
                  {/* 20 (Test) */}
                </span>
                <span className="text-lg font-bold text-gray-300">THB</span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center">
            <div className="relative group mb-2">
              {/* <div className="absolute -inset-2 bg-gradient-to-tr from-[#126A31]/20 to-blue-500/10 rounded-[2rem] blur-xl opacity-50"></div> */}
              <div className="relative bg-white p-5 rounded-[2rem] shadow-sm border-2 border-gray-50">
                <img
                  src={currentPayment.qr_payload}
                  alt="PromptPay QR"
                  className="w-56 h-56 object-contain"
                />
                {/* ตราสัญลักษณ์ PromptPay เล็กๆ เพื่อความอุ่นใจ */}
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                  PromptPay
                </div>
              </div>
            </div>

            {/* Timer Bar */}
            <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl`}>
              <CountdownTimer initialSeconds={initialRemainingTime} />
            </div>
          </div>

          <div className="mt-2 mb-2">
            {/* ส่วนหัวข้อความช่วยเหลือ */}
            <div className="flex items-center gap-2 mb-4 text-gray-800">
              <div className="w-6 h-6 bg-[#126A31]/10 rounded-full flex items-center justify-center">
                <MdInfoOutline size={14} className="text-[#126A31]" />
              </div>
              <span className="text-sm font-bold">Payment process - ขั้นตอนชำระเงิน</span>
            </div>

            {/* กล่องขั้นตอน Step-by-Step */}
            <div className="grid grid-cols-1 gap-3">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all">
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500 font-black text-xs">
                  1
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  กดปุ่ม <span className="font-bold text-gray-800">"บันทึกรูปภาพ QR Code"</span> ด้านบนลงในโทรศัพท์ของคุณ
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all">
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500 font-black text-xs">
                  2
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  เปิด <span className="font-bold text-gray-800">แอปธนาคารของคุณ</span> เลือกเมนูสแกน และเลือก <span className="font-bold text-gray-800">"รูปภาพจากแกลเลอรี่"</span>
                </p>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-gray-400">
              รองรับทุกแอปพลิเคชันธนาคารในประเทศไทย
            </p>
          </div>

          {/* ปุ่มบันทึก QR Code ที่เพิ่มกลับมา */}
          <div className="flex justify-center w-full">
            <DownloadQRButton
              qrUrl={currentPayment.qr_payload}
              bookingId={bookingId}
            />
          </div>
        </div>

        {/* ส่วนท้าย Card */}
        <div className="bg-gray-50/80 p-4 border-t border-gray-100 flex flex-col gap-2">
          <p className="text-[10px] text-gray-400 text-center uppercase tracking-tighter">
            Transaction ID: {currentPayment.external_id}
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-gray-400 text-sm italic">
        * ระบบล็อกห้องไว้ให้แล้ว แต่ถ้าคุณไม่ชำระเงินให้สำเร็จภายในเวลาที่กำหนด ระบบก็จะยกเลิกการจองของคุณโดยอัตโนมัติ
      </p>
    </div>
  )
}