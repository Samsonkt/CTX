import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "error" | "info";
type StatusSize = "sm" | "md";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: StatusSize;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-green-100 text-green-600",
  warning: "bg-yellow-100 text-yellow-600",
  error: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-600"
};

const sizeStyles: Record<StatusSize, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-2.5 py-1.5 text-sm"
};

export function StatusBadge({ 
  status, 
  variant = "info", 
  size = "sm",
  className
}: StatusBadgeProps) {
  return (
    <span 
      className={cn(
        "font-medium rounded-full inline-flex items-center justify-center whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {status}
    </span>
  );
}

// Utility function to determine status variant based on common status values
export function getStatusVariant(status: string): StatusVariant {
  const lowerStatus = status.toLowerCase();
  
  if (
    lowerStatus === "complete" || 
    lowerStatus === "completed" || 
    lowerStatus === "in stock" || 
    lowerStatus === "paid" || 
    lowerStatus === "fully"
  ) {
    return "success";
  }
  
  if (
    lowerStatus === "partial" || 
    lowerStatus === "partially" || 
    lowerStatus === "incomplete" || 
    lowerStatus === "in progress" || 
    lowerStatus === "low stock"
  ) {
    return "warning";
  }
  
  if (
    lowerStatus === "not" || 
    lowerStatus === "error" || 
    lowerStatus === "out of stock" || 
    lowerStatus === "failed"
  ) {
    return "error";
  }
  
  return "info";
}
