// components/Room_Info/TypeNotCharter.tsx
"use client";

import React from 'react'
import Campus from './Campus'
import VibeRoommate from './VibeRoommate'
import ButtonRoom from './ButtonRoom';

interface TypeNotCharterProps {
  noteError: string;
  handleLifestyle: (id: string) => void;
  handleNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSelectRegion: (selectedRegion: string) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

const TypeNotCharter = (props: TypeNotCharterProps) => {
  const { noteError, handleLifestyle, handleNoteChange , handleSelectRegion, setStep } = props;
  const handleBackStep = () => {
    setStep(3)
  }

  return (
    <>
      <VibeRoommate handleLifestyle={handleLifestyle} handleNoteChange={handleNoteChange} noteError={noteError} />
      <Campus handleSelectRegion={handleSelectRegion} />
      <ButtonRoom handleBackStep={handleBackStep} />
    </>
  )
}

export default TypeNotCharter
