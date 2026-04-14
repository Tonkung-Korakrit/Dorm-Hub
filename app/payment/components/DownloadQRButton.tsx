// payment/components/DownloadQRButton.tsx
'use client';

// icons
import { MdCloudUpload } from "react-icons/md";

interface DownloadQRButtonProps {
  qrUrl: string;
  bookingId: number;
}

export default function DownloadQRButton({ qrUrl, bookingId }: DownloadQRButtonProps) {
  // วิธีการดาวน์โหลดไฟล์ภาพ
  // const handleDownloadQR = () => {
  //   const link = document.createElement('a');
  //   link.href = qrUrl;
  //   link.download = `Tudorm-QR-Booking-${bookingId}.png`;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const handleDownloadQR = async () => {
    try {
      // 1. ดึงข้อมูลรูปภาพ
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('Network response was not ok');

      // 2. แปลงเป็น Blob
      const blob = await response.blob();

      // 3. สร้าง URL ชั่วคราวจาก Blob
      const url = window.URL.createObjectURL(blob);

      // 4. สร้างลิงก์หลอกๆ ขึ้นมาคลิก
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tudorm-QR-Booking-${bookingId}.png`;
      document.body.appendChild(link);
      link.click();

      // 5. ทำความสะอาด
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      // ถ้าพังจริงๆ ให้เปิดรูปในแท็บใหม่เพื่อให้ User กดค้างเซฟเอง (Fallback)
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