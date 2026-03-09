export function CmsEmptyState({
  title = 'Aucune donnée disponible',
  description = 'Commencez par créer un premier élément pour ce module.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="premium-subpanel border-dashed p-8 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
