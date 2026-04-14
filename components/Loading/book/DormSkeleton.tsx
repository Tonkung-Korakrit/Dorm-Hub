export const DormSkeleton = () => {
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200 animate-pulse custom-scrollbar max-h-[83vh] overflow-y-auto">

      {/* --- 1. ส่วนบน (จำลองกล่องข้อมูลผู้จองสีเขียว) --- */}
      {/* กล่องสีเขียวอ่อน ขอบสีเขียว */}
      <div className="bg-green-50 border border-green-200 rounded-3xl p-6 mb-8 shadow-inner">
        <div className="space-y-6">
          {/* แถว 1: Gender */}
          <div className="space-y-2.5">
            <div className="h-5 w-48 bg-gray-200 rounded-md" /> {/* หัวข้อ */}
            <div className="h-4 w-32 bg-gray-100 rounded" /> {/* รายละเอียด */}
          </div>
          {/* แถว 2: Resident Type */}
          <div className="space-y-2.5">
            <div className="h-5 w-60 bg-gray-200 rounded-md" />
            <div className="h-4 w-[65%] bg-gray-100 rounded" />
          </div>
          {/* แถว 3: Selected Campus */}
          <div className="space-y-2.5">
            <div className="h-5 w-56 bg-gray-200 rounded-md" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
          </div>
          {/* แถว 4: Vibe Roommate */}
          <div className="space-y-2.5">
            <div className="h-5 w-[75%] bg-gray-200 rounded-md" />
            <div className="h-4 w-[90%] bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* --- 2. ข้อความหัวข้อ "Preferred Dorm..." --- */}
      <div className="h-6 w-60 bg-gray-200 rounded-md mb-6 pl-1" />

      {/* --- 3. ส่วนล่าง (จำลองการ์ดหอพัก) --- */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 transition-all hover:border-gray-200">
        {/* 🖼 3.1 รูปภาพ (Aspect Ratio 16/10) */}
        <div className="relative aspect-[16/10] bg-gray-200 rounded-3xl" />

        {/* 📝 3.2 ชื่อหอและปุ่ม Location */}
        <div className="mt-6 flex justify-between items-center px-1">
          <div className="h-6 w-16 bg-gray-200 rounded-md" /> {/* ชื่อ B6 */}
          {/* ปุ่ม Location จำลองสีแดงเล็กน้อย */}
          <div className="h-10 w-44 bg-gray-200 rounded-full flex items-center justify-center gap-2 border border-gray-300">
            <div className="h-4 w-4 bg-gray-300 rounded-full" /> {/* ไอคอน */}
            <div className="h-3 w-20 bg-gray-300 rounded" /> {/* ข้อความ */}
          </div>
        </div>
      </div>
    </div>
  );
}