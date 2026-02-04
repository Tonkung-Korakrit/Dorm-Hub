"use client";
import { useEffect } from "react";

export function VehicleStep({ setStep }: { setStep: (s: number) => void }) {
  
  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-[24px] font-semibold text-gray-700 mb-4">Vehicle Registration / ข้อมูลรถยนต์</h2>

      {/* คำเตือนสีแดง */}
      <div className="text-center text-red-500 text-[14px] font-bold space-y-1 mb-10 italic">
        <p>เฉพาะรถของนักศึกษาหรือผู้ปกครอง</p>
        <p>สำหรับการผ่านเข้าเขตที่พักอาศัยเท่านั้น</p>
        <p>มิใช่การอนุญาตให้จอดรถยนต์ค้างคืน</p>
      </div>

      <div className="space-y-4">
        {/* ทะเบียนรถ */}
        <div>
          <label className="block text-[16px] font-bold text-gray-700 mb-2">
            License Plate ID / ทะเบียนรถยนต์
          </label>
          <p className="text-[14px] text-gray-400 mb-3 uppercase tracking-tighter">ระบุหมวดอักษร และเลขทะเบียนโดยไม่ต้องเว้นวรรค หรือมีเครื่องหมายขีด เช่น 1กภ2345</p>
          <input
            type="text"
            placeholder="เช่น 1กภ2345"
            className="w-full border-b-2 border-gray-300 py-2 focus:border-[#006432] outline-none transition-colors font-medium"
          />
        </div>

        {/* อัปโหลดรายการจดทะเบียน */}
        <div>
          <p className="text-[14px] font-bold text-gray-700 mb-4 italic">Upload a photo of the vehicle registration file. / อัพโหลดภาพถ่ายรายการจดทะเบียนรถหน้าล่าสุด</p>
          <div className="flex items-center mb-4">
            <label className="bg-[#4CAF50] text-white px-6 py-2 rounded-l-lg cursor-pointer font-bold shrink-0">
              Choose File
              <input type="file" className="hidden" />
            </label>
            <div className="bg-gray-100 flex-grow py-2 px-4 rounded-r-lg text-gray-400 text-sm overflow-hidden whitespace-nowrap">
              Ads ... .png
            </div>
          </div>
          <div className="w-full h-40 bg-gray-200 rounded-3xl"></div>
        </div>

        {/* จังหวัด */}
        <div>
          <label className="block text-[16px] font-bold text-gray-700 mb-3">License Plate Province / จังหวัดที่จดทะเบียนรถยนต์</label>
          <select className="w-full bg-[#006432] text-white py-2 px-4 rounded-md font-bold appearance-none cursor-pointer">
            <option>Province</option>
            <option>กรุงเทพมหานคร</option>
            <option>ปทุมธานี</option>
            {/* จังหวัดอื่นๆ... */}
          </select>
        </div>
      </div>

      {/* ปุ่มควบคุม */}
      <div className="flex gap-2 mt-12 text-[16px]">
        <button onClick={() => setStep(2)} className="flex-1 bg-[#7D856C] text-white px-6 py-2 rounded-xl shadow-lg">Back</button>
        <button onClick={() => setStep(4)} className="flex-1 bg-[#006633] text-white px-6 py-2 rounded-xl shadow-lg">Next</button>
      </div>
    </div>
  );
}