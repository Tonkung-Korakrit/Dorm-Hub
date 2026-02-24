import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ตรวจสอบ path ของคุณด้วย
import { redirect } from "next/navigation";
// import { AdminDashboardContent } from "./components/AdminDashboardContent";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import AdminDashboard from "./dashboard/page";
import { BookingStatus } from "@/types/booking";

// บังคับให้หน้าหน้าเช็คข้อมูลสดเสมอ ป้องกันปัญหา Build Error ใน Docker
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // 1. เช็คสิทธิ์ที่ฝั่ง Server (ไม่มีแวบแน่นอน)
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  // 2. ดึงข้อมูลเบื้องต้นมาโชว์ (Optional - ทำให้ Dashboard ดูเทพขึ้น)
  const stats = await prisma.booking.aggregate({
    _count: { id: true },
    where: { booking_logs: { some: { status: BookingStatus.VERIFYING } } }
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h1 className="text-3xl font-black text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            ยินดีต้อนรับคุณ <span className="font-bold text-[#126A31] underline decoration-green-200 underline-offset-4">{session.user.name}</span>
          </p>
        </div>

        {/* ส่วนเนื้อหาที่อาจจะมีความ Interactive (ใช้ Client Component) */}
        <AdminDashboard />
      </div>
    </main>
  );
}