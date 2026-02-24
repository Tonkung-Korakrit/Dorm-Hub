"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { MdCheckCircle, MdTimer, MdQrCodeScanner, MdEmail, MdErrorOutline, MdCloudUpload, MdClose } from "react-icons/md";
import { RiLineFill } from "react-icons/ri";
import { LoadingOverlay } from "@/app/loading/components/LoadingOverlay";
import { customFetch } from "@/lib/api";

export function PaymentPage() {
  const { formResident, formRoom, currentBooking } = useBooking();
  const [timeLeft, setTimeLeft] = useState(600); // 10 นาที
  const [isVerifying, setIsVerifying] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // console.log("currentBooking: ", currentBooking)

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
  // useEffect(() => {
  //   if (timeLeft <= 0 || isVerifying) return;
  //   const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
  //   return () => clearInterval(timer);
  // }, [timeLeft, isVerifying]);

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
    // Cleanup function
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // const handleUploadPayment = async () => {
  //   if (!selectedFile) return alert("กรุณาแนบรูปภาพสลิปการโอนเงินครับ");

  //   setIsUploading(true);
  //   const bId = currentBooking.id;

  //   try {
  //     // ในชีวิตจริง คุณต้องใช้ FormData เพื่อส่งไฟล์
  //     const formData = new FormData();
  //     formData.append("bookingId", bId.toString());
  //     formData.append("paymentProof", selectedFile);

  //     const res = await fetch("/api/bookings/upload-proof", {
  //       method: "POST",
  //       body: formData, // ส่งเป็น FormData
  //     });

  //     if (res.ok) setIsVerifying(true);
  //   } catch (err) {
  //     console.error(err);
  //     alert("เกิดข้อผิดพลาดในการอัปโหลด");
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

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

  if (isExpired) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
        <MdErrorOutline className="text-red-500 text-8xl mx-auto mb-6" />
        <h1 className="text-[24px] font-black text-gray-800 mb-2">หมดเวลาชำระเงิน</h1>
        <p className="text-gray-500 mb-8">ขออภัย รายการจองของคุณถูกยกเลิกอัตโนมัติเนื่องจากเกินเวลาที่กำหนด (10 นาที)</p>
        <button
          onClick={() => window.location.href = "/new-booking"}
          className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
        >
          กลับไปเลือกห้องใหม่
        </button>
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
      <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-center">
        <MdCheckCircle className="text-[#126A31] text-8xl mx-auto mb-6 animate-bounce" />
        <h1 className="text-2xl font-black text-gray-800 mb-2">ได้รับหลักฐานเรียบร้อย!</h1>
        <p className="text-gray-500 mb-8">เจ้าหน้าที่กำลังตรวจสอบยอดเงินของคุณ ระบบจะแจ้งผลทางอีเมลภายใน 24 ชม.</p>

        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 mb-8 text-left">
          <p className="text-sm text-emerald-800 font-bold mb-2">ข้อมูลการตรวจสอบ:</p>
          <ul className="text-sm text-emerald-700 space-y-1">
            <li>• สถานะ: <span className="font-bold">รอการยืนยัน (VERIFYING)</span></li>
            <li>• อีเมลแจ้งเตือน: {formResident.email}</li>
          </ul>
        </div>

        <button onClick={() => window.location.href = "/"} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-[24px] font-semibold text-gray-700 mb-4">Pay a deposit</h2>
        <p className="text-gray-400 text-sm">กรุณาชำระเงิน และอัปโหลดสลิปเพื่อยืนยันสิทธิ์การจองห้องพัก</p>
      </div>

      {/* Timer Bar */}
      <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl mb-8 ${timeLeft < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-orange-50 text-orange-600"}`}>
        <MdTimer size={24} />
        <span className="text-2xl font-mono font-black">{formatTime(timeLeft)}</span>
      </div>

      <div className="bg-gray-50 p-8 rounded-[2rem] flex flex-col items-center border-2 border-dashed border-gray-200">
        <div className="bg-white p-4 rounded-2xl shadow-md mb-6">
          {/* ส่วนนี้ใช้ Image QR Code ของจริงหรือ Mockup */}
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-400">
            <MdQrCodeScanner size={100} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">ยอดชำระทั้งสิ้น</p>
          <p className="text-4xl font-black text-[#126A31]">{formRoom.price?.toLocaleString()} <span className="text-lg font-normal text-gray-400">THB</span></p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl text-[12px] text-blue-700">
          <span className="font-bold">💡 วิธีการ:</span>
          <p>เปิดแอปธนาคารของคุณ สแกน QR Code ด้านบนเพื่อชำระเงิน ระบบจะตรวจสอบยอดเงินอัตโนมัติภายใน 1-2 นาที</p>
        </div>

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
          {isLoading && <LoadingOverlay message="กำลังบันทึกข้อมูลการจอง..." />}
        </button>
      </div>
    </div >
  );
}