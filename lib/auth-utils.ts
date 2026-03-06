// lib/auth-utils.ts
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET_USER = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getCurrentUser() {
  let studentId = null;
  let role = null;
  let email = null;

  // 1. เช็คจาก Custom JWT (ใช้ TU Login เป็นหลัก)
  // เพราะเร็วกว่าการรอ getServerSession มาก
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

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
}