"use client";

import { useEffect } from "react";
import { MdClose, MdHistory, MdLogout, MdSearch } from "react-icons/md";

type CheckinAction = "CHECKIN" | "CHECKOUT";

export type CheckinHistoryItem = {
  id: number;
  type: CheckinAction;
  createdAt: string;
  booking: {
    id: number;
    type: string;
    cus_users: {
      name_th: string | null;
      studentId: string | null;
    };
    room: {
      roomId: string;
      dorm: {
        name: string;
      };
    };
  };
  staff: {
    id: number;
    name: string | null;
    email: string;
  };
};

type Metadata = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type CheckinHistoryModalProps = {
  isOpen: boolean;
  items: CheckinHistoryItem[];
  metadata: Metadata;
  loading: boolean;
  error: string;
  query: string;
  onQueryChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onClose: () => void;
};

const formatDateTime = (dateValue?: string) => {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function CheckinHistoryModal({
  isOpen,
  items,
  metadata,
  loading,
  error,
  query,
  onQueryChange,
  onPageChange,
  onRefresh,
  onClose,
}: CheckinHistoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-history-modal-title"
        className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-[#126A31] flex items-center justify-center">
              <MdHistory size={20} />
            </div>
            <div>
              <h2 id="checkin-history-modal-title" className="text-lg font-bold text-slate-900">
                ประวัติการย้ายเข้า/ย้ายออก
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">ทั้งหมด {metadata.total} รายการ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close check-in history"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="px-6 py-4 sm:px-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1 group">
              <MdSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#126A31] transition-colors"
                size={20}
              />
              <input
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="ค้นหาชื่อ, รหัสนักศึกษา, ห้อง, ชื่อแอดมิน..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm outline-none focus:ring-4 focus:ring-green-50 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#126A31] text-white rounded-xl text-xs font-black tracking-wider hover:bg-[#093218] transition-all"
            >
              รีเฟรช
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white sticky top-0">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date/Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{formatDateTime(item.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        item.type === "CHECKIN"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.type === "CHECKIN" ? <MdHistory size={12} /> : <MdLogout size={12} />}
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm">{item.booking.cus_users?.name_th || "-"}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {item.booking.cus_users?.studentId || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    #{item.booking.room?.roomId || "-"}
                    <div className="text-[10px] font-semibold text-slate-400">{item.booking.room?.dorm?.name || "-"}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    #{item.booking.id} ({item.booking.type})
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {item.staff?.name || "-"}
                    <div className="text-[10px] text-slate-400">{item.staff?.email || "-"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && !error && items.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <MdHistory size={44} className="mx-auto opacity-30 mb-3" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">No history found</p>
            </div>
          )}

          {loading && (
            <div className="py-20 text-center text-slate-400 text-sm font-semibold">กำลังโหลดประวัติ...</div>
          )}

          {error && !loading && (
            <div className="mx-6 my-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 sm:px-8 border-t border-slate-100 bg-white flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Page {metadata.page} / {metadata.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(metadata.page - 1)}
              disabled={metadata.page <= 1 || loading}
              className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:text-[#126A31] disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(metadata.page + 1)}
              disabled={metadata.page >= metadata.totalPages || loading}
              className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:text-[#126A31] disabled:opacity-40 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
