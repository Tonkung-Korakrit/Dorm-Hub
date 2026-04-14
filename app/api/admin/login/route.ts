// api/admin/login/route.ts

import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const admin = await prisma.staff_users.findUnique({
      where: { email },
      select: { id: true, password: true, isEnabled: true, name: true, role: true }
    });

    if (!admin || !admin.isEnabled) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้งานหรือบัญชีถูกระงับ' }, { status: 401 });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // จุดสำคัญ 1: ใช้ Secret เดียวกันกับ Middleware
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const token = await new SignJWT({ 
        id: admin.id, 
        email: email, 
        role: admin.role 
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d') 
      .sign(secret);

    // Update lastLogin (เปลี่ยนเป็น await เพื่อความชัวร์ว่าข้อมูลลง DB ก่อน redirect)
    await prisma.staff_users.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // จุดสำคัญ 2: สร้าง Response และฝัง Cookie
    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, name: admin.name, role: admin.role }
    });

    response.cookies.set({
      name: 'admin-token', // ชื่อต้องตรงกับที่ middleware เรียก
      value: token,
      httpOnly: true, // ปลอดภัยสูง ป้องกัน JS อ่านค่า
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 วัน
    });

    return response;

  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}