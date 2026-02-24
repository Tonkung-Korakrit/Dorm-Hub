// components/login/LoginSkeleton.tsx
export const LoginSkeleton = () => (
  <div className="flex items-center justify-center min-h-[80vh] pt-[44px] animate-pulse">
    <div className="relative w-full max-w-[400px] aspect-[6/10] bg-gray-100 rounded-[2rem] border border-gray-200">
      {/* จำลองตำแหน่งฟอร์มให้ตรงกับรูปภาพจริง */}
      <div className="absolute top-[37%] left-[10%] right-[10%] space-y-6">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-full"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="flex justify-center">
          <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  </div>
);