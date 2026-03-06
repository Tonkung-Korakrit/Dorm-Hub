// components/new-booking/DormSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useBooking } from "@/app/contexts/BookingContext";
import useSWR from 'swr';
import { Dorm, GenderType } from "@/types/booking";
import { DORM_LABELS } from "@/lib/constants";
import { ZoneCardSkeleton } from "@/app/loading/components/ิbook/ZoneCardSkeleton";
import { customFetch } from "@/lib/custom-api";

const zoneImages: Record<string, string> = {
  B: "/images/zones/B.png",
  C: "/images/zones/C.png",
  F: "/images/zones/F.png",
  M: "/images/zones/M.png",
};

interface DormSelectorProps {
  setStep: (step: number) => void;
}

export function DormSelector({ setStep }: DormSelectorProps) {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { formResident, setFormResident, formRoom, setFormRoom, currentBooking, setCurrentBooking } = useBooking();
  const fetcher = (url: string) => fetch(url).then(res => res.json());

  // console.log("formRoom in Summary:", formRoom);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filteredDorms = dorms.filter((dorm) => {
    const userGender = formResident.gender;
    const userPrefix = formResident.titleName; // "นาย", "นางสาว", "นาง"
    const zoneGender = dorm.genderType;         // "MALE", "FEMALE"

    // console.log(`Filtering userGender: ${userGender}, userPrefix: ${userPrefix}`);

    // กรณีโซนสำหรับผู้ชาย (MALE) -> อนุญาตเฉพาะคำนำหน้า "นาย"
    if ((userGender === GenderType.MALE || userGender === GenderType.LGBTQ) && userPrefix === "Mr.") {
      return zoneGender === "MALE";
    }

    // กรณีโซนสำหรับผู้หญิง (FEMALE) -> อนุญาตเฉพาะ "นางสาว" หรือ "นาง"
    if ((userGender === GenderType.FEMALE || userGender === GenderType.LGBTQ) && (userPrefix === "Mrs." || userPrefix === "Ms.")) {
      return zoneGender === "FEMALE";
    }

    // กรณีโซนหอรวม หรือเพศทางเลือก (ถ้ามี)
    // return zoneGender === "OTHER" || zoneGender === "LGBTQ";
    // return true;
  });

  useEffect(() => {
    if (!formRoom.campus) return;

    let isMounted = true;
    setIsLoading(true);

    customFetch(`/api/dorms?campus=${formRoom.campus}`)
      .then((res) => res.json())
      .then((data: Dorm[]) => {
        if (isMounted) { // เช็คว่าคอมโพเนนต์ยังอยู่ไหมก่อนอัปเดต State
          setDorms(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) console.error("Fetch error:", err);
      });

    return () => {
      isMounted = false; // Clean-up เมื่อ Unmount
    };
  }, [formRoom.campus]);

  const handleSelectDorm = (selectedDorm: Dorm) => {
    setFormRoom((prev: any) => ({
      ...prev, // รักษาค่าอื่นๆ ใน formRoom (เช่น campus)
      dorm: {
        // ...prev.zone, // สำคัญมาก! ดึงค่าเดิมใน zone (maxCols, maxRows, id) ออกมาตั้งต้นก่อน
        ...selectedDorm,
        // name: selectedDorm, // แล้วค่อยเปลี่ยนเฉพาะ name
      }
    }));
    setStep(6); // ไปหน้าเลือกห้อง (Grid)
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">

      <h1 className="text-[24px] font-bold mb-4 text-gray-700">
        Select Zone / เลือกโซน ของวิทยาเขต ({formRoom.campus})
        {/* ({DORM_LABELS.CAMPUS[formRoom.campus as keyof typeof DORM_LABELS.CAMPUS] || formRoom.campus}) */}
      </h1>

      <div className="grid grid-cols-1 gap-x-12 text-[16px] px-2 py-2 bg-green-50 border border-green-300 rounded-xl animate-fadeIn">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-black shrink-0">Gender / เพศ :</span>
          <span className="text-gray-700">
            {/* {formResident.gender} */}
            {DORM_LABELS.GENDER[formResident.gender as keyof typeof DORM_LABELS.GENDER] || formResident.gender}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <span className="font-bold text-black shrink-0">Type of student / ประเภทของผู้พัก :</span>
          <span className="text-gray-700">
            {/* {currentBooking.type} */}
            {DORM_LABELS.RESIDENT_TYPE[currentBooking.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || currentBooking.type}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <span className="font-bold text-black shrink-0">Selected Campus / วิทยาเขต :</span>
          <span className="text-gray-700">
            {/* {formRoom.campus} */}
            {DORM_LABELS.CAMPUS[formRoom.campus as keyof typeof DORM_LABELS.CAMPUS] || formRoom.campus}
          </span>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 mt-1 rounded-2xl">
          <div className="gap-2">
            {/* <div className="w-1.5 h-6 bg-[#006633] rounded-full"></div> เส้นแถบสีเขียวข้างหน้า */}
            <span className="font-bold text-gray-800 text-[16px]">Vibe Roommate / เพื่อนร่วมห้องที่เข้ากันได้ดี</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {formResident?.lifestyle && formResident.lifestyle.length > 0 ? (
              formResident.lifestyle.map((id: string) => {
                // ดึงค่า Config จาก Constants
                const config = DORM_LABELS.LIFESTYLE[id as keyof typeof DORM_LABELS.LIFESTYLE];

                if (!config) return null;

                const Icon = config.icon; // เก็บ Component ไว้ในตัวแปรตัวใหญ่

                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-100 text-[#126A31] text-[10px] md:text-[14px] rounded-xl shadow-sm transition-all duration-200 group" //hover:border-[#126A31]/30
                  >
                    {/* แสดง Icon พร้อมสีที่เป็นเอกลักษณ์ opacity-80 group-hover:opacity-100*/}
                    <Icon size={16} className="text-[#126A31]" />

                    {/* แสดง Label ภาษาไทย/อังกฤษ ที่เป็นทางการ */}
                    <span className="font-bold">
                      {config.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 italic text-[13px] py-1 ml-3">
                ไม่ได้ระบุไลฟ์สไตล์เพิ่มเติม
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <div className="h-[1px] bg-gray-100 w-full mt-4"></div> */}

      {isLoading ? (
        <div className="space-y-4">
          <ZoneCardSkeleton />
          <ZoneCardSkeleton />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="md:col-span-2 mt-4 mb-2">
            <span className="font-bold text-black">Preferred dorm / เลือกหอพักโซน </span>
            <span className="text-red-500">*</span>
          </div>
          {filteredDorms.map((dorm) => (
            <div
              key={dorm.id}
              className="bg-white pt-4 pr-4 pl-4 pb-2 md:p-8 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)]  hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-gray-50"
              onClick={() => handleSelectDorm(dorm)}
            >
              {/* 2. Container ของรูปภาพ: จะถูกบีบด้วย padding ของตัวแม่ */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] shadow-inner">
                <img
                  src={zoneImages[dorm.name[0]] || "/images/zones/default.png"}
                  alt={`${dorm.name || "Zone ..."}`}
                  // เพิ่ม scale และ rotate เล็กน้อยตอน hover ให้ดูมีมิติเหมือนกระดาษขยับ
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
                />
              </div>

              <div className="mt-2 flex justify-between items-center px-2">
                <div className="font-bold text-gray-800 text-[16px] md:text-2xl">
                  {`${dorm.name || "Zone ..."}`}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // กันไม่ให้มันไปลั่นโดน Event เลือกโซนของตัวแม่
                    // console.log("Map URL:", zone.mapUrl);
                    // ตรวจสอบว่ามี mapUrl หรือไม่
                    if (dorm.mapUrl) {
                      window.open(dorm.mapUrl, "_blank");
                    } else {
                      // ถ้าไม่มีลิงก์ใน DB ให้เด้งไปค้นหาใน Google Maps ตามชื่อโซนแทน (กันพลาด)
                      const fallbackUrl = `https://www.google.com/maps`;
                      window.open(fallbackUrl, "_blank");
                    }
                  }}
                  className="bg-[#FF0000] text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-md hover:bg-red-700 hover:shadow-lg transition-all flex items-center gap-2 uppercase"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" clipRule="evenodd" />
                  </svg>
                  Location / ที่ตั้ง
                </button>
              </div>
            </div>
          ))}

          {filteredDorms.length === 0 && !isLoading && (
            <p className="text-center text-gray-400 py-10">ไม่พบโซนที่พักในวิทยาเขตนี้</p>
          )}
        </div>
      )
      }

      <div className="mt-10">
        <button
          onClick={() => setStep(4)}
          className="flex-1 bg-[#7D856C] text-white py-3 px-[52px] rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-black transition-all"
        >
          Back
        </button>
      </div>
    </div >
  );
}