import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // เช็คทั้งแบบธรรมดา และแบบ Secure (สำหรับ HTTPS)
  const nextAuthToken = 
    request.cookies.get('next-auth.session-token') || 
    request.cookies.get('__Secure-next-auth.session-token');
    
  const tuToken = request.cookies.get('token');
  const isAuthenticated = nextAuthToken || tuToken;

  const { pathname } = request.nextUrl;

  // 1. ถ้า Login แล้วพยายามเข้าหน้า Login -> ดีดไปหน้าแรก
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. ถ้ายังไม่ Login และพยายามเข้าหน้าที่ต้องป้องกัน -> ดีดไป Login
  const protectedPaths = ['/', '/dashboard', '/book'];
  const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Matcher ที่แนะนำ:
   * 1. ไม่ดักจับไฟล์ใน public (images, logo)
   * 2. ไม่ดักจับ _next/static (ไฟล์สไตล์และสคริปต์)
   * 3. ไม่ดักจับ _next/image (การทำ Image Optimization)
   * 4. ไม่ดักจับ favicon.ico
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)',
  ],
};