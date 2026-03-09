export function EnvironmentBadge({ environment, active }: { environment: 'draft' | 'staging' | 'production'; active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'}`}>{environment}</span>;
}

export function ExperimentStatusBadge({ status }: { status: string }) {
  const tone = status === 'running' ? 'bg-emerald-100 text-emerald-700' : status === 'stopped' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

export function PluginStatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
