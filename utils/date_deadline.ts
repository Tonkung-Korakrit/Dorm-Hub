export function getBookingDeadlines() {
  const now = new Date();
  
  // คำนวณวันสิ้นสุด (บวกไป 7 วัน)
  const deadline = new Date();
  deadline.setDate(now.getDate() + 7);

  // ตัวจัดรูปแบบวันที่ภาษาไทย
  const thaiFormatter = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    startDate: thaiFormatter.format(now),      // เช่น "7 พฤษภาคม 2569"
    endDate: thaiFormatter.format(deadline),    // เช่น "14 พฤษภาคม 2569"
  };
}