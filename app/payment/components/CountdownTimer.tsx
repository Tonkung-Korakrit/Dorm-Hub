// payment/components/CountdownTimer.tsx
'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    const endTime = Date.now() + initialSeconds * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0;

  return (
    <div className={`font-bold transition-colors ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-orange-600'}`}>
      {isExpired ? (
        'QR หมดอายุแล้ว'
      ) : (
        <div className='flex justify-center'>
          <span className="mr-1">QR จะหมดอายุใน</span>
          <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          <span className="ml-1">นาที</span>
        </div>
      )}
    </div>
  );
}