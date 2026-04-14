
// components/HomeButton.tsx
'use client';

import React from 'react'
import { useRouter } from 'next/navigation';

interface HomeButtonProps {
  isSuccess: boolean
}

const HomeButton = ({ isSuccess }: HomeButtonProps) => {
  const router = useRouter();
  const handleButton = () => {
    router.push('/my-booking')
    router.refresh() // Refresh ข้อมูลในหน้านั้น
  }

  return (
    <div className="flex-1 w-full">
      {isSuccess ? (
        <button
          // href="/my-booking"
          onClick={handleButton}

          className="w-full flex items-center justify-center gap-2 py-4 bg-[#126A31] text-white rounded-2xl font-bold hover:opacity-[80%] shadow-lg shadow-green-100 transition-all"
        >
          Return to homepage
        </button>
      ) : (
        <button
          onClick={handleButton}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-500 text-white rounded-2xl font-bold hover:opacity-[80%] shadow-lg shadow-red-100 transition-all"
        >
          Return to homepage
        </button>
      )}
    </div>
  )
}

export default HomeButton
