// app/not-found.tsx
// import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
      {/* ใส่รูปประกอบเก๋ๆ หรือ Icon หอพัก */}
      <div className="relative w-64 h-64 mb-8">
        <Image
          src="/images/not-found-page.png" // ไปหารูปการ์ตูนหอพักหรือกุญแจที่หาไม่เจอมาใส่
          alt="404 Not Found"
          fill
          className="object-contain"
        />
      </div>

      <h1 className="text-4xl font-black text-[#126A31] mb-2">404 - หา /path นี้ไม่เจอ!</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        ดูเหมือนว่าเส้นทางที่คุณพิมพ์มาจะไม่มีอยู่ในหอพักของเรา
        ลองตรวจสอบ URL อีกครั้ง หรือกลับไปที่หน้าหลักดูนะครับ
      </p>

      <a
        href="/" 
        className="px-8 py-3 bg-[#126A31] text-white rounded-xl font-bold hover:bg-[#0d4d24] transition-all shadow-lg cursor-pointer"
      >
        กลับสู่หน้าหลัก
      </a>
    </div>
  )
}