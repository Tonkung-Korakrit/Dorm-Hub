import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose"; // นำเข้า SignJWT

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 1. ค้นหา Admin (ใช้ select เพื่อความเร็ว)
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true, password: true, isActive: true, name: true, role: true }
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้งานหรือบัญชีถูกระงับ' }, { status: 401 });
    }

    // 2. ตรวจสอบรหัสผ่าน (bcrypt ใช้เวลาประมาณ 300ms+)
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // 3. สร้าง JWT Token (ปลอดภัยกว่า Base64 มหาศาล)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);
    const token = await new SignJWT({ 
        id: admin.id, 
        email: email, 
        role: admin.role 
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d') // หมดอายุใน 1 วัน
      .sign(secret);

    // 4. Update lastLogin แบบไม่ต้องรอ (Fire and Forget) เพื่อความเร็ว
    prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    }).catch(err => console.error("Audit Trail Error:", err));

    return NextResponse.json({
      success: true,
      token, // ส่ง JWT กลับไป
      admin: {
        id: admin.id,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';

// export async function POST(request: Request) {
//   try {
//     // 1. รับข้อมูลจากหน้า Login
//     const body = await request.json();
//     const { email, password } = body;

//     // ตรวจสอบเบื้องต้น (Validation)
//     if (!email || !password) {
//       return NextResponse.json(
//         { message: 'กรุณากรอกอีเมลและรหัสผ่าน' },
//         { status: 400 }
//       );
//     }

//     // 2. ส่งข้อมูลไปเช็คที่ API มหาลัย (เปลี่ยน URL ตามจริง)
//     // หมายเหตุ: ตรงนี้คือจุดที่คุณสามารถปรับแต่งตามโครงสร้าง API ของมอได้เลย
//     const externalResponse = await fetch('https://api.tu.ac.th/v1/auth/login', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         // 'X-API-KEY': process.env.EXTERNAL_API_KEY, // ถ้ามี API Key
//       },
//       body: JSON.stringify({
//         username: email, // บาง API ใช้ email เป็น username
//         password: password,
//       }),
//     });

//     const externalData = await externalResponse.json();

//     // 3. ตรวจสอบผลลัพธ์จาก API มหาลัย
//     if (!externalResponse.ok) {
//       return NextResponse.json(
//         { message: externalData.message || 'รหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์ผู้ดูแลระบบ' },
//         { status: 401 }
//       );
//     }

//     // 4. ถ้าผ่าน: ส่ง Token กลับไปให้ Client
//     // คุณสามารถเลือกส่งเฉพาะ Token หรือพ่วงข้อมูล User ไปด้วยก็ได้
//     return NextResponse.json({
//       success: true,
//       token: externalData.access_token || externalData.token, // ปรับตามชื่อ field ของ API มอ
//       user: {
//         name: externalData.user_name,
//         role: 'admin'
//       }
//     }, { status: 200 });

//   } catch (error) {
//     console.error('Login API Error:', error);
//     return NextResponse.json(
//       { message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบเซิร์ฟเวอร์' },
//       { status: 500 }
//     );
//   }
// }