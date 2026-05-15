// utils/identify.ts
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/auth";
import { jwtVerify } from "jose";

const SECRET_USER = new TextEncoder().encode(process.env.JWT_SECRET);

export const getAuthSession = async () => {
  let studentId = null;
  let role = null;
  let email = null;

  // 1. เช็คจาก Custom JWT (ใช้ TU Login เป็นหลัก)
  // เพราะเร็วกว่าการรอ getServerSession มาก
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // console.log("--- DEBUG START ---");
  // console.log("Booking ID from URL:", bookingId);
  // console.log("Token User ID:", userId);
  // console.log("Session Email:", session?.user?.email);
  // console.log("--- DEBUG END ---");

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_USER);
      // const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      studentId = payload.studentId as string;
      role = (payload.role as string) || "STUDENT";
      console.log("✅ Authenticated via: University API (JWT)");
    } catch (err) {
      // Token เน่าหรือหมดอายุ /* token invalid */
      console.error("❌ JWT Verify Error:", err);
    }
  }

  // ถ้าไม่มี token ค่อยไปเช็ค getServerSession
  if (!studentId) {
    // 2. เช็คจาก Next-Auth Session (Google Login)
    const session = await getServerSession(authOptions);
    email = session?.user?.email;
    console.log("✅ Authenticated via: Next-Auth (Google Email)");
  }

  const excludeConditions = [];

  if (email) {
    excludeConditions.push({ email: email });
  }

  // เช็คทั้งการมีอยู่ และต้องไม่เป็น String ว่าง
  if (studentId && studentId !== "") {
    excludeConditions.push({ studentId: studentId });
  }

  // return { studentId, email, role, isAuthenticated: !!(studentId || email) };
  return {
    excludeConditions,
    isAuthenticated: excludeConditions.length > 0, // เช็คง่ายๆ ว่าล็อกอินหรือยัง
    // user: { email, studentId } // เผื่อต้องใช้ข้อมูลไปแสดงผลต่อ
  };
};

// {* โค้ดเก่า *}
// let user: Resident = null;
// const session = await getServerSession(authOptions);
// const provider = session?.user?.provider;
// const jwtSecret = process.env.JWT_SECRET as string;

// // กรณี Login ด้วย Google
// if (provider === "google") {
//   const token = session?.user?.token;
//   if (!token) redirect("/");

//   try {
//     const decoded = jwt.verify(token, jwtSecret) as CustomJwtPayload;
//     user = await prisma.cus_users.findUnique({
//       where: { email: decoded.email },
//       select: {
//         id: true,
//         role: true,
//         email: true,
//         citizenType: true,
//         citizenNumber: true,
//         studentId: true,
//         gender: true,
//         titleName: true,
//         name: true,
//         name_en: true,
//         name_th: true,
//         birthDate: true,
//         mobilePhone: true,
//         profileImage: true,
//         isDisabled: true,
//         isScholarshipStudent: true,
//         faculty_department: true,
//         // department: true,
//         // tu_status: true,
//         // lifestyle: true,
//       },
//     }) as Resident | null;

//     // Fallback ชื่อภาษาไทยจาก Session
//     if (user && !user.name_th && session?.user?.name) {
//       user.name_th = session.user.name;
//     }
//   } catch (error) {
//     redirect("/");
//   }

// }
// // กรณี Login ด้วย TU API (JWT ใน Cookie)
// else {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;
//   if (!token) redirect("/");

//   try {
//     const decoded = jwt.verify(token, jwtSecret) as CustomJwtPayload;
//     user = await prisma.cus_users.findUnique({
//       where: { studentId: decoded.studentId },
//       select: {
//         id: true,
//         role: true,
//         email: true,
//         citizenType: true,
//         citizenNumber: true,
//         studentId: true,
//         gender: true,
//         titleName: true,
//         name_en: true,
//         name_th: true,
//         birthDate: true,
//         mobilePhone: true,
//         isDisabled: true,
//         isScholarshipStudent: true,
//         faculty_department: true,
//         // department: true,
//         // tu_status: true,
//       },
//     }) as Resident | null;
//   } catch (error) {
//     redirect("/");
//   }
// }

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

// const user = await getResidentUser();

// ถ้าไม่มี User (ไม่ได้ Login หรือ Token ปลอม) ให้เด้งกลับหน้าแรก
// if (!user) redirect("/");

// *}