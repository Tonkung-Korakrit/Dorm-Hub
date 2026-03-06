// lib/constants.ts
// import { Sun, Moon, VolumeX, Users, Sparkles, Rainbow } from "lucide-react";
import {
  MdWbSunny,
  MdNightsStay,
  MdVolumeOff,
  MdAutoAwesome,
  MdGroups,
  MdElevator,
  MdOutlineEmojiPeople,
  MdEnergySavingsLeaf,
  MdSmokeFree,
  MdVolunteerActivism,
  MdOutlineBrightness2,
  MdOutlineDoNotTouch,
  MdOutlineAir,
} from "react-icons/md";

import { PiRainbowCloud } from "react-icons/pi";
import { FaHandsWash, FaShower } from "react-icons/fa";
import { SiAwssecretsmanager } from "react-icons/si";
import { SlGameController } from "react-icons/sl";
import { FaFaceSmileBeam } from "react-icons/fa6";
import { LiaPrayingHandsSolid } from "react-icons/lia";
import { RiHomeSmileFill } from "react-icons/ri";

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

  RESIDENT_TYPE_DESC: {
    CHARTER: "จองคนเดียวทั้งห้อง โดยคุณจะเป็นผู้รับผิดชอบค่าใช้จ่ายทั้งหมด และสามารถเลือกดึงเพื่อนมาพักด้วยกันได้ภายหลัง",
    NOT_CHARTER: "จองเฉพาะเตียงรายบุคคล ระบบจะจัดสรรเพื่อนร่วมห้องคนอื่นมาพักร่วมกับคุณตามจำนวนเตียงที่ว่าง",
    CO_RESIDENT: "สำหรับการจองเพื่อเข้าพักกับเพื่อนที่ทำการ 'เหมาห้อง' ไว้แล้ว (ต้องระบุรหัสของผู้พักหลัก)"
  },

  // ROOM_TYPE: {
  //   AC_PRIVATE_BATHROOM: "ห้องแอร์ + ห้องน้ำในห้อง",
  //   AC_SHARED_BATHROOM: "ห้องแอร์ + ห้องน้ำรวม",
  //   FAN_PRIVATE_BATHROOM: "ห้องพัดลม + ห้องน้ำในห้อง",
  //   FAN_SHARED_BATHROOM: "ห้องพัดลม + ห้องน้ำรวม",
  // },

  CAMPUS: {
    rangsit: "Rangsit - รังสิต",
    lampang: "Lampang - ลำปาง",
    thaprachan: "Thaprachan - ท่าพระจันทร์",
    pattaya: "Pattaya - พัทยา",
  },

  LIFESTYLE: {
    // --- 1. ช่วงเวลาการใช้ชีวิต (Sleep Cycle) ---
    EARLY_SLEEPER: {
      label: "Early Sleeper - นอนเร็ว (ก่อนเที่ยงคืน)",
      icon: MdWbSunny
    },
    NIGHT: {
      label: "Night Owl - นอนดึก (หลังเที่ยงคืน)",
      icon: MdNightsStay
    },

    // --- 2. ระดับเสียงและการเข้าสังคม (Noise & Social) ---
    QUIET: {
      label: "Quiet & Privacy - เน้นความสงบ และเป็นส่วนตัว",
      icon: MdVolumeOff
    },
    SOCIAL: {
      label: "Friendly & Social - เน้นการพูดคุย และเป็นกันเอง",
      icon: MdOutlineEmojiPeople
    },

    // --- 3. มาตรฐานความสะอาด (Cleanliness) ---
    NEAT: {
      label: "Neat & Tidy - รักความสะอาด และเป็นระเบียบ",
      icon: MdAutoAwesome
    },

    EASY_GOING: {
      label: "Easy-going - อยู่แบบชิลๆ เรียบง่าย",
      icon: FaFaceSmileBeam
    },

    // --- 4. การใช้เครื่องปรับอากาศ (AC Preference) ---
    AC_ECO: {
      label: "Eco-Friendly - ประหยัดพลังงาน",
      icon: MdEnergySavingsLeaf 
    },

    LGBTQ_FRIENDLY: {
      label: "LGBTQ+ Friendly - อยู่ร่วมกับเพศทางเลือกได้",
      icon: PiRainbowCloud
    },

    // --- 5. สภาพแวดล้อมและสุขภาพ (Health & Environment) ---
    SMOKE_FREE: {
      label: "Smoke-Free - ไม่ชอบกลิ่น/ควันบุหรี่",
      icon: MdSmokeFree
    },

    // --- 6. ข้อปฏิบัติเฉพาะ (Practices & Dietary) ---
    PRAYER_ROUTINE: {
      label: "Daily Rituals - มีการสวดมนต์/ทำสมาธิทุกวัน",
      icon: LiaPrayingHandsSolid
    },
    HALAL_LIFESTYLE: {
      label: "Halal Conscious - เข้าใจวิถีฮาลาล",
      icon: MdVolunteerActivism
    },

    // --- 7. ความต้องการพิเศษอื่นๆ (Other Preferences) ---
    LIGHT_SENSITIVE: {
      label: "Need Darkness - นอนต้องปิดไฟมืดสนิท",
      icon: MdOutlineBrightness2
    },

    STRICTLY_PERSONAL: {
      label: "Personal Space - ไม่แชร์ของใช้ส่วนตัว",
      icon: MdOutlineDoNotTouch
    },

    SCENT_SENSITIVE: {
      label: "Scent-Sensitive - แพ้กลิ่นหอม/กลิ่นฉุน",
      icon: MdOutlineAir
    },

    GAMER: {
      label: "Gamer - สายเกมเมอร์",
      icon: SlGameController
    },
  },

  ROOM_TYPES: {
    AC_PRIVATE_BATHROOM: {
      label: "AC_PRIVATE_BATHROOM - (แอร์ + ห้องน้ำในตัว)",
      icon: RiHomeSmileFill,
      color: "bg-[#126A31]" 
    },

    AC_SHARED_BATHROOM: {
      label: "AC_SHARED_BATHROOM - (แอร์ + ห้องน้ำรวม)",
      icon: RiHomeSmileFill,
      color: "bg-[#126A31]"
    },

    FAN_PRIVATE_BATHROOM: {
      label: "FAN_PRIVATE_BATHROOM - (พัดลม + ห้องน้ำในตัว)",
      icon: RiHomeSmileFill,
      color: "bg-[#126A31]"
    },

    FAN_SHARED_BATHROOM: {
      label: "FAN_SHARED_BATHROOM - (พัดลม + ห้องน้ำรวม)",
      icon: RiHomeSmileFill,
      color: "bg-[#126A31]"
    },

    TOILET: {
      label: "ห้องน้ำ && อาบน้ำ (Bathroom)",
      icon: FaShower,
      color: "bg-gray-700"
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

    SECRET: {
      label: "ห้องลับ / ไม่รู้ว่าเป็นห้องอะไร (Secret)",
      icon: SiAwssecretsmanager,
      color: "bg-gray-700"
    },

  },
};