// components/Room_Info/TypeCharter.tsx
"use client"

import React, { Dispatch, SetStateAction } from 'react'
import Campus from './Campus'
import ButtonRoom from './ButtonRoom';

interface TypeCharterProps {
  handleSelectRegion: (selectedRegion: string) => void;
  setStep: Dispatch<SetStateAction<number>>;
}

const TypeCharter = (props: TypeCharterProps) => {
  const { handleSelectRegion, setStep } = props;
  const handleBackStep = () => {
    setStep(3)
  }
  return (
    <>
      <Campus handleSelectRegion={handleSelectRegion} />
      <ButtonRoom handleBackStep={handleBackStep} />
    </>
  )
}

export default TypeCharter
