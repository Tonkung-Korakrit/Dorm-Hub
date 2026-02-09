import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // ใช้ jose แทนเพราะรันบน Edge ได้ไวมาก

// เตรียม Secret Key ในรูปแบบที่ jose ต้องการ
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // 1. ฟังก์ชันตรวจสอบ JWT และดึง Payload
  let payload = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      // ถ้า Token ปลอมหรือหมดอายุ ให้ลบคุกกี้แล้วส่งกลับหน้า Login
      const response = NextResponse.redirect(new URL(pathname.startsWith('/admin') ? '/admin/login' : '/', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  const isAuthenticated = !!payload;
  const userRole = payload?.role; // ดึง Role มาเช็คสิทธิ์ (ถ้ามีเก็บไว้ใน JWT)

  // 2. กำหนด Path ต่างๆ
  const isRootPath = pathname === '/';
  const isAdminLogin = pathname === '/admin/login';
  const isAdminPath = pathname.startsWith('/admin'); // ครอบคลุมทุกหน้า admin
  const isUserPath = ['/my-booking', '/book', '/payment'].some(path => pathname.startsWith(path));

  // --- 🚩 LOGIC สำหรับ ADMIN ---
  if (isAdminLogin) {
    if (isAuthenticated && userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isAdminPath) {
    // ถ้าไม่มี Token หรือมีแต่ไม่ใช่ ADMIN ให้ดีดไปหน้า Login Admin
    if (!isAuthenticated || userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // --- 🚩 LOGIC สำหรับ USER (นักศึกษา) ---
  if (isRootPath) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/my-booking', request.url));
    }
    return NextResponse.next();
  }

  if (isUserPath) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)'],
};