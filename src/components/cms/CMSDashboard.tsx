import { motion } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Eye,
  LogOut,
  Menu,
  X,
  Settings,
  Plus,
  Save,
  Trash2,
  Pencil,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { blogRepository, BlogRepositoryError } from '../../repositories/blogRepository';
import { cmsRepository } from '../../repositories/cmsRepository';
import { mediaRepository } from '../../repositories/mediaRepository';
import { projectRepository } from '../../repositories/projectRepository';
import { fromCmsBlogInput, normalizeSlug } from '../../features/blog/blogEntryAdapter';
import type { BlogPost } from '../../domain/contentSchemas';
import {
  AdminActionBar,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPanel,
  AdminSuccessFeedback,
} from './adminPrimitives';

interface CMSDashboardProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

interface BlogFormState {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  featuredImage: string;
  readTime: string;
  status: BlogPost['status'];
}

interface ProjectFormState {
  id?: string;
  title: string;
  client: string;
  category: string;
  year: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  tags: string;
  mainImage: string;
}

const EMPTY_BLOG_FORM: BlogFormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author: '',
  category: '',
  featuredImage: '',
  readTime: '5 min',
  status: 'draft',
};

const EMPTY_PROJECT_FORM: ProjectFormState = {
  title: '',
  client: '',
  category: '',
  year: new Date().getFullYear().toString(),
  description: '',
  challenge: '',
  solution: '',
  results: '',
  tags: '',
  mainImage: 'project cover image',
};

const SETTINGS_STORAGE_KEY = 'smove_cms_settings';

export default function CMSDashboard({ currentSection, onSectionChange }: CMSDashboardProps) {
  const { user, logout, canAccessCMS } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sectionBusy, setSectionBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [sectionError, setSectionError] = useState('');

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [blogEditorMode, setBlogEditorMode] = useState<'list' | 'create' | 'edit'>('list');
  const [blogForm, setBlogForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [blogFormErrors, setBlogFormErrors] = useState<Partial<Record<keyof BlogFormState, string>>>({});

  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsValues, setSettingsValues] = useState(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { siteTitle: 'SMOVE', supportEmail: 'contact@smove.africa', instantPublishing: true };
      }
      const parsed = JSON.parse(raw) as { siteTitle?: string; supportEmail?: string; instantPublishing?: boolean };
      return {
        siteTitle: parsed.siteTitle || 'SMOVE',
        supportEmail: parsed.supportEmail || 'contact@smove.africa',
        instantPublishing: parsed.instantPublishing ?? true,
      };
    } catch {
      return { siteTitle: 'SMOVE', supportEmail: 'contact@smove.africa', instantPublishing: true };
    }
  });

  const [projects, setProjects] = useState(() => projectRepository.getAll());
  const [projectsError, setProjectsError] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectEditorMode, setProjectEditorMode] = useState<'list' | 'create' | 'edit'>('list');
  const [projectForm, setProjectForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM);
  const [projectFormErrors, setProjectFormErrors] = useState<Partial<Record<keyof ProjectFormState, string>>>({});
  const mediaFiles = useMemo(() => mediaRepository.getAll(), []);
  const cmsStats = useMemo(() => cmsRepository.getStats(), [posts, mediaFiles.length, projects.length]);
  const canDeleteContent = user?.role === 'admin';

  useEffect(() => {
    setPostsLoading(true);
    try {
      setPosts(blogRepository.getAll());
      setPostsError('');
    } catch {
      setPostsError('Impossible de charger les articles. Réessayez.');
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const stats = [
    {
      label: 'Total Projets',
      value: cmsStats.projectCount,
      icon: FolderOpen,
      color: 'from-[#00b3e8] to-[#00c0e8]',
      change: '+12%',
    },
    {
      label: 'Articles Blog',
      value: posts.length,
      icon: FileText,
      color: 'from-[#a855f7] to-[#9333ea]',
      change: '+8%',
    },
    {
      label: 'Fichiers Média',
      value: cmsStats.mediaCount,
      icon: ImageIcon,
      color: 'from-[#ffc247] to-[#ff9f47]',
      change: '+15%',
    },
    {
      label: 'Vues Totales',
      value: '12.5k',
      icon: Eye,
      color: 'from-[#34c759] to-[#2da84a]',
      change: '+23%',
    },
  ];

  const menuItems = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'media', label: 'Médiathèque', icon: ImageIcon },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const recentActivity = [
    { action: 'Nouveau projet ajouté', item: 'SMOVE Platform', time: 'Il y a 2h', type: 'project' },
    { action: 'Article publié', item: 'Création site web', time: 'Il y a 5h', type: 'blog' },
    { action: 'Image uploadée', item: 'hero-banner.jpg', time: 'Il y a 1j', type: 'media' },
    { action: 'Projet modifié', item: 'ECLA BTP', time: 'Il y a 2j', type: 'project' },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.hash = 'login';
  };

  const handleSectionChange = (section: string) => {
    setSectionBusy(currentSection);
    setSectionError('');
    setTimeout(() => {
      onSectionChange(section);
      setSectionBusy(null);
    }, 200);
  };

  const showSuccess = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 2500);
  };

  const mapBlogError = (error: unknown) => {
    if (error instanceof BlogRepositoryError && error.code === 'BLOG_SLUG_CONFLICT') {
      return 'Ce slug existe déjà. Utilisez un slug unique.';
    }
    return 'Enregistrement impossible. Vérifiez les champs et réessayez.';
  };

  const startCreatePost = () => {
    setBlogForm(EMPTY_BLOG_FORM);
    setBlogFormErrors({});
    setBlogEditorMode('create');
    setPostsError('');
  };

  const startEditPost = (post: BlogPost) => {
    setBlogForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      category: post.category,
      featuredImage: post.featuredImage,
      readTime: post.readTime,
      status: post.status,
    });
    setBlogFormErrors({});
    setBlogEditorMode('edit');
  };

  const validateBlogForm = (form: BlogFormState) => {
    const errors: Partial<Record<keyof BlogFormState, string>> = {};
    if (!form.title.trim()) errors.title = 'Le titre est requis.';
    if (!form.content.trim()) errors.content = 'Le contenu est requis.';
    if (!form.excerpt.trim()) errors.excerpt = 'Le résumé est requis.';
    if (!normalizeSlug(form.slug, form.title)) errors.slug = 'Le slug est requis.';
    if (!form.author.trim()) errors.author = 'L’auteur est requis.';
    if (!form.category.trim()) errors.category = 'La catégorie est requise.';
    return errors;
  };

  const resetBlogEditor = () => {
    setBlogEditorMode('list');
    setBlogForm(EMPTY_BLOG_FORM);
    setBlogFormErrors({});
  };

  const saveBlogPost = () => {
    const errors = validateBlogForm(blogForm);
    setBlogFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setPostsError('Veuillez corriger les erreurs avant d’enregistrer.');
      return;
    }

    setIsSavingPost(true);
    setPostsError('');

    try {
      const payload = fromCmsBlogInput(blogForm);
      blogRepository.save(payload);
      setPosts(blogRepository.getAll());
      showSuccess(blogEditorMode === 'create' ? 'Article créé avec succès.' : 'Article mis à jour avec succès.');
      resetBlogEditor();
    } catch (error) {
      setPostsError(mapBlogError(error));
    } finally {
      setIsSavingPost(false);
    }
  };

  const deletePost = (post: BlogPost) => {
    if (!canDeleteContent) {
      setPostsError('Suppression non autorisée: rôle administrateur requis.');
      return;
    }

    if (!window.confirm(`Supprimer définitivement "${post.title}" ?`)) {
      return;
    }

    try {
      blogRepository.delete(post.id);
      setPosts(blogRepository.getAll());
      showSuccess('Article supprimé.');
      if (blogForm.id === post.id) {
        resetBlogEditor();
      }
    } catch {
      setPostsError('Suppression impossible. Réessayez.');
    }
  };

  const saveSettings = () => {
    if (!settingsValues.siteTitle.trim() || !settingsValues.supportEmail.includes('@')) {
      setSectionError('Renseignez un nom de site et un email de support valide.');
      return;
    }

    setSettingsSaving(true);
    setSectionError('');
    setTimeout(() => {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsValues));
      setSettingsSaving(false);
      showSuccess('Paramètres enregistrés avec succès.');
    }, 300);
  };

  const retryLoadPosts = () => {
    setPostsLoading(true);
    setPostsError('');
    try {
      setPosts(blogRepository.getAll());
    } catch {
      setPostsError('Impossible de charger les articles. Réessayez.');
    } finally {
      setPostsLoading(false);
    }
  };

  const startCreateProject = () => {
    setProjectEditorMode('create');
    setProjectForm(EMPTY_PROJECT_FORM);
    setProjectFormErrors({});
    setProjectsError('');
  };

  const startEditProject = (project: (typeof projects)[number]) => {
    setProjectEditorMode('edit');
    setProjectForm({
      id: project.id,
      title: project.title,
      client: project.client,
      category: project.category,
      year: project.year,
      description: project.description,
      challenge: project.challenge,
      solution: project.solution,
      results: project.results.join('\n'),
      tags: project.tags.join(', '),
      mainImage: project.mainImage,
    });
    setProjectFormErrors({});
    setProjectsError('');
  };

  const validateProjectForm = (form: ProjectFormState) => {
    const errors: Partial<Record<keyof ProjectFormState, string>> = {};
    if (!form.title.trim()) errors.title = 'Le titre est requis.';
    if (!form.client.trim()) errors.client = 'Le client est requis.';
    if (!form.category.trim()) errors.category = 'La catégorie est requise.';
    if (!form.description.trim()) errors.description = 'La description est requise.';
    if (!form.challenge.trim()) errors.challenge = 'Le challenge est requis.';
    if (!form.solution.trim()) errors.solution = 'La solution est requise.';
    return errors;
  };

  const resetProjectEditor = () => {
    setProjectEditorMode('list');
    setProjectForm(EMPTY_PROJECT_FORM);
    setProjectFormErrors({});
  };

  const saveProject = () => {
    const errors = validateProjectForm(projectForm);
    setProjectFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setProjectsError('Veuillez corriger les erreurs du projet avant d’enregistrer.');
      return;
    }

    setIsSavingProject(true);
    setProjectsError('');

    try {
      const baseId = projectForm.id || `project-${Date.now()}`;
      projectRepository.save({
        id: baseId,
        title: projectForm.title.trim(),
        client: projectForm.client.trim(),
        category: projectForm.category.trim(),
        year: projectForm.year.trim() || new Date().getFullYear().toString(),
        description: projectForm.description.trim(),
        challenge: projectForm.challenge.trim(),
        solution: projectForm.solution.trim(),
        results: projectForm.results.split('\n').map((line) => line.trim()).filter(Boolean),
        tags: projectForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        mainImage: projectForm.mainImage.trim() || 'project cover image',
        images: projectForm.mainImage.trim() ? [projectForm.mainImage.trim()] : [],
      });
      setProjects(projectRepository.getAll());
      showSuccess(projectEditorMode === 'create' ? 'Projet créé avec succès.' : 'Projet mis à jour avec succès.');
      resetProjectEditor();
    } catch {
      setProjectsError('Enregistrement du projet impossible. Réessayez.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const deleteProject = (projectId: string, projectTitle: string) => {
    if (!canDeleteContent) {
      setProjectsError('Suppression non autorisée: rôle administrateur requis.');
      return;
    }

    if (!window.confirm(`Supprimer définitivement le projet "${projectTitle}" ?`)) {
      return;
    }

    try {
      projectRepository.delete(projectId);
      setProjects(projectRepository.getAll());
      if (projectForm.id === projectId) {
        resetProjectEditor();
      }
      showSuccess('Projet supprimé.');
    } catch {
      setProjectsError('Suppression du projet impossible. Réessayez.');
    }
  };

  const renderProjectForm = () => {
    const title = projectEditorMode === 'create' ? 'Créer un projet' : 'Modifier un projet';

    return (
      <AdminPanel title={title}>
        <div className="space-y-4">
          {(['title', 'client', 'category', 'year', 'mainImage'] as const).map((fieldKey) => (
            <label key={fieldKey} className="block">
              <span className="text-[14px] text-[#6f7f85]">{fieldKey}</span>
              <input
                value={projectForm[fieldKey]}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, [fieldKey]: event.target.value }))}
                className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              />
              {projectFormErrors[fieldKey] ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors[fieldKey]}</p> : null}
            </label>
          ))}
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Description</span>
            <textarea
              value={projectForm.description}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {projectFormErrors.description ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.description}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Challenge</span>
            <textarea
              value={projectForm.challenge}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, challenge: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {projectFormErrors.challenge ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.challenge}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Solution</span>
            <textarea
              value={projectForm.solution}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, solution: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {projectFormErrors.solution ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.solution}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Résultats (une ligne par résultat)</span>
            <textarea
              value={projectForm.results}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, results: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Tags (séparés par virgule)</span>
            <input
              value={projectForm.tags}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>
          <AdminActionBar>
            <button
              onClick={saveProject}
              disabled={isSavingProject}
              className="inline-flex items-center gap-2 bg-[#273a41] text-white px-4 py-2 rounded-[10px] disabled:opacity-60"
            >
              <Save size={16} /> {isSavingProject ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={resetProjectEditor} className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41]">
              Annuler
            </button>
          </AdminActionBar>
        </div>
      </AdminPanel>
    );
  };

  const renderBlogForm = () => {
    const title = blogEditorMode === 'create' ? 'Créer un article' : 'Modifier un article';

    return (
      <AdminPanel title={title}>
        <div className="space-y-4">
          {(['title', 'slug', 'author', 'category', 'readTime'] as const).map((fieldKey) => (
            <label key={fieldKey} className="block">
              <span className="text-[14px] text-[#6f7f85]">{fieldKey}</span>
              <input
                value={blogForm[fieldKey]}
                onChange={(event) => setBlogForm((prev) => ({ ...prev, [fieldKey]: event.target.value }))}
                className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              />
              {blogFormErrors[fieldKey] ? <p className="text-[12px] text-red-600 mt-1">{blogFormErrors[fieldKey]}</p> : null}
            </label>
          ))}
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Résumé</span>
            <textarea
              value={blogForm.excerpt}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, excerpt: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {blogFormErrors.excerpt ? <p className="text-[12px] text-red-600 mt-1">{blogFormErrors.excerpt}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Contenu</span>
            <textarea
              value={blogForm.content}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, content: event.target.value }))}
              className="mt-1 w-full min-h-[140px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {blogFormErrors.content ? <p className="text-[12px] text-red-600 mt-1">{blogFormErrors.content}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Statut</span>
            <select
              value={blogForm.status}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, status: event.target.value as BlogPost['status'] }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Image vedette (requête image / média)</span>
            <input
              value={blogForm.featuredImage}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, featuredImage: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>
          {mediaFiles.length > 0 ? (
            <div className="rounded-[10px] bg-[#f5f9fa] p-3">
              <p className="text-[13px] text-[#6f7f85] mb-2">Associer un média existant</p>
              <div className="flex flex-wrap gap-2">
                {mediaFiles.slice(0, 6).map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setBlogForm((prev) => ({ ...prev, featuredImage: file.alt || file.name }))}
                    className="text-[12px] border border-[#d8e4e8] rounded-full px-3 py-1 hover:border-[#00b3e8]"
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <AdminActionBar>
            <button
              onClick={saveBlogPost}
              disabled={isSavingPost}
              className="inline-flex items-center gap-2 bg-[#273a41] text-white px-4 py-2 rounded-[10px] disabled:opacity-60"
            >
              <Save size={16} /> {isSavingPost ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={resetBlogEditor} className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41]">
              Annuler
            </button>
          </AdminActionBar>
        </div>
      </AdminPanel>
    );
  };

  if (!canAccessCMS) {
    return (
      <div className="min-h-screen bg-[#f5f9fa] flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[20px] shadow-sm border border-[#eef3f5] p-8 text-center">
          <h1 className="font-['Medula_One:Regular',sans-serif] text-[32px] tracking-[2px] uppercase text-[#273a41] mb-4">
            Accès refusé
          </h1>
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#38484e] mb-6">
            Seuls les comptes administrateurs, éditeurs ou auteurs peuvent accéder au CMS.
          </p>
          <a
            href="#home"
            className="inline-flex items-center justify-center bg-[#00b3e8] text-white px-6 py-3 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif]"
          >
            Retour au site
          </a>
        </div>
      </div>
    );
  }

  const renderSectionContent = () => {
    if (sectionBusy) {
      return <AdminLoadingState label="Chargement de la section..." />;
    }

    if (currentSection === 'projects') {
      return (
        <div className="space-y-6">
          <AdminPageHeader
            title="Gestion des projets"
            subtitle="Liste, édition et statut de vos projets portfolio."
            actions={
              <button
                onClick={startCreateProject}
                className="bg-[#00b3e8] text-white rounded-[12px] px-4 py-2 font-['Abhaya_Libre:Bold',sans-serif]"
              >
                Nouveau projet
              </button>
            }
          />

          {projectsError ? <AdminErrorState label={projectsError} /> : null}
          {projectEditorMode !== 'list' ? renderProjectForm() : null}

          <AdminPanel title="Projets récents">
            {projects.length === 0 ? (
              <AdminEmptyState label="Aucun projet trouvé. Créez votre premier projet pour commencer." />
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-[12px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{project.title}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">{project.client} • {project.year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#9ba1a4]">{project.category}</span>
                      <button onClick={() => startEditProject(project)} className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2">
                        <Pencil size={15} /> Modifier
                      </button>
                      <button
                        onClick={() => deleteProject(project.id, project.title)}
                        disabled={!canDeleteContent}
                        className="px-3 py-2 border border-red-200 text-red-600 rounded-[10px] inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={15} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>
      );
    }

    if (currentSection === 'blog') {
      return (
        <div className="space-y-6">
          <AdminPageHeader
            title="Gestion du blog"
            subtitle="Liste, édition, validation et publication des articles."
            actions={
              <button
                onClick={startCreatePost}
                className="bg-[#00b3e8] text-white rounded-[12px] px-4 py-2 font-['Abhaya_Libre:Bold',sans-serif]"
              >
                Nouvel article
              </button>
            }
          />

          {postsError ? (
            <AdminActionBar>
              <AdminErrorState label={postsError} />
              <button
                onClick={retryLoadPosts}
                className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2"
              >
                <RotateCcw size={15} /> Réessayer
              </button>
            </AdminActionBar>
          ) : null}
          {postsLoading ? <AdminLoadingState label="Chargement des articles..." /> : null}

          {blogEditorMode !== 'list' ? renderBlogForm() : null}

          <AdminPanel title="Articles">
            {posts.length === 0 ? (
              <AdminEmptyState label="Aucun article disponible." />
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="rounded-[12px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{post.title}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">
                        /{post.slug} • {post.status === 'published' ? 'Publié' : 'Brouillon'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEditPost(post)} className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2">
                        <Pencil size={15} /> Modifier
                      </button>
                      <button
                        onClick={() => deletePost(post)}
                        disabled={!canDeleteContent}
                        className="px-3 py-2 border border-red-200 text-red-600 rounded-[10px] inline-flex items-center gap-2 disabled:opacity-50"
                        title={canDeleteContent ? 'Supprimer cet article' : 'Réservé aux administrateurs'}
                      >
                        <Trash2 size={15} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>

          {!canDeleteContent ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-center gap-2">
              <AlertTriangle size={16} />
              Les suppressions définitives sont réservées au rôle administrateur.
            </div>
          ) : null}
        </div>
      );
    }

    if (currentSection === 'media') {
      return (
        <div className="space-y-6">
          <AdminPageHeader title="Médiathèque" subtitle="Fichiers validés et prêts à être utilisés dans le contenu." />
          <AdminPanel title="Ressources médias">
            {mediaFiles.length === 0 ? (
              <AdminEmptyState label="Aucun média disponible. Importez une ressource pour démarrer." />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {mediaFiles.slice(0, 6).map((file) => (
                  <div key={file.id} className="rounded-[12px] border border-[#eef3f5] p-4">
                    <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{file.name}</p>
                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">{file.type} • {Math.round(file.size / 1024)} KB</p>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </div>
      );
    }

    if (currentSection === 'settings') {
      return (
        <div className="space-y-6">
          <AdminPageHeader title="Paramètres" subtitle="Configuration globale et garde-fous de publication." />
          {sectionError ? (
            <AdminActionBar>
              <AdminErrorState label={sectionError} />
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2 disabled:opacity-60"
              >
                <RotateCcw size={15} /> Réessayer
              </button>
            </AdminActionBar>
          ) : null}
          <AdminPanel title="Publication">
            <div className="space-y-3">
              <label className="block">
                <span className="text-[14px] text-[#6f7f85]">Nom du site</span>
                <input
                  value={settingsValues.siteTitle}
                  onChange={(event) => setSettingsValues((prev) => ({ ...prev, siteTitle: event.target.value }))}
                  className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-[14px] text-[#6f7f85]">Email support</span>
                <input
                  value={settingsValues.supportEmail}
                  onChange={(event) => setSettingsValues((prev) => ({ ...prev, supportEmail: event.target.value }))}
                  className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                />
              </label>
              <label className="flex items-center justify-between rounded-[12px] border border-[#eef3f5] p-4">
                <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[#273a41]">Autoriser la publication immédiate</span>
                <input
                  type="checkbox"
                  checked={settingsValues.instantPublishing}
                  onChange={(event) => setSettingsValues((prev) => ({ ...prev, instantPublishing: event.target.checked }))}
                />
              </label>
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="bg-[#273a41] text-white rounded-[10px] px-4 py-2 disabled:opacity-60"
              >
                {settingsSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </AdminPanel>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#f5f9fa] flex">
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-white shadow-xl z-50 ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
      >
        <div className="p-6 border-b border-[#eef3f5] flex items-center justify-between">
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00b3e8] to-[#34c759] rounded-[10px] flex items-center justify-center">
                <span className="text-white font-['ABeeZee:Regular',sans-serif] text-[20px]">S</span>
              </div>
              <div>
                <h2 className="font-['ABeeZee:Regular',sans-serif] text-[18px] text-[#273a41]">SMOVE</h2>
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4]">CMS Admin</p>
              </div>
            </motion.div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#f5f9fa] rounded-[8px] transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="p-6 border-b border-[#eef3f5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#00b3e8] to-[#34c759] rounded-full flex items-center justify-center">
              <span className="text-white font-['Abhaya_Libre:Bold',sans-serif] text-[16px]">{user?.name?.charAt(0) ?? 'A'}</span>
            </div>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-[#273a41] truncate">{user?.name}</p>
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4] truncate">{user?.email}</p>
              </motion.div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all ${
                currentSection === item.id ? 'bg-[#00b3e8] text-white' : 'text-[#273a41] hover:bg-[#f5f9fa]'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px]">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#eef3f5]">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-red-500 hover:bg-red-50 transition-colors"
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px]">Déconnexion</span>}
          </motion.button>
        </div>
      </motion.aside>

      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="bg-white border-b border-[#eef3f5] px-8 py-6 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-['Medula_One:Regular',sans-serif] text-[28px] tracking-[2.8px] uppercase text-[#273a41]">
                {menuItems.find((m) => m.id === currentSection)?.label || 'Dashboard'}
              </h1>
              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4] mt-1">Bienvenue, {user?.name}</p>
            </div>
            <a href="#home" className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4] hover:text-[#273a41]">
              Voir le site →
            </a>
          </div>
        </header>

        <div className="p-8 space-y-6">
          {feedback ? <AdminSuccessFeedback label={feedback} /> : null}
          {currentSection === 'overview' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-white rounded-[20px] p-6 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-[12px] bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="text-white" size={24} />
                      </div>
                      <span className="text-[#34c759] font-['Abhaya_Libre:Bold',sans-serif] text-[14px]">{stat.change}</span>
                    </div>
                    <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[32px] text-[#273a41] mb-1">{stat.value}</h3>
                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {[['projects', 'Nouveau Projet', 'Ajouter un projet', 'from-[#00b3e8] to-[#00c0e8]'], ['blog', 'Nouvel Article', 'Rédiger un article', 'from-[#a855f7] to-[#9333ea]'], ['media', 'Upload Média', 'Ajouter des fichiers', 'from-[#ffc247] to-[#ff9f47]']].map(([id, title, subtitle, color]) => (
                  <motion.button
                    key={id}
                    onClick={() => handleSectionChange(id)}
                    className={`bg-gradient-to-r ${color} text-white p-6 rounded-[20px] flex items-center justify-between group`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-left">
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[18px] mb-1">{title}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-white/80">{subtitle}</p>
                    </div>
                    <Plus className="group-hover:rotate-90 transition-transform" size={32} />
                  </motion.button>
                ))}
              </div>

              <motion.div className="bg-white rounded-[20px] p-6 shadow-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-6">Activité Récente</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-[12px] hover:bg-[#f5f9fa] transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'project'
                          ? 'bg-[#00b3e8]/10 text-[#00b3e8]'
                          : activity.type === 'blog'
                            ? 'bg-[#a855f7]/10 text-[#a855f7]'
                            : 'bg-[#ffc247]/10 text-[#ffc247]'
                      }`}>
                        {activity.type === 'project' ? <FolderOpen size={20} /> : activity.type === 'blog' ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-[#273a41]">{activity.action}</p>
                        <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4]">{activity.item}</p>
                      </div>
                      <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4]">{activity.time}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            renderSectionContent()
          )}
        </div>
      </main>
    </div>
  );
}
