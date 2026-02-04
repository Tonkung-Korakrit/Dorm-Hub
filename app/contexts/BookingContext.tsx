// app/contexts/BookingContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Room, Resident, Booking, BookingType, RoomStatus, Role, BookingStatus, RoomType, GenderType, Admin, OwnerInfo } from "@/types/booking";

// กำหนด Interface สำหรับข้อมูลใน Context (จะแชร์อะไรบ้าง)
interface BookingContextType {
  formResident: Resident;
  setFormResident: React.Dispatch<React.SetStateAction<Resident>>;
  formRoom: Room;
  setFormRoom: React.Dispatch<React.SetStateAction<Room>>;
  currentBooking: Booking | null;
  setCurrentBooking: React.Dispatch<React.SetStateAction<Booking>>;
  ownerInfo: OwnerInfo | null;
  setOwnerInfo: React.Dispatch<React.SetStateAction<OwnerInfo>>;
  admin: Admin;
  setAdmin: React.Dispatch<React.SetStateAction<Admin>>;

  // bookingType: BookingType;
  // setBookingType: React.Dispatch<React.SetStateAction<BookingType>>;
  // handleBook: () => Promise<void>;

  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

// สร้าง Context พร้อมกำหนดค่าเริ่มต้นเป็น undefined
const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  // console.log("Context Provider is Rendering!");

  const router = useRouter();

  // กำหนดค่าเริ่มต้นของ Room ตาม Interface
  const [formRoom, setFormRoom] = useState<Room>({
    id: 0,
    campus: "",
    // zone: "",
    roomId: "",
    floor: 0,
    status: RoomStatus.AVAILABLE, // "AVAILABLE"
    isLocked: false,
    roomType: RoomType.AC_SHARED_BATHROOM,
    price: 0,
    capacity: 0,
    currentOccupancy: 0,
    posX: 1,
    posY: 1,
    lifestyleConfig: [],
    booking: [],

    zone: {
      id: 0,
      name: "",
      gender: GenderType.OTHER,
      mapUrl: "",
      maxCols: 0,
      maxRows: 0,
      dorm: {
        id: 0,
        name: "",
      },
    },
  });

  const [formResident, setFormResident] = useState<Resident>({
    id: 0,
    role: Role.STUDENT,
    email: "",
    citizenType: "",
    citizenNumber: "",
    studentId: "",
    gender: GenderType.OTHER,
    prefix: "",
    // name: "",
    name_en: "",
    name_th: "",
    birthDate: "",
    phone: "",

    isScholarshipStudent: false,
    isDisabled: false,

    image: "",
    faculty_department: "",
    // department: "",
    // tu_status: "",
    lifestyle: [],
    guardians: [],
    documents: [],
    // vehicleInfo: null,
    address: [],
  });

  // const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>({
    // studentId: "",
    // name: "",
    // zoneName: "",
    // roomNumber: "",
    // roomId: "",
  // });

  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null)

  const [message, setMessage] = useState<string>("");

  // const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>({
    id: 0,
    status: BookingStatus.PENDING,
    type: BookingType.NOT_CHARTER,
    createdAt: new Date(),
    userId: 0,
    roomId: 0,
    user: formResident,
    room: formRoom,
  });

  const [admin, setAdmin] = useState<Admin>({
    id: 0,
    name: "",
    email: "",
    employeeId: "",
    role: Role.ADMIN,
  })

  // const handleBook = async () => {
  //   console.log("Booking room:", formRoom);

  //   const confirmBooking = confirm(`ยืนยันที่จะจองห้อง ${formRoom.roomId} หรือไม่?`);
  //   if (!confirmBooking) return;

  //   try {
  //     const bookingData = {
  //       user: formResident,
  //       // campus: formRoom.zone?.dorm.name,
  //       campus: formRoom.campus,
  //       // zone: formRoom.zone?.name,
  //       zone: formRoom.zone,
  //       room: formRoom,
  //       type: currentBooking?.type || BookingType.NOT_CHARTER,
  //       status: BookingStatus.PENDING,
  //       createdAt: new Date().toISOString(),
  //     };

  //     const res = await fetch("../api/bookings", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(bookingData),
  //     });

  //     const result = await res.json();
  //     if (res.ok) {
  //       setMessage("✅ จองสำเร็จ!");
  //       setTimeout(() => router.push("/dashboard"), 1000);
  //     } else {
  //       setMessage("❌ เกิดข้อผิดพลาด: " + (result.error || "Unknown error"));
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     setMessage("❌ เกิดข้อผิดพลาดในการจอง");
  //   }
  // };

  return (
    <BookingContext.Provider
      value={{
        formResident, setFormResident,
        formRoom, setFormRoom,
        currentBooking, setCurrentBooking,
        ownerInfo, setOwnerInfo,
        admin, setAdmin,
        // bookingType, setBookingType,
        // handleBook,
        message, setMessage
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

// 4. สร้าง Custom Hook พร้อมตัวเช็ค Error
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};