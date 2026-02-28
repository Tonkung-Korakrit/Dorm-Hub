// app/(admin)/admin/login/actions.ts
'use server'

import { cookies } from 'next/headers'

/**
 * สร้างเซสชันสำหรับ Admin โดยการเก็บ JWT ลงใน Cookie
 * @param token JWT String ที่ได้รับจาก API Login
 */
export async function createAdminSession(token: string) {
  const cookieStore = await cookies();
  
  // กำหนดค่า Cookie ด้วยความปลอดภัยสูงสุด
  cookieStore.set('admin-token', token, {
    httpOnly: true, // ป้องกันการเข้าถึงผ่าน JavaScript (ลดความเสี่ยง XSS)
    secure: process.env.NODE_ENV === 'production', // ส่งผ่าน HTTPS เท่านั้นใน Production
    sameSite: 'lax', // ป้องกัน CSRF ในระดับที่เหมาะสมกับการทำ Redirect
    path: '/', // ให้ Cookie ใช้ได้ทั้ง Domain
    maxAge: 60 * 60 * 24, // หมดอายุใน 1 วัน (ตรงกับเวลาใน JWT)
    priority: 'high', // บังคับให้ Browser ให้ความสำคัญกับการเซ็ตค่านี้
  });
}

/**
 * ลบเซสชัน (Logout) สำหรับทั้ง Admin และ User
 */
export async function deleteAdminSession() {
  const cookieStore = await cookies();
  
  // 1. ต้องใช้ชื่อ 'admin-token' ให้ตรงกับตอน Login และ Middleware
  cookieStore.delete('admin-token');
  
  // 2. ถ้ามีคุกกี้ชื่อ 'token' (ของระบบเก่า) ก็ลบเผื่อไว้ด้วย
  // cookieStore.delete('token');

  // 3. สั่งดีดกลับไปหน้า Login ทันที
  // redirect('/admin/login');
}