// app/login/page.tsx
// "use server"

import React, { Suspense } from 'react';
import Image from "next/image";
import { LoginSkeleton } from '@/components/Loading/login/LoginSkeleton';
import LoginContent from './LoginContent';

export const metadata = {
  title: "Login | DormHub",
  description: "เข้าสู่ระบบจองหอพักมหาวิทยาลัยธรรมศาสตร์",
}

const LoginPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[80vh] relative pt-[44px] sm:pt-[12px]">
      <div className="relative w-full max-w-[400px] aspect-[6/10]">
        <div className="absolute left-[8px] w-full h-full">
          <Image 
            src="/images/login_card_pc.png"
            alt="Card Login"
            fill
            sizes="366px"
            priority
          />
        </div>
        <Suspense fallback={<LoginSkeleton/>}>
          <LoginContent />
        </Suspense> 
      </div>
    </div>
  )
}

export default LoginPage