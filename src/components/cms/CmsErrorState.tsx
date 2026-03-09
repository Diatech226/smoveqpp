export function CmsErrorState({
  message = 'Une erreur est survenue lors du chargement.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="premium-subpanel border-rose-200/60 bg-rose-50/80 p-8 text-center">
      <p className="text-base font-semibold text-rose-700">Impossible de charger le module</p>
      <p className="mt-1 text-sm text-rose-600">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="premium-btn mt-4 border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700">
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
