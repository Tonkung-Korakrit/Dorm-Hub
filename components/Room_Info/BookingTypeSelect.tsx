// components/Room_Info/BookingTypeSelect.tsx
"use client";

import React from 'react'
import { useBooking } from '@/app/contexts/BookingContext';
import { DORM_LABELS } from '@/utils/constants'
import { BookingType, Resident } from "@/utils/types";

import FormSelect from '../Personal_Info/Select'
import TypeEmpty from './TypeEmpty';
import TypeCoResident from './TypeCoResident';
import TypeNotCharter from './TypeNotCharter';
import TypeCharter from './TypeCharter';

interface BookingTypeSelectProps {
  errors: string[];
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
  ownerStudentId: string;
  setOwnerId: (id: string) => void;
  noteError: string;

  handleTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleVerifyOwner: () => void;
  handleSelectRegion: (selectedRegion: string) => void;
  handleLifestyle: (id: string) => void;
  handleNoteChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

const BookingTypeSelect = (props: BookingTypeSelectProps) => {
  const { errors, setErrors, ownerStudentId, setOwnerId, noteError,
    handleTypeChange, handleVerifyOwner, handleSelectRegion,
    handleLifestyle, handleNoteChange, setStep, } = props;
  const { currentBooking } = useBooking();
  const TYPE_COMPONENTS = {
    [BookingType.CO_RESIDENT]: TypeCoResident,
    [BookingType.NOT_CHARTER]: TypeNotCharter,
    [BookingType.CHARTER]: TypeCharter,
  };

  const SelectedComponent = currentBooking.type ? TYPE_COMPONENTS[currentBooking.type] : TypeEmpty;

  return (
    <div className="space-y-4">
      {/* ปุ่มดูรายละเอียดหอ */}
      <div className="flex my-4 justify-center">
        <a
          href="https://psm.tu.ac.th/our-services/dormitory/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-2 text-white text-[16px] font-medium bg-red-500 rounded-lg shadow-md hover:bg-red-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          Dormitory details / รายละเอียดหอพัก
        </a>
      </div>

      <FormSelect
        label="Type of resident / ประเภทผู้พัก"
        error={errors.includes("bookingType")}

        value={currentBooking?.type || ""}
        name="bookingType"
        onChange={handleTypeChange}
        className=""
        required={true}
      >
        <option value="" disabled hidden>-- เลือกประเภทผู้พัก / Select resident type --</option>
        {Object.values(BookingType).map((type) => (
          <option key={type} value={type}>
            {DORM_LABELS.RESIDENT_TYPE[type as keyof typeof DORM_LABELS.RESIDENT_TYPE] || type}
          </option>
        ))}
      </FormSelect>
      {/* icon ลูกศรชี้ลง */}
      {/* <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div> */}

      {/* Booking Detail - รายละเอียดประเภทการจอง */}
      {currentBooking?.type && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
          <div className="flex gap-2">
            <div className="mt-0.5">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-500 mb-1">รายละเอียดประเภทการจอง:</p>
              <p className="text-[12px] text-gray-600 leading-relaxed">
                {DORM_LABELS.RESIDENT_TYPE_DESC[currentBooking.type as keyof typeof DORM_LABELS.RESIDENT_TYPE_DESC]}
              </p>
            </div>
          </div>
        </div>
      )}

      <SelectedComponent {...props} />

      {/* {currentBooking?.type === "CO_RESIDENT" && (
        // 2. ถ้าเป็น CO_RESIDENT แสดงปุ่มข้ามไป Step 7
        <TypeCoResident errors={errors} setErrors={setErrors} setStep={setStep} ownerStudentId={ownerStudentId} handleVerifyOwner={handleVerifyOwner} setOwnerId={setOwnerId} />
      )}

      {currentBooking.type === "NOT_CHARTER" && (
        // 3. ถ้าเป็น NOT_CHARTER แสดง 
        <TypeNotCharter
          handleLifestyle={handleLifestyle}
          handleNoteChange={handleNoteChange}
          noteError={noteError}
          handleSelectRegion={handleSelectRegion}
          setStep={setStep} />
      )}

      {currentBooking.type === "CHARTER" && (
        // 3. ถ้าเป็น NOT_CHARTER แสดง 
        <TypeCharter handleSelectRegion={handleSelectRegion} setStep={setStep} />
      )} */}

    </div>
  )
}

export default BookingTypeSelect
