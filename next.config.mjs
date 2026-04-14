// next.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. เพิ่มตัวนี้เพื่อให้ Dockerfile รันแบบ standalone ได้
  output: 'standalone',
  // สำหรับ Next.js 15 ถ้าใส่ข้างนอกแล้วยังฟ้อง Error ให้ลองขยับกลับเข้า experimental 
  // หรือถ้าไม่ได้รัน Docker แบบ Monorepo ซับซ้อน ลบบรรทัดนี้ออกก่อนได้ครับ
  // outputFileTracingRoot: path.join(__dirname, '../..'),

  // experimental: {
  // outputFileTracingRoot: undefined,
  // },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        pathname: '/**',
      },
    ],
  },

  devIndicators: {
    // appIsrStatus: false, 
    // buildActivity: false, 
  },
  allowedDevOrigins: [
    'final.my-ppp.net'
  ]
};

export default nextConfig;
