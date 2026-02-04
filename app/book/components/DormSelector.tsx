// book/components/DormSelector.tsx
"use client";

import React, { useState, useEffect, ChangeEvent, Dispatch, SetStateAction } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { BookingType } from "@/types/booking";
import { MdPersonSearch } from "react-icons/md";

// กำหนด Interface สำหรับ Props
interface DormSelectorProps {
  setStep: Dispatch<SetStateAction<number>>;
  // onSelectRegion: (region: string) => void;
}

export function DormSelector({ setStep }: DormSelectorProps) {
  const { formResident, setFormResident, formRoom, setFormRoom, currentBooking, setCurrentBooking, ownerInfo, setOwnerInfo } = useBooking();
  const [ownerStudentId, setOwnerId] = useState("");
  // const [ownerInfo, setOwnerInfo] = useState<any>(null);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุดเมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
    CHARTER: "ผู้พักหลัก (เหมาห้อง) Charter room",
    NOT_CHARTER: "ผู้พักหลัก (ไม่เหมาห้อง) Not charter room",
    CO_RESIDENT: "ผู้พักร่วม (Co-Resident)",
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value as BookingType;

    // ต้องบอกว่าจะเปลี่ยนเฉพาะ key "type" ใน Object
    setCurrentBooking((prev) => {
      if (!prev) return prev; // กันพังถ้ายังไม่มี Object
      return {
        ...prev,
        type: selectedType
      };
    });
  };

  const handleVerifyOwner = async () => {
    if (!ownerStudentId) return alert("กรุณากรอกรหัสนักศึกษาครับ");

    try {
      const res = await fetch(`/api/bookings/check-owner?studentId=${ownerStudentId}`);
      const data = await res.json();

      console.log(data)

      if (res.ok && data.success) {

        setOwnerInfo((prev: any) => ({
          ...prev,
          studentId: data.booking.user.studentId,
          name: data.booking.user.name_th,
          zoneName: data.booking.room.zone.name,
          // roomNumber: data.booking.room.roomId,
          roomId: data.booking.room.roomId,
        }));

        // อัปเดตข้อมูลห้องใน Form ของเราทันที
        setFormRoom((prev: any) => ({
          ...prev,
          id: data.booking.room.id,
          campus: data.booking.room.zone.dorm.name,
          zone: data.booking.room.zone,
          floor: data.booking.room.floor,
          roomId: data.booking.room.roomId,
          price: data.booking.room.price,
          roomType: data.booking.room.roomType,
        }));

        // alert("พบข้อมูลเจ้าของห้องเรียบร้อยครับ!");
      } else {
        alert(data.message || "ไม่พบข้อมูลการจองของรหัสนักศึกษานี้");
        setOwnerInfo(null);
      }
    } catch (error) {
      console.error("Verify Error:", error);
      alert("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
    }
  };

  const REGIONS = ["rangsit", "thaprachan", "lampang", "pattaya"];

  const regionLabels: Record<string, string> = {
    rangsit: "Rangsit / รังสิต",
    thaprachan: "Tha Prachan / ท่าพระจันทร์",
    lampang: "Lampang / ลำปาง",
    pattaya: "Pattaya / พัทยา",
  };

  const handleSelectRegion = (selectedRegion: string) => {
    // onSelectRegion(region); // เรียกใช้ Function เพื่อเปลี่ยน Step แทน
    setFormRoom((prev: any) => ({ ...prev, campus: selectedRegion }));
    setStep(5);
  };

  const LIFESTYLE_OPTIONS = [
    { id: 'MORNING', label: 'ตื่นเช้า (Early Bird)', icon: '☀️' },
    { id: 'NIGHT', label: 'นอนดึก (Night Owl)', icon: '🌙' },
    { id: 'QUIET', label: 'รักความเงียบ (Quiet)', icon: '🔇' },
    { id: 'SOCIAL', label: 'ชอบเข้าสังคม (Social)', icon: '🔊' },
    { id: 'NEAT', label: 'รักความสะอาด (Neat)', icon: '🧼' },
    { id: 'LGBTQ_FRIENDLY', label: 'อยู่ร่วมกับ LGBTQ+ ได้', icon: '🌈' },
    // { id: 'ISLAMIC', label: 'ผู้พักแบบอิสลาม (Islamic)', icon: '🕌' },
    // { id: 'SMOKING', label: 'สูบบุหรี่ (Smoking)', icon: '🚬' },
  ];

  const toggleLifestyle = (id: string) => {
    if (!setFormResident) return;

    setFormResident((prev: any) => {
      const currentLifestyle = prev.lifestyle || [];
      const isSelected = currentLifestyle.includes(id);
      const nextLifestyle = isSelected
        ? currentLifestyle.filter((item: string) => item !== id)
        : [...currentLifestyle, id];

      // คืนค่า Object เดิมกลับไป เปลี่ยนแค่ lifestyle
      return {
        ...prev,
        lifestyle: nextLifestyle
      };
    });
  };

  // const handleNextStep = () => {
  //   if (currentBooking?.type === "CO_RESIDENT") {
  //     if (!ownerInfo) return alert("กรุณาตรวจสอบข้อมูลเจ้าของห้องก่อนไปขั้นตอนถัดไป");

  //     // ข้าม Step 5 (เลือกโซน) และ Step 6 (เลือกห้อง) ไปหน้าสรุปเลย
  //     setStep(7);
  //   } else {
  //     // ผู้พักหลักไปเลือกวิทยาเขต/โซนปกติ
  //     setStep(5);
  //   }
  // };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-[24px] font-semibold text-gray-700 mb-4">Room Information / ข้อมูลห้องพัก</h1>

      <div className="space-y-4">
        <div>
          {/* 1. ส่วนเลือก Type of resident / ประเภทผู้พัก */}
          <h4 className="text-[16px] font-semibold text-gray-700 mb-2">
            Type of resident / ประเภทผู้พัก <span className="text-red-500">*</span>
          </h4>

          <div className="relative">
            <select
              name="type"
              value={currentBooking?.type || ""}
              onChange={handleTypeChange}
              className="w-full py-2 px-2 border bg-[#006633] text-white rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-green-400 shadow-md"
            >
              <option value="" disabled hidden>-- เลือกประเภทผู้พัก / Select resident type --</option>

              {Object.values(BookingType).map((type) => (
                <option key={type} value={type}>
                  {BOOKING_TYPE_LABELS[type]}
                </option>
              ))}
            </select>

            {/* ไอคอนลูกศร Dropdown เพื่อความสวยงาม */}
            <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {currentBooking?.type === "CO_RESIDENT" && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              <h5 className="text-[16px] font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <MdPersonSearch size={20} />
                Search for Room Owner / ค้นหาเจ้าของห้องหลัก
              </h5>

              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] text-emerald-700 mb-1 ml-1">
                    Owner Student ID / รหัสนักศึกษาเจ้าของห้อง
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ownerStudentId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      placeholder="เช่น 6601xxxx"
                      className="flex-1 px-4 py-2.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-black text-sm shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOwner} // ฟังก์ชันสำหรับเช็คข้อมูล (ต้องเขียนเพิ่ม)
                      className="px-2 py-2.5 bg-[#006633] text-white rounded-xl font-bold hover:bg-[#004d26] transition-all shadow-md active:scale-95 text-[12px]"
                    >
                      Check
                    </button>
                  </div>
                </div>

                {/* ส่วนแสดงข้อมูลที่ค้นพบ (ถ้าเจอ) */}
                {ownerInfo && (
                  <div className="bg-white/60 p-3 rounded-lg border border-emerald-100 text-[13px] text-emerald-900">
                    <p>✅ <b>พบข้อมูล:</b> โซน {ownerInfo.zoneName || ""} - ห้อง {ownerInfo.roomId || ""}</p>
                    <p className="text-[11px] text-emerald-600">คุณจะถูกเพิ่มเข้าไปในห้องนี้โดยอัตโนมัติ</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="my-2 border-gray-100" />

      {currentBooking?.type !== "CO_RESIDENT" ? (
        <>
          {/* 2. ส่วนเลือก Lifestyle */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-[16px] font-semibold text-gray-700">Roommate Matching Preference</h2>
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">New</span>
            </div>
            <p className="text-[14px] text-gray-500 mb-2">ระบุไลฟ์สไตล์ของคุณเพื่อช่วยให้ระบบจับคู่รูมเมทที่ "Vibe" ตรงกันที่สุด</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {LIFESTYLE_OPTIONS.map((opt) => {
                const isSelected = formResident?.lifestyle?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleLifestyle(opt.id)}
                    className={`p-4 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all duration-300
                ${isSelected
                        ? 'border-[#006432] bg-[#f0f7f0] text-[#006432] shadow-md scale-105'
                        : 'border-gray-100 bg-white text-gray-400 hover:border-green-200'}`}
                  >
                    <span className="text-[24px]">{opt.icon}</span>
                    <span className="text-[12px] font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* DEBUG BAR */}
            {/* <div className="bg-gray-900 text-green-400 p-3 rounded-xl font-mono text-[10px] flex justify-between items-center">
            <span>STATE CHECK:</span>
            <span>{JSON.stringify(formResident?.lifestyle)}</span>
          </div> */}
          </section>

          <hr className="my-8 border-gray-100" />

          {/* 3. ส่วนปุ่มดูรายละเอียดหอ */}
          <div className="flex justify-center">
            <a
              href="https://psm.tu.ac.th/our-services/dormitory/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-2 text-white text-[16px] font-medium bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Residence Details / รายละเอียดหอพัก
            </a>
          </div>

          {/* 4. ส่วนเลือกวิทยาเขตหอพัก (Region) */}
          <div className="pt-4">
            <h2 className="text-[16px] font-bold text-gray-800 mb-6">
              Desired campus / เลือกวิทยาเขต<span className="text-red-500 ml-1">*</span>
            </h2>

            <div className="flex flex-col gap-10 max-w-2xl">
              {REGIONS.map((region) => {
                const isSelected = formRoom.campus === region;

                return (
                  <div
                    key={region}
                    onClick={() => handleSelectRegion(region)}
                    className="cursor-pointer group"
                  >
                    {/* 1. กรอบนอก (Container): มีเงาและ Padding เพื่อให้รูปข้างในดูเล็กกว่า */}
                    <div
                      className={`
              relative bg-white p-3 rounded-[10px] transition-all duration-300
              /* เงาแบบฟุ้งกว้างเพื่อให้ดูนุ่มนวลเหมือนในรูป */
              shadow-[0_10px_40px_rgba(0,0,0,0.08)] 
              ${isSelected
                          ? "ring-2 ring-[#006633] shadow-[0_15px_50px_rgba(0,102,51,0.15)] scale-[1.01]"
                          : "hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:-translate-y-1"
                        }
            `}
                    >
                      {/* 2. รูปภาพด้านใน: ใส่ rounded ให้มนรับกับกรอบนอก */}
                      <div className="overflow-hidden rounded-[12px] aspect-[16/10]">
                        <img
                          src={`/images/dorms/${region}.png`}
                          alt={regionLabels[region]}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>

                      {/* 3. ข้อความใต้กรอบ */}
                      <div className="mt-2 pl-2">
                        <p className={`text-[16px] transition-colors
                        ${isSelected ? "text-[#006633] font-extrabold" : "text-black font-medium"}
                      `}>
                          {regionLabels[region]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* ปุ่มกลับ */}
          <div className="flex justify-start w-full mt-4 text-[16px]">
            <button
              onClick={() => setStep(3)}
              className="w-[120px] bg-[#7D856C] text-white px-4 py-2 rounded-xl hover:bg-[#6a715a] transition duration-200 shadow-md"
            >
              Back
            </button>
          </div>
        </>
      ) : (
        <div className="pt-2 flex flex-col items-center border-t border-gray-100 w-full">

          {/* ข้อความแจ้งเตือน (จะอยู่ตรงกลางเพราะ items-center ด้านบน) */}
          <p className="text-gray-500 text-sm mb-6 italic text-center">
            * ระบบจะข้ามขั้นตอนการเลือกห้อง เนื่องจากคุณพักร่วมกับเจ้าของห้องหลัก
          </p>

          {/* ส่วนควบคุมปุ่ม: ใช้ w-full เพื่อขยายให้เต็มพื้นที่ และ justify-between เพื่อดันปุ่มแยกกัน */}
          <div className="flex justify-between items-center w-full mt-4 text-[16px]">

            {/* 1. ปุ่ม Back (ชิดซ้าย) */}
            <button
              onClick={() => setStep(3)}
              className="w-[120px] bg-[#7D856C] text-white px-4 py-2 rounded-xl hover:bg-[#6a715a] transition duration-200 shadow-md"
            >
              Back
            </button>

            {/* 2. ปุ่ม Next (ชิดขวา) */}
            <button
              onClick={() => {
                if (!ownerInfo) return alert("กรุณาตรวจสอบรหัสนักศึกษาเจ้าของห้องก่อนครับ");
                setStep(7);
              }}
              disabled={!ownerInfo}
              className={`w-[120px] md:w-[180px] py-2 px-4 rounded-xl transition-all shadow-md
        ${ownerInfo
                  ? "bg-[#006633] text-white hover:bg-[#004d26] hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              Next
            </button>

          </div>
        </div>
      )}
    </div>
  );
}