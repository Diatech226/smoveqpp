import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Archive, Briefcase, Calendar, Eye, FileText, FolderOpen, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Plus, Send, Settings, Tags, Trash2, Upload, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteCMSContent, ensureUniqueSlug, getCMSContent, type CMSContentItem, type ContentStatus, type ContentType, type PostBlock, upsertCMSContent } from '../../data/cmsContent';
import { deleteMediaFile, getMediaFiles, uploadMediaFile, type MediaFile, type MediaFolder, type MediaType } from '../../data/media';
import { getActiveTaxonomyLabels } from '../../data/taxonomies';
import { getBrandSettings, saveBrandSettings } from '../../data/brandSettings';
import { createPreviewToken } from '../../data/previewTokens';

type FormState = Pick<CMSContentItem, 'title' | 'slug' | 'excerpt' | 'content' | 'status' | 'coverId' | 'videoUrl' | 'category' | 'publishedAt' | 'coverAltText'> & {
  galleryIds: string[];
  lockSlug: boolean;
  contentBlocks: PostBlock[];
};

const statuses: ContentStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived', 'removed'];
const emptyForm: FormState = { title: '', slug: '', excerpt: '', content: '', status: 'draft', coverId: '', coverAltText: '', galleryIds: [], videoUrl: '', category: '', publishedAt: '', lockSlug: false, contentBlocks: [] };

function validate(form: FormState) {
  const errors: string[] = [];
  const normalizedSlug = form.slug.trim();
  if (form.title.trim().length < 3) errors.push('Le titre doit contenir au moins 3 caractères.');
  if (!normalizedSlug) errors.push('Le slug est obligatoire.');
  if (normalizedSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    errors.push('Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets.');
  }
  if (form.excerpt.trim().length < 10) errors.push('Le résumé doit contenir au moins 10 caractères.');
  if (form.content.trim().length < 20) errors.push('Le contenu doit contenir au moins 20 caractères.');
  if (!form.category.trim()) errors.push('La catégorie est obligatoire.');
  if ((form.status === 'published' || form.status === 'scheduled') && !form.coverId) errors.push('Impossible de publier/scheduler sans cover media.');
  if ((form.status === 'published' || form.status === 'scheduled') && !form.coverAltText?.trim()) errors.push('Alt text de la cover requis pour publier.');
  if (form.status === 'scheduled' && !form.publishedAt) errors.push('Date de publication requise pour le statut scheduled.');
  return errors;
}

function SkeletonBlock() {
  return <div className="bg-white border rounded-xl p-4 animate-pulse h-24" />;
}

function MediaPicker({ selectedId, onSelect, acceptedType = 'image' }: { selectedId?: string; onSelect: (id: string) => void; acceptedType?: MediaType }) {
  const media = getMediaFiles().filter((item) => item.type === acceptedType || (acceptedType === 'image' && item.type === 'video'));
  return (
    <select className="border rounded-md p-2" value={selectedId || ''} onChange={(e) => onSelect(e.target.value)}>
      <option value="">Sélectionner un média</option>
      {media.map((file) => <option key={file.id} value={file.id}>{file.name}</option>)}
    </select>
  );
}

function ContentSection({ type, items, onRefresh, notify }: { type: ContentType; items: CMSContentItem[]; onRefresh: () => void; notify: (kind: 'success' | 'error', message: string) => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<CMSContentItem | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const taxonomyType = type === 'services' ? 'service_category' : type === 'projects' ? 'project_category' : 'post_category';
  const categoryOptions = getActiveTaxonomyLabels(taxonomyType);

  const save = () => {
    const all = getCMSContent();
    const slug = ensureUniqueSlug(all, form.slug || form.title, editing?.id, form.lockSlug);
    if (!slug) {
      setErrors(['Impossible de générer un slug valide.']);
      return;
    }
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
    notify('success', editing ? 'Contenu mis à jour.' : 'Contenu créé.');
  };

  const edit = (item: CMSContentItem) => {
    setErrors([]);
    setEditing(item);
    setForm({
      title: item.title, slug: item.slug, excerpt: item.excerpt, content: item.content, status: item.status,
      coverId: item.coverId, coverAltText: item.coverAltText || '', galleryIds: item.galleryIds, videoUrl: item.videoUrl || '', category: item.category,
      publishedAt: item.publishedAt || '', lockSlug: false, contentBlocks: item.contentBlocks || [],
    });
  };

  const setQuickStatus = (item: CMSContentItem, status: ContentStatus) => {
    if (status === 'published' && (!item.coverId || !item.coverAltText?.trim())) {
      notify('error', 'Pour publier, définissez une cover et un alt text.');
      return;
    }
    const now = new Date().toISOString();
    upsertCMSContent({
      ...item,
      status,
      publishedAt: status === 'published' ? (item.publishedAt || now) : status === 'scheduled' ? (item.publishedAt || now) : item.publishedAt,
      updatedAt: now,
    });
    onRefresh();
    notify('success', `Statut mis à jour: ${status}`);
  };

  const preview = (item: CMSContentItem) => {
    const token = createPreviewToken(type, item.id);
    window.open(`#preview-${type}-${item.id}?token=${token}`, '_blank', 'noopener,noreferrer');
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold capitalize">{type}</h2><button className="px-4 py-2 rounded bg-[#00b3e8] text-white" onClick={() => { setEditing(null); setForm(emptyForm); }}><Plus size={16} className="inline mr-2" />Nouveau</button></div>

    <div className="bg-white border rounded-xl p-4 space-y-4">
      <h3 className="font-semibold">Contenu</h3>
      <div className="grid md:grid-cols-2 gap-2">
        <input className="border rounded p-2" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="border rounded p-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.lockSlug} onChange={(e) => setForm({ ...form, lockSlug: e.target.checked })} />Lock slug</label>
        <select className="border rounded p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Catégorie</option>{categoryOptions.map((o) => <option key={o}>{o}</option>)}</select>
        <textarea className="border rounded p-2 md:col-span-2" placeholder="Résumé" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <textarea className="border rounded p-2 md:col-span-2 min-h-28" placeholder="Contenu" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </div>

      <h3 className="font-semibold">Média</h3>
      <div className="grid md:grid-cols-2 gap-2">
        <MediaPicker selectedId={form.coverId} onSelect={(id) => setForm({ ...form, coverId: id })} />
        <input className="border rounded p-2" placeholder="Alt text cover" value={form.coverAltText || ''} onChange={(e) => setForm({ ...form, coverAltText: e.target.value })} />
        <input className="border rounded p-2 md:col-span-2" placeholder="URL vidéo (optionnel)" value={form.videoUrl || ''} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
      </div>

      <h3 className="font-semibold">Publication</h3>
      <div className="grid md:grid-cols-2 gap-2">
        <select className="border rounded p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input className="border rounded p-2" type="datetime-local" disabled={form.status !== 'scheduled'} value={form.publishedAt?.slice(0, 16) || ''} onChange={(e) => setForm({ ...form, publishedAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
      </div>

      {type === 'posts' && <><h3 className="font-semibold">SEO & blocks article</h3><textarea className="border rounded p-2 w-full" placeholder="Une ligne = un bloc" value={form.contentBlocks.map((b) => b.data.text || '').join('\n')} onChange={(e) => setForm({ ...form, contentBlocks: e.target.value.split('\n').filter(Boolean).map((text, idx) => ({ id: `block-${idx}-${Date.now()}`, type: idx === 0 ? 'heading' : 'paragraph', data: { text } })) })} /></>}

      {errors.length > 0 && <ul className="text-red-600 text-sm list-disc pl-4">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-[#273a41] text-white" onClick={save}>{editing ? 'Mettre à jour' : 'Créer'}</button>
        {editing && <button className="px-4 py-2 rounded border" onClick={() => preview(editing)}><Eye size={14} className="inline mr-2" />Preview</button>}
      </div>
    </div>

    <div className="bg-white border rounded-xl p-4 overflow-auto">
      {items.length === 0 ? <p className="text-sm text-gray-500">Aucun contenu pour le moment.</p> : <table className="w-full text-sm"><thead><tr className="text-left border-b"><th>Titre</th><th>Statut</th><th>Slug</th><th>Actions rapides</th></tr></thead><tbody>
        {items.map((item) => <tr key={item.id} className="border-b"><td className="py-2">{item.title}</td><td>{item.status}</td><td>{item.slug}</td><td className="space-x-2 py-2">
          <button className="px-2 py-1 border rounded" onClick={() => setQuickStatus(item, 'review')}><Send size={13} className="inline mr-1"/>Review</button>
          <button className="px-2 py-1 border rounded" onClick={() => setQuickStatus(item, 'published')}><Eye size={13} className="inline mr-1"/>Publier</button>
          <button className="px-2 py-1 border rounded" onClick={() => setQuickStatus(item, 'archived')}><Archive size={13} className="inline mr-1"/>Archiver</button>
          <button className="px-2 py-1 border rounded" onClick={() => preview(item)}>Preview</button>
          <button className="px-2 py-1 border rounded" onClick={() => edit(item)}>Edit</button>
          <button className="px-2 py-1 border rounded text-red-600" onClick={() => { if (!window.confirm(`Supprimer définitivement « ${item.title} » ?`)) return; deleteCMSContent(item.id); onRefresh(); notify('success', 'Contenu supprimé.'); }}><Trash2 size={13} /></button>
        </td></tr>)}
      </tbody></table>}
    </div>
  </div>;
}

function MediaLibrarySection({ onRefresh, notify }: { onRefresh: () => void; notify: (kind: 'success' | 'error', message: string) => void }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [folder, setFolder] = useState<'all' | MediaFolder>('all');
  const [date, setDate] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [coverTarget, setCoverTarget] = useState('');

  const contentTargets = getCMSContent();
  const media = useMemo(() => getMediaFiles().filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesFolder = folder === 'all' || item.folder === folder;
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchesDate = !date || item.uploadedDate.slice(0, 10) === date;
    return matchesType && matchesFolder && matchesQuery && matchesDate;
  }), [query, filterType, folder, date]);

  const selectedPreview = previewId ? media.find((item) => item.id === previewId) : null;

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await Promise.all(Array.from(files).map((file) => uploadMediaFile({ name: file.name, type: file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'doc', file, uploadedBy: 'admin', folder: 'Archive' })));
    onRefresh();
    notify('success', `${files.length} média uploadé(s).`);
  };

  return <div className="space-y-4">
    <div className="bg-white border rounded-xl p-4 grid md:grid-cols-6 gap-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleUploadFiles(e.dataTransfer.files); }}>
      <input className="border rounded p-2" placeholder="Recherche nom" value={query} onChange={(e) => setQuery(e.target.value)} />
      <select className="border rounded p-2" value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | MediaType)}><option value="all">Type</option><option value="image">Image</option><option value="video">Video</option></select>
      <select className="border rounded p-2" value={folder} onChange={(e) => setFolder(e.target.value as 'all' | MediaFolder)}><option value="all">Folder</option>{['Brand', 'Blog', 'Projects', 'Social', 'Archive'].map((f) => <option key={f}>{f}</option>)}</select>
      <input className="border rounded p-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <select className="border rounded p-2" value={coverTarget} onChange={(e) => setCoverTarget(e.target.value)}><option value="">Utiliser comme cover...</option>{contentTargets.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <label className="px-4 py-2 rounded border text-center cursor-pointer"><Upload size={14} className="inline mr-2" />Multi-upload<input hidden multiple type="file" onChange={(e) => void handleUploadFiles(e.target.files)} /></label>
    </div>

    {media.length === 0 && <div className="bg-white border rounded-xl p-6 text-sm text-gray-500">Aucun média trouvé pour ce filtre.</div>}
    <div className="grid md:grid-cols-4 gap-3">
      {media.map((file: MediaFile) => <div key={file.id} className="bg-white border rounded-xl p-2 text-xs space-y-2">
        <button onClick={() => setPreviewId(file.id)} className="w-full aspect-video bg-gray-100 rounded overflow-hidden">
          {file.type === 'image' ? <img src={file.variants.sm?.url || file.originalUrl} className="w-full h-full object-cover" /> : <div className="p-3">{file.type.toUpperCase()}</div>}
        </button>
        <p className="font-medium truncate">{file.name}</p>
        <p>{file.folder} · {new Date(file.uploadedDate).toLocaleDateString()}</p>
        <p className="truncate">Variants: {Object.keys(file.variants).join(', ') || 'none'}</p>
        <div className="flex gap-2 flex-wrap"><button className="px-2 py-1 border rounded" onClick={() => {
          void navigator.clipboard.writeText(file.originalUrl)
            .then(() => notify('success', 'URL copiée.'))
            .catch(() => notify('error', 'Impossible de copier l\'URL.'));
        }}>Copy URL</button>{coverTarget && <button className="px-2 py-1 border rounded" onClick={() => { const target = contentTargets.find((item) => item.id === coverTarget); if (!target) return; upsertCMSContent({ ...target, coverId: file.id, coverAltText: target.coverAltText || file.alt || file.name, updatedAt: new Date().toISOString() }); onRefresh(); notify('success', 'Cover mise à jour.'); }}>Use as cover</button>}<button className="px-2 py-1 border rounded text-red-600" onClick={() => { if (!window.confirm(`Supprimer ${file.name} ?`)) return; deleteMediaFile(file.id); onRefresh(); notify('success', 'Média supprimé.'); }}>Delete</button></div>
      </div>)}
    </div>

    {selectedPreview && <div className="bg-white border rounded-xl p-4 space-y-2"><h3 className="font-semibold">Preview média</h3>{selectedPreview.type === 'image' ? <img src={selectedPreview.variants.lg?.url || selectedPreview.originalUrl} className="max-h-[420px] rounded" /> : <p>{selectedPreview.name}</p>}<p className="text-sm">Variantes: {Object.entries(selectedPreview.variants).map(([key, variant]) => `${key}(${variant.width || '-'}x${variant.height || '-'})`).join(' · ') || 'Aucune'}</p></div>}
  </div>;
}

function SettingsSection({ notify }: { notify: (kind: 'success' | 'error', message: string) => void }) {
  const [settings, setSettings] = useState(getBrandSettings());
  return <div className="bg-white border rounded-xl p-4 space-y-3">
    <h3 className="font-semibold">Brand Center</h3>
    <textarea className="w-full border rounded p-2 min-h-44 font-mono text-xs" value={JSON.stringify(settings.brandTokens, null, 2)} onChange={(e) => {
      try { setSettings({ ...settings, brandTokens: JSON.parse(e.target.value) }); } catch { /* no-op */ }
    }} />
    <MediaPicker selectedId={settings.logoLightMediaId} onSelect={(id) => setSettings({ ...settings, logoLightMediaId: id })} />
    <MediaPicker selectedId={settings.logoDarkMediaId} onSelect={(id) => setSettings({ ...settings, logoDarkMediaId: id })} />
    <MediaPicker selectedId={settings.defaultOgMediaId} onSelect={(id) => setSettings({ ...settings, defaultOgMediaId: id })} />
    <button className="px-4 py-2 bg-[#273a41] text-white rounded" onClick={() => { saveBrandSettings(settings); notify('success', 'Paramètres sauvegardés.'); }}>Sauvegarder</button>
  </div>;
}

export default function CMSDashboard({ currentSection, onSectionChange }: { currentSection: string; onSectionChange: (section: string) => void }) {
  const { user, logout, canAccessCMS } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [currentSection, refreshKey]);

  const allContent = useMemo(() => getCMSContent(), [refreshKey]);
  const mediaFiles = getMediaFiles();

  const notify = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 2200);
  };

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

  const byType = (contentType: ContentType) => allContent.filter((item) => item.type === contentType);

  return <div className="min-h-screen bg-[#f5f9fa] flex">
    <motion.aside className={`fixed left-0 top-0 h-full bg-white shadow-xl z-50 ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
      <div className="p-4 border-b flex justify-between"><strong>SMOVE CMS</strong><button onClick={() => setSidebarOpen((v) => !v)}>{sidebarOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
      <nav className="p-3 space-y-1">{menuItems.map((item) => <button key={item.id} onClick={() => onSectionChange(item.id)} className={`w-full flex items-center gap-2 p-2 rounded ${currentSection === item.id ? 'bg-[#00b3e8] text-white' : 'hover:bg-[#f5f9fa]'}`}><item.icon size={16} />{sidebarOpen && item.label}</button>)}</nav>
      <div className="absolute bottom-0 w-full p-3 border-t"><button onClick={async () => { await logout(); window.location.hash = 'login'; }} className="w-full flex items-center gap-2 text-red-600"><LogOut size={16} />{sidebarOpen && 'Déconnexion'}</button></div>
    </motion.aside>

    <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-6 space-y-6`}>
      {loading && <div className="grid md:grid-cols-3 gap-3"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div>}
      {!loading && currentSection === 'overview' && <div className="space-y-4">
        <div className="grid lg:grid-cols-3 gap-3">{[
          ['Articles', byType('posts').length],
          ['Projets', byType('projects').length],
          ['Services', byType('services').length],
          ['Évènements', byType('events').length],
          ['Media', mediaFiles.length],
          ['Utilisateurs', user ? 1 : 0],
        ].map(([label, value]) => <div key={String(label)} className="bg-white border rounded-xl p-4"><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-semibold">{value}</p></div>)}</div>
        <div className="grid lg:grid-cols-4 gap-3">{[
          ['Brouillons', allContent.filter((c) => c.status === 'draft').length],
          ['En review', allContent.filter((c) => c.status === 'review').length],
          ['Programmés', allContent.filter((c) => c.status === 'scheduled').length],
          ['Récents (7j)', allContent.filter((c) => Date.now() - new Date(c.updatedAt).getTime() <= 7 * 86400000).length],
        ].map(([label, value]) => <div key={String(label)} className="bg-white border rounded-xl p-4"><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-semibold">{value}</p></div>)}</div>
      </div>}

      {!loading && (['services', 'projects', 'posts', 'events'] as ContentType[]).includes(currentSection as ContentType) && <ContentSection type={currentSection as ContentType} items={allContent.filter((item) => item.type === currentSection)} onRefresh={() => setRefreshKey((k) => k + 1)} notify={notify} />}
      {!loading && currentSection === 'media' && <MediaLibrarySection onRefresh={() => setRefreshKey((k) => k + 1)} notify={notify} />}
      {!loading && currentSection === 'taxonomies' && <div className="bg-white border rounded-xl p-4 text-sm"><p>Service categories: {getActiveTaxonomyLabels('service_category').join(', ')}</p><p>Project categories: {getActiveTaxonomyLabels('project_category').join(', ')}</p><p>Post categories: {getActiveTaxonomyLabels('post_category').join(', ')}</p></div>}
      {!loading && currentSection === 'settings' && <SettingsSection notify={notify} />}
      {!loading && currentSection === 'users' && <div className="bg-white border rounded-xl p-4">Connecté: {user?.email}</div>}

      {toast && <div className={`fixed bottom-6 right-6 px-4 py-2 rounded text-white ${toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>{toast.message}</div>}
    </main>
  </div>;
}
