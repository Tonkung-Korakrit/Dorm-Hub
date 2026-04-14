import { useBooking } from '@/app/contexts/BookingContext';
import { DORM_LABELS } from '@/utils/constants';
import React from 'react'
import { MdChatBubbleOutline, MdEditNote } from 'react-icons/md';

// interface LifestyleDetailProps {
//   handleEdit: (step: number) => void;
// }

const VibeRoommateDetail = () => {
  // const { handleEdit } = props;
  const { formResident, formRoom } = useBooking();

  return (
    <section className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-[#006432]">
          3. Vibe Roommate
        </h3>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-2 shadow-inner">
        <div className="flex flex-wrap gap-2">
          {formResident?.lifestyle?.length > 0 ? (
            formResident.lifestyle.map((id: string) => {
              // ดึงค่าจาก constants
              const config = DORM_LABELS.LIFESTYLE[id as keyof typeof DORM_LABELS.LIFESTYLE];
              if (!config) return null;

              const Icon = config.icon; // ดึง Component Icon มา

              return (
                <span key={id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 shadow-sm">
                  <Icon className="text-[#126A31]" size={16} />
                  <span className="text-gray-700 font-medium">{config.label}</span>
                </span>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 italic">ไม่ได้ระบุไลฟ์สไตล์เพิ่มเติม</p>
          )}
        </div>

        {formResident.lifestyleNote && (
          <div className="pt-2 border-t border-green-100/50 flex gap-2">
            <MdChatBubbleOutline className="text-green-600 shrink-0" size={14} />
            <p className="text-[11px] text-green-800/80 leading-tight italic line-clamp-2">
              "{formResident.lifestyleNote}"
            </p>
          </div>
        )}
      </div>

      {/* {formResident?.lifestyleNote && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-2 shadow-inner">
          <div className="flex items-center gap-2 text-[#006432] opacity-70">
            <MdEditNote size={20} />
            <span className="text-[12px] font-bold uppercase tracking-wider">Additional Note / ข้อมูลเพิ่มเติม</span>
          </div>

          <p className="text-gray-600 text-[14px] leading-relaxed pl-7 italic">
            "{formResident.lifestyleNote}"
          </p>
        </div>
      )} */}

      {/* {formResident?.lifestyleNote && (
        <div className="mt-3 pl-4 border-l-4 border-gray-200 py-1">
          <p className="text-gray-400 text-[11px] font-bold uppercase mb-1">Note:</p>
          <p className="text-gray-600 text-[14px] leading-relaxed">
            {formResident.lifestyleNote}
          </p>
        </div>
      )} */}

      <div className="space-y-2">
        <h3 className="font-bold text-lg text-[#006432]">
          4. Roommate's Faculty
        </h3>

        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-2 shadow-inner">
          <div className="flex flex-wrap gap-2">
            {Array.isArray(formRoom.facultyConfig) && formRoom.facultyConfig.length > 0 ? (
              formRoom.facultyConfig.map((faculty: string, index: number) => (
                <div
                  key={index}
                  className="group flex items-center gap-2 bg-white text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors hover:bg-white hover:border-blue-300"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                  {faculty}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">ยังไม่มีข้อมูลคณะในห้องนี้</p>
              // <div className="w-full py-3 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-[12px] italic">
              //   ยังไม่มีข้อมูลคณะในห้องนี้
              // </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default VibeRoommateDetail
