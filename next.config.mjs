// next.config.mjs
/** @type {import('next').NextConfig} */
// const nextConfig = {};
const nextConfig = {
  // 1. เพิ่มตัวนี้เพื่อให้ Dockerfile รันแบบ standalone ได้
  output: 'standalone',
  
  devIndicators: {
    // appIsrStatus: false, 
    // buildActivity: false, 
  },
  allowedDevOrigins: [
    'final.my-ppp.net'
  ]
};

export default nextConfig;
