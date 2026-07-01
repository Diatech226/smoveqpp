interface LoadingStateProps {
  label?: string;
  className?: string;
  compact?: boolean;
}

export default function LoadingState({
  label = 'Chargement des données…',
  className = '',
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 rounded-[24px] border border-[#d9edf4] bg-[#f7fcff] text-[#1a5b76] ${compact ? 'px-4 py-3 text-sm' : 'px-6 py-10 text-base'} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#b8e7f5] border-t-[#00b3e8]" aria-hidden="true" />
      <span className="font-['Abhaya_Libre:Bold',sans-serif]">{label}</span>
    </div>
  );
}
