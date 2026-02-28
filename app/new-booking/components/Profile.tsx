// app/new-booking/components/Profile.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { HiCamera, HiIdentification } from "react-icons/hi";
import { MdClose, MdInfoOutline } from "react-icons/md";
import toast from "react-hot-toast"; // แนะนำให้ใช้ toast ที่คุณมี
import { useBooking } from "@/app/contexts/BookingContext";
import { BookingStatus } from "@/types/booking";

export function ProfileStep({ setStep }: { setStep: (s: number) => void }) {
  const { formResident, setFormResident, isEditMode, setIsEditMode, currentBooking, setCurrentBooking } = useBooking();
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [idCardImage, setIdCardImage] = useState<string | null>(null);

  // เพิ่ม State เก็บชื่อไฟล์เพื่อให้ UI อัปเดตทันที
  const [idFileName, setIdFileName] = useState<string>("");

  const faceInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'id') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. ตรวจสอบประเภทไฟล์ (MIME Type)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) เท่านั้น");
      e.target.value = ""; // Clear input
      return;
    }

    // 2. ตรวจสอบขนาดไฟล์ (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดรูปไม่เกิน 5MB");
      e.target.value = "";
      return;
    }

    // 3. สร้าง Preview URL
    const imageUrl = URL.createObjectURL(file);
    if (type === 'face') {
      setFaceImage(imageUrl);
    } else {
      setIdCardImage(imageUrl);
      setIdFileName(file.name); // เก็บชื่อไฟล์บัตรประชาชน
    }

    // *** หัวใจสำคัญ: ล้างค่า value ใน input เพื่อให้เลือกไฟล์เดิมซ้ำได้ ***
    e.target.value = "";
  };

  const handleClearImage = (type: 'face' | 'id') => {
    if (type === 'face') {
      setFaceImage(null);
    } else {
      setIdCardImage(null);
      setIdFileName("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      {currentBooking?.status === BookingStatus.REJECTED && (
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
          <p className="text-amber-800 font-bold text-sm flex items-center gap-2 uppercase">
            <MdInfoOutline size={18} /> Staff Feedback:
          </p>
          <p className="text-amber-900 text-sm mt-1">"{currentBooking.remark}"</p>
        </div>
      )}

      <h2 className="text-[24px] font-semibold text-gray-700">Student Profile /</h2>
      <h2 className="text-[24px] font-semibold text-gray-700 mb-4">รูปหน้าตรง และบัตรประชาชนนักศึกษา</h2>

      <div className="space-y-10">
        {/* --- ส่วนอัปโหลดรูปหน้าตรง --- */}
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">กรุณาอัปโหลดรูปถ่ายหน้าตรง</p> {/* <span className="text-red-500"> *</span> */}
          <p className="text-xs text-gray-400 mb-4">**ต้องเป็นรูปหน้าตรง เห็นใบหน้าชัดเจน เพื่อใช้สำหรับสแกนใบหน้าเข้าอาคารหอพัก</p>

          <input
            type="file"
            ref={faceInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileChange(e, 'face')}
          />

          <div
            onClick={() => !faceImage && faceInputRef.current?.click()}
            className={`w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${faceImage ? "border-transparent" : "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              }`}
          >
            {faceImage ? (
              <>
                <img src={faceImage} alt="Face Preview" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleClearImage('face'); }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                  <MdClose size={20} />
                </button>
              </>
            ) : (
              <div className="text-center">
                <HiCamera size={48} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm font-bold">คลิกเพื่ออัปโหลดรูปหน้าตรง</p>
              </div>
            )}
          </div>
        </div>

        {/* --- ส่วนอัปโหลดบัตรประชาชน --- */}
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">กรุณาอัปโหลดรูปถ่ายบัตรประจำตัวประชาชน</p> {/* <span className="text-red-500"> *</span> */}
          <p className="text-xs text-gray-400 mb-4">*เฉพาะบัตรประจำตัวประชาชนเท่านั้น ไม่สามารถใช้เอกสารอื่นแทนได้</p>

          <input
            type="file"
            ref={idInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileChange(e, 'id')}
          />

          <div className="flex flex-col gap-3">
            {/* <div className="flex items-center">
              <button 
                type="button"
                onClick={() => idInputRef.current?.click()}
                className="bg-[#4CAF50] text-white px-6 py-2 rounded-l-xl font-bold hover:bg-[#3d8b40] transition-colors whitespace-nowrap"
              >
                Choose File
              </button>
              <div className="bg-gray-100 flex-grow py-2 px-4 rounded-r-xl text-gray-500 text-sm truncate border-y border-r border-gray-200 min-h-[40px] flex items-center">
                {idFileName || "ยังไม่ได้เลือกไฟล์..."}
              </div>
            </div> */}

            <div
              onClick={() => !idCardImage && idInputRef.current?.click()}
              className={`w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${idCardImage ? "border-transparent" : "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                }`}
            >
              {idCardImage ? (
                <>
                  <img src={idCardImage} alt="ID Card Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearImage('id'); }}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                  >
                    <MdClose size={20} />
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <HiIdentification size={48} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-bold">คลิกเพื่ออัปโหลดรูปบัตรประชาชน</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-12">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-[#7D856C] text-white py-3 rounded-2xl font-bold hover:bg-black transition-all"
        >
          Back
        </button>
        <button
          onClick={() => {
            // if (!faceImage || !idCardImage) {
            //   toast.error("กรุณาอัปโหลดรูปให้ครบทั้ง 2 รายการ", { id: 'upload-error' });
            //   return;
            // }
            setStep(3);
          }}
          className="flex-1 bg-[#006633] text-white py-3 rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-black transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}