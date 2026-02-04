import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ 
    message: "Logged out successfully", 
    ok: true 
  });

  // ลบ Cookie "token" โดยการตั้งค่าให้หมดอายุทันที
  res.cookies.set("token", "", {
    path: "/",
    expires: new Date(0), // ตั้งย้อนหลังไปปี 1970 เพื่อให้หายไปทันที
    httpOnly: true,
  });

  return res;
}