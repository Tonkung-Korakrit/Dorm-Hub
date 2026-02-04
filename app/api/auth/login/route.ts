// api/auth/login/route.js
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import axios from "axios";

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
      // check user ใน DB
      let user = await prisma.user.findUnique({
        where: { studentId: tuUser.username },
      });

      // console.log("user: ", user)

      if (!user) {
        // ถ้าไม่มี → สร้างใหม่
        user = await prisma.user.create({
          data: {
            studentId: tuUser.username,
            name_en: tuUser.displayname_en,
            name_th: tuUser.displayname_th,
            email: tuUser.email,
            // faculty_department: tuUser.faculty,
            // department: tuUser.department,
            tu_status: tuUser.tu_status,
            role: "STUDENT",
            // citizenType: "",
            // citizenNumber: `TEMP-${tuUser.username}`, // ต้อง Unique
            // gender: "OTHER", // ต้องตรงกับ Enum GenderType
            // prefix: "",
            // phone: "",
            // birthDate: new Date(), // หรือค่าที่เหมาะสม
          },
        });
      } else {
        // ถ้ามี → อัปเดตข้อมูล
        user = await prisma.user.update({
          where: { studentId: tuUser.username },
          data: {
            name_en: tuUser.displayname_en,
            name_th: tuUser.displayname_th,
            email: tuUser.email,
            // faculty_department: tuUser.faculty,
            // department: tuUser.department,
            tu_status: tuUser.tu_status,
            role: "STUDENT",
          },
        });
      }

      // set cookie หรือ generate toke
      const provider = "TU";
      const token = jwt.sign(
        { username, provider }, // payload
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // set cookie
      const res = NextResponse.json({ message: "Login successful", ok: true });
      res.cookies.set("token", token, {
        httpOnly: true,
        // secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
      // console.log("res", res);
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