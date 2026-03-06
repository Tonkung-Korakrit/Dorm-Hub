// app/new-booking/components/BookingSummary.tsx
"use client";

import { useBooking } from "@/app/contexts/BookingContext";
import { useState, useEffect } from "react";
import { MdCheck, MdOutlinePerson } from "react-icons/md";
import { DORM_LABELS } from "@/lib/constants";
import { LoadingOverlay } from "@/app/loading/components/LoadingOverlay";
import { customFetch } from "@/lib/custom-api";
import ConfirmModal from "@/app/loading/components/ConfirmModal";
import { BookingStatus } from "@/types/booking";
import { useRouter } from 'next/navigation';

interface BookingSummaryProps {
  setStep: (step: number) => void;
  // onConfirm: () => void;
  isSubmitting: boolean;
}

export function BookingSummary({ setStep }: BookingSummaryProps) {
  const { formResident, formRoom, setFormRoom, currentBooking, setCurrentBooking,
    ownerInfo, isEditMode, setIsEditMode, vehicle, setVehicle } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAcceptAgreement, setIsAccepstAgreement] = useState(false);
  const [bookingError, setBookingError] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
  } | null>(null);
  const isResubmitting = currentBooking?.status === BookingStatus.REJECTED;
  const router = useRouter();

  console.log("formRoom in Summary:", formRoom);
  console.log("formResident in Summary:", formResident);
  console.log("currentBooking in Summary:", currentBooking);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleEdit = (targetStep: number) => {
    setIsEditMode(true);
    setStep(targetStep);
  };

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    try {
      const endpoint = isResubmitting ? "/api/bookings/update-rejected" : "/api/bookings";
      const method = isResubmitting ? "PUT" : "POST";

      const res = await customFetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: currentBooking?.id,
          user: formResident,
          room: formRoom,
          vehicle: vehicle,
          type: currentBooking.type,
          groupId: ownerInfo?.studentId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        // ดักจับ Error ที่มาจาก Error Throw ใน Transaction
        // เช่น "ห้องพักนี้เต็มแล้ว" หรือ "มีคนชิงจองตัดหน้าคุณไปแล้ว"
        setBookingError({
          isOpen: true,
          title: "Booking Failed / จองไม่สำเร็จ",
          message: data.error || "ขออภัย มีผู้ใช้ท่านอื่นจองห้องนี้ตัดหน้าคุณไปแล้วเล็กน้อย กรุณาเลือกห้องอื่นใหม่อีกครั้ง"
        });
        return;
      }

      // console.log("data in BookingSummary: ", data);

      if (data.success) {
        // เพิ่มการยิงไปสร้าง Charge ที่ Omise ทันที
        await customFetch("/api/bookings/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: data.booking.id,
            amount: formRoom.price
            // amount: 20
          }),
        });

        isResubmitting ? router.push("/my-booking") : router.push(`/payment/${data.booking.id}`); // ไปหน้า Payment
      }

      setCurrentBooking((prev: any) => ({
        ...prev,
        id: data.booking.id,
        status: data.booking.status,
        type: data.booking.type,
        createdAt: data.booking.createdAt,
        cus_users: data.booking.cus_users,
        room: data.booking.room,
      }));

      // isResubmitting ? router.push("/my-booking") : setStep(8); // ไปหน้า Payment
      
    } catch (err: any) {
      setBookingError({
        isOpen: true,
        title: "Connection Error / เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      {bookingError && (
        <ConfirmModal
          isOpen={bookingError.isOpen}
          onConfirm={() => {
            setBookingError(null);
            // ถ้าอยากให้ดีขึ้น: สั่งดึงข้อมูลห้องใหม่ (Mutate SWR) ตรงนี้เลย เพื่อให้ Grid อัปเดตเป็นสีแดงตามความจริง
            // mutate();
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
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-[2rem] flex gap-4 items-center">
          <div className="bg-amber-500 text-white p-2 rounded-full shadow-md">
            <MdCheck size={24} />
          </div>
          <div>
            <p className="text-amber-800 font-bold text-sm">Review your corrections</p>
            <p className="text-amber-700 text-xs italic">กรุณาตรวจสอบข้อมูลที่ท่านแก้ไขตามคำแนะนำ: "{currentBooking.remark}"</p>
          </div>
        </div>
      )}
      {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4"> */}
      <h2 className="text-[24px] font-semibold text-gray-700 mb-4">
        {isResubmitting ? "Resubmit Information / ส่งข้อมูลแก้ไข" : "Booking Summary / สรุปการจอง"}
      </h2>

      <div className="space-y-4">
        {/* 1. ข้อมูลนักศึกษา */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-[#006432]">1. Student Information</h3>
            <button
              onClick={() => handleEdit(1)}
              className="text-sm text-blue-500 hover:text-blue-700 font-semibold"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 p-2 rounded-[1.5rem] text-[15px]">
            <p><span className="text-gray-400">Name:</span> <span className="text-gray-800 font-medium">{formResident.name_th}</span></p>
            <p><span className="text-gray-400">Student ID:</span> <span className="text-gray-800 font-medium">{formResident.studentId.toString()}</span></p>
            <p><span className="text-gray-400">Faculty & Department:</span> <span className="text-gray-800 font-medium">{formResident.faculty_department}</span></p>
            <p><span className="text-gray-400">Email:</span> <span className="text-gray-800 font-medium">{formResident.email}</span></p>
            <p><span className="text-gray-400">Phone:</span> <span className="text-gray-800 font-medium">{formResident.mobilePhone}</span></p>
          </div>
        </section>

        {/* รายละเอียดการจอง (booking detail) */}
        {/* <section>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-[#006432]">4. Booking Detail</h3>
            <button
              onClick={() => handleEdit(4)}
              className="text-sm text-blue-500 hover:text-blue-700 font-semibold"
            >
              Edit
            </button>
          </div>
          <h3 className="font-bold text-lg text-[#006432] mb-3 flex items-center gap-2">

          </h3>
          <div className="flex flex-wrap gap-2">
            <p><span className="text-gray-500">Booking Type:</span> {DORM_LABELS.RESIDENT_TYPE[currentBooking?.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || currentBooking?.type}</p>
          </div>
        </section> */}

        {/* 2. รายละเอียดที่พัก */}
        {!isResubmitting && (
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-[#006432]">2. Booking & Room Detail</h3>
              {!isResubmitting && (
                <button onClick={() => setStep(4)} className="text-sm text-blue-500 hover:text-blue-700 font-semibold">Edit</button>
              )}
            </div>

            <div className="bg-[#f0f7f0] p-4 rounded-[2rem] border-2 border-[#e0ede0]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[15px]">
                <p><span className="text-gray-500">Booking Type:</span> {DORM_LABELS.RESIDENT_TYPE[currentBooking?.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || currentBooking?.type}</p>
                <p><span className="text-gray-500">Campus (Dorm):</span> {DORM_LABELS.CAMPUS[formRoom.campus as keyof typeof DORM_LABELS.CAMPUS] || formRoom.campus}</p>
                <p><span className="text-gray-500">Zone & Floor:</span> {formRoom?.dorm?.name} & Floor {formRoom.floor}</p>
                <p><span className="text-gray-500">Room Type:</span> {DORM_LABELS.ROOM_TYPES[formRoom.roomType as keyof typeof DORM_LABELS.ROOM_TYPES]?.label || formRoom.roomType}</p>
                <p><span className="text-gray-500">Monthly Price:</span> <span className="font-bold text-gray-800">{formRoom.price?.toLocaleString()} THB/MONTH</span></p>
              </div>

              {/* ส่วนแสดง Room Number ใหญ่ๆ */}
              <div className="mt-5 pt-5 border-t border-green-200 flex justify-between items-end">
                <div>
                  <span className="text-green-700/60 block text-xs font-bold uppercase tracking-wider mb-1">Room Number</span>
                  <span className="text-5xl font-black text-[#126A31]">{formRoom.roomId || "N/A"}</span>
                </div>
              </div>
              {currentBooking?.type === "CO_RESIDENT" && ownerInfo && (
                <div className="flex items-center gap-4 bg-gray-50/50 px-2 py-2 rounded-3xl border border-gray-100 w-full md:w-auto">
                  <div className="w-12 h-12 bg-[#126A31] rounded-2xl flex items-center justify-center text-white shadow-inner">
                    <MdOutlinePerson size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-green-700 uppercase">Staying with</p>
                    <p className="text-sm font-black text-gray-800">{ownerInfo.name}</p>
                    <p className="text-sm font-bold text-gray-500">{ownerInfo.studentId}</p>
                    <p className="text-[10px] text-gray-400">Verified Resident</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. ไลฟ์สไตล์ที่เลือก */}
        {!isResubmitting && (
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-[#006432] mb-3 flex items-center gap-2">
                3. Lifestyle Preference
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {formResident?.lifestyle?.length > 0 ? (
                formResident.lifestyle.map((id: string) => {
                  // ดึงค่าจาก constants
                  const config = DORM_LABELS.LIFESTYLE[id as keyof typeof DORM_LABELS.LIFESTYLE];
                  if (!config) return null;

                  const Icon = config.icon; // ดึง Component Icon มา

                  return (
                    <span key={id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 shadow-sm">
                      <Icon className="text-[#126A31]" size={16} />
                      <span className="text-gray-700 font-medium">{config.label}</span>
                    </span>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 italic">ไม่ได้ระบุไลฟ์สไตล์เพิ่มเติม</p>
              )}
            </div>
          </section>
        )}

        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex gap-3">
          <span className="text-red-500 font-bold shrink-0">Note:</span>
          <p className="text-[12px] text-red-700 leading-relaxed">
            กรุณาตรวจสอบความถูกต้องของข้อมูลที่กรอกไว้ ก่อนทำการยืนยันการจองห้องพัก เนื่องจากเมื่อทำการยืนยันแล้ว จะไม่สามารถแก้ไขข้อมูลได้อีก
          </p>
        </div>

        <div className="mt-2">
          <label
            htmlFor="agreement"
            className={`flex items-start gap-4 pt-2 pr-2 pl-2 pb-5 transition-all duration-200 cursor-pointer group`}
          >
            {/* Custom Checkbox Wrapper */}
            <div className="relative flex items-center mt-1">
              <input
                type="checkbox"
                id="agreement"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white checked:bg-[#006633] checked:border-[#006633] transition-all focus:ring-2 focus:ring-[#006633]/20"
                checked={isAcceptAgreement}
                onChange={(e) => setIsAccepstAgreement(e.target.checked)}
              />
              {/* Checkmark Icon (แสดงเมื่อติ๊ก) */}
              <svg
                className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            {/* Text Content */}
            <span className="text-[12px] md:text-[14px] text-gray-600 leading-relaxed select-none">
              ข้าพเจ้าได้ทำความเข้าใจ และ{" "}
              <a
                href="https://precheckin.psm.tu.ac.th/dormitory-policy"
                target="_blank"
                className="text-[#006633] font-bold underline decoration-[#006633]/30 underline-offset-4 hover:text-[#004d26] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                ยอมรับข้อตกลงการพักอาศัยหอพักนักศึกษามหาวิทยาลัยธรรมศาสตร์
              </a>
              {" "}และ{" "}
              <a
                href="https://precheckin.psm.tu.ac.th/privacy-policy"
                target="_blank"
                className="text-[#006633] font-bold underline decoration-[#006633]/30 underline-offset-4 hover:text-[#004d26] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                ข้อตกลงการใช้ข้อมูล
              </a>
            </span>
          </label>
        </div>
      </div >

      <div className="flex flex-col md:flex-row gap-3 mt-2">
        <button
          onClick={() => setStep(isResubmitting ? 3 : !ownerInfo.studentId ? 6 : 4)}
          className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all order-2 md:order-1"
        >
          ย้อนกลับ (Back)
        </button>
        <button
          disabled={!isAcceptAgreement || isSubmitting}
          onClick={handleFinalConfirm}
          className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-lg transition-all 
            ${(!isAcceptAgreement || isSubmitting)
              ? "bg-gray-300 cursor-not-allowed shadow-none" // สีตอนกดไม่ได้
              : isResubmitting
                ? "bg-amber-500 hover:bg-amber-700 shadow-amber-100" // สีส้มตอนกดได้
                : "bg-[#126A31] hover:bg-[#093218] shadow-green-100" // สีเขียวตอนกดได้
            }`}
        >
          {isSubmitting ? "Processing..." : isResubmitting ? "ส่งข้อมูลแก้ไข (Resubmit)" : "ยืนยันการจองจริง (Confirm)"}
          {isSubmitting && <LoadingOverlay message="Saving data...." />}
        </button>
      </div>
    </div >
  );
}