// components/Room_Info/VibeRoommate.tsx
"use client"

import React from 'react'

import { useBooking } from '@/app/contexts/BookingContext';
import { DORM_LABELS } from '@/utils/constants';

import { MdCheck } from 'react-icons/md';
import { PiRainbowCloud } from 'react-icons/pi';

interface VibeRoommateProps {
  handleLifestyle: (id: string) => void;
  handleNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  noteError: string;
}

const VibeRoommate = (props: VibeRoommateProps) => {
  const { handleLifestyle, handleNoteChange, noteError } = props;
  const { formResident } = useBooking();
  return (
    <div>
      <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-[16px] font-semibold text-gray-700">Inclusivity & Safety / ความหลากหลาย และความปลอดภัย</h2>
        </div>

        <button
          type="button"
          onClick={() => handleLifestyle("LGBTQ_FRIENDLY")}
          className={`w-full p-5 rounded-[2rem] border-2 transition-all duration-500 flex items-center gap-5 text-left relative overflow-hidden group
              ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY")
              ? 'border-[#006432] bg-green-50/50 shadow-md scale-[1.01]'
              : 'border-gray-100 bg-white hover:border-purple-200'
            }`}
        >
          {/* แถบสีรุ้งเล็กๆ ด้านข้างเพื่อให้ดูมี Vibe LGBTQ+ แบบเรียบหรู */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-400 via-green-400 to-purple-400 opacity-70"></div>

          <div className={`p-4 rounded-2xl transition-colors ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'bg-[#006432] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
            <PiRainbowCloud size={32} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[16px] font-bold ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'text-[#006432]' : 'text-gray-700'
                }`}>
                LGBTQ+ Friendly
              </span>
              {formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") && (
                <span className="text-[10px] bg-[#006432] text-white px-2 py-0.5 rounded-full animate-pulse">Selected</span>
              )}
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              ยินดีที่จะพักร่วมกับเพื่อนร่วมห้องเพศทางเลือก (LGBTQ+) หรือไม่
            </p>
          </div>

          <div className={`mr-2 transition-transform duration-300 ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'scale-110' : 'scale-100 opacity-30'
            }`}>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") ? 'border-[#006432] bg-[#006432]' : 'border-gray-300'
              }`}>
              {formResident?.lifestyle?.includes("LGBTQ_FRIENDLY") && <MdCheck className="text-white" size={16} />}
            </div>
          </div>
        </button>

        <div className="bg-amber-50 p-4 mt-3 mb-3 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            {/* แยก SVG ออกมาเป็นโหนดอิสระ เพื่อให้ flex gap ทำงาน */}
            <svg
              className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>

            <div className="flex flex-col">
              <p className="text-amber-500 text-[13px] leading-relaxed font-bold">
                หมายเหตุ:
              </p>
              <p className="text-gray-600 text-[12px] leading-relaxed">
                การเลือก LGBTQ+ Friendly จะใช้สำหรับการจัดสรรเพื่อนร่วมห้องที่ยอมรับความหลากหลายได้
                ภายใต้เงื่อนไข <span className="font-bold text-amber-900">"การแยกหอพักชาย-หญิงตามเพศกำเนิด (Sex at birth)"</span> ตามกฎระเบียบของมหาวิทยาลัย
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2.2 ส่วน Lifestyle อื่นๆ (Grid เดิม) --- */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[16px] font-semibold text-gray-700">Other Lifestyle Preferences / ไลฟ์สไตล์อื่นๆ</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(DORM_LABELS.LIFESTYLE)
            .filter(([id]) => id !== "LGBTQ_FRIENDLY") // กรองตัว LGBTQ ออกจาก Grid ปกติ
            .map(([id, config]) => {
              const isSelected = formResident?.lifestyle?.includes(id);
              const Icon = config.icon;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleLifestyle(id)}
                  className={`p-4 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all duration-300
              ${isSelected
                      ? 'border-[#006432] bg-[#f0f7f0] text-[#006432] shadow-sm scale-105'
                      : 'border-gray-50 bg-white text-gray-400 hover:border-green-100'
                    }`}
                >
                  <Icon size={24} className={isSelected ? 'text-[#006432]' : 'text-gray-500'} />
                  <span className="text-[11px] font-bold text-center leading-tight">{config.label}</span>
                </button>
              );
            })}
        </div>
        
        {/* --- 2.3 ส่วน Lifestyle Note (เพิ่มเติม) --- */}
        <section className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-2 mb-3">
            {/* <div className="w-1 h-5 bg-[#006432] rounded-full"></div> */}
            <h2 className="text-[16px] font-semibold text-gray-700">
              Additional Notes / หมายเหตุเพิ่มเติมถึงรูมเมท
            </h2>
          </div>

          <div className="relative group">
            <textarea
              value={formResident?.lifestyleNote || ""}
              // onChange={(e) => setFormResident({ ...formResident, lifestyleNote: e.target.value })}
              onChange={handleNoteChange}
              placeholder="เช่น เวลาที่นอน, แพ้กลิ่นน้ำหอม, ชอบอ่านหนังสือเงียบๆ ช่วงค่ำ..."
              rows={3}
              maxLength={100}
              //   className="w-full p-4 text-[13px] text-gray-700 bg-white border-2 border-gray-100 rounded-[1.5rem] 
              //  focus:border-[#006432]/30 focus:ring-0 focus:bg-[#f0f7f0]/10 transition-all duration-300 
              //  placeholder:text-gray-300 resize-none shadow-sm"
              className={`w-full p-4 text-[13px] rounded-2xl border-2 transition-all duration-200 resize-none
                    ${noteError ? 'border-red-400 bg-red-50' : 'border-gray-100 focus:border-[#006432] bg-white'}
                  `}
            />

            {/* ตัวนับตัวอักษร (ถ้าต้องการจำกัดความยาว) */}
            <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-medium">
              {formResident?.lifestyleNote?.length || 0} / 100
            </div>
          </div>

          <p className="mt-2 ml-2 text-[11px] text-gray-400 italic">
            * ข้อมูลส่วนนี้จะช่วยให้เพื่อนร่วมห้องเข้าใจคุณมากขึ้นก่อนตัดสินใจจอง
          </p>
        </section>
      </section>
    </div>
  )
}

export default VibeRoommate
