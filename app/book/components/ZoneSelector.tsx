// components/book/ZoneSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/app/contexts/BookingContext";

const zoneImages: Record<string, string> = {
  B: "/images/zones/B.png",
  C: "/images/zones/C.png",
  F: "/images/zones/F.png",
  M: "/images/zones/M.png",
};

interface ZoneSelectorProps {
  setStep: (step: number) => void;
}

interface ZoneData {
  id: number;
  name: string;
  gender: string;
  mapUrl: string;
  maxCols: true;
  maxRows: true;
}

export function ZoneSelector({ setStep }: ZoneSelectorProps) {
  // const [zones, setZones] = useState<string[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  const { formResident, setFormResident, formRoom, setFormRoom, currentBooking, setCurrentBooking } = useBooking();

  // console.log("formRoom in Summary:", formRoom);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Logic สำหรับแยกโซนตามเพศ
  // const filteredZones = zones.filter((zone) => {
  //   const gender = formResident.gender; // "Male"/"Female" หรือ "ชาย"/"หญิง"
  //   const prefix = formResident.prefix; // "Mr."/"Ms." หรือ "นาย"/"นางสาว"
  //   const name = zone.name.toUpperCase();
  //   // กรณี: ผู้พักชาย
  //   if ((gender === "Male" && prefix === "Mr.") || (gender === "ชาย" && prefix === "นาย")) {
  //     const maleZones = ["B6", "B7", "C10", "C11", "M1", "M2"];
  //     return maleZones.includes(name);
  //   }

  //   // กรณี: ผู้พักหญิง
  //   if ((gender === "Female" && (prefix === "Ms." || prefix === "Mrs.")) || (gender === "หญิง" && (prefix === "นางสาว" || prefix === "นาง"))) {
  //     // โซนเฉพาะ: B5, B8, C1-C8, F5-F7
  //     const femaleSpecific = ["B5", "B8", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "F5", "F6", "F7"];

  //     // เงื่อนไข "B อื่นๆ" (ที่ต้องไม่ใช่ B6 และ B7)
  //     const isOtherB = name.startsWith("B") && !["B6", "B7"].includes(name);

  //     return femaleSpecific.includes(name) || isOtherB;
  //   }

  //   return true; // ถ้าไม่มีข้อมูลเพศ ให้แสดงทั้งหมดไว้ก่อนเพื่อกัน Error
  // });

  const filteredZones = zones.filter((zone) => {
    const userGender = formResident.gender; // MALE, FEMALE หรือ LGBTQ จาก Database
    const zoneGender = zone.gender;         // MALE, FEMALE หรือ LGBTQ จาก API

    // 1. ถ้าโซนนั้นกำหนดเพศไว้เป็น OTHER หรือตรงกับเพศผู้ใช้ ให้แสดงผล
    // 2. ถ้าคุณมีหอรวม (LGBTQ) ก็สามารถเพิ่มเงื่อนไขเช็คเพิ่มได้ที่นี่
    return zoneGender === "OTHER" || zoneGender === userGender;
  });

  useEffect(() => {
    if (!formRoom.campus) return;
    setLoading(true);
    fetch(`/api/zones?campus=${formRoom.campus}`)
      .then((res) => res.json())
      .then((data: ZoneData[]) => {
        setZones(data);
        setLoading(false);
      })
      .catch((err) => console.error("Fetch zones error:", err));
  }, [formRoom.campus]);

  const handleSelectZone = (selectedZone: string) => {
    setFormRoom((prev: any) => ({
      ...prev, // รักษาค่าอื่นๆ ใน formRoom (เช่น campus)
      zone: {
        ...prev.zone, // สำคัญมาก! ดึงค่าเดิมใน zone (maxCols, maxRows, id) ออกมาตั้งต้นก่อน
        name: selectedZone // แล้วค่อยเปลี่ยนเฉพาะ name
      }
    }));
    setStep(6); // ไปหน้าเลือกห้อง (Grid)
  };

  const LIFESTYLE_LABELS = {
    MORNING: "ตื่นเช้า (Early Bird)",
    NIGHT: "นอนดึก (Night Owl)",
    QUIET: "รักความเงียบ (Quiet)",
    SOCIAL: "ชอบเข้าสังคม (Social)",
    NEAT: "รักความสะอาด (Neat)",
    LGBTQ_FRIENDLY: "อยู่ร่วมกับ LGBTQ+ ได้",
  };

  // const LIFESTYLE_OPTIONS = [
  //   { id: 'MORNING', label: 'ตื่นเช้า (Early Bird)', icon: '☀️' },
  //   { id: 'NIGHT', label: 'นอนดึก (Night Owl)', icon: '🌙' },
  //   { id: 'QUIET', label: 'รักความเงียบ (Quiet)', icon: '🔇' },
  //   { id: 'SOCIAL', label: 'ชอบเข้าสังคม (Social)', icon: '🔊' },
  //   { id: 'NEAT', label: 'รักความสะอาด (Neat)', icon: '🧼' },
  //   { id: 'LGBTQ_FRIENDLY', label: 'อยู่ร่วมกับ LGBTQ+ ได้', icon: '🌈' },
  // ];

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">

      <h1 className="text-[24px] font-bold mb-4 text-gray-700">
        Select Zone / เลือกโซน ของวิทยาเขต ({formRoom.campus})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 text-[16px]">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-black shrink-0">Gender / เพศ :</span>
          <span className="text-gray-700">{formResident.gender}</span>
        </div>

        <div className="md:col-span-2 flex flex-col md:flex-row md:gap-2 mt-1">
          <span className="font-bold text-black">Type of student / ประเภทของผู้พัก :</span>
          <span className="text-gray-700">{currentBooking.type}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-bold text-black shrink-0">Selected Campus / วิทยาเขต :</span>
          <span className="text-gray-700">{formRoom.campus}</span>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 mt-1 bg-gray-50/50 rounded-2xl">
          <div className="gap-2">
            {/* <div className="w-1.5 h-6 bg-[#006633] rounded-full"></div> เส้นแถบสีเขียวข้างหน้า */}
            <span className="font-bold text-gray-800 text-[16px]">Vibe Roommate / เพื่อนร่วมห้องที่เข้ากันได้ดี</span>
          </div>

          <div className="flex flex-wrap gap-2.5 ml-3">
            {formResident?.lifestyle ? (
              Object.entries(
                (() => {
                  try {
                    return typeof formResident.lifestyle === 'string'
                      ? JSON.parse(formResident.lifestyle)
                      : formResident.lifestyle;
                  } catch (e) { return {}; }
                })()
              ).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#8ACCA1]/40 text-[#006432] text-[13px] rounded-xl shadow-sm hover:border-[#006633] transition-colors duration-200"
                >
                  {/* Label (Key) */}
                  <span className="opacity-70 font-medium">
                    {LIFESTYLE_LABELS[key as keyof typeof LIFESTYLE_LABELS] || key}:
                  </span>

                  {/* Value (เน้นตัวหนา) */}
                  <span className="font-bold">
                    {String(value)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 italic text-[14px] bg-white px-4 py-2 rounded-lg border border-dashed">
                ยังไม่ได้ระบุไลฟ์สไตล์
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 mt-4 mb-2">
          <span className="font-bold text-black">Preferred zone / เลือกโซน </span>
          <span className="text-red-500">*</span>
        </div>
      </div>
      {/* <div className="h-[1px] bg-gray-100 w-full mt-4"></div> */}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredZones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white pt-4 pr-4 pl-4 pb-2 md:p-8 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)]  hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-gray-50"
              onClick={() => handleSelectZone(zone.name)}
            >
              {/* 2. Container ของรูปภาพ: จะถูกบีบด้วย padding ของตัวแม่ */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] shadow-inner">
                <img
                  src={zoneImages[zone.name[0]] || "/images/zones/default.png"}
                  alt={`Zone ${zone.name || "Zone ..."}`}
                  // เพิ่ม scale และ rotate เล็กน้อยตอน hover ให้ดูมีมิติเหมือนกระดาษขยับ
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
                />
              </div>

              <div className="mt-2 flex justify-between items-center px-2">
                <div className="font-bold text-gray-800 text-[16px] md:text-2xl">
                  {`Zone ${zone.name || "Zone ..."}`}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // กันไม่ให้มันไปลั่นโดน Event เลือกโซนของตัวแม่
                    // console.log("Map URL:", zone.mapUrl);
                    // ตรวจสอบว่ามี mapUrl หรือไม่
                    if (zone.mapUrl) {
                      window.open(zone.mapUrl, "_blank");
                    } else {
                      // ถ้าไม่มีลิงก์ใน DB ให้เด้งไปค้นหาใน Google Maps ตามชื่อโซนแทน (กันพลาด)
                      const fallbackUrl = `https://www.google.com/maps`;
                      window.open(fallbackUrl, "_blank");
                    }
                  }}
                  className="bg-[#FF0000] text-white px-2 py-2 rounded-full text-[10px] font-bold shadow-md hover:bg-red-700 hover:shadow-lg transition-all flex items-center gap-2 uppercase"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" clipRule="evenodd" />
                  </svg>
                  Location / ที่ตั้ง
                </button>
              </div>
            </div>
          ))}

          {filteredZones.length === 0 && !loading && (
            <p className="text-center text-gray-400 py-10">ไม่พบโซนที่พักสำหรับเพศของคุณในวิทยาเขตนี้</p>
          )}
        </div>
      )
      }

      <div className="mt-10">
        <button
          onClick={() => setStep(4)}
          className="w-[120px] bg-[#7D856C] text-white px-4 py-2 rounded-xl hover:bg-[#6a715a] transition duration-200 shadow-md"
        >
          Back
        </button>
      </div>
    </div >
  );
}