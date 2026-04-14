import React from 'react'

// รับค่าทุกอย่างที่ <checkbox> ปกติรับได้ (เช่น value, onChange, name, disabled) โดยที่เราไม่ต้องเขียนประกาศใหม่เองทั้งหมด
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description: string;
}

const FormCheckbox = ({ label, description, className, ...props }: Props) => (
  <div className="flex flex-col gap-1">
    <label className="block text-[16px] font-medium text-gray-700 mb-1">{label}</label>
    <label className="flex items-center gap-3 p-2 mb-2 cursor-pointer group">
      <input
        {...props}
        type="checkbox"
        suppressHydrationWarning
        className={`w-5 h-5 accent-[#006633] cursor-pointer ${className}`}
      />
      <span className="text-[12px] font-bold text-gray-800">{description}</span>
    </label>
  </div>
);

export default FormCheckbox
