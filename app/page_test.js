// page.js (หน้า Main)
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/all");
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleLogin = async () => {
    // await fetch("/api/logout");
    router.push("/login");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-4 rounded-xl shadow space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h1 className="text-lg sm:text-2xl font-bold text-center sm:text-left">
          Student dormitory reservation system / ระบบจองหอพักนักศึกษา
        </h1>
        <button
          onClick={handleLogin}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 mt-2 sm:mt-0"
        >
          Login
        </button>
      </div>

      {/* CTA */}
      <div className="flex justify-center sm:justify-end">
        <a
          href="/book"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
        >
          จองห้องใหม่
        </a>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-500">กำลังโหลดข้อมูล...</p>
      ) : bookings.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          <p>คุณยังไม่มีรายการจอง</p>
          <a
            href="/book"
            className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            เริ่มจองห้องแรกของคุณ
          </a>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {bookings.map((b) => (
            <div key={b.id} className="border rounded-lg p-4 shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold">
                ห้อง {b.room?.roomId || "-"} ({b.room?.dorm?.name || "ไม่ระบุ"})
              </h2>
              <p className="text-gray-600">ผู้จอง: {b.user?.name_th || "-"}</p>
              <p className="text-gray-600">สถานะ: {b.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
