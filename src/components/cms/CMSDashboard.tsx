import { motion } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
  Plus,
  Briefcase,
  Calendar,
  Tags,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMediaFileById, getMediaFiles } from '../../data/media';
import {
  deleteCMSContent,
  ensureUniqueSlug,
  getCMSCategories,
  getCMSContent,
  type CMSContentItem,
  type ContentStatus,
  type ContentType,
  upsertCMSContent,
} from '../../data/cmsContent';

interface CMSDashboardProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

type FormState = Pick<CMSContentItem, 'title' | 'slug' | 'excerpt' | 'content' | 'status' | 'coverId' | 'videoUrl' | 'category'> & { galleryIds: string[] };

const typeMap: { key: ContentType; label: string }[] = [
  { key: 'services', label: 'Services' },
  { key: 'projects', label: 'Projets' },
  { key: 'posts', label: 'Articles' },
  { key: 'events', label: 'Évènements' },
];

const statusOptions: ContentStatus[] = ['draft', 'review', 'published', 'archived'];

const emptyForm: FormState = {
  title: '', slug: '', excerpt: '', content: '', status: 'draft', coverId: '', galleryIds: [], videoUrl: '', category: '',
};

function slugify(value: string) {
  return value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function validate(form: FormState, type: ContentType) {
  const errors: string[] = [];
  if (form.title.trim().length < 3) errors.push('Le titre doit contenir au moins 3 caractères.');
  if (form.excerpt.trim().length < 10) errors.push('Le résumé doit contenir au moins 10 caractères.');
  if (form.content.trim().length < 20) errors.push('Le contenu doit contenir au moins 20 caractères.');
  if (!form.category.trim()) errors.push('La catégorie est obligatoire.');
  if (!slugify(form.slug || form.title)) errors.push('Le slug est invalide.');
  if (form.status === 'published' && !form.coverId) errors.push('Une cover est obligatoire pour publier.');
  if (type !== 'posts' && form.videoUrl?.trim()) errors.push('La vidéo est réservée aux articles.');
  if (form.videoUrl && !/^https?:\/\//.test(form.videoUrl)) errors.push('URL vidéo invalide (http/https).');
  return errors;
}

function ContentSection({ type, items, onRefresh }: { type: ContentType; items: CMSContentItem[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<CMSContentItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const media = getMediaFiles();

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors([]);
  };

  const openCreate = () => {
    reset();
    setFeedback('');
  };

  const openEdit = (item: CMSContentItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content,
      status: item.status,
      coverId: item.coverId,
      galleryIds: item.galleryIds,
      videoUrl: item.videoUrl || '',
      category: item.category,
    });
    setFeedback('');
    setErrors([]);
  };

  const save = () => {
    const all = getCMSContent();
    const payload: FormState = { ...form, slug: ensureUniqueSlug(all, form.slug || form.title, editing?.id) };
    const nextErrors = validate(payload, type);
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    upsertCMSContent({
      id: editing?.id || `${type}-${Date.now()}`,
      type,
      title: payload.title.trim(),
      slug: payload.slug,
      excerpt: payload.excerpt.trim(),
      content: payload.content.trim(),
      status: payload.status,
      coverId: payload.coverId,
      galleryIds: payload.galleryIds,
      videoUrl: type === 'posts' ? payload.videoUrl?.trim() : '',
      category: payload.category.trim(),
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    });
    setSaving(false);
    setFeedback(editing ? 'Contenu mis à jour.' : 'Contenu créé.');
    reset();
    onRefresh();
  };

  const quickStatus = (item: CMSContentItem, status: ContentStatus) => {
    upsertCMSContent({ ...item, status, updatedAt: new Date().toISOString() });
    onRefresh();
  };

  const remove = (id: string) => {
    deleteCMSContent(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-[#273a41] font-semibold">{typeMap.find((t) => t.key === type)?.label}</h2>
        <button onClick={openCreate} className="bg-[#00b3e8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"><Plus size={16} />Créer</button>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input className="border rounded-md p-2" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} />
          <input className="border rounded-md p-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="border rounded-md p-2" placeholder="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <select className="border rounded-md p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <textarea className="border rounded-md p-2 w-full" rows={2} placeholder="Résumé" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <textarea className="border rounded-md p-2 w-full" rows={4} placeholder="Contenu" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />

        <div className="grid md:grid-cols-2 gap-3">
          <select className="border rounded-md p-2" value={form.coverId} onChange={(e) => setForm({ ...form, coverId: e.target.value })}>
            <option value="">Sélectionner une cover</option>
            {media.filter((f) => f.type === 'image').map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {type === 'posts' && (
            <input className="border rounded-md p-2" placeholder="https://video... (optionnel)" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          )}
        </div>

        {form.coverId && (
          <img src={getMediaFileById(form.coverId)?.thumbnailUrl || getMediaFileById(form.coverId)?.url} alt="Aperçu cover" className="w-40 h-24 object-cover rounded-md border" />
        )}

        {errors.length > 0 && <ul className="text-sm text-red-600 list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {feedback && <p className="text-sm text-green-600">{feedback}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={reset} className="px-4 py-2 rounded-lg border">Annuler / Reset</button>
          <button disabled={saving} onClick={save} className="px-4 py-2 rounded-lg bg-[#273a41] text-white">{saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Enregistrer'}</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f5f9fa]"><tr><th className="text-left p-3">Titre</th><th className="text-left p-3">Statut</th><th className="text-left p-3">Cover</th><th className="text-right p-3">Actions</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3"><p className="font-medium">{item.title}</p><p className="text-xs text-gray-500">/{item.slug}</p></td>
                <td className="p-3">
                  <select className="border rounded-md p-1" value={item.status} onChange={(e) => quickStatus(item, e.target.value as ContentStatus)}>
                    {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="p-3">{item.coverId ? '✅' : 'Fallback'}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 px-2 py-1 border rounded"><Pencil size={14} />Edit</button>
                  <button onClick={() => remove(item.id)} className="inline-flex items-center gap-1 px-2 py-1 border rounded text-red-600"><Trash2 size={14} />Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CMSDashboard({ currentSection, onSectionChange }: CMSDashboardProps) {
  const { user, logout, canAccessCMS } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const allContent = useMemo(() => getCMSContent(), [refreshKey]);
  const mediaFiles = getMediaFiles();
  const categories = getCMSCategories(allContent);

  const stats = [
    { label: 'Services', value: allContent.filter((i) => i.type === 'services').length, icon: Briefcase, color: 'from-[#00b3e8] to-[#00c0e8]' },
    { label: 'Projets', value: allContent.filter((i) => i.type === 'projects').length, icon: FolderOpen, color: 'from-[#34c759] to-[#2da84a]' },
    { label: 'Articles', value: allContent.filter((i) => i.type === 'posts').length, icon: FileText, color: 'from-[#a855f7] to-[#9333ea]' },
    { label: 'Médias', value: mediaFiles.length, icon: ImageIcon, color: 'from-[#ffc247] to-[#ff9f47]' },
    { label: 'Utilisateurs', value: user ? 1 : 0, icon: Users, color: 'from-[#273a41] to-[#38484e]' },
  ];

  const recent = [...allContent].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6);

  const handleLogout = async () => {
    await logout();
    window.location.hash = 'login';
  };

  if (!canAccessCMS) return null;

  const menuItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'posts', label: 'Articles', icon: FileText },
    { id: 'events', label: 'Évènements', icon: Calendar },
    { id: 'media', label: 'Médiathèque', icon: ImageIcon },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'taxonomies', label: 'Catégories', icon: Tags },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f5f9fa] flex">
      <motion.aside className={`fixed left-0 top-0 h-full bg-white shadow-xl z-50 ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
        <div className="p-4 border-b flex justify-between"><strong>SMOVE CMS</strong><button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => <button key={item.id} onClick={() => onSectionChange(item.id)} className={`w-full flex items-center gap-2 p-2 rounded ${currentSection === item.id ? 'bg-[#00b3e8] text-white' : 'hover:bg-[#f5f9fa]'}`}><item.icon size={16} />{sidebarOpen && item.label}</button>)}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t"><button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-600"><LogOut size={16} />{sidebarOpen && 'Déconnexion'}</button></div>
      </motion.aside>
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-6 space-y-6`}>
        {currentSection === 'overview' && (
          <>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">{stats.map((stat) => <div key={stat.label} className="bg-white p-4 rounded-xl border"><p className="text-sm text-gray-500">{stat.label}</p><p className="text-2xl font-semibold">{stat.value}</p></div>)}</div>
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-4 lg:col-span-2"><h3 className="font-semibold mb-3">Derniers contenus créés</h3><ul className="space-y-2">{recent.map((item) => <li key={item.id} className="text-sm flex justify-between"><span>{item.title}</span><span className="text-gray-500">{item.status}</span></li>)}</ul></div>
              <div className="bg-white rounded-xl border p-4"><h3 className="font-semibold mb-3">Publication</h3><p className="text-sm">Brouillons: {allContent.filter((i) => i.status === 'draft').length}</p><p className="text-sm">Publiés récemment (7j): {allContent.filter((i) => i.status === 'published' && Date.now() - +new Date(i.updatedAt) < 7 * 86400000).length}</p></div>
            </div>
          </>
        )}

        {(['services', 'projects', 'posts', 'events'] as ContentType[]).includes(currentSection as ContentType) && (
          <ContentSection
            type={currentSection as ContentType}
            items={allContent.filter((item) => item.type === currentSection)}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {currentSection === 'media' && <div className="bg-white rounded-xl border p-4">Médiathèque disponible ({mediaFiles.length} éléments). Sélection cover active dans tous les formulaires CRUD.</div>}
        {currentSection === 'users' && <div className="bg-white rounded-xl border p-4">Utilisateurs connectés: {user?.email}</div>}
        {currentSection === 'taxonomies' && <div className="bg-white rounded-xl border p-4"><h3 className="font-semibold">Catégories détectées</h3><ul className="list-disc pl-5">{categories.map((cat) => <li key={cat}>{cat}</li>)}</ul></div>}
        {currentSection === 'settings' && <div className="bg-white rounded-xl border p-4">Paramètres V1 stabilisés: statuts standardisés, slugs auto, cover obligatoire à la publication.</div>}
      </main>
    </div>
  );
}
