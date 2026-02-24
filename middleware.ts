import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getToken } from 'next-auth/jwt';

// 1. เตรียม Secret Key แยกกุญแจสองดอกให้ชัดเจน
const SECRET_USER = new TextEncoder().encode(process.env.JWT_SECRET);
const SECRET_ADMIN = new TextEncoder().encode(process.env.JWT_SECRET_ADMIN);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- A. ตรวจสอบบัตร NextAuth (Google Login) ---
  const nextAuthSession = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // --- B. ตรวจสอบบัตร Custom JWT (Cookie) ---
  const userToken = request.cookies.get('token')?.value;
  const adminToken = request.cookies.get('admin-token')?.value;

  let customPayload: any = null;
  let isAdminAuthenticated = false;
  let isUserAuthenticated = !!nextAuthSession;

  // แยกส่วนการไขกุญแจตามประเภทบัตรที่ถือมา
  try {
    // 1. ถ้ามีบัตร Admin ให้ใช้กุญแจ Admin ไขเท่านั้น
    if (adminToken) {
      const { payload } = await jwtVerify(adminToken, SECRET_ADMIN);
      if (payload.role === 'ADMIN') {
        isAdminAuthenticated = true;
        customPayload = payload;
      }
    }

    // 2. ถ้ามีบัตร User และยังไม่มี Session จาก Google ให้ใช้กุญแจ User ไข
    if (userToken && !isUserAuthenticated) {
      const { payload } = await jwtVerify(userToken, SECRET_USER);
      isUserAuthenticated = true;
      customPayload = payload;
    }
  } catch (err) {
    // กรณีบัตรเน่า/หมดอายุ/โดนปลอม ให้ทำลายบัตรและดีดออก
    // 1. กำหนดหน้าที่จะเด้งไป (ตรวจสอบให้ตรงกับหน้า Login ของคุณ)
    const isTargetingAdmin = pathname.startsWith('/admin');
    const loginUrl = new URL(isTargetingAdmin ? '/admin/login' : '/', request.url);

    // 2. ส่งเหตุผลไปด้วยเพื่อให้หน้า Client โชว์ Popup
    loginUrl.searchParams.set('reason', 'expired');
    const response = NextResponse.redirect(loginUrl);

    if (isTargetingAdmin) {
      response.cookies.delete('admin-token');
    } else {
      response.cookies.delete('token');
      // ลบ cookie ของ next-auth ไปด้วยเลยเพื่อความชัวร์ (ถ้ามี)
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('next-auth.csrf-token');
    }

    return response;
  }

  // สรุปสถานะการเข้าสู่ระบบและบทบาท
  const isAuthenticated = isAdminAuthenticated || isUserAuthenticated;
  const userRole = isAdminAuthenticated ? 'ADMIN' : (nextAuthSession?.role || customPayload?.role || 'USER');

  // --- ส่วนการควบคุมสิทธิ์เข้าถึง (Access Control) ---

  const isAdminPath = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';
  const isUserProtectedPath = ['/my-booking', '/new-booking', '/payment'].some(p => pathname.startsWith(p));
  const isPublicAuthPage = pathname === '/login' || pathname === '/';

  // กฎข้อที่ 1: เข้าหน้า Admin ต้องเป็น ADMIN เท่านั้น
  if (isAdminPath && !isAdminLoginPage) {
    if (!isAdminAuthenticated || userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // กฎข้อที่ 2: เข้าหน้าจองหอพัก ต้องล็อกอินก่อน
  if (isUserProtectedPath && !isAuthenticated) {
    // return NextResponse.redirect(new URL('/', request.url));
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('reason', 'unauthorized'); // <--- เพิ่มตรงนี้
    return NextResponse.redirect(loginUrl);
  }

  const isExpiredReason = request.nextUrl.searchParams.get('reason') === 'expired';

  // กฎข้อที่ 3: ถ้าล็อกอินแล้ว ห้ามเข้าหน้า Login ซ้ำ (ดีดไปหน้า Dashboard/Booking)
  if (isAuthenticated && (isPublicAuthPage || isAdminLoginPage) && !isExpiredReason) {
    const dest = userRole === 'ADMIN' ? '/admin/dashboard' : '/my-booking';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

// กำหนด Path ที่ต้องการให้ Middleware ทำงาน (ครอบคลุมทั้งโปรเจกต์ ยกเว้นไฟล์ Resource)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)'],
};