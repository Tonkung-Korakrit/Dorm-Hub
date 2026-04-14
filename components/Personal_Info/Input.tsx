import React from 'react'
import Verify from './Verify';

// รับค่าทุกอย่างที่ <input> ปกติรับได้ (เช่น value, onChange, name, disabled) โดยที่เราไม่ต้องเขียนประกาศใหม่เองทั้งหมด
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  validateMessage?: string;
}

const FormInput = ({ label, error, validateMessage, className, required, ...props }: Props) => (
  <div className="w-full">
    <label className="block text-[16px] font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      suppressHydrationWarning
      className={`w-full border rounded-lg px-3 py-2 mb-2 focus:outline-none transition-all placeholder:text-gray-400 text-black
        ${error ? "border-red-500 border-2" : "border-gray-300 focus:ring-2 focus:ring-[#006633]"} 
        ${props.disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"} ${className}
        `}
    /> {/* ${validateMessage ? "mb-2" : ""} */}
    {(error || validateMessage) && <Verify name={props.name} validateMessage={validateMessage} />}
  </div>
);

export default FormInput
