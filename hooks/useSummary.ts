// hooks/useSummary.ts
"use client";

import React, { ChangeEvent, useState } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { BookingStatus } from "@/utils/types";
import { useRouter } from "next/navigation";
import { customFetch } from "@/utils/custom-api";

const useSummary = (setStep: (step: number) => void) => {
  const {
    formResident,
    formRoom,
    currentBooking,
    setCurrentBooking,
    ownerInfo,
    setIsEditMode,
    // vehicle,
  } = useBooking();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAcceptAgreement, setIsAccepstAgreement] = useState(false);
  const isResubmitting =
    currentBooking?.status === BookingStatus.PENDING_CORRECTION;
  const [bookingError, setBookingError] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
  } | null>(null);

  const router = useRouter();

  const uploadProfileImage = async (
    file: File,
    type: "face" | "citizen-card",
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const uploadRes = await fetch("/api/upload/profile", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.success || !uploadData.path) {
      throw new Error(uploadData.message || "Profile upload failed");
    }

    return uploadData.path as string;
  };

  const handleEdit = (targetStep: number) => {
    setIsEditMode(true);
    setStep(targetStep);
  };

  const handleCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
    setIsAccepstAgreement(e.target.checked);
  };

  const handleFinalConfirm = async () => {
    // console.log("3. FormResident before Submit:", formResident.vehicleInfo);
    setIsSubmitting(true);
    try {
      let vehicleFilePath = "";
      const userPayload = {
        ...formResident,
        facePhotoFile: undefined,
        citizenCardFile: undefined,
      };
      let profileImages: Array<{ type: string; path: string }> = Array.isArray(
        formResident.profileImage,
      )
        ? formResident.profileImage.map((image) => ({
            type: image.type,
            path: image.path,
          }))
        : [];

      // console.log(formResident?.facePhotoFile)
      // console.log(formResident?.citizenCardFile)

      if (formResident.facePhotoFile) {
        const facePhotoPath = await uploadProfileImage(
          formResident.facePhotoFile,
          "face",
        );
        profileImages = profileImages.filter(
          (image) => image.type !== "FACE_PHOTO",
        );
        profileImages.push({ type: "FACE_PHOTO", path: facePhotoPath });
      }

      if (formResident.citizenCardFile) {
        const citizenCardPath = await uploadProfileImage(
          formResident.citizenCardFile,
          "citizen-card",
        );
        profileImages = profileImages.filter(
          (image) => image.type !== "CITIZEN_CARD",
        );
        profileImages.push({ type: "CITIZEN_CARD", path: citizenCardPath });
      }

      // console.log("before ",formResident?.vehicleInfo instanceof File)

      if (formResident?.vehicleInfo?.registrationFile instanceof File) {
        const formData = new FormData();
        // formData.append("file", formResident?.vehicleInfo?.file_info.path);
        formData.append("file", formResident.vehicleInfo.registrationFile);

        const uploadRes = await fetch("/api/upload/vehicle", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          vehicleFilePath = uploadData.path; // ได้ URL ใหม่บน Cloudflare R2
        } else {
          console.error("Upload vehicle image failed:", uploadData.message);
        }
      }

      // console.log("after ",formResident?.vehicleInfo)

      const endpoint = isResubmitting
        ? "/api/bookings/update-rejected"
        : "/api/bookings";
      const method = isResubmitting ? "PUT" : "POST";

      const res = await customFetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: currentBooking?.id,
          user: userPayload,
          profileImages,
          room: formRoom,
          // vehicle: {
          //   ...formResident?.vehicleInfo,
          //   filePath: vehicleFilePath || formResident?.vehicleInfo.file_info.path,
          // },
          vehicle: formResident?.vehicleInfo?.licensePlate ? {
            ...formResident?.vehicleInfo,
            registrationFile: undefined,
            // ถ้ามีไฟล์ใหม่ใช้ vehicleFilePath ถ้าไม่มีให้ใช้รูปเก่า ถ้าไม่มีเลยให้เป็น null
            filePath: vehicleFilePath || formResident?.vehicleInfo?.file_info?.path || null,
          } : null, // ถ้าไม่มีทะเบียนรถ ก็ส่ง null ไปเลย
          type: currentBooking?.type,
          groupId: ownerInfo?.studentId,
          address: formResident.address[0],
        }),
      });

      const data = await res.json();
      if (!data.success) {
        // ดักจับ Error ที่มาจาก Error Throw ใน Transaction
        // เช่น "ห้องพักนี้เต็มแล้ว" หรือ "มีคนชิงจองตัดหน้าคุณไปแล้ว"
        setBookingError({
          isOpen: true,
          title: "Booking Failed / จองไม่สำเร็จ",
          message:
            data.error ||
            "ขออภัย มีผู้ใช้ท่านอื่นจองห้องนี้ตัดหน้าคุณไปแล้วเล็กน้อย กรุณาเลือกห้องอื่นใหม่อีกครั้ง",
        });
        return;
      }

      // console.log("data in BookingSummary: ", data);

      // if (data.success) {
      //   // เพิ่มการยิงไปสร้าง Charge ที่ Omise ทันที
      //   await customFetch("/api/bookings/payment", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       bookingId: data.booking.id,
      //       amount: formRoom.price
      //       // amount: 20
      //     }),
      //   });
      // }

      // isResubmitting ? router.push("/my-booking") : setStep(8); // ไปหน้า Payment

      setCurrentBooking((prev: any) => ({
        ...prev,
        id: data.booking.id,
        status: data.booking.status,
        type: data.booking.type,
        createdAt: data.booking.createdAt,
        cus_users: formResident,
        room: formRoom,
        payments: {
          amount: formRoom.price,
        },
      }));

      isResubmitting
        ? router.push("/my-booking")
        : router.push(`/payment/${data.booking.id}`);

    } catch (err: any) {
      setBookingError({
        isOpen: true,
        title: "Connection Error / เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackStep = () => {
    setStep(isResubmitting ? 3 : ownerInfo?.studentId ? 4 : 6);
  };

  return {
    isSubmitting,
    isResubmitting,
    isAcceptAgreement,
    bookingError,
    setBookingError,
    handleEdit,
    handleCheckbox,
    handleFinalConfirm,
    handleBackStep,
  };
};

export default useSummary;
