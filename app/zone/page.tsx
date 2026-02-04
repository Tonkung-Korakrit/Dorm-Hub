// zone/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 1. กำหนด Type สำหรับ Mapping รูปภาพโซน
const zoneImages: Record<string, string> = {
  B: "/images/zones/B.png",
  C: "/images/zones/C.png",
  F5: "/images/zones/F.png",
  F6: "/images/zones/F.png",
  M1: "/images/zones/M.png",
  M2: "/images/zones/M.png",
};

// แยกเนื้อหาออกมาเพื่อให้ใช้ Suspense ได้
function ZoneSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 2. ระบุ Type ให้ชัดเจน (get คืนค่าเป็น string | null)
  const region = searchParams.get("region");
  
  // 3. กำหนด State เป็น Array ของ string
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    if (!region) return;

    fetch(`/api/zones?region=${region}`)
      .then((res) => res.json())
      .then((data: string[]) => setZones(data)) // ระบุ Type ที่ได้จาก API
      .catch((err) => console.error("Fetch zones error:", err));
  }, [region]);

  if (!region) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 animate-pulse">Loading region data...</p>
      </div>
    );
  }

  const handleSelectZone = (zone: string) => {
    router.push(`/room?region=${region}&zone=${zone}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-[18px] font-semibold text-gray-700 mb-6 border-b pb-4">
        เลือกโซน / Select Zone ({region})
      </h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {zones.map((zone) => (
          <div
            key={zone}
            onClick={() => handleSelectZone(zone)}
            className="group cursor-pointer rounded-2xl shadow-sm border-2 border-transparent bg-white p-4 transition-all duration-300 hover:border-green-400 hover:shadow-xl text-center"
          >
            <div className="relative overflow-hidden rounded-xl mb-3 h-32">
              <img
                src={zoneImages[zone] || "/images/zones/default.png"}
                alt={`Zone ${zone}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="font-bold text-gray-700 group-hover:text-green-600 transition-colors">
              Zone {zone}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-start">
        <button
          onClick={() => router.push("/book")}
          className="px-6 py-2 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <span>←</span> กลับไปหน้าเลือกวิทยาเขต
        </button>
      </div>
    </div>
  );
}

// ส่วนหลักที่ Export ต้องห่อด้วย Suspense
export default function SelectZonePage() {
  return (
    <Suspense fallback={<p className="text-center p-10">Loading...</p>}>
      <ZoneSelectionContent />
    </Suspense>
  );
}