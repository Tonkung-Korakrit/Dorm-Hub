// book/components/CampusSelector.tsx
"use client";

import React, { useState, useEffect, ChangeEvent, Dispatch, SetStateAction } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import { BookingType, Resident } from "@/types/booking";
import { MdCheck, MdCheckCircle, MdInfo, MdPersonSearch } from "react-icons/md";
import { DORM_LABELS } from "@/lib/constants";
import { StatusPopup } from "@/app/loading/components/StatusPopup";
import { LoadingOverlay } from "@/app/loading/components/LoadingOverlay";
import toast from "react-hot-toast";
import { PiRainbowCloud } from "react-icons/pi";
import { customFetch } from "@/lib/api";

// กำหนด Interface สำหรับ Props
interface CampusSelectorProps {
  setStep: Dispatch<SetStateAction<number>>;
  // onSelectRegion: (region: string) => void;
}

export function CampusSelector({ setStep }: CampusSelectorProps) {
  const { formResident, setFormResident, formRoom, setFormRoom, currentBooking, setCurrentBooking, ownerInfo, setOwnerInfo, isEditMode, setIsEditMode } = useBooking();
  const [ownerStudentId, setOwnerId] = useState("");
  const [showStatus, setShowStatus] = useState<{ type: "success" | "error"; title?: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [ownerInfo, setOwnerInfo] = useState<any>(null);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุดเมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
    setIsLoading(true);
    setOwnerInfo(null);
    setShowStatus(null);
    try {
      const res = await customFetch(`/api/bookings/check-owner?studentId=${ownerStudentId}`);
      const data = await res.json();

      // console.log(data)

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
        toast.success("พบข้อมูลเจ้าของห้องแล้ว", { id: "verify-success" });
      } else {
        setShowStatus({
          type: "error",
          title: "ไม่พบข้อมูลการจอง",
          message: data.message || "ไม่พบข้อมูลการจองแบบเหมาห้อง (Charter) ของรหัสนักศึกษานี้ในระบบ",
        });
        setOwnerInfo(null);
      }
    } catch (error) {
      console.error("Verify Error:", error);
      // alert("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
      setShowStatus({
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง",
      });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const REGIONS = ["rangsit", "thaprachan", "lampang", "pattaya"];

  const handleSelectRegion = (selectedRegion: string) => {
    // onSelectRegion(region); // เรียกใช้ Function เพื่อเปลี่ยน Step แทน
    setFormRoom((prev: any) => ({ ...prev, campus: selectedRegion }));
    setStep(5);
  };

  const toggleLifestyle = (id: string) => {
    if (!setFormResident || !formResident) return;

    const currentLifestyle = formResident.lifestyle || [];
    const isSelected = currentLifestyle.includes(id);

    if (!isSelected && currentLifestyle.length >= 10) {
      toast.error("เลือกได้สูงสุด 10 อย่างครับ เพื่อการจับคู่ที่แม่นยำที่สุด", { id: "limit" });
      return;
    }

    // แก้ไขตรงนี้: ตรวจสอบปีกกาและ return
    setFormResident((prev: Resident) => { // เปลี่ยน any เป็น Resident เพื่อความเป๊ะ
      const nextLifestyle = isSelected
        ? (prev.lifestyle || []).filter((item: string) => item !== id)
        : [...(prev.lifestyle || []), id];

      // ต้องมีคำว่า return และส่ง Object ทั้งหมดกลับไป
      return {
        ...prev,
        lifestyle: nextLifestyle,
      };
    });
  };

  const handleContinue = () => {
    // 1. ถ้าอยู่ในโหมดแก้ไข (มาจากหน้า Summary)
    if (isEditMode) {
      // ปิดโหมดแก้ไขและส่งกลับหน้าสรุปทันที
      setIsEditMode(false);
      setStep(7); // เลข Step ของหน้า Summary
      toast.success("อัปเดตไลฟ์สไตล์เรียบร้อย");
    } else {
      // 2. ถ้าเป็น Flow ปกติ (กำลังจองครั้งแรก)
      // ตรวจสอบเงื่อนไขตามปกติ แล้วไปหน้าเลือกห้อง (Step 5)
      setStep(5);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-[24px] font-semibold text-gray-700 mb-4 leading-tight">Room Information / <br />ข้อมูลห้องพัก</h1>

      <div className="space-y-4">
        {!isEditMode && (
          <>
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
                    {/* {BOOKING_TYPE_LABELS[type]} */}
                    {DORM_LABELS.RESIDENT_TYPE[type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || type}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {currentBooking?.type && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
                <div className="flex gap-2">
                  <div className="mt-0.5">
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-amber-500 mb-1">รายละเอียดประเภทการจอง:</p>
                    <p className="text-[12px] text-gray-600 leading-relaxed">
                      {DORM_LABELS.RESIDENT_TYPE_DESC[currentBooking.type as keyof typeof DORM_LABELS.RESIDENT_TYPE_DESC]}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ส่วน Search สำหรับ CO_RESIDENT (UI เดิมของคุณ) */}
            {currentBooking?.type === "CO_RESIDENT" && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <h5 className="text-[16px] font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <MdPersonSearch size={20} />
                  Search for Room Owner / ค้นหาเจ้าของห้องหลัก
                </h5>
                <div className="space-y-3">
                  <label className="block text-[12px] text-emerald-700 mb-1 ml-1">Owner Student ID / รหัสนักศึกษาเจ้าของห้อง</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ownerStudentId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      placeholder="เช่น 6601xxxx"
                      className="flex-1 px-4 py-2.5 bg-white border border-emerald-300 rounded-xl outline-none text-black text-sm"
                    />
                    <button onClick={handleVerifyOwner} className="px-2 py-2.5 bg-[#006633] text-white rounded-xl font-bold text-[12px]">Check</button>
                  </div>
                  {ownerInfo && (
                    <div className="bg-white/60 p-3 rounded-lg border border-emerald-100 text-[13px] text-emerald-900">
                      <p>✅ <b>พบข้อมูล:</b> โซน {ownerInfo.dorm || ""} - ห้อง {ownerInfo.roomId || ""}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <hr className="my-2 border-gray-100" />

      {/* --- ส่วน Logic ซ่อน/แสดง เนื้อหาด้านล่าง --- */}
      {!currentBooking?.type ? (
        // 1. ถ้ายังไม่เลือก Type แสดงแค่ปุ่ม Back
        <div className="flex flex-col items-center py-6">
          <p className="text-gray-400 text-sm mb-4 italic">กรุณาเลือกประเภทผู้พักเพื่อดำเนินการต่อ</p>
          <button onClick={() => setStep(3)} className="w-1/2 bg-[#7D856C] text-white py-3 rounded-2xl font-bold">Back</button>
        </div>
      ) : currentBooking.type === "CO_RESIDENT" ? (
        // 2. ถ้าเป็น CO_RESIDENT แสดงปุ่มข้ามไป Step 7
        <div className="pt-2 flex flex-col items-center border-t border-gray-100 w-full">
          <p className="text-gray-500 text-sm mb-6 italic text-center">* ระบบจะข้ามขั้นตอนการเลือกห้อง เนื่องจากคุณพักร่วมกับเจ้าของห้องหลัก</p>
          <div className="flex justify-between items-center w-full mt-4 text-[16px] gap-2">
            <button onClick={() => setStep(3)} className="flex-1 bg-[#7D856C] text-white py-3 rounded-2xl font-bold">Back</button>
            <button
              disabled={!ownerInfo}
              onClick={() => setStep(7)}
              className={`flex-1 py-3 rounded-2xl font-bold ${ownerInfo ? "bg-[#006633] text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        // 3. ถ้าเป็น CHARTER หรือ NOT_CHARTER แสดง Lifestyle + Campus (UI เดิมของคุณ)
        <>
          {/* Lifestyle Section (UI เดิมเป๊ะ) */}
          <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[16px] font-semibold text-gray-700">Inclusivity & Safety / ความหลากหลาย และความปลอดภัย</h2>
            </div>

            <button
              type="button"
              onClick={() => toggleLifestyle("LGBTQ_FRIENDLY")}
              className={`w-full p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center gap-5 text-left relative overflow-hidden group
              ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY")
                  ? 'border-[#006432] bg-green-50/50 shadow-md scale-[1.01]'
                  : 'border-gray-100 bg-white hover:border-purple-200'
                }`}
            >
              {/* แถบสีรุ้งเล็กๆ ด้านข้างเพื่อให้ดูมี Vibe LGBTQ+ แบบเรียบหรู */}
              {/* <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 opacity-70"></div> */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-400 via-green-400 to-purple-400 opacity-70"></div>

              <div className={`p-4 rounded-2xl transition-colors ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'bg-[#006432] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                <PiRainbowCloud size={32} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[16px] font-bold ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'text-[#006432]' : 'text-gray-700'
                    }`}>
                    LGBTQ+ Friendly
                  </span>
                  {formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") && (
                    <span className="text-[10px] bg-[#006432] text-white px-2 py-0.5 rounded-full animate-pulse">Selected</span>
                  )}
                </div>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  ยินดีที่จะพักร่วมกับเพื่อนร่วมห้องเพศทางเลือก (LGBTQ+) หรือไม่
                </p>
              </div>

              <div className={`mr-2 transition-transform duration-300 ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'scale-110' : 'scale-100 opacity-30'
                }`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'border-[#006432] bg-[#006432]' : 'border-gray-300'
                  }`}>
                  {formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") && <MdCheck className="text-white" size={16} />}
                </div>
              </div>
            </button>

            <div className="bg-amber-50 p-4 mt-3 mb-3 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                {/* แยก SVG ออกมาเป็นโหนดอิสระ เพื่อให้ flex gap ทำงาน */}
                <svg
                  className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>

                <div className="flex flex-col">
                  <p className="text-amber-500 text-[13px] leading-relaxed font-bold">
                    หมายเหตุ:
                  </p>
                  <p className="text-gray-600 text-[12px] leading-relaxed">
                    การเลือก LGBTQ+ Friendly จะใช้สำหรับการจัดสรรเพื่อนร่วมห้องที่ยอมรับความหลากหลายได้
                    ภายใต้เงื่อนไข <span className="font-bold text-amber-900">"การแยกหอพักชาย-หญิงตามเพศกำเนิด (Sex at birth)"</span> ตามกฎระเบียบของมหาวิทยาลัย
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* --- 2.2 ส่วน Lifestyle อื่นๆ (Grid เดิม) --- */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-[16px] font-semibold text-gray-700">Other Lifestyle Preferences / ไลฟ์สไตล์อื่นๆ</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(DORM_LABELS.LIFESTYLE)
                .filter(([id]) => id !== "LGBTQ_FRIENDLY") // กรองตัว LGBTQ ออกจาก Grid ปกติ
                .map(([id, config]) => {
                  const isSelected = formResident?.lifestyle?.includes(id);
                  const Icon = config.icon;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleLifestyle(id)}
                      className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all duration-300
              ${isSelected
                          ? 'border-[#006432] bg-[#f0f7f0] text-[#006432] shadow-sm scale-105'
                          : 'border-gray-50 bg-white text-gray-400 hover:border-green-100'
                        }`}
                    >
                      <Icon size={24} className={isSelected ? 'text-[#006432]' : 'text-gray-500'} />
                      <span className="text-[11px] font-bold text-center leading-tight">{config.label}</span>
                    </button>
                  );
                })}
            </div>
          </section>

          {/* Campus Selection (UI เดิมเป๊ะ) */}
          <div className="mt-8">
            <h2 className="text-[16px] font-bold text-gray-800 mb-6">Desired campus / เลือกวิทยาเขต*</h2>
            <div className="flex flex-col gap-10 max-w-2xl">
              {REGIONS.map((region) => (
                <div key={region} onClick={() => handleSelectRegion(region)} className="cursor-pointer">
                  <div className={`relative bg-white p-3 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] ${formRoom.campus === region ? "ring-2 ring-[#006633]" : ""}`}>
                    <div className="overflow-hidden rounded-[12px] aspect-[16/10]">
                      <img src={`/images/dorms/${region}.png`} alt={region} className="w-full h-full object-cover" />
                    </div>
                    <p className={`mt-2 pl-2 text-[16px] ${formRoom.campus === region ? "text-[#006633] font-extrabold" : "text-black font-medium"}`}>{DORM_LABELS.CAMPUS[region as keyof typeof DORM_LABELS.CAMPUS] || region}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ปุ่ม Back สำหรับ Flow ปกติ */}
          <div className="flex w-full mt-8 gap-2">
            <button onClick={() => setStep(3)} className="flex-1 bg-[#7D856C] text-white py-3 rounded-2xl font-bold">Back</button>
            {isEditMode && <button onClick={handleContinue} className="flex-1 bg-[#006633] text-white py-3 rounded-2xl font-bold shadow-lg">Save & Return</button>}
          </div>
        </>
      )}

      {isLoading && <LoadingOverlay message="Currently checking...." />}
    </div>
  );
}