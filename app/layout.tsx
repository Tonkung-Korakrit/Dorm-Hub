// /app/layout.tsx
import './globals.css';
import { BookingProvider } from "@/app/contexts/BookingContext";
// import NextAuthProvider from "@/components/NextAuthProvider";
import type { Metadata } from 'next';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import SessionGuard from '@/components/SessionGuard';

// 1. กำหนด Type ให้กับ Metadata
export const metadata: Metadata = {
  title: 'Dorm-Hub',
  description: 'ระบบจองหอพักภายในมหาวิทยาลัยธรรมศาสตร์',
};

// 2. กำหนด Interface สำหรับ Props ของ RootLayout
interface RootLayoutProps {
  children: React.ReactNode; // children ใน React ต้องใช้ Type นี้เสมอ
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-800 relative flex flex-col">
        <Toaster position="top-right" reverseOrder={false} />
        {/* <NextAuthProvider> */}
        <BookingProvider>
          {/* พื้นหลังครึ่งบน */}
          <div
            className="fixed top-0 left-0 w-full h-[50vh] bg-cover bg-center -z-10
             bg-[url('/images/layout_background_mobile.png')] 
             sm:bg-[url('/images/layout_background_pc.png')]"
          />

          <main className="p-2 relative flex-grow">
            {children}
            <SessionGuard />
          </main>

          <footer className="relative bg-[#7D856C] text-center text-[12px] mt-2 p-2 text-white leading-tight">
            <p>Copyright © 2025 Property and </p>
            <p>Sports Management Office. All Rights Reserved.</p>
            <div className="mt-1 flex items-center justify-center space-x-2">
              <a
                href="https://precheckin.psm.tu.ac.th/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline cursor-pointer"
              >
                Privacy Policy
              </a>
              <span>|</span>
              <a
                href="https://precheckin.psm.tu.ac.th/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline cursor-pointer"
              >
                Terms and Conditions
              </a>
            </div>
            <p className="mt-1">Thammasat University</p>
          </footer>
        </BookingProvider>
        {/* </NextAuthProvider> */}
      </body>
    </html>
  );
}