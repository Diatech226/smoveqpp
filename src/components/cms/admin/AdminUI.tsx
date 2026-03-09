import { Bell, ChevronRight, Loader2, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export function AdminShell({ sidebar, topbar, children }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode }) {
  return (
    <div className="admin-premium min-h-screen">
      <div className="mx-auto grid max-w-[1720px] grid-cols-1 gap-5 p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:p-7">
        {sidebar}
        <div className="space-y-5">
          {topbar}
          <main className="space-y-5">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ items, activeId, onChange, profileSlot, footerSlot }: { items: AdminNavItem[]; activeId: string; onChange: (id: string) => void; profileSlot?: ReactNode; footerSlot?: ReactNode }) {
  return (
    <aside className="premium-panel premium-glow rounded-[1.75rem] p-4 lg:sticky lg:top-5 lg:h-[calc(100vh-2.8rem)]">
      <div className="mb-5 rounded-2xl border border-white/25 bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-700 p-4 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/85">SMOVE</p>
        <p className="mt-1 text-xl font-semibold">Premium CMS</p>
        <p className="mt-2 text-xs text-cyan-100/80">Next-gen content operations</p>
      </div>
      {profileSlot}
      <div className="mt-4 space-y-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`premium-float flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              activeId === item.id
                ? 'border border-cyan-200/70 bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-[0_14px_22px_-16px_rgba(3,105,161,0.95)]'
                : 'text-slate-700 hover:bg-white/70 hover:text-slate-900'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
      {footerSlot && <div className="mt-5 border-t border-slate-200/70 pt-4">{footerSlot}</div>}
    </aside>
  );
}

export function AdminTopbar({ title, subtitle, search, onSearch, onCreate, userSlot }: { title: string; subtitle?: string; search: string; onSearch: (v: string) => void; onCreate?: () => void; userSlot?: ReactNode }) {
  return (
    <div className="premium-panel premium-glow p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <span>Admin</span>
            <ChevronRight size={13} />
            <span className="capitalize">{title}</span>
          </div>
          <h1 className="text-2xl font-semibold capitalize text-slate-950">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
          <AdminSearchInput value={search} onChange={onSearch} placeholder="Recherche globale" />
          {onCreate && <button onClick={onCreate} className="premium-btn premium-btn-primary px-4 py-2 text-sm font-medium">Create</button>}
          <button className="premium-btn rounded-xl p-2.5 text-slate-600" aria-label="Notifications">
            <Bell size={16} />
          </button>
          {userSlot}
        </div>
      </div>
    </div>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function AdminStatsCards({ stats }: { stats: Array<{ label: string; value: string | number; hint?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.label} className="premium-subpanel premium-glow premium-float p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
          {stat.hint && <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>}
        </article>
      ))}
    </div>
  );
}

export function AdminDataTable({ columns, rows }: { columns: string[]; rows: ReactNode }) {
  return (
    <div className="premium-subpanel premium-table overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="text-slate-600">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80">{rows}</tbody>
      </table>
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    draft: 'bg-slate-100/90 text-slate-700',
    review: 'bg-amber-100/95 text-amber-700',
    scheduled: 'bg-sky-100/95 text-sky-700',
    published: 'bg-emerald-100/95 text-emerald-700',
    archived: 'bg-violet-100/95 text-violet-700',
    active: 'bg-emerald-100/95 text-emerald-700',
    inactive: 'bg-rose-100/95 text-rose-700',
    invited: 'bg-sky-100/95 text-sky-700',
  };
  return <span className={`premium-badge inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${variants[status] ?? 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}

export function AdminFiltersBar({ children }: { children: ReactNode }) {
  return <div className="premium-subpanel flex flex-wrap items-center gap-2 p-3">{children}</div>;
}

export function AdminSearchInput({ value, onChange, placeholder = 'Rechercher...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="relative min-w-[220px] flex-1 xl:w-[320px] xl:flex-none">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl py-2 pl-9 pr-3 text-sm text-slate-800" />
    </label>
  );
}

export function AdminFormSection({ title, helper, children }: { title: string; helper?: string; children: ReactNode }) {
  return (
    <section className="premium-subpanel p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function AdminEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="premium-subpanel border-dashed p-8 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function AdminLoadingSkeleton() {
  return (
    <div className="premium-subpanel p-5">
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-slate-100" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
      </div>
    </div>
  );
}

export function AdminConfirmDialog({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return <button onClick={() => window.confirm(`Supprimer ${label} ?`) && onConfirm()} className="premium-btn rounded-lg border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600">Supprimer</button>;
}

export function MediaPicker({ children }: { children: ReactNode }) {
  return <div className="premium-subpanel p-4">{children}</div>;
}

export function CoverPreviewCard({ title, src }: { title: string; src?: string }) {
  return (
    <div className="premium-subpanel p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cover</p>
      <div className="mt-2 h-24 overflow-hidden rounded-lg bg-slate-100">
        {src ? <img src={src} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-slate-500">Aucune cover</div>}
      </div>
    </div>
  );
}

export function QuickStatusActions({ status, onChange }: { status: string; onChange: (status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived') => void }) {
  const options: Array<'draft' | 'review' | 'scheduled' | 'published' | 'archived'> = ['draft', 'review', 'scheduled', 'published', 'archived'];
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition ${status === option ? 'premium-btn-primary premium-btn text-white' : 'premium-btn text-slate-600'}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function PreviewButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="premium-btn rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600">Preview</button>;
}

export function AdminBusyInline({ label = 'Chargement...' }: { label?: string }) {
  return <div className="inline-flex items-center gap-2 text-sm text-slate-500"><Loader2 size={15} className="animate-spin" />{label}</div>;
}
