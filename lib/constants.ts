// lib/constants.ts
// import { Sun, Moon, VolumeX, Users, Sparkles, Rainbow } from "lucide-react";
import {
  MdWbSunny,
  MdNightsStay,
  MdVolumeOff,
  MdPeopleOutline,
  MdAutoAwesome,
  MdCleaningServices,
  MdAcUnit,
  // MdLeafMode,
  MdBlock,
  MdVpnKey,
  MdGroups,
  MdPlace,
  MdRestaurant,
  // MdApartment,
  // MdOutlineBed,
  // MdWc,
  MdMeetingRoom,
  MdElevator,
} from "react-icons/md";

import { PiRainbowCloud } from "react-icons/pi";

import { FaHandsWash, FaShower } from "react-icons/fa";

export const DORM_LABELS = {
  GENDER: {
    MALE: "Male - ชาย",
    FEMALE: "Female - หญิง",
    LGBTQ: "LGBTQ+ - เพศทางเลือก",
    OTHER: "OTHER - อื่นๆ"
  },
  RESIDENT_TYPE: {
    CHARTER: "Charter Room - ผู้พักหลัก (เหมาห้อง)",
    NOT_CHARTER: "Not Charter Room - ผู้พักหลัก (ไม่เหมาห้อง)",
    CO_RESIDENT: "Co-Resident - ผู้พักร่วม (พักกับผู้พักหลักที่เหมาห้อง)"
  },
  CAMPUS: {
    rangsit: "Rangsit - รังสิต",
    lampang: "Lampang - ลำปาง",
    thaprachan: "Thaprachan - ท่าพระจันทร์",
    pattaya: "Pattaya - พัทยา",
  },

  //   LIFESTYLE: {
  //     MORNING: "ตื่นเช้า (Early Bird)",
  //     NIGHT: "นอนดึก (Night Owl)",
  //     QUIET: "รักความเงียบ (Quiet)",
  //     SOCIAL: "ชอบเข้าสังคม (Social)",
  //     NEAT: "รักความสะอาด (Neat)",
  //     
  //   }

  LIFESTYLE: {
    // --- 1. ช่วงเวลาการใช้ชีวิต (Sleep Cycle) ---
    MORNING: {
      label: "Early Bird - ตื่นเช้า",
      icon: MdWbSunny
    },
    NIGHT: {
      label: "Night Owl - นอนดึก",
      icon: MdNightsStay
    },

    // --- 2. ระดับเสียงและการเข้าสังคม (Noise & Social) ---
    QUIET: {
      label: "Quiet - รักความเงียบ",
      icon: MdVolumeOff
    },
    SOCIAL: {
      label: "Social - ชอบเข้าสังคม",
      icon: MdPeopleOutline
    },

    // --- 3. มาตรฐานความสะอาด (Cleanliness) ---
    NEAT: {
      label: "Neat & Tidy - เจ้าระเบียบ",
      icon: MdAutoAwesome
    },

    EASY_GOING: {
      label: "Easy-going - ยืดหยุ่นเรียบง่าย",
      icon: MdCleaningServices
    },

    // --- 4. การใช้เครื่องปรับอากาศ (AC Preference) ---
    AC_COLD: {
      label: "Air-Con Lover - ชอบอากาศเย็น",
      icon: MdAcUnit
    },
    // AC_ECO: {
    //   label: "Eco-Friendly - ประหยัดพลังงาน",
    //   icon: MdLeafMode
    // },

    // --- 5. ความเป็นส่วนตัวและผู้มาเยือน (Privacy) ---
    LGBTQ_FRIENDLY: {
      label: "LGBTQ+ Friendly - อยู่ร่วมกับเพศทางเลือกได้",
      icon: PiRainbowCloud
    },

    PRIVATE: {
      label: "Private - เน้นความเป็นส่วนตัว",
      icon: MdVpnKey
    },
    GUEST_FRIENDLY: {
      label: "Guest-Friendly - เปิดรับผู้มาเยือน",
      icon: MdGroups
    },

    // --- 6. สภาพแวดล้อมและสุขภาพ (Health & Environment) ---
    NON_SMOKER: {
      label: "Non-Smoker - ปลอดบุหรี่",
      icon: MdBlock
    },

    // --- 7. ข้อปฏิบัติเฉพาะ (Practices & Dietary) ---
    RELIGIOUS_PRACTICE: {
      label: "Religious Practice - มีการทำศาสนกิจในห้อง",
      icon: MdPlace
    },
    HALAL_FRIENDLY: {
      label: "Halal Friendly - ปลอดเนื้อหมู",
      icon: MdRestaurant
    },
  },

  ROOM_TYPES: {
    AC_PRIVATE_BATHROOM: {
      label: "แอร์ + ห้องน้ำในตัว",
      icon: MdMeetingRoom,
      color: "bg-[#126A31]" // สีเขียวเข้มสำหรับห้องพักหลัก
    },

    AC_SHARED_BATHROOM: {
      label: "แอร์ + ห้องน้ำรวม",
      icon: MdMeetingRoom,
      color: "bg-[#126A31]"
    },

    FAN_PRIVATE_BATHROOM: {
      label: "พัดลม + ห้องน้ำในตัว",
      icon: MdMeetingRoom,
      color: "bg-[#126A31]"
    },

    FAN_SHARED_BATHROOM: {
      label: "พัดลม + ห้องน้ำรวม",
      icon: MdMeetingRoom,
      color: "bg-[#126A31]"
    },

    TOILET: {
      label: "ห้องน้ำ && อาบน้ำ (Bathroom)",
      icon: FaShower,
      color: "bg-gray-700" // สีเทาสำหรับพื้นที่ส่วนกลาง
    },

    WASH: {
      label: "ห้องล้างจาน (Dishwashing room)",
      icon: FaHandsWash,
      color: "bg-gray-700"
    },

    COMMON_ROOM: {
      label: "ห้องส่วนกลาง (Common Room)",
      icon: MdGroups,
      color: "bg-gray-700"
    },

    ELEVATOR: {
      label: "ลิฟต์ (Elevator)",
      icon: MdElevator,
      color: "bg-gray-700"
    },
  },
};