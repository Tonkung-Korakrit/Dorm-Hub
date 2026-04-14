import React from 'react'
import Verify from './Verify';

// รับค่าทุกอย่างที่ <select> ปกติรับได้ (เช่น value, onChange, name, disabled) โดยที่เราไม่ต้องเขียนประกาศใหม่เองทั้งหมด
interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: boolean;
  children: React.ReactNode; // option ต่างๆ 
}

const FormSelect = ({ label, error, children, className, required, ...props }: Props) => (
  <div className="w-full">
    <label className="block text-[16px] font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      {...props}
      suppressHydrationWarning
      className={`w-full border rounded-lg px-3 py-2 mb-2 focus:outline-none transition-all text-white bg-[#006633]
        ${error ? "border-red-500 border-2" : "border-gray-300 focus:ring-2 focus:ring-[#006633]"} ${className}`}
    >
      {children}
    </select>
    {(error) && <Verify name={props.name} />}
  </div>
);

export default FormSelect
