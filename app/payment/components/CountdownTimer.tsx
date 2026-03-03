'use client';
import { useState, useEffect } from 'react';

export default function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`font-bold ${seconds < 60 ? 'text-red-500 animate-pulse' : 'text-orange-600'}`}>
      {seconds > 0 ? `QR จะหมดอายุใน ${formatTime(seconds)} นาที` : 'QR หมดอายุแล้ว'}
    </div>
  );
}