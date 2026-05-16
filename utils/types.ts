// types/booking.ts
import {
  RoomStatus,
  BookingType,
  BookingStatus,
  Role,
  GenderType,
  File_info,
  AddressType,
  RoomType,
  CitizenType,
  PaymentStatus,
} from "@prisma/client";

export interface Resident {
  id: number;
  citizenType?: string;
  citizenNumber?: string;
  studentId?: string;
  gender?: GenderType;
  titleName?: string;
  name?: string;
  name_en: string;
  name_th: string;
  email: string;
  mobilePhone?: string;
  birthDate?: Date | string;
  isScholarshipStudent?: boolean;
  isDisabled?: boolean;
  faculty_department?: string;
  // department?: string;
  lifestyle?: string[] | any;
  lifestyleNote?: string;
  // isEnabled?: boolean;
  // image?: string;
  // tu_status?: string;
  hasLineLogin?: boolean;
  address?: Address[];
  guardians?: Guardian[];
  profileImage?: File_info[];
  facePhotoFile?: File | null;
  citizenCardFile?: File | null;
  vehicleInfo?: Partial<Vehicle> | null;
  role?: Role;
}

export interface Guardian {
  id: number;
  name: string;
  relation: string;
  phone: string;
}

export interface Vehicle {
  id: number;
  userId?: number;
  licensePlate: string;
  province: string;
  ownerName: string;
  path?: string;
  registrationFile?: File | null;
  file_info?: File_info | null;
  createdAt?: Date;
  // updatedAt: Date;
}

export interface Address {
  id: number;
  type: AddressType;
  addressDetail: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Campus {
  id: number;
  name: string;
  dorm?: Dorm[];
}

export interface Dorm {
  id?: number;
  name: string;
  genderType?: GenderType;
  mapUrl?: string;
  maxCols?: number;
  maxRows?: number;
  campus?: string;
  // floors: number[]
  rooms?: Room[];
}

export interface Room {
  id?: number;
  campus: string;
  dorm: Dorm;
  roomId: string;
  floor: number;
  status?: RoomStatus;
  isLocked?: boolean;
  roomType: RoomType;
  price?: number;
  capacity?: number;
  currentOccupancy?: number;
  lifestyleConfig?: any; // Prisma เก็บเป็น Json
  lifestyleNote?: String;
  facultyConfig?: any;

  isSuite?: boolean;
  parentId?: number | null; // ID ของห้องใหญ่ (กรณีที่เป็นห้องย่อย A หรือ B)
  parent?: Room | null; // ข้อมูลห้องใหญ่
  subRooms?: Room[];

  posX?: number;
  posY?: number;
  booking?: Booking[];

  // bookingId?: number; // สำหรับเก็บ ID การจองเมื่อมีการจองสำเร็จ
}

export interface OwnerInfo {
  studentId?: string;
  name?: string;
  dorm?: string;
  roomId?: string;
  // roomNumber: string;
}

export {
  RoomStatus,
  BookingType,
  BookingStatus,
  Role,
  RoomType,
  GenderType,
  CitizenType,
  PaymentStatus,
  AddressType,
};

export interface BookRoomFormProps {
  user: Resident;
  // rooms: Room[];
}

export interface Booking {
  id?: number;
  success: boolean;
  message: string;

  status?: BookingStatus;
  type?: BookingType;
  groupId?: string | null;
  remark?: string;
  createdAt?: Date;
  updatedAt?: Date;

  cus_users?: Resident;
  room?: Room;
  // address?: Address;

  hasCheckin?: boolean;
  hasCheckout?: boolean;
  canBookAgain?: boolean;
}

export interface MailBookingData {
  id: number;
  type: BookingType;
  cus_users: {
    name_th: string;
    email: string;
  };
  room: {
    roomId: string;
    floor: number;
    roomType: RoomType;
    dorm: {
      name: string;
      campus: {
        name: string;
      };
    };
  };
}

export interface Staff {
  id: number;
  name: string | null;
  email: string;
  employeeId: string | null;
  role: Role;
}

export interface Checkin {
  id: number;
  bookingId: number;
  type: string;
  createdBy: number;
  createdAt: Date;
}

// export {
//   RoomStatus,
//   BookingType,
//   BookingStatus,
//   Role,
//   GenderType,
//   // profileImage,
//   AddressType,
//   RoomType
// } from "@prisma/client";
