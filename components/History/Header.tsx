import React from 'react'
import { MdLogout } from 'react-icons/md'

interface HeaderProps {
  handleLogout: () => void;
  isLogout: boolean;
}

const Header = ({ handleLogout, isLogout }: HeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-2 border-b border-gray-100">
      <div>
        <h1 className="text-[24px] font-black text-gray-900 tracking-tight">
          Booking <span className="text-[#006633]">Status</span>
        </h1>
        <p className="text-gray-500 text-[12px] font-medium mt-1">จัดการข้อมูลการจองได้ที่นี่</p>
      </div>
      <button
        onClick={handleLogout}
        disabled={isLogout}
        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        title="ออกจากระบบ"
      >
        <MdLogout size={22} />
      </button>
    </div>
  )
}

export default Header
