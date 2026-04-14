// app/new-booking/components/Profile.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { BookingStatus } from "@/utils/types";

// context
import { useBooking } from "@/app/contexts/BookingContext";

// hook
import { useScrollTop } from "@/hooks/useScrollTop";

// components
import Container from "@/components/Container";

import toast from "react-hot-toast";

// icons
import { HiCamera, HiIdentification } from "react-icons/hi";
import { MdClose, MdInfoOutline } from "react-icons/md";

export function ProfileStep({ setStep }: { setStep: (s: number) => void }) {
  const { isEditMode, currentBooking } = useBooking();
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [idCardImage, setIdCardImage] = useState<string | null>(null);

  const [idFileName, setIdFileName] = useState<string>("");

  const faceInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  useScrollTop();

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

  const handleNextStep = () => {
    setStep(3)
  }

  const handleBackStep = () => {
    setStep(1)
  }

  return (
    <Container
      title="Student Profile / รูปหน้าตรง และบัตรประชาชนนักศึกษา"
      rejected={currentBooking?.status === BookingStatus.REJECTED}
      handleNextStep={handleNextStep}
      handleBackStep={handleBackStep}
      isEditMode={isEditMode}
    >
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
    </Container >
  );
}