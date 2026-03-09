import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Settings, Tags, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getCMSContent } from '../../data/cmsContent';
import { fetchAuditLogs } from '../../features/cms/audit/api';
import { fetchAnalyticsOverview } from '../../features/cms/analytics/api';
import { deleteMedia, fetchMedia, uploadMedia } from '../../features/cms/media/api';
import { fetchSettings, updateSettings } from '../../features/cms/settings/api';
import { fetchUsers, inviteUser, updateUserRole, updateUserStatus } from '../../features/cms/users/api';
import type { UserRole, UserStatus } from '../../features/cms/users/types';
import { AdminDataTable, AdminFiltersBar, AdminFormSection, AdminPageHeader, AdminSearchInput, AdminShell, AdminSidebar, AdminStatsCards, AdminStatusBadge, AdminTopbar } from './admin/AdminUI';

type CMSSection = 'overview' | 'posts' | 'services' | 'events' | 'media' | 'taxonomies' | 'users' | 'settings';

const menuItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'posts', label: 'Articles', icon: FileText },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'taxonomies', label: 'Taxonomies', icon: Tags },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

function CMSDashboard({ currentSection, onSectionChange }: { currentSection: CMSSection; onSectionChange: (section: CMSSection) => void }) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'viewer' as UserRole });
  const [analyticsOverview, setAnalyticsOverview] = useState({ published: 0, drafts: 0, scheduled: 0, uploads: 0, failedJobs: 0 });

  useEffect(() => {
    fetchAnalyticsOverview().then(setAnalyticsOverview).catch(() => undefined);
    fetchAuditLogs().then(setAuditLogs).catch(() => undefined);
    fetchUsers().then((result) => setTeamUsers(result.items)).catch(() => undefined);
    fetchMedia().then(({ items }) => setMedia(items)).catch(() => undefined);
    fetchSettings().then((result) => setSettings(result.data?.item ?? {})).catch(() => undefined);
  }, []);

  const stats = useMemo(() => [
    { label: 'Published', value: analyticsOverview.published },
    { label: 'Drafts', value: analyticsOverview.drafts },
    { label: 'Scheduled', value: analyticsOverview.scheduled },
    { label: 'Failed jobs', value: analyticsOverview.failedJobs },
  ], [analyticsOverview]);

  const posts = getCMSContent().filter((item) => item.type === 'posts' && item.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminShell
      sidebar={<AdminSidebar items={menuItems as any} activeId={currentSection} onChange={(id) => onSectionChange(id as CMSSection)} profileSlot={<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{user?.email ?? 'admin@smove.local'}</div>} footerSlot={<button className="flex w-full items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600" onClick={async () => { await logout(); window.location.hash = 'login'; }}><LogOut size={16} />Déconnexion</button>} />}
      topbar={<AdminTopbar title={currentSection} subtitle="Back-office premium orienté productivité" search={search} onSearch={setSearch} userSlot={<div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">{user?.name ?? 'Admin'}</div>} />}
    >
      {currentSection === 'overview' && <div className="space-y-4"><AdminStatsCards stats={stats} /><AdminDataTable columns={['Action', 'Entity', 'Date']} rows={auditLogs.map((entry) => <tr key={entry.id}><td className="px-4 py-3">{entry.action}</td><td className="px-4 py-3">{entry.entityType}</td><td className="px-4 py-3 text-xs">{new Date(entry.createdAt).toLocaleString()}</td></tr>)} /></div>}
      {currentSection === 'posts' && <AdminDataTable columns={['Title', 'Slug', 'Status']} rows={posts.map((post) => <tr key={post.id}><td className="px-4 py-3">{post.title}</td><td className="px-4 py-3">{post.slug}</td><td className="px-4 py-3"><AdminStatusBadge status={post.status} /></td></tr>)} />}
      {currentSection === 'users' && <div className="space-y-4"><AdminPageHeader title="Team & Permissions" description="Invitations, rôles, statuts et audit trail." /><AdminFormSection title="Inviter un utilisateur" helper="Le rôle détermine les permissions côté serveur."><div className="grid gap-2 md:grid-cols-4"><input className="rounded-xl border border-slate-200 p-2.5 text-sm" placeholder="Nom" value={inviteForm.name} onChange={(e) => setInviteForm((v) => ({ ...v, name: e.target.value }))} /><input className="rounded-xl border border-slate-200 p-2.5 text-sm" placeholder="Email" value={inviteForm.email} onChange={(e) => setInviteForm((v) => ({ ...v, email: e.target.value }))} /><select className="rounded-xl border border-slate-200 p-2.5 text-sm" value={inviteForm.role} onChange={(e) => setInviteForm((v) => ({ ...v, role: e.target.value as UserRole }))}><option value="viewer">viewer</option><option value="author">author</option><option value="editor">editor</option><option value="admin">admin</option></select><button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white" onClick={async () => { await inviteUser(inviteForm); toast.success('Invitation envoyée'); setInviteForm({ name: '', email: '', role: 'viewer' }); const data = await fetchUsers(); setTeamUsers(data.items); }}>Inviter</button></div></AdminFormSection><AdminDataTable columns={['Nom', 'Email', 'Role', 'Status', 'Actions']} rows={teamUsers.map((member) => <tr key={member.id}><td className="px-4 py-3">{member.name}</td><td className="px-4 py-3">{member.email}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{member.role}</span></td><td className="px-4 py-3"><AdminStatusBadge status={member.status} /></td><td className="px-4 py-3"><div className="flex gap-2"><select value={member.role} className="rounded border px-2 py-1 text-xs" onChange={async (e) => { await updateUserRole(member.id, e.target.value as UserRole); const data = await fetchUsers(); setTeamUsers(data.items); }}><option value="viewer">viewer</option><option value="author">author</option><option value="editor">editor</option><option value="admin">admin</option></select><select value={member.status} className="rounded border px-2 py-1 text-xs" onChange={async (e) => { await updateUserStatus(member.id, e.target.value as UserStatus); const data = await fetchUsers(); setTeamUsers(data.items); }}><option value="active">active</option><option value="inactive">inactive</option><option value="invited">invited</option></select></div></td></tr>)} /></div>}
      {currentSection === 'media' && <div className="space-y-3"><AdminFiltersBar><AdminSearchInput value={search} onChange={setSearch} placeholder="Recherche média" /><label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Upload<input type="file" accept="image/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; await uploadMedia({ file }); toast.success('Média importé'); const result = await fetchMedia(); setMedia(result.items); }} /></label></AdminFiltersBar><AdminDataTable columns={['Nom', 'URL', 'Actions']} rows={media.filter((m) => m.originalName.toLowerCase().includes(search.toLowerCase())).map((file) => <tr key={file.id}><td className="px-4 py-3">{file.originalName}</td><td className="px-4 py-3 text-xs">{file.url}</td><td className="px-4 py-3"><button className="rounded border px-2 py-1 text-xs text-rose-600" onClick={async () => { await deleteMedia(file.id); const result = await fetchMedia(); setMedia(result.items); }}>Supprimer</button></td></tr>)} /></div>}
      {currentSection === 'settings' && <AdminFormSection title="Settings" helper="Branding et SEO"><div className="grid gap-3 md:grid-cols-2"><input className="rounded-xl border border-slate-200 p-2.5 text-sm" value={settings.heroVideoUrl || ''} onChange={(e) => setSettings((prev: any) => ({ ...prev, heroVideoUrl: e.target.value }))} /><input className="rounded-xl border border-slate-200 p-2.5 text-sm" value={settings.textLogo || ''} onChange={(e) => setSettings((prev: any) => ({ ...prev, textLogo: e.target.value }))} /></div><button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white" onClick={async () => { await updateSettings({ heroVideoUrl: settings.heroVideoUrl, textLogo: settings.textLogo }); toast.success('Paramètres sauvegardés.'); }}>Sauvegarder</button></AdminFormSection>}
    </AdminShell>
  );
}

export default CMSDashboard;
