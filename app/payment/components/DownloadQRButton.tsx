'use client';

import { MdCloudUpload } from "react-icons/md";

interface DownloadQRButtonProps {
  qrUrl: string;
  bookingId: number;
}

export default function DownloadQRButton({ qrUrl, bookingId }: DownloadQRButtonProps) {
  
  const handleDownloadQR = async () => {
    try {
      const fileName = `Tudorm-QR-Booking-${bookingId}.png`;
      
      // 1. ดึงข้อมูลรูปภาพเป็น Blob
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      
      // 2. ตรวจสอบว่า Browser รองรับ Web Share API และสามารถแชร์ไฟล์ได้หรือไม่ (เน้นมือถือ)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: blob.type });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'QR Code สำหรับชำระเงิน',
            text: 'บันทึกรูปภาพเพื่อใช้ชำระเงินผ่านแอปธนาคาร',
          });
          return; // จบการทำงานสำหรับมือถือที่รองรับ
        }
      }

      // 3. Fallback สำหรับ Desktop หรือ Browser ที่ไม่รองรับ Web Share
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      // ถ้าพังจริงๆ ให้เปิดรูปในแท็บใหม่
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <button
      onClick={handleDownloadQR}
      className="mb-2 flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold text-sm hover:border-[#126A31] hover:text-[#126A31] hover:bg-green-50 transition-all active:scale-95"
    >
      <MdCloudUpload size={20} className="rotate-180" />
      บันทึกรูปภาพ QR Code
    </button>
  );
}