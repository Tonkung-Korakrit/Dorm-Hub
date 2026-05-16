// utils/identify.ts
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/auth";
import { prisma } from "@/lib/prisma";
// import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";
import { Resident } from "@/utils/types";
import { FileType } from "@prisma/client";

const RESIDENT_SELECT_FIELDS = {
  id: true,
  citizenType: true,
  citizenNumber: true,
  studentId: true,
  gender: true,
  titleName: true,
  name: true,
  name_en: true,
  name_th: true,
  email: true,
  mobilePhone: true,
  birthDate: true,
  isScholarshipStudent: true,
  isDisabled: true,
  faculty_department: true,
  // lifestyle: true,
  // lifestyleNote: true,
  address: true,
  // guardians: true,
  profileImage: {
    where: {
      type: {
        in: [FileType.FACE_PHOTO, FileType.CITIZEN_CARD],
      },
    },
  },
  vehicleInfo: {
    include: {
      file_info: {
        select: {
          path: true,
        },
      },
    },
  },
  // role: true,
  // updatedAt: true,
};

const SECRET_USER = new TextEncoder().encode(process.env.JWT_SECRET);

// "use server"
export const getResidentProfile = async (): Promise<Resident> => {
  // const jwtSecret = process.env.JWT_SECRET as string;
  const session = await getServerSession(authOptions);

  try {
    // --- กรณีที่ 1: Login ผ่าน Google (Next-Auth) ---
    if (session?.user?.provider === "google" && session.user.token) {
      // const decoded = jwt(session.user.token, jwtSecret) as { email: string };
      const { payload } = await jwtVerify(session.user.token, SECRET_USER);

      const user = await prisma.cus_users.findUnique({
        where: { email: payload.email as string },
        select: RESIDENT_SELECT_FIELDS,
      });

      if (user) {
        // Fallback ชื่อภาษาไทยถ้าใน DB ไม่มีแต่ใน Session มี
        const resident = { ...user };
        if (!resident.name_th && session.user.name) {
          resident.name_th = session.user.name;
        }
        return {
          ...resident,
          vehicleInfo: resident.vehicleInfo
          ? {
              id: resident.vehicleInfo.id,
              userId: resident.vehicleInfo.userId,
              licensePlate: resident.vehicleInfo.licensePlate || "",
              province: resident.vehicleInfo.province || "",
              ownerName: resident.vehicleInfo.ownerName || "",
              path: resident.vehicleInfo?.file_info?.path || "",
              createdAt: resident.vehicleInfo?.createdAt,
            }
          : null,
        };
      }
    }

    // --- กรณีที่ 2: Login ผ่าน TU API (Custom JWT ใน Cookie) ---
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      // const decoded = jwt.verify(token, jwtSecret) as { studentId: string };
      const { payload } = await jwtVerify(token, SECRET_USER);

      const resident = await prisma.cus_users.findUnique({
        where: { studentId: payload.studentId as string },
        select: RESIDENT_SELECT_FIELDS,
      });

      return resident as any;
    }

    return null; // ถ้าไม่เข้าเงื่อนไขไหนเลย แปลว่าไม่ได้ Login
  } catch (error) {
    console.error("❌ Auth Helper Error:", error);
    return null;
  }
};