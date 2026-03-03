'use client'; // 🚀 บรรทัดนี้สำคัญที่สุด

import { MdCloudUpload } from "react-icons/md";

interface Props {
  qrUrl: string;
  bookingId: number;
}

export default function DownloadQRButton({ qrUrl, bookingId }: Props) {
  // const handleDownloadQR = async () => {
  //   try {
  //     const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(qrUrl)}`;
  //     const response = await fetch(proxyUrl);
  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);

  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = `DormHub-QR-${bookingId}.png`;
  //     link.click();
  //     window.URL.revokeObjectURL(url);
  //   } catch (e) {
  //     alert("ดาวน์โหลดไม่สำเร็จ กรุณาแคปหน้าจอแทนครับ");
  //   }
  // };

  const handleDownloadQR = () => {
    // วิธีการดาวน์โหลดไฟล์ภาพ
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `Tudorm-QR-Booking-${bookingId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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