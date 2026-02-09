"use client";

import { useState, useEffect } from "react";
import {
  MdMeetingRoom, MdLogout, MdPerson, MdFingerprint,
  MdSchool, MdInfoOutline, MdCircle, MdClose
} from "react-icons/md";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch("/api/bookings/my-booking");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setBooking(data);
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [router]);

  console.log(booking)

  const handleLogout = async () => {
    if (!confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ redirect: false });
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleCancelBooking = async () => {
    const confirmCancel = confirm("ยืนยันการยกเลิกการจอง? \n*หมายเหตุ: คุณจะไม่ได้รับเงินมัดจำคืนตามเงื่อนไขที่มหาวิทยาลัยกำหนด*");
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id })
      });

      if (res.ok) {
        alert("ยกเลิกการจองเรียบร้อยแล้ว");
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาดในการยกเลิก");
      }
    } catch (err) {
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500 text-white border-blue-100";
      case "VERIFYING":
        return "bg-blue-500 text-white border-purple-100";
      case "COMPLETED":
        return "bg-emerald-500 text-white border-emerald-100";
      case "REJECTED":
        return "bg-red-500 text-white border-red-100";
      case "EXPIRED":
        return "bg-slate-500 text-white border-orange-100";
      default: // CANCELLED หรืออื่นๆ
        return "bg-slate-500 text-white border-slate-100";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-yellow-200";
      case "VERIFYING": return "text-blue-200";
      case "COMPLETED": return "text-emerald-200";
      case "REJECTED": return "text-red-200";
      case "EXPIRED": return "text-orange-200";
      default: return "text-slate-200";
    }
  };

  if (loading) return <DashboardSkeleton />;

  // --- Main Wrapper ---
  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-4 md:p-10 rounded-2xl shadow-md border border-gray-200 animate-in fade-in duration-700">

        {/* Header Section */}
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
          <div>
            <h1 className="text-[24px] font-black text-gray-900 tracking-tight">Booking <span className="text-[#006633]">Status</span></h1>
            <p className="text-gray-400 text-xs font-medium mt-1">ตรวจสอบและจัดการข้อมูลการจองห้องพัก</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="ออกจากระบบ"
          >
            <MdLogout size={22} />
          </button>
        </div>

        {error ? (
          <div className="py-10 text-center">
            <MdInfoOutline size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-[#006633] font-bold text-sm underline">ลองใหม่อีกครั้ง</button>
          </div>
        ) : !booking || !booking.id ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdMeetingRoom size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบข้อมูลการจอง</h2>
            <p className="text-gray-400 mb-8 text-sm">คุณยังไม่มีรายการจองห้องพักในภาคเรียนนี้</p>
            <button onClick={() => router.push('/book')} className="bg-[#006633] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-100 hover:bg-[#004d26] transition-all">จองห้องพักตอนนี้</button>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Room Info Card */}
            <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <div className={`px-6 py-3 flex justify-between items-center text-[10px] font-black uppercase tracking-widest border-b ${getStatusStyles(booking.status)}`}>
                <div className="flex items-center gap-2">
                  <MdCircle
                    size={8}
                    className={`${getStatusDotColor(booking.status)} ${["PENDING", "VERIFYING"].includes(booking.status) ? "animate-pulse" : ""
                      }`}
                  />
                  {booking.status}
                </div>
                <span className="text-white">#{booking.id}</span>
              </div>

              <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                {/* ไอคอนห้องพักที่ดูมีมิติขึ้น */}
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-[#006633] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 shrink-0">
                  <MdMeetingRoom size={48} />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-6xl font-black text-gray-900 tracking-tighter mb-3 leading-none">{booking.room.roomId}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <Tag label={`Floor ${booking.room.floor}`} />
                    <Tag label={booking.room.zone} />
                    <Tag label={booking.room.campus} isGreen />
                    <Tag label={booking.room.type} />
                  </div>
                </div>
              </div>
            </div>

            {/* Resident & Lifestyle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                  <MdPerson className="text-[#006633]" /> Resident Profile
                </h4>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-3">
                  <InfoRow label="ID" value={booking.studentId} />
                  <InfoRow label="Name" value={booking.name} />
                  <InfoRow label="Type" value={booking.type} />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                  <MdCircle className="text-[#006633]" size={10} /> Roommate Preference
                </h4>
                <div className="flex flex-wrap gap-2">
                  {booking.room.lifestyleConfig?.length > 0 ? (
                    booking.room.lifestyleConfig.map((v: string) => (
                      <span key={v} className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-bold border border-gray-100">#{v}</span>
                    ))
                  ) : (
                    <p className="text-gray-300 text-[10px] italic">ไม่มีข้อมูล</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cancel Action */}
            {booking.status === "PENDING" && (
              <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] text-gray-400 font-medium text-center md:text-left">ต้องการสละสิทธิ์การจอง? <br />ระบบจะคืนห้องพักให้ผู้ใช้รายอื่นทันที</p>
                <button
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="flex items-center gap-2 px-6 py-2.5 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-red-100 disabled:opacity-50"
                >
                  <MdClose size={18} />
                  {isCancelling ? "กำลังยกเลิก..." : "ยกเลิกการจองนี้"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">Thammasat University Dormitory Management</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-bold text-gray-700">{value || "-"}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-md border border-gray-200 animate-pulse">
        <div className="h-10 w-40 bg-gray-100 rounded-xl mb-10"></div>
        <div className="h-64 bg-gray-50 rounded-2xl mb-8"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-32 bg-gray-50 rounded-2xl"></div>
          <div className="h-32 bg-gray-50 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}

function Tag({ label, isGreen = false }: { label: string, isGreen?: boolean }) {
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${isGreen
      ? "bg-[#006633] text-white border-[#006633]"
      : "bg-white text-gray-500 border-gray-200"
      }`}>
      {label}
    </span>
  );
}