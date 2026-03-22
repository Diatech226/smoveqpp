import { Archive, Pencil, RotateCcw, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';
import type { BlogPost, MediaFile, Project, Service } from '../../../domain/contentSchemas';
import {
  AdminActionBar,
  AdminActionCluster,
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  ADMIN_FIELD_LABEL_CLASS,
  ADMIN_HELPER_TEXT_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SECTION_SUBCARD,
  ADMIN_TEXTAREA_CLASS,
  AdminLoadingState,
  AdminPageHeader,
  AdminPanel,
  AdminStickyFormActions,
  AdminWarningState,
} from '../adminPrimitives';
import { toMediaReferenceValue } from '../../../features/media/assetReference';
import type { HomePageContentSettings } from '../../../data/pageContentSeed';
import { getMetadataCompleteness, summarizeReferences, type BackendMediaReference } from './mediaGovernance';

const ROW_CONTAINER = 'rounded-[14px] border border-[#e4edf1] bg-[#fcfeff] px-4 py-3.5 shadow-[0_4px_14px_rgba(20,51,63,0.04)]';
const ROW_TITLE = "font-['Abhaya_Libre:Bold',sans-serif] text-[17px] text-[#273a41] leading-tight";
const ROW_META = "font-['Abhaya_Libre:Regular',sans-serif] text-[13px] text-[#688088]";
const ROW_ACTIONS = 'flex flex-wrap items-center justify-start gap-2 lg:justify-end';

function renderStatusChip(status: string) {
  const styles =
    status === 'published'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'in_review'
        ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
        : status === 'archived'
          ? 'border-slate-200 bg-slate-100 text-slate-600'
          : 'border-amber-200 bg-amber-50 text-amber-700';

  const label =
    status === 'published' ? 'Publié' : status === 'in_review' ? 'En revue' : status === 'archived' ? 'Archivé' : 'Brouillon';

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium ${styles}`}>{label}</span>;
}

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
          <AdminButton onClick={startCreateProject} disabled={!canEditContent} intent="primary">
            Nouveau projet
          </AdminButton>
        }
      />

      {projectsError ? <AdminErrorState label={projectsError} /> : null}
      {projectEditorMode !== 'list' ? renderProjectForm() : null}

      <AdminPanel title="Projets récents">
        {projectsLoading ? <AdminLoadingState label="Chargement des projets..." /> : null}
        {!projectsLoading ? (
          <div className="mb-2 flex justify-end">
            <AdminButton type="button" onClick={() => void loadProjectsFromBackend()} size="sm">
              <RotateCcw size={15} /> Rafraîchir
            </AdminButton>
          </div>
        ) : null}
        {!projectsLoading && projects.length === 0 ? <AdminEmptyState label="Aucun projet trouvé. Créez votre premier projet pour commencer." /> : null}
        {!projectsLoading && projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className={`${ROW_CONTAINER} grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_auto_minmax(280px,1fr)] lg:items-center`}>
                <div className="space-y-1">
                  <p className={ROW_TITLE}>{project.title}</p>
                  <p className={ROW_META}>{project.client} • {project.year} • {project.category}</p>
                </div>
                <div>{renderStatusChip(project.status)}</div>
                <div className={ROW_ACTIONS}>
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
              <div key={service.id} className={`${ROW_CONTAINER} grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_auto_minmax(220px,1fr)] lg:items-center`}>
                <div className="space-y-1">
                  <p className={ROW_TITLE}>{service.title}</p>
                  <p className={ROW_META}>/{service.slug}</p>
                </div>
                <div>{renderStatusChip(service.status)}</div>
                <div className={ROW_ACTIONS}>
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
    <AdminPanel title="Synthèse éditoriale"><div className="grid grid-cols-1 gap-3 md:grid-cols-5">{[['draft', 'Brouillons'], ['in_review', 'En revue'], ['published', 'Publiés'], ['archived', 'Archivés']].map(([status, label]) => (<div key={status} className="rounded-[14px] border border-[#e4edf1] bg-[#fcfeff] p-3.5"><p className="text-[12px] text-[#6f7f85]">{label}</p><p className="font-['Abhaya_Libre:Bold',sans-serif] text-[24px] text-[#273a41]">{posts.filter((post) => post.status === status).length}</p></div>))}<div className="rounded-[14px] border border-[#e4edf1] bg-[#fcfeff] p-3.5"><p className="text-[12px] text-[#6f7f85]">MAJ 7j</p><p className="font-['Abhaya_Libre:Bold',sans-serif] text-[24px] text-[#273a41]">{recentlyUpdatedCount}</p></div></div></AdminPanel>
    <AdminPanel title="Articles">{posts.length === 0 ? <AdminEmptyState label="Aucun article disponible." /> : <div className="space-y-3">{posts.map((post) => (<div key={post.id} className={`${ROW_CONTAINER} grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_auto_minmax(320px,1fr)] lg:items-center`}><div className="space-y-1"><p className={ROW_TITLE}>{post.title}</p><p className={ROW_META}>/{post.slug} • {getStatusLabel(post.status)}</p></div><div>{renderStatusChip(post.status)}</div><div className={ROW_ACTIONS}><AdminActionCluster>{post.status === 'draft' ? <AdminButton onClick={() => void transitionPostStatus(post, 'in_review')} disabled={statusTransitioningPostId === post.id || !canEditContent} intent="workflow" size="sm">Soumettre revue</AdminButton> : null}{post.status !== 'published' ? <AdminButton onClick={() => void transitionPostStatus(post, 'published')} disabled={statusTransitioningPostId === post.id || !canPublishContent || post.status === 'archived' || !instantPublishingEnabled} intent="workflow" size="sm">Publier</AdminButton> : <AdminButton onClick={() => void transitionPostStatus(post, 'draft')} disabled={statusTransitioningPostId === post.id || !canReviewContent} intent="workflow" size="sm">Dépublier</AdminButton>}{post.status !== 'archived' ? <AdminButton onClick={() => void transitionPostStatus(post, 'archived')} disabled={statusTransitioningPostId === post.id} size="sm"><Archive size={14} /> Archiver</AdminButton> : null}</AdminActionCluster><AdminActionCluster><AdminButton onClick={() => startEditPost(post)} size="sm"><Pencil size={15} /> Modifier</AdminButton></AdminActionCluster><AdminActionCluster danger><AdminButton onClick={() => void deletePost(post)} disabled={!canDeleteContent} intent="danger" size="sm" title={canDeleteContent ? 'Supprimer cet article' : 'Réservé aux administrateurs'}><Trash2 size={15} /> Supprimer</AdminButton></AdminActionCluster></div></div>))}</div>}</AdminPanel>
    {(!canDeleteContent || !canPublishContent) ? <AdminWarningState label={`${!canPublishContent ? 'Publication réservée aux éditeurs/administrateurs. ' : ''}Les suppressions définitives sont réservées au rôle administrateur.`} /> : null}
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
  authoritativeReferences: BackendMediaReference[];
  authoritativeReferencesLoading: boolean;
  authoritativeReferencesError: string;
  localFallbackUsages: string[];
  canDeleteContent: boolean;
  deleteSelectedMedia: (references: BackendMediaReference[]) => void;
}

export function MediaSection({
  mediaQuery,
  setMediaQuery,
  setSelectedMediaId,
  isUploadingMedia,
  handleMediaUpload,
  canEditContent,
  mediaUploadError,
  filteredMediaFiles,
  selectedMediaId,
  selectedMedia,
  authoritativeReferences,
  authoritativeReferencesLoading,
  authoritativeReferencesError,
  localFallbackUsages,
  canDeleteContent,
  deleteSelectedMedia,
}: MediaSectionProps) {
  const selectedReferenceSummary = summarizeReferences(authoritativeReferences);
  const selectedMetadataCompleteness = selectedMedia ? getMetadataCompleteness(selectedMedia) : null;
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Médiathèque" subtitle="Fichiers validés et prêts à être utilisés dans le contenu CMS." />
      <AdminActionBar>
        <input value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} placeholder="Rechercher un média (nom, alt, tag)…" className={`w-full max-w-[420px] ${ADMIN_INPUT_CLASS}`} />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#00b3e8] bg-[#00b3e8] px-4 py-2 text-[14px] text-white transition-colors hover:bg-[#009dcd]"><Upload size={14} /> {isUploadingMedia ? 'Upload…' : 'Uploader un fichier'}<input type="file" className="hidden" onChange={(event) => { void handleMediaUpload(event); }} disabled={!canEditContent || isUploadingMedia} /></label>
        <AdminButton type="button" onClick={() => { setMediaQuery(''); setSelectedMediaId(''); }}>Réinitialiser</AdminButton>
      </AdminActionBar>
      {mediaUploadError ? <AdminErrorState label={mediaUploadError} /> : null}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]"><AdminPanel title="Ressources médias">{filteredMediaFiles.length === 0 ? <AdminEmptyState label="Aucun média correspondant. Ajoutez des ressources ou modifiez la recherche." /> : <div className="grid gap-3 md:grid-cols-2">{filteredMediaFiles.map((file) => (<button type="button" key={file.id} onClick={() => setSelectedMediaId(file.id)} className={`rounded-[14px] border p-4 text-left transition ${selectedMediaId === file.id ? 'border-[#00b3e8] bg-[#f0fbff] shadow-[0_0_0_1px_rgba(0,179,232,0.15)]' : 'border-[#e4edf1] bg-[#fcfeff] hover:border-[#d6e4ea]'}`}><p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{file.label || file.name}</p><p className="font-['Abhaya_Libre:Regular',sans-serif] text-[13px] text-[#6f7f85]">{file.type} • {Math.round(file.size / 1024)} KB</p><p className="mt-1 text-[12px] text-[#8a969b]">{file.alt || 'alt non renseigné'}</p></button>))}</div>}</AdminPanel><AdminPanel title="Détails du média">{!selectedMedia ? <AdminEmptyState label="Sélectionnez une ressource pour inspecter et gouverner cet asset." /> : <div className="space-y-4 text-[14px] text-[#4b5a60]"><div className={ADMIN_SECTION_SUBCARD}><p className="mb-2 text-[13px] font-semibold text-[#273a41]">Inspection asset</p><p><span className={ADMIN_FIELD_LABEL_CLASS}>ID:</span> {selectedMedia.id}</p><p><span className={ADMIN_FIELD_LABEL_CLASS}>Source:</span> {selectedMedia.source || 'local-storage'}</p><p><span className={ADMIN_FIELD_LABEL_CLASS}>Titre:</span> {selectedMedia.title || selectedMedia.name}</p><p><span className={ADMIN_FIELD_LABEL_CLASS}>Créé:</span> {selectedMedia.createdAt || selectedMedia.uploadedDate}</p><p><span className={ADMIN_FIELD_LABEL_CLASS}>Mis à jour:</span> {selectedMedia.updatedAt || selectedMedia.uploadedDate}</p><p><span className={ADMIN_FIELD_LABEL_CLASS}>Référence:</span> <code className="rounded bg-[#f5f9fa] px-2 py-1 text-[12px]">{toMediaReferenceValue(selectedMedia.id)}</code></p></div><div className={ADMIN_SECTION_SUBCARD}><p className="mb-2 text-[13px] font-semibold text-[#273a41]">Gouvernance • Où utilisé (source serveur)</p>{authoritativeReferencesLoading ? <p className="text-[12px] text-[#6f7f85]">Analyse des références actives…</p> : null}{authoritativeReferencesError ? <p className="text-[12px] text-amber-700">{authoritativeReferencesError}</p> : null}{!authoritativeReferencesLoading ? <p className="text-[12px] text-[#5e7077]">{selectedReferenceSummary.total === 0 ? 'Aucune référence active détectée par le graphe backend.' : `${selectedReferenceSummary.total} référence(s) active(s) détectée(s).`}</p> : null}{selectedReferenceSummary.byDomain.length > 0 ? <ul className="mt-2 space-y-1 text-[12px] text-[#4b5a60]">{selectedReferenceSummary.byDomain.map((domain) => (<li key={domain.domain}>• {domain.label}: {domain.count}</li>))}</ul> : null}{selectedReferenceSummary.sample.length > 0 ? <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-[#5b6a70]">{selectedReferenceSummary.sample.map((usage) => (<li key={usage}>{usage}</li>))}</ul> : null}{!authoritativeReferencesLoading && authoritativeReferences.length === 0 && localFallbackUsages.length > 0 ? <p className="mt-2 text-[12px] text-amber-700">Indice local non-bloquant: {localFallbackUsages.slice(0, 3).join(' | ')}</p> : null}</div><div className={ADMIN_SECTION_SUBCARD}><p className="mb-2 text-[13px] font-semibold text-[#273a41]">Complétude métadonnées</p>{selectedMetadataCompleteness ? <ul className="space-y-1 text-[12px]"><li>Alt: {selectedMetadataCompleteness.alt ? 'présent' : 'manquant'}</li><li>Caption: {selectedMetadataCompleteness.caption ? 'présente' : 'manquante'}</li><li>Tags: {selectedMetadataCompleteness.tags ? 'présents' : 'manquants'}</li></ul> : null}</div><div className="rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-3 text-[12px] text-rose-800"><p className="mb-2 font-semibold">Danger zone</p><p>Action d’archivage protégée: impossible si des références actives existent.</p><p className="mt-1">{selectedReferenceSummary.total > 0 ? 'État actuel: archivage bloqué (références actives).' : 'État actuel: archivage autorisé (aucune référence active).'}</p><AdminActionCluster danger><AdminButton type="button" onClick={() => deleteSelectedMedia(authoritativeReferences)} disabled={!canDeleteContent || authoritativeReferencesLoading} intent="danger" size="sm">Archiver ce média</AdminButton></AdminActionCluster></div></div>}</AdminPanel></div>
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
      <p className={ADMIN_HELPER_TEXT_CLASS}>Ces champs pilotent la homepage publique. Les liens CTA acceptent <code>#ancre</code>, <code>/route</code> ou <code>https://</code>.</p>
      <AdminPanel title="Hero">
        <p className={`mb-3 ${ADMIN_HELPER_TEXT_CLASS}`}>Contenu affiché au-dessus de la ligne de flottaison sur la page d’accueil.</p>
        <div className="grid gap-3 md:grid-cols-2"><input value={homeContentForm.heroBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroBadge: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Badge hero (ex: Studio digital)" /><input value={homeContentForm.heroTitleLine1} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroTitleLine1: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Titre ligne 1 (hero)" /><input value={homeContentForm.heroTitleLine2} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroTitleLine2: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Titre ligne 2 (hero)" /><input value={homeContentForm.heroPrimaryCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroPrimaryCtaLabel: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA principal (label)" /><input value={homeContentForm.heroPrimaryCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroPrimaryCtaHref: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA principal (lien)" /><input value={homeContentForm.heroSecondaryCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroSecondaryCtaLabel: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA secondaire (label)" /><input value={homeContentForm.heroSecondaryCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroSecondaryCtaHref: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA secondaire (lien)" /><textarea value={homeContentForm.heroDescription} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, heroDescription: event.target.value }))} className={`${ADMIN_TEXTAREA_CLASS} md:col-span-2`} placeholder="Description hero (paragraphe introductif)" /></div>
      </AdminPanel>
      <AdminPanel title="Services + À propos"><div className="grid gap-3 md:grid-cols-2"><input value={homeContentForm.servicesIntroTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, servicesIntroTitle: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Titre section services" /><input value={homeContentForm.servicesIntroSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, servicesIntroSubtitle: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Sous-titre services" /><input value={homeContentForm.aboutBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutBadge: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Badge à propos" /><input value={homeContentForm.aboutTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutTitle: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Titre à propos" /><textarea value={homeContentForm.aboutParagraphOne} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutParagraphOne: event.target.value }))} className={`${ADMIN_TEXTAREA_CLASS} md:col-span-2`} placeholder="Paragraphe 1" /><textarea value={homeContentForm.aboutParagraphTwo} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutParagraphTwo: event.target.value }))} className={`${ADMIN_TEXTAREA_CLASS} md:col-span-2`} placeholder="Paragraphe 2" /><input value={homeContentForm.aboutCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutCtaLabel: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA à propos (label)" /><input value={homeContentForm.aboutCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutCtaHref: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA à propos (lien)" /><select value={homeContentForm.aboutImage} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, aboutImage: event.target.value }))} className={`${ADMIN_INPUT_CLASS} md:col-span-2`}><option value="">Image about par défaut</option>{mediaFiles.map((file) => (<option key={file.id} value={toMediaReferenceValue(file.id)}>{file.label || file.name}</option>))}</select></div></AdminPanel>
      <AdminPanel title="Sections Projets + Blog + Contact">
        <div className="space-y-4">
          <div className={ADMIN_SECTION_SUBCARD}>
            <p className="mb-2 text-[13px] font-semibold text-[#273a41]">Bloc Projets (portfolio)</p>
            <div className="grid gap-3 md:grid-cols-2"><input value={homeContentForm.portfolioBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioBadge: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Badge portfolio (au-dessus du titre)" /><input value={homeContentForm.portfolioTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioTitle: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Titre portfolio" /><textarea value={homeContentForm.portfolioSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioSubtitle: event.target.value }))} className={`${ADMIN_TEXTAREA_CLASS} min-h-[70px] md:col-span-2`} placeholder="Sous-titre portfolio" /><input value={homeContentForm.portfolioCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioCtaLabel: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA projets (label)" /><input value={homeContentForm.portfolioCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, portfolioCtaHref: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA projets (lien)" /></div>
          </div>
          <div className={ADMIN_SECTION_SUBCARD}>
            <p className="mb-2 text-[13px] font-semibold text-[#273a41]">Bloc Blog</p>
            <div className="grid gap-3 md:grid-cols-2"><input value={homeContentForm.blogBadge} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogBadge: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Badge blog" /><input value={homeContentForm.blogTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogTitle: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Titre blog" /><textarea value={homeContentForm.blogSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogSubtitle: event.target.value }))} className={`${ADMIN_TEXTAREA_CLASS} min-h-[70px] md:col-span-2`} placeholder="Sous-titre blog" /><input value={homeContentForm.blogCtaLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogCtaLabel: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA blog (label)" /><input value={homeContentForm.blogCtaHref} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, blogCtaHref: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="CTA blog (lien)" /></div>
          </div>
          <div className={ADMIN_SECTION_SUBCARD}>
            <p className="mb-2 text-[13px] font-semibold text-[#273a41]">Bloc Contact</p>
            <div className="grid gap-3 md:grid-cols-2"><input value={homeContentForm.contactTitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, contactTitle: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Titre contact" /><input value={homeContentForm.contactSubmitLabel} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, contactSubmitLabel: event.target.value }))} className={ADMIN_INPUT_CLASS} placeholder="Libellé bouton contact" /><textarea value={homeContentForm.contactSubtitle} onChange={(event) => setHomeContentForm((prev) => ({ ...prev, contactSubtitle: event.target.value }))} className={`${ADMIN_TEXTAREA_CLASS} md:col-span-2`} placeholder="Sous-titre contact" /></div>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
