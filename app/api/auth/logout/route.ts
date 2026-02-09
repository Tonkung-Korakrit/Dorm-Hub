import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ 
    message: "Logged out successfully", 
    ok: true 
  });

  // ลบ Cookie "token" ให้หายไปทันทีในทุกสถานการณ์
  res.cookies.set("token", "", {
    path: "/",
    maxAge: 0,            // สั่งให้หมดอายุทันที (หน่วยเป็นวินาที)
    expires: new Date(0),  // ตั้งย้อนหลังเพื่อความชัวร์ใน Browser รุ่นเก่า
    httpOnly: true,        // ควรระบุให้เหมือนตอนที่สร้างมา
    secure: process.env.NODE_ENV === "production", // ถ้าตอนสร้างเป็น secure ตอนลบก็ควรระบุด้วย
    sameSite: "lax",
  });

  return res;
}