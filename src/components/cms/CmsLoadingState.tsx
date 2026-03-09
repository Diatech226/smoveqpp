import { Loader2 } from 'lucide-react';

export function CmsLoadingState({ label = 'Chargement des données CMS...' }: { label?: string }) {
  return (
    <div className="premium-subpanel p-8 text-center">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-600" />
      <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}
