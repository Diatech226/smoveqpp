import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Briefcase, Calendar, FileText, FolderOpen, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Plus, Settings, Tags, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteCMSContent, ensureUniqueSlug, getCMSContent, type CMSContentItem, type ContentStatus, type ContentType, type PostBlock, upsertCMSContent } from '../../data/cmsContent';
import { deleteMediaFile, getMediaFiles, getMediaFileById, uploadMediaFile, type MediaFile, type MediaFolder, type MediaStatus, type MediaType } from '../../data/media';
import { getActiveTaxonomyLabels } from '../../data/taxonomies';
import { getBrandSettings, saveBrandSettings } from '../../data/brandSettings';

type FormState = Pick<CMSContentItem, 'title' | 'slug' | 'excerpt' | 'content' | 'status' | 'coverId' | 'videoUrl' | 'category' | 'publishedAt' | 'coverAltText'> & {
  galleryIds: string[];
  lockSlug: boolean;
  contentBlocks: PostBlock[];
};

const statuses: ContentStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived', 'removed'];
const emptyForm: FormState = { title: '', slug: '', excerpt: '', content: '', status: 'draft', coverId: '', coverAltText: '', galleryIds: [], videoUrl: '', category: '', publishedAt: '', lockSlug: false, contentBlocks: [] };

function statusQuickActions(type: ContentType): ContentStatus[] {
  return type === 'events' ? ['draft', 'scheduled', 'published', 'archived', 'removed'] : ['draft', 'review', 'published', 'archived', 'removed'];
}

function validate(form: FormState) {
  const errors: string[] = [];
  if (form.title.trim().length < 3) errors.push('Le titre doit contenir au moins 3 caractères.');
  if (form.excerpt.trim().length < 10) errors.push('Le résumé doit contenir au moins 10 caractères.');
  if (form.content.trim().length < 20) errors.push('Le contenu doit contenir au moins 20 caractères.');
  if (!form.category.trim()) errors.push('La catégorie est obligatoire.');
  if ((form.status === 'published' || form.status === 'scheduled') && !form.coverId) errors.push('Impossible de publier/scheduler sans cover media.');
  if ((form.status === 'published' || form.status === 'scheduled') && !form.coverAltText?.trim()) errors.push('Alt text de la cover requis pour publier.');
  if (form.status === 'scheduled' && !form.publishedAt) errors.push('Date de publication requise pour le statut scheduled.');
  return errors;
}

function MediaPicker({ selectedId, onSelect, acceptedType = 'image' }: { selectedId?: string; onSelect: (id: string) => void; acceptedType?: MediaType }) {
  const media = getMediaFiles().filter((item) => item.type === acceptedType || (acceptedType === 'image' && item.type === 'video'));
  return (
    <select className="border rounded-md p-2" value={selectedId || ''} onChange={(e) => onSelect(e.target.value)}>
      <option value="">Sélectionner un média</option>
      {media.map((file) => <option key={file.id} value={file.id}>{file.name} · {file.status}</option>)}
    </select>
  );
}

function ContentSection({ type, items, onRefresh }: { type: ContentType; items: CMSContentItem[]; onRefresh: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<CMSContentItem | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const taxonomyType = type === 'services' ? 'service_category' : type === 'projects' ? 'project_category' : 'post_category';
  const categoryOptions = getActiveTaxonomyLabels(taxonomyType);

  const save = () => {
    const all = getCMSContent();
    const slug = ensureUniqueSlug(all, form.slug || form.title, editing?.id, form.lockSlug);
    const payload = { ...form, slug };
    const nextErrors = validate(payload);
    if (nextErrors.length) return setErrors(nextErrors);

    const now = new Date().toISOString();
    upsertCMSContent({
      id: editing?.id || `${type}-${Date.now()}`,
      type,
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      content: payload.content,
      status: payload.status,
      coverId: payload.coverId,
      coverAltText: payload.coverAltText,
      galleryIds: payload.galleryIds,
      videoUrl: payload.videoUrl,
      category: payload.category,
      publishedAt: payload.status === 'scheduled' || payload.status === 'published' ? (payload.publishedAt || now) : null,
      contentBlocks: type === 'posts' ? payload.contentBlocks : [],
      viewsCount: editing?.viewsCount || 0,
      commentsCount: editing?.commentsCount || 0,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    });
    setErrors([]);
    setEditing(null);
    setForm(emptyForm);
    onRefresh();
  };

  const edit = (item: CMSContentItem) => {
    setEditing(item);
    setForm({
      title: item.title, slug: item.slug, excerpt: item.excerpt, content: item.content, status: item.status,
      coverId: item.coverId, coverAltText: item.coverAltText || '', galleryIds: item.galleryIds, videoUrl: item.videoUrl || '', category: item.category,
      publishedAt: item.publishedAt || '', lockSlug: false, contentBlocks: item.contentBlocks || [],
    });
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold">{type}</h2><button className="px-4 py-2 rounded bg-[#00b3e8] text-white" onClick={() => { setEditing(null); setForm(emptyForm); }}><Plus size={16} className="inline mr-2" />Nouveau</button></div>
    <div className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-2">
      <input className="border rounded p-2" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input className="border rounded p-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.lockSlug} onChange={(e) => setForm({ ...form, lockSlug: e.target.checked })} />Lock slug</label>
      <select className="border rounded p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Catégorie</option>{categoryOptions.map((o) => <option key={o}>{o}</option>)}</select>
      <textarea className="border rounded p-2 md:col-span-2" placeholder="Résumé" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
      <textarea className="border rounded p-2 md:col-span-2 min-h-24" placeholder="Contenu" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      <select className="border rounded p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
      <input className="border rounded p-2" type="datetime-local" value={form.publishedAt?.slice(0, 16) || ''} onChange={(e) => setForm({ ...form, publishedAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
      <MediaPicker selectedId={form.coverId} onSelect={(id) => setForm({ ...form, coverId: id })} />
      <input className="border rounded p-2" placeholder="Alt text cover" value={form.coverAltText || ''} onChange={(e) => setForm({ ...form, coverAltText: e.target.value })} />
      {type === 'posts' && <textarea className="border rounded p-2 md:col-span-2" placeholder="Blocks V2 (une ligne = paragraph)" value={form.contentBlocks.map((b) => b.data.text || '').join('\n')} onChange={(e) => setForm({ ...form, contentBlocks: e.target.value.split('\n').filter(Boolean).map((text, idx) => ({ id: `block-${idx}-${Date.now()}`, type: idx === 0 ? 'heading' : 'paragraph', data: { text } })) })} />}
      {errors.length > 0 && <ul className="md:col-span-2 text-red-600 text-sm list-disc pl-4">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
      <button className="px-4 py-2 rounded bg-[#273a41] text-white" onClick={save}>{editing ? 'Mettre à jour' : 'Créer'}</button>
    </div>

    <div className="bg-white border rounded-xl p-4 overflow-auto">
      <table className="w-full text-sm"><thead><tr className="text-left border-b"><th>Titre</th><th>Status</th><th>Slug</th><th>Actions rapides</th></tr></thead><tbody>
        {items.map((item) => <tr key={item.id} className="border-b"><td className="py-2">{item.title}</td><td>{item.status}</td><td>{item.slug}</td><td className="space-x-2 py-2">
          <select className="border rounded p-1" value={item.status} onChange={(e) => { upsertCMSContent({ ...item, status: e.target.value as ContentStatus, updatedAt: new Date().toISOString() }); onRefresh(); }}>{statusQuickActions(type).map((s) => <option key={s}>{s}</option>)}</select>
          <button className="px-2 py-1 border rounded" onClick={() => edit(item)}>Edit</button>
          <button className="px-2 py-1 border rounded text-red-600" onClick={() => { deleteCMSContent(item.id); onRefresh(); }}><Trash2 size={13} /></button>
        </td></tr>)}
      </tbody></table>
    </div>
  </div>;
}

function MediaLibrarySection({ onRefresh }: { onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [folder, setFolder] = useState<'all' | MediaFolder>('all');
  const [status, setStatus] = useState<'all' | MediaStatus>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const media = useMemo(() => getMediaFiles().filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesFolder = folder === 'all' || item.folder === folder;
    const matchesStatus = status === 'all' || item.status === status;
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) || item.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));
    return matchesType && matchesFolder && matchesStatus && matchesQuery;
  }), [query, filterType, folder, status]);

  const paged = media.slice((page - 1) * pageSize, page * pageSize);

  return <div className="space-y-4">
    <div className="bg-white border rounded-xl p-4 grid md:grid-cols-5 gap-2">
      <input className="border rounded p-2" placeholder="Recherche nom/tag" value={query} onChange={(e) => setQuery(e.target.value)} />
      <select className="border rounded p-2" value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | MediaType)}><option value="all">Type</option><option value="image">Image</option><option value="video">Video</option><option value="doc">Doc</option></select>
      <select className="border rounded p-2" value={folder} onChange={(e) => setFolder(e.target.value as 'all' | MediaFolder)}><option value="all">Folder</option>{['Brand', 'Blog', 'Projects', 'Social', 'Archive'].map((f) => <option key={f}>{f}</option>)}</select>
      <select className="border rounded p-2" value={status} onChange={(e) => setStatus(e.target.value as 'all' | MediaStatus)}><option value="all">Status</option>{['draft', 'approved', 'archived'].map((s) => <option key={s}>{s}</option>)}</select>
      <label className="px-4 py-2 rounded border text-center cursor-pointer">Upload<input hidden type="file" onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        await uploadMediaFile({ name: file.name, type: file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'doc', file, uploadedBy: 'admin', folder: 'Archive' });
        onRefresh();
      }} /></label>
    </div>
    <div className="grid md:grid-cols-4 gap-3">
      {paged.map((file: MediaFile) => <div key={file.id} className="bg-white border rounded-xl p-2 text-xs space-y-2">
        <div className="aspect-video bg-gray-100 rounded overflow-hidden">{file.type === 'image' ? <img src={file.variants.sm?.url || file.originalUrl} className="w-full h-full object-cover" /> : <div className="p-3">{file.type.toUpperCase()}</div>}</div>
        <p className="font-medium truncate">{file.name}</p>
        <p>{file.folder} · {file.status}</p>
        <div className="flex gap-2"><button className="px-2 py-1 border rounded" onClick={() => navigator.clipboard.writeText(file.originalUrl)}>Copy URL</button><button className="px-2 py-1 border rounded text-red-600" onClick={() => { deleteMediaFile(file.id); onRefresh(); }}>Delete</button></div>
      </div>)}
    </div>
    <div className="flex justify-between text-sm"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><span>Page {page}</span><button disabled={page * pageSize >= media.length} onClick={() => setPage((p) => p + 1)}>Next</button></div>
  </div>;
}

function SettingsSection() {
  const [settings, setSettings] = useState(getBrandSettings());
  return <div className="bg-white border rounded-xl p-4 space-y-3">
    <h3 className="font-semibold">Brand Center</h3>
    <textarea className="w-full border rounded p-2 min-h-44 font-mono text-xs" value={JSON.stringify(settings.brandTokens, null, 2)} onChange={(e) => {
      try { setSettings({ ...settings, brandTokens: JSON.parse(e.target.value) }); } catch { /* no-op */ }
    }} />
    <MediaPicker selectedId={settings.logoLightMediaId} onSelect={(id) => setSettings({ ...settings, logoLightMediaId: id })} />
    <MediaPicker selectedId={settings.logoDarkMediaId} onSelect={(id) => setSettings({ ...settings, logoDarkMediaId: id })} />
    <MediaPicker selectedId={settings.defaultOgMediaId} onSelect={(id) => setSettings({ ...settings, defaultOgMediaId: id })} />
    <button className="px-4 py-2 bg-[#273a41] text-white rounded" onClick={() => saveBrandSettings(settings)}>Sauvegarder</button>
  </div>;
}

export default function CMSDashboard({ currentSection, onSectionChange }: { currentSection: string; onSectionChange: (section: string) => void }) {
  const { user, logout, canAccessCMS } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const allContent = useMemo(() => getCMSContent(), [refreshKey]);
  const mediaFiles = getMediaFiles();

  if (!canAccessCMS) return null;

  const menuItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'posts', label: 'Articles', icon: FileText },
    { id: 'events', label: 'Évènements', icon: Calendar },
    { id: 'media', label: 'Médiathèque', icon: ImageIcon },
    { id: 'taxonomies', label: 'Catégories', icon: Tags },
    { id: 'settings', label: 'Brand Center', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
  ];

  return <div className="min-h-screen bg-[#f5f9fa] flex">
    <motion.aside className={`fixed left-0 top-0 h-full bg-white shadow-xl z-50 ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
      <div className="p-4 border-b flex justify-between"><strong>SMOVE CMS</strong><button onClick={() => setSidebarOpen((v) => !v)}>{sidebarOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
      <nav className="p-3 space-y-1">{menuItems.map((item) => <button key={item.id} onClick={() => onSectionChange(item.id)} className={`w-full flex items-center gap-2 p-2 rounded ${currentSection === item.id ? 'bg-[#00b3e8] text-white' : 'hover:bg-[#f5f9fa]'}`}><item.icon size={16} />{sidebarOpen && item.label}</button>)}</nav>
      <div className="absolute bottom-0 w-full p-3 border-t"><button onClick={async () => { await logout(); window.location.hash = 'login'; }} className="w-full flex items-center gap-2 text-red-600"><LogOut size={16} />{sidebarOpen && 'Déconnexion'}</button></div>
    </motion.aside>
    <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-6 space-y-6`}>
      {currentSection === 'overview' && <div className="grid lg:grid-cols-4 gap-3">{[
        ['Contenus', allContent.length],
        ['Media', mediaFiles.length],
        ['Published', allContent.filter((c) => c.status === 'published').length],
        ['Scheduled', allContent.filter((c) => c.status === 'scheduled').length],
      ].map(([label, value]) => <div key={String(label)} className="bg-white border rounded-xl p-4"><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-semibold">{value}</p></div>)}</div>}
      {(['services', 'projects', 'posts', 'events'] as ContentType[]).includes(currentSection as ContentType) && <ContentSection type={currentSection as ContentType} items={allContent.filter((item) => item.type === currentSection)} onRefresh={() => setRefreshKey((k) => k + 1)} />}
      {currentSection === 'media' && <MediaLibrarySection onRefresh={() => setRefreshKey((k) => k + 1)} />}
      {currentSection === 'taxonomies' && <div className="bg-white border rounded-xl p-4 text-sm"><p>Service categories: {getActiveTaxonomyLabels('service_category').join(', ')}</p><p>Project categories: {getActiveTaxonomyLabels('project_category').join(', ')}</p><p>Post categories: {getActiveTaxonomyLabels('post_category').join(', ')}</p></div>}
      {currentSection === 'settings' && <SettingsSection />}
      {currentSection === 'users' && <div className="bg-white border rounded-xl p-4">Connecté: {user?.email}</div>}
      {currentSection === 'posts' && <div className="bg-white border rounded-xl p-4 text-sm">Blog V2 sidebar: plus commentés via commentsCount + même rubrique par catégorie (fallback automatique).</div>}
      {currentSection !== 'settings' && getMediaFileById('') === undefined ? null : null}
    </main>
  </div>;
}
