import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 space-y-4",
        className
      )}
      data-testid="empty-state"
    >
      {icon && (
        <div className="w-16 h-16 text-muted-foreground mb-2" data-testid="empty-state-icon">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold" data-testid="empty-state-title">
          {title}
        </h3>
        <p className="text-muted-foreground max-w-md" data-testid="empty-state-description">
          {description}
        </p>
      </div>
      {action && (
        <Button onClick={action.onClick} className="btn-primary" data-testid="empty-state-action">
          {action.label}
        </Button>
      )}
    </div>
  );
}
