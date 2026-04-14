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
      <dd className="text-gray-500 font-normal">-</dd>
    </div>
  );

  const safeValue = String(value).trim();
  const labelParts = label.split(" / ");
  let mainValue = safeValue;
  let subValue = "";

  if (safeValue.includes(" - ")) {
    [mainValue, subValue] = safeValue.split(" - ");
  } else if (safeValue.includes(" สาขา")) {
    const index = safeValue.indexOf(" สาขา");
    mainValue = safeValue.substring(0, index);
    subValue = safeValue.substring(index).trim();
  }

  return (
    <div className="flex justify-between items-baseline gap-6 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-[10px] font-bold text-gray-500 uppercase tracking-wider shrink-0 w-1/3 leading-tight">
        {labelParts.map((part, index) => (
          <span key={index} className="block">{part.trim()}{index < labelParts.length - 1 && "/"}</span>
        ))}
      </dt>
      {/* <dd className="text-[12px] font-semibold text-gray-800 text-right flex-1">
        {subValue ? (
          <div className="flex flex-col">
            <span className="text-gray-900 leading-tight">{mainValue}</span>
            <span className="text-[12px] text-gray-500 font-medium leading-tight mt-0.5">{subValue}</span>
          </div>
        ) : mainValue}
      </dd> */}
      
      <dd className="text-[12px] font-semibold text-gray-800 text-right flex-1 min-w-0 break-all sm:break-words">
        {subValue ? (
          <div className="flex flex-col min-w-0">
            <span className="text-gray-900 leading-tight break-all sm:break-words">
              {mainValue}
            </span>
            <span className="text-[12px] text-gray-500 font-medium leading-tight mt-0.5 break-all sm:break-words">
              {subValue}
            </span>
          </div>
        ) : (
          <span className="break-all sm:break-words">{mainValue}</span>
        )}
      </dd>
    </div>
  );
}