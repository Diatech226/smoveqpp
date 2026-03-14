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
  Archive,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth, type AuthAuditEvent } from '../../contexts/AuthContext';
import type { AppUser } from '../../utils/securityPolicy';
import { blogRepository, BlogRepositoryError } from '../../repositories/blogRepository';
import { cmsRepository } from '../../repositories/cmsRepository';
import { mediaRepository } from '../../repositories/mediaRepository';
import { projectRepository } from '../../repositories/projectRepository';
import {
  deleteBackendBlogPost,
  fetchBackendBlogPosts,
  fetchEditorialAnalytics,
  saveBackendBlogPost,
  transitionBackendBlogPost,
  type EditorialAnalytics,
} from '../../utils/contentApi';
import { fromCmsBlogInput, normalizeSlug } from '../../features/blog/blogEntryAdapter';
import { isMediaReference, resolveBlogMediaReference, toMediaReference } from '../../features/blog/mediaReference';
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
  seoTitle: string;
  seoDescription: string;
  canonicalSlug: string;
  socialImage: string;
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
  seoTitle: '',
  seoDescription: '',
  canonicalSlug: '',
  socialImage: '',
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
  const { user, logout, canAccessCMS, fetchAdminUsers, fetchAdminAuditEvents, updateAdminUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sectionBusy, setSectionBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [sectionError, setSectionError] = useState('');

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [statusTransitioningPostId, setStatusTransitioningPostId] = useState<string | null>(null);
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
  const canEditContent = user?.role === 'admin' || user?.role === 'editor' || user?.role === 'author';
  const canReviewContent = user?.role === 'admin' || user?.role === 'editor';
  const canPublishContent = user?.role === 'admin' || user?.role === 'editor';
  const [editorialAnalytics, setEditorialAnalytics] = useState<EditorialAnalytics | null>(null);
  const [adminUsers, setAdminUsers] = useState<AppUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuthAuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setPostsLoading(true);
      try {
        const backendPosts = await fetchBackendBlogPosts();
        if (!active) return;
        setPosts(backendPosts);
        backendPosts.forEach((post) => blogRepository.save(post));
        setPostsError('');
      } catch {
        try {
          if (!active) return;
          setPosts(blogRepository.getAll());
          setPostsError('Backend indisponible, données locales affichées.');
        } catch {
          if (!active) return;
          setPostsError('Impossible de charger les articles. Réessayez.');
        }
      } finally {
        if (active) setPostsLoading(false);
      }

      try {
        const analytics = await fetchEditorialAnalytics();
        if (active) setEditorialAnalytics(analytics);
      } catch {
        if (active) setEditorialAnalytics(null);
      }
    };

    void load();

    return () => {
      active = false;
    };
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
    { id: 'users', label: 'Utilisateurs', icon: Users },
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
    if (error instanceof BlogRepositoryError && error.code === 'BLOG_NOT_FOUND') {
      return 'Article introuvable. Rechargez la liste puis réessayez.';
    }
    if (error instanceof BlogRepositoryError && error.code === 'BLOG_INVALID_STATUS_TRANSITION') {
      return 'Transition de statut invalide. Repassez en brouillon avant publication.';
    }
    if (error instanceof BlogRepositoryError && error.code === 'BLOG_INVALID_MEDIA_REFERENCE') {
      return 'Le média sélectionné est introuvable. Sélectionnez une autre ressource.';
    }
    if (error instanceof Error) {
      if (error.message.includes('cannot publish')) {
        return 'Publication non autorisée pour votre rôle.';
      }
      if (error.message.includes('Missing required publish fields')) {
        return 'Article non publiable: renseignez titre, slug, extrait et contenu.';
      }
      if (error.message.trim()) {
        return error.message;
      }
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
      seoTitle: post.seo?.title || '',
      seoDescription: post.seo?.description || '',
      canonicalSlug: post.seo?.canonicalSlug || post.slug,
      socialImage: post.seo?.socialImage || '',
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
    if (form.seoDescription && form.seoDescription.trim().length > 320) {
      errors.seoDescription = 'La description SEO doit rester concise (320 caractères max).';
    }
    return errors;
  };


  const getStatusLabel = (status: BlogPost['status']) => {
    if (status === 'published') return 'Publié';
    if (status === 'in_review') return 'En revue';
    if (status === 'archived') return 'Archivé';
    return 'Brouillon';
  };

  const transitionPostStatus = async (post: BlogPost, target: BlogPost['status']) => {
    if (target === 'in_review' && !canEditContent) {
      setPostsError('Soumission en revue non autorisée pour votre rôle.');
      return;
    }
    if (target === 'published' && !canPublishContent) {
      setPostsError('Publication non autorisée: rôle éditeur ou administrateur requis.');
      return;
    }

    const confirmationByTarget: Record<BlogPost['status'], string> = {
      draft: `Repasser "${post.title}" en brouillon ?`,
      in_review: `Soumettre "${post.title}" à la revue éditoriale ?`,
      published: `Publier "${post.title}" sur le blog public ?`,
      archived: `Archiver "${post.title}" ? L’article ne sera plus visible publiquement.`,
    };

    if (!window.confirm(confirmationByTarget[target])) {
      return;
    }

    setStatusTransitioningPostId(post.id);
    setPostsError('');

    try {
      const updated = await transitionBackendBlogPost(post.id, target);
      blogRepository.save(updated);
      setPosts((prev) => prev.map((entry) => (entry.id === post.id ? updated : entry)));
      if (target === 'published') showSuccess('Article publié.');
      else if (target === 'in_review') showSuccess('Article soumis en revue.');
      else if (target === 'draft') showSuccess('Article repassé en brouillon.');
      else showSuccess('Article archivé.');
      if (blogForm.id === post.id) {
        setBlogForm((prev) => ({ ...prev, status: target }));
      }
    } catch (error) {
      setPostsError(mapBlogError(error));
    } finally {
      setStatusTransitioningPostId(null);
    }
  };

  const resetBlogEditor = () => {
    if (blogHasUnsavedChanges && !window.confirm('Des modifications non enregistrées seront perdues. Continuer ?')) {
      return;
    }
    setBlogEditorMode('list');
    setBlogForm(EMPTY_BLOG_FORM);
    setBlogFormErrors({});
  };

  const blogHasUnsavedChanges = useMemo(() => {
    if (blogEditorMode === 'list') return false;
    if (blogEditorMode === 'create') {
      return JSON.stringify(blogForm) !== JSON.stringify(EMPTY_BLOG_FORM);
    }
    const existing = posts.find((post) => post.id === blogForm.id);
    if (!existing) return true;
    const normalizedExisting: BlogFormState = {
      id: existing.id,
      title: existing.title,
      slug: existing.slug,
      excerpt: existing.excerpt,
      content: existing.content,
      author: existing.author,
      category: existing.category,
      featuredImage: existing.featuredImage,
      readTime: existing.readTime,
      status: existing.status,
      seoTitle: existing.seo?.title || '',
      seoDescription: existing.seo?.description || '',
      canonicalSlug: existing.seo?.canonicalSlug || existing.slug,
      socialImage: existing.seo?.socialImage || '',
    };
    return JSON.stringify(normalizedExisting) !== JSON.stringify(blogForm);
  }, [blogEditorMode, blogForm, posts]);

  const saveBlogPost = async (nextStatus?: BlogPost['status']) => {
    const formToSave: BlogFormState = nextStatus ? { ...blogForm, status: nextStatus } : blogForm;
    if (nextStatus) {
      setBlogForm(formToSave);
    }

    const errors = validateBlogForm(formToSave);
    setBlogFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setPostsError('Veuillez corriger les erreurs avant d’enregistrer.');
      return;
    }

    setIsSavingPost(true);
    setPostsError('');

    try {
      const payload = fromCmsBlogInput(formToSave);
      const saved = await saveBackendBlogPost(payload);
      blogRepository.save(saved);
      setPosts((prev) => {
        const index = prev.findIndex((entry) => entry.id === saved.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showSuccess(blogEditorMode === 'create' ? 'Article créé avec succès.' : 'Article mis à jour avec succès.');
      resetBlogEditor();
    } catch (error) {
      setPostsError(mapBlogError(error));
    } finally {
      setIsSavingPost(false);
    }
  };

  const deletePost = async (post: BlogPost) => {
    if (!canDeleteContent) {
      setPostsError('Suppression non autorisée: rôle administrateur requis.');
      return;
    }

    if (!window.confirm(`Supprimer définitivement "${post.title}" ?`)) {
      return;
    }

    try {
      await deleteBackendBlogPost(post.id);
      blogRepository.delete(post.id);
      setPosts((prev) => prev.filter((entry) => entry.id !== post.id));
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

  const retryLoadPosts = async () => {
    setPostsLoading(true);
    setPostsError('');
    try {
      const backendPosts = await fetchBackendBlogPosts();
      setPosts(backendPosts);
      backendPosts.forEach((post) => blogRepository.save(post));
    } catch {
      try {
        setPosts(blogRepository.getAll());
        setPostsError('Backend indisponible, données locales affichées.');
      } catch {
        setPostsError('Impossible de charger les articles. Réessayez.');
      }
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
              <option value="in_review">En revue</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">SEO title</span>
            <input
              value={blogForm.seoTitle}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">SEO description</span>
            <textarea
              value={blogForm.seoDescription}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, seoDescription: event.target.value }))}
              className="mt-1 w-full min-h-[80px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {blogFormErrors.seoDescription ? <p className="text-[12px] text-red-600 mt-1">{blogFormErrors.seoDescription}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Canonical slug (optionnel)</span>
            <input
              value={blogForm.canonicalSlug}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, canonicalSlug: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Image vedette (requête image / média)</span>
            <input
              value={blogForm.featuredImage}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, featuredImage: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {isMediaReference(blogForm.featuredImage) ? (
              <p className="text-[12px] text-[#6f7f85] mt-1">Référence média liée: {blogForm.featuredImage}</p>
            ) : null}
          </label>
          {mediaFiles.length > 0 ? (
            <div className="rounded-[10px] bg-[#f5f9fa] p-3">
              <p className="text-[13px] text-[#6f7f85] mb-2">Associer un média existant</p>
              <div className="flex flex-wrap gap-2">
                {mediaFiles.slice(0, 6).map((file) => (
                  <button
                    key={file.id}
                    onClick={() =>
                      setBlogForm((prev) => ({
                        ...prev,
                        featuredImage: toMediaReference(file.id),
                        socialImage: toMediaReference(file.id),
                      }))
                    }
                    className="text-[12px] border border-[#d8e4e8] rounded-full px-3 py-1 hover:border-[#00b3e8]"
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {blogForm.featuredImage ? (
            <div className="rounded-[10px] border border-[#eef3f5] px-3 py-2 text-[12px] text-[#6f7f85]">
              Aperçu média: {resolveBlogMediaReference(blogForm.featuredImage, blogForm.title || 'Article').caption}
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
            <button
              onClick={() => {
                saveBlogPost('draft');
              }}
              disabled={isSavingPost}
              className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41] disabled:opacity-60"
            >
              Enregistrer en brouillon
            </button>
            <button
              onClick={() => {
                saveBlogPost('in_review');
              }}
              disabled={isSavingPost || !canEditContent}
              className="px-4 py-2 rounded-[10px] bg-[#00b3e8] text-white disabled:opacity-60"
            >
              Soumettre en revue
            </button>
            <button onClick={resetBlogEditor} className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41]">
              Annuler
            </button>
          </AdminActionBar>
          {!canEditContent ? (
            <p className="text-[12px] text-amber-700">Soumission en revue réservée aux rôles auteur/éditeur/administrateur.</p>
          ) : null}
          {blogHasUnsavedChanges ? (
            <p className="text-[12px] text-amber-700">Modifications non enregistrées en cours.</p>
          ) : null}
        </div>
      </AdminPanel>
    );
  };

  const loadAdminUsers = async () => {
    setAdminUsersLoading(true);
    setAdminUsersError('');
    try {
      const users = await fetchAdminUsers();
      setAdminUsers(users);
    } catch (error) {
      setAdminUsersError(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const loadAuditEvents = async () => {
    setAuditLoading(true);
    try {
      const events = await fetchAdminAuditEvents();
      setAuditEvents(events);
    } catch (error) {
      setAdminUsersError(error instanceof Error ? error.message : 'Impossible de charger les événements d’audit.');
    } finally {
      setAuditLoading(false);
    }
  };

  const patchAdminUser = async (targetUserId: string, patch: Partial<Pick<AppUser, 'role' | 'accountStatus' | 'emailVerified'>>) => {
    setUpdatingUserId(targetUserId);
    try {
      const result = await updateAdminUser(targetUserId, patch);
      if (!result.success) {
        setAdminUsersError(result.error ?? 'Mise à jour impossible.');
        return;
      }
      await loadAdminUsers();
      if (user?.role === 'admin') {
        await loadAuditEvents();
      }
      showSuccess('Utilisateur mis à jour.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  useEffect(() => {
    if (currentSection === 'users' && canAccessCMS) {
      void loadAdminUsers();
      if (user?.role === 'admin') {
        void loadAuditEvents();
      }
    }
  }, [currentSection, canAccessCMS, user?.role]);

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

          <AdminPanel title="Synthèse éditoriale">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="rounded-[12px] border border-[#eef3f5] p-3">
                <p className="text-[12px] text-[#6f7f85]">Brouillons</p>
                <p className="text-[24px] text-[#273a41] font-['Abhaya_Libre:Bold',sans-serif]">{posts.filter((post) => post.status === 'draft').length}</p>
              </div>
              <div className="rounded-[12px] border border-[#eef3f5] p-3">
                <p className="text-[12px] text-[#6f7f85]">En revue</p>
                <p className="text-[24px] text-[#273a41] font-['Abhaya_Libre:Bold',sans-serif]">{posts.filter((post) => post.status === 'in_review').length}</p>
              </div>
              <div className="rounded-[12px] border border-[#eef3f5] p-3">
                <p className="text-[12px] text-[#6f7f85]">Publiés</p>
                <p className="text-[24px] text-[#273a41] font-['Abhaya_Libre:Bold',sans-serif]">{posts.filter((post) => post.status === 'published').length}</p>
              </div>
              <div className="rounded-[12px] border border-[#eef3f5] p-3">
                <p className="text-[12px] text-[#6f7f85]">Archivés</p>
                <p className="text-[24px] text-[#273a41] font-['Abhaya_Libre:Bold',sans-serif]">{posts.filter((post) => post.status === 'archived').length}</p>
              </div>
              <div className="rounded-[12px] border border-[#eef3f5] p-3">
                <p className="text-[12px] text-[#6f7f85]">MAJ 7j</p>
                <p className="text-[24px] text-[#273a41] font-['Abhaya_Libre:Bold',sans-serif]">{editorialAnalytics?.recentlyUpdated.length ?? cmsStats.recentlyUpdatedCount}</p>
              </div>
            </div>
          </AdminPanel>

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
                        /{post.slug} • {getStatusLabel(post.status)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {post.status === 'draft' ? (
                        <button
                          onClick={() => transitionPostStatus(post, 'in_review')}
                          disabled={statusTransitioningPostId === post.id || !canEditContent}
                          className="px-3 py-2 border border-sky-200 text-sky-700 rounded-[10px] disabled:opacity-50"
                        >
                          Soumettre revue
                        </button>
                      ) : null}
                      {post.status !== 'published' ? (
                        <button
                          onClick={() => transitionPostStatus(post, 'published')}
                          disabled={statusTransitioningPostId === post.id || !canPublishContent || post.status === 'archived'}
                          className="px-3 py-2 border border-emerald-200 text-emerald-700 rounded-[10px] disabled:opacity-50"
                        >
                          Publier
                        </button>
                      ) : (
                        <button
                          onClick={() => transitionPostStatus(post, 'draft')}
                          disabled={statusTransitioningPostId === post.id || !canReviewContent}
                          className="px-3 py-2 border border-amber-200 text-amber-700 rounded-[10px] disabled:opacity-50"
                        >
                          Dépublier
                        </button>
                      )}
                      {post.status !== 'archived' ? (
                        <button
                          onClick={() => transitionPostStatus(post, 'archived')}
                          disabled={statusTransitioningPostId === post.id}
                          className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2"
                        >
                          <Archive size={14} /> Archiver
                        </button>
                      ) : null}
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

          {(!canDeleteContent || !canPublishContent) ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-center gap-2">
              <AlertTriangle size={16} />
              {!canPublishContent ? 'Publication réservée aux éditeurs/administrateurs. ' : ''}
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

    if (currentSection === 'users') {
      return (
        <div className="space-y-6">
          <AdminPageHeader
            title="Utilisateurs"
            subtitle="Gestion des comptes (rôle, statut, fournisseur, vérification) avec traçabilité d’audit."
            actions={
              <button
                type="button"
                onClick={() => {
                  void loadAdminUsers();
                  if (user?.role === 'admin') {
                    void loadAuditEvents();
                  }
                }}
                className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] text-[14px]"
              >
                Rafraîchir
              </button>
            }
          />
          {adminUsersError ? <AdminErrorState label={adminUsersError} /> : null}
          {adminUsersLoading ? <AdminLoadingState label="Chargement des utilisateurs..." /> : null}
          {user?.role !== 'admin' ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-amber-800 text-[14px]">
              Les modifications de rôle et suspension sont réservées aux administrateurs.
            </div>
          ) : null}
          <AdminPanel title="Comptes">
            {adminUsers.length === 0 ? (
              <AdminEmptyState label="Aucun utilisateur trouvé." />
            ) : (
              <div className="space-y-3">
                {adminUsers.map((entry) => (
                  <div key={entry.id} className="rounded-[12px] border border-[#eef3f5] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{entry.name}</p>
                        <p className="text-[13px] text-[#6f7f85]">{entry.email}</p>
                      </div>
                      <div className="text-[12px] text-[#7b868c]">{entry.authProvider ?? 'local'} • {entry.emailVerified ? 'vérifié' : 'non vérifié'}</div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <select
                        value={entry.role}
                        disabled={updatingUserId === entry.id || user?.role !== 'admin' || user?.id === entry.id}
                        onChange={(event) => void patchAdminUser(entry.id, { role: event.target.value as AppUser['role'] })}
                        className="rounded-[10px] border border-[#d8e4e8] px-2 py-2 text-[14px]"
                      >
                        {['admin', 'editor', 'author', 'viewer', 'client'].map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <select
                        value={entry.accountStatus ?? 'active'}
                        disabled={updatingUserId === entry.id || user?.role !== 'admin' || user?.id === entry.id}
                        onChange={(event) => void patchAdminUser(entry.id, { accountStatus: event.target.value as AppUser['accountStatus'] })}
                        className="rounded-[10px] border border-[#d8e4e8] px-2 py-2 text-[14px]"
                      >
                        {['active', 'invited', 'suspended'].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={updatingUserId === entry.id || user?.role !== 'admin'}
                        onClick={() => void patchAdminUser(entry.id, { emailVerified: !entry.emailVerified })}
                        className="rounded-[10px] border border-[#d8e4e8] px-2 py-2 text-[14px]"
                      >
                        {entry.emailVerified ? 'Marquer non vérifié' : 'Marquer vérifié'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
          {user?.role === 'admin' ? (
            <AdminPanel title="Journal d’audit (identité)">
              {auditLoading ? <AdminLoadingState label="Chargement du journal d’audit..." /> : null}
              {!auditLoading && auditEvents.length === 0 ? <AdminEmptyState label="Aucun événement disponible." /> : null}
              {!auditLoading && auditEvents.length > 0 ? (
                <div className="space-y-2">
                  {auditEvents.slice(0, 20).map((event, index) => (
                    <div key={`${String(event.at ?? index)}-${index}`} className="rounded-[10px] border border-[#eef3f5] px-3 py-2 text-[13px] text-[#4b5a60]">
                      <span className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{String(event.event ?? 'event')}</span>
                      {' · '}
                      <span>{String(event.outcome ?? 'unknown')}</span>
                      {' · '}
                      <span>{event.at ? new Date(String(event.at)).toLocaleString('fr-FR') : 'n/a'}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </AdminPanel>
          ) : null}
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
