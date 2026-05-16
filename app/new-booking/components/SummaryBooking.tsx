// app/new-booking/components/BookingSummary.tsx
"use client";

import { useBooking } from "@/app/contexts/BookingContext";

// components
import Container from "@/components/Container";
import RoomDetail from "@/components/Summary/RoomDetail";
import StudentDetail from "@/components/Summary/StudentDetail";
import VibeRoommateDetail from "@/components/Summary/VibeRoommateDetail";
import Agreements from "@/components/Summary/Agreements";
import SummaryButton from "@/components/Summary/ButtonSummary";
import { LoadingOverlay } from "@/components/Loading/LoadingOverlay";
import ConfirmModal from "@/components/Loading/ConfirmModal";

// icons
import { LuFolderSearch } from "react-icons/lu";

// hooks
import { useScrollTop } from "@/hooks/useScrollTop";
import useSummary from "@/hooks/useSummary";

interface SummaryBookingProps {
  setStep: (step: number) => void;
}

export const SummaryBooking = ({ setStep }: SummaryBookingProps) => {
  const { formResident, formRoom, currentBooking } = useBooking();
  const { isSubmitting, isResubmitting, isAcceptAgreement, bookingError, setBookingError,
    handleEdit, handleCheckbox, handleFinalConfirm, handleBackStep } = useSummary(setStep)

  console.log("formResident in Summary:", formResident);  
  // console.log("formRoom in Summary:", formRoom);
  // console.log("currentBooking in Summary:", currentBooking);
  // console.log("vehicle in vehicle: ", vehicle);
  // console.log("Address in Summary:", formResident.address[0]);

  useScrollTop();

  return (
    <Container
      title={`${isResubmitting ? "Resubmit Information / ส่งข้อมูลแก้ไข" : "Booking Summary / สรุปการจอง"}`}
    >

      {isSubmitting && <LoadingOverlay message="Saving data...." />}

      {bookingError && (
        <ConfirmModal
          isOpen={bookingError.isOpen}
          onConfirm={() => {
            setBookingError(null);
            // mutate(); // สั่งดึงข้อมูลห้องใหม่ (Mutate SWR)
            setStep(6);
          }}
          type="danger"
          title={bookingError.title}
          message={bookingError.message}
          confirmText="Select New Room / เลือกห้องใหม่"
          isLoading={false}
          showCancel={false}
        />
      )}

      {isResubmitting && (
        <div className="my-2 p-4 bg-amber-50 border border-amber-200 rounded-[2rem] flex gap-4 items-center">
          <div className="bg-amber-500 text-white p-2 rounded-full shadow-md">
            <LuFolderSearch size={24} />
          </div>
          <div>
            <p className="text-amber-800 font-bold text-sm">Review your corrections</p>
            <p className="text-amber-700 text-xs italic">กรุณาตรวจสอบข้อมูลที่ท่านแก้ไขตามคำแนะนำ: "{currentBooking?.remark}"</p>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-2">
        {/* 1. ข้อมูลนักศึกษา */}
        <StudentDetail handleEdit={handleEdit} />

        {/* 2. รายละเอียดที่พัก */}
        <RoomDetail isResubmitting={isResubmitting} setStep={setStep} />

        {/* 3. ไลฟ์สไตล์ที่เลือก */}
        <VibeRoommateDetail />

        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex gap-3">
          <span className="text-red-500 font-bold shrink-0">Note:</span>
          <p className="text-[12px] text-red-700 leading-relaxed">
            กรุณาตรวจสอบความถูกต้องของข้อมูลที่กรอกไว้ ก่อนทำการยืนยันการจองห้องพัก เนื่องจากเมื่อทำการยืนยันแล้ว จะไม่สามารถแก้ไขข้อมูลได้อีก
          </p>
        </div>

        <Agreements isAcceptAgreement={isAcceptAgreement} handleCheckbox={handleCheckbox} />
      </div >

      <SummaryButton
        handleFinalConfirm={handleFinalConfirm}
        handleBackStep={handleBackStep}
        isAcceptAgreement={isAcceptAgreement}
        isSubmitting={isSubmitting}
        isResubmitting={isResubmitting}
      />
    </Container>
  );
}