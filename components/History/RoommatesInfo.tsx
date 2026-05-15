// components/booking/RoommatesInfo.tsx
// "use server"
import { DORM_LABELS } from "@/utils/constants";
import { Booking } from "@/utils/types";

//icons
import { FaUsersLine } from "react-icons/fa6";
import { FaGraduationCap } from "react-icons/fa";
import { MdChatBubbleOutline } from "react-icons/md";

interface RoommatesInfoProps {
  initialBooking: Booking;
}

const RoommatesInfo = ({ initialBooking }: RoommatesInfoProps) => {
  // console.log("booking in my-booking: ", booking);
  return (
    <div className="flex flex-col gap-6 p-1">
      {/* --- Lifestyle Preferences --- */}
      <div className="space-y-3">
        <h4 className="text-gray-800 font-bold text-[16px] flex items-center gap-2.5">
          <FaUsersLine className="text-[#006633] text-[24px] shrink-0" />
          The chosen lifestyle / ไลฟ์สไตล์ที่คุณเลือก
        </h4>

        <div className="bg-gray-100 p-2 rounded-3xl border border-gray-200 space-y-3">
          <div className="max-h-[110px] overflow-y-auto pr-2 mb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          >
            <div className="flex flex-wrap gap-2 pl-1">
              {initialBooking?.cus_users.lifestyle?.length > 0 ? (
                initialBooking?.cus_users.lifestyle.map((v: string) => {
                  const config =
                    DORM_LABELS.LIFESTYLE[
                      v as keyof typeof DORM_LABELS.LIFESTYLE
                    ];

                  if (!config)
                    return (
                      <span
                        key={v}
                        className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-[11px] font-semibold border border-gray-100"
                      >
                        #{v}
                      </span>
                    );

                  const Icon = config.icon;
                  return (
                    <span
                      key={v}
                      className="flex items-center gap-2 px-3.5 py-2 bg-white text-[#006633] rounded-xl text-[11px] font-bold border border-green-100 shadow-sm transition-all hover:border-[#006633] hover:shadow-md hover:-translate-y-0.5"
                    >
                      <Icon size={14} className="opacity-80" />
                      {config.label}
                    </span>
                  );
                })
              ) : (
                <div className="w-full py-3 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-[12px] italic">
                  ไม่มีข้อมูลไลฟ์สไตล์ระบุไว้
                </div>
              )}
            </div>

            {initialBooking?.cus_users?.lifestyleNote && (
              <div className="mt-2 px-2 border-green-100/50 flex gap-2">
                <MdChatBubbleOutline
                  className="text-green-600 shrink-0"
                  size={14}
                />
                <p className="text-[11px] text-green-800/80 leading-tight italic line-clamp-2">
                  "{initialBooking?.cus_users?.lifestyleNote}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Faculty & Department --- */}
      <div className="space-y-3">
        <h4 className="text-gray-800 font-bold text-[16px] flex items-center gap-2.5">
          <FaGraduationCap className="text-[#006633] text-[24px] shrink-0" />
          Roommate's Faculty / คณะของเพื่อนร่วมห้อง
        </h4>

        <div className="bg-gray-100 p-2 rounded-3xl border border-gray-200 space-y-3">
          <div className="flex flex-wrap gap-2 pl-1">
            {Array.isArray(initialBooking?.room?.facultyConfig) &&
            initialBooking?.room?.facultyConfig.length > 0 ? (
              initialBooking?.room?.facultyConfig.map(
                (faculty: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white text-[#006633] rounded-xl text-[11px] font-bold border border-green-100 shadow-sm transition-all hover:border-[#006633] hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#126A31] shrink-0 group-hover:scale-125 transition-transform" />
                    {typeof faculty === "object" && faculty !== null
                      ? faculty.name
                      : faculty}
                  </div>
                ),
              )
            ) : (
              <div className="w-full py-3 px-4 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-[12px] italic">
                There are no residents yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoommatesInfo;
