// app/(admin)/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { deleteAdminSession } from "../login/actions";

// icons
import {
  MdCheck, MdClose, MdVisibility, MdLogout, MdRefresh,
  MdSearch, MdHistory, MdPerson, MdMeetingRoom,
  MdAccountBalanceWallet, MdEventAvailable, MdEditNote
} from "react-icons/md";
import BookingDetailModal from "./modal/BookingDetailModal";
import { BookingStatus } from "@prisma/client";

// --- Types ---
type ActionType = 'confirm' | 'reject' | 'request-edit';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRooms: 0, occupied: 0, pending: 0, totalRevenue: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isActioning, setIsActioning] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const [metadata, setMetadata] = useState({ total: 0, page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resV, resS, resH] = await Promise.all([
        // fetch(`/api/admin/bookings?page=${currentPage}`),
        fetch(`/api/admin/verify?page=${currentPage}`),
        fetch("/api/admin/stats"),
        fetch("/api/admin/history")
      ]);

      const vData = await resV.json();
      const sData = await resS.json();
      const hData = await resH.json();

      // รองรับการส่งกลับแบบ { data, metadata }
      setBookings(vData.data || []);
      setMetadata(vData.metadata);
      setStats(sData);

      const formattedHistory = hData.map((log: any) => ({
        id: log.bookingId,
        cus_users: { name_th: log.booking.cus_users.name_th },
        room: { roomId: log.booking.room.roomId },
        actionStatus: mapStatusToAction(log.status), // ฟังก์ชันช่วยแปลงชื่อสถานะ
        actionTime: log.createdAt
      }));
      setHistory(formattedHistory);
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // useEffect(() => { fetchData(); }, []);

  // ฟังก์ชันช่วยแปลง Status จาก DB มาเป็น Label ของเรา
  const mapStatusToAction = (status: string): ActionType => {
    if (status === BookingStatus.COMPLETED) return 'confirm';
    if (status === BookingStatus.REJECTED) return 'reject';
    return 'request-edit';
  };

  const handleAction = async (booking: any, action: ActionType) => {
    let remark = "";

    // ถ้าไม่ใช่การกด Confirm (เช่น Reject หรือ Request Edit) ต้องถามเหตุผล
    if (action !== 'confirm') {
      const promptTitle = action === 'reject' ? "ระบุเหตุผลที่ปฏิเสธ (ยกเลิกรายการ):" : "ระบุสิ่งที่ต้องแก้ไข (ส่งกลับให้ User):";
      remark = window.prompt(promptTitle) || "";
      if (!remark) return;
    }

    setIsActioning(booking.id);
    try {
      // ปรับ API Path ให้ตรงตาม Logic (confirm / reject / request-edit)
      const res = await fetch(`/api/admin/bookings/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, remark })
      });

      if (res.ok) {
        setHistory(prev => [{ ...booking, actionStatus: action, actionTime: new Date() }, ...prev]);
        setBookings(prev => prev.filter(b => b.id !== booking.id));

        // ไม่ต้อง setHistory แบบ manual แล้วก็ได้ 
        // หรือจะใช้แบบเดิมเพื่อให้ UI อัปเดตทันที (Optimistic Update)
        fetchData(); // หรือสั่งโหลดข้อมูลใหม่ทั้งหมดเพื่อให้ Sync กับ DB
      } else {
        const err = await res.json();
        alert(err.message || "เกิดข้อผิดพลาด");
      }

      // console.log("DEBUG PAYLOAD:", JSON.stringify({ bookingId: booking.id, remark }));
    
    } catch (e) {
      alert("Network Error");
    } finally {
      setIsActioning(null);
    }
  };

  const filtered = bookings.filter(b => {
    const query = searchQuery.toLowerCase();
    return (
      b.cus_users?.name_th?.toLowerCase().includes(query) ||
      b.cus_users?.studentId?.toLowerCase().includes(query) ||
      b.room?.roomId?.toString().includes(query)
    );
  });

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      await deleteAdminSession();
      window.location.href = "/admin/login";
    }
  };

  const openBookingDetail = (booking: any) => {
    setSelectedBooking(booking);
  };

  const closeBookingDetail = () => {
    setSelectedBooking(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 antialiased font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-10">

        {/* --- Header --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 italic">Dorm<span className="text-[#126A31]">Hub</span> Admin</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Dormitory Management System</p>
          </div>
          
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push('/admin/checkin')}
              className="inline-flex items-center gap-2 p-4 bg-[#126A31] text-white font-bold rounded-xl hover:bg-[#093218] transition-all shadow-md shadow-green-100"
              title="Manage check-in/check-out"
            >
              <MdCheck size={20} />
              จัดการย้ายเข้า/ออก
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-80">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#126A31] transition-colors" size={20} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสนักศึกษา หรือเลขห้อง..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-green-50 transition-all shadow-sm"
              />
            </div>
            <button onClick={fetchData} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400">
              <MdRefresh size={24} className={loading ? "animate-spin text-[#126A31]" : ""} />
            </button>
            <button onClick={handleLogout} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-colors">
              <MdLogout size={24} />
            </button>
          </div>
        </header>

        {/* --- Stats --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatBox icon={<MdMeetingRoom size={24} />} label="Total Rooms" value={stats?.totalRooms} color="blue" />
          <StatBox icon={<MdPerson size={24} />} label="Occupied" value={stats?.occupied} color="indigo" />
          <StatBox icon={<MdEventAvailable size={24} />} label="Pending" value={bookings?.length} color="orange" />
          <StatBox icon={<MdAccountBalanceWallet size={24} />} label="Revenue" value={`฿${(stats?.totalRevenue || 0).toLocaleString()}`} color="emerald" />
        </section>

        {/* --- Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Table */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-2 flex items-center gap-2">
              Pending Approvals <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </h2>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/30">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Detail</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((b) => (
                    <tr key={b.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900 leading-none mb-1">{b.cus_users?.name_th}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{b.cus_users?.studentId}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-700"># {b.room?.roomId}</div>
                        <div className="text-[9px] font-black text-slate-300 uppercase">{b.type}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          type="button"
                          onClick={() => openBookingDetail(b)}
                          className="inline-flex p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90 shadow-sm"
                          title="View booking details"
                        >
                          <MdVisibility size={18} />
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          {/* ปุ่ม Approve */}
                          <button
                            onClick={() => handleAction(b, 'confirm')}
                            disabled={!!isActioning}
                            className="p-2.5 bg-[#126A31] text-white rounded-xl hover:bg-[#093218] transition-all disabled:opacity-30 shadow-md shadow-green-100"
                            title="Approve"
                          >
                            <MdCheck size={20} />
                          </button>

                          {/* ปุ่ม Request Edit (ใหม่) */}
                          <button
                            onClick={() => handleAction(b, 'request-edit')}
                            disabled={!!isActioning}
                            className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all disabled:opacity-30 shadow-md shadow-amber-100"
                            title="Request Changes"
                          >
                            <MdEditNote size={20} />
                          </button>

                          {/* ปุ่ม Reject */}
                          <button
                            onClick={() => handleAction(b, 'reject')}
                            disabled={!!isActioning}
                            className="p-2.5 bg-white text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-all disabled:opacity-30"
                            title="Reject"
                          >
                            <MdClose size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {metadata.totalPages > 1 && (
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Page {metadata.page} of {metadata.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                      className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#126A31] disabled:opacity-30 transition-all"
                    >
                      <MdSearch className="rotate-180" size={18} /> {/* ใช้ไอคอนลูกศรแทนได้ */}
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(metadata.totalPages, prev + 1))}
                      disabled={currentPage === metadata.totalPages || loading}
                      className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#126A31] disabled:opacity-30 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-slate-300">
                  <MdEventAvailable size={48} className="opacity-20 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Everything is clear!</p>
                </div>
              )}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 px-2">Session History</h2>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[500px]">
              {history.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center opacity-20">
                  <MdHistory size={48} />
                  <p className="text-[10px] font-black mt-4 uppercase tracking-widest">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50 animate-in fade-in slide-in-from-right-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-slate-800">{item.cus_users.name_th}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Room {item.room.roomId}</span>
                      </div>
                      <StatusBadge status={item.actionStatus} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={closeBookingDetail}
      />
    </div>
  );
}

// --- Sub Components ---

function StatBox({ icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-100 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.04)] transition-all group cursor-default">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value ?? 0}</h3>
    </div>
  );
}

function StatusBadge({ status }: { status: ActionType }) {
  const styles: any = {
    confirm: "bg-emerald-50 text-emerald-600 border-emerald-100",
    reject: "bg-red-50 text-red-600 border-red-100",
    'request-edit': "bg-amber-50 text-amber-600 border-amber-100",
  };
  const labels: any = {
    confirm: "Approved",
    reject: "Rejected",
    'request-edit': "Edit Req.",
  };
  return (
    <span className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
