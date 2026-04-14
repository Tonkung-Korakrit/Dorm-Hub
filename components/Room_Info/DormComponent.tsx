// components/Room_Info/DormComponent.tsx
"use client";

import { Dorm } from '@/utils/types';
import Image from 'next/image';
import React from 'react'

interface DormComponentProps {
  dorms: Dorm[];
  onSelect: (dorm: Dorm) => void;
  images: Record<string, string>;
  isLoading: boolean;
}

const DormComponent = (props: DormComponentProps) => {
  const { dorms, onSelect, images, isLoading } = props;
  return (
    <div className="space-y-2">
      <div className="md:col-span-2 mt-4 mb-2">
        <span className="font-medium text-black">Preferred Dorm / เลือกหอพักโซน </span>
        <span className="text-red-500">*</span>
      </div>

      {dorms.map((dorm) => (
        <div
          key={dorm.id}
          className="bg-white pt-4 pr-4 pl-4 pb-2 md:p-8 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.08)]  hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-gray-50"
          onClick={() => onSelect(dorm)}
        >
          {/* Container ของรูปภาพ */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] shadow-inner">
            <Image
              src={images[dorm.name[0]] || "/images/zones/default.png"}
              alt={`${dorm.name || "Dorm ..."}`}
              // width={50}
              // height={50}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
            />
          </div>

          <div className="mt-2 flex justify-between items-center px-2">
            <div className="font-bold text-gray-800 text-[16px] md:text-2xl">
              {`${dorm.name || "Dorm ..."}`}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation(); // กันไม่ให้มันไปลั่นโดน Event เลือกหอพักของตัวแม่
                if (dorm.mapUrl) {
                  window.open(dorm.mapUrl, "_blank");
                } else {
                  const fallbackUrl = `https://www.google.com/maps`;
                  window.open(fallbackUrl, "_blank");
                }
              }}
              className="bg-[#FF0000] text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-md hover:bg-red-700 hover:shadow-lg transition-all flex items-center gap-2 uppercase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" clipRule="evenodd" />
              </svg>
              Location / ที่ตั้ง
            </button>
          </div>
        </div>
      ))}

      {(dorms.length === 0 && !isLoading) && (
        <p className="text-center text-gray-400 py-10">ไม่พบหอพักในวิทยาเขตนี้</p>
      )}
    </div>
  )
}

export default DormComponent
