// next.config.mjs
/** @type {import('next').NextConfig} */
// const nextConfig = {};
const nextConfig = {
  // 1. เพิ่มตัวนี้เพื่อให้ Dockerfile รันแบบ standalone ได้
  output: 'standalone',
  
  devIndicators: {
    appIsrStatus: false, // สำหรับ Next.js เวอร์ชั่นใหม่ๆ (App Router)
    buildActivity: false, // ปิดตัว Indicator ที่มุมจอ
  },
};

export default nextConfig;
