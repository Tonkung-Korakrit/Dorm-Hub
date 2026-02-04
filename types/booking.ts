// types/booking.ts
import { RoomStatus, BookingType, BookingStatus, Role, GenderType, UserDocument, AddressType, RoomType } from "@prisma/client";

export interface Resident {
  id: number;
  role: Role;
  email: string;
  citizenType: string;
  citizenNumber: string;
  studentId: string;
  gender: GenderType;
  prefix: string;
  name?: string;
  name_en: string;
  name_th: string;
  birthDate: string;
  phone: string;

  isScholarshipStudent?: boolean;
  isDisabled?: boolean;

  image?: string;
  faculty_department?: string;
  // department?: string;
  tu_status?: string;
  lifestyle: string[] | any;
  guardians: Guardian[];
  documents: UserDocument[];
  vehicleInfo?: Vehicle | null;
  address: Address[];
}

export interface Guardian {
  id: number;
  name: string;
  relation: string;
  phone: string;
}

export interface Vehicle {
  id: number;
  userId: number;
  licensePlate: string;
  province: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface Dorm {
  id: number;
  name: string;
  zone?: Zone[];
}

export interface Zone {
  id: number;
  name: string;
  gender: GenderType;
  mapUrl: string;
  maxCols: number;
  maxRows: number;
  dorm: Dorm;
  rooms?: Room[];
}

export interface Room {
  id: number;
  campus: string;   
  // zone: string;
  roomId: string;
  floor: number;
  status: RoomStatus;
  isLocked: boolean;
  roomType: RoomType;
  price: number;
  capacity: number;
  currentOccupancy: number;
  lifestyleConfig: any; // Prisma เก็บเป็น Json

  posX: number;
  posY: number;
  zone: Zone; 
  booking: Booking[];

  // bookingId?: number; // สำหรับเก็บ ID การจองเมื่อมีการจองสำเร็จ
}

export interface OwnerInfo {
  studentId?: string;
  name?: string;
  zoneName?: string;
  // roomNumber: string;
  roomId?: string;
}

export { RoomStatus, BookingType, BookingStatus, Role, RoomType, GenderType };

export interface BookRoomFormProps {
  user: Resident;
  // rooms: Room[];
}

// export type BookingIntent = "Charter room" | "Not Charter room" | "Co-Resident" | null;

export interface Booking {
  id: number;
  status: BookingStatus;
  type: BookingType;
  createdAt: Date;
  expiresAt?: Date | null;
  userId: number;
  roomId: number;

  verifiedBy?: number | null;
  verifier?: Admin | null;
  
  // Relations (ข้อมูลที่ดึงพ่วงมาด้วย)
  user: Resident; 
  room: Room;
}

export interface Admin {
  id: number;
  name: string | null;
  email: string;
  employeeId: string | null;
  role: Role;
}