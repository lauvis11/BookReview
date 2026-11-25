export default function BookSkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#eae6da]/90 border border-transparent shadow-[0_0_0_1px_oklch(0_0_0/0.04)]">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-[7px] bg-[#d6d0c0]/45"
        />
      </div>
      <div className="mt-2.5 sm:mt-3 px-0.5">
        <div
          className="h-3.5 sm:h-4 w-[88%] bg-[#eae6da]/90"
          style={{ borderRadius: '4px' }}
        />
        <div
          className="mt-1.5 h-3.5 sm:h-4 w-[58%] bg-[#eae6da]/75"
          style={{ borderRadius: '4px' }}
        />
        <div
          className="mt-2 h-3 w-[48%] bg-[#e3decb]/75"
          style={{ borderRadius: '4px' }}
        />
      </div>
    </div>
  )
}
