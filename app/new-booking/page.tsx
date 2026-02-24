// /new-booking/page.tsx
// "use server";
import { prisma } from "@/lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Form from "./components/Form";
import { Resident } from "@/types/booking";

interface CustomJwtPayload {
  email?: string;
  username?: string;
}

export default async function BookRoomPage() {
  let user: Resident = null;
  const session = await getServerSession(authOptions);
  const provider = session?.user?.provider;
  const jwtSecret = process.env.JWT_SECRET as string;
  
  // กรณี Login ด้วย Google
  if (provider === "google") {
    const token = session?.user?.token;
    if (!token) redirect("/");

    try {
      const decoded = jwt.verify(token, jwtSecret) as CustomJwtPayload;
      user = await prisma.cus_users.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          role: true,
          email: true,
          citizenType: true,
          citizenNumber: true,
          studentId: true,
          gender: true,
          titleName: true,
          name: true,
          name_en: true,
          name_th: true,
          birthDate: true,
          mobilePhone: true,
          profileImage: true,
          isDisabled: true,
          isScholarshipStudent: true,
          faculty_department: true,
          // department: true,
          // tu_status: true,
          // lifestyle: true,
        },
      }) as Resident | null;

      // Fallback ชื่อภาษาไทยจาก Session
      if (user && !user.name_th && session?.user?.name) {
        user.name_th = session.user.name;
      }
    } catch (error) {
      redirect("/");
    }

  } 
  // กรณี Login ด้วย TU API (JWT ใน Cookie)
  else {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/");

    try {
      const decoded = jwt.verify(token, jwtSecret) as CustomJwtPayload;
      user = await prisma.cus_users.findUnique({
        where: { studentId: decoded.username },
        select: {
          id: true,
          role: true,
          email: true,
          citizenType: true,
          citizenNumber: true,
          studentId: true,
          gender: true,
          titleName: true,
          name_en: true,
          name_th: true,
          birthDate: true,
          mobilePhone: true,
          isDisabled: true,
          isScholarshipStudent: true,
          faculty_department: true,
          // department: true,
          // tu_status: true,
        },
      }) as Resident | null;
    } catch (error) {
      redirect("/");
    }
  }

  // ดึงข้อมูลห้องพักพร้อมข้อมูลหอพัก (Include Dorm Relation)
  // const rooms = await prisma.room.findMany({ 
  //   include: { 
  //     zone: {
  //     include: {
  //       dorm: true // ดึงข้อมูลหอพักที่ Zone นั้นสังกัดอยู่
  //     }
  //   } 
  //   } 
  // });

  if (!user) redirect("/");

  return <Form user={user} />;
}