// app/new-booking/components/Profile.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HiCamera, HiIdentification } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import toast from "react-hot-toast";
import { useBooking } from "@/app/contexts/BookingContext";
import { BookingStatus, Resident } from "@/utils/types";
import Card from "@/components/Container";
import { useScrollTop } from "@/hooks/useScrollTop";
import Container from "@/components/Container";

const getProfileImagePath = (
  profileImages: Resident["profileImage"],
  type: "FACE_PHOTO" | "CITIZEN_CARD",
) => profileImages?.find((image) => image.type === type)?.path || null;

export function ProfileStep({ setStep }: { setStep: (s: number) => void }) {
  const { formResident, setFormResident, isEditMode, currentBooking } =
    useBooking();
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [idFileName, setIdFileName] = useState<string>("");

  const faceInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  useScrollTop();

  const faceImagePath = useMemo(
    () => getProfileImagePath(formResident.profileImage, "FACE_PHOTO"),
    [formResident.profileImage],
  );
  const citizenCardPath = useMemo(
    () => getProfileImagePath(formResident.profileImage, "CITIZEN_CARD"),
    [formResident.profileImage],
  );

  useEffect(() => {
    if (formResident.facePhotoFile) {
      const previewUrl = URL.createObjectURL(formResident.facePhotoFile);
      setFaceImage(previewUrl);

      return () => URL.revokeObjectURL(previewUrl);
    }

    setFaceImage(faceImagePath);
  }, [faceImagePath, formResident.facePhotoFile]);

  useEffect(() => {
    if (formResident.citizenCardFile) {
      const previewUrl = URL.createObjectURL(formResident.citizenCardFile);
      setIdCardImage(previewUrl);
      setIdFileName(formResident.citizenCardFile.name);

      return () => URL.revokeObjectURL(previewUrl);
    }

    setIdCardImage(citizenCardPath);
    setIdFileName(
      citizenCardPath ? citizenCardPath.split("/").pop() || "" : "",
    );
  }, [citizenCardPath, formResident.citizenCardFile]);

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "face" | "id") => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  //   if (!allowedTypes.includes(file.type)) {
  //     toast.error("รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) เท่านั้น");
  //     e.target.value = "";
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     toast.error("ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดรูปไม่เกิน 5MB");
  //     e.target.value = "";
  //     return;
  //   }

  //   const imageUrl = URL.createObjectURL(file);
  //   if (type === "face") {
  //     // setFaceImage(imageUrl);
  //     setFormResident((prev) => ({
  //       ...prev,
  //       facePhotoFile: file,
  //       profileImage: (prev.profileImage || []).filter((image) => image.type !== "FACE_PHOTO"),
  //     }));
  //   } else {
  //     // setIdCardImage(imageUrl);
  //     setIdFileName(file.name);
  //     setFormResident((prev) => ({
  //       ...prev,
  //       citizenCardFile: file,
  //       profileImage: (prev.profileImage || []).filter((image) => image.type !== "CITIZEN_CARD"),
  //     }));
  //   }

  //   e.target.value = "";
  // };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "face" | "id",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP) เท่านั้น");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดรูปไม่เกิน 5MB");
      e.target.value = "";
      return;
    }

    try {
      // 💉 โคลนนิ่งไฟล์ดูดเข้า RAM ป้องกันมือถือแอบเคลียร์เมมมอรี่
      const arrayBuffer = await file.arrayBuffer();
      const persistentFile = new File([arrayBuffer], file.name, {
        type: file.type,
      });

      // สร้าง URL สำหรับ Preview จากไฟล์ที่โคลนแล้ว
      const imageUrl = URL.createObjectURL(persistentFile);

      if (type === "face") {
        // setFaceImage(imageUrl);
        setFormResident((prev) => ({
          ...prev,
          facePhotoFile: persistentFile, // 👈 ใช้ไฟล์โคลน (persistentFile) แทน file
          profileImage: (prev.profileImage || []).filter(
            (image) => image.type !== "FACE_PHOTO",
          ),
        }));
      } else {
        // setIdCardImage(imageUrl);
        setIdFileName(persistentFile.name);
        setFormResident((prev) => ({
          ...prev,
          citizenCardFile: persistentFile, // 👈 ใช้ไฟล์โคลน (persistentFile) แทน file
          profileImage: (prev.profileImage || []).filter(
            (image) => image.type !== "CITIZEN_CARD",
          ),
        }));
      }
    } catch (err) {
      console.error("สร้างไฟล์โคลนไม่สำเร็จ:", err);
      toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาลองเลือกรูปใหม่อีกครั้ง");
    } finally {
      // ล้างค่า input เพื่อให้ผู้ใช้สามารถคลิกเลือก "ไฟล์เดิม" ซ้ำได้เสมอ
      e.target.value = "";
    }
  };

  const handleClearImage = (type: "face" | "id") => {
    if (type === "face") {
      setFaceImage(null);
      setFormResident((prev) => ({
        ...prev,
        facePhotoFile: null,
        profileImage: (prev.profileImage || []).filter(
          (image) => image.type !== "FACE_PHOTO",
        ),
      }));
      // ล้างค่า input เพื่อให้อัปโหลดไฟล์เดิมซ้ำได้
      if (faceInputRef.current) faceInputRef.current.value = "";
    } else {
      setIdCardImage(null);
      setIdFileName("");
      setFormResident((prev) => ({
        ...prev,
        citizenCardFile: null,
        profileImage: (prev.profileImage || []).filter(
          (image) => image.type !== "CITIZEN_CARD",
        ),
      }));
      //ล้างค่า input เพื่อให้อัปโหลดไฟล์เดิมซ้ำได้
      if (idInputRef.current) idInputRef.current.value = "";
    }
  };

  const handleNextStep = () => {
    const hasFacePhoto = Boolean(formResident.facePhotoFile || faceImagePath);
    const hasCitizenCard = Boolean(
      formResident.citizenCardFile || citizenCardPath,
    );

    if (!hasFacePhoto || !hasCitizenCard) {
      toast.error("กรุณาอัปโหลดรูปหน้าตรงและรูปบัตรประชาชนให้ครบถ้วน", {
        id: "profile-image-required",
      });
      return;
    }

    setStep(3);
  };

  const handleBackStep = () => {
    setStep(1);
  };

  console.log("formResident in profile: ", formResident);

  return (
    <Container
      title="Student Profile / รูปหน้าตรง และบัตรประชาชนนักศึกษา"
      pending_correction={
        currentBooking?.status === BookingStatus.PENDING_CORRECTION
      }
      handleNextStep={handleNextStep}
      handleBackStep={handleBackStep}
      isEditMode={isEditMode}
    >
      <div className="space-y-10">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">
            กรุณาอัปโหลดรูปถ่ายหน้าตรง
          </p>
          <p className="text-xs text-gray-400 mb-4">
            **ต้องเป็นรูปหน้าตรง เห็นใบหน้าชัดเจน
            เพื่อใช้สำหรับสแกนใบหน้าเข้าอาคารหอพัก
          </p>

          <input
            type="file"
            ref={faceInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            onChange={(e) => handleFileChange(e, "face")}
            onError={() => handleClearImage("face")}
          />

          <div
            onClick={() => !faceImage && faceInputRef.current?.click()}
            className={`w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${faceImage ? "border-transparent" : "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"}`}
          >
            {faceImage ? (
              <>
                <img
                  src={faceImage}
                  alt="Face Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearImage("face");
                  }}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                  <MdClose size={20} />
                </button>
              </>
            ) : (
              <div className="text-center">
                <HiCamera size={48} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm font-bold">
                  คลิกเพื่ออัปโหลดรูปหน้าตรง
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">
            กรุณาอัปโหลดรูปถ่ายบัตรประจำตัวประชาชน
          </p>
          <p className="text-xs text-gray-400 mb-4">
            *เฉพาะบัตรประจำตัวประชาชนเท่านั้น ไม่สามารถใช้เอกสารอื่นแทนได้
          </p>

          <input
            type="file"
            ref={idInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileChange(e, "id")}
            onError={() => handleClearImage("id")}
          />

          <div className="flex flex-col gap-3">
            <div
              onClick={() => !idCardImage && idInputRef.current?.click()}
              className={`w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${idCardImage ? "border-transparent" : "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"}`}
            >
              {idCardImage ? (
                <>
                  <img
                    src={idCardImage}
                    alt="ID Card Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearImage("id");
                    }}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                  >
                    <MdClose size={20} />
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <HiIdentification
                    size={48}
                    className="text-gray-300 mx-auto mb-2"
                  />
                  <p className="text-gray-400 text-sm font-bold">
                    คลิกเพื่ออัปโหลดรูปบัตรประชาชน
                  </p>
                </div>
              )}
            </div>

            {/* {idFileName && (
              <p className="text-xs text-gray-500 truncate">ไฟล์ที่เลือก: {idFileName}</p>
            )} */}
          </div>
        </div>
      </div>
    </Container>
  );
}
