// components/ui/LoadingOverlay.tsx
"user client"
import React, { useEffect } from "react";

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay = ({
  message = "กำลังประมวลผล...",
}: LoadingOverlayProps) => {
  useEffect(() => {
    // เก็บค่าเดิมไว้ก่อน
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // คืนค่าเดิมเมื่อ Loading หายไป (Cleanup)
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-[280px] w-full">
        {/* Spinner วงกลมหมุน */}
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute top-0 w-12 h-12 border-4 border-[#91b838] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-700 font-medium text-center">{message}</p>
      </div>
    </div>
  );
};
