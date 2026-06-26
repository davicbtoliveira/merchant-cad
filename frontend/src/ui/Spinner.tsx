interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function Spinner({ size = "md" }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeClasses[size]}`}
        role="status"
        aria-label="Carregando"
      />
    </div>
  );
}
