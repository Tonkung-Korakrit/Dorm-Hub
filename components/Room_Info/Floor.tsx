import { Room } from '@/utils/types'
import React, { Dispatch, SetStateAction } from 'react'

interface FloorProps {
 roomsByFloor: Record<string, Room[]>;
 selectedFloor: string;
 setSelectedFloor: Dispatch<SetStateAction<string>>;
}

const Floor = (props : FloorProps) => {
  const { roomsByFloor, selectedFloor, setSelectedFloor } = props;
  return (
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
    </>
  )
}

export default Floor
