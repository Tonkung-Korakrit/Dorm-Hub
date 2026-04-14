import React from 'react'
import DatePicker from "./DatePickerWrapper";
import { th } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Verify from './Verify';

interface BirthDateInputProps {
  value: string | Date | null;
  onChange: (date: Date | null) => void;
  error?: boolean;
  onBlur?: () => void;
}

const BirthDateInput = ({ value, onChange, error, onBlur }: BirthDateInputProps) => {
   // คำนวณวันที่ถอยหลังจากวันนี้ไป 18 ปี
  const today = new Date();
  const maxAllowedDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  return (
    <div className="col-span-2 md:col-span-1">
      <label className="block text-[16px] font-medium text-gray-700 mb-1">
        Birth Date / วันเกิด <span className="text-red-500">*</span>
      </label>
      <div className="relative mb-2">
        <DatePicker
          selected={value ? new Date(value) : null}
          onChange={onChange}
          onBlur={onBlur}
          dateFormat="dd/MM/yyyy"
          locale={th}
          placeholderText="วัน/เดือน/ปี"
          className={`w-[286px] sm:w-[536px] md:w-[266px] lg:w-[698px] border border-gray-300 rounded-lg px-3 py-2 
            focus:outline-none focus:ring-2 focus:ring-[#006633] text-black bg-white
            transition-color placeholder:text-gray-400 ${error ? "border-red-500 border-2" : ""}`}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          maxDate={maxAllowedDate}
          yearDropdownItemNumber={30}
          scrollableYearDropdown
          required
        />
        {error && <Verify name={"birthDate"} />}
      </div>
    </div>
  );
}

export default BirthDateInput
