// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { MdMeetingRoom, MdLogout } from "react-icons/md";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch("/api/bookings/my");
        if (res.status === 401) {
          setError("กรุณาเข้าสู่ระบบใหม่");
          return;
        }
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, []);

  // ✅ ฟังก์ชัน Logout แบบรวมศูนย์
  const handleLogout = async () => {
    const confirmLogout = confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
    if (!confirmLogout) return;

    try {
      // 1. ลบ Custom JWT Token (TU API)
      await fetch("/api/auth/logout", { method: "POST" });
      // 2. ออกจากระบบ NextAuth (Google)
      await signOut({ redirect: false });
      
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!booking || !booking.id) return <div className="p-10 text-center">ยังไม่มีข้อมูลการจอง</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      {/* Header Section พร้อมปุ่ม Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 font-bold text-sm shadow-sm"
        >
          <MdLogout size={18} />
          Logout
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        {/* ส่วนสถานะและรายละเอียดที่เหลือคงเดิม */}
        <div className={`p-6 text-white flex justify-between items-center ${
          booking.status === "CONFIRMED" ? "bg-[#006432]" : "bg-orange-500"
        }`}>
          <div>
            <p className="text-[10px] uppercase font-black opacity-80">Booking Status</p>
            <h2 className="text-2xl font-bold">{booking.status}</h2>
          </div>
          <span className="bg-white/20 px-4 py-1 rounded-full text-xs font-mono">
            REF: {booking.id}
          </span>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h3 className="text-gray-400 text-xs font-bold uppercase mb-4">Resident Information</h3>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-5 rounded-3xl text-[#006432]">
                  <MdMeetingRoom size={40} />
                </div>
                <div>
                  <p className="text-4xl font-black text-[#006432]">{booking.room.roomId}</p>
                  <p className="text-gray-500">{booking.room.zone} | {booking.room.campus}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase mb-3">Roommate Vibe</p>
              <div className="flex flex-wrap gap-2">
                {booking.room.lifestyleConfig.map((v: string) => (
                  <span key={v} className="px-3 py-1 bg-white border rounded-full text-xs font-bold text-gray-600">
                    #{v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}