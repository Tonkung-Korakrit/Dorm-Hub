// components/Steper.tsx
import React from 'react'

import { FaCar, FaUser } from 'react-icons/fa';
import { HiIdentification } from 'react-icons/hi';
import { HiDocumentMagnifyingGlass } from 'react-icons/hi2';
import { RiHomeSmileFill } from 'react-icons/ri';

interface StepperProps {
  step: number;
  setStep: (s: number) => void;
  editId: number;
}

const Stepper = ({ step, setStep, editId }: StepperProps) => {
  return (
    <div className={`flex-none w-full relative pb-2 ${editId ? "pt-2" : "pt-12"}`} >

      {/* --- เส้นพื้นหลัง (Background Line) --- */}
      < div className={`absolute left-0 w-[87.5%] sm:w-[87.5%] md:w-[85%] xl:w-[77.5%] h-[6px] sm:h-[8px] md:h-[12px] bg-[#8ACCA1] z-0
        ${editId ? "top-[24px] sm:top-[26px] md:top-[32px]" : "top-[64px] sm:top-[64px] md:top-[72px]"}`} />

      {/* --- เส้นความคืบหน้า (Active Progress Line) --- */}
      <div
        className={`absolute left-0 h-[6px] sm:h-[8px] md:h-[12px] bg-[#006432] z-0 transition-all duration-700 ease-in-out 
            ${editId ? "top-[24px] sm:top-[26px] md:top-[32px]" : "top-[64px] sm:top-[64px] md:top-[72px]"} 
            ${step === 1 ? 'w-[15%] sm:w-[15%] md:w-[15%] lg:w-[18%] xl:w-[22%]' : ''}
            ${step === 2 ? 'w-[30%] sm:w-[30%] md:w-[35%]' : ''}
            ${step === 3 ? 'w-[50%] sm:w-[50%] md:w-[50%]' : ''}
            ${step === 4 ? 'w-[70%] sm:w-[70%] md:w-[65%]' : ''}
            ${step === 5 ? 'w-[70%] sm:w-[70%] md:w-[65%]' : ''}
            ${step === 6 ? 'w-[70%] sm:w-[70%] md:w-[65%]' : ''}
            ${step === 7 ? 'w-[90%] sm:w-[90%] md:w-[85%] xl:w-[75%]' : ''}
            ${step === 8 ? 'w-[90%] sm:w-[90%] md:w-[85%] xl:w-[75%]' : ''}
          `}
      />

      {/* 2. Container สำหรับไอคอน - ลบ <Line /> ออกทั้งหมดเพื่อแก้ปัญหา "ขีดประหลาด" */}
      <div className="max-w-4xl mx-auto flex justify-between items-start relative z-10 px-6 md:px-10">
        <StepIcon
          icon={<FaUser size={20} />}
          label="Student"
          active={step >= 1}
          current={step === 1}
          onClick={() => setStep(1)}
        />
        <StepIcon
          icon={<HiIdentification size={26} />}
          label="Profile"
          active={step >= 2}
          current={step === 2}
          onClick={() => setStep(2)}
        />
        <StepIcon
          icon={<FaCar size={24} />}
          label="Vehicle"
          active={step >= 3}
          current={step === 3}
          onClick={() => setStep(3)}
        />
        <StepIcon
          icon={<RiHomeSmileFill size={24} />}
          label="Room"
          active={step >= 4}
          current={step >= 4 && step <= 6}
          // onClick={() => setStep(4)}
          onClick={editId ? undefined : () => setStep(4)}
          editId={editId}
        />
        <StepIcon
          icon={<HiDocumentMagnifyingGlass size={24} />}
          label="Summary"
          active={step >= 7} // กรณีจบขั้นตอนสุดท้าย
          current={step === 7}
        />
      </div>
    </div>
  )
}

const StepIcon = ({ icon, label, active, current, onClick, editId }: { icon: any, label: string, active?: boolean, current?: boolean, onClick?: () => void, editId?: number }) => {
  return (
    <div
      className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300
        ${active ? "cursor-pointer hover:scale-105" : "cursor-default"} 
      `}
      onClick={active ? onClick : undefined} // ให้กดได้เฉพาะ Step ที่ active แล้ว (หรือจะให้กดได้หมดก็ได้)
    >
      {/* วงกลมไอคอน */}
      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative
        ${editId ? "bg-gray-300 text-white shadow-md" : active ? "bg-[#006432] text-white shadow-md" : "bg-[#8ACCA1] text-white"}
        ${current ? "ring-4 ring-white/30" : ""} 
      `}>
        {icon}
      </div>

      {/* ตัวหนังสือด้านล่าง */}
      <span className={`text-[12px] md:text-[14px] font-bold tracking-tight text-white
        ${active ? "opacity-100" : "opacity-60"}`}>
        {label}
      </span>
    </div>
  );
}

export default Stepper
