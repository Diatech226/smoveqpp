import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-['ABeeZee:Regular',sans-serif] text-[28px] text-[#273a41]">{title}</h2>
        {subtitle ? (
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[15px] text-[#6f7f85] mt-1">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function AdminActionBar({ children }: { children: ReactNode }) {
  return <div className="bg-white border border-[#eef3f5] rounded-[16px] p-4 flex flex-wrap items-center gap-3">{children}</div>;
}

export function AdminPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-[20px] p-6 shadow-sm border border-[#eef3f5]">
      <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-4">{title}</h3>
      {children}
    </section>
  );
}

export function AdminLoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-[16px] border border-[#eef3f5] bg-white p-8 flex items-center gap-3 text-[#6f7f85]">
      <Loader2 className="animate-spin" size={18} />
      <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[15px]">{label}</span>
    </div>
  );
}

export function AdminEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[#d8e4e8] bg-[#f9fcfd] p-8 text-center">
      <Inbox className="mx-auto text-[#9ba1a4] mb-3" size={24} />
      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[15px] text-[#6f7f85]">{label}</p>
    </div>
  );
}

export function AdminErrorState({ label }: { label: string }) {
  return (
    <div className="rounded-[16px] border border-red-100 bg-red-50 p-4 flex items-center gap-2 text-red-700">
      <AlertCircle size={18} />
      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[15px]">{label}</p>
    </div>
  );
}

export function AdminSuccessFeedback({ label }: { label: string }) {
  return (
    <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2 text-emerald-700">
      <CheckCircle2 size={18} />
      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[15px]">{label}</p>
    </div>
  );
}
