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
import {
  deleteCMSContent,
  ensureUniqueSlug,
  getCMSContent,
  getCMSCategories,
  upsertCMSContent,
  type CMSContentItem,
  type ContentStatus,
  type ContentType,
} from '../../data/cmsContent';
import { deleteMediaFile, getMediaFiles, uploadMediaFile } from '../../data/media';
import { getActiveTaxonomyLabels } from '../../data/taxonomies';
import { getBrandSettings, saveBrandSettings } from '../../data/brandSettings';
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminEmptyState,
  AdminFiltersBar,
  AdminFormSection,
  AdminPageHeader,
  AdminSearchInput,
  AdminShell,
  AdminSidebar,
  AdminStatsCards,
  AdminStatusBadge,
  AdminTopbar,
  CoverPreviewCard,
  MediaPicker,
  PreviewButton,
  QuickStatusActions,
} from './admin/AdminUI';

type CMSSection =
  | 'overview'
  | 'services'
  | 'projects'
  | 'posts'
  | 'events'
  | 'media'
  | 'taxonomies'
  | 'settings'
  | 'users';

const menuItems: Array<{ id: CMSSection; label: string; icon: typeof LayoutDashboard }> = [
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

const workflowStatuses: Array<'draft' | 'review' | 'scheduled' | 'published' | 'archived'> = [
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
];

function ContentSection({ type, items, onRefresh }: { type: ContentType; items: CMSContentItem[]; onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => getCMSCategories(items), [items]);
  const filtered = items.filter((item) => {
    const needle = query.toLowerCase();
    return item.title.toLowerCase().includes(needle) || item.slug.toLowerCase().includes(needle);
  });

  const createItem = () => {
    if (title.trim().length < 3) return;
    const all = getCMSContent();
    const now = new Date().toISOString();
    const slug = ensureUniqueSlug(all, title);

    upsertCMSContent({
      id: `${type}-${Date.now()}`,
      type,
      title: title.trim(),
      slug,
      excerpt: 'Résumé à compléter',
      content: 'Contenu à compléter',
      status,
      category: category || 'general',
      coverId: '',
      coverAltText: '',
      galleryIds: [],
      videoUrl: '',
      publishedAt: status === 'published' ? now : null,
      viewsCount: 0,
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    setTitle('');
    setCategory('');
    setStatus('draft');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title={`Gestion ${type}`} description="Interface CRUD rapide, claire et homogène." />
      <AdminFiltersBar>
        <AdminSearchInput value={query} onChange={setQuery} placeholder={`Rechercher dans ${type}`} />
        <button onClick={createItem} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          <Plus size={15} className="mr-1 inline" /> Nouveau
        </button>
      </AdminFiltersBar>

      <AdminFormSection title="Création rapide" helper="Informations principales, SEO slug auto, statut éditorial.">
        <div className="grid gap-3 lg:grid-cols-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border border-slate-200 p-2.5 text-sm" placeholder="Titre" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} list={`category-${type}`} className="rounded-xl border border-slate-200 p-2.5 text-sm" placeholder="Catégorie" />
          <datalist id={`category-${type}`}>{categories.map((entry) => <option key={entry} value={entry} />)}</datalist>
          <select value={status} onChange={(e) => setStatus(e.target.value as ContentStatus)} className="rounded-xl border border-slate-200 p-2.5 text-sm">
            {workflowStatuses.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
          <button onClick={createItem} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">Save draft</button>
        </div>
      </AdminFormSection>

      {!filtered.length ? (
        <AdminEmptyState title="Aucun élément trouvé" description="Créez un contenu ou ajustez vos filtres." />
      ) : (
        <AdminDataTable
          columns={['Titre', 'Cover', 'Catégorie', 'Statut', 'Date', 'Actions']}
          rows={filtered.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 align-top">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">/{item.slug}</p>
              </td>
              <td className="px-4 py-3"><CoverPreviewCard title={item.title} src={undefined} /></td>
              <td className="px-4 py-3 text-slate-600">{item.category}</td>
              <td className="px-4 py-3">
                <AdminStatusBadge status={item.status} />
                <div className="mt-2">
                  <QuickStatusActions
                    status={item.status}
                    onChange={(nextStatus) => {
                      upsertCMSContent({ ...item, status: nextStatus, updatedAt: new Date().toISOString() });
                      onRefresh();
                    }}
                  />
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.updatedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <PreviewButton onClick={() => window.alert(`Preview ${item.title}`)} />
                  <AdminConfirmDialog label={item.title} onConfirm={() => { deleteCMSContent(item.id); onRefresh(); }} />
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
      <AdminPageHeader title="Media Library" description="Bibliothèque média avec grille, preview et actions rapides." />
      <AdminFiltersBar>
        <AdminSearchInput value={query} onChange={setQuery} placeholder="Rechercher un média" />
        <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
          <Upload size={14} className="mr-1 inline" /> Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await uploadMediaFile({ file, name: file.name, type: 'image', uploadedBy: 'admin' });
              onRefresh();
              event.target.value = '';
            }}
          />
        </label>
      </AdminFiltersBar>

      {!files.length ? (
        <AdminEmptyState title="Médiathèque vide" description="Importez vos premières images pour alimenter vos contenus." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {files.map((file) => (
            <MediaPicker key={file.id}>
              <img src={file.variants.thumb?.url || file.originalUrl} alt={file.altText || file.name} className="h-40 w-full rounded-lg bg-slate-100 object-cover" />
              <p className="mt-2 truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">{file.folder} · {(file.size / 1024).toFixed(1)} KB</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => navigator.clipboard?.writeText(file.originalUrl)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Copy URL</button>
                <button onClick={() => window.alert(`Use ${file.name} as cover`)} className="rounded-lg border border-cyan-200 px-2 py-1 text-xs text-cyan-700">Use as cover</button>
                <AdminConfirmDialog label={file.name} onConfirm={() => { deleteMediaFile(file.id); onRefresh(); }} />
              </div>
            </MediaPicker>
          ))}
        </div>
      )}
    </div>
  );
}

export function CMSDashboard({ currentSection, onSectionChange }: { currentSection: CMSSection; onSectionChange: (section: CMSSection) => void }) {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const allContent = useMemo(() => getCMSContent(), [refreshKey]);
  const settings = useMemo(() => getBrandSettings(), [refreshKey]);

  const contentInReview = allContent.filter((item) => item.status === 'review');
  const recent = [...allContent].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6);

  const stats = [
    { label: 'Total contenus', value: allContent.length, hint: 'Tous modules CMS' },
    { label: 'Published', value: allContent.filter((x) => x.status === 'published').length, hint: 'En ligne' },
    { label: 'Review', value: contentInReview.length, hint: 'À valider' },
    { label: 'Media files', value: getMediaFiles().length, hint: 'Bibliothèque' },
  ];

  const selectedLabel = menuItems.find((item) => item.id === currentSection)?.label ?? 'Dashboard';

  return (
    <AdminShell
      sidebar={
        <AdminSidebar
          items={menuItems}
          activeId={currentSection}
          onChange={(id) => onSectionChange(id as CMSSection)}
          profileSlot={<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{user?.email ?? 'admin@smove.local'}</div>}
          footerSlot={<button className="flex w-full items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600" onClick={async () => { await logout(); window.location.hash = 'login'; }}><LogOut size={16} />Déconnexion</button>}
        />
      }
      topbar={
        <AdminTopbar
          title={selectedLabel}
          subtitle="Back-office premium orienté productivité"
          search={search}
          onSearch={setSearch}
          onCreate={() => onSectionChange('posts')}
          userSlot={<div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">{user?.name ?? 'Admin'}</div>}
        />
      }
    >
      {currentSection === 'overview' && (
        <div className="space-y-4">
          <AdminStatsCards stats={stats} />
          <div className="grid gap-4 xl:grid-cols-2">
            <AdminFormSection title="Quick actions" helper="Accès instantanés aux actions fréquentes.">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onSectionChange('posts')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">+ Article</button>
                <button onClick={() => onSectionChange('projects')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">+ Projet</button>
                <button onClick={() => onSectionChange('media')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Upload média</button>
                <button onClick={() => onSectionChange('settings')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Paramètres</button>
              </div>
            </AdminFormSection>
            <AdminFormSection title="Activité récente" helper="Derniers contenus modifiés.">
              {recent.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.type}</p>
                  </div>
                  <AdminStatusBadge status={item.status} />
                </div>
              ))}
            </AdminFormSection>
          </div>
        </div>
      )}

      {(currentSection === 'posts' || currentSection === 'services' || currentSection === 'projects' || currentSection === 'events') && (
        <ContentSection
          type={currentSection}
          items={allContent.filter((item) => item.type === currentSection).filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))}
          onRefresh={() => setRefreshKey((value) => value + 1)}
        />
      )}

      {currentSection === 'media' && <MediaSection onRefresh={() => setRefreshKey((value) => value + 1)} />}

      {currentSection === 'taxonomies' && (
        <AdminFormSection title="Categories & Taxonomies" helper="Labels actifs disponibles dans les formulaires.">
          <p className="text-sm text-slate-700">Services: {getActiveTaxonomyLabels('service_category').join(', ') || 'N/A'}</p>
          <p className="text-sm text-slate-700">Projects: {getActiveTaxonomyLabels('project_category').join(', ') || 'N/A'}</p>
          <p className="text-sm text-slate-700">Posts: {getActiveTaxonomyLabels('post_category').join(', ') || 'N/A'}</p>
        </AdminFormSection>
      )}

      {currentSection === 'users' && (
        <AdminDataTable
          columns={['Nom', 'Email', 'Role', 'Status']}
          rows={<tr><td className="px-4 py-3">{user?.name || 'Admin'}</td><td className="px-4 py-3">{user?.email}</td><td className="px-4 py-3">admin</td><td className="px-4 py-3"><AdminStatusBadge status="active" /></td></tr>}
        />
      )}

      {currentSection === 'settings' && (
        <AdminFormSection title="Settings" helper="Branding, SEO, CMS et hero video.">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Hero video URL</label>
              <input className="w-full rounded-xl border border-slate-200 p-2.5 text-sm" defaultValue={settings.heroVideoUrl} onBlur={(e) => saveBrandSettings({ ...settings, heroVideoUrl: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Logo text</label>
              <input className="w-full rounded-xl border border-slate-200 p-2.5 text-sm" defaultValue={settings.textLogo} onBlur={(e) => saveBrandSettings({ ...settings, textLogo: e.target.value })} />
            </div>
          </div>
          <button className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white" onClick={() => saveBrandSettings({ ...settings })}>Sauvegarder</button>
        </AdminFormSection>
      )}
    </AdminShell>
  );
}

export default CMSDashboard;
