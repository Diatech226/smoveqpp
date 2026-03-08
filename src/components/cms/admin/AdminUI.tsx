import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

export function AdminPageHeader({ title, description, actions, rightSlot }: { title: string; description?: string; actions?: ReactNode; rightSlot?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">{rightSlot}{actions}</div>
      </div>
    </div>
  );
}

export function AdminStatsGrid({ stats }: { stats: Array<{ label: string; value: number | string; hint?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
          {stat.hint && <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    review: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-cyan-100 text-cyan-700',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-violet-100 text-violet-700',
    removed: 'bg-rose-100 text-rose-700',
    active: 'bg-emerald-100 text-emerald-700',
  };

  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${map[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}

export function AdminSearchBar({ value, onChange, placeholder = 'Rechercher...' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="relative flex-1 min-w-[220px]">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-[#00b3e8] focus:ring-2" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function AdminQuickActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function AdminEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AdminFormSection({ title, helper, children }: { title: string; helper?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {helper && <p className="mb-3 mt-1 text-xs text-slate-500">{helper}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function AdminTable({ columns, rows }: { columns: string[]; rows: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{rows}</tbody>
      </table>
    </div>
  );
}

export function ConfirmDeleteDialog({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return <button className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600" onClick={() => window.confirm(`Supprimer ${label} ?`) && onConfirm()}>Supprimer</button>;
}

export function PreviewButton({ onClick }: { onClick: () => void }) {
  return <button className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50" onClick={onClick}>Preview</button>;
}

export function MediaPicker({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">{children}</div>;
}

