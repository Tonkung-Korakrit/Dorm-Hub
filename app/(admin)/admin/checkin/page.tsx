"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MdCheck,
  MdEventAvailable,
  MdHistory,
  MdLogout,
  MdMeetingRoom,
  MdPerson,
  MdRefresh,
  MdSearch,
} from "react-icons/md";
import CheckinHistoryModal, { CheckinHistoryItem } from "./modal/CheckinHistoryModal";

type CheckinAction = "CHECKIN" | "CHECKOUT";

type CheckinRecord = {
  id: number;
  type: CheckinAction;
  createdAt: string;
  createdBy: number;
};

type BookingCandidate = {
  id: number;
  type: string;
  status: string;
  cus_users: {
    id: number;
    name_th: string | null;
    studentId: string | null;
    mobilePhone: string | null;
  };
  room: {
    id: number;
    roomId: string;
    dorm: {
      name: string;
    };
  };
  checkins: CheckinRecord[];
};

type Metadata = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const HISTORY_LIMIT = 20;

type ActionTableProps = {
  title: string;
  action: CheckinAction;
  actionLabel: string;
  emptyText: string;
  list: BookingCandidate[];
  actioningKey: string | null;
  onAction: (bookingId: number, action: CheckinAction) => Promise<void>;
};

const getSearchKey = (item: BookingCandidate) => {
  const name = item.cus_users?.name_th || "";
  const studentId = item.cus_users?.studentId || "";
  const roomId = item.room?.roomId || "";
  const dormName = item.room?.dorm?.name || "";
  return `${name} ${studentId} ${roomId} ${dormName}`.toLowerCase();
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

const ActionTable = ({
  title,
  action,
  actionLabel,
  emptyText,
  list,
  actioningKey,
  onAction,
}: ActionTableProps) => {
  return (
    <section className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 text-slate-500">
          {list.length} รายการ
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[680px]">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/40">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-in Time</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((item) => {
              const checkinRecord = item.checkins.find((record) => record.type === "CHECKIN");
              const key = `${item.id}:${action}`;
              const isActioning = actioningKey === key;

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 leading-none mb-1">{item.cus_users?.name_th || "-"}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {item.cus_users?.studentId || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-700"># {item.room?.roomId || "-"}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{item.room?.dorm?.name || "-"}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-semibold text-slate-500">
                    {formatDateTime(checkinRecord?.createdAt)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => onAction(item.id, action)}
                      disabled={isActioning}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black tracking-wider transition-all disabled:opacity-40 ${
                        action === "CHECKIN"
                          ? "bg-[#126A31] hover:bg-[#093218] shadow-md shadow-green-100"
                          : "bg-slate-700 hover:bg-slate-800 shadow-md shadow-slate-200"
                      }`}
                    >
                      {action === "CHECKIN" ? <MdCheck size={16} /> : <MdLogout size={16} />}
                      {isActioning ? "กำลังบันทึก..." : actionLabel}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {list.length === 0 && (
        <div className="py-16 flex flex-col items-center justify-center text-slate-300">
          <MdEventAvailable size={42} className="opacity-30 mb-3" />
          <p className="text-xs font-bold uppercase tracking-[0.2em]">{emptyText}</p>
        </div>
      )}
    </section>
  );
};

export default function AdminCheckinPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [checkinCandidates, setCheckinCandidates] = useState<BookingCandidate[]>([]);
  const [checkoutCandidates, setCheckoutCandidates] = useState<BookingCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningKey, setActioningKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState<CheckinHistoryItem[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyMetadata, setHistoryMetadata] = useState<Metadata>({
    total: 0,
    page: 1,
    limit: HISTORY_LIMIT,
    totalPages: 1,
  });

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/checkin", { cache: "no-store" });
      const payload = await response.json();

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(payload.message || "ไม่สามารถดึงข้อมูลได้");
      }

      setCheckinCandidates(payload.checkinCandidates || []);
      setCheckoutCandidates(payload.checkoutCandidates || []);
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const fetchHistory = useCallback(
    async (page = 1, query = "") => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(HISTORY_LIMIT),
        });

        const trimmedQuery = query.trim();
        if (trimmedQuery) {
          params.set("q", trimmedQuery);
        }

        const response = await fetch(`/api/admin/checkin/history?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }

        if (!response.ok) {
          throw new Error(payload.message || "ไม่สามารถดึงประวัติได้");
        }

        setHistoryItems(payload.data || []);
        setHistoryMetadata(
          payload.metadata || {
            total: 0,
            page,
            limit: HISTORY_LIMIT,
            totalPages: 1,
          }
        );
      } catch (err: any) {
        setHistoryError(err?.message || "ไม่สามารถดึงประวัติได้");
      } finally {
        setHistoryLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!isHistoryOpen) return;

    const timer = setTimeout(() => {
      fetchHistory(1, historyQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [isHistoryOpen, historyQuery, fetchHistory]);

  const openHistoryModal = useCallback(() => {
    setIsHistoryOpen(true);
    setHistoryQuery("");
  }, []);

  const closeHistoryModal = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const filteredCheckin = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return checkinCandidates;

    return checkinCandidates.filter((item) => getSearchKey(item).includes(query));
  }, [checkinCandidates, searchQuery]);

  const filteredCheckout = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return checkoutCandidates;

    return checkoutCandidates.filter((item) => getSearchKey(item).includes(query));
  }, [checkoutCandidates, searchQuery]);

  const handleAction = useCallback(async (bookingId: number, action: CheckinAction) => {
    setActioningKey(`${bookingId}:${action}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "ไม่สามารถบันทึกข้อมูลได้");
      }

      setSuccess(payload.message || "บันทึกข้อมูลเรียบร้อย");
      await fetchCandidates();
      if (isHistoryOpen) {
        await fetchHistory(historyMetadata.page, historyQuery);
      }
    } catch (err: any) {
      setError(err?.message || "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setActioningKey(null);
    }
  }, [fetchCandidates, fetchHistory, historyMetadata.page, historyQuery, isHistoryOpen]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 antialiased font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-xs font-black text-slate-400 hover:text-[#126A31] transition-colors uppercase tracking-widest"
            >
              &lt; กลับสู่ Dashboard
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 italic">
              Move<span className="text-[#126A31]">InOut</span> Desk
            </h1>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em]">
              ตรวจสอบรายการย้ายเข้า/ย้ายออกของผู้พัก
            </p>
          </div>
          
          <div className="space-y-1">
            <button
              type="button"
              onClick={openHistoryModal}
              className="inline-flex items-center gap-2 p-4 bg-[#126A31] text-white font-bold rounded-xl hover:bg-[#093218] transition-all shadow-md shadow-green-100"
              title="Show check-in/check-out history"
            >
              <MdHistory size={20} />
              ประวัติการย้ายเข้า/ย้ายออก
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 text-slate-500 text-xs font-bold">
              <MdMeetingRoom size={16} />
              Ready Check-in: {filteredCheckin.length}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 text-slate-500 text-xs font-bold">
              <MdPerson size={16} />
              Ready Check-out: {filteredCheckout.length}
            </div>
            <button
              onClick={fetchCandidates}
              disabled={loading}
              className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#126A31] transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <MdRefresh size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <div className="relative group">
            <MdSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#126A31] transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ, รหัสนักศึกษา, ห้อง หรือหอพัก..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-4 focus:ring-green-50 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ActionTable
            title="รายการย้ายเข้า"
            action="CHECKIN"
            actionLabel="ยืนยันย้ายเข้า"
            emptyText="ไม่มีรายการพร้อมย้ายเข้า"
            list={filteredCheckin}
            actioningKey={actioningKey}
            onAction={handleAction}
          />

          <ActionTable
            title="รายการย้ายออก"
            action="CHECKOUT"
            actionLabel="ยืนยันย้ายออก"
            emptyText="ไม่มีรายการพร้อมย้ายออก"
            list={filteredCheckout}
            actioningKey={actioningKey}
            onAction={handleAction}
          />
        </div>
      </div>

      <CheckinHistoryModal
        isOpen={isHistoryOpen}
        items={historyItems}
        metadata={historyMetadata}
        loading={historyLoading}
        error={historyError}
        query={historyQuery}
        onQueryChange={setHistoryQuery}
        onPageChange={(nextPage) => {
          const safePage = Math.max(1, Math.min(nextPage, historyMetadata.totalPages));
          fetchHistory(safePage, historyQuery);
        }}
        onRefresh={() => fetchHistory(historyMetadata.page, historyQuery)}
        onClose={closeHistoryModal}
      />
    </div>
  );
}
