interface AiSkeletonLoaderProps {
  rows?: number;
  className?: string;
}

export function AiSkeletonLoader({ rows = 3, className = "" }: AiSkeletonLoaderProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`} aria-busy="true" aria-label="იტვირთება">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-48 w-full animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02]"
        />
      ))}
    </div>
  );
}
