import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "animate-spin border-4 border-primary border-t-transparent rounded-full",
        sizeClasses[size],
        className
      )}
      data-testid="loading-spinner"
    />
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      <div className="loading-pulse h-4 w-3/4" />
      <div className="loading-pulse h-4 w-1/2" />
      <div className="loading-pulse h-32 w-full" />
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
