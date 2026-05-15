'use client';

import { MdDownload } from "react-icons/md";
import { toPng } from 'html-to-image';

const DownloadEvidenceButton = () => {
  const handleDownload = async () => {
    // ระบุ ID ของส่วนที่ต้องการจะแคปภาพ (เช่น div ที่ครอบใบเสร็จไว้)
    const element = document.getElementById('booking-receipt');
    
    if (!element) {
      // Fallback ถ้าหา element ไม่เจอ ให้ใช้ print ปกติ
      window.print();
      return;
    }

    try {
      const dataUrl = await toPng(element, { cacheBust: true });
      const link = document.createElement('a');
      link.download = 'Tudorm-Evidence.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
      window.print(); // ถ้าพังให้กลับไปใช้ print มาตรฐาน
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="flex-1 py-4 bg-gray-400 text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 print:hidden"
    >
      <MdDownload size={20} /> Record of evidence
    </button>
  );
}

export default DownloadEvidenceButton;