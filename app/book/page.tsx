// /book/page.tsx
// Server Component
// "use server";
import { prisma } from "@/lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
    if (!token) redirect("/login");

    try {
      const decoded = jwt.verify(token, jwtSecret) as CustomJwtPayload;
      user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          id: true,
          role: true,
          email: true,
          citizenType: true,
          citizenNumber: true,
          studentId: true,
          gender: true,
          prefix: true,
          name: true,
          name_en: true,
          name_th: true,
          image: true,
          faculty_department: true,
          // department: true,
          tu_status: true,
          // lifestyle: true,
        },
      }) as Resident | null;

      // Fallback ชื่อภาษาไทยจาก Session
      if (user && !user.name_th && session?.user?.name) {
        user.name_th = session.user.name;
      }
    } catch (error) {
      redirect("/login");
    }

  } 
  // กรณี Login ด้วย TU API (JWT ใน Cookie)
  else {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/login");

    try {
      const decoded = jwt.verify(token, jwtSecret) as CustomJwtPayload;
      user = await prisma.user.findUnique({
        where: { studentId: decoded.username },
        select: {
          id: true,
          role: true,
          email: true,
          citizenType: true,
          citizenNumber: true,
          studentId: true,
          gender: true,
          prefix: true,
          name_en: true,
          name_th: true,
          faculty_department: true,
          // department: true,
          tu_status: true,
        },
      }) as Resident | null;
    } catch (error) {
      redirect("/login");
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

  if (!user) redirect("/login");

  return <Form user={user} />;
}