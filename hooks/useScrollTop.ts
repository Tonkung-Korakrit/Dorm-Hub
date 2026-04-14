// hooks/useScrollTop.ts
import { useEffect } from 'react';

export function useScrollTop() {
  // เลื่อนหน้าไปด้านบนสุด เมื่อคอมโพเนนต์ mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []); // รันแค่ครั้งเดียวตอน Mount
}