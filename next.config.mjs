/** @type {import('next').NextConfig} */
// const nextConfig = {};
const nextConfig = {
  devIndicators: {
    appIsrStatus: false, // สำหรับ Next.js เวอร์ชั่นใหม่ๆ (App Router)
    buildActivity: false, // ปิดตัว Indicator ที่มุมจอ
  },
};

export default nextConfig;
