export const RoomGridSkeleton = ({ maxCols, maxRows }: { maxCols: number; maxRows: number }) => {
  return (
    <div className="flex flex-col items-center animate-pulse">
      {/* จำลองหัวข้อ Choose Floor */}
      <div className="w-full mb-6 mt-4">
        <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-10 h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>

      {/* จำลอง Grid ตามขนาดจริงของโซน */}
      <div className="relative bg-gray-50 border border-gray-100 rounded-[2rem] p-6 shadow-inner overflow-x-auto w-full flex justify-center">
        <div
          className="inline-grid gap-2 sm:gap-3 pl-4"
          style={{
            gridTemplateColumns: `repeat(${maxCols}, 42px)`,
            gridTemplateRows: `repeat(${maxRows}, 42px)`,
          }}
        >
          {/* สร้างกล่องเทาๆ ตามจำนวนห้อง (Cols * Rows) */}
          {[...Array(maxCols * maxRows)].map((_, i) => (
            <div 
              key={i} 
              className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gray-200/60 rounded-xl" 
            />
          ))}
        </div>
      </div>
    </div>
  );
}