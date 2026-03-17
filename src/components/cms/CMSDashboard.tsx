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
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useAuth, type AuthAuditEvent } from '../../contexts/AuthContext';
import type { AppUser } from '../../utils/securityPolicy';
import { blogRepository, BlogRepositoryError } from '../../repositories/blogRepository';
import { cmsRepository } from '../../repositories/cmsRepository';
import { mediaRepository } from '../../repositories/mediaRepository';
import { projectRepository } from '../../repositories/projectRepository';
import { serviceRepository } from '../../repositories/serviceRepository';
import { pageContentRepository } from '../../repositories/pageContentRepository';
import { defaultHomePageContent, type HomePageContentSettings } from '../../data/pageContentSeed';
import {
  deleteBackendBlogPost,
  deleteBackendMediaFile,
  deleteBackendProject,
  deleteBackendService,
  fetchBackendBlogPosts,
  fetchBackendMediaFiles,
  fetchBackendPageContent,
  fetchBackendProjects,
  fetchBackendServices,
  fetchBackendSettings,
  fetchEditorialAnalytics,
  fetchBackendMediaReferences,
  fetchSyncDiagnostics,
  fetchSettingsHistory,
  requestWithRetry,
  rollbackSettingsVersion,
  saveBackendBlogPost,
  saveBackendPageContent,
  saveBackendProject,
  saveBackendService,
  saveBackendSettings,
  transitionBackendBlogPost,
  transitionBackendProject,
  uploadBackendMediaFile,
  ContentApiError,
  type CmsSettings,
  type EditorialAnalytics,
  type SettingsHistoryEntry,
} from '../../utils/contentApi';
import { fromCmsBlogInput, normalizeSlug } from '../../features/blog/blogEntryAdapter';
import { isMediaReference, resolveBlogMediaReference } from '../../features/blog/mediaReference';
import { isProjectMediaReference } from '../../features/projects/projectMedia';
import { isValidMediaFieldValue, toMediaReferenceValue } from '../../features/media/assetReference';
import type { BlogPost, Service } from '../../domain/contentSchemas';
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
  tags: string;
  featuredImage: string;
  readTime: string;
  status: BlogPost['status'];
  seoTitle: string;
  seoDescription: string;
  canonicalSlug: string;
  socialImage: string;
  publishedDate: string;
}

interface ProjectFormState {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  client: string;
  category: string;
  year: string;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  featured: boolean;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  tags: string;
  cardImage: string;
  heroImage: string;
  imageAlt: string;
  externalLink: string;
  caseStudyLink: string;
  galleryImages: string;
  testimonialText: string;
  testimonialAuthor: string;
  testimonialPosition: string;
}


type RuntimeMode = 'authoritative_remote' | 'degraded_local';
interface ServiceFormState {
  id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  iconLikeAsset: string;
  color: string;
  features: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  routeSlug: string;
  overviewDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  processTitle: string;
  processSteps: string;
}

const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SERVICE_ICONS = new Set(['palette', 'code', 'megaphone', 'video', 'box']);
const SERVICE_COLOR_PATTERN = /^from-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]\s+to-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]$/;
const BLOG_MANAGED_CATEGORIES = ['Développement Web', 'Communication', 'Branding', 'Marketing Digital', 'Innovation', 'Études de cas', 'Non classé'];
const BLOG_MANAGED_TAGS = ['React', 'Web Design', 'Performance', 'Innovation', 'Vidéo', 'Branding', 'Corporate', 'BTP', 'Logo Design', 'Identité Visuelle', 'Food', 'SEO', 'Social Media', 'CMS'];

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidMediaField = (value: string): boolean => isValidMediaFieldValue(value);

const EMPTY_BLOG_FORM: BlogFormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author: '',
  category: '',
  tags: '',
  featuredImage: '',
  readTime: '5 min',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  canonicalSlug: '',
  socialImage: '',
  publishedDate: new Date().toISOString(),
};

const EMPTY_SERVICE_FORM: ServiceFormState = {
  title: '',
  slug: '',
  description: '',
  shortDescription: '',
  icon: 'palette',
  iconLikeAsset: '',
  color: 'from-[#00b3e8] to-[#00c0e8]',
  features: '',
  status: 'published',
  featured: false,
  routeSlug: '',
  overviewDescription: '',
  ctaTitle: '',
  ctaDescription: '',
  ctaPrimaryLabel: '',
  ctaPrimaryHref: '',
  processTitle: '',
  processSteps: '',
};

const EMPTY_PROJECT_FORM: ProjectFormState = {
  title: '',
  slug: '',
  summary: '',
  client: '',
  category: '',
  year: new Date().getFullYear().toString(),
  status: 'draft',
  featured: false,
  description: '',
  challenge: '',
  solution: '',
  results: '',
  tags: '',
  cardImage: '',
  heroImage: '',
  imageAlt: '',
  externalLink: '',
  caseStudyLink: '',
  galleryImages: '',
  testimonialText: '',
  testimonialAuthor: '',
  testimonialPosition: '',
};

const toDateTimeLocalValue = (value: string): string => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
};

export default function CMSDashboard({ currentSection, onSectionChange }: CMSDashboardProps) {
  const { user, logout, canAccessCMS, fetchAdminUsers, fetchAdminAuditEvents, updateAdminUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sectionBusy, setSectionBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>('authoritative_remote');
  const [runtimeWarnings, setRuntimeWarnings] = useState<string[]>([]);
  const [syncDiagnosticsWarning, setSyncDiagnosticsWarning] = useState('');
  const [isHydratingBackend, setIsHydratingBackend] = useState(false);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [statusTransitioningPostId, setStatusTransitioningPostId] = useState<string | null>(null);
  const [blogEditorMode, setBlogEditorMode] = useState<'list' | 'create' | 'edit'>('list');
  const [blogForm, setBlogForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [blogFormErrors, setBlogFormErrors] = useState<Partial<Record<keyof BlogFormState, string>>>({});

  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsValues, setSettingsValues] = useState<CmsSettings>({ siteTitle: 'SMOVE', supportEmail: 'contact@smove.africa', instantPublishing: true });
  const [settingsHistory, setSettingsHistory] = useState<SettingsHistoryEntry[]>([]);

  const [projects, setProjects] = useState(() => projectRepository.getAll());
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectEditorMode, setProjectEditorMode] = useState<'list' | 'create' | 'edit'>('list');
  const [projectForm, setProjectForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM);
  const [projectFormErrors, setProjectFormErrors] = useState<Partial<Record<keyof ProjectFormState, string>>>({});
  const [services, setServices] = useState(() => serviceRepository.getAll());
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceEditorMode, setServiceEditorMode] = useState<'list' | 'create' | 'edit'>('list');
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(EMPTY_SERVICE_FORM);
  const [serviceFormErrors, setServiceFormErrors] = useState<Partial<Record<keyof ServiceFormState, string>>>({});
  const [mediaQuery, setMediaQuery] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string>('');
  const [mediaUploadError, setMediaUploadError] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [homeContentForm, setHomeContentForm] = useState<HomePageContentSettings>(() => pageContentRepository.getHomePageContent());
  const [homeContentSaving, setHomeContentSaving] = useState(false);
  const [homeContentError, setHomeContentError] = useState('');
  const [mediaVersion, setMediaVersion] = useState(0);
  const mediaFiles = useMemo(() => mediaRepository.getAll(), [mediaVersion]);
  const cmsStats = useMemo(() => cmsRepository.getStats(), [posts, mediaFiles.length, projects.length]);
  const canDeleteContent = user?.role === 'admin';
  const filteredMediaFiles = useMemo(() => {
    if (!mediaQuery.trim()) return mediaFiles;
    return mediaRepository.search(mediaQuery.trim());
  }, [mediaFiles, mediaQuery]);
  const selectedMedia = useMemo(() => mediaRepository.getById(selectedMediaId), [selectedMediaId, mediaFiles]);

  const mediaUsageIndex = useMemo(() => {
    const index = new Map<string, string[]>();
    const register = (reference: string | undefined, label: string) => {
      if (!reference || !reference.startsWith('media:')) return;
      const mediaId = reference.slice('media:'.length).trim();
      if (!mediaId) return;
      const entries = index.get(mediaId) || [];
      entries.push(label);
      index.set(mediaId, entries);
    };

    posts.forEach((post) => {
      register(post.featuredImage, `Blog • ${post.title} • featuredImage`);
      register(post.mediaRoles?.featuredImage, `Blog • ${post.title} • mediaRoles.featuredImage`);
      register(post.seo?.socialImage, `Blog • ${post.title} • seo.socialImage`);
      register(post.mediaRoles?.socialImage, `Blog • ${post.title} • mediaRoles.socialImage`);
      post.images.forEach((image) => register(image, `Blog • ${post.title} • images[]`));
    });

    projects.forEach((project) => {
      register(project.featuredImage, `Projet • ${project.title} • featuredImage`);
      register(project.mainImage, `Projet • ${project.title} • mainImage`);
      project.images.forEach((image) => register(image, `Projet • ${project.title} • images[]`));
    });

    register(homeContentForm.aboutImage, 'Home page • aboutImage');
    return index;
  }, [homeContentForm.aboutImage, posts, projects]);

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

  const instantPublishingEnabled =
    settingsValues.operationalSettings?.instantPublishing ?? settingsValues.instantPublishing;
  const siteSettingsTitle = settingsValues.siteSettings?.siteTitle ?? settingsValues.siteTitle;
  const siteSettingsSupportEmail = settingsValues.siteSettings?.supportEmail ?? settingsValues.supportEmail;
  const siteBrandMedia = settingsValues.siteSettings?.brandMedia || {};
  const managedBlogCategories = settingsValues.taxonomySettings?.blog?.managedCategories || BLOG_MANAGED_CATEGORIES;
  const managedBlogTags = settingsValues.taxonomySettings?.blog?.managedTags || BLOG_MANAGED_TAGS;

  useEffect(() => {
    let active = true;

    const load = async () => {
      setPostsLoading(true);
      try {
        const backendPosts = await requestWithRetry(() => fetchBackendBlogPosts(), { retries: 1, retryDelayMs: 250 });
        if (!active) return;
        setPosts(backendPosts);
        backendPosts.forEach((post) => blogRepository.save(post));
        setPostsError('');
      } catch {
        try {
          if (!active) return;
          setPosts(blogRepository.getAll());
          setPostsError('Backend indisponible, données locales affichées.');
          markDegradedMode('Blog: backend indisponible, lecture locale temporaire.');
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

      try {
        setProjectsLoading(true);
        const backendProjects = await requestWithRetry(() => fetchBackendProjects(), { retries: 1, retryDelayMs: 250 });
        if (!active) return;

        syncProjectsFromBackend(backendProjects);
      } catch {
        if (active) {
          setProjects(projectRepository.getAll());
          setProjectsError('Backend indisponible, données locales affichées temporairement.');
          markDegradedMode('Projets: backend indisponible, lecture locale temporaire.');
        }
      } finally {
        if (active) setProjectsLoading(false);
      }

      try {
        setServicesLoading(true);
        const backendServices = await requestWithRetry(() => fetchBackendServices(), { retries: 1, retryDelayMs: 250 });
        if (!active) return;

        setServices(serviceRepository.replaceAll(backendServices));
      } catch {
        if (active) {
          setServices(serviceRepository.getAll());
          setServicesError('Backend indisponible, données locales affichées temporairement.');
          markDegradedMode('Services: backend indisponible, lecture locale temporaire.');
        }
      } finally {
        if (active) setServicesLoading(false);
      }

      try {
        const backendMedia = await requestWithRetry(() => fetchBackendMediaFiles(), { retries: 1, retryDelayMs: 250 });
        if (!active) return;
        backendMedia.forEach((file) => mediaRepository.save(file));
        setMediaVersion((version) => version + 1);
      } catch {
        markDegradedMode('Médiathèque: backend indisponible, cache local affiché.');
      }

      try {
        const home = await requestWithRetry(() => fetchBackendPageContent(), { retries: 1, retryDelayMs: 250 });
        if (!active) return;
        const saved = pageContentRepository.saveHomePageContent(home);
        setHomeContentForm(saved);
      } catch {
        if (active) {
          setHomeContentForm(pageContentRepository.getHomePageContent());
          markDegradedMode('Contenu page: backend indisponible, lecture locale temporaire.');
        }
      }

      try {
        const settings = await requestWithRetry(() => fetchBackendSettings(), { retries: 1, retryDelayMs: 250 });
        if (active) setSettingsValues(settings);
      } catch {
        markDegradedMode('Paramètres CMS: backend indisponible, valeurs locales conservées.');
      }

      try {
        const history = await requestWithRetry(() => fetchSettingsHistory(20), { retries: 1, retryDelayMs: 250 });
        if (active) setSettingsHistory(history);
      } catch {
        markDegradedMode('Historique des paramètres indisponible.');
      }

      try {
        const diagnostics = await requestWithRetry(() => fetchSyncDiagnostics(), { retries: 1, retryDelayMs: 250 });
        if (!active) return;
        if (diagnostics.summary.invalidMediaReferenceCount > 0) {
          setSyncDiagnosticsWarning(`Synchronisation: ${diagnostics.summary.invalidMediaReferenceCount} référence(s) média invalide(s) détectée(s).`);
        } else {
          setSyncDiagnosticsWarning('');
        }
      } catch {
        if (active) {
          setSyncDiagnosticsWarning('Diagnostics de synchronisation indisponibles (backend non joignable).');
        }
      }
    };

    void load().then(() => {
      setRuntimeMode((prev) => (prev === 'degraded_local' ? prev : 'authoritative_remote'));
    });

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
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'media', label: 'Médiathèque', icon: ImageIcon },
    { id: 'content', label: 'Contenus pages', icon: FileText },
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

  const markDegradedMode = (reason: string) => {
    setRuntimeMode('degraded_local');
    setRuntimeWarnings((prev) => (prev.includes(reason) ? prev : [...prev, reason]));
  };

  const markAuthoritativeMode = () => {
    setRuntimeMode('authoritative_remote');
    setRuntimeWarnings([]);
  };

  const mapBlogError = (error: unknown) => {
    if (error instanceof ContentApiError && error.code === 'BLOG_VALIDATION_ERROR') {
      return 'Le format article est invalide (slug/date/image/URL).';
    }
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
        return 'Article non publiable: renseignez au minimum le titre et l’image vedette.';
      }
      if (error.message.includes('BLOG_INSTANT_PUBLISHING_DISABLED')) {
        return 'Publication instantanée désactivée: passez par la revue éditoriale et activez la publication pour publier.';
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
      tags: post.tags.join(', '),
      featuredImage: post.featuredImage,
      readTime: post.readTime,
      status: post.status,
      seoTitle: post.seo?.title || '',
      seoDescription: post.seo?.description || '',
      canonicalSlug: post.seo?.canonicalSlug || post.slug,
      socialImage: post.seo?.socialImage || '',
      publishedDate: post.publishedDate,
    });
    setBlogFormErrors({});
    setBlogEditorMode('edit');
  };

  const validateBlogForm = (form: BlogFormState) => {
    const errors: Partial<Record<keyof BlogFormState, string>> = {};
    if (!form.title.trim()) errors.title = 'Le titre est requis.';
    if (!form.featuredImage.trim()) errors.featuredImage = 'L’image vedette est requise pour les cartes.';
    if (form.featuredImage.trim() && !isValidMediaField(form.featuredImage)) {
      errors.featuredImage = 'Utilisez une URL valide ou une référence media:asset-id existante.';
    }
    if (form.socialImage.trim() && !isValidMediaField(form.socialImage)) {
      errors.socialImage = 'L’image sociale doit être une URL valide ou media:asset-id existant.';
    }
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
    if (blogHasUnsavedChanges && !window.confirm("Des modifications non enregistrées seront perdues. Continuer ?")) {
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
      tags: existing.tags.join(', '),
      featuredImage: existing.featuredImage,
      readTime: existing.readTime,
      status: existing.status,
      seoTitle: existing.seo?.title || '',
      seoDescription: existing.seo?.description || '',
      canonicalSlug: existing.seo?.canonicalSlug || existing.slug,
      socialImage: existing.seo?.socialImage || '',
      publishedDate: existing.publishedDate,
    };
    return JSON.stringify(normalizedExisting) !== JSON.stringify(blogForm);
  }, [blogEditorMode, blogForm, posts]);

  const saveBlogPost = async (nextStatus?: BlogPost['status']) => {
    if (!canEditContent) {
      setPostsError('Création/mise à jour non autorisée pour votre rôle.');
      return;
    }

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
      const saved = await requestWithRetry(() => saveBackendBlogPost(payload), { retries: 1, retryDelayMs: 250 });
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

  const saveSettings = async () => {
    if (!siteSettingsTitle.trim() || !siteSettingsSupportEmail.includes('@')) {
      setSectionError('Renseignez un nom de site et un email de support valide.');
      return;
    }

    setSettingsSaving(true);
    setSectionError('');
    try {
      const saved = await requestWithRetry(() => saveBackendSettings({
        ...settingsValues,
        siteSettings: {
          ...(settingsValues.siteSettings || {}),
          siteTitle: siteSettingsTitle,
          supportEmail: siteSettingsSupportEmail,
        },
        operationalSettings: {
          ...(settingsValues.operationalSettings || {}),
          instantPublishing: instantPublishingEnabled,
        },
        siteTitle: siteSettingsTitle,
        supportEmail: siteSettingsSupportEmail,
        instantPublishing: instantPublishingEnabled,
      }), { retries: 1, retryDelayMs: 300 });
      setSettingsValues(saved);
      const history = await requestWithRetry(() => fetchSettingsHistory(20), { retries: 1, retryDelayMs: 250 });
      setSettingsHistory(history);
      showSuccess('Paramètres enregistrés sur le backend.');
    } catch {
      setSectionError('Sauvegarde backend impossible. Réessayez.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const rollbackSettings = async (versionId: string) => {
    if (!window.confirm('Restaurer cette version des paramètres globaux ?')) {
      return;
    }

    setSettingsSaving(true);
    setSectionError('');
    try {
      const restored = await requestWithRetry(() => rollbackSettingsVersion(versionId), { retries: 1, retryDelayMs: 250 });
      setSettingsValues(restored);
      const history = await requestWithRetry(() => fetchSettingsHistory(20), { retries: 1, retryDelayMs: 250 });
      setSettingsHistory(history);
      showSuccess('Paramètres restaurés depuis l’historique.');
    } catch {
      setSectionError('Rollback impossible pour cette version.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const saveHomePageContent = async () => {
    if (!homeContentForm.heroTitleLine1.trim() || !homeContentForm.heroTitleLine2.trim()) {
      setHomeContentError('Le titre hero doit être renseigné.');
      return;
    }
    if (homeContentForm.aboutImage.trim() && !isValidMediaField(homeContentForm.aboutImage)) {
      setHomeContentError('Image À propos invalide. Utilisez une URL valide ou media:asset-id existant.');
      return;
    }

    setHomeContentSaving(true);
    setHomeContentError('');

    try {
      const savedRemote = await requestWithRetry(() => saveBackendPageContent(homeContentForm), { retries: 1, retryDelayMs: 250 });
      const saved = pageContentRepository.saveHomePageContent(savedRemote);
      setHomeContentForm(saved);
      showSuccess('Contenu de page enregistré via backend CMS.');
    } catch {
      markDegradedMode('Contenu page: écriture backend indisponible, aucune persistance locale automatique.');
      setHomeContentError('Backend indisponible: enregistrement annulé pour éviter une divergence de source de vérité.');
    } finally {
      setHomeContentSaving(false);
    }
  };

  const resetHomePageContent = () => {
    setHomeContentForm(pageContentRepository.getHomePageContent() || defaultHomePageContent);
    setHomeContentError('');
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
      slug: project.slug || '',
      summary: project.summary || '',
      client: project.client,
      category: project.category,
      year: project.year,
      status: project.status ?? 'published',
      featured: Boolean(project.featured),
      description: project.description,
      challenge: project.challenge,
      solution: project.solution,
      results: project.results.join('\n'),
      tags: project.tags.join(', '),
      cardImage: project.mediaRoles?.cardImage || project.featuredImage || project.mainImage,
      heroImage: project.mediaRoles?.heroImage || project.mainImage || project.featuredImage,
      imageAlt: project.imageAlt || project.title,
      externalLink: project.link || project.links?.live || '',
      caseStudyLink: project.links?.caseStudy || '',
      galleryImages: project.images.join('\n'),
      testimonialText: project.testimonial?.text || '',
      testimonialAuthor: project.testimonial?.author || '',
      testimonialPosition: project.testimonial?.position || '',
    });
    setProjectFormErrors({});
    setProjectsError('');
  };

  const validateProjectForm = (form: ProjectFormState) => {
    const errors: Partial<Record<keyof ProjectFormState, string>> = {};
    if (!form.title.trim()) errors.title = 'Le titre est requis.';
    if (form.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      errors.slug = 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets.';
    }
    if (form.year.trim() && !/^\d{4}$/.test(form.year.trim())) {
      errors.year = 'L’année doit être sur 4 chiffres (ex: 2026).';
    }
    if (!form.cardImage.trim()) errors.cardImage = 'L’image carte est requise pour les cartes.';
    if (form.cardImage.trim() && !isValidMediaField(form.cardImage)) {
      errors.cardImage = 'Image carte invalide. Utilisez une URL valide ou media:asset-id existant.';
    }
    if (form.heroImage.trim() && !isValidMediaField(form.heroImage)) {
      errors.heroImage = 'Image hero invalide. Utilisez une URL valide ou media:asset-id existant.';
    }
    if (form.caseStudyLink.trim() && !/^https?:\/\//i.test(form.caseStudyLink.trim())) {
      errors.caseStudyLink = 'Le lien case study doit commencer par http:// ou https://.';
    }
    if (form.externalLink.trim() && !/^https?:\/\//i.test(form.externalLink.trim())) {
      errors.externalLink = 'Le lien externe doit commencer par http:// ou https://.';
    }

    const galleryRefs = form.galleryImages.split('\n').map((line) => line.trim()).filter(Boolean);
    const invalidGallery = galleryRefs.find((entry) => !isValidMediaField(entry));
    if (invalidGallery) {
      errors.galleryImages = `Référence média invalide: ${invalidGallery}`;
    }

    const testimonialFields = [form.testimonialText, form.testimonialAuthor, form.testimonialPosition].map((value) => value.trim());
    const hasPartialTestimonial = testimonialFields.some(Boolean) && testimonialFields.some((value) => !value);
    if (hasPartialTestimonial) {
      errors.testimonialText = 'Complétez le témoignage (texte, auteur et poste) ou laissez les champs vides.';
    }

    if (form.status === 'published') {
      const summarySource = form.summary.trim() || form.description.trim();
      if (!summarySource || summarySource.length < 24) {
        errors.summary = "Pour publier, ajoutez un résumé/description d'au moins 24 caractères.";
      }
    }

    return errors;
  };

  const mapProjectSaveError = (error: unknown) => {
    if (error instanceof ContentApiError) {
      if (error.status === 403) return 'Création/mise à jour non autorisée pour votre rôle.';
      if (error.code === 'PROJECT_SLUG_CONFLICT') return 'Ce slug projet existe déjà. Choisissez un slug unique.';
      if (error.code === 'PROJECT_VALIDATION_ERROR') return 'Le projet ne respecte pas le format attendu par le backend.';
      if (error.code === 'PROJECT_INVALID_STATUS_TRANSITION') return 'Transition de statut projet non autorisée.';
      if (error.code === 'PROJECT_NOT_PUBLISHABLE') return 'Ce projet ne peut pas être publié: complétez les champs requis.';
      if (error.code === 'PROJECT_INVALID_MEDIA_REFERENCE') return 'Le projet référence un média introuvable.';
      return `Sauvegarde impossible (${error.message}).`;
    }
    return 'Sauvegarde impossible. Vérifiez votre connexion puis réessayez.';
  };

  const loadProjectsFromBackend = async () => {
    setProjectsLoading(true);
    setProjectsError('');
    try {
      const backendProjects = await requestWithRetry(() => fetchBackendProjects(), { retries: 1, retryDelayMs: 250 });
      syncProjectsFromBackend(backendProjects);
    } catch {
      setProjectsError('Impossible de charger les projets depuis le backend.');
    } finally {
      setProjectsLoading(false);
    }
  };

  const syncProjectsFromBackend = (backendProjects: Awaited<ReturnType<typeof fetchBackendProjects>>) => {
    const normalized = projectRepository.replaceAll(backendProjects);
    setProjects(normalized);
  };

  const resetProjectEditor = () => {
    setProjectEditorMode('list');
    setProjectForm(EMPTY_PROJECT_FORM);
    setProjectFormErrors({});
  };

  const saveProject = async () => {
    if (!canEditContent) {
      setProjectsError('Création/mise à jour non autorisée pour votre rôle.');
      return;
    }

    const errors = validateProjectForm(projectForm);
    setProjectFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setProjectsError('Veuillez corriger les erreurs du projet avant d’enregistrer.');
      return;
    }

    setIsSavingProject(true);
    setProjectsError('');

    const normalizedSlug = normalizeSlug(projectForm.slug, projectForm.title);
    if (!PROJECT_SLUG_PATTERN.test(normalizedSlug)) {
      setProjectFormErrors((prev) => ({ ...prev, slug: 'Le slug généré est invalide. Modifiez le titre ou le slug.' }));
      setProjectsError('Slug invalide. Corrigez le titre ou le slug puis réessayez.');
      setIsSavingProject(false);
      return;
    }

    const normalizedGallery = projectForm.galleryImages
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const heroImage = projectForm.heroImage.trim() || projectForm.cardImage.trim();
    const images = normalizedGallery.length > 0 ? normalizedGallery : [heroImage].filter(Boolean);

    const payload = {
      id: projectForm.id || `project-${Date.now()}`,
      title: projectForm.title.trim(),
      slug: normalizedSlug,
      summary: projectForm.summary.trim() || undefined,
      client: projectForm.client.trim(),
      category: projectForm.category.trim(),
      year: projectForm.year.trim() || new Date().getFullYear().toString(),
      status: projectForm.status,
      featured: projectForm.featured,
      description: projectForm.description.trim(),
      challenge: projectForm.challenge.trim(),
      solution: projectForm.solution.trim(),
      results: projectForm.results.split('\n').map((line) => line.trim()).filter(Boolean),
      tags: projectForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      mainImage: heroImage || 'project cover image',
      featuredImage: projectForm.cardImage.trim() || heroImage || 'project cover image',
      mediaRoles: {
        cardImage: projectForm.cardImage.trim() || heroImage || 'project cover image',
        heroImage: heroImage || 'project cover image',
        galleryImages: images,
      },
      imageAlt: projectForm.imageAlt.trim() || projectForm.title.trim(),
      images,
      link: projectForm.externalLink.trim() || undefined,
      links:
        projectForm.externalLink.trim() || projectForm.caseStudyLink.trim()
          ? {
              live: projectForm.externalLink.trim() || undefined,
              caseStudy: projectForm.caseStudyLink.trim() || undefined,
            }
          : undefined,
      testimonial:
        projectForm.testimonialText.trim() && projectForm.testimonialAuthor.trim() && projectForm.testimonialPosition.trim()
          ? {
              text: projectForm.testimonialText.trim(),
              author: projectForm.testimonialAuthor.trim(),
              position: projectForm.testimonialPosition.trim(),
            }
          : undefined,
    };

    try {
      await requestWithRetry(() => saveBackendProject(payload), { retries: 1, retryDelayMs: 250 });
      const backendProjects = await requestWithRetry(() => fetchBackendProjects(), { retries: 1, retryDelayMs: 250 });
      syncProjectsFromBackend(backendProjects);
      showSuccess(projectEditorMode === 'create' ? 'Projet créé avec succès.' : 'Projet mis à jour avec succès.');
      resetProjectEditor();
    } catch (error) {
      setProjectsError(mapProjectSaveError(error));
    } finally {
      setIsSavingProject(false);
    }
  };



  const transitionProjectStatus = async (projectId: string, target: ProjectFormState['status']) => {
    if (target === 'in_review' && !canEditContent) {
      setProjectsError('Soumission en revue non autorisée pour votre rôle.');
      return;
    }
    if (target === 'published' && !canPublishContent) {
      setProjectsError('Publication non autorisée pour votre rôle.');
      return;
    }

    try {
      await requestWithRetry(() => transitionBackendProject(projectId, target), { retries: 1, retryDelayMs: 250 });
      const backendProjects = await requestWithRetry(() => fetchBackendProjects(), { retries: 1, retryDelayMs: 250 });
      syncProjectsFromBackend(backendProjects);
      showSuccess(target === 'published' ? 'Projet publié.' : target === 'in_review' ? 'Projet soumis en revue.' : 'Projet archivé.');
    } catch (error) {
      setProjectsError(mapProjectSaveError(error));
    }
  };

  const deleteProject = async (projectId: string, projectTitle: string) => {
    if (!canDeleteContent) {
      setProjectsError('Suppression non autorisée: rôle administrateur requis.');
      return;
    }

    if (!window.confirm(`Supprimer définitivement le projet "${projectTitle}" ?`)) {
      return;
    }

    try {
      await requestWithRetry(() => deleteBackendProject(projectId), { retries: 1, retryDelayMs: 250 });
      const backendProjects = await requestWithRetry(() => fetchBackendProjects(), { retries: 1, retryDelayMs: 250 });
      syncProjectsFromBackend(backendProjects);
      if (projectForm.id === projectId) {
        resetProjectEditor();
      }
      showSuccess('Projet supprimé.');
    } catch (error) {
      if (error instanceof ContentApiError && error.status === 403) {
        setProjectsError('Suppression non autorisée: rôle administrateur requis.');
        return;
      }
      setProjectsError('Suppression impossible. Vérifiez votre connexion puis réessayez.');
    }
  };

  const startCreateService = () => {
    setServiceEditorMode('create');
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceFormErrors({});
    setServicesError('');
  };

  const startEditService = (service: Service) => {
    setServiceEditorMode('edit');
    setServiceForm({
      id: service.id,
      title: service.title,
      slug: service.slug,
      description: service.description,
      shortDescription: service.shortDescription || '',
      icon: service.icon,
      iconLikeAsset: service.iconLikeAsset || '',
      color: service.color,
      features: service.features.join('\n'),
      status: service.status ?? 'published',
      featured: Boolean(service.featured),
      routeSlug: service.routeSlug || service.slug,
      overviewDescription: service.overviewDescription || '',
      ctaTitle: service.ctaTitle || '',
      ctaDescription: service.ctaDescription || '',
      ctaPrimaryLabel: service.ctaPrimaryLabel || '',
      ctaPrimaryHref: service.ctaPrimaryHref || '',
      processTitle: service.processTitle || '',
      processSteps: (service.processSteps || []).join('\n'),
    });
    setServiceFormErrors({});
    setServicesError('');
  };

  const validateServiceForm = (form: ServiceFormState) => {
    const errors: Partial<Record<keyof ServiceFormState, string>> = {};
    if (!form.title.trim()) errors.title = 'Le titre est requis.';
    if (!form.description.trim()) errors.description = 'La description est requise.';
    if (!form.icon.trim()) errors.icon = 'L’icône est requise.';
    if (!form.color.trim()) errors.color = 'La couleur est requise.';
    if (!form.features.trim()) errors.features = 'Ajoutez au moins une fonctionnalité.';
    if (form.icon.trim() && !SERVICE_ICONS.has(form.icon.trim())) {
      errors.icon = 'Icône invalide. Valeurs supportées: palette, code, megaphone, video, box.';
    }
    if (form.color.trim() && !SERVICE_COLOR_PATTERN.test(form.color.trim())) {
      errors.color = 'Couleur invalide. Format attendu: from-[#hex] to-[#hex].';
    }
    if (form.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      errors.slug = 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets.';
    }
    if (form.routeSlug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.routeSlug.trim())) {
      errors.routeSlug = 'Le routeSlug doit contenir uniquement des lettres minuscules, chiffres et tirets.';
    }
    if (form.iconLikeAsset.trim() && !isValidMediaField(form.iconLikeAsset)) {
      errors.iconLikeAsset = 'Icon asset invalide. Utilisez une URL valide ou media:asset-id existant.';
    }
    return errors;
  };

  const resetServiceEditor = () => {
    setServiceEditorMode('list');
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceFormErrors({});
  };

  const saveService = async () => {
    const errors = validateServiceForm(serviceForm);
    setServiceFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setServicesError('Veuillez corriger les erreurs du service avant d’enregistrer.');
      return;
    }

    setIsSavingService(true);
    setServicesError('');

    const payload: Service = {
      id: serviceForm.id || `service-${Date.now()}`,
      title: serviceForm.title.trim(),
      slug: serviceForm.slug.trim() || serviceForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      description: serviceForm.description.trim(),
      shortDescription: serviceForm.shortDescription.trim() || undefined,
      icon: serviceForm.icon.trim(),
      iconLikeAsset: serviceForm.iconLikeAsset.trim() || undefined,
      color: serviceForm.color.trim(),
      features: serviceForm.features.split('\n').map((entry) => entry.trim()).filter(Boolean),
      status: serviceForm.status,
      featured: serviceForm.featured,
      routeSlug: serviceForm.routeSlug.trim() || serviceForm.slug.trim() || serviceForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      overviewDescription: serviceForm.overviewDescription.trim() || undefined,
      ctaTitle: serviceForm.ctaTitle.trim() || undefined,
      ctaDescription: serviceForm.ctaDescription.trim() || undefined,
      ctaPrimaryLabel: serviceForm.ctaPrimaryLabel.trim() || undefined,
      ctaPrimaryHref: serviceForm.ctaPrimaryHref.trim() || undefined,
      processTitle: serviceForm.processTitle.trim() || undefined,
      processSteps: serviceForm.processSteps.split('\n').map((entry) => entry.trim()).filter(Boolean),
    };

    try {
      await requestWithRetry(() => saveBackendService(payload), { retries: 1, retryDelayMs: 250 });
      const backendServices = await requestWithRetry(() => fetchBackendServices(), { retries: 1, retryDelayMs: 250 });
      setServices(serviceRepository.replaceAll(backendServices));
      showSuccess(serviceEditorMode === 'create' ? 'Service créé avec succès.' : 'Service mis à jour avec succès.');
      resetServiceEditor();
    } catch {
      setServicesError('Enregistrement du service impossible: backend indisponible. Réessayez quand la synchronisation serveur est rétablie.');
    } finally {
      setIsSavingService(false);
    }
  };

  const deleteService = async (serviceId: string, serviceTitle: string) => {
    if (!canDeleteContent) {
      setServicesError('Suppression non autorisée: rôle administrateur requis.');
      return;
    }

    if (!window.confirm(`Supprimer définitivement le service "${serviceTitle}" ?`)) {
      return;
    }

    try {
      await requestWithRetry(() => deleteBackendService(serviceId), { retries: 1, retryDelayMs: 250 });
      const backendServices = await requestWithRetry(() => fetchBackendServices(), { retries: 1, retryDelayMs: 250 });
      setServices(serviceRepository.replaceAll(backendServices));
      if (serviceForm.id === serviceId) resetServiceEditor();
      showSuccess('Service supprimé.');
    } catch {
      setServicesError('Suppression impossible: backend indisponible. Réessayez quand la synchronisation serveur est rétablie.');
    }
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMediaUploadError('');
    setIsUploadingMedia(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Invalid media payload'));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = () => reject(new Error('Failed to read media file'));
        reader.readAsDataURL(file);
      });

      const uploaded = await requestWithRetry(
        () =>
          uploadBackendMediaFile({
            filename: file.name,
            title: file.name,
            dataUrl,
            alt: file.name,
          }),
        { retries: 1, retryDelayMs: 250 },
      );

      mediaRepository.save(uploaded);
      setSelectedMediaId(uploaded.id);
      setMediaVersion((version) => version + 1);
      showSuccess('Média uploadé et persisté sur le serveur.');
    } catch (error) {
      setMediaUploadError('Upload média impossible (format/taille ou backend indisponible).');
    } finally {
      setIsUploadingMedia(false);
      event.currentTarget.value = '';
    }
  };

  const deleteSelectedMedia = async () => {
    if (!selectedMedia) return;
    if (!canDeleteContent) {
      setSectionError('Suppression média non autorisée: rôle administrateur requis.');
      return;
    }
    const localReferences = mediaUsageIndex.get(selectedMedia.id) || [];
    if (localReferences.length > 0) {
      setSectionError(`Suppression refusée: média référencé localement (${localReferences.slice(0, 3).join(' | ')}).`);
      return;
    }

    if (!window.confirm(`Archiver le média "${selectedMedia.label || selectedMedia.name}" ?`)) {
      return;
    }

    try {
      await requestWithRetry(() => deleteBackendMediaFile(selectedMedia.id), { retries: 1, retryDelayMs: 250 });
      const refreshed = await requestWithRetry(() => fetchBackendMediaFiles(), { retries: 1, retryDelayMs: 250 });
      refreshed.forEach((file) => mediaRepository.save(file));
      setSelectedMediaId('');
      setMediaVersion((version) => version + 1);
      showSuccess('Média archivé (suppression irréversible évitée).');
    } catch (error) {
      if (error instanceof ContentApiError && error.code === 'MEDIA_IN_USE') {
        const references = await requestWithRetry(() => fetchBackendMediaReferences(selectedMedia.id), { retries: 1, retryDelayMs: 250 }).catch(() => []);
        const sample = references.slice(0, 3).map((ref) => `${ref.domain}:${ref.field}`).join(' | ');
        setSectionError(`Suppression refusée: ce média est référencé par du contenu${sample ? ` (${sample})` : ''}.`);
        return;
      }
      setSectionError('Suppression média impossible. Réessayez.');
    }
  };


  const renderProjectForm = () => {
    const title = projectEditorMode === 'create' ? 'Créer un projet' : 'Modifier un projet';

    return (
      <AdminPanel title={title}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProject();
          }}
        >
          {(['title', 'slug', 'client', 'category', 'year'] as const).map((fieldKey) => (
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
            <span className="text-[14px] text-[#6f7f85]">Image carte (URL ou media:asset-id)</span>
            <input
              value={projectForm.cardImage}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, cardImage: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              placeholder="https://... ou media:asset-id"
            />
            {projectFormErrors.cardImage ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.cardImage}</p> : null}
            {isProjectMediaReference(projectForm.cardImage) ? (
              <p className="text-[12px] text-[#6f7f85] mt-1">Référence média liée: {projectForm.cardImage}</p>
            ) : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Image hero détail (optionnel, URL ou media:asset-id)</span>
            <input
              value={projectForm.heroImage}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, heroImage: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              placeholder="URL ou media:asset-id (fallback sur image carte)"
            />
            {projectFormErrors.heroImage ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.heroImage}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Texte alternatif image</span>
            <input
              value={projectForm.imageAlt}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, imageAlt: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>
          <AdminActionBar>
            <button
              type="submit"
              disabled={isSavingProject}
              className="inline-flex items-center gap-2 bg-[#273a41] text-white px-4 py-2 rounded-[10px] disabled:opacity-60"
            >
              <Save size={16} /> {isSavingProject ? 'Validation...' : projectEditorMode === 'create' ? 'Valider et créer le projet' : 'Valider et enregistrer'}
            </button>
            <button type="button" onClick={resetProjectEditor} className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41]">
              Annuler
            </button>
          </AdminActionBar>
          {mediaFiles.length > 0 ? (
            <div className="rounded-[10px] bg-[#f5f9fa] p-3">
              <p className="text-[13px] text-[#6f7f85] mb-2">Sélecteur média (même contrat Blog/Projet: media:asset-id)</p>
              <div className="flex flex-wrap gap-2">
                {mediaFiles.slice(0, 6).map((file) => (
                  <button
                    type="button"
                    key={file.id}
                    onClick={() =>
                      setProjectForm((prev) => ({
                        ...prev,
                        cardImage: toMediaReferenceValue(file.id),
                        heroImage: prev.heroImage.trim() || toMediaReferenceValue(file.id),
                        imageAlt: prev.imageAlt.trim() || file.alt || prev.title || file.name,
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
          <label className="block">
            <span className="text-[13px] text-[#6f7f85]">Importer une image projet</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleMediaUpload(event);
              }}
              className="mt-1 w-full rounded-[10px] border border-dashed border-[#d8e4e8] px-3 py-2 text-[13px]"
            />
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Résumé court (optionnel)</span>
            <textarea
              value={projectForm.summary}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, summary: event.target.value }))}
              className="mt-1 w-full min-h-[80px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {projectFormErrors.summary ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.summary}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Statut</span>
            <select
              value={projectForm.status}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, status: event.target.value as ProjectFormState['status'] }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            >
              <option value="draft">Brouillon</option>
              <option value="in_review">En revue</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-[14px] text-[#6f7f85]">
            <input
              type="checkbox"
              checked={projectForm.featured}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, featured: event.target.checked }))}
            />
            Projet mis en avant
          </label>
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
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Galerie d’images (une URL/référence média par ligne)</span>
            <textarea
              value={projectForm.galleryImages}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, galleryImages: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              placeholder="media:asset-1\nhttps://..."
            />
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Lien Case Study (optionnel)</span>
            <input
              value={projectForm.caseStudyLink}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, caseStudyLink: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              placeholder="https://..."
            />
            {projectFormErrors.caseStudyLink ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.caseStudyLink}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Témoignage client</span>
            <textarea
              value={projectForm.testimonialText}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, testimonialText: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {projectFormErrors.testimonialText ? <p className="text-[12px] text-red-600 mt-1">{projectFormErrors.testimonialText}</p> : null}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[14px] text-[#6f7f85]">Auteur du témoignage</span>
              <input
                value={projectForm.testimonialAuthor}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, testimonialAuthor: event.target.value }))}
                className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-[14px] text-[#6f7f85]">Poste / rôle</span>
              <input
                value={projectForm.testimonialPosition}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, testimonialPosition: event.target.value }))}
                className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              />
            </label>
          </div>
          <AdminActionBar>
            <button
              type="submit"
              disabled={isSavingProject}
              className="inline-flex items-center gap-2 bg-[#273a41] text-white px-4 py-2 rounded-[10px] disabled:opacity-60"
            >
              <Save size={16} /> {isSavingProject ? 'Validation...' : projectEditorMode === 'create' ? 'Valider et créer le projet' : 'Valider et enregistrer'}
            </button>
            <button type="button" onClick={resetProjectEditor} className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41]">
              Annuler
            </button>
          </AdminActionBar>
        </form>
      </AdminPanel>
    );
  };

  const renderServiceForm = () => {
    const title = serviceEditorMode === 'create' ? 'Créer un service' : 'Modifier un service';

    return (
      <AdminPanel title={title}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveService();
          }}
        >
          {(['title', 'slug', 'routeSlug', 'icon', 'color'] as const).map((fieldKey) => (
            <label key={fieldKey} className="block">
              <span className="text-[14px] text-[#6f7f85]">{fieldKey}</span>
              <input
                value={serviceForm[fieldKey]}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, [fieldKey]: event.target.value }))}
                className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              />
              {serviceFormErrors[fieldKey] ? <p className="text-[12px] text-red-600 mt-1">{serviceFormErrors[fieldKey]}</p> : null}
            </label>
          ))}

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Description courte (optionnel)</span>
            <input
              value={serviceForm.shortDescription}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, shortDescription: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Icon-like asset (optionnel, URL ou media:asset-id)</span>
            <input
              value={serviceForm.iconLikeAsset}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, iconLikeAsset: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {serviceFormErrors.iconLikeAsset ? <p className="text-[12px] text-red-600 mt-1">{serviceFormErrors.iconLikeAsset}</p> : null}
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Description</span>
            <textarea
              value={serviceForm.description}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {serviceFormErrors.description ? <p className="text-[12px] text-red-600 mt-1">{serviceFormErrors.description}</p> : null}
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Fonctionnalités (une ligne par item)</span>
            <textarea
              value={serviceForm.features}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, features: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {serviceFormErrors.features ? <p className="text-[12px] text-red-600 mt-1">{serviceFormErrors.features}</p> : null}
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Résumé d'aperçu (section intro)</span>
            <textarea
              value={serviceForm.overviewDescription}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, overviewDescription: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Titre CTA</span>
            <input
              value={serviceForm.ctaTitle}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, ctaTitle: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Description CTA</span>
            <textarea
              value={serviceForm.ctaDescription}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, ctaDescription: event.target.value }))}
              className="mt-1 w-full min-h-[80px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[14px] text-[#6f7f85]">Libellé CTA primaire</span>
              <input
                value={serviceForm.ctaPrimaryLabel}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, ctaPrimaryLabel: event.target.value }))}
                className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-[14px] text-[#6f7f85]">Lien CTA primaire</span>
              <input
                value={serviceForm.ctaPrimaryHref}
                onChange={(event) => setServiceForm((prev) => ({ ...prev, ctaPrimaryHref: event.target.value }))}
                className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Titre processus</span>
            <input
              value={serviceForm.processTitle}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, processTitle: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Étapes du processus (une ligne par étape)</span>
            <textarea
              value={serviceForm.processSteps}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, processSteps: event.target.value }))}
              className="mt-1 w-full min-h-[90px] rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Statut</span>
            <select
              value={serviceForm.status}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, status: event.target.value as ServiceFormState['status'] }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            >
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-[14px] text-[#6f7f85]">
            <input
              type="checkbox"
              checked={serviceForm.featured}
              onChange={(event) => setServiceForm((prev) => ({ ...prev, featured: event.target.checked }))}
            />
            Service mis en avant
          </label>

          <AdminActionBar>
            <button
              onClick={saveService}
              disabled={isSavingService}
              className="inline-flex items-center gap-2 bg-[#273a41] text-white px-4 py-2 rounded-[10px] disabled:opacity-60"
            >
              <Save size={16} /> {isSavingService ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={resetServiceEditor} className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41]">
              Annuler
            </button>
          </AdminActionBar>
        </form>
      </AdminPanel>
    );
  };

  const renderBlogForm = () => {
    const title = blogEditorMode === 'create' ? 'Créer un article' : 'Modifier un article';

    return (
      <AdminPanel title={title}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveBlogPost();
          }}
        >
          {(['title', 'slug', 'author', 'readTime'] as const).map((fieldKey) => (
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
            <span className="text-[14px] text-[#6f7f85]">Catégorie (taxonomie gérée)</span>
            <input
              list="blog-managed-categories"
              value={blogForm.category}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, category: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            <datalist id="blog-managed-categories">
              {managedBlogCategories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <p className="text-[12px] text-[#6f7f85] mt-1">Utilisez prioritairement les catégories gérées pour éviter la dérive taxonomique.</p>
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Tags (virgule séparateur, taxonomie gérée)</span>
            <input
              value={blogForm.tags}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, tags: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              placeholder={managedBlogTags.slice(0, 5).join(', ')}
            />
            <p className="text-[12px] text-[#6f7f85] mt-1">Tags gérés: {managedBlogTags.join(', ')}</p>
          </label>
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
            <span className="text-[14px] text-[#6f7f85]">Date de publication</span>
            <input
              type="datetime-local"
              value={toDateTimeLocalValue(blogForm.publishedDate)}
              onChange={(event) =>
                setBlogForm((prev) => ({
                  ...prev,
                  publishedDate: toIsoDateTime(event.target.value) || prev.publishedDate,
                }))
              }
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {blogFormErrors.publishedDate ? <p className="text-[12px] text-red-600 mt-1">{blogFormErrors.publishedDate}</p> : null}
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
            <span className="text-[14px] text-[#6f7f85]">Image sociale (SEO)</span>
            <input
              value={blogForm.socialImage}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, socialImage: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
              placeholder="https://... ou media:asset-id"
            />
          </label>
          <label className="block">
            <span className="text-[14px] text-[#6f7f85]">Image vedette (requête image / média)</span>
            <input
              value={blogForm.featuredImage}
              onChange={(event) => setBlogForm((prev) => ({ ...prev, featuredImage: event.target.value }))}
              className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
            />
            {blogFormErrors.featuredImage ? <p className="text-[12px] text-red-600 mt-1">{blogFormErrors.featuredImage}</p> : null}
            {isMediaReference(blogForm.featuredImage) ? (
              <p className="text-[12px] text-[#6f7f85] mt-1">Référence média liée: {blogForm.featuredImage}</p>
            ) : null}
          </label>
          {mediaFiles.length > 0 ? (
            <div className="rounded-[10px] bg-[#f5f9fa] p-3">
              <p className="text-[13px] text-[#6f7f85] mb-2">Sélecteur média (même contrat Blog/Projet: media:asset-id)</p>
              <div className="flex flex-wrap gap-2">
                {mediaFiles.slice(0, 6).map((file) => (
                  <button
                    type="button"
                    key={file.id}
                    onClick={() =>
                      setBlogForm((prev) => ({
                        ...prev,
                        featuredImage: toMediaReferenceValue(file.id),
                        socialImage: toMediaReferenceValue(file.id),
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
          <label className="block">
            <span className="text-[13px] text-[#6f7f85]">Importer une image d’article</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleMediaUpload(event);
              }}
              className="mt-1 w-full rounded-[10px] border border-dashed border-[#d8e4e8] px-3 py-2 text-[13px]"
            />
            <p className="text-[12px] text-[#6f7f85] mt-1">Après upload, sélectionnez le média ci-dessus pour le lier à l’article.</p>
          </label>

          {blogForm.featuredImage ? (
            <div className="rounded-[10px] border border-[#eef3f5] px-3 py-2 text-[12px] text-[#6f7f85]">
              Aperçu média: {resolveBlogMediaReference(blogForm.featuredImage, blogForm.title || 'Article').caption}
            </div>
          ) : null}
          <AdminActionBar>
            <button
              type="submit"
              disabled={isSavingPost}
              className="inline-flex items-center gap-2 bg-[#273a41] text-white px-4 py-2 rounded-[10px] disabled:opacity-60"
            >
              <Save size={16} /> {isSavingPost ? 'Enregistrement...' : blogEditorMode === 'create' ? 'Valider et créer l’article' : 'Valider et enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => {
                void saveBlogPost('draft');
              }}
              disabled={isSavingPost}
              className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41] disabled:opacity-60"
            >
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              onClick={() => {
                void saveBlogPost('in_review');
              }}
              disabled={isSavingPost || !canEditContent || !instantPublishingEnabled}
              className="px-4 py-2 rounded-[10px] bg-[#00b3e8] text-white disabled:opacity-60"
            >
              Soumettre en revue
            </button>
            <button type="button" onClick={resetBlogEditor} className="px-4 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41]">
              Annuler
            </button>
          </AdminActionBar>
          {!canEditContent ? (
            <p className="text-[12px] text-amber-700">Soumission en revue réservée aux rôles auteur/éditeur/administrateur.</p>
          ) : null}
          {blogHasUnsavedChanges ? (
            <p className="text-[12px] text-amber-700">Modifications non enregistrées en cours.</p>
          ) : null}
        </form>
      </AdminPanel>
    );
  };


  const hydrateBackendFromLocalSnapshot = async () => {
    if (!window.confirm("Hydrater le backend depuis l'instantané local ? Cette action peut écraser des données distantes.")) {
      return;
    }

    setIsHydratingBackend(true);
    setSectionError('');
    try {
      const localPosts = blogRepository.getAll();
      const localProjects = projectRepository.getAll();
      const localServices = serviceRepository.getAll();
      const localHome = pageContentRepository.getHomePageContent();

      for (const post of localPosts) {
        await requestWithRetry(() => saveBackendBlogPost(post), { retries: 1, retryDelayMs: 250 });
      }
      for (const project of localProjects) {
        await requestWithRetry(() => saveBackendProject(project), { retries: 1, retryDelayMs: 250 });
      }
      for (const service of localServices) {
        await requestWithRetry(() => saveBackendService(service), { retries: 1, retryDelayMs: 250 });
      }
      await requestWithRetry(() => saveBackendPageContent(localHome), { retries: 1, retryDelayMs: 250 });
      await requestWithRetry(() => saveBackendSettings({
        ...settingsValues,
        siteSettings: {
          ...(settingsValues.siteSettings || {}),
          siteTitle: siteSettingsTitle,
          supportEmail: siteSettingsSupportEmail,
        },
        operationalSettings: {
          ...(settingsValues.operationalSettings || {}),
          instantPublishing: instantPublishingEnabled,
        },
        siteTitle: siteSettingsTitle,
        supportEmail: siteSettingsSupportEmail,
        instantPublishing: instantPublishingEnabled,
      }), { retries: 1, retryDelayMs: 250 });

      const [backendPosts, backendProjects, backendServices, backendHome, backendSettings] = await Promise.all([
        requestWithRetry(() => fetchBackendBlogPosts(), { retries: 1, retryDelayMs: 250 }),
        requestWithRetry(() => fetchBackendProjects(), { retries: 1, retryDelayMs: 250 }),
        requestWithRetry(() => fetchBackendServices(), { retries: 1, retryDelayMs: 250 }),
        requestWithRetry(() => fetchBackendPageContent(), { retries: 1, retryDelayMs: 250 }),
        requestWithRetry(() => fetchBackendSettings(), { retries: 1, retryDelayMs: 250 }),
      ]);

      setPosts(backendPosts);
      backendPosts.forEach((post) => blogRepository.save(post));
      syncProjectsFromBackend(backendProjects);
      setServices(serviceRepository.replaceAll(backendServices));
      setHomeContentForm(pageContentRepository.saveHomePageContent(backendHome));
      setSettingsValues(backendSettings);
      markAuthoritativeMode();
      showSuccess("Hydratation manuelle terminée: backend synchronisé depuis le snapshot local.");
    } catch {
      markDegradedMode("Hydratation manuelle échouée: backend toujours indisponible.");
      setSectionError("Hydratation impossible. Vérifiez la connectivité backend puis réessayez.");
    } finally {
      setIsHydratingBackend(false);
    }
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
                disabled={!canEditContent}
                className="bg-[#00b3e8] text-white rounded-[12px] px-4 py-2 font-['Abhaya_Libre:Bold',sans-serif] disabled:opacity-60"
              >
                Nouveau projet
              </button>
            }
          />

          {projectsError ? <AdminErrorState label={projectsError} /> : null}
          {projectEditorMode !== 'list' ? renderProjectForm() : null}

          <AdminPanel title="Projets récents">
            {projectsLoading ? <AdminLoadingState label="Chargement des projets..." /> : null}
            {!projectsLoading ? (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void loadProjectsFromBackend()}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[14px] border border-[#d8e4e8] rounded-[10px] text-[#273a41]"
                >
                  <RotateCcw size={15} /> Rafraîchir
                </button>
              </div>
            ) : null}
            {!projectsLoading && projects.length === 0 ? (
              <AdminEmptyState label="Aucun projet trouvé. Créez votre premier projet pour commencer." />
            ) : null}
            {!projectsLoading && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-[12px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{project.title}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">{project.client} • {project.year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#9ba1a4]">{project.category}</span>
                      <span className={`text-[12px] px-2 py-1 rounded-full ${project.status === 'published' ? 'bg-green-50 text-green-700' : project.status === 'in_review' ? 'bg-sky-50 text-sky-700' : project.status === 'archived' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                        {project.status === 'published' ? 'Publié' : project.status === 'in_review' ? 'En revue' : project.status === 'archived' ? 'Archivé' : 'Brouillon'}
                      </span>
                      {project.status === 'draft' ? (<button onClick={() => void transitionProjectStatus(project.id, 'in_review')} disabled={!canEditContent} className="px-3 py-2 border border-sky-200 text-sky-700 rounded-[10px] inline-flex items-center gap-2 disabled:opacity-50">En revue</button>) : null}
                      {project.status === 'in_review' ? (<button onClick={() => void transitionProjectStatus(project.id, 'published')} disabled={!canPublishContent} className="px-3 py-2 border border-green-200 text-green-700 rounded-[10px] inline-flex items-center gap-2 disabled:opacity-50">Publier</button>) : null}
                      {project.status !== 'archived' ? (<button onClick={() => void transitionProjectStatus(project.id, 'archived')} disabled={!canPublishContent} className="px-3 py-2 border border-slate-200 text-slate-700 rounded-[10px] inline-flex items-center gap-2 disabled:opacity-50">Archiver</button>) : null}
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
            ) : null}
          </AdminPanel>
        </div>
      );
    }

    if (currentSection === 'services') {
      return (
        <div className="space-y-6">
          <AdminPageHeader
            title="Gestion des services"
            subtitle="Liste, édition et publication de vos services."
            actions={
              <button
                onClick={startCreateService}
                className="bg-[#00b3e8] text-white rounded-[12px] px-4 py-2 font-['Abhaya_Libre:Bold',sans-serif]"
              >
                Nouveau service
              </button>
            }
          />

          {servicesError ? <AdminErrorState label={servicesError} /> : null}
          {serviceEditorMode !== 'list' ? renderServiceForm() : null}

          <AdminPanel title="Services">
            {servicesLoading ? <AdminLoadingState label="Chargement des services…" /> : null}
            {!servicesLoading && services.length === 0 ? (
              <AdminEmptyState label="Aucun service trouvé. Créez votre premier service pour commencer." />
            ) : !servicesLoading ? (
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="rounded-[12px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{service.title}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">/{service.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] px-2 py-1 rounded-full ${service.status === 'published' ? 'bg-green-50 text-green-700' : service.status === 'archived' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                        {service.status === 'published' ? 'Publié' : service.status === 'archived' ? 'Archivé' : 'Brouillon'}
                      </span>
                      <button onClick={() => startEditService(service)} className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2">
                        <Pencil size={15} /> Modifier
                      </button>
                      <button
                        onClick={() => deleteService(service.id, service.title)}
                        disabled={!canDeleteContent}
                        className="px-3 py-2 border border-red-200 text-red-600 rounded-[10px] inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={15} /> Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null
            }
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
                disabled={!canEditContent}
                className="bg-[#00b3e8] text-white rounded-[12px] px-4 py-2 font-['Abhaya_Libre:Bold',sans-serif] disabled:opacity-60"
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
                          disabled={statusTransitioningPostId === post.id || !canPublishContent || post.status === 'archived' || !instantPublishingEnabled}
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
          <AdminPageHeader title="Médiathèque" subtitle="Fichiers validés et prêts à être utilisés dans le contenu CMS." />
          <AdminActionBar>
            <input value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} placeholder="Rechercher un média (nom, alt, tag)…" className="w-full max-w-[420px] rounded-[10px] border border-[#d8e4e8] px-3 py-2 text-[14px]" />
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#d8e4e8] text-[#273a41] cursor-pointer">
              <Upload size={14} /> {isUploadingMedia ? 'Upload…' : 'Uploader un fichier'}
              <input type="file" className="hidden" onChange={handleMediaUpload} disabled={!canEditContent || isUploadingMedia} />
            </label>
            <button type="button" onClick={() => { setMediaQuery(''); setSelectedMediaId(''); }} className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] text-[14px]">Réinitialiser</button>
          </AdminActionBar>
          {mediaUploadError ? <AdminErrorState label={mediaUploadError} /> : null}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
            <AdminPanel title="Ressources médias">
              {filteredMediaFiles.length === 0 ? (
                <AdminEmptyState label="Aucun média correspondant. Ajoutez des ressources ou modifiez la recherche." />
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredMediaFiles.map((file) => (
                    <button type="button" key={file.id} onClick={() => setSelectedMediaId(file.id)} className={`rounded-[12px] border p-4 text-left ${selectedMediaId === file.id ? 'border-[#00b3e8] bg-[#f0fbff]' : 'border-[#eef3f5]'}`}>
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{file.label || file.name}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">{file.type} • {Math.round(file.size / 1024)} KB • {(mediaUsageIndex.get(file.id)?.length || 0)} référence(s)</p>
                      <p className="text-[12px] text-[#8a969b] mt-1">{file.alt || 'alt non renseigné'}</p>
                    </button>
                  ))}
                </div>
              )}
            </AdminPanel>
            <AdminPanel title="Détails du média">
              {!selectedMedia ? (
                <AdminEmptyState label="Sélectionnez une ressource pour voir son contrat d’asset." />
              ) : (
                <div className="space-y-2 text-[14px] text-[#4b5a60]">
                  <p><span className="font-semibold">ID:</span> {selectedMedia.id}</p>
                  <p><span className="font-semibold">Source:</span> {selectedMedia.source || 'local-storage'}</p>
                  <p><span className="font-semibold">Alt:</span> {selectedMedia.alt || '—'}</p>
                  <p><span className="font-semibold">Titre:</span> {selectedMedia.title || selectedMedia.name}</p>
                  <p><span className="font-semibold">Créé:</span> {selectedMedia.createdAt || selectedMedia.uploadedDate}</p>
                  <p><span className="font-semibold">Mis à jour:</span> {selectedMedia.updatedAt || selectedMedia.uploadedDate}</p>
                  <div className="pt-1"><code className="text-[12px] bg-[#f5f9fa] px-2 py-1 rounded">{toMediaReferenceValue(selectedMedia.id)}</code></div>
                  {(mediaUsageIndex.get(selectedMedia.id)?.length || 0) > 0 ? (
                    <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                      Références actives:
                      <ul className="list-disc ml-4 mt-1">
                        {(mediaUsageIndex.get(selectedMedia.id) || []).slice(0, 6).map((usage) => (<li key={usage}>{usage}</li>))}
                      </ul>
                    </div>
                  ) : null}
                  <button type="button" onClick={deleteSelectedMedia} disabled={!canDeleteContent} className="mt-2 px-3 py-2 border border-red-200 text-red-600 rounded-[10px] disabled:opacity-50">Supprimer ce média</button>
                </div>
              )}
            </AdminPanel>
          </div>
        </div>
      );
    }

    if (currentSection === 'content') {
      return (
        <div className="space-y-6">
          <AdminPageHeader title="Contenus pages" subtitle="Sections éditables centralisées pour la page d’accueil." />
          {homeContentError ? <AdminErrorState label={homeContentError} /> : null}
          <AdminActionBar>
            <button type="button" onClick={saveHomePageContent} disabled={homeContentSaving || !canEditContent} className="px-3 py-2 rounded-[10px] bg-[#273a41] text-white disabled:opacity-60">{homeContentSaving ? 'Sauvegarde…' : 'Enregistrer'}</button>
            <button type="button" onClick={resetHomePageContent} className="px-3 py-2 border border-[#d8e4e8] rounded-[10px]">Recharger</button>
          </AdminActionBar>
          <AdminPanel title="Hero">
            <div className="grid md:grid-cols-2 gap-3">
              <input value={homeContentForm.heroBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroBadge: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Badge hero" />
              <input value={homeContentForm.heroTitleLine1} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroTitleLine1: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre ligne 1" />
              <input value={homeContentForm.heroTitleLine2} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroTitleLine2: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre ligne 2" />
              <input value={homeContentForm.heroPrimaryCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroPrimaryCtaLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA principal" />
              <input value={homeContentForm.heroSecondaryCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroSecondaryCtaLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA secondaire" />
              <textarea value={homeContentForm.heroDescription} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroDescription: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Description hero" />
            </div>
          </AdminPanel>
          <AdminPanel title="Services + À propos">
            <div className="grid md:grid-cols-2 gap-3">
              <input value={homeContentForm.servicesIntroTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, servicesIntroTitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre section services" />
              <input value={homeContentForm.servicesIntroSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, servicesIntroSubtitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Sous-titre services" />
              <input value={homeContentForm.aboutBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutBadge: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Badge à propos" />
              <input value={homeContentForm.aboutTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutTitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre à propos" />
              <textarea value={homeContentForm.aboutParagraphOne} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutParagraphOne: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Paragraphe 1" />
              <textarea value={homeContentForm.aboutParagraphTwo} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutParagraphTwo: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Paragraphe 2" />
              <select value={homeContentForm.aboutImage} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutImage: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2">
                <option value="">Image about par défaut</option>
                {mediaFiles.map((file) => (<option key={file.id} value={toMediaReferenceValue(file.id)}>{file.label || file.name}</option>))}
              </select>
            </div>
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
              {instantPublishingEnabled ? null : (
                <p className="text-[12px] text-amber-700">Publication instantanée désactivée: les actions "Publier" sont bloquées tant que ce mode reste inactif.</p>
              )}
              <button
                onClick={() => {
                  void hydrateBackendFromLocalSnapshot();
                }}
                disabled={isHydratingBackend}
                className="border border-amber-300 text-amber-800 rounded-[10px] px-4 py-2 disabled:opacity-60"
              >
                {isHydratingBackend ? 'Hydratation...' : 'Hydrater backend depuis local'}
              </button>
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] inline-flex items-center gap-2 disabled:opacity-60"
              >
                <RotateCcw size={15} /> Réessayer
              </button>
            </AdminActionBar>
          ) : null}
          <AdminPanel title="Paramètres (site + opérations)">
            <div className="space-y-3">
              <p className="text-[12px] text-[#6f7f85]">Autorité site: <span className="font-semibold">siteSettings</span> • Autorité opérationnelle: <span className="font-semibold">operationalSettings</span>.</p>
              <label className="block">
                <span className="text-[14px] text-[#6f7f85]">Nom du site</span>
                <input
                  value={siteSettingsTitle}
                  onChange={(event) => setSettingsValues((prev) => ({ ...prev, siteSettings: { ...(prev.siteSettings || {}), siteTitle: event.target.value }, siteTitle: event.target.value }))}
                  className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-[14px] text-[#6f7f85]">Email support</span>
                <input
                  value={siteSettingsSupportEmail}
                  onChange={(event) => setSettingsValues((prev) => ({ ...prev, siteSettings: { ...(prev.siteSettings || {}), supportEmail: event.target.value }, supportEmail: event.target.value }))}
                  className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                />
              </label>
              <p className="text-[12px] text-[#6f7f85]">Ces champs sont exposés au runtime public via <code>/content/public/settings</code>.</p>
              <div className="grid md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[14px] text-[#6f7f85]">Logo principal (URL ou media:asset-id)</span>
                  <input
                    value={siteBrandMedia.logo || ''}
                    onChange={(event) => setSettingsValues((prev) => ({
                      ...prev,
                      siteSettings: {
                        ...(prev.siteSettings || {}),
                        brandMedia: { ...(prev.siteSettings?.brandMedia || {}), logo: event.target.value },
                      },
                    }))}
                    className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-[14px] text-[#6f7f85]">Logo sombre (optionnel)</span>
                  <input
                    value={siteBrandMedia.logoDark || ''}
                    onChange={(event) => setSettingsValues((prev) => ({
                      ...prev,
                      siteSettings: {
                        ...(prev.siteSettings || {}),
                        brandMedia: { ...(prev.siteSettings?.brandMedia || {}), logoDark: event.target.value },
                      },
                    }))}
                    className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-[14px] text-[#6f7f85]">Favicon (URL ou media:asset-id)</span>
                  <input
                    value={siteBrandMedia.favicon || ''}
                    onChange={(event) => setSettingsValues((prev) => ({
                      ...prev,
                      siteSettings: {
                        ...(prev.siteSettings || {}),
                        brandMedia: { ...(prev.siteSettings?.brandMedia || {}), favicon: event.target.value },
                      },
                    }))}
                    className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-[14px] text-[#6f7f85]">Image sociale par défaut</span>
                  <input
                    value={siteBrandMedia.defaultSocialImage || ''}
                    onChange={(event) => setSettingsValues((prev) => ({
                      ...prev,
                      siteSettings: {
                        ...(prev.siteSettings || {}),
                        brandMedia: { ...(prev.siteSettings?.brandMedia || {}), defaultSocialImage: event.target.value },
                      },
                    }))}
                    className="mt-1 w-full rounded-[10px] border border-[#d8e4e8] px-3 py-2"
                  />
                </label>
              </div>
              <div className="rounded-[10px] border border-[#eef3f5] p-3">
                <p className="text-[12px] text-[#6f7f85] mb-2">Taxonomie blog gérée (baseline)</p>
                <p className="text-[12px] text-[#273a41]"><strong>Catégories:</strong> {managedBlogCategories.join(', ')}</p>
                <p className="text-[12px] text-[#273a41]"><strong>Tags:</strong> {managedBlogTags.join(', ')}</p>
              </div>
              <label className="flex items-center justify-between rounded-[12px] border border-[#eef3f5] p-4">
                <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[#273a41]">Autoriser la publication immédiate</span>
                <input
                  type="checkbox"
                  checked={instantPublishingEnabled}
                  onChange={(event) => setSettingsValues((prev) => ({ ...prev, operationalSettings: { ...(prev.operationalSettings || {}), instantPublishing: event.target.checked }, instantPublishing: event.target.checked }))}
                />
              </label>
              {instantPublishingEnabled ? null : (
                <p className="text-[12px] text-amber-700">Publication instantanée désactivée: les actions "Publier" sont bloquées tant que ce mode reste inactif.</p>
              )}
              <p className="text-[12px] text-[#6f7f85]">Ce garde-fou est appliqué côté serveur sur les transitions de publication.</p>
              <button
                onClick={() => {
                  void hydrateBackendFromLocalSnapshot();
                }}
                disabled={isHydratingBackend}
                className="border border-amber-300 text-amber-800 rounded-[10px] px-4 py-2 disabled:opacity-60"
              >
                {isHydratingBackend ? 'Hydratation...' : 'Hydrater backend depuis local'}
              </button>
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="bg-[#273a41] text-white rounded-[10px] px-4 py-2 disabled:opacity-60"
              >
                {settingsSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </AdminPanel>
          <AdminPanel title="Historique & rollback paramètres globaux">
            {settingsHistory.length === 0 ? <AdminEmptyState label="Aucun historique enregistré." /> : null}
            <div className="space-y-2">
              {settingsHistory.map((entry) => (
                <div key={entry.versionId} className="rounded-[10px] border border-[#eef3f5] px-3 py-2 flex items-center justify-between gap-3">
                  <div className="text-[12px] text-[#4b5a60]">
                    <p><strong>{entry.changedBy || 'unknown'}</strong> · {entry.changeSummary}</p>
                    <p>{new Date(entry.changedAt).toLocaleString('fr-FR')} · {entry.changedFields.join(', ') || 'Aucun champ changé'}</p>
                  </div>
                  <button
                    onClick={() => { void rollbackSettings(entry.versionId); }}
                    disabled={settingsSaving}
                    className="px-3 py-2 border border-[#d8e4e8] rounded-[10px] text-[12px]"
                  >
                    Restaurer
                  </button>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#f5f9fa] flex">
      <aside
        className={`fixed left-0 top-0 h-full bg-white shadow-xl z-50 ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}
      >
        <div className="p-6 border-b border-[#eef3f5] flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00b3e8] to-[#34c759] rounded-[10px] flex items-center justify-center">
                <span className="text-white font-['ABeeZee:Regular',sans-serif] text-[20px]">S</span>
              </div>
              <div>
                <h2 className="font-['ABeeZee:Regular',sans-serif] text-[18px] text-[#273a41]">SMOVE</h2>
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4]">CMS Admin</p>
              </div>
            </div>
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
              <div className="flex-1 min-w-0">
                <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-[#273a41] truncate">{user?.name}</p>
                <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4] truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all ${
                currentSection === item.id ? 'bg-[#00b3e8] text-white' : 'text-[#273a41] hover:bg-[#f5f9fa]'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px]">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#eef3f5]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px]">Déconnexion</span>}
          </button>
        </div>
      </aside>

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
          {runtimeMode === 'degraded_local' ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5" />
              <div>
                <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px]">Mode dégradé actif (degraded_local)</p>
                <p className="text-[13px]">Le backend n'est pas pleinement disponible. Les données affichées peuvent provenir du cache local et les écritures doivent être considérées non fiables.</p>
                {runtimeWarnings.length > 0 ? (
                  <ul className="list-disc ml-5 mt-2 text-[12px]">
                    {runtimeWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}
          {syncDiagnosticsWarning ? (
            <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-4 text-blue-800">
              <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px]">Observabilité CMS/public</p>
              <p className="text-[13px]">{syncDiagnosticsWarning}</p>
            </div>
          ) : null}
          {feedback ? <AdminSuccessFeedback label={feedback} /> : null}
          {currentSection === 'overview' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-[20px] p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-[12px] bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="text-white" size={24} />
                      </div>
                      <span className="text-[#34c759] font-['Abhaya_Libre:Bold',sans-serif] text-[14px]">{stat.change}</span>
                    </div>
                    <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[32px] text-[#273a41] mb-1">{stat.value}</h3>
                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {[['projects', 'Nouveau Projet', 'Ajouter un projet', 'from-[#00b3e8] to-[#00c0e8]'], ['blog', 'Nouvel Article', 'Rédiger un article', 'from-[#a855f7] to-[#9333ea]'], ['media', 'Upload Média', 'Ajouter des fichiers', 'from-[#ffc247] to-[#ff9f47]']].map(([id, title, subtitle, color]) => (
                  <button
                    key={id}
                    onClick={() => handleSectionChange(id)}
                    className={`bg-gradient-to-r ${color} text-white p-6 rounded-[20px] flex items-center justify-between group`}
                  >
                    <div className="text-left">
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[18px] mb-1">{title}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-white/80">{subtitle}</p>
                    </div>
                    <Plus className="group-hover:rotate-90 transition-transform" size={32} />
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-[20px] p-6 shadow-sm">
                <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-6">Activité Récente</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-[12px] hover:bg-[#f5f9fa] transition-colors"
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
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            renderSectionContent()
          )}
        </div>
      </main>
    </div>
  );
}
