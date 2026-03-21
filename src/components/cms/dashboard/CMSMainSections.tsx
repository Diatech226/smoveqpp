import { Archive, Pencil, RotateCcw, Trash2, Upload, AlertTriangle } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';
import type { BlogPost, MediaFile, Project, Service } from '../../../domain/contentSchemas';
import {
  AdminActionBar,
  AdminActionCluster,
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPanel,
  AdminStickyFormActions,
} from '../adminPrimitives';
import { toMediaReferenceValue } from '../../../features/media/assetReference';
import type { HomePageContentSettings } from '../../../data/pageContentSeed';

interface ProjectsSectionProps {
  canEditContent: boolean;
  canDeleteContent: boolean;
  canPublishContent: boolean;
  projectsError: string;
  projectsLoading: boolean;
  projects: Project[];
  projectEditorMode: 'list' | 'create' | 'edit';
  renderProjectForm: () => ReactNode;
  startCreateProject: () => void;
  startEditProject: (project: Project) => void;
  transitionProjectStatus: (projectId: string, targetStatus: Project['status']) => Promise<void>;
  deleteProject: (projectId: string, title: string) => Promise<void>;
  loadProjectsFromBackend: () => Promise<void>;
}

export function ProjectsSection(props: ProjectsSectionProps) {
  const {
    canEditContent,
    canDeleteContent,
    canPublishContent,
    projectsError,
    projectsLoading,
    projects,
    projectEditorMode,
    renderProjectForm,
    startCreateProject,
    startEditProject,
    transitionProjectStatus,
    deleteProject,
    loadProjectsFromBackend,
  } = props;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestion des projets"
        subtitle="Liste, édition et statut de vos projets portfolio."
        actions={
          <AdminButton
            onClick={startCreateProject}
            disabled={!canEditContent}
            intent="primary"
          >
            Nouveau projet
          </AdminButton>
        }
      />

      {projectsError ? <AdminErrorState label={projectsError} /> : null}
      {projectEditorMode !== 'list' ? renderProjectForm() : null}

      <AdminPanel title="Projets récents">
        {projectsLoading ? <AdminLoadingState label="Chargement des projets..." /> : null}
        {!projectsLoading ? (
          <div className="mb-4 flex justify-end">
            <AdminButton
              type="button"
              onClick={() => void loadProjectsFromBackend()}
              size="sm"
            >
              <RotateCcw size={15} /> Rafraîchir
            </AdminButton>
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
                <div className="flex items-center gap-4 flex-wrap justify-end">
                  <span className="text-[13px] text-[#9ba1a4]">{project.category}</span>
                  <span className={`text-[12px] px-2 py-1 rounded-full ${project.status === 'published' ? 'bg-green-50 text-green-700' : project.status === 'in_review' ? 'bg-sky-50 text-sky-700' : project.status === 'archived' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                    {project.status === 'published' ? 'Publié' : project.status === 'in_review' ? 'En revue' : project.status === 'archived' ? 'Archivé' : 'Brouillon'}
                  </span>
                  <AdminActionCluster>
                    {project.status === 'draft' ? (<AdminButton onClick={() => void transitionProjectStatus(project.id, 'in_review')} disabled={!canEditContent} intent="workflow" size="sm">En revue</AdminButton>) : null}
                    {project.status === 'in_review' ? (<AdminButton onClick={() => void transitionProjectStatus(project.id, 'published')} disabled={!canPublishContent} intent="workflow" size="sm">Publier</AdminButton>) : null}
                    {project.status !== 'archived' ? (<AdminButton onClick={() => void transitionProjectStatus(project.id, 'archived')} disabled={!canPublishContent} size="sm"><Archive size={14} /> Archiver</AdminButton>) : null}
                  </AdminActionCluster>
                  <AdminActionCluster>
                    <AdminButton onClick={() => startEditProject(project)} size="sm"><Pencil size={15} /> Modifier</AdminButton>
                  </AdminActionCluster>
                  <AdminActionCluster danger>
                    <AdminButton onClick={() => void deleteProject(project.id, project.title)} disabled={!canDeleteContent} intent="danger" size="sm"><Trash2 size={15} /> Supprimer</AdminButton>
                  </AdminActionCluster>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </AdminPanel>
    </div>
  );
}

interface ServicesSectionProps {
  canDeleteContent: boolean;
  servicesError: string;
  servicesLoading: boolean;
  services: Service[];
  serviceEditorMode: 'list' | 'create' | 'edit';
  renderServiceForm: () => ReactNode;
  startCreateService: () => void;
  startEditService: (service: Service) => void;
  deleteService: (serviceId: string, title: string) => Promise<void>;
}

export function ServicesSection({ canDeleteContent, servicesError, servicesLoading, services, serviceEditorMode, renderServiceForm, startCreateService, startEditService, deleteService }: ServicesSectionProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestion des services"
        subtitle="Liste, édition et publication de vos services."
        actions={<AdminButton onClick={startCreateService} intent="primary">Nouveau service</AdminButton>}
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
                <div className="flex items-center gap-4">
                  <span className={`text-[12px] px-2 py-1 rounded-full ${service.status === 'published' ? 'bg-green-50 text-green-700' : service.status === 'archived' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>
                    {service.status === 'published' ? 'Publié' : service.status === 'archived' ? 'Archivé' : 'Brouillon'}
                  </span>
                  <AdminActionCluster>
                    <AdminButton onClick={() => startEditService(service)} size="sm"><Pencil size={15} /> Modifier</AdminButton>
                  </AdminActionCluster>
                  <AdminActionCluster danger>
                    <AdminButton onClick={() => void deleteService(service.id, service.title)} disabled={!canDeleteContent} intent="danger" size="sm"><Trash2 size={15} /> Supprimer</AdminButton>
                  </AdminActionCluster>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </AdminPanel>
    </div>
  );
}

interface BlogSectionProps {
  canEditContent: boolean;
  canDeleteContent: boolean;
  canPublishContent: boolean;
  canReviewContent: boolean;
  postsError: string;
  postsLoading: boolean;
  posts: BlogPost[];
  blogEditorMode: 'list' | 'create' | 'edit';
  renderBlogForm: () => ReactNode;
  startCreatePost: () => void;
  retryLoadPosts: () => void;
  getStatusLabel: (status: BlogPost['status']) => string;
  transitionPostStatus: (post: BlogPost, nextStatus: BlogPost['status']) => Promise<void>;
  statusTransitioningPostId: string | null;
  instantPublishingEnabled: boolean;
  startEditPost: (post: BlogPost) => void;
  deletePost: (post: BlogPost) => Promise<void>;
  recentlyUpdatedCount: number;
}

export function BlogSection(props: BlogSectionProps) {
  const { canEditContent, canDeleteContent, canPublishContent, canReviewContent, postsError, postsLoading, posts, blogEditorMode, renderBlogForm, startCreatePost, retryLoadPosts, getStatusLabel, transitionPostStatus, statusTransitioningPostId, instantPublishingEnabled, startEditPost, deletePost, recentlyUpdatedCount } = props;
  return <div className="space-y-6">{/* intentionally compact - behavior preserved */}
    <AdminPageHeader title="Gestion du blog" subtitle="Liste, édition, validation et publication des articles." actions={<AdminButton onClick={startCreatePost} disabled={!canEditContent} intent="primary">Nouvel article</AdminButton>} />
    {postsError ? <AdminActionBar><AdminErrorState label={postsError} /><AdminButton onClick={retryLoadPosts}><RotateCcw size={15} /> Réessayer</AdminButton></AdminActionBar> : null}
    {postsLoading ? <AdminLoadingState label="Chargement des articles..." /> : null}
    {blogEditorMode !== 'list' ? renderBlogForm() : null}
    <AdminPanel title="Synthèse éditoriale"><div className="grid grid-cols-1 md:grid-cols-5 gap-3">{[['draft', 'Brouillons'], ['in_review', 'En revue'], ['published', 'Publiés'], ['archived', 'Archivés']].map(([status, label]) => (<div key={status} className="rounded-[12px] border border-[#eef3f5] p-3"><p className="text-[12px] text-[#6f7f85]">{label}</p><p className="text-[24px] text-[#273a41] font-['Abhaya_Libre:Bold',sans-serif]">{posts.filter((post) => post.status === status).length}</p></div>))}<div className="rounded-[12px] border border-[#eef3f5] p-3"><p className="text-[12px] text-[#6f7f85]">MAJ 7j</p><p className="text-[24px] text-[#273a41] font-['Abhaya_Libre:Bold',sans-serif]">{recentlyUpdatedCount}</p></div></div></AdminPanel>
    <AdminPanel title="Articles">{posts.length === 0 ? <AdminEmptyState label="Aucun article disponible." /> : <div className="space-y-3">{posts.map((post) => (<div key={post.id} className="rounded-[12px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between gap-4"><div><p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{post.title}</p><p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">/{post.slug} • {getStatusLabel(post.status)}</p></div><div className="flex items-center gap-4 flex-wrap justify-end"><AdminActionCluster>{post.status === 'draft' ? <AdminButton onClick={() => void transitionPostStatus(post, 'in_review')} disabled={statusTransitioningPostId === post.id || !canEditContent} intent="workflow" size="sm">Soumettre revue</AdminButton> : null}{post.status !== 'published' ? <AdminButton onClick={() => void transitionPostStatus(post, 'published')} disabled={statusTransitioningPostId === post.id || !canPublishContent || post.status === 'archived' || !instantPublishingEnabled} intent="workflow" size="sm">Publier</AdminButton> : <AdminButton onClick={() => void transitionPostStatus(post, 'draft')} disabled={statusTransitioningPostId === post.id || !canReviewContent} intent="workflow" size="sm">Dépublier</AdminButton>}{post.status !== 'archived' ? <AdminButton onClick={() => void transitionPostStatus(post, 'archived')} disabled={statusTransitioningPostId === post.id} size="sm"><Archive size={14} /> Archiver</AdminButton> : null}</AdminActionCluster><AdminActionCluster><AdminButton onClick={() => startEditPost(post)} size="sm"><Pencil size={15} /> Modifier</AdminButton></AdminActionCluster><AdminActionCluster danger><AdminButton onClick={() => void deletePost(post)} disabled={!canDeleteContent} intent="danger" size="sm" title={canDeleteContent ? 'Supprimer cet article' : 'Réservé aux administrateurs'}><Trash2 size={15} /> Supprimer</AdminButton></AdminActionCluster></div></div>))}</div>}</AdminPanel>
    {(!canDeleteContent || !canPublishContent) ? <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-center gap-2"><AlertTriangle size={16} />{!canPublishContent ? 'Publication réservée aux éditeurs/administrateurs. ' : ''}Les suppressions définitives sont réservées au rôle administrateur.</div> : null}
  </div>;
}

interface MediaSectionProps {
  mediaQuery: string;
  setMediaQuery: (value: string) => void;
  setSelectedMediaId: (value: string) => void;
  isUploadingMedia: boolean;
  handleMediaUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  canEditContent: boolean;
  mediaUploadError: string;
  filteredMediaFiles: MediaFile[];
  selectedMediaId: string;
  selectedMedia?: MediaFile;
  mediaUsageIndex: Map<string, string[]>;
  canDeleteContent: boolean;
  deleteSelectedMedia: () => void;
}

export function MediaSection({ mediaQuery, setMediaQuery, setSelectedMediaId, isUploadingMedia, handleMediaUpload, canEditContent, mediaUploadError, filteredMediaFiles, selectedMediaId, selectedMedia, mediaUsageIndex, canDeleteContent, deleteSelectedMedia }: MediaSectionProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Médiathèque" subtitle="Fichiers validés et prêts à être utilisés dans le contenu CMS." />
      <AdminActionBar>
        <input value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} placeholder="Rechercher un média (nom, alt, tag)…" className="w-full max-w-[420px] rounded-[10px] border border-[#d8e4e8] px-3 py-2 text-[14px]" />
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#273a41] bg-[#273a41] text-white cursor-pointer text-[14px]"><Upload size={14} /> {isUploadingMedia ? 'Upload…' : 'Uploader un fichier'}<input type="file" className="hidden" onChange={(event) => { void handleMediaUpload(event); }} disabled={!canEditContent || isUploadingMedia} /></label>
        <AdminButton type="button" onClick={() => { setMediaQuery(''); setSelectedMediaId(''); }}>Réinitialiser</AdminButton>
      </AdminActionBar>
      {mediaUploadError ? <AdminErrorState label={mediaUploadError} /> : null}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-4"><AdminPanel title="Ressources médias">{filteredMediaFiles.length === 0 ? <AdminEmptyState label="Aucun média correspondant. Ajoutez des ressources ou modifiez la recherche." /> : <div className="grid md:grid-cols-2 gap-3">{filteredMediaFiles.map((file) => (<button type="button" key={file.id} onClick={() => setSelectedMediaId(file.id)} className={`rounded-[12px] border p-4 text-left ${selectedMediaId === file.id ? 'border-[#00b3e8] bg-[#f0fbff]' : 'border-[#eef3f5]'}`}><p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{file.label || file.name}</p><p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">{file.type} • {Math.round(file.size / 1024)} KB • {(mediaUsageIndex.get(file.id)?.length || 0)} référence(s)</p><p className="text-[12px] text-[#8a969b] mt-1">{file.alt || 'alt non renseigné'}</p></button>))}</div>}</AdminPanel><AdminPanel title="Détails du média">{!selectedMedia ? <AdminEmptyState label="Sélectionnez une ressource pour voir son contrat d’asset." /> : <div className="space-y-2 text-[14px] text-[#4b5a60]"><p><span className="font-semibold">ID:</span> {selectedMedia.id}</p><p><span className="font-semibold">Source:</span> {selectedMedia.source || 'local-storage'}</p><p><span className="font-semibold">Alt:</span> {selectedMedia.alt || '—'}</p><p><span className="font-semibold">Titre:</span> {selectedMedia.title || selectedMedia.name}</p><p><span className="font-semibold">Créé:</span> {selectedMedia.createdAt || selectedMedia.uploadedDate}</p><p><span className="font-semibold">Mis à jour:</span> {selectedMedia.updatedAt || selectedMedia.uploadedDate}</p><div className="pt-1"><code className="text-[12px] bg-[#f5f9fa] px-2 py-1 rounded">{toMediaReferenceValue(selectedMedia.id)}</code></div>{(mediaUsageIndex.get(selectedMedia.id)?.length || 0) > 0 ? <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">Références actives:<ul className="list-disc ml-4 mt-1">{(mediaUsageIndex.get(selectedMedia.id) || []).slice(0, 6).map((usage) => (<li key={usage}>{usage}</li>))}</ul></div> : null}<AdminActionCluster danger><AdminButton type="button" onClick={deleteSelectedMedia} disabled={!canDeleteContent} intent="danger" size="sm">Supprimer ce média</AdminButton></AdminActionCluster></div>}</AdminPanel></div>
    </div>
  );
}

interface PageContentSectionProps {
  homeContentError: string;
  saveHomePageContent: () => void;
  homeContentSaving: boolean;
  canEditContent: boolean;
  resetHomePageContent: () => void;
  homeContentForm: HomePageContentSettings;
  setHomeContentForm: (updater: (prev: HomePageContentSettings) => HomePageContentSettings) => void;
  mediaFiles: MediaFile[];
}

export function PageContentSection({ homeContentError, saveHomePageContent, homeContentSaving, canEditContent, resetHomePageContent, homeContentForm, setHomeContentForm, mediaFiles }: PageContentSectionProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Contenus pages" subtitle="Sections éditables centralisées pour la page d’accueil." />
      {homeContentError ? <AdminErrorState label={homeContentError} /> : null}
      <AdminStickyFormActions>
        <AdminActionCluster>
          <AdminButton type="button" onClick={resetHomePageContent}>Recharger</AdminButton>
        </AdminActionCluster>
        <AdminActionCluster>
          <AdminButton type="button" onClick={saveHomePageContent} disabled={homeContentSaving || !canEditContent} intent="primary">{homeContentSaving ? 'Sauvegarde…' : 'Enregistrer'}</AdminButton>
        </AdminActionCluster>
      </AdminStickyFormActions>
      <p className="text-[12px] text-[#6f7f85]">Ces champs pilotent la homepage publique. Les liens CTA acceptent <code>#ancre</code>, <code>/route</code> ou <code>https://</code>.</p>
      <AdminPanel title="Hero">
        <p className="text-[12px] text-[#6f7f85] mb-3">Contenu affiché au-dessus de la ligne de flottaison sur la page d’accueil.</p>
        <div className="grid md:grid-cols-2 gap-3"><input value={homeContentForm.heroBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroBadge: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Badge hero (ex: Studio digital)" /><input value={homeContentForm.heroTitleLine1} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroTitleLine1: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre ligne 1 (hero)" /><input value={homeContentForm.heroTitleLine2} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroTitleLine2: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre ligne 2 (hero)" /><input value={homeContentForm.heroPrimaryCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroPrimaryCtaLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA principal (label)" /><input value={homeContentForm.heroPrimaryCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroPrimaryCtaHref: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA principal (lien)" /><input value={homeContentForm.heroSecondaryCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroSecondaryCtaLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA secondaire (label)" /><input value={homeContentForm.heroSecondaryCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroSecondaryCtaHref: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA secondaire (lien)" /><textarea value={homeContentForm.heroDescription} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroDescription: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Description hero (paragraphe introductif)" /></div>
      </AdminPanel>
      <AdminPanel title="Services + À propos"><div className="grid md:grid-cols-2 gap-3"><input value={homeContentForm.servicesIntroTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, servicesIntroTitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre section services" /><input value={homeContentForm.servicesIntroSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, servicesIntroSubtitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Sous-titre services" /><input value={homeContentForm.aboutBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutBadge: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Badge à propos" /><input value={homeContentForm.aboutTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutTitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre à propos" /><textarea value={homeContentForm.aboutParagraphOne} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutParagraphOne: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Paragraphe 1" /><textarea value={homeContentForm.aboutParagraphTwo} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutParagraphTwo: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Paragraphe 2" /><input value={homeContentForm.aboutCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutCtaLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA à propos (label)" /><input value={homeContentForm.aboutCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutCtaHref: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA à propos (lien)" /><select value={homeContentForm.aboutImage} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutImage: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2"><option value="">Image about par défaut</option>{mediaFiles.map((file) => (<option key={file.id} value={toMediaReferenceValue(file.id)}>{file.label || file.name}</option>))}</select></div></AdminPanel>
      <AdminPanel title="Sections Projets + Blog + Contact">
        <div className="space-y-4">
          <div className="rounded-[10px] border border-[#eef3f5] p-3">
            <p className="text-[13px] text-[#273a41] font-semibold mb-2">Bloc Projets (portfolio)</p>
            <div className="grid md:grid-cols-2 gap-3"><input value={homeContentForm.portfolioBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioBadge: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Badge portfolio (au-dessus du titre)" /><input value={homeContentForm.portfolioTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioTitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre portfolio" /><textarea value={homeContentForm.portfolioSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioSubtitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[70px]" placeholder="Sous-titre portfolio" /><input value={homeContentForm.portfolioCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioCtaLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA projets (label)" /><input value={homeContentForm.portfolioCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioCtaHref: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA projets (lien)" /></div>
          </div>
          <div className="rounded-[10px] border border-[#eef3f5] p-3">
            <p className="text-[13px] text-[#273a41] font-semibold mb-2">Bloc Blog</p>
            <div className="grid md:grid-cols-2 gap-3"><input value={homeContentForm.blogBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogBadge: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Badge blog" /><input value={homeContentForm.blogTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogTitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre blog" /><textarea value={homeContentForm.blogSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogSubtitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[70px]" placeholder="Sous-titre blog" /><input value={homeContentForm.blogCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogCtaLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA blog (label)" /><input value={homeContentForm.blogCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogCtaHref: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="CTA blog (lien)" /></div>
          </div>
          <div className="rounded-[10px] border border-[#eef3f5] p-3">
            <p className="text-[13px] text-[#273a41] font-semibold mb-2">Bloc Contact</p>
            <div className="grid md:grid-cols-2 gap-3"><input value={homeContentForm.contactTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, contactTitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Titre contact" /><input value={homeContentForm.contactSubmitLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, contactSubmitLabel: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2" placeholder="Libellé bouton contact" /><textarea value={homeContentForm.contactSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, contactSubtitle: event.target.value }))} className="rounded-[10px] border border-[#d8e4e8] px-3 py-2 md:col-span-2 min-h-[90px]" placeholder="Sous-titre contact" /></div>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
