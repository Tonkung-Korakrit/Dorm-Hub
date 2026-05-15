import { useBooking } from "@/app/contexts/BookingContext";
import { DORM_LABELS } from "@/utils/constants";
import React from "react";
import { MdChatBubbleOutline, MdEditNote } from "react-icons/md";

// interface LifestyleDetailProps {
//   handleEdit: (step: number) => void;
// }

const VibeRoommateDetail = () => {
  // const { handleEdit } = props;
  const { formResident, formRoom } = useBooking();

  // console.log("formRoom.facultyConfig", formRoom.facultyConfig)

  return (
    <section className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-[#006432]">3. LifeStyle Roommates</h3>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col gap-2 shadow-inner">
        <div className="flex flex-wrap gap-2">
          {formResident?.lifestyle?.length > 0 ? (
            formResident.lifestyle.map((id: string) => {
              const config =
                DORM_LABELS.LIFESTYLE[id as keyof typeof DORM_LABELS.LIFESTYLE];
              if (!config) return null;

              const Icon = config.icon; // ดึง Component Icon มา

              return (
                <span
                  key={id}
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <Icon className="text-[#126A31]" size={16} />
                  <span className="text-gray-700 font-medium">
                    {config.label}
                  </span>
                </span>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 italic">
              ไม่ได้ระบุไลฟ์สไตล์เพิ่มเติม
            </p>
          )}
        </div>

        {formResident.lifestyleNote && (
          <div className="pt-2 border-t border-green-100/50 flex gap-2">
            <MdChatBubbleOutline
              className="text-green-600 shrink-0"
              size={14}
            />
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
          <div className="flex flex-wrap gap-2 pl-1">
            {Array.isArray(formRoom.facultyConfig) &&
                formRoom.facultyConfig.length > 0 ? (
                  formRoom.facultyConfig?.map((item, index) => (
                <div
                  key={index}
                  // className="flex items-center gap-2 px-3.5 py-2 bg-white text-[#006633] rounded-xl text-[11px] font-bold border border-green-100 shadow-sm transition-all hover:border-[#006633] hover:shadow-md hover:-translate-y-0.5"
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#126A31] shrink-0 group-hover:scale-125 transition-transform" />
                  {typeof item === 'object' ? item.name : item}
                </div>
              ))
            ) : (
              // <span className="text-gray-400 text-[12px] italic pl-2">ยังไม่มีข้อมูลคณะในห้องนี้</span>
              <div className="w-full py-3 px-4 bg-white rounded-2xl text-gray-400 text-[12px] italic">
                There are no residents yet
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VibeRoommateDetail;
