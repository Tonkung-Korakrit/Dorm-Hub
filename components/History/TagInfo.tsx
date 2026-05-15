// components/booking/BookingUI.tsx
export function Tag({ label, className = "bg-white text-gray-500 border-gray-200" }: { label: string, className?: string }) {
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${className}`}>
      {label}
    </span>
  );
}

export function InfoRow({ label, value }: { label: string, value: any }) {
  if (!value) return (
    <div className="flex justify-between items-baseline gap-6 py-2 border-b border-gray-50 last:border-0">
      <dt className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">{label}</dt>
      <dd className="text-gray-500 font-normal text-right">-</dd>
    </div>
  );

  const safeValue = String(value).trim();
  const labelParts = label.split(" / ");
  
  // 1. แยกข้อความออกมาเป็น Array (ถ้ามี " - ")
  let displayParts: string[] = [];

  if (safeValue.includes(" - ")) {
    // แยกด้วย " - " แล้วลบช่องว่างหัวท้าย
    displayParts = safeValue.split(" - ").map(part => part.trim());
  } else if (safeValue.includes(" สาขา")) {
    // โลจิกเดิมสำหรับสาขา
    const index = safeValue.indexOf(" สาขา");
    displayParts.push(safeValue.substring(0, index).trim());
    displayParts.push(safeValue.substring(index).trim());
  } else {
    // กรณีไม่มีอะไรแยกเลย ก็ใส่ลงไปตรงๆ
    displayParts.push(safeValue);
  }

  // แยกเอาบรรทัดแรก (Main) และบรรทัดรองทั้งหมด (Sub)
  const mainValue = displayParts[0];
  const subValues = displayParts.slice(1); // อาจจะว่างเปล่า หรือมีหลายบรรทัด

  return (
    <div className="flex justify-between items-baseline gap-2 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 w-1/3 leading-tight">
        {labelParts.map((part, index) => (
          <span key={index} className="block">
            {part.trim()}{index < labelParts.length - 1 && " / "}
          </span>
        ))}
      </dt>
      
      <dd className="text-[12px] font-semibold text-gray-800 text-right flex-1 min-w-0">
        <div className="flex flex-col min-w-0 items-end">
          {/* บรรทัดหลัก (สีเข้ม) */}
          <span className="text-gray-900 leading-tight break-all sm:break-words text-right">
            {mainValue}
          </span>
          
          {/* บรรทัดรอง (สีอ่อนกว่า) - วนลูปแสดงผลถ้ามีหลายส่วน */}
          {subValues.map((subVal, index) => (
            <span 
              key={index} 
              className="text-[12px] text-gray-500 font-medium leading-tight mt-0.5 break-all sm:break-words text-right"
            >
              {subVal}
            </span>
          ))}
        </div>
      </dd>
    </div>
  );
}