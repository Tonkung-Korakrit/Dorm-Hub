'use client'; // 🚀 เฉพาะไฟล์นี้ที่เป็น Client Component

import { MdPrint } from "react-icons/md";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="flex-1 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-200 print:hidden"
    >
      <MdPrint size={20} /> พิมพ์หลักฐาน (Print)
    </button>
  );
}