// components/Room_Info/TypeCharter.tsx
"use client"

import React from 'react'
import ButtonRoom from './ButtonRoom';

interface TypeEmptyProps {
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

const TypeEmpty = ({ setStep }: TypeEmptyProps) => {
  const handleBackStep = () => {
    setStep(3)
  }
  return (
    <>
      <div className="flex flex-col items-center justify-center leading-tight text-gray-400 text-[14px] italic">
        <p>Please select the resident type to proceed</p>
        <p>กรุณาเลือกประเภทผู้พักเพื่อดำเนินการต่อ</p>
      </div>
      <ButtonRoom handleBackStep={handleBackStep} />
    </>
  )
}

export default TypeEmpty
