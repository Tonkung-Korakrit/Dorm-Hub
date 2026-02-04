"use client";

import { useBooking } from "@/app/contexts/BookingContext";
import { useState, useEffect } from "react";
import { MdOutlinePerson, MdOutlineStyle } from "react-icons/md";
// import { MdTimer } from "react-icons/md";

interface BookingSummaryProps {
  setStep: (step: number) => void;
  // onConfirm: () => void;
  // isSubmitting: boolean;
}

export function BookingSummary({ setStep }: BookingSummaryProps) {
  const { formResident, formRoom, setFormRoom, currentBooking, setCurrentBooking, ownerInfo } = useBooking();
  // const [isSubmitting, setIsSubmitting] = useState(false);

  console.log("formRoom in Summary:", formRoom);
  console.log("formResident in Summary:", formResident);
  console.log("currentBooking in Summary:", currentBooking);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const getLifestyleContent = (id: string) => {
    const options: any = {
      MORNING: { label: 'ตื่นเช้า', icon: '☀️' },
      NIGHT: { label: 'นอนดึก', icon: '🌙' },
      QUIET: { label: 'รักความเงียบ', icon: '🔇' },
      SOCIAL: { label: 'ชอบเข้าสังคม', icon: '🔊' },
      NEAT: { label: 'รักความสะอาด', icon: '🧼' },
      LGBTQ_FRIENDLY: { label: 'LGBTQ+ Friendly', icon: '🌈' },
    };
    return options[id] || { label: id, icon: '•' };
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: formResident,
          room: formRoom,
          type: currentBooking.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentBooking((prev: any) => ({
        ...prev,
        id: data.booking.id,
        status: data.booking.status,
        type: data.booking.type,
        createdAt: data.booking.createdAt,
        userId: data.booking.user?.id,
        // user: data.booking.user,
        roomId: data.booking.room?.id,
        // room: data.booking.room,
      }));

      setStep(8); // ไปหน้า Payment
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      {/* <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 gap-4"> */}
      <h1 className="text-[24px] font-bold text-gray-700 mb-4">Booking Summary / สรุปการจอง</h1>

      <div className="space-y-4">
        {/* 1. ข้อมูลนักศึกษา */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-[#006432]">1. Student Information</h3>
            <button onClick={() => setStep(1)} className="text-sm text-blue-500 hover:text-blue-700 font-semibold">Edit</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 bg-gray-50 p-2 rounded-[1.5rem] text-[15px]">
            <p><span className="text-gray-400">Name:</span> <span className="text-gray-800 font-medium">{formResident.name_th}</span></p>
            <p><span className="text-gray-400">Student ID:</span> <span className="text-gray-800 font-medium">{formResident.studentId}</span></p>
            <p><span className="text-gray-400">Faculty & Department:</span> <span className="text-gray-800 font-medium">{formResident.faculty_department}</span></p>
            <p><span className="text-gray-400">Email:</span> <span className="text-gray-800 font-medium">{formResident.email}</span></p>
            <p><span className="text-gray-400">Phone:</span> <span className="text-gray-800 font-medium">{formResident.phone}</span></p>
          </div>
        </section>

        {/* 2. รายละเอียดที่พัก */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-[#006432]">2. Room Details</h3>
            <button
              // onClick={() => setStep(6)} 
              onClick={() => setStep(currentBooking?.type === "CO_RESIDENT" ? 4 : 6)}
              className="text-sm text-blue-500 hover:text-blue-700 font-semibold">
              Edit Room
            </button>
          </div>

          <div className="bg-[#f0f7f0] p-4 rounded-[2rem] border-2 border-[#e0ede0]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[15px]">
              <p><span className="text-gray-500">Campus (Dorm):</span> {formRoom.campus}</p>
              <p><span className="text-gray-500">Zone / Floor:</span> {formRoom.zone.name} / Floor {formRoom.floor}</p>
              <p><span className="text-gray-500">Type:</span> {currentBooking?.type}</p>
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
              <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#126A31] rounded-2xl flex items-center justify-center text-white shadow-inner">
                  <MdOutlinePerson size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-green-700 uppercase">Staying with</p>
                  <p className="text-sm font-black text-gray-800">{ownerInfo.name || "Owner ID: " + ownerInfo.studentId}</p>
                  <p className="text-[10px] text-gray-400">Verified Resident</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. ไลฟ์สไตล์ที่เลือก */}
        <section>
          <h3 className="font-bold text-lg text-[#006432] mb-3 flex items-center gap-2">
            <MdOutlineStyle size={22} />
            3. Lifestyle Preference
          </h3>
          <div className="flex flex-wrap gap-2">
            {formResident?.lifestyle?.length > 0 ? (
              formResident.lifestyle.map((id: string) => {
                const content = getLifestyleContent(id);
                return (
                  <span key={id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-sm">
                    <span>{content.icon}</span>
                    <span className="text-gray-700 font-medium">{content.label}</span>
                  </span>
                )
              })
            ) : (
              <p className="text-sm text-gray-400 italic">ไม่ได้ระบุไลฟ์สไตล์เพิ่มเติม</p>
            )}
          </div>
        </section>

        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3">
          <span className="text-red-500 font-bold shrink-0">⚠️ Note:</span>
          <p className="text-[12px] text-red-700 leading-relaxed">
            กรุณาตรวจสอบความถูกต้องของข้อมูลที่กรอกไว้ ก่อนทำการยืนยันการจองห้องพัก เนื่องจากเมื่อทำการยืนยันแล้ว จะไม่สามารถแก้ไขข้อมูลได้อีก
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mt-10">
        <button
          onClick={() => setStep(6)}
          className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all order-2 md:order-1"
        >
          ย้อนกลับ (Back)
        </button>
        <button
          disabled={isSubmitting} // || timeLeft <= 0
          onClick={handleFinalConfirm}
          className="flex-1 py-4 bg-[#126A31] text-white rounded-2xl font-bold hover:bg-black shadow-lg shadow-green-100 transition-all disabled:bg-gray-300 order-1 md:order-2"
        >
          {isSubmitting ? "กำลังตรวจสอบสถานะห้อง..." : "ยืนยันการจองจริง (Confirm)"}
        </button>
      </div>
    </div>
  );
}