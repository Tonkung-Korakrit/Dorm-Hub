export const ZoneCardSkeleton = () => {
  return (
    <div className="bg-white p-4 md:p-8 rounded-[10px] shadow-sm border border-gray-100 animate-pulse">
      <div className="relative aspect-[16/10] bg-gray-200 rounded-[10px]" />
      <div className="mt-4 flex justify-between items-center">
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}