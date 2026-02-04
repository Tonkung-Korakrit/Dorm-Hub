"use client";

import { useEffect } from "react";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi";

export function ProfileStep({ setStep }: { setStep: (s: number) => void }) {

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-[24px] font-semibold text-gray-700">Student Profile /</h2>
      <h2 className="text-[24px] font-semibold text-gray-700 mb-4">รูปหน้าตรง และบัตรประชาชนนักศึกษา</h2>

      <div className="space-y-10">
        {/* ส่วนอัปโหลดรูปหน้าตรง */}
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">กรุณาอัปโหลดรูปถ่ายหน้าตรง<span className="text-red-500">*</span></p>
          <p className="text-xs text-gray-400 mb-4">**ต้องเป็นรูปหน้าตรง เห็นใบหน้าชัดเจน เพื่อใช้สำหรับสแกนใบหน้าเข้าอาคารหอพัก</p>
          <div className="w-full h-48 bg-gray-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
            <button className="px-8 py-2 bg-[#006432] text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform z-10">
              Click
            </button>
            {/* พื้นที่สำหรับพรีวิวรูปจะอยู่ตรงนี้ */}
          </div>
        </div>

        {/* ส่วนอัปโหลดบัตรประชาชน */}
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">กรุณาอัปโหลดรูปถ่ายบัตรประจำตัวประชาชน<span className="text-red-500">*</span></p>
          <p className="text-xs text-gray-400 mb-4">*เฉพาะบัตรประจำตัวประชาชนเท่านั้น ไม่สามารถใช้เอกสารอื่นแทนได้</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center">
              <label className="bg-[#4CAF50] text-white px-6 py-2 rounded-l-lg cursor-pointer font-bold hover:bg-[#3d8b40]">
                Choose File
                <input type="file" className="hidden" />
              </label>
              <div className="bg-gray-100 flex-grow py-2 px-4 rounded-r-lg text-gray-400 text-sm">
                Ads ... .png
              </div>
            </div>
            <div className="w-full h-48 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </div>

      {/* ปุ่มควบคุม */}
      <div className="flex gap-2 mt-12 text-[16px]">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-[#7D856C] text-white px-6 py-2 rounded-xl shadow-lg hover:bg-gray-600 transition-all"
        >
          Back
          {/* ← */}
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex-1 bg-[#006633] text-white px-6 py-2 rounded-xl shadow-lg hover:bg-black transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}