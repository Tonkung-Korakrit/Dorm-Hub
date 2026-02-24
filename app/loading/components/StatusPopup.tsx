// components/ui/StatusPopup.tsx
import React from 'react';
import { FaRegSmileBeam } from "react-icons/fa";
import { FiFrown } from "react-icons/fi";

interface StatusPopupProps {
  type: "success" | "error";
  title?: string;
  message: string;
  onClose: () => void;
}

export const StatusPopup = ({ type, title, message, onClose }: StatusPopupProps) => {
  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in zoom-in duration-300">
      <div className="bg-white rounded-3xl p-8 w-full max-w-[340px] shadow-2xl text-center">
        {/* Icon Area */}
        <div className={`mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
          {isSuccess ? (
            // <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            // </svg>
            <div className="w-10 h-10 text-green-500">
              <FaRegSmileBeam size={40}/>
            </div>
          ) : (
            // <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            //   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
            // </svg>
            <div className="w-10 h-10 text-red-500">
              <FiFrown size={40}/>
            </div>
          )}
        </div>

        <h3 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {title || (isSuccess ? "สำเร็จ" : "เกิดข้อผิดพลาด")}
        </h3>

        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
          {message}
        </p>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${isSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            }`}
        >
          {isSuccess ? "ตกลง" : "ลองอีกครั้ง"}
        </button>
      </div>
    </div>
  );
};