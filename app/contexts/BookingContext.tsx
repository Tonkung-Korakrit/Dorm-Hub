// app/contexts/BookingContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Room, Resident, Booking, BookingType, RoomStatus, 
  Role, BookingStatus, RoomType, GenderType, OwnerInfo, Vehicle, 
  Staff, CitizenType } from "@/utils/types";

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
  vehicle: Vehicle | null;
  setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
  isEditMode: boolean;
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;

  staff: Staff;
  setStaff: React.Dispatch<React.SetStateAction<Staff>>;

  // bookingType: BookingType;
  // setBookingType: React.Dispatch<React.SetStateAction<BookingType>>;
  // handleBook: () => Promise<void>;

  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  // const [editState, setEditState] = useState<{
  //   section: 'resident' | 'room' | 'lifestyle' | null;
  //   isEdit: boolean;
  // }>({ section: null, isEdit: false });

  const [formResident, setFormResident] = useState<Resident>({
    id: 0,
    citizenType: CitizenType.CITIZEN_ID,
    citizenNumber: "",
    studentId: "",
    gender: GenderType.OTHER,
    titleName: "",
    // name: "",
    name_en: "",
    name_th: "",
    email: "",
    mobilePhone: "",
    birthDate: "",
    isScholarshipStudent: false,
    isDisabled: false,
    faculty_department: "",
    lifestyle: [],
    isEnabled: true,

    address: [],
    guardians: [],
    profileImage: [],
    vehicleInfo: null,
    role: Role.STUDENT,
  });

  const [formRoom, setFormRoom] = useState<Room>({
    id: 0,
    campus: "",
    roomId: "",
    floor: 0,
    status: RoomStatus.AVAILABLE, // "AVAILABLE"
    isLocked: false,
    roomType: RoomType.AC_SHARED_BATHROOM,
    price: 0,
    capacity: 0,
    currentOccupancy: 0,

    isSuite: false,

    posX: 1,
    posY: 1,
    lifestyleConfig: [],
    // lifestyleNote: "",
    // facultyConfig: [],

    booking: [],

    dorm: {
      id: 0,
      name: "",
      genderType: GenderType.OTHER,
      mapUrl: "",
      maxCols: 0,
      maxRows: 0,
      campus: {
        id: 0,
        name: "",
        // dorm: []
      },
      // floors: []
    },
  });

  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null)

  const [vehicle, setVehicle] = useState<Vehicle>({
    id: 0,
    userId: 0,
    licensePlate: "",
    province: "",
    ownerName: "",
    fileImages: "",
  })

  const [currentBooking, setCurrentBooking] = useState<Booking>({
    success: false,
    message: "",

    id: 0,
    status: BookingStatus.PENDING,
    type: BookingType.NOT_CHARTER,
    createdAt: new Date(),
    cus_users: formResident,
    room: formRoom,
  });

  const [staff, setStaff] = useState<Staff>({
    id: 0,
    name: "",
    email: "",
    employeeId: "",
    role: Role.ADMIN,
  })

  const [message, setMessage] = useState<string>("");

  return (
    <BookingContext.Provider
      value={{
        formResident, setFormResident,
        formRoom, setFormRoom,
        currentBooking, setCurrentBooking,
        ownerInfo, setOwnerInfo,
        vehicle, setVehicle,
        staff, setStaff,
        isEditMode, setIsEditMode,
        message, setMessage
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

// สร้าง Custom Hook พร้อมตัวเช็ค Error
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};