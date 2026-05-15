// hooks/useRooms.ts
"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import { BookingType, Room, RoomStatus } from "@/utils/types";
import { useBooking } from "@/app/contexts/BookingContext";
import useSWR from "swr";
import { customFetch } from "@/utils/custom-api";

const useRooms = (setStep: Dispatch<SetStateAction<number>>) => {
  const {
    formResident,
    setFormResident,
    formRoom,
    setFormRoom,
    currentBooking,
    setCurrentBooking,
  } = useBooking();

  const [confirmRoom, setConfirmRoom] = useState<Room | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>("2");
  const [checkIsMobile, setCheckIsMobile] = useState(false);

  const isCharterSelected = currentBooking?.type === BookingType.CHARTER;
  const currentOcc = confirmRoom?.currentOccupancy || 0;

  // 1. ถ้าเลือกเหมา: ต้องไม่มีคนอยู่ (Occ = 0) และสถานะต้องไม่ใช่ FULL หรือ PENDING จากคนอื่น
  const isCharterBroken =
    isCharterSelected &&
    (currentOcc > 0 || confirmRoom?.status !== RoomStatus.AVAILABLE);

  // 2. ถ้าเลือกจองปกติ: ต้องไม่เกินความจุ และสถานะต้องไม่เป็น FULL
  const isRoomFull =
    !isCharterSelected &&
    (currentOcc >= (confirmRoom?.capacity || 0) ||
      confirmRoom?.status === RoomStatus.FULL);
  const cannotBook = isCharterBroken || isRoomFull;

  const dormName = formRoom?.dorm?.name;
  const floorLabel = selectedFloor === "1" ? "1" : "2";
  const planImage = ["M1", "M2", "F5", "F6", "F7"].includes(dormName)
    ? `/images/zones/plans/${dormName}.png`
    : `/images/zones/plans/${dormName}_${floorLabel}.png`;

  const [selectedSuite, setSelectedSuite] = useState<any>(null);
  const [matchScore, setMatchScore] = useState(0);

  // const popupWidth = checkIsMobile ? Math.min(windowWidth - 40, 240) : 260;

  const [popupPos, setPopupPos] = useState({
    top: 0,
    left: 0,
    isTopRow: false,
    arrowOffset: 0,
    actualWidth: 320,
    isCenter: false,
  });

  // ฟังก์ชันคำนวณ % การ Match
  const calculateMatch = (roomConfig: any) => {
    // 1. เช็คว่ามีข้อมูลทั้งฝั่งห้อง และฝั่งนักศึกษาหรือไม่
    if (
      !roomConfig ||
      !Array.isArray(roomConfig) ||
      !formResident.lifestyle ||
      formResident.lifestyle.length === 0
    ) {
      return 0;
    }

    try {
      const roomTags = roomConfig as string[];
      const userTags = formResident.lifestyle;

      // 3. คำนวณหาจุดที่ตรงกัน (Intersection)
      const matches = roomTags.filter((tag) => userTags.includes(tag));

      // 4. คำนวณเป็น % (เทียบกับจำนวนไลฟ์สไตล์ที่ User เลือก)
      // return Math.round((matches.length / userTags.length) * 100);

      // 2. หาจุดรวมทั้งหมดแบบไม่ซ้ำ (Union)
      // ใช้ Set เพื่อรวม Tag ของทั้งสองฝั่งเข้าด้วยกันแล้วตัดตัวที่ซ้ำออก
      const unionTags = new Set([...roomTags, ...userTags]);

      // 3. คำนวณ IoU
      if (unionTags.size === 0) return 0;

      const score = (matches.length / unionTags.size) * 100;

      return Math.round(score);
    } catch (error) {
      console.error("Match calculation error:", error);
      return 0;
    }
  };

  // setMatchScore(calculateMatch(confirmRoom.lifestyleConfig));

  // const calculateMatch = (roomTags: string[]) => {
  //   const userTags = formResident.lifestyle || [];
  //   if (roomTags.length === 0 || userTags.length === 0) return 0;

  //   // 1. กำหนดคะแนนเต็ม (Total Weight)
  //   let totalScore = 0;
  //   let maxPossibleScore = 0;

  //   // 2. ตั้งค่าคะแนนตามความสำคัญ
  //   const weights: Record<string, number> = {
  //     // Critical (ซีเรียสมาก)
  //     LGBTQ_FRIENDLY: 50,
  //     SMOKE_FREE: 50,
  //     // Essential (กระทบการอยู่ร่วมกัน)
  //     EARLY_SLEEPER: 30,
  //     NIGHT: 30,
  //     NEAT: 30,
  //     EASY_GOING: 30,
  //     LIGHT_SENSITIVE: 25,
  //     // Preferences (มีก็ได้ ไม่มีก็ได้)
  //     GAMER: 15,
  //     SOCIAL: 15,
  //     QUIET: 15,
  //     STRICTLY_PERSONAL: 10,
  //     // ... อื่นๆ ให้ค่า default เป็น 10
  //   };

  //   // 3. เริ่มคำนวณ
  //   // เราจะดูจาก Tags ที่ "ห้องนั้นมีอยู่แล้ว" (roomTags) เป็นตัวตั้ง
  //   roomTags.forEach(tag => {
  //     const weight = weights[tag] || 10;
  //     maxPossibleScore += weight;

  //     if (userTags.includes(tag)) {
  //       totalScore += weight;
  //     } else {
  //       // --- แก้ปัญหาเรื่อง LGBTQ_FRIENDLY / SMOKE_FREE ---
  //       // ถ้าห้องมี แต่ User "ไม่เลือก" (ไม่ว่าจะลืมหรือจงใจ)
  //       // เราจะหักคะแนนส่วนนี้ออกเพื่อสะท้อนความไม่แน่นอน
  //       if (tag === 'LGBTQ_FRIENDLY' || tag === 'SMOKE_FREE') {
  //         totalScore -= (weight * 0.5); // หักลบ 50% ของน้ำหนัก
  //       }
  //     }
  //   });

  //   // ป้องกันคะแนนติดลบ
  //   const finalScore = Math.max(0, Math.round((totalScore / maxPossibleScore) * 100));
  //   return finalScore;
  // };

  const getMatchStatusLabel = (score: number) => {
    if (score >= 90) return "Perfect Match - เข้ากันได้ดีเยี่ยม";
    if (score >= 75) return "High Compatibility - ส่วนใหญ่ตรงกัน";
    if (score >= 50) return "Fair Compatibility - พออยู่ร่วมกันได้";
    return "Low Compatibility - ไลฟ์สไตล์ต่างกัน";
  };

  // ดึงข้อมูลห้องพักแบบ Real-time (ตรวจสอบชื่อ API ให้ตรงกับที่คุณสร้างไว้)
  const {
    data: rooms,
    mutate,
    isLoading,
  } = useSWR<Room[]>(
    formRoom.dorm
      ? `/api/rooms?campus=${formRoom.campus}&dorm=${formRoom.dorm.name}`
      : null, // &floor=${selectedFloor}
    (url) => customFetch(url).then((res) => res.json()),
    {
      refreshInterval: 5000, // อัพเดตข้อมูลทุก 5 วินาที
      dedupingInterval: 2000, // ถ้ากดซ้ำๆ ภายใน 2 วิ ไม่ต้องยิงใหม่
      revalidateOnFocus: true, // กลับมาที่หน้าจอปุ๊บ เช็คให้ทันที (อันนี้สำคัญกว่าสุ่มยิง)

      // revalidateOnFocus: false,  // (เพิ่มเติม) ปิดการโหลดใหม่เมื่อสลับหน้าจอกลับมา
      // revalidateOnReconnect: false,
    },
  );

  // จัดกลุ่มห้องพักตามชั้น (ใช้ Optional Chaining เพื่อความปลอดภัย)
  const roomsByFloor = (Array.isArray(rooms) ? rooms : []).reduce(
    (acc: Record<string, Room[]>, room) => {
      if (room.parentId) return acc;

      const floorStr = String(room.floor);
      if (!acc[floorStr]) acc[floorStr] = [];
      acc[floorStr].push(room);
      return acc;
    },
    {},
  );

  // 3. เมื่อเลือกห้องพักใน Modal
  const handleSelectRoom = () => {
    if (confirmRoom) {
      setFormRoom((prev: any) => ({
        ...prev,
        roomId: confirmRoom.roomId || "",
        price: confirmRoom.price || 0,
        floor: confirmRoom.floor || 1,
        id: confirmRoom.id,
        // เก็บก้อนข้อมูล zone และ dorm ลงไปใน Context เพื่อใช้ในหน้า Summary
        dorm: {
          ...prev.dorm,
          name: confirmRoom.dorm || "Default.png",
        },
        // กันเหนียวด้วยการใส่ [] เผื่อค่าที่มาจาก DB เป็น null
        lifestyleConfig: confirmRoom.lifestyleConfig || [],
        lifestyleNote: confirmRoom.lifestyleNote || "",
        facultyConfig:
          confirmRoom.facultyConfig?.map((f: any) => f.name || f) || [],
        roomType: confirmRoom.roomType,
      }));
      setConfirmRoom(null);
      // setSelectedSuite(null);
      setStep(7);
    }
  };

  const canUserBookRoom = (room: Room) => {
    const isCharterSelected = currentBooking?.type === BookingType.CHARTER;

    // --- กรณีห้องชุด (ห้องแม่บน Grid) ---
    if (room.isSuite && room.subRooms) {
      if (isCharterSelected) {
        // โหมดเหมา: ยอมให้กดห้องแม่ได้ ถ้า "มีอย่างน้อย 1 ห้องย่อยที่ไม่มีคนอยู่เลย"
        // เพราะผู้ใช้อาจจะอยากเข้าไปเหมาห้อง A ที่ว่าง แม้ห้อง B จะมีคนอยู่แล้วก็ตาม
        return room.subRooms.some(
          (sub) =>
            sub.currentOccupancy === 0 && sub.status === RoomStatus.AVAILABLE,
        );
      } else {
        // โหมดปกติ: ขอแค่มีลูกอย่างน้อย 1 ห้องที่ยังไม่เต็ม (เช่น 1/2 ก็ยังจองได้)
        return room.subRooms.some(
          (sub) =>
            sub.currentOccupancy < sub.capacity &&
            sub.status !== RoomStatus.FULL,
        );
      }
    }

    // --- กรณีห้องปกติ หรือ ห้องย่อย (A/B) ที่อยู่ใน Modal ---
    if (isCharterSelected) {
      // ต้องว่างเปล่า 100% ถึงจะเหมาได้
      return (
        room.currentOccupancy === 0 && room.status === RoomStatus.AVAILABLE
      );
    } else {
      // จองปกติ แค่ไม่เต็มก็พอ
      return (
        room.currentOccupancy < room.capacity && room.status !== RoomStatus.FULL
      );
    }
  };

  const handleRoomClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    room: Room,
  ) => {
    if (room.status === RoomStatus.COMMON) return;

    if (confirmRoom?.id === room.id) {
      setConfirmRoom(null);
      return;
    }

    if (room.isSuite) {
      setSelectedSuite(room);
      setConfirmRoom(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const roomCenterY = rect.top + rect.height / 2;

    const isMobile = windowWidth < 768;
    const popupWidth = isMobile ? windowWidth * 0.92 : 450;
    const screenPadding = 16;

    // ปรับใหม่: ถ้าห้องอยู่ต่ำกว่า 50% ของความสูงจอ ให้ดีดขึ้นบนทันที (isTopRow = true)
    // วิธีนี้จะทำให้มีพื้นที่เหลือด้านบนเยอะกว่าตอนดีดลงล่างครับ
    const isTop = rect.bottom > windowHeight * 0.5;

    // ลดโอกาสเกิด isCenter ให้เหลือน้อยที่สุด (เอาไว้ใช้เฉพาะตอนจอเล็กมากๆ เท่านั้น)
    const shouldForceCenter = isMobile && windowHeight < 600;

    let leftPos = rect.left + rect.width / 2;
    const halfWidth = popupWidth / 2;
    const safeLeft = Math.min(
      Math.max(leftPos, halfWidth + screenPadding),
      windowWidth - halfWidth - screenPadding,
    );

    setPopupPos({
      top: isTop ? rect.top : rect.bottom, // ปักหมุดที่ขอบบนหรือล่างของปุ่ม
      left: safeLeft,
      isTopRow: isTop,
      arrowOffset: leftPos - safeLeft,
      actualWidth: popupWidth,
      isCenter: shouldForceCenter,
    });

    setConfirmRoom(room);
  };

  const getRoomColor = (
    room: Room,
    canBook: boolean,
    isCharterSelected: boolean,
  ) => {
    // 1. พื้นที่ส่วนกลาง หรือ ห้องซ่อมบำรุง (สถานะคงที่)
    if (room.status === RoomStatus.COMMON) return "bg-[#D9D9D9] cursor-default";
    if (room.status === RoomStatus.MAINTENANCE)
      return "bg-[#D9D9D9] cursor-not-allowed";

    // 2. ใช้ผลลัพธ์จาก canUserBookRoom เป็นตัวตัดสินหลัก
    // ถ้า canBook เป็น false (ไม่ว่าจะห้องเดี่ยวเต็ม หรือ ห้อง Suite ไม่มีห้องย่อยว่างให้เหมา)
    if (!canBook || room.status === RoomStatus.FULL) {
      return "bg-[#FF0000] cursor-not-allowed";
    }

    // if (isCharterSelected) {
    //   // ถ้าเป็นห้อง Suite: ต้องเช็คผลรวมคนในห้องย่อยทั้งหมด
    //   if (room.isSuite && room.subRooms) {
    //     const totalOcc = room.subRooms.reduce((sum, sub) => sum + sub.currentOccupancy, 0);
    //     return totalOcc === 0
    //       ? "bg-[#126A31] hover:scale-110 hover:shadow-lg" // ว่างจริง -> เขียว
    //       : "bg-[#FF0000] cursor-not-allowed";             // มีคนอยู่ -> แดง
    //   }

    //   // ถ้าเป็นห้องปกติ: เช็ค currentOccupancy ของตัวมันเอง
    //   return room.currentOccupancy === 0 && room.status === RoomStatus.AVAILABLE
    //     ? "bg-[#126A31] hover:scale-110 hover:shadow-lg"
    //     : "bg-[#FF0000] cursor-not-allowed";
    // }

    // 3. กรณีที่จองได้ (canBook === true) ค่อยมาแยกโทนสีตามสถานะจริง
    // ถ้าเป็นสถานะรอชำระเงิน ให้เป็นสีเหลือง
    if (room.status === RoomStatus.PENDING) {
      return "bg-[#DEE75F]";
    }

    // 4. สถานะปกติที่จองได้ (สีเขียว)
    return "bg-[#126A31] hover:scale-110 hover:shadow-lg";
  };

  return {
    confirmRoom,
    setConfirmRoom,
    selectedFloor,
    setSelectedFloor,
    checkIsMobile,
    setCheckIsMobile,
    isCharterSelected,
    currentOcc,
    isCharterBroken,
    isRoomFull,
    cannotBook,
    planImage,
    selectedSuite,
    setSelectedSuite,
    getRoomColor,
    matchScore,
    setMatchScore,
    popupPos,
    setPopupPos,
    rooms,
    isLoading,
    roomsByFloor,
    calculateMatch,
    getMatchStatusLabel,
    handleSelectRoom,
    canUserBookRoom,
    handleRoomClick,
  };
};

export default useRooms;
