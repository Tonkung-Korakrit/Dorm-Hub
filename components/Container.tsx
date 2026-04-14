// components/Container.tsx
"use client";

import React, { useRef } from 'react'
import { useBooking } from '@/app/contexts/BookingContext'
import Button from './Personal_Info/Button'

// import { MdInfoOutline } from 'react-icons/md'

interface ContainerProps {
  title: string
  rejected?: boolean
  children: React.ReactNode
  href?: string
  handleNextStep?: () => void
  handleBackStep?: () => void
  handleNextSummary?: () => void
  isEditMode?: boolean
  isEmptyPage?: boolean
}

const Container = (props: ContainerProps) => {
  const { title, rejected, children, href,
    handleNextStep, handleBackStep, handleNextSummary, isEditMode, isEmptyPage } = props
  const { currentBooking } = useBooking();
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      className={`max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md 
      border border-gray-200 overflow-y-auto custom-scrollbar max-h-[83vh]
      ${isEmptyPage ? 'text-center items-center' : ''}`}>
      {/* alert REJECTED */}
      {rejected && (
        <>
          {/* <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
            <p className="text-amber-800 font-bold text-sm uppercase flex items-center gap-2">
              <MdInfoOutline size={18} /> Feedback from Staff:
            </p>
            <p className="text-amber-900 text-sm mt-1 font-thai">"{currentBooking.remark}"</p>
          </div> */}
          {/* <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600">
              <MdInfoOutline size={24} />
            </div>
            <div className='leading-tight'>
              <p className="text-amber-900 font-bold text-sm uppercase flex items-center gap-2">
                Feedback from Staff:
              </p>
              <p className="text-amber-900 text-[16px] font-thai">"{currentBooking.remark}"</p>
              <p className="text-amber-800 font-bold text-[14px]">Revised according to the officer's remarks</p>
              {/* <p className="text-amber-800 font-bold text-[14px]">แก้ไขข้อมูลตามคำแนะนำของเจ้าหน้าที่</p>
              <p className="text-amber-700 text-[12px]">Once the edits are complete, please click "Submit" for re-verification.</p>
              {/* <p className="text-amber-700 text-[12px]">หากแก้ไขเสร็จแล้ว กรุณากดส่งเพื่อทำการตรวจสอบอีกครั้ง</p>
            </div>
          </div> */}
        </>
      )}

      {/* ProfileStep */}
      {/* <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
       {currentBooking?.status === BookingStatus.REJECTED && ( 
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
           <p className="text-amber-800 font-bold text-sm flex items-center gap-2 uppercase">
             <MdInfoOutline size={18} /> Staff Feedback:
           </p>
           <p className="text-amber-900 text-sm mt-1">"{currentBooking.remark}"</p>
         </div>
       )}
      */}

      <div className={`grid grid-cols-1`}>
        <h1 className={`text-[24px] font-black text-gray-700`}>
          {title}
        </h1>
        <div>
          {children}
        </div>
      </div>
      {(href || handleNextStep || handleBackStep) && (
        <Button href={href} handleNextStep={handleNextStep} handleBackStep={handleBackStep} handleNextSummary={handleNextSummary} isEditMode={isEditMode} />
      )}
    </div>
  )
}

export default Container
