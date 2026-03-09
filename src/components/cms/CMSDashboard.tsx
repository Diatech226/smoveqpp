import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, FileText, FolderOpen, Image as ImageIcon, LayoutDashboard, LogOut, Plus, Settings, Tags, Upload, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { deleteCMSContent, ensureUniqueSlug, getCMSContent, getCMSCategories, upsertCMSContent, type CMSContentItem, type ContentStatus, type ContentType } from '../../data/cmsContent';
import { createService, fetchServices, updateService } from '../../features/cms/services/api';
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '../../features/cms/events/api';
import { createTaxonomy, deleteTaxonomy, fetchTaxonomies } from '../../features/cms/taxonomies/api';
import { fetchSettings, updateSettings } from '../../features/cms/settings/api';
import { deleteMedia, fetchMedia, uploadMedia } from '../../features/cms/media/api';
import { hasPermission, Permissions } from '../../security/permissions';
import { AdminConfirmDialog, AdminDataTable, AdminFiltersBar, AdminFormSection, AdminPageHeader, AdminSearchInput, AdminShell, AdminSidebar, AdminStatsCards, AdminStatusBadge, AdminTopbar, CoverPreviewCard, MediaPicker, PreviewButton, QuickStatusActions } from './admin/AdminUI';
import { CmsEmptyState } from './CmsEmptyState';

type CMSSection = 'overview' | 'services' | 'projects' | 'posts' | 'events' | 'media' | 'taxonomies' | 'settings' | 'users';
const menuItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'posts', label: 'Articles', icon: FileText },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'taxonomies', label: 'Taxonomies', icon: Tags },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;
const workflowStatuses: Array<'draft' | 'review' | 'scheduled' | 'published' | 'archived'> = ['draft', 'review', 'scheduled', 'published', 'archived'];

function ContentSection({ type, items, onRefresh }: { type: ContentType; items: CMSContentItem[]; onRefresh: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const canReadServices = hasPermission(user?.role, Permissions.SERVICE_READ);
  const canCreateServices = hasPermission(user?.role, Permissions.SERVICE_CREATE);
  const canUpdateServices = hasPermission(user?.role, Permissions.SERVICE_UPDATE);
  const categories = useMemo(() => getCMSCategories(items), [items]);
  const filtered = items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.slug.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (type !== 'services' || !canReadServices) return;
    fetchServices().then(({ items: remoteItems }) => {
      const now = new Date().toISOString();
      remoteItems.forEach((item) => upsertCMSContent({ id: item.id, type: 'services', title: item.title, slug: item.slug, excerpt: item.description, content: item.description || 'Service', status: item.status, coverId: '', coverAltText: '', galleryIds: [], category: 'services', createdAt: item.createdAt || now, updatedAt: item.updatedAt || now, publishedAt: item.status === 'published' ? item.updatedAt : null }));
      onRefresh();
    }).catch((e) => toast.error(e instanceof Error ? e.message : 'Erreur API services'));
  }, [type, canReadServices]);

  const createItem = async () => {
    if (title.trim().length < 3) return toast.error('Le titre doit contenir au moins 3 caractères.');
    setIsSaving(true);
    try {
      const all = getCMSContent();
      const now = new Date().toISOString();
      const slug = ensureUniqueSlug(all, title);
      if (type === 'services' && canCreateServices) {
        const created = await createService({ title: title.trim(), description: 'Résumé à compléter', status: status === 'published' ? 'published' : 'draft', slug });
        if (created) upsertCMSContent({ id: created.id, type, title: created.title, slug: created.slug, excerpt: created.description, content: created.description || 'Contenu à compléter', status: created.status, category: category || 'general', coverId: '', coverAltText: '', galleryIds: [], videoUrl: '', publishedAt: created.status === 'published' ? created.updatedAt : null, viewsCount: 0, commentsCount: 0, createdAt: created.createdAt, updatedAt: created.updatedAt });
      } else {
        upsertCMSContent({ id: `${Date.now()}`, type, title: title.trim(), slug, excerpt: '', content: '', status, category: category || 'general', coverId: '', coverAltText: '', galleryIds: [], videoUrl: '', publishedAt: status === 'published' ? now : null, viewsCount: 0, commentsCount: 0, createdAt: now, updatedAt: now });
      }
      setTitle(''); setCategory(''); onRefresh(); toast.success('Contenu créé.');
    } finally { setIsSaving(false); }
  };

  return <div className="space-y-4"><AdminFormSection title={`Nouveau ${type}`} helper="Édition rapide."><div className="grid gap-2 md:grid-cols-4"><input value={title} onChange={(e)=>setTitle(e.target.value)} className="rounded-xl border border-slate-200 p-2.5 text-sm" placeholder="Titre"/><input value={category} onChange={(e)=>setCategory(e.target.value)} list={`category-${type}`} className="rounded-xl border border-slate-200 p-2.5 text-sm" placeholder="Catégorie"/><datalist id={`category-${type}`}>{categories.map((entry)=><option key={entry} value={entry} />)}</datalist><select value={status} onChange={(e)=>setStatus(e.target.value as ContentStatus)} className="rounded-xl border border-slate-200 p-2.5 text-sm">{workflowStatuses.map((entry)=><option key={entry} value={entry}>{entry}</option>)}</select><button onClick={createItem} disabled={isSaving} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-60">Save draft</button></div></AdminFormSection><AdminFiltersBar><AdminSearchInput value={query} onChange={setQuery} /></AdminFiltersBar>{!filtered.length ? <CmsEmptyState title="Aucun élément trouvé" description="Créez un contenu ou ajustez vos filtres." /> : <AdminDataTable columns={['Titre','Cover','Catégorie','Statut','Date','Actions']} rows={filtered.map((item)=><tr key={item.id}><td className="px-4 py-3 align-top"><p className="font-medium text-slate-900">{item.title}</p><p className="text-xs text-slate-500">/{item.slug}</p></td><td className="px-4 py-3"><CoverPreviewCard title={item.title} src={undefined} /></td><td className="px-4 py-3 text-slate-600">{item.category}</td><td className="px-4 py-3"><AdminStatusBadge status={item.status} /><div className="mt-2"><QuickStatusActions status={item.status} onChange={async (nextStatus)=>{ if (type==='services' && canUpdateServices) await updateService(item.id, { status: nextStatus==='published' ? 'published':'draft' }); upsertCMSContent({ ...item, status: nextStatus, updatedAt: new Date().toISOString() }); onRefresh(); }} /></div></td><td className="px-4 py-3 text-xs text-slate-500">{new Date(item.updatedAt).toLocaleDateString()}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1"><PreviewButton onClick={()=>window.alert(`Preview ${item.title}`)} /><AdminConfirmDialog label={item.title} onConfirm={()=>{ deleteCMSContent(item.id); onRefresh(); toast.success('Élément supprimé.'); }} /></div></td></tr>)} />}</div>;
}

export function CMSDashboard({ currentSection, onSectionChange }: { currentSection: CMSSection; onSectionChange: (section: CMSSection) => void }) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [taxonomies, setTaxonomies] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ textLogo: 'SMOVE', heroVideoUrl: '' });
  const allContent = useMemo(() => getCMSContent(), [refreshKey]);

  useEffect(() => { if (currentSection === 'events') fetchEvents().then((r) => setEvents(r.data?.items ?? [])); }, [currentSection, refreshKey]);
  useEffect(() => { if (currentSection === 'taxonomies') fetchTaxonomies().then((r) => setTaxonomies(r.data?.items ?? [])); }, [currentSection, refreshKey]);
  useEffect(() => { if (currentSection === 'media') fetchMedia(search).then((r) => setMedia(r.data?.items ?? [])); }, [currentSection, refreshKey, search]);
  useEffect(() => { if (currentSection === 'settings') fetchSettings().then((r) => setSettings(r.data?.item ?? settings)); }, [currentSection, refreshKey]);

  const stats = [{ label: 'Total contenus', value: allContent.length, hint: 'Tous modules CMS' }, { label: 'Published', value: allContent.filter((x) => x.status === 'published').length, hint: 'En ligne' }, { label: 'Review', value: allContent.filter((i) => i.status === 'review').length, hint: 'À valider' }, { label: 'Media files', value: media.length, hint: 'Bibliothèque' }];
  const selectedLabel = menuItems.find((item) => item.id === currentSection)?.label ?? 'Dashboard';

  return <AdminShell sidebar={<AdminSidebar items={menuItems as any} activeId={currentSection} onChange={(id)=>onSectionChange(id as CMSSection)} profileSlot={<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{user?.email ?? 'admin@smove.local'}</div>} footerSlot={<button className="flex w-full items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600" onClick={async()=>{ await logout(); window.location.hash='login'; }}><LogOut size={16} />Déconnexion</button>} />} topbar={<AdminTopbar title={selectedLabel} subtitle="Back-office premium orienté productivité" search={search} onSearch={setSearch} onCreate={()=>onSectionChange('posts')} userSlot={<div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">{user?.name ?? 'Admin'}</div>} />}>{currentSection === 'overview' && <div className="space-y-4"><AdminStatsCards stats={stats} /></div>}
    {(currentSection === 'posts' || currentSection === 'services' || currentSection === 'projects') && <ContentSection type={currentSection} items={allContent.filter((i)=>i.type===currentSection).filter((i)=>i.title.toLowerCase().includes(search.toLowerCase()))} onRefresh={()=>setRefreshKey((v)=>v+1)} />}
    {currentSection === 'events' && <div className="space-y-4"><AdminPageHeader title="Events" description="Planification éditoriale des événements." actions={<button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white" onClick={async()=>{ await createEvent({ title: `Event ${events.length+1}`, startsAt: new Date().toISOString(), status: 'draft' }); setRefreshKey((v)=>v+1); toast.success('Événement créé'); }}><Plus size={14} className="mr-1 inline"/>Ajouter</button>} /><AdminDataTable columns={['Titre','Date','Lieu','Statut','Actions']} rows={events.map((e)=><tr key={e.id}><td className="px-4 py-3">{e.title}</td><td className="px-4 py-3 text-xs">{new Date(e.startsAt).toLocaleString()}</td><td className="px-4 py-3">{e.location || '—'}</td><td className="px-4 py-3"><AdminStatusBadge status={e.status} /></td><td className="px-4 py-3"><div className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={async()=>{ await updateEvent(e.id,{ status: e.status === 'published' ? 'draft' : 'published' }); setRefreshKey((v)=>v+1); }}>Toggle status</button><AdminConfirmDialog label={e.title} onConfirm={async()=>{ await deleteEvent(e.id); setRefreshKey((v)=>v+1); }} /></div></td></tr>)} /></div>}
    {currentSection === 'taxonomies' && <div className="space-y-4"><AdminPageHeader title="Taxonomies" description="Gestion centralisée des labels." actions={<button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white" onClick={async()=>{ await createTaxonomy({ type: 'post_category', label: `Catégorie ${taxonomies.length+1}` }); setRefreshKey((v)=>v+1); }}>Ajouter</button>} /><AdminDataTable columns={['Type','Label','Slug','Statut','Actions']} rows={taxonomies.map((t)=><tr key={t.id}><td className="px-4 py-3">{t.type}</td><td className="px-4 py-3">{t.label}</td><td className="px-4 py-3">{t.slug}</td><td className="px-4 py-3"><AdminStatusBadge status={t.active ? 'active' : 'inactive'} /></td><td className="px-4 py-3"><AdminConfirmDialog label={t.label} onConfirm={async()=>{ await deleteTaxonomy(t.id); setRefreshKey((v)=>v+1); }} /></td></tr>)} /></div>}
    {currentSection === 'media' && <div className="space-y-4"><AdminPageHeader title="Media Library" description="Upload asynchrone et gestion serveur." /><AdminFiltersBar><AdminSearchInput value={search} onChange={setSearch} placeholder="Recherche média" /><label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"><Upload size={14} className="mr-1 inline" /> Upload<input type="file" accept="image/*" className="hidden" onChange={async (event)=>{const file=event.target.files?.[0]; if(!file) return; await uploadMedia({ file }); setRefreshKey((v)=>v+1); toast.success('Média importé'); event.target.value='';}}/></label></AdminFiltersBar>{!media.length ? <CmsEmptyState title="Médiathèque vide" description="Importez vos premières images." /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{media.map((file)=><MediaPicker key={file.id}><img src={file.url} alt={file.alt || file.originalName} className="h-40 w-full rounded-lg bg-slate-100 object-cover" /><p className="mt-2 truncate text-sm font-medium text-slate-900">{file.originalName}</p><p className="text-xs text-slate-500">{file.folder || 'root'} · {(file.size / 1024).toFixed(1)} KB</p><div className="mt-3 flex gap-2"><button onClick={()=>{navigator.clipboard?.writeText(file.url);toast.success('URL copiée');}} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Copy URL</button><AdminConfirmDialog label={file.originalName} onConfirm={async()=>{await deleteMedia(file.id); setRefreshKey((v)=>v+1);}} /></div></MediaPicker>)}</div>}</div>}
    {currentSection === 'settings' && <AdminFormSection title="Settings" helper="Branding, SEO, CMS et hero video."><div className="grid gap-3 md:grid-cols-2"><div><label className="mb-1 block text-xs font-medium text-slate-500">Hero video URL</label><input className="w-full rounded-xl border border-slate-200 p-2.5 text-sm" value={settings.heroVideoUrl || ''} onChange={(e)=>setSettings((v:any)=>({ ...v, heroVideoUrl: e.target.value }))} /></div><div><label className="mb-1 block text-xs font-medium text-slate-500">Logo text</label><input className="w-full rounded-xl border border-slate-200 p-2.5 text-sm" value={settings.textLogo || ''} onChange={(e)=>setSettings((v:any)=>({ ...v, textLogo: e.target.value }))} /></div></div><button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white" onClick={async()=>{ await updateSettings({ heroVideoUrl: settings.heroVideoUrl, textLogo: settings.textLogo }); toast.success('Paramètres sauvegardés.'); }}>Sauvegarder</button></AdminFormSection>}
    {currentSection === 'users' && <AdminDataTable columns={['Nom','Email','Role','Status']} rows={<tr><td className="px-4 py-3">{user?.name || 'Admin'}</td><td className="px-4 py-3">{user?.email}</td><td className="px-4 py-3">{user?.role || 'viewer'}</td><td className="px-4 py-3"><AdminStatusBadge status="active" /></td></tr>} />}
  </AdminShell>;
}

export default CMSDashboard;
