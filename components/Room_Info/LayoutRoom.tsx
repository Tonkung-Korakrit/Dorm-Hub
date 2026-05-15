// components/Room_Info/LayoutRoom.tsx
"use client";

import React from 'react'
import { useBooking } from '@/app/contexts/BookingContext';
import { Room, RoomStatus, BookingType } from "@/utils/types";
import { DORM_LABELS } from '@/utils/constants';
import { MdInfo, MdLock, MdMeetingRoom } from 'react-icons/md';

interface LayoutRoomProps {
  planImage: string
  roomsByFloor: Record<string, Room[]>
  selectedFloor: string
  confirmRoom: Room
  checkIsMobile: boolean
  canUserBookRoom: (room: Room) => boolean
  calculateMatch: (roomConfig: any) => number
  handleRoomClick: (e, room) => void
  getRoomColor: (room: Room, canBook: boolean, isCharterSelected: boolean) => string
  getMatchStatusLabel: (score: number) => string
}

const LayoutRoom = (props: LayoutRoomProps) => {
  const { formRoom, currentBooking } = useBooking();
  const { planImage, roomsByFloor, selectedFloor, confirmRoom, checkIsMobile,
    canUserBookRoom, calculateMatch, handleRoomClick, getRoomColor, getMatchStatusLabel } = props;

  return (
    <div>
      <p className="text-[16px] font-bold text-black mb-2">Select Room / เลือกห้อง <span className="text-red-500">*</span></p>
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
            const isCharterSelected = currentBooking?.type === BookingType.CHARTER;
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
                {room.currentOccupancy > 0 && matchScore >= 50 && !room.isSuite && (
                  <div className="absolute -top-3 -left-2 z-20 bg-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white animate-bounce">
                    MATCH!
                  </div>
                )}

                <button
                  onClick={(e) => handleRoomClick(e, room)}
                  aria-label={`ห้อง ${room.roomId}, ชั้น ${room.floor}, สถานะ ${room.status}, ความเหมาะสมกับคุณ ${getMatchStatusLabel(matchScore)}%`}
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
      </div>
    </div>
  )
}

export default LayoutRoom
