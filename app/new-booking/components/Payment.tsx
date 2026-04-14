// app/new-booking/components/PaymentPage.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { customFetch } from "@/utils/custom-api";

// hooks
import { useScrollTop } from "@/hooks/useScrollTop";

// components
import Container from "@/components/Container";
import PaymentInstructions from "@/app/payment/components/PaymentInstructions";
import PaymentAllocation from "@/app/payment/components/PaymentAllocation";
import PrintButton from "../../payment/success/components/PrintButton";
import HomeButton from "../../../components/HomeButton";
import { LoadingOverlay } from "@/components/Loading/LoadingOverlay";

// icons
import { MdCheckCircle, MdTimer, MdQrCodeScanner, MdEmail, MdErrorOutline, MdCloudUpload, MdClose, MdInfo, MdError } from "react-icons/md";
import { RiHomeSmileFill, RiLineFill } from "react-icons/ri";
import { LuAlarmClock } from "react-icons/lu";


export function PaymentPage() {
  const { formRoom, currentBooking } = useBooking();
  const [timeLeft, setTimeLeft] = useState(600); // 10 นาที
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // const expiryTimestamp = new Date(currentBooking.expiresAt).getTime();

  useScrollTop();

  const handleAutoCancel = useCallback(async () => {
    if (!currentBooking.id || isVerifying || isExpired) return;

    try {
      const res = await customFetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: currentBooking.id, isExpired: isExpired })
      });

      // ไม่ว่าจะสำเร็จหรือไม่ ถ้าเวลาหมดและไม่ได้จ่าย เราควรล็อกหน้าจอ Expired
      setIsExpired(true);

      if (!res.ok) {
        const data = await res.json();
        console.error("Server cancel error:", data.error);
      }
    } catch (err) {
      console.error("Network error during auto-cancel:", err);
      setIsExpired(true); // บังคับ Expired แม้เน็ตหลุด
    }
  }, [currentBooking.id, isVerifying, isExpired]);

  // 1. ระบบนับเวลาถอยหลัง 10 นาที
  useEffect(() => {
    if (isVerifying || isExpired) return;

    if (timeLeft <= 0) {
      handleAutoCancel(); // เมื่อเวลาหมด ให้เรียกฟังก์ชันยกเลิก
      return;
    }

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isVerifying, isExpired, handleAutoCancel]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // สร้าง URL ชั่วคราวสำหรับแสดงผล
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // กันไม่ให้ไป Trigger input file ซ้ำ
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // 2. จำลองการจ่ายเงินสำเร็จ
  const handlePaymentSuccess = async () => {
    // เรียกใช้ bookingId ที่เราพึ่งเซตไปใน Step ก่อนหน้า
    const bId = currentBooking.id;
    setIsLoading(true);

    if (!bId) {
      alert("ไม่พบรหัสใบจอง (Booking ID)");
      return;
    }

    try {
      const res = await customFetch("/api/bookings/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bId }) // ส่งเลขใบจองที่ถูกต้องไป
      });

      if (res.ok) setIsVerifying(true);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // console.log("currentBooking in payment: ",currentBooking)

  if (isExpired) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-[2.5rem] shadow-xl border border-red-50 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 p-6 rounded-full relative">
            <MdError className="text-red-500" size={64} />
            <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-20"></div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-800 mb-2">Payment Timeout</h1>
        <p className="text-sm text-gray-500 mb-4 px-4 leading-relaxed">
          ขออภัย! คุณชำระเงินไม่ทันภายในเวลาที่กำหนด หากยังต้องการจองห้องนี้ กรุณาเริ่มขั้นตอนใหม่
        </p>
        <HomeButton isSuccess={false} />
      </div>
    );
  }

  // if (isVerifying) {
  //   return (
  //     <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
  //       <MdCheckCircle className="text-green-500 text-8xl mx-auto mb-6" />
  //       <h1 className="text-[22px] font-black text-gray-800 mb-2">การจองเสร็จสมบูรณ์!</h1>
  //       <p className="text-gray-500 mb-8">ระบบได้บันทึกข้อมูลและล็อกห้องพักให้คุณเรียบร้อยแล้ว</p>

  //       <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 mb-8 text-left">
  //         <h3 className="text-[16px] font-bold text-green-800 mb-4 flex items-center gap-2">
  //           <MdEmail /> ส่งข้อมูลยืนยันเรียบร้อยแล้วที่:
  //         </h3>
  //         <ul className="space-y-2 text-sm text-green-700">
  //           <li className="flex justify-between"><span>Email:</span> <strong>{formResident.email}</strong></li>
  //           <li className="flex justify-between items-center">
  //             <span>Line Notification:</span>
  //             <span className="bg-green-600 text-white px-3 py-1 rounded-full text-[10px] flex items-center gap-1">
  //               <RiLineFill /> Connected
  //             </span>
  //           </li>
  //         </ul>
  //       </div>

  //       <div className="space-y-2 text-gray-600 text-sm border-t pt-6">
  //         <p>หมายเลขห้อง: <span className="font-bold text-black">{formRoom.roomId}</span></p>
  //         <p>วิทยาเขต: <span className="font-bold text-black">{formRoom.campus}</span></p>
  //       </div>

  //       <button
  //         onClick={() => window.location.href = "/"}
  //         className="mt-10 w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
  //       >
  //         กลับสู่หน้าหลัก
  //       </button>
  //     </div>
  //   );
  // }

  // --- View: เมื่อส่งสลิปสำเร็จ (รอตรวจสอบ) ---
  if (isVerifying) {
    return (
      <Container title="">
        {/* ส่วนหัว: มินิมอลสุดๆ */}
        <div className="flex flex-col items-center my-4">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-50 scale-150"></div>
            <MdCheckCircle className="relative text-[#126A31] text-7xl animate-bounce" />
          </div>
          <h2 className="mt-4 text-xl font-black text-gray-800">Booking Confirmed!</h2>
          <p className="text-gray-400 text-sm">เราได้รับยอดชำระเงินของคุณเรียบร้อยแล้ว</p>
        </div>

        {/* บัตรรายละเอียด: สไตล์ใบเสร็จมินิมอล */}
        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl shadow-green-900/5 overflow-hidden mb-6">

          {/* ส่วนบน: รหัสการจอง */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-green-50">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking ID</p>
              <p className="text-lg font-black text-gray-800">#TU-B-{currentBooking.id.toString().padStart(5, '0')}</p>
            </div>
            <div className="bg-green-500/10 text-green-600 px-4 py-1.5 rounded-full text-xs font-black">
              Success
            </div>
          </div>

          {/* ส่วนกลาง: รายละเอียดห้อง (ใช้ Grid แบบคลีน) */}
          <div className="px-8 py-4 space-y-6">

            {/* รายละเอียดราคาที่โดดเด่นแต่เรียบง่าย */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Amount Paid</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#126A31]">฿{currentBooking.payments.amount.toLocaleString()}</span>
              </div>
              <span className="text-xs font-bold text-gray-300">THB</span>
            </div>

            <div className="h-px bg-dashed border-t border-dashed border-gray-200"></div>

            {/* ข้อมูลที่พัก */}
            <div className="grid grid-cols-1 gap-6">
              {/* Dormitory & Room Section */}
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 flex-shrink-0">
                  <RiHomeSmileFill size={22} />
                </div>
                <div className="flex-1 min-w-0"> {/* เพิ่ม flex-1 และ min-w-0 เพื่อให้ตัดคำได้ */}
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dormitory & Room</p>
                  <p className="text-sm font-bold text-gray-700 truncate" title={`${currentBooking.room.campus} — ${currentBooking.room.roomId}`}>
                    Campus: {currentBooking.room.campus}
                    <br />
                    Room: {currentBooking.room.roomId}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">
                    Floor {currentBooking.room.floor} • {currentBooking.room.roomType}
                  </p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-400 flex-shrink-0">
                  <MdEmail size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</p>
                  <div className="mt-0.5 space-y-0.5">
                    <p className="text-[12px] font-bold text-gray-700 truncate" title={currentBooking.cus_users?.email}>
                      <span className="text-gray-400 font-medium mr-1">Email:</span>
                      {currentBooking.cus_users?.email}
                    </p>
                    <p className="text-[12px] font-bold text-gray-700 truncate">
                      <span className="text-gray-400 font-medium mr-1">Phone:</span>
                      {currentBooking.cus_users?.mobilePhone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนล่าง: สถานะการตรวจสอบ */}
          <div className="p-4 bg-blue-50 flex items-center justify-center gap-2 border-t border-blue-200">
            <MdInfo className="text-blue-500" size={18} />
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">Status: Verifying - เจ้าหน้าที่กำลังตรวจสอบ</span>
          </div>
        </div>

        {/* กล่องคำเตือนสีส้ม (ทำให้จางลง) */}
        <div className="px-4 mb-8">
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-center">
            <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
              ระบบจะส่งผลการอนุมัติให้คุณทางอีเมลภายใน <span className="font-bold underline">24-48 ชั่วโมง</span>
            </p>
          </div>
        </div>

        {/* ปุ่ม Action */}
        <div className="flex flex-col md:flex-row gap-4 px-2">
          <PrintButton />
          <HomeButton isSuccess={true} />
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Pay a deposit / ชำระเงินค่ามัดจำ"
    >
      <div className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold my-4 ${timeLeft < 60 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-orange-50 text-orange-500'
        }`}>
        <LuAlarmClock className="text-lg text-green-700" />
        {timeLeft > 0
          ? `กรุณาชำระเงินภายใน ${formatTime(timeLeft)} นาที`
          : 'หมดเวลาชำระเงิน'}
      </div>

      <PaymentInstructions />
      <PaymentAllocation />

      <div className="bg-gray-50 p-8 rounded-[2rem] flex flex-col items-center border-2 border-dashed border-gray-200">
        <div className="bg-white p-4 rounded-2xl shadow-md mb-6">
          {/* ส่วนนี้ใช้ Image QR Code ของจริงหรือ Mockup */}
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-400">
            <MdQrCodeScanner size={100} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total payment - ยอดชำระทั้งสิ้น</p>
          <p className="text-4xl font-black text-[#126A31]">{formRoom.price?.toLocaleString()} <span className="text-lg font-normal text-gray-400">THB</span></p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* Upload Section: Minimalist Design */}
        <div className="space-y-6">
          <div
            onClick={() => !selectedFile && fileInputRef.current?.click()} // ถ้ามีรูปแล้ว ไม่ต้องกดซ้ำ
            className={`group relative overflow-hidden border-2 border-dashed rounded-3xl transition-all
          ${selectedFile ? 'border-[#126A31] bg-white' : 'border-gray-200 hover:border-[#126A31] hover:bg-green-50 cursor-pointer p-8 flex flex-col items-center'}`}
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />

            {selectedFile && previewUrl ? (
              /* ส่วนแสดงรูป Preview */
              <div className="relative w-full aspect-[3/4] md:aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Payment Slip"
                  className="w-full h-full object-contain"
                />

                {/* ปุ่มลบรูปออก */}
                <button
                  onClick={handleClearFile}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 active:scale-90 transition-all z-10"
                >
                  <MdClose size={20} />
                </button>

                {/* Overlay จางๆ บอกชื่อไฟล์ */}
                <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white p-3 text-[12px] backdrop-blur-sm">
                  {selectedFile.name}
                </div>
              </div>
            ) : (
              /* ส่วน UI เดิมตอนยังไม่ได้เลือกรูป */
              <>
                <MdCloudUpload size={40} className={'text-gray-300 group-hover:text-[#126A31]'} />
                <p className="mt-3 font-bold text-sm text-gray-600">
                  Upload Payment Slip / แนบรูปสลิป
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">JPG, PNG up to 5MB</p>
              </>
            )}
          </div>
        </div>

        {/* ปุ่มจำลองสถานการณ์สำหรับ Dev */}
        <button
          onClick={handlePaymentSuccess}
          className="w-full py-4 bg-[#126A31] text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-green-100"
        >
          จำลองการจ่ายเงิน และอัปโหลดสลีปโอนเงินสำเร็จ (Simulate Success)
          {isLoading && <LoadingOverlay message="Saving booking information...." />}
        </button>

        <div className="w-full p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
          <p className="text-center text-amber-700 text-[11px] leading-relaxed font-medium">
            <span className="font-bold">⚠️ สำคัญ:</span> ระบบล็อกห้องไว้ให้แล้ว แต่ถ้าคุณไม่ชำระเงินให้สำเร็จภายในเวลาที่กำหนด ระบบก็จะยกเลิกการจองของคุณโดยอัตโนมัติ
          </p>
        </div>
      </div>
    </Container>
  );
}