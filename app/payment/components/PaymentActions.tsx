// payment/components/PaymentAction.tsx
"use client"

import React, { useRef, useState } from 'react'
import { customFetch } from '@/utils/custom-api';

// components
import { LoadingOverlay } from '@/components/Loading/LoadingOverlay';
import DownloadQRButton from './DownloadQRButton';

// icons
import { MdClose, MdCloudUpload } from 'react-icons/md';

interface PaymentActionsPros {
  bookingId: number;
  qrUrl: string;
}

const PaymentActions = ({ bookingId, qrUrl }: PaymentActionsPros) => {
  const [isLoading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handlePaymentSuccess = async () => {
    // เรียกใช้ bookingId ที่เราพึ่งเซตไปใน Step ก่อนหน้า
    // const bId = booking.id;
    setLoading(true);

    if (!bookingId) {
      alert("ไม่พบรหัสใบจอง (Booking ID)");
      return;
    }

    try {
      const res = await customFetch("/api/bookings/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingId })
      });

      // if (res.ok) setIsVerifying(true);
      if (res.ok) {
        // อาจจะใช้ window.location.reload() หรือ router.refresh() 
        // เพื่อให้ Server Component ดึงสถานะใหม่มาแสดง
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DownloadQRButton qrUrl={qrUrl} bookingId={bookingId} />

      <div className="mt-4 space-y-4">
        {/* Upload Section */}
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
              /* ส่วน UI ตอนยังไม่ได้เลือกรูป */
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
          disabled={isLoading}
          className="w-full py-4 bg-[#126A31] text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-green-100 disabled:bg-gray-400"
        >
          {isLoading ? "กำลังประมวลผล..." : "จำลองการจ่ายเงิน และอัปโหลดสลีปโอนเงินสำเร็จ (Simulate Success)"}
        </button>

        {isLoading && <LoadingOverlay message="Saving booking information...." />}
      </div>
    </>
  )
}

export default PaymentActions
