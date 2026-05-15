// components/Room_Info/SuiteModal.tsx
"use client"

import React, { useEffect } from 'react'
import { MdClose, MdInfo, MdLock } from 'react-icons/md';
import { Room, RoomStatus, BookingType } from "@/utils/types";
import { useBooking } from '@/app/contexts/BookingContext';

interface SuiteModalProps {
  selectedSuite: any
  setSelectedSuite: React.Dispatch<any>
  canUserBookRoom: (room: Room) => boolean
  calculateMatch: (roomConfig: any) => number
  setConfirmRoom: React.Dispatch<React.SetStateAction<Room>>
  checkIsMobile: boolean
  setPopupPos: React.Dispatch<React.SetStateAction<{
    top: number;
    left: number;
    isTopRow: boolean;
    arrowOffset: number;
    actualWidth: number;
    isCenter: boolean;
  }>>
}

const SuiteModal = (props: SuiteModalProps) => {
  const { selectedSuite, setSelectedSuite, canUserBookRoom,
    calculateMatch, setConfirmRoom, checkIsMobile, setPopupPos } = props;
  const { formRoom, currentBooking } = useBooking();

  useEffect(() => {
    // ปิดการเลื่อนของ body เมื่อ Modal ถูกโหลด
    document.body.style.overflow = 'hidden';

    // เมื่อ Modal ถูกทำลาย (Unmount) ให้คืนค่าการเลื่อนปกติ
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
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
                    const isCharterSelected = currentBooking?.type === BookingType.CHARTER;
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
  )
}

export default SuiteModal
