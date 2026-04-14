// ที่เลือกใช้ k6 เพราะเป็นเครื่องมือทดสอบประสิทธิภาพ
// ในรูปแบบ Code-based (Scripting) ซึ่งช่วยให้
// สามารถจำลองสถานการณ์จริงในช่วงวันจองหอพักที่มีทราฟฟิกสูง 
// และพิสูจน์ได้ว่าระบบ Backend ที่ผมออกแบบสามารถจัดการกับ 
// Race Condition ได้จริง ไม่ใช่แค่การเขียนโค้ดให้รันผ่านในสภาวะปกติครับ"
import http from 'k6/http';
import { check, sleep } from 'k6';

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// 1. ตั้งค่าการรัน: จำลอง 8 คน ยิงคนละ 1 ครั้งพร้อมกัน
export const options = {
  vus: 10,
  iterations: 10,
  thresholds: {
    // ต้องระบุเป็น checks{check:"ชื่อที่เราตั้งไว้ใน check"}
    'checks{check:"Success (200)"}': ['rate >= 0.1'],
    'checks{check:"Failed - Room Full (400)"}': ['rate >= 0.9'],
    'checks{check:"Error Message Check"}': ['rate == 1.0'],
  },
};

export default function () {
  // เปลี่ยน URL เป็นของขวัญ (Local) หรือ Railway ตามที่คุณใช้งาน
  const url = 'https://tudormbooking-production.up.railway.app/api/bookings';
  // const url = 'http://localhost:3000/api/bookings';

  // 2. สร้างข้อมูล Mock Data
  // ใช้ __VU (Virtual User ID) เพื่อให้ userId และ studentId ไม่ซ้ำกัน
  const payload = JSON.stringify({
    user: {
      id: 4 + __VU, // จำลอง User ID 101, 102, ...
      studentId: `650961${__VU.toString().padStart(4, '0')}`, // 6509610001, ...
      name_th: `นักศึกษาคนที่ ${__VU}`,
      name_en: `name_en ${__VU}`,
      email: `student${__VU}@tu.ac.th`,
      faculty_department: "คณะวิทยาศาสตร์และเทคโนโลยี สาขาวิชาวิทยาการ คอมพิวเตอร์",
      lifestyle: ["NIGHT", "QUIET", "SMOKE_FREE"],
      citizenType: "CITIZEN_ID",
      citizenNumber: `123456789012${__VU}`,
      gender: "MALE",
      titleName: "Mr.",
      mobilePhone: `081234567${__VU}`,
      isDisabled: false,
      isScholarshipStudent: false,
    },
    room: {
      id: 44, // ** สำคัญ: ใส่ ID ห้องที่มีอยู่ใน DB จริงๆ และเหลือที่ว่างแค่ 1 ที่ **
      // campus: "rangsit",
      // dorm: "M1",
      // floor: 3,
      // roomId: "M1-317",
      // roomType: "FAN_SHARED_BATHROOM",
      capacity: 4,
    },
    type: "NOT_CHARTER",
    groupId: null
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 3. ยิง Request
  const res = http.post(url, payload, params);

  if (res.status !== 200) {
    console.log(`Response Error: ${res.body}`);
  }

  // 4. ตรวจสอบสถานะที่ตอบกลับมา
  check(res, {
    'Success (200)': (r) => r.status === 200,
    'Failed - Room Full (400)': (r) => r.status === 400,
    'Error Message Check': (r) => {
      const isFull = r.body.includes("ขออภัย มีผู้ใช้งานท่านอื่นจองที่นั่งสุดท้ายไปก่อนหน้าคุณเพียงเสี้ยววินาที");
      return r.status === 400 ? isFull : true;
    }
  });

  // พัก 1 วินาทีเพื่อให้เห็นผลลัพธ์ชัดเจน
  sleep(1);
}

export function handleSummary(data) {
  return {
    "tester_code/k6/summary.html": htmlReport(data), // สร้างไฟล์ HTML สวยๆ
    stdout: textSummary(data, { indent: " ", enableColors: true }), // พ่นออกหน้าจอปกติด้วย
  };
}
//"ระบบผ่านการทดสอบ Concurrency โดยมีการตั้งค่า Threshold
// เพื่อยืนยันว่าในสภาวะที่มีการแย่งชิงทรัพยากร (Race Condition)
// จะต้องมีผู้ใช้เพียง 10% เท่านั้นที่ทำรายการสำเร็จ
// และอีก 90% จะต้องถูกปฏิเสธโดยระบบอย่างถูกต้อง (Data Integrity)"