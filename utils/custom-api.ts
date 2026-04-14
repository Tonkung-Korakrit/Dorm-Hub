// lib/api-check-session.ts
export async function customFetch(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, options);

    if (res.status === 401) {
      if (typeof window !== "undefined") {
        // เช็คก่อนว่าตอนนี้อยู่ที่หน้าแรกอยู่แล้วหรือเปล่า เพื่อป้องกันการ Infinite Redirect
        if (window.location.pathname !== "/") {
           // ทางเลือกที่ 2: ถ้าอยากดีดไปหน้าแรกทันที (แบบที่คุณเขียน)
          // window.location.href = "/?reason=expired";

          // ทางเลือกที่ 1: ถ้าอยากให้ Modal เด้ง (ต้องมี SessionGuard ใน Layout)
          window.dispatchEvent(new Event('session-expired'));
        }
      }
    }

    return res;
  } catch (error) {
    // ดักกรณี Network Error (เน็ตหลุด)
    console.error("Network Error:", error);
    throw error;
  }
}