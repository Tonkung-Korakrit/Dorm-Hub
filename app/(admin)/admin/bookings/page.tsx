// 'use client'
import { prisma } from "@/lib/prisma";
// import { BookingStatus, Role } from "@prisma/client";
import { BookingStatus } from "@/types/booking";

export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';

export default async function AdminBookingsPage() {
  // ดึงข้อมูลการจองที่รอการตรวจสอบ (PENDING)
  const pendingBookings = await prisma.booking.findMany({
    where: { booking_logs: { some: { status: BookingStatus.PENDING } } },
    include: {
      cus_users: true,
      room: true,
      booking_logs: {
        orderBy: { createdAt: 'desc' }
      }
    },

  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">รายการรอยืนยันการจอง</h1>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้จอง</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ห้อง/โซน</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">หลักฐานการโอน</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pendingBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4">{booking.cus_users.name_th} ({booking.cus_users.studentId})</td>
                <td className="px-6 py-4">{booking.room.roomId} / {booking.room.dormId}</td>
                <td className="px-6 py-4">
                  <a
                    href={String(booking.booking_logs[0]?.verifiedBy)}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    ดูสลิป
                  </a>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button className="bg-green-500 text-white px-3 py-1 rounded">อนุมัติ</button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded">ปฏิเสธ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}