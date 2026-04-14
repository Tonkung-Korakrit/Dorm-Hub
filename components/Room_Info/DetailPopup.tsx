// components/Room_Info/DetailRoom.tsx
"use client";

// import { Portal } from '@headlessui/react';
import { createPortal } from "react-dom";
import React from 'react'
import { useBooking } from "@/app/contexts/BookingContext";
import { DORM_LABELS } from "@/utils/constants";
import { MdChatBubbleOutline, MdWarningAmber } from "react-icons/md";
import { Room } from "@/utils/types";
import { FaGraduationCap } from "react-icons/fa";

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
}

interface DetailPopupProps {
  confirmRoom: Room | null;
  setConfirmRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  popupPos: {
    top: number;
    left: number;
    isTopRow: boolean;
    arrowOffset: number;
    actualWidth: number;
    isCenter: boolean;
  };

  matchScore: number
  isRoomFull: boolean
  isCharterBroken: boolean
  cannotBook: boolean
  handleSelectRoom: () => void
  calculateMatch: (roomConfig: any) => number
}


const DetailPopup = (props: DetailPopupProps) => {
  const { confirmRoom, setConfirmRoom, popupPos, matchScore,
    isRoomFull, isCharterBroken, cannotBook, handleSelectRoom, calculateMatch
  } = props;
  const { formRoom } = useBooking();

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200"
        onClick={() => setConfirmRoom(null)}
      />

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
          {/* <p><span className="font-bold text-black">Faculty & Department (Roommate):</span>{" "}
              {Array.isArray(confirmRoom.facultyConfig)
                ? confirmRoom.facultyConfig.join(", ")
                : "N/A"}
            </p> */}
          <div className="flex flex-col gap-1 mt-2 mb-2 text-[10px] md:text-[14px]">
            <span className="font-bold text-black">Roommates' Faculty / คณะของผู้อยู่:</span>
            <div className="flex flex-wrap gap-1">
              {Array.isArray(confirmRoom.facultyConfig) && confirmRoom.facultyConfig.length > 0 ? (
                confirmRoom.facultyConfig.map((faculty: string, index: number) => (
                  <span
                    key={index}
                    className="bg-green-50 text-[#126A31] px-2 py-0.5 rounded-md border border-green-100"
                  >
                    {faculty}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
            </div>
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

                  <span className="text-[9px] font-bold text-[#126A31] opacity-80">
                    {(() => {
                      const score = calculateMatch(confirmRoom.lifestyleConfig);
                      if (score >= 90) return "Perfect Match!";
                      if (score >= 70) return "Good Vibe";
                      if (score >= 50) return "Fair";
                      return "Low Match";
                    })()}
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
                      className="flex items-center gap-2 px-2 py-1 bg-green-50 border border-green-100 rounded-lg text-[#126A31]"
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

              {confirmRoom.lifestyleNote && (
                <div className="pt-2 border-t border-green-100/50 flex gap-2">
                  <MdChatBubbleOutline className="text-green-600 shrink-0" size={14} />
                  {/* <p className="text-[12px] text-green-800">Note Roommate:</p> */}
                  <p className="text-[11px] text-green-800/80 leading-tight italic line-clamp-2">
                    "{confirmRoom.lifestyleNote}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* นี่คือโน้ตไลฟ์สไตล์เพิ่มเติมของห้องนี้ */}
          {/* {confirmRoom.lifestyleNote && (
            <div className="mt-4 relative group">
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-amber-300 rounded-full" />

              <div className="bg-amber-50/50 p-3 pl-4 rounded-r-xl border border-amber-100 border-l-0 shadow-sm transition-all group-hover:bg-amber-50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MdChatBubbleOutline className="text-amber-500" size={14} />
                  <span className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest">
                    Roommate's Note / บันทึกเพิ่มเติม
                  </span>
                </div>

                <p className="text-[13px] text-amber-900/80 italic leading-relaxed font-medium">
                  "{confirmRoom.lifestyleNote}"
                </p>
              </div>
            </div>
          )} */}

          <div className="flex flex-col items-center w-full mt-4 gap-2">
            {/* Warning กรณี Match น้อยกว่า 50% */}
            {confirmRoom.currentOccupancy > 0 && matchScore < 50 && !isRoomFull && !isCharterBroken && (
              <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <MdWarningAmber className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                <div className="flex flex-col">
                  <p className="text-[11px] font-bold text-amber-800">Compatibility Notice</p>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    ไลฟ์สไตล์ของคุณอาจไม่ค่อยตรงกับรูมเมทคนปัจจุบัน แต่คุณยังสามารถจองได้เพื่อปรับตัวเข้าหากันครับ
                  </p>
                </div>
              </div>
            )}

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
  )
}

export default DetailPopup
