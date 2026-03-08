import { useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Tags,
  Upload,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteCMSContent, ensureUniqueSlug, getCMSContent, upsertCMSContent, type CMSContentItem, type ContentStatus, type ContentType } from '../../data/cmsContent';
import { deleteMediaFile, getMediaFiles, uploadMediaFile } from '../../data/media';
import { getActiveTaxonomyLabels } from '../../data/taxonomies';
import { getBrandSettings, saveBrandSettings } from '../../data/brandSettings';
import {
  AdminEmptyState,
  AdminFormSection,
  AdminPageHeader,
  AdminQuickActions,
  AdminSearchBar,
  AdminStatsGrid,
  AdminStatusBadge,
  AdminTable,
  ConfirmDeleteDialog,
  PreviewButton,
} from './admin/AdminUI';

type CMSSection = 'overview' | 'services' | 'projects' | 'posts' | 'events' | 'media' | 'taxonomies' | 'settings' | 'users';

const menuItems: Array<{ id: CMSSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'posts', label: 'Articles / Blog', icon: FileText },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'taxonomies', label: 'Categories / Taxonomies', icon: Tags },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const statuses: ContentStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived'];

function ContentSection({ type, items, onRefresh }: { type: ContentType; items: CMSContentItem[]; onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [category, setCategory] = useState('');
  const filtered = items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) || item.slug.includes(query));

  const createItem = () => {
    if (title.trim().length < 3) return;
    const all = getCMSContent();
    const slug = ensureUniqueSlug(all, title);
    const now = new Date().toISOString();
    upsertCMSContent({
      id: `${type}-${Date.now()}`,
      type,
      title: title.trim(),
      slug,
      excerpt: 'Résumé à compléter',
      content: 'Contenu à compléter',
      status,
      coverId: '',
      coverAltText: '',
      galleryIds: [],
      videoUrl: '',
      category: category || 'general',
      publishedAt: status === 'published' ? now : null,
      createdAt: now,
      updatedAt: now,
      viewsCount: 0,
      commentsCount: 0,
    });
    setTitle('');
    setCategory('');
    setStatus('draft');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title={`Gestion ${type}`} description="CRUD rapide avec statuts éditoriaux" rightSlot={<AdminSearchBar value={query} onChange={setQuery} />} actions={<button className="rounded-lg bg-[#273a41] px-3 py-2 text-sm font-medium text-white" onClick={createItem}><Plus size={14} className="mr-2 inline" />Nouveau</button>} />
      <AdminFormSection title="Création rapide" helper="Informations générales + publication.">
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-lg border border-slate-200 p-2 text-sm" placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="rounded-lg border border-slate-200 p-2 text-sm" placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} />
          <select className="rounded-lg border border-slate-200 p-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
          <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={createItem}>Enregistrer</button>
        </div>
      </AdminFormSection>

      {filtered.length === 0 ? <AdminEmptyState title="Aucun contenu" description="Créez un premier élément pour ce module." /> : (
        <AdminTable
          columns={['Titre', 'Statut', 'Catégorie', 'Mise à jour', 'Actions']}
          rows={filtered.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3"><p className="font-medium text-slate-900">{item.title}</p><p className="text-xs text-slate-500">/{item.slug}</p></td>
              <td className="px-4 py-3"><AdminStatusBadge status={item.status} /></td>
              <td className="px-4 py-3 text-slate-600">{item.category}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <PreviewButton onClick={() => window.alert(`Preview: ${item.title}`)} />
                  <button className="rounded border border-slate-200 px-2 py-1 text-xs" onClick={() => {
                    const next = statuses[(statuses.indexOf(item.status) + 1) % statuses.length];
                    upsertCMSContent({ ...item, status: next, updatedAt: new Date().toISOString() });
                    onRefresh();
                  }}>Status +1</button>
                  <ConfirmDeleteDialog label={item.title} onConfirm={() => { deleteCMSContent(item.id); onRefresh(); }} />
                </div>
              </td>
            </tr>
          ))}
        />
      )}
    </div>
  );
}

function MediaSection({ onRefresh }: { onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const files = getMediaFiles().filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Media Library" description="Prévisualisation, upload et actions rapides" rightSlot={<AdminSearchBar value={query} onChange={setQuery} placeholder="Rechercher un média" />} actions={<label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm"><Upload size={14} className="mr-2 inline" />Upload<input hidden multiple type="file" onChange={(event) => {
        const selected = event.target.files;
        if (!selected) return;
        void Promise.all(Array.from(selected).map((file) => uploadMediaFile({ name: file.name, type: file.type.startsWith('video') ? 'video' : 'image', file, uploadedBy: 'admin', folder: 'Archive' }))).then(onRefresh);
      }} /></label>} />

      {files.length === 0 ? <AdminEmptyState title="Aucun média" description="Déposez des images/vidéos pour alimenter les contenus." /> : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => (
            <div key={file.id} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="mb-2 aspect-video overflow-hidden rounded bg-slate-100">
                {file.type === 'image' ? <img src={file.variants.sm?.url || file.originalUrl} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-slate-500">VIDEO</div>}
              </div>
              <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">{file.folder}</p>
              <div className="mt-2 flex gap-2">
                <button className="rounded border border-slate-200 px-2 py-1 text-xs" onClick={() => void navigator.clipboard.writeText(file.originalUrl)}>Copy URL</button>
                <ConfirmDeleteDialog label={file.name} onConfirm={() => { deleteMediaFile(file.id); onRefresh(); }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CMSDashboard({ currentSection, onSectionChange }: { currentSection: string; onSectionChange: (section: string) => void }) {
  const { user, logout, canAccessCMS } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');

  const allContent = useMemo(() => getCMSContent(), [refreshKey]);
  const contentInReview = allContent.filter((item) => item.status === 'review').slice(0, 5);
  const recent = [...allContent].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5);
  const settings = getBrandSettings();

  if (!canAccessCMS) return null;

  const mainStats = [
    { label: 'Articles', value: allContent.filter((item) => item.type === 'posts').length },
    { label: 'Services', value: allContent.filter((item) => item.type === 'services').length },
    { label: 'Projects', value: allContent.filter((item) => item.type === 'projects').length },
    { label: 'Drafts', value: allContent.filter((item) => item.status === 'draft').length, hint: 'Tous modules' },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="mb-4 rounded-xl bg-[#273a41] px-3 py-4 text-white">
            <p className="text-sm text-white/80">SMOVE</p>
            <p className="text-lg font-semibold">Admin CMS</p>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => <button key={item.id} onClick={() => onSectionChange(item.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${currentSection === item.id ? 'bg-[#00b3e8] text-white' : 'text-slate-700 hover:bg-slate-100'}`}><item.icon size={16} />{item.label}</button>)}
          </nav>
          <button className="mt-4 flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-rose-600" onClick={async () => { await logout(); window.location.hash = 'login'; }}><LogOut size={16} />Déconnexion</button>
        </aside>

        <main className="space-y-4">
          <AdminPageHeader title={menuItems.find((item) => item.id === currentSection)?.label ?? 'Dashboard'} description="Back-office éditorial professionnel" rightSlot={<AdminSearchBar value={search} onChange={setSearch} placeholder="Recherche globale" />} actions={<div className="rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600">{user?.email}</div>} />

          {currentSection === 'overview' && (
            <div className="space-y-4">
              <AdminStatsGrid stats={mainStats} />
              <div className="grid gap-4 xl:grid-cols-2">
                <AdminFormSection title="Accès rapides" helper="Actions fréquentes du quotidien.">
                  <AdminQuickActions>
                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => onSectionChange('posts')}>+ Nouvel article</button>
                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => onSectionChange('projects')}>+ Nouveau projet</button>
                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => onSectionChange('media')}>Upload média</button>
                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => onSectionChange('users')}>Gérer users</button>
                  </AdminQuickActions>
                </AdminFormSection>
                <AdminFormSection title="Activité récente" helper="Derniers contenus modifiés.">
                  {recent.map((item) => <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm"><span>{item.title}</span><AdminStatusBadge status={item.status} /></div>)}
                </AdminFormSection>
              </div>
              <AdminFormSection title="Contenus en review" helper="Priorités éditoriales à valider.">
                {contentInReview.length === 0 ? <p className="text-sm text-slate-500">Aucun brouillon en attente de review.</p> : contentInReview.map((item) => <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0"><span>{item.title}</span><span className="text-xs text-slate-500">{item.type}</span></div>)}
              </AdminFormSection>
            </div>
          )}

          {(currentSection === 'posts' || currentSection === 'services' || currentSection === 'projects' || currentSection === 'events') && <ContentSection type={currentSection} items={allContent.filter((item) => item.type === currentSection)} onRefresh={() => setRefreshKey((value) => value + 1)} />}

          {currentSection === 'media' && <MediaSection onRefresh={() => setRefreshKey((value) => value + 1)} />}

          {currentSection === 'taxonomies' && <AdminFormSection title="Taxonomies" helper="Labels actifs par type de contenu.">
            <p className="text-sm text-slate-600">Services: {getActiveTaxonomyLabels('service_category').join(', ')}</p>
            <p className="text-sm text-slate-600">Projects: {getActiveTaxonomyLabels('project_category').join(', ')}</p>
            <p className="text-sm text-slate-600">Posts: {getActiveTaxonomyLabels('post_category').join(', ')}</p>
          </AdminFormSection>}

          {currentSection === 'users' && <AdminTable columns={['Nom', 'Email', 'Role', 'Status']} rows={<tr><td className="px-4 py-3">{user?.name || 'Admin'}</td><td className="px-4 py-3">{user?.email}</td><td className="px-4 py-3">admin</td><td className="px-4 py-3"><AdminStatusBadge status="active" /></td></tr>} />}

          {currentSection === 'settings' && (
            <AdminFormSection title="Branding & SEO" helper="Configuration globale CMS">
              <label className="block text-xs font-medium text-slate-600">Hero video URL</label>
              <input className="w-full rounded border border-slate-200 p-2 text-sm" defaultValue={settings.heroVideoUrl} onBlur={(event) => saveBrandSettings({ ...settings, heroVideoUrl: event.target.value })} />
              <label className="block text-xs font-medium text-slate-600">Logo text</label>
              <input className="w-full rounded border border-slate-200 p-2 text-sm" defaultValue={settings.textLogo} onBlur={(event) => saveBrandSettings({ ...settings, textLogo: event.target.value })} />
              <button className="rounded-lg bg-[#273a41] px-3 py-2 text-sm font-medium text-white" onClick={() => saveBrandSettings({ ...settings })}>Sauvegarder</button>
            </AdminFormSection>
          )}

          <footer className="text-center text-xs text-slate-500">SMOVE CMS · expérience back-office premium</footer>
        </main>
      </div>
    </div>
  );
}
