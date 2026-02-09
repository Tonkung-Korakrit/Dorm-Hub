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
  MdLock
} from "react-icons/md";
import { Room, RoomStatus, Booking } from "@/types/booking";
import { createPortal } from "react-dom";
import { DORM_LABELS } from "@/lib/constants";

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

  const isCharterSelected = currentBooking.type === "CHARTER";
  const currentOcc = confirmRoom?.currentOccupancy || 0;
  const isCharterBroken = isCharterSelected && currentOcc > 0;
  const isRoomFull = !isCharterSelected && currentOcc >= (confirmRoom?.capacity || 0);
  const cannotBook = isCharterBroken || isRoomFull;

  const zoneName = formRoom?.zone?.name;
  const planImage = (zoneName === "F3" || zoneName === "F4") 
  ? `/images/zones/plans/${zoneName}_${selectedFloor}.png`
  : `/images/zones/plans/${zoneName}.png`;

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
      // เราแค่บอก TypeScript ว่า "เชื่อผมเถอะ มันคือ array ของ string"
      const roomTags = roomConfig as string[];
      const userTags = formResident.lifestyle; // มาจาก Context เป็น string[] อยู่แล้ว

      // 3. คำนวณหาจุดที่ตรงกัน (Intersection)
      const matches = roomTags.filter(tag => userTags.includes(tag));

      // 4. คำนวณเป็น % (เทียบกับจำนวนไลฟ์สไตล์ที่ User เลือก)
      return Math.round((matches.length / userTags.length) * 100);
    } catch (error) {
      console.error("Match calculation error:", error);
      return 0;
    }
  };

  // ดึงข้อมูลห้องพักแบบ Real-time (ตรวจสอบชื่อ API ให้ตรงกับที่คุณสร้างไว้)
  const { data: rooms, mutate } = useSWR<Room[]>(
    formRoom.zone ? `/api/rooms?campus=${formRoom.campus}&zone=${formRoom.zone.name}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  // จัดกลุ่มห้องพักตามชั้น (ใช้ Optional Chaining เพื่อความปลอดภัย)
  const roomsByFloor = rooms?.reduce((acc: Record<string, Room[]>, room) => {
    const floorStr = String(room.floor);
    if (!acc[floorStr]) acc[floorStr] = [];
    acc[floorStr].push(room);
    return acc;
  }, {}) || {};

  // console.log(roomsByFloor)
  console.log("confirmRoom: ", confirmRoom)

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
        zone: {
          name: confirmRoom.zone,
        },
        lifestyleConfig: confirmRoom.lifestyleConfig,
        roomType: confirmRoom.roomType,
      }));
      setConfirmRoom(null);
      setStep(7);
    }
  };

  const canUserBookRoom = (room: Room) => {
    if (isCharterSelected) {
      // ถ้าเหมาห้อง: ต้องเป็นห้องที่ไม่มีคนอยู่เลย (0 คน) และสถานะต้อง Available เท่านั้น
      return room.currentOccupancy === 0 && room.status === RoomStatus.AVAILABLE;
    } else {
      // ถ้าไม่เหมาห้อง: จองได้ถ้าห้องยังไม่เต็ม (Occupancy < Capacity) และไม่ใช่สถานะ FULL
      return room.currentOccupancy < room.capacity && room.status !== RoomStatus.FULL;
    }
  };

  const handleRoomClick = (e: React.MouseEvent<HTMLButtonElement>, room: Room) => {
    if (room.status === RoomStatus.COMMON) return;

    if (confirmRoom?.id === room.id) {
      setConfirmRoom(null);
      return;
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
      actualWidth: popupWidth // ส่งค่า width ไปใช้ใน CSS ด้วย
    });

    setConfirmRoom(room);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-[24px] font-bold mb-4 text-gray-700">
        Room Information / ข้อมูลห้องพัก (โซน {formRoom?.zone?.name || "-"})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-[16px] text-gray-600">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-black">Gender / เพศ:</span>
          <span className="text-gray-700">
            {/* {formResident?.gender || "-"} */}
            {DORM_LABELS.GENDER[formResident.gender as keyof typeof DORM_LABELS.GENDER] || formResident.gender}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-bold text-black">Resident Type / ประเภทของผู้พัก:</span>
          <span className="text-gray-700">
            {/* {currentBooking?.type || "-"} */}
            {DORM_LABELS.RESIDENT_TYPE[currentBooking.type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || currentBooking.type}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-bold text-black">Selected Campus / วิทยาเขต:</span>
          <span className="text-gray-700">
            {/* {formRoom?.campus || "-"} */}
            {DORM_LABELS.CAMPUS[formRoom.campus as keyof typeof DORM_LABELS.CAMPUS] || formRoom.campus}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-bold text-black">Selected Zone / โซน:</span>
          <span className="text-gray-700">
            {formRoom?.zone?.name || "-"}
          </span>
        </div>

        {/* ส่วน Lifestyle: ใช้ div แทน p */}
        {/* <div className="md:col-span-2 flex flex-col gap-3 mt-1">
          <span className="font-bold text-black">Vibe Roommate / เพื่อนร่วมห้องที่เข้ากันได้ดี :</span>

          <div className="flex flex-wrap gap-2">
            {formResident?.lifestyle ? (
              Object.entries(
                (typeof formResident.lifestyle === 'string'
                  ? JSON.parse(formResident.lifestyle)
                  : formResident.lifestyle || {}) as Record<string, string> // ระบุ Type ตรงนี้
              ).map(([key, value]) => (
                <span
                  key={key}
                  className="px-3 py-1 bg-[#8ACCA1]/20 text-[#006432] text-[13px] font-medium rounded-full border border-[#8ACCA1]/30"
                >
                  {LIFESTYLE_LABELS[key] || key}: <span className="font-bold">{value}</span>
                </span>
              ))
            ) : (
              <span className="text-gray-400">ไม่ระบุ</span>
            )}
          </div>
        </div>
      </div> */}

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

                const Icon = config.icon; // เก็บ Component ไว้ในตัวแปรตัวใหญ่

                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-gray-100 text-[#126A31] text-[13px] rounded-xl shadow-sm hover:border-[#126A31]/30 transition-all duration-200 group"
                  >
                    {/* แสดง Icon พร้อมสีที่เป็นเอกลักษณ์ */}
                    <Icon size={16} className="text-[#126A31] opacity-80 group-hover:opacity-100" />

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

      {/* Floor Selection */}
      <div className="mb-4">
        <p className="text-[12px] font-bold text-gray-800 mb-3">Choose floor / เลือกชั้น <span className="text-red-500">*</span></p>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
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

      {/* Legend & Grid Layout (คงเดิมแต่ปรับความเสถียร) */}
      {/* <div className="flex gap-4 mb-6 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 justify-end">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#126A31]"></div> ว่าง</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> จองชั่วคราว</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-600"></div> ไม่ว่าง</div>
      </div> */}
      <div className="flex flex-wrap gap-6 mb-2 justify-center border-b border-gray-50">
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
      </div>

      <div className="relative bg-[#f8fcf8] border border-gray-100 rounded-[2rem] p-4 md:p-8 shadow-inner overflow-x-auto h-auto w-full">
        <div
          className="inline-grid gap-2 sm:gap-3" //md:gap-4
          
          style={{
            gridTemplateColumns: `repeat(${formRoom?.zone?.maxCols}, ${checkIsMobile ? "42px" : "42px"})`,
            gridTemplateRows: `repeat(${formRoom?.zone?.maxRows}, ${checkIsMobile ? "42px" : "42px"})`, // 42px

            // ใส่พื้นหลังตรงนี้เพื่อให้ขนาดมัน Auto-scale ตามจำนวนช่อง Grid
            backgroundImage: `url(${planImage})`,
            backgroundSize: '100% 100%', // บังคับให้รูปยืดเต็มจำนวนช่อง Grid เป๊ะๆ
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',

            // ใส่พื้นหลังสีขาวจางๆ หรือ Overlay เพื่อให้เห็นแปลนแต่ไม่แย่งซีนปุ่ม
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            // backgroundBlendMode: 'overlay'
          }}
        >
          {roomsByFloor[selectedFloor]?.map((room) => {
            const isSelected = confirmRoom?.id === room.id;
            const canBook = canUserBookRoom(room);
            const matchScore = calculateMatch(room.lifestyleConfig);

            // ดึง Configuration จาก Constants
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
                  className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shadow-sm z-10 relative
                    ${getRoomColor(room, canBook)}
                    ${isSelected ? "ring-4 ring-yellow-300 scale-105" : "hover:scale-105"} 
                    ${room.status === 'COMMON' ? "cursor-default" : "cursor-pointer"}`
                  }
                >
                  {/* แสดง Icon ตามประเภทห้อง */}
                  <Icon size={`${checkIsMobile ? 24 : 28}`} className="text-white" />

                  {/* แสดงแม่กุญแจกรณีล็อก (ยกเว้นพื้นที่ส่วนกลาง) */}
                  {!canBook && room.status !== 'COMMON' && (
                    <MdLock className="absolute top-0 right-0 text-[10px] text-white bg-red-500 rounded-full p-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
        {/* </div> */}
      </div>


      {confirmRoom && (
        <Portal>
          {/* Backdrop สำหรับปิด: คลุมทั้งจอจริงๆ */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200"
            onClick={() => setConfirmRoom(null)}
          />

          {/* Positioning Wrapper: วางตำแหน่งที่ได้จาก JS */}
          <div
            className={`fixed z-[9999] pointer-events-none transition-transform duration-200 ease-out
        ${popupPos.isTopRow ? "-translate-y-full" : ""}`}
            style={{
              top: popupPos.top,
              left: popupPos.left,
              // ลบความกว้างตรงนี้ออก เพื่อให้ตัวในจัดการเอง
            }}
          >
            {/* Popup Content: จัดกึ่งกลางด้วย -translate-x-1/2 
          และใช้ความกว้างที่คำนวณมาจาก actualWidth ครั้งเดียวพอ */}
            <div
              className={`relative pointer-events-auto bg-white text-black p-4 rounded-xl shadow-xl border border-gray-100 animate-in zoom-in-95 duration-200 -translate-x-1/2
          ${popupPos.isTopRow ? "mb-4" : "mt-4"}`}
              style={{ width: popupPos.actualWidth }}
            >

              {/* {!canUserBookRoom(confirmRoom) && (
                <div className="mb-3 py-1 px-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px] text-center font-medium">
                  ขออภัย ห้องพักนี้ไม่สามารถจองได้ในขณะนี้
                </div>
              )} */}

              {/* รายละเอียดห้อง (Grid 2 คอลัมน์) */}
              <div className="grid grid-cols-2 gap-y-2 text-[13px] md:text-[14px]">
                <p><span className="font-bold text-black">Campus:</span> {formRoom.campus}</p>
                <p><span className="font-bold text-black">Price:</span> {confirmRoom.price} THB</p>
                <p><span className="font-bold text-black">Zone:</span> {formRoom.zone.name}</p>
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
                      <span className="text-[11px] text-gray-500">ไลฟ์สไตล์ของเพื่อนร่วมห้องในปัจจุบัน</span>
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

                  <div className="flex flex-wrap gap-2">
                    {(confirmRoom.lifestyleConfig || []).map((tag: string) => {
                      // ดึงข้อมูล Config จาก Constants
                      const config = DORM_LABELS.LIFESTYLE[tag as keyof typeof DORM_LABELS.LIFESTYLE];
                      if (!config) return null;

                      const Icon = config.icon;

                      return (
                        <div
                          key={tag}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50/50 border border-green-100 rounded-lg text-[#126A31]"
                          title={config.label}
                        >
                          {/* แสดง Icon จาก Constants */}
                          <Icon size={14} />
                          <span className="text-[11px] font-bold">
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
                  <p className="text-red-500 text-[14px] font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-100 mb-1">
                    ⚠️ ห้องนี้มีผู้พักแล้ว ไม่สามารถจองแบบเหมาได้
                  </p>
                )}

                {isRoomFull && (
                  <p className="text-red-500 text-[12px] font-medium bg-red-50 px-3 py-1 rounded-lg border border-red-100 mb-1">
                    ⚠️ ขออภัย ห้องพักนี้เต็มแล้ว
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
                    {isCharterBroken ? "ไม่สามารถจองแบบเหมาได้" : "ห้องพักเต็มแล้ว"}
                  </button>
                )}
              </div>

              {/* หางลูกศร (Arrow) */}
              <div
                className={`absolute left-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent
            ${popupPos.isTopRow ? "top-full border-t-[10px] border-t-white" : "bottom-full border-b-[10px] border-b-white"}`}
                style={{
                  transform: `translateX(calc(-50% + ${popupPos.arrowOffset}px))`,
                  [popupPos.isTopRow ? 'marginTop' : 'marginBottom']: '-1px'
                }}
              />
            </div>
          </div>
        </Portal>
      )}

      <div className="mt-10">
        <button
          onClick={() => setStep(5)}
          className="w-[120px] bg-[#7D856C] text-white px-4 py-2 rounded-xl hover:bg-[#6a715a] transition duration-200 shadow-md font-bold"
        >
          Back
        </button>
      </div>
    </div>
  );
}

// --- Helper Functions (ย้ายออกมานอก Component หรือใส่ไว้ท้ายไฟล์) ---
function getRoomColor(room: Room, canBook: boolean) {
  // ถ้าเป็นห้องที่ User คนนี้จองไม่ได้ (ตามเงื่อนไข Charter/Non-charter) ให้เป็นสีเทา/แดง
  if (!canBook && !RoomStatus.COMMON) {
    return "bg-[#FF0000] cursor-not-allowed";
  }

  if (room.status === RoomStatus.COMMON) return "bg-[#D9D9D9] cursor-default"; // สีเทาอ่อนสำหรับพื้นที่ส่วนกลาง
  // if (room.status === RoomStatus.MAINTENANCE) return "bg-red-500 cursor-not-allowed"; // สีแดงสำหรับห้องซ่อม

  // ถ้าจองได้ ให้เช็คสถานะห้องจริงจาก DB
  if (room.status === RoomStatus.FULL) return "bg-[#FF0000] cursor-not-allowed";

  // สถานะ Pending (สีเหลือง) - ตาม Logic 3/4 หรือมีการจองค้างไว้
  if (room.status === RoomStatus.PENDING) return "bg-[#DEE75F]";

  // สถานะปกติ (สีเขียว)
  return "bg-[#126A31] hover:scale-110 hover:shadow-lg";
}

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
}