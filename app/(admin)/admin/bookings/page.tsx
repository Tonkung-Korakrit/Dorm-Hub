import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export default async function AdminBookingsPage() {
  // ดึงข้อมูลการจองที่รอการตรวจสอบ (PENDING)
  const pendingBookings = await prisma.booking.findMany({
    where: { status: "PENDING" },
    include: { user: true, room: true },
    orderBy: { createdAt: 'desc' }
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
                <td className="px-6 py-4">{booking.user.name_th} ({booking.user.studentId})</td>
                <td className="px-6 py-4">{booking.room.number} / {booking.room.zone}</td>
                <td className="px-6 py-4">
                  <a href={booking.paymentProof} target="_blank" className="text-blue-600 underline">ดูสลิป</a>
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