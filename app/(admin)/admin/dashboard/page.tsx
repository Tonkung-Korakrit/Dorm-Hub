"use client";

import { useState, useEffect } from "react";
import {
  MdCheck, MdClose, MdVisibility, MdLogout, MdRefresh,
  MdSearch, MdHistory, MdPerson, MdMeetingRoom,
  MdAccountBalanceWallet, MdEventAvailable
} from "react-icons/md";
import { deleteAdminSession } from "../login/actions";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRooms: 0, occupied: 0, pending: 0, totalRevenue: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isActioning, setIsActioning] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resV, resS] = await Promise.all([
        fetch("/api/admin/verify"),
        fetch("/api/admin/stats")
      ]);
      setBookings(await resV.json());
      setStats(await resS.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (booking: any, action: 'confirm' | 'reject') => {
    let remark = "";
    if (action === 'reject') {
      remark = window.prompt("ระบุเหตุผลที่ปฏิเสธ:") || "";
      if (!remark) return;
    }

    setIsActioning(booking.id);
    try {
      const res = await fetch(`/api/admin/bookings/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, remark })
      });
      if (res.ok) {
        setHistory(prev => [{ ...booking, actionStatus: action }, ...prev]);
        setBookings(prev => prev.filter(b => b.id !== booking.id));
      }
    } catch (e) { alert("Error"); }
    finally { setIsActioning(null); }
  };

  const filtered = bookings.filter(b =>
    b.user.name_th.includes(searchQuery) || b.user.studentId.includes(searchQuery)
  );

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      await deleteAdminSession(); // 🚩 สำคัญมาก: ต้องลบ Cookie ฝั่ง Server ก่อน
      window.location.href = "/admin/login"; // แล้วค่อยดีดไปหน้า Login
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 antialiased font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-10">

        {/* --- Header Area --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Dormitory Management</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:w-72">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={20} />
              <input
                type="text"
                placeholder="ค้นหานักศึกษา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                suppressHydrationWarning
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-slate-50 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={fetchData}
              className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"
              suppressHydrationWarning
            >
              <MdRefresh size={24} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleLogout}
              className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-colors"
              suppressHydrationWarning
            >
              <MdLogout size={24} />
            </button>
          </div>
        </header>

        {/* --- Stats Overview --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatBox
            icon={<MdMeetingRoom size={24} />}
            label="Total Rooms"
            value={stats?.totalRooms ?? 0}
            color="blue"
          />
          <StatBox
            icon={<MdPerson size={24} />}
            label="Occupied"
            value={stats?.occupied ?? 0}
            color="indigo"
          />
          <StatBox
            icon={<MdEventAvailable size={24} />}
            label="Pending"
            value={bookings?.length ?? 0}
            color="orange"
          />
          <StatBox
            icon={<MdAccountBalanceWallet size={24} />}
            label="Revenue"
            value={`฿${(stats?.totalRevenue ?? 0).toLocaleString()}`}
            color="emerald" />
        </section>

        {/* --- Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-lg font-bold text-slate-900">Pending Approvals</h2>
              <span className="text-xs font-bold text-slate-400">{filtered.length} รายการ</span>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Placement</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Receipt</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((b) => (
                    <tr key={b.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900 leading-none mb-1">{b.user.name_th}</div>
                        <div className="text-xs text-slate-400">{b.user.studentId}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-700">Room {b.room.roomId}</div>
                        <div className="text-[10px] font-bold text-slate-300 uppercase">{b.type}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <a href={b.paymentProof} target="_blank" className="inline-flex p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                          <MdVisibility size={18} />
                        </a>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAction(b, 'confirm')} disabled={!!isActioning} className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl hover:bg-black transition-all disabled:opacity-30">
                            Approve
                          </button>
                          <button onClick={() => handleAction(b, 'reject')} disabled={!!isActioning} className="px-5 py-2.5 bg-white text-slate-400 border border-slate-100 text-[11px] font-bold rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all disabled:opacity-30">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="p-20 text-center text-slate-300 text-sm font-medium uppercase tracking-widest">No pending tasks</div>}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 px-2">Recent Logs</h2>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[400px]">
              {history.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center opacity-20">
                  <MdHistory size={48} />
                  <p className="text-xs font-bold mt-4 uppercase tracking-tighter">Empty Session</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-slate-800">{item.user.name_th}</span>
                        <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Room {item.room.roomId}</span>
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
    </div>
  );
}

function StatBox({ icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${status === 'confirm' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
      }`}>
      {status === 'confirm' ? 'Approved' : 'Rejected'}
    </span>
  );
}