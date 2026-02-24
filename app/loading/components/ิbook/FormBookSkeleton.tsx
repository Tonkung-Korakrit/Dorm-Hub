// components/booking/FormBookSkeleton.tsx
export const FormBookSkeleton = () => {
  return (
    <div className="w-full h-screen flex flex-col bg-transparent overflow-hidden animate-pulse">
      {/* 1. ส่วน Stepper Bar Skeleton */}
      <div className="flex-none w-full relative pt-12 pb-2">
        {/* เส้นพื้นหลังเทาๆ */}
        <div className="absolute left-0 top-[64px] sm:top-[72px] w-[85%] h-[6px] sm:h-[12px] bg-gray-200 z-0" />
        
        <div className="max-w-4xl mx-auto flex justify-between items-start relative z-10 px-6 md:px-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gray-200" />
              <div className="h-3 w-12 bg-gray-200 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. ส่วนฟอร์มด้านล่าง (จำลอง Student Info Form) */}
      <div className="flex-1 flex justify-center mt-2">
        <div className="w-full max-w-4xl px-8">
          <div className="bg-gray-100/50 rounded-3xl p-8 h-[500px]">
            {/* จำลองหัวข้อฟอร์ม */}
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-10" />
            
            {/* จำลองช่อง Input 4-5 ช่อง */}
            <div className="space-y-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-10 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};