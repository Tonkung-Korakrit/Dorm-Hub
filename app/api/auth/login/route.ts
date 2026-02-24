// api/auth/login/route.js
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import axios from "axios";
import { Role } from "@/types/booking";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    // verify TU API
    const tuData = await axios.post(
      "https://restapi.tu.ac.th/api/v1/auth/Ad/verify",
      {
        UserName: username, // ต้องส่งค่าไปยัง UserName เท่านั้น พิมพ์ผิดไม่ได้
        PassWord: password  // ต้องส่งค่าไปยัง PassWord เท่านั้น พิมพ์ผิดไม่ได้
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Application-Key': process.env.APPLICATION_KEY, // คีย์แอปพลิเคชัน
        },
      }
    );
    console.log("Login response:", tuData.data);

    if (tuData.data.status === true) {
      const tuUser = tuData.data;

      // 2. ใช้ upsert เพื่อให้จบใน Query เดียว (ลด Round-trip DB)
      // และใช้ select เพื่อดึงเฉพาะข้อมูลที่จำเป็น
      const user = await prisma.cus_users.upsert({
        where: { studentId: tuUser.username },
        update: {
          name_en: tuUser.displayname_en,
          name_th: tuUser.displayname_th,
          email: tuUser.email,
          // tu_status: tuUser.tu_status,
        },
        create: {
          studentId: tuUser.username, // หรือ BigInt(tuUser.username) ถ้าใน DB เป็น BigInt
          name_en: tuUser.displayname_en,
          name_th: tuUser.displayname_th,
          email: tuUser.email,
          // tu_status: tuUser.tu_status,
          role: Role.STUDENT,
        },
        select: { studentId: true, role: true }
      });

      // 3. สร้าง Token
      const token = jwt.sign(
        { username: user.studentId, role: user.role, provider: "TU" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      const res = NextResponse.json({ message: "Login successful", ok: true });
      res.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600,
      });

      return res;
    } else {
      return NextResponse.json(
        { error: "Login failed. Invalid username or password." },
        { status: 401 }
      );
    }

  } catch (err) {
    console.error("TU API error:", err.response?.data || err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}