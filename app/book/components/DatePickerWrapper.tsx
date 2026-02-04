import dynamic from 'next/dynamic';
import "react-datepicker/dist/react-datepicker.css";

// โหลด DatePicker แบบปิด SSR
const DatePicker = dynamic(() => import('react-datepicker'), {
  ssr: false,
  // แสดงตัวอย่างโหลดสั้นๆ ขณะรอ
  loading: () => <input className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" placeholder="กำลังโหลดปฏิทิน..." />
});

export default DatePicker;