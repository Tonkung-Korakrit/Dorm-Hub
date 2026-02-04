"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import useSWR from "swr";
import { useBooking } from "@/app/contexts/BookingContext";
// Icons: npm install react-icons
import { HiUser, HiIdentification, HiTruck, HiHome } from "react-icons/hi";
import { MdApartment, MdChair, MdExitToApp } from "react-icons/md";

interface Room {
  id: number;
  roomId: string;
  floor: number;
  zone: string;
  price: number;
  capacity: number;
  currentOccupancy: number;
  available: boolean;
  status: "available" | "pending" | "full";
  posX: number | null;
  posY: number | null;
  type: "ROOM" | "LOUNGE" | "STAIRS" | "EXIT";
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SelectRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const region = searchParams.get("region");
  const zone = searchParams.get("zone");

  const [confirmRoom, setConfirmRoom] = useState<Room | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<string>("2");

  const { formRoom, formUser } = useBooking();

  const { data: rooms, mutate } = useSWR<Room[]>(
    region && zone ? `/api/room?region=${region}&zone=${zone}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const roomsByFloor = rooms?.reduce((acc: Record<string, Room[]>, room) => {
    const floorStr = String(room.floor);
    if (!acc[floorStr]) acc[floorStr] = [];
    acc[floorStr].push(room);
    return acc;
  }, {}) || {};

  const handleFinalConfirm = async () => {
    if (!confirmRoom) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("../api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: formUser, room: { ...confirmRoom, type: formRoom.type } }),
      });
      if (!res.ok) throw new Error("Booking failed");
      router.push("/confirmation");
    } catch (err: any) {
      alert(err.message);
      mutate();
      setShowSummary(false);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#91b838] to-[#6d8a2a] p-2 md:p-8 font-sans">
      
      {/* 1. Stepper Bar - ปรับขนาดเล็กลงบนมือถือ */}
      <div className="max-w-xl mx-auto flex justify-between items-center mb-6 md:mb-10 text-white px-2">
        <StepIcon icon={<HiUser size={18} className="md:w-6 md:h-6" />} label="Student" active />
        <Line />
        <StepIcon icon={<HiIdentification size={18} className="md:w-6 md:h-6" />} label="Profile" active />
        <Line />
        <StepIcon icon={<HiTruck size={18} className="md:w-6 md:h-6" />} label="Vehicle" active />
        <Line />
        <StepIcon icon={<HiHome size={18} className="md:w-6 md:h-6" />} label="Room" active current />
      </div>

      {/* 2. Main Container Card - ใช้ w-full และ md:max-w-4xl */}
      <div className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-4 md:p-12 relative overflow-hidden">
        <h1 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-6 md:mb-8 border-b pb-4">
          Room Information / ข้อมูลห้องพัก
        </h1>

        {/* รายละเอียดผู้จอง - ปรับเป็น 1 คอลัมน์บนมือถือ 2 บนคอมฯ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 mb-6 md:mb-8 text-[12px] md:text-[14px] text-gray-600 font-medium px-2">
          <p><span className="text-black font-bold">Gender :</span> {formUser.gender}</p>
          <p><span className="text-black font-bold">Selected campus / วิทยาเขตที่เลือก :</span> {region}</p>
          <p className="md:col-span-2"><span className="text-black font-bold">Selected zone / โซนที่เลือก :</span> {formRoom.zone}</p>
          <p className="md:col-span-2"><span className="text-black font-bold">Type of student / ประเภทของผู้พัก :</span> {formRoom.type}</p>
        </div>

        {/* 3. Floor Selection - ทำให้เลื่อนได้ถ้าปุ่มเยอะเกิน */}
        <div className="mb-6 md:mb-8">
          <p className="text-xs md:text-sm font-bold text-gray-800 mb-3">Select Floor / เลือกชั้น*</p>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            {Object.keys(roomsByFloor).sort((a,b)=>Number(a)-Number(b)).map(f => (
              <button
                key={f}
                onClick={() => setSelectedFloor(f)}
                className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 font-bold transition-all shadow-sm
                  ${selectedFloor === f ? "bg-green-900 border-green-900 text-white scale-105" : "bg-white border-green-800 text-green-800"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Legend - จัดระเบียบใหม่บนมือถือ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 text-[10px] md:text-[11px] font-bold p-3 bg-gray-50 rounded-2xl gap-2">
          <p className="text-gray-400">Select Room / เลือกห้อง*</p>
          <div className="flex gap-3 md:gap-4">
            <LegendItem color="bg-green-800" label="ว่าง" />
            <LegendItem color="bg-yellow-400" label="จองชั่วคราว" />
            <LegendItem color="bg-red-600" label="ไม่ว่าง" />
          </div>
        </div>

        {/* 5. Floor Plan Matrix - หัวใจหลักของความ Responsive */}
        <div className="relative bg-white border border-gray-300 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 shadow-inner overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
          <div
            className="inline-grid gap-2 md:gap-4 mx-auto"
            style={{
              gridTemplateColumns: "repeat(15, 40px)", // บนมือถือใช้ 40px
              gridTemplateRows: "repeat(25, 40px)",
              // บนคอมพิวเตอร์ปรับขนาดเพิ่ม
              ...(typeof window !== 'undefined' && window.innerWidth >= 768 && {
                gridTemplateColumns: "repeat(15, 48px)",
                gridTemplateRows: "repeat(25, 48px)",
              })
            }}
          >
            {roomsByFloor[selectedFloor]?.map((room) => {
              const x = Number(room.posX) || 1;
              const y = Number(room.posY) || 1;

              return (
                <div key={room.id} style={{ gridColumnStart: x, gridRowStart: y }} className="relative">
                  <button
                    disabled={!room.available}
                    onClick={() => room.available && setConfirmRoom(room)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shadow-md z-10 relative
                      ${getRoomColor(room)} text-white active:scale-90`}
                  >
                    {getRoomIcon(room)}
                  </button>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] text-gray-400 font-black tracking-tighter whitespace-nowrap">
                    {room.type === "ROOM" ? room.roomId : ""}
                  </span>
                </div>
              );
            })}
          </div>
          {/* ข้อความบอกผู้ใช้มือถือ */}
          <p className="text-center text-[10px] text-gray-500 mt-6 md:hidden">← เลื่อนซ้าย-ขวาเพื่อดูแผนผังทั้งหมด →</p>
        </div>

        {/* 6. Back Button */}
        <div className="mt-8 md:mt-12 flex justify-center">
          <button onClick={() => router.back()} className="w-full md:w-auto px-12 py-3 bg-gray-400 text-white rounded-2xl font-black hover:bg-gray-500 shadow-xl transition-all uppercase tracking-widest text-sm">Back</button>
        </div>
      </div>

      {/* 7. POPUP MODAL - ปรับให้เต็มจอในมือถือ */}
      {confirmRoom && !showSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center z-[100] p-0 md:p-4 transition-all">
          <div className="bg-white p-6 md:p-10 rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-sm border-t-4 md:border-4 border-green-50 animate-in slide-in-from-bottom duration-300">
             {/* เนื้อหา Modal (เหมือนเดิมแต่ปรับ Font) */}
             <div className="text-center mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-green-800 text-white rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                   <span className="text-2xl md:text-3xl font-black">{confirmRoom.roomId}</span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-gray-800 italic uppercase">Confirm Room</h2>
             </div>
             {/* ...ส่วนรายละเอียดห้อง... */}
             <div className="flex flex-col gap-3">
                <button onClick={() => setShowSummary(true)} className="w-full py-4 bg-green-800 text-white rounded-2xl font-black hover:bg-black transition-all uppercase">Booking Now</button>
                <button onClick={() => setConfirmRoom(null)} className="w-full py-3 text-gray-400 font-bold">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* 8. SUMMARY SCREEN (Final Review) */}
      {showSummary && confirmRoom && (
        <div className="fixed inset-0 bg-white z-[200] p-4 md:p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-2xl border border-gray-100">
             {/* ...ส่วนสรุปข้อมูล (เหมือนเดิมแต่ปรับ padding ให้เหมาะสมกับมือถือ)... */}
             <h1 className="text-2xl md:text-3xl font-black text-center mb-6 md:mb-10 uppercase italic">Review</h1>
             <div className="flex flex-col gap-4 mt-8">
                <button disabled={isSubmitting} onClick={handleFinalConfirm} className="w-full py-5 bg-[#91b838] text-white rounded-[2rem] font-black text-lg md:text-xl shadow-xl hover:bg-black transition-all uppercase tracking-widest">
                   {isSubmitting ? "PROCESSING..." : "CONFIRM BOOKING"}
                </button>
                <button onClick={() => setShowSummary(false)} className="text-gray-400 font-bold uppercase text-sm text-center">Back to Edit</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components ---
function getRoomIcon(room: Room) {
  if (room.type === "LOUNGE") return <MdChair size={24} />;
  if (room.type === "EXIT") return <MdExitToApp size={24} />;
  return <MdApartment size={22} />;
}

function getRoomColor(room: Room) {
  // if (room.type !== "ROOM") return "bg-green-800 ";
  if (!room.available) return "bg-red-600";
  if (room.status === "pending") return "bg-yellow-400";
  return "bg-[#126A31] hover:scale-110 hover:shadow-xl hover:z-20";
}

function StepIcon({ icon, label, active, current }: { icon: any, label: string, active?: boolean, current?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all
        ${active ? "bg-white text-green-700 border-white shadow-lg" : "border-white/30 text-white/40"}
        ${current ? "ring-8 ring-white/10" : ""}`}>
        {icon}
      </div>
      <span className={`text-[11px] font-black tracking-widest uppercase ${active ? "text-white" : "text-white/40"}`}>{label}</span>
    </div>
  );
}

function Line() { return <div className="h-[2px] bg-white/30 flex-grow mb-6 mx-2"></div>; }
function LegendItem({ color, label }: { color: string, label: string }) {
  return <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${color}`}></div> {label}</div>;
}

export default function SelectRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#91b838] flex items-center justify-center text-white font-black text-4xl">DORM HUB</div>}>
      <SelectRoomContent />
    </Suspense>
  );
}