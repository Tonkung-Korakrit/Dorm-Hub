// RoomGridSelection.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { useBooking } from "@/app/contexts/BookingContext";
import {
  // MdApartment,
  // MdWc,
  // MdGroups,
  MdMeetingRoom,
  MdLock,
  MdInfo,
  MdClose
} from "react-icons/md";
import { Room, RoomStatus, Booking, BookingType } from "@/types/booking";
import { createPortal } from "react-dom";
import { DORM_LABELS } from "@/lib/constants";
import { RoomGridSkeleton } from "@/app/loading/components/ิbook/RoomGridSkeleton";
import { RiHomeSmileFill } from "react-icons/ri";
import { SiGoogleclassroom } from "react-icons/si";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RoomGridProps {
  setStep: (step: number) => void;
}

export function RoomGridSelection({ setStep }: RoomGridProps) {
  const { formResident, setFormResident, formRoom, setFormRoom, currentBooking, setCurrentBooking } = useBooking();

  // console.log("formRoom in Summary:", formRoom);

  const [confirmRoom, setConfirmRoom] = useState<Room | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>("2");
  const [checkIsMobile, setCheckIsMobile] = useState(false);

  const isCharterSelected = currentBooking.type === BookingType.CHARTER;
  const currentOcc = confirmRoom?.currentOccupancy || 0;
  // const isCharterBroken = isCharterSelected && currentOcc > 0;

  // const isCharterBroken = isCharterSelected && (confirmRoom?.currentOccupancy || 0) > 0;
  // const isRoomFull = !isCharterSelected && currentOcc >= (confirmRoom?.capacity || 0);
  // const cannotBook = isCharterBroken || isRoomFull;

  // 1. ถ้าเลือกเหมา: ต้องไม่มีคนอยู่ (Occ = 0) และสถานะต้องไม่ใช่ FULL หรือ PENDING จากคนอื่น
  const isCharterBroken = isCharterSelected && (currentOcc > 0 || confirmRoom?.status !== RoomStatus.AVAILABLE);

  // 2. ถ้าเลือกจองปกติ: ต้องไม่เกินความจุ และสถานะต้องไม่เป็น FULL
  const isRoomFull = !isCharterSelected && (currentOcc >= (confirmRoom?.capacity || 0) || confirmRoom?.status === RoomStatus.FULL);
  const cannotBook = isCharterBroken || isRoomFull;

  const dormName = formRoom?.dorm?.name;
  const [selectedSuite, setSelectedSuite] = useState<any>(null);

  // const popupWidth = checkIsMobile ? Math.min(windowWidth - 40, 240) : 260;

  const floorLabel = selectedFloor === "1" ? "1" : "2";
  const planImage = ["M1", "M2", "F5", "F6", "F7"].includes(dormName)
    ? `/images/zones/plans/${dormName}.png`
    : `/images/zones/plans/${dormName}_${floorLabel}.png`;

  // console.log({
  //   type: currentBooking.type,
  //   isCharterSelected,
  //   currentOcc,
  //   isCharterBroken,
  //   cannotBook
  // });

  const [popupPos, setPopupPos] = useState({
    top: 0,
    left: 0,
    isTopRow: false,
    arrowOffset: 0,
    actualWidth: 320,
    isCenter: false,
  });

  useEffect(() => {
    // ใช้ 640px เป็นตัวแบ่ง (Medium breakpoint)
    const media = window.matchMedia('(max-width: 639px)');

    setCheckIsMobile(media.matches);

    const listener = (e: MediaQueryListEvent) => setCheckIsMobile(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleGlobalScroll = () => {
      if (confirmRoom) setConfirmRoom(null);
    };

    // ใช้ true เพื่อดักจับ Event ทุกระดับ (Capture Phase)
    window.addEventListener("scroll", handleGlobalScroll, true);
    return () => window.removeEventListener("scroll", handleGlobalScroll, true);
  }, [confirmRoom]);

  // ฟังก์ชันคำนวณ % การ Match
  const calculateMatch = (roomConfig: any) => {
    // 1. เช็คว่ามีข้อมูลทั้งฝั่งห้อง และฝั่งนักศึกษาหรือไม่
    if (!roomConfig || !Array.isArray(roomConfig) || !formResident.lifestyle || formResident.lifestyle.length === 0) {
      return 0;
    }

    try {
      // 2. ไม่ต้อง JSON.parse แล้ว เพราะ Prisma จัดการให้แล้ว
      const roomTags = roomConfig as string[];
      const userTags = formResident.lifestyle;

      // 3. คำนวณหาจุดที่ตรงกัน (Intersection)
      const matches = roomTags.filter(tag => userTags.includes(tag));

      // 4. คำนวณเป็น % (เทียบกับจำนวนไลฟ์สไตล์ที่ User เลือก)
      return Math.round((matches.length / userTags.length) * 100);
    } catch (error) {
      console.error("Match calculation error:", error);
      return 0;
    }
  };

  // console.log(formRoom);

  // ดึงข้อมูลห้องพักแบบ Real-time (ตรวจสอบชื่อ API ให้ตรงกับที่คุณสร้างไว้)
  const { data: rooms, mutate, isLoading } = useSWR<Room[]>(
    formRoom.dorm ? `/api/rooms?campus=${formRoom.campus}&dorm=${formRoom.dorm.name}` : null, // &floor=${selectedFloor}
    fetcher,
    {
      refreshInterval: 5000, // อัพเดตข้อมูลทุก 5 วินาที
      dedupingInterval: 2000, // ถ้ากดซ้ำๆ ภายใน 2 วิ ไม่ต้องยิงใหม่
      revalidateOnFocus: true, // กลับมาที่หน้าจอปุ๊บ เช็คให้ทันที (อันนี้สำคัญกว่าสุ่มยิง)

      // revalidateOnFocus: false,  // (เพิ่มเติม) ปิดการโหลดใหม่เมื่อสลับหน้าจอกลับมา
      // revalidateOnReconnect: false,
    }
  );

  // จัดกลุ่มห้องพักตามชั้น (ใช้ Optional Chaining เพื่อความปลอดภัย)
  const roomsByFloor = (Array.isArray(rooms) ? rooms : []).reduce((acc: Record<string, Room[]>, room) => {
    if (room.parentId) return acc;

    const floorStr = String(room.floor);
    if (!acc[floorStr]) acc[floorStr] = [];
    acc[floorStr].push(room);
    return acc;
  }, {});

  // console.log(roomsByFloor)
  // console.log("confirmRoom: ", confirmRoom)

  // 3. เมื่อเลือกห้องพักใน Modal
  const handleSelectRoom = () => {
    if (confirmRoom) {
      setFormRoom((prev: any) => ({
        ...prev,
        roomId: confirmRoom.roomId,
        price: confirmRoom.price,
        floor: confirmRoom.floor,
        id: confirmRoom.id,
        // เก็บก้อนข้อมูล zone และ dorm ลงไปใน Context เพื่อใช้ในหน้า Summary
        dorm: {
          ...prev.dorm,
          name: confirmRoom.dorm,
        },
        lifestyleConfig: confirmRoom.lifestyleConfig,
        roomType: confirmRoom.roomType,
      }));
      setConfirmRoom(null);
      // setSelectedSuite(null);
      setStep(7);
    }
  };

  // const canUserBookRoom = (room: Room) => {
  //   if (isCharterSelected) {
  //     // ถ้าเหมาห้อง: ต้องเป็นห้องที่ไม่มีคนอยู่เลย (0 คน) และสถานะต้อง Available เท่านั้น
  //     return room.currentOccupancy === 0 && room.status === RoomStatus.AVAILABLE;
  //   } else {
  //     // ถ้าไม่เหมาห้อง: จองได้ถ้าห้องยังไม่เต็ม (Occupancy < Capacity) และไม่ใช่สถานะ FULL
  //     return room.currentOccupancy < room.capacity && room.status !== RoomStatus.FULL;
  //   }
  // };

  const canUserBookRoom = (room: Room) => {
    const isCharterSelected = currentBooking.type === BookingType.CHARTER;

    // --- กรณีห้องชุด (ห้องแม่บน Grid) ---
    if (room.isSuite && room.subRooms) {
      if (isCharterSelected) {
        // โหมดเหมา: ยอมให้กดห้องแม่ได้ ถ้า "มีอย่างน้อย 1 ห้องย่อยที่ไม่มีคนอยู่เลย"
        // เพราะผู้ใช้อาจจะอยากเข้าไปเหมาห้อง A ที่ว่าง แม้ห้อง B จะมีคนอยู่แล้วก็ตาม
        return room.subRooms.some(sub => sub.currentOccupancy === 0 && sub.status === RoomStatus.AVAILABLE);
      } else {
        // โหมดปกติ: ขอแค่มีลูกอย่างน้อย 1 ห้องที่ยังไม่เต็ม (เช่น 1/2 ก็ยังจองได้)
        return room.subRooms.some(sub => sub.currentOccupancy < sub.capacity && sub.status !== RoomStatus.FULL);
      }
    }

    // --- กรณีห้องปกติ หรือ ห้องย่อย (A/B) ที่อยู่ใน Modal ---
    if (isCharterSelected) {
      // ต้องว่างเปล่า 100% ถึงจะเหมาได้
      return room.currentOccupancy === 0 && room.status === RoomStatus.AVAILABLE;
    } else {
      // จองปกติ แค่ไม่เต็มก็พอ
      return room.currentOccupancy < room.capacity && room.status !== RoomStatus.FULL;
    }
  };

  const handleRoomClick = (e: React.MouseEvent<HTMLButtonElement>, room: Room) => {
    if (room.status === RoomStatus.COMMON) return;

    // const canBook = canUserBookRoom(room);
    // if (!canBook) return; // ถ้าจองไม่ได้ (แดง) ก็ไม่ต้องให้คลิกเปิด Modal หรือ Popup

    if (confirmRoom?.id === room.id) {
      setConfirmRoom(null);
      return;
    }

    // 2. กรณีห้องชุด (Suite): เปิด Modal กลางจอ แทน Popup ปกติ
    if (room.isSuite) {
      setSelectedSuite(room); // เก็บข้อมูล Suite ไว้เปิด Modal
      setConfirmRoom(null);   // เคลียร์การเลือกห้องปกติ (ถ้ามี)
      return; // จบการทำงาน ไม่ต้องคำนวณตำแหน่ง Popup
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 1. ปรับความกว้างตามหน้าจอจริง (Mobile Safe)
    const isMobile = windowWidth < 768;
    const popupWidth = isMobile ? Math.min(windowWidth - 40, 280) : 320;
    const screenPadding = 20;

    // 2. เช็คพื้นที่แนวตั้ง (Flip อัตโนมัติถ้าพื้นที่ข้างล่างไม่พอ)
    const spaceBelow = windowHeight - rect.bottom;
    const isTop = spaceBelow < 300; // ถ้าเหลือน้อยกว่า 300px ให้เด้งขึ้นบน

    let leftPos = rect.left + rect.width / 2;

    // 3. ป้องกันหลุดขอบซ้าย-ขวาแบบ Dynamic
    const minLeft = popupWidth / 2 + screenPadding;
    const maxLeft = windowWidth - (popupWidth / 2 + screenPadding);

    if (leftPos < minLeft) leftPos = minLeft;
    if (leftPos > maxLeft) leftPos = maxLeft;

    setPopupPos({
      top: isTop ? rect.top : rect.bottom,
      left: leftPos,
      isTopRow: isTop,
      arrowOffset: (rect.left + rect.width / 2) - leftPos,
      actualWidth: popupWidth, // ส่งค่า width ไปใช้ใน CSS ด้วย
      isCenter: false,
    });

    setConfirmRoom(room);
  };

  // console.log("formRoom: ", formRoom)

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-[24px] font-bold mb-4 text-gray-700">
        Room Information / ข้อมูลห้องพัก (โซน {formRoom?.dorm?.name || "-"})
      </h1>

      <div className="grid grid-cols-1 gap-x-12 text-[16px] text-gray-600 px-2 py-2 bg-green-50 border border-green-300 rounded-xl animate-fadeIn">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-black shrink-0">Gender / เพศ:</span>
          <span className="text-gray-700">
            {/* {formResident?.gender || "-"} */}
            {DORM_LABELS.GENDER[formResident.gender as keyof typeof DORM_LABELS.GENDER] || formResident.gender}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <span className="font-bold text-black shrink-0">Resident Type / ประเภทของผู้พัก:</span>
          <span className="text-gray-700">
            {/* {currentBooking?.type || "-"} */}
            {DORM_LABELS.RESIDENT_TYPE[currentBooking.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || currentBooking.type}
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <span className="font-bold text-black shrink-0">Selected Campus / วิทยาเขต:</span>
          <span className="text-gray-700">
            {/* {formRoom?.campus || "-"} */}
            {DORM_LABELS.CAMPUS[formRoom.campus as keyof typeof DORM_LABELS.CAMPUS] || formRoom.campus}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-bold text-black">Selected Dorm / หอพักโซน:</span>
          <span className="text-gray-700">
            {formRoom?.dorm?.name || "-"}
          </span>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 mt-1 bg-gray-50/50 rounded-2xl">
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

                const Icon = config.icon;

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
              <div className="text-gray-400 italic text-[13px] py-1 ml-3">
                ไม่ได้ระบุไลฟ์สไตล์เพิ่มเติม
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <RoomGridSkeleton
          maxCols={formRoom?.dorm?.maxCols || 5}
          maxRows={formRoom?.dorm?.maxRows || 5}
        />
      ) : (
        <>
          {/* Floor Selection */}
          <div className="mt-4 mb-4">
            <p className="text-[16px] font-bold text-gray-800 mb-3">Choose floor / เลือกชั้น <span className="text-red-500">*</span></p>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {Object.keys(roomsByFloor).length > 0 ? (
                Object.keys(roomsByFloor).sort((a, b) => Number(a) - Number(b)).map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFloor(f)}
                    className={`flex-shrink-0 w-10 h-12 rounded-xl border-2 font-bold transition-all shadow-sm
                  ${selectedFloor === f ? "bg-[#006432] border-[#006432] text-white scale-105" : "bg-white border-gray-200 text-gray-400 hover:border-[#91b838]"}`}
                  >
                    {f}
                  </button>
                ))
              ) : (
                <p className="text-gray-400 italic">กำลังโหลดข้อมูลชั้น...</p>
              )}
            </div>
          </div>

          {/* Floor Selection */}
          {/* <div className="mb-4">
            <p className="text-[12px] font-bold text-gray-800 mb-3">
              Choose floor / เลือกชั้น <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">

              {Array.isArray(formRoom?.zone?.floors) && formRoom.zone.floors.length > 0 ? (
                [...formRoom.zone.floors]
                  .sort((a, b) => Number(a) - Number(b))
                  .map((f: any) => {
                    const floorStr = String(f);
                    return (
                      <button
                        key={floorStr}
                        onClick={() => {
                          setSelectedFloor(floorStr);
                          setConfirmRoom(null); // ปิด Popup เมื่อเปลี่ยนชั้น
                        }}
                        className={`flex-shrink-0 w-10 h-12 rounded-xl border-2 font-bold transition-all shadow-sm
                ${selectedFloor === floorStr
                            ? "bg-[#006432] border-[#006432] text-white scale-105"
                            : "bg-white border-gray-200 text-gray-400 hover:border-[#91b838]"}`}
                      >
                        {floorStr}
                      </button>
                    );
                  })
              ) : (
                <p className="text-gray-400 italic">ไม่มีข้อมูลชั้นในโซนนี้</p>
              )}
            </div>
          </div> */}

          {/* Legend & Grid Layout (คงเดิมแต่ปรับความเสถียร) */}
          {/* <div className="flex gap-4 mb-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 justify-end">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#126A31]"></div> ว่าง</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> จองชั่วคราว</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-600"></div> ไม่ว่าง</div>
      </div> */}

          {/* <div className="flex flex-wrap gap-6 mb-2 justify-center border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#126A31]"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">Available</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">Reserved</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">Occupied</span>
            </div>
          </div> */}
          <p className="text-[12px] font-bold text-gray-500 mb-2">*** Status ***</p>
          <div className="flex flex-wrap gap-2 mb-2 justify-center border-b border-gray-50 pb-2">
            <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
              <span className="w-5 h-5 rounded-md bg-[#126A31] flex items-center justify-center">
                <RiHomeSmileFill size={12} className="text-white" />
              </span>
              <span className="text-[11px] font-bold text-gray-500">AVAILABLE (ว่าง)</span>
            </div>

            <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
              <span className="w-5 h-5 rounded-md bg-yellow-400 flex items-center justify-center">
                <MdInfo size={12} className="text-white" />
              </span>
              <span className="text-[11px] font-bold text-gray-500">PENDING (รอชำระ)</span>
            </div>

            <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
              <span className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center">
                <MdLock size={12} className="text-white" />
              </span>
              <span className="text-[11px] font-bold text-gray-500">FULL (เต็ม)</span>
            </div>

            <div className="flex items-center gap-2 border border-gray-500 px-1 py-1 rounded-lg">
              <span className="w-5 h-5 rounded-md bg-[#D9D9D9] flex items-center justify-center">
                <SiGoogleclassroom size={12} className="text-gray-500" />
              </span>
              <span className="text-[11px] font-bold text-gray-500">COMMON (ส่วนกลาง)</span>
            </div>
          </div>

          <p className="text-[16px] font-bold text-gray-800 mb-3">Select Room / เลือกห้อง <span className="text-red-500">*</span></p>

          <div className="relative bg-[#f8fcf8] border border-gray-100 rounded-[2rem] p-4 md:p-8 shadow-inner overflow-x-auto h-auto w-full">
            <div
              className="inline-grid gap-2 sm:gap-3" //md:gap-4

              style={{
                gridTemplateColumns: `repeat(${formRoom?.dorm?.maxCols}, "42px")`,
                gridTemplateRows: `repeat(${formRoom?.dorm?.maxRows}, "42px")`, // 42px
                backgroundImage: `url(${planImage})`,
                // backgroundSize: '100% 100%', // บังคับให้รูปยืดเต็มจำนวนช่อง Grid เป๊ะๆ
                // backgroundSize: 'contain',
                backgroundSize: 'cover', // 
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'rgba(255, 255, 255, 0.4)', // ใส่พื้นหลังสีขาวจางๆ หรือ Overlay เพื่อให้เห็นแปลนแต่ไม่แย่งซีนปุ่ม
                // backgroundBlendMode: 'overlay'

                // 4. เพิ่ม Aspect Ratio เพื่อคุมไม่ให้ Container เพี้ยน
                aspectRatio: `${formRoom?.dorm?.maxCols} / ${formRoom?.dorm?.maxRows}`,

                // 5. บังคับขนาดขั้นต่ำให้พอดีกับจำนวนช่อง (กรณีช่องน้อยๆ รูปจะได้ไม่เล็กเกินไป)
                minWidth: `${(formRoom?.dorm?.maxCols || 0) * 42}px`,
                minHeight: `${(formRoom?.dorm?.maxRows || 0) * 42}px`,
              }}
            >
              {roomsByFloor[selectedFloor]?.map((room) => {
                const isSelected = confirmRoom?.id === room.id;
                const canBook = canUserBookRoom(room);
                const matchScore = calculateMatch(room.lifestyleConfig);
                const isCharterSelected = currentBooking.type === BookingType.CHARTER;
                // const isCharterBroken = isCharterSelected && (currentOcc > 0 || confirmRoom?.status !== RoomStatus.AVAILABLE);

                const roomConfig = DORM_LABELS.ROOM_TYPES[room.roomType as keyof typeof DORM_LABELS.ROOM_TYPES];
                const Icon = roomConfig?.icon || MdMeetingRoom;

                const posX = Number(room.posX) || 1;
                const posY = Number(room.posY) || 1;

                return (
                  <div
                    key={room.id}
                    // ใช้ posY * -1 เพื่อจัดการลำดับ Grid ตามที่คุณต้องการ
                    style={{ gridColumnStart: posX, gridRowStart: posY * -1 }}
                    className="relative"
                  >
                    {/* ป้าย MATCH สำหรับห้องที่มีรูมเมท Vibe ตรงกัน */}
                    {room.currentOccupancy > 0 && matchScore >= 50 && (
                      <div className="absolute -top-3 -left-2 z-20 bg-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white animate-bounce">
                        MATCH!
                      </div>
                    )}

                    <button
                      onClick={(e) => handleRoomClick(e, room)}
                      aria-label={`ห้อง ${room.roomId}, ชั้น ${room.floor}, สถานะ ${room.status}, ความเหมาะสมกับคุณ ${matchScore}%`}
                      title={`Room ${room.roomId} - ${room.status}`}
                      className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shadow-sm z-10 relative
                    ${getRoomColor(room, canBook, isCharterSelected)}
                    ${isSelected ? "ring-4 ring-yellow-300 scale-105" : "hover:scale-105"} 
                    ${room.status === 'COMMON' ? "cursor-default" : "cursor-pointer"}`
                      }
                    >

                      {/* แสดง Icon ตามประเภทห้อง */}
                      {/* <Icon size={`${checkIsMobile ? 24 : 28}`} className="text-white" /> */}

                      {/* แสดงแม่กุญแจกรณีล็อก (ยกเว้นพื้นที่ส่วนกลาง) */}
                      {/* {!canBook && (
                        <MdLock className="absolute top-0 right-0 text-[10px] text-white bg-red-500 rounded-full p-0.5" />
                      )} */}

                      {room.status === RoomStatus.COMMON ? (
                        <Icon size={checkIsMobile ? 24 : 28} className="text-gray-500 opacity-50" />
                      ) : (
                        <>
                          {/* 1. กรณีที่จองไม่ได้ (ไม่ว่าจะเพราะห้องเต็ม หรือ ผิดเงื่อนไข Charter) */}
                          {!canBook || room.status === RoomStatus.FULL ? (
                            <div className="flex flex-col items-center animate-fadeIn">
                              <MdLock size={20} className="text-white" />
                              <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Full</span>
                            </div>
                          ) : (
                            <>
                              {/* 2. สถานะรอชำระเงิน (Pending) */}
                              {room.status === RoomStatus.PENDING ? (
                                <div className="flex flex-col items-center animate-pulse">
                                  <MdInfo size={20} className="text-white" />
                                  <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Wait</span>
                                </div>
                              ) : (
                                /* 3. สถานะห้องว่าง (Available) และจองได้แน่นอน */
                                <div className="animate-zoomIn">
                                  <Icon size={checkIsMobile ? 24 : 28} className="text-white" />
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            {/* </div> */}

          </div>
        </>
      )}

      {selectedSuite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-zoomIn border border-white/20">

            {/* Header Section */}
            <div className=" pt-8 pr-8 pl-8 pb-2 text-black relative">
              <div className="relative z-10">
                <h1 className="text-[24px] font-black tracking-tight leading-tight">เลือกห้องพักย่อย / <br /> Choose a sub-room</h1>
                <p className="text-[16px] opacity-80 font-medium">Room Number: {selectedSuite.roomId}</p>
              </div>
              <button
                onClick={() => setSelectedSuite(null)}
                className="absolute z-50 top-8 right-8 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all active:scale-90"
              >
                <MdClose size={24} />
              </button>
            </div>

            {(() => {
              // ดึงเลขสองตัวท้ายออกมา
              const roomNum = parseInt(selectedSuite.roomId.replace(/\D/g, ''));
              const isEven = roomNum % 2 === 0;

              // Logic การสลับ AB หรือ BA
              let isBAFormat = false;

              if (isEven) {
                // ฝั่งเลขคู่ (612, 610...): 612 ต้อง AB, 610 ต้อง BA
                isBAFormat = (roomNum % 4 !== 0);
              } else {
                // ฝั่งเลขคี่ (613, 611...): 613 ต้อง BA, 611 ต้อง AB
                // 613 % 4 คือ 1 -> ต้องได้ true (BA)
                // 611 % 4 คือ 3 -> ต้องได้ false (AB)
                isBAFormat = (roomNum % 4 === 1);
              }
              const layoutType = isBAFormat ? "BA" : "AB";
              const position = isEven ? "Top" : "Below";

              const internalPlanImage = `/images/zones/plans/internal/Suite_B_Plan_${position}_${layoutType}.png`

              return (
                <div className="pt-0 pr-4 pl-4 pb-4 space-y-4">
                  <p className="text-gray-400 text-[12px] font-bold uppercase tracking-[0.2em] text-center">
                    Internal Layout / แผนผังภายในยูนิต
                  </p>

                  {/* Internal Floor Plan Container */}
                  <div className="relative aspect-[16/10] w-full bg-gray-50 rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center">

                    {/* ชั้นหลัง: รูปแผนผังห้องชุด (Internal Suite Plan) */}
                    <div
                      className="absolute top-4 bottom-4 left-1 right-1 grayscale-[0.5] opacity-60"
                      style={{
                        backgroundImage: `url('${internalPlanImage}')`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />

                    {/* ชั้นหน้า: ปุ่มเลือกห้อง A และ B (จัดตำแหน่งให้ตรงกับรูปแปลน) 

                      ${position === 'Top' ? 'pb-8 sm:pb-10' : 'pt-12 sm:pt-20 md:pt-24 pb-4'} 
                      px-4           // Mobile: ห่างขอบนิดเดียวพอ
                      sm:px-12       // Tablet: เริ่มขยายออก
                      md:px-[15%]    // Desktop: ใช้ % เพื่อให้มันอยู่กึ่งกลางสวยๆ ตลอดเวลา
                      lg:px-[20%]    // จอกว้างพิเศษ: บีบเข้ามาไม่ให้ห้องยาวเกินไป
                    
                    */}
                    <div className={`relative z-10 grid grid-cols-2 gap-2 w-full
                      ${position === 'Top' ? 'pb-[30px] sm:pb-[34px]'
                        : 'pt-[48px] sm:pt-[54px] md:pt-[80px] lg:pt-[92px] pb-[18px]'} 
                        md:pb-[48px] pl-[88px] pr-[88px] sm:pl-[112px] sm:pr-[112px]
                    `}>

                      {selectedSuite.subRooms?.map((subRoom: any) => {
                        const isFull = subRoom.currentOccupancy >= subRoom.capacity;
                        const canBook = canUserBookRoom(subRoom);
                        const label = subRoom.roomId.slice(-1); // "A" หรือ "B"\

                        const matchScore = calculateMatch(subRoom.lifestyleConfig);
                        const isCharterSelected = currentBooking.type === BookingType.CHARTER;
                        let statusColors = "";

                        if (isCharterSelected) {
                          // ถ้าเหมา: มีคนอยู่แม้แต่คนเดียว (Occ > 0) หรือสถานะไม่ใช่ AVAILABLE -> แดง
                          statusColors = (subRoom.currentOccupancy > 0 || subRoom.status !== RoomStatus.AVAILABLE)
                            ? "bg-[#FF0000] cursor-not-allowed"
                            : "bg-[#126A31] hover:bg-[#006432] hover:-translate-y-1";
                        } else {
                          // ถ้าจองปกติ: เต็มความจุ -> แดง, ยังไม่เต็ม -> เขียว
                          statusColors = isFull
                            ? "bg-[#FF0000] text-white" // กรณีเต็ม (แดงอ่อน)
                            : "bg-[#126A31] text-white"; // กรณีว่าง (เขียวอ่อน)
                        }

                        const hoverEffect = !isFull && canBook
                          ? "hover:bg-[#006432] hover:text-white hover:border-[#006432] hover:shadow-2xl hover:-translate-y-1"
                          : "cursor-not-allowed";

                        return (
                          <button
                            key={subRoom.id}
                            // disabled={!canBook || isFull}
                            onClick={() => {
                              setPopupPos({
                                top: window.innerHeight / 2,
                                left: window.innerWidth / 2,
                                isTopRow: false,
                                arrowOffset: 0,
                                actualWidth: checkIsMobile ? 240 : 260,
                                isCenter: true,
                              });
                              setConfirmRoom(subRoom);
                            }}
                            // ใช้ aspect-square เพื่อความเป็นระเบียบ และใช้ statusColors จัดการธีม
                            className={`group relative aspect-square flex flex-col w-full max-w-[80px] sm:max-w-[92px] md:max-w-[160px]
                              items-center justify-center rounded-xl transition-all duration-300 shadow-sm text-white
                        ${statusColors} ${hoverEffect} ${label === 'A' ? (isBAFormat ? 'order-2' : 'order-1') : (isBAFormat ? 'order-1' : 'order-2')}`}
                          >
                            {subRoom.currentOccupancy > 0 && matchScore >= 50 && (
                              <div className="absolute -top-3 -left-2 z-20 bg-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white animate-bounce">
                                MATCH!
                              </div>
                            )}

                            {/* ตัวอักษรระบุห้อง (A หรือ B) - ขนาดใหญ่และเด่นชัด */}
                            {/* <span className="text-[40px] md:text-[64px] font-black tracking-tighter">
                              {label}
                            </span> */}

                            {subRoom.status === RoomStatus.FULL || (isCharterSelected && subRoom.currentOccupancy > 0) ? (
                              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                <MdLock size={checkIsMobile ? 32 : 48} className="text-white/90" />
                                <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Full</span>
                              </div>
                            ) : subRoom.status === RoomStatus.PENDING ? (
                              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                <MdInfo size={checkIsMobile ? 32 : 48} className="text-white/90" />
                                <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Wait</span>
                              </div>
                            ) : (
                              <span className="text-[40px] md:text-[64px] font-black tracking-tighter">
                                {label}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex items-start gap-4">
                    <div className="bg-white">
                      <MdInfo className="text-amber-500" size={20} />
                    </div>
                    <p className="text-[12px] text-gray-600 leading-relaxed font-medium">
                      <span className="font-bold block text-amber-500 mb-0.5 text-[13px]">Suite Information</span>
                      คุณกำลังเลือกห้องนอนย่อยภายในห้องชุดแบบแชร์พื้นที่ส่วนกลาง (Shared Common Area)
                      ซึ่งจะมีห้องน้ำและห้องนั่งเล่นใช้งานร่วมกันระหว่างห้อง A และ B
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {confirmRoom && (
        <Portal>
          {/* Backdrop สำหรับปิด: คลุมทั้งจอจริงๆ */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200"
            onClick={() => setConfirmRoom(null)}
          />

          {/* Positioning Wrapper: วางตำแหน่งที่ได้จาก JS */}
          <div
            className={`fixed z-[9999] pointer-events-none transition-all duration-200 ease-out
    ${popupPos.isCenter ? "" : (popupPos.isTopRow ? "-translate-y-full" : "")}`} // ถ้าเป็น Center ไม่ต้องเลื่อนหลบแถวบน
            style={{
              top: popupPos.isCenter ? '50%' : popupPos.top,   // ถ้า Center ให้เอาไว้ที่ 50% ของจอ
              left: popupPos.isCenter ? '50%' : popupPos.left, // ถ้า Center ให้เอาไว้ที่ 50% ของจอ
            }}
          >
            {/* Popup Content */}
            <div
              className={`relative pointer-events-auto bg-white text-black p-4 rounded-xl shadow-xl border border-gray-100 animate-in zoom-in-95 duration-200
      ${popupPos.isCenter ? "-translate-x-1/2 -translate-y-1/2" : "-translate-x-1/2"} 
      ${!popupPos.isCenter && (popupPos.isTopRow ? "mb-4" : "mt-4")}`}
              style={{ width: popupPos.actualWidth }}
            >

              {/* {!canUserBookRoom(confirmRoom) && (
                <div className="mb-3 py-1 px-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px] text-center font-medium">
                  ขออภัย ห้องพักนี้ไม่สามารถจองได้ในขณะนี้
                </div>
              )} */}

              {/* รายละเอียดห้อง (Grid 2 คอลัมน์) */}
              <div className="grid grid-cols-2 gap-y-2 text-[12px] md:text-[14px]">
                <p><span className="font-bold text-black">Campus:</span> {formRoom.campus}</p>
                <p><span className="font-bold text-black">Price:</span> {confirmRoom.price} THB/M</p>
                <p><span className="font-bold text-black">Dorm Zone:</span> {formRoom.dorm.name}</p>
                <p><span className="font-bold text-black">Capacity:</span> {confirmRoom.capacity}</p>
                <p><span className="font-bold text-black">Floor:</span> {confirmRoom.floor}</p>
                {/* <p><span className="font-bold text-black">CurrentOccupancy:</span> {confirmRoom.currentOccupancy} / {confirmRoom.capacity}</p> */}
                {/* ปรับให้โชว์ไม่เกิน Capacity แม้ความจริงจะเกิน (เช่น 5/4 จะโชว์ 4/4) */}
                <p>
                  <span className="font-bold text-black">Occupancy:</span>{" "}
                  {Math.min(confirmRoom.currentOccupancy, confirmRoom.capacity)} / {confirmRoom.capacity}
                </p>
                <p><span className="font-bold text-black">Room:</span> {confirmRoom.roomId}</p>
                <p><span className="font-bold text-black">Status:</span> {confirmRoom.status}</p>
                <p><span className="font-bold text-black">Type:</span> {confirmRoom.roomType}</p>
              </div>

              {/* Roommate Match Section (ถ้ามีคนจองแล้ว) */}
              {confirmRoom.currentOccupancy > 0 && (
                <div className="mt-4 p-4 bg-white rounded-2xl border border-dashed border-green-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Roommate Vibe Match</span>
                      {/* <span className="text-[11px] text-gray-500">ไลฟ์สไตล์ของเพื่อนร่วมห้องในปัจจุบัน</span> */}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-black text-[#126A31]">
                        {calculateMatch(confirmRoom.lifestyleConfig)}%
                      </span>
                      <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#126A31] transition-all duration-500"
                          style={{ width: `${calculateMatch(confirmRoom.lifestyleConfig)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(confirmRoom.lifestyleConfig || []).map((tag: string) => {
                      // ดึงข้อมูล Config จาก Constants
                      const config = DORM_LABELS.LIFESTYLE[tag as keyof typeof DORM_LABELS.LIFESTYLE];
                      if (!config) return null;

                      const Icon = config.icon;

                      return (
                        <div
                          key={tag}
                          className="flex items-center gap-2 px-2 py-1 bg-green-50/50 border border-green-100 rounded-lg text-[#126A31]"
                          title={config.label}
                        >
                          {/* แสดง Icon จาก Constants */}
                          <Icon size={16} className="flex-shrink-0" />
                          <span className="text-[9px] font-bold">
                            {/* แสดงเฉพาะส่วนภาษาอังกฤษสั้นๆ หรือชื่อย่อถ้าต้องการประหยัดพื้นที่ */}
                            {config.label.split(' - ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center w-full mt-4 gap-2">
                {isCharterBroken && (
                  <p className="text-red-500 text-[12px] font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-100 mb-1">
                    ⚠️ ห้องนี้มีผู้พักแล้ว ไม่สามารถจองแบบเหมาได้ - This room is already occupied and cannot be booked as a whole.
                  </p>
                )}

                {isRoomFull && (
                  <p className="text-red-500 text-[12px] font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-100 mb-1">
                    ⚠️ ขออภัย ห้องพักนี้เต็มแล้ว - Sorry, this room is fully booked.
                  </p>
                )}

                {!cannotBook ? (

                  <button
                    onClick={handleSelectRoom}
                    className="w-[200px] text-[14px] items-center mt-2 py-2 bg-[#006432] text-white rounded-full font-semibold shadow-lg hover:bg-[#004d26] active:scale-95 transition-all"
                  >
                    Confirm / จองห้องนี้
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-[200px] text-[14px] py-2 bg-gray-300 text-gray-500 rounded-full font-semibold cursor-not-allowed"
                  >
                    {isCharterBroken ? "ไม่สามารถจองแบบเหมาได้ / Unable to reserve" : "ห้องพักเต็มแล้ว / Room is full."}
                  </button>
                )}
              </div>

              {/* หางลูกศร (Arrow) */}
              {!popupPos.isCenter && (
                <div
                  className={`absolute left-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent
    ${popupPos.isTopRow ? "top-full border-t-[10px] border-t-white" : "bottom-full border-b-[10px] border-b-white"}`}
                  style={{
                    transform: `translateX(calc(-50% + ${popupPos.arrowOffset}px))`,
                    [popupPos.isTopRow ? 'marginTop' : 'marginBottom']: '-1px'
                  }}
                />
              )}
            </div>
          </div>
        </Portal>
      )}

      <div className="mt-10">
        <button
          onClick={() => setStep(5)}
          // className="w-[120px] bg-[#7D856C] text-white px-4 py-2 rounded-xl hover:bg-[#6a715a] transition duration-200 shadow-md font-bold"
          className="flex-1 bg-[#7D856C] text-white py-3 px-[52px] rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-black transition-all"
        >
          Back
        </button>
      </div>
    </div>
  );
}

// --- Helper Functions (ย้ายออกมานอก Component หรือใส่ไว้ท้ายไฟล์) ---
function getRoomColor(room: Room, canBook: boolean, isCharterSelected: boolean) {
  // 1. พื้นที่ส่วนกลาง หรือ ห้องซ่อมบำรุง (สถานะคงที่)
  if (room.status === RoomStatus.COMMON) return "bg-[#D9D9D9] cursor-default";
  if (room.status === RoomStatus.MAINTENANCE) return "bg-[#D9D9D9] cursor-not-allowed";

  // 2. ใช้ผลลัพธ์จาก canUserBookRoom เป็นตัวตัดสินหลัก
  // ถ้า canBook เป็น false (ไม่ว่าจะห้องเดี่ยวเต็ม หรือ ห้อง Suite ไม่มีห้องย่อยว่างให้เหมา)
  if (!canBook || room.status === RoomStatus.FULL) {
    return "bg-[#FF0000] cursor-not-allowed";
  }

  // if (isCharterSelected) {
  //   // ถ้าเป็นห้อง Suite: ต้องเช็คผลรวมคนในห้องย่อยทั้งหมด
  //   if (room.isSuite && room.subRooms) {
  //     const totalOcc = room.subRooms.reduce((sum, sub) => sum + sub.currentOccupancy, 0);
  //     return totalOcc === 0
  //       ? "bg-[#126A31] hover:scale-110 hover:shadow-lg" // ว่างจริง -> เขียว
  //       : "bg-[#FF0000] cursor-not-allowed";             // มีคนอยู่ -> แดง
  //   }

  //   // ถ้าเป็นห้องปกติ: เช็ค currentOccupancy ของตัวมันเอง
  //   return room.currentOccupancy === 0 && room.status === RoomStatus.AVAILABLE
  //     ? "bg-[#126A31] hover:scale-110 hover:shadow-lg"
  //     : "bg-[#FF0000] cursor-not-allowed";
  // }

  // 3. กรณีที่จองได้ (canBook === true) ค่อยมาแยกโทนสีตามสถานะจริง
  // ถ้าเป็นสถานะรอชำระเงิน ให้เป็นสีเหลือง
  if (room.status === RoomStatus.PENDING) {
    return "bg-[#DEE75F]";
  }

  // 4. สถานะปกติที่จองได้ (สีเขียว)
  return "bg-[#126A31] hover:scale-110 hover:shadow-lg";
}

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
}