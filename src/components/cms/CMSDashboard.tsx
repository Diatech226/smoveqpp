import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCcw,
  Settings,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { BlogPost, MediaFile } from '../../domain/contentSchemas';
import { blogRepository } from '../../repositories/blogRepository';
import { cmsRepository } from '../../repositories/cmsRepository';
import { mediaRepository } from '../../repositories/mediaRepository';
import { projectRepository } from '../../repositories/projectRepository';

interface CMSDashboardProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

type FeedbackState = { kind: 'success' | 'error'; message: string } | null;

export default function CMSDashboard({ currentSection, onSectionChange }: CMSDashboardProps) {
  const { user, logout, canAccessCMS } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const cmsStats = cmsRepository.getStats();

  const stats = [
    { label: 'Total Projets', value: cmsStats.projectCount, icon: FolderOpen, change: '+12%' },
    { label: 'Articles Blog', value: cmsStats.blogPostCount, icon: FileText, change: '+8%' },
    { label: 'Fichiers Média', value: cmsStats.mediaCount, icon: ImageIcon, change: '+15%' },
  ];

  const menuItems = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'media', label: 'Médiathèque', icon: ImageIcon },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  useEffect(() => {
    setIsSectionLoading(true);
    const timer = window.setTimeout(() => setIsSectionLoading(false), 180);

    if (currentSection === 'blog') {
      setBlogPosts(blogRepository.getAll());
    }

    if (currentSection === 'media') {
      setMediaFiles(mediaRepository.getAll());
    }

    return () => window.clearTimeout(timer);
  }, [currentSection]);

  const publishedCount = useMemo(
    () => blogPosts.filter((post) => post.status === 'published').length,
    [blogPosts],
  );

  const handleLogout = async () => {
    await logout();
    window.location.hash = 'login';
  };

  const handleDeletePost = (id: string) => {
    if (!window.confirm('Supprimer cet article ? Cette action est irréversible.')) return;

    try {
      blogRepository.delete(id);
      const updated = blogRepository.getAll();
      setBlogPosts(updated);
      setFeedback({ kind: 'success', message: 'Article supprimé avec succès.' });
    } catch {
      setFeedback({ kind: 'error', message: 'Suppression impossible pour le moment.' });
    }
  };

  const handleTogglePostStatus = (post: BlogPost) => {
    try {
      blogRepository.save({ ...post, status: post.status === 'published' ? 'draft' : 'published' });
      const updated = blogRepository.getAll();
      setBlogPosts(updated);
      setFeedback({ kind: 'success', message: 'Statut de publication mis à jour.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de la mise à jour';
      setFeedback({ kind: 'error', message });
    }
  };

  const handleDeleteMedia = (id: string) => {
    if (!window.confirm('Supprimer ce média ? Cette action est irréversible.')) return;

    try {
      mediaRepository.delete(id);
      setMediaFiles(mediaRepository.getAll());
      setFeedback({ kind: 'success', message: 'Média supprimé avec succès.' });
    } catch {
      setFeedback({ kind: 'error', message: 'Impossible de supprimer ce média.' });
    }
  };

  if (!canAccessCMS) {
    return (
      <div className="min-h-screen bg-[#f5f9fa] flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[20px] shadow-sm border border-[#eef3f5] p-8 text-center">
          <h1 className="font-['Medula_One:Regular',sans-serif] text-[32px] tracking-[2px] uppercase text-[#273a41] mb-4">Accès refusé</h1>
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#38484e] mb-6">Seuls les comptes administrateurs peuvent accéder au CMS.</p>
          <a href="#home" className="inline-flex items-center justify-center bg-[#00b3e8] text-white px-6 py-3 rounded-[12px] font-['Abhaya_Libre:Bold',sans-serif]">Retour au site</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f9fa] flex">
      <motion.aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-[#eef3f5] z-50 ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
      >
        <div className="p-6 border-b border-[#eef3f5] flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00b3e8] to-[#34c759] rounded-[10px] flex items-center justify-center text-white">S</div>
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
          <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[14px] text-[#273a41] truncate">{user?.name}</p>
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[12px] text-[#9ba1a4] truncate">{user?.email}</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFeedback(null);
                onSectionChange(item.id);
              }}
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
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px]">Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="bg-white border-b border-[#eef3f5] px-8 py-6 sticky top-0 z-40">
          <h1 className="font-['Medula_One:Regular',sans-serif] text-[28px] tracking-[2.8px] uppercase text-[#273a41]">
            {menuItems.find((m) => m.id === currentSection)?.label || 'Dashboard'}
          </h1>
        </header>

        <section className="p-8 space-y-6">
          {feedback && (
            <div className={`rounded-[16px] border px-4 py-3 flex items-center gap-2 ${feedback.kind === 'success' ? 'bg-[#ebf9ff] border-[#b7e8f8] text-[#005f78]' : 'bg-[#fff3f2] border-[#ffd7d4] text-[#8c2a22]'}`}>
              {feedback.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[15px]">{feedback.message}</span>
            </div>
          )}

          {isSectionLoading ? (
            <div className="bg-white border border-[#eef3f5] rounded-[20px] p-8 text-[#9ba1a4] font-['Abhaya_Libre:Regular',sans-serif]">Chargement de la section...</div>
          ) : (
            <>
              {currentSection === 'overview' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat) => (
                      <div key={stat.label} className="bg-white border border-[#eef3f5] rounded-[20px] p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-11 h-11 rounded-[12px] bg-[#ebf9ff] text-[#00b3e8] flex items-center justify-center">
                            <stat.icon size={20} />
                          </div>
                          <span className="text-[#34c759] font-['Abhaya_Libre:Bold',sans-serif] text-[13px]">{stat.change}</span>
                        </div>
                        <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[28px] text-[#273a41]">{stat.value}</p>
                        <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#9ba1a4] text-[14px]">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-[#eef3f5] rounded-[20px] p-6">
                    <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-2">Pilotage CMS</h3>
                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[15px] text-[#38484e]">Le CMS suit désormais des états explicites (chargement, succès, erreur) pour sécuriser les actions éditoriales.</p>
                  </div>
                </>
              )}

              {currentSection === 'projects' && (
                <div className="bg-white border border-[#eef3f5] rounded-[20px] p-6">
                  <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-1">Catalogue projets</h3>
                  <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4] mb-5">Section en lecture seule : l'édition projet sera branchée sur un backend persistant.</p>
                  <div className="space-y-3">
                    {projectRepository.getAll().map((project) => (
                      <div key={project.id} className="rounded-[14px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{project.title}</p>
                          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[13px] text-[#9ba1a4]">{project.category} · {project.year}</p>
                        </div>
                        <span className="text-[12px] px-2 py-1 rounded-full bg-[#f5f9fa] text-[#687f87]">Lecture seule</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSection === 'blog' && (
                <div className="bg-white border border-[#eef3f5] rounded-[20px] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41]">Workflow publication</h3>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[14px] text-[#9ba1a4]">{publishedCount} publiés · {blogPosts.length - publishedCount} brouillons</p>
                    </div>
                    <button onClick={() => setBlogPosts(blogRepository.getAll())} className="inline-flex items-center gap-2 text-[14px] px-3 py-2 rounded-[10px] bg-[#f5f9fa] text-[#38484e]">
                      <RefreshCcw size={14} /> Rafraîchir
                    </button>
                  </div>

                  {blogPosts.length === 0 ? (
                    <div className="rounded-[14px] border border-dashed border-[#dce8ec] p-8 text-center text-[#9ba1a4]">Aucun article disponible.</div>
                  ) : (
                    <div className="space-y-3">
                      {blogPosts.map((post) => (
                        <div key={post.id} className="rounded-[14px] border border-[#eef3f5] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{post.title}</p>
                              <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[13px] text-[#9ba1a4]">/{post.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTogglePostStatus(post)}
                                className={`text-[12px] px-3 py-1 rounded-full ${post.status === 'published' ? 'bg-[#ebf9ff] text-[#006f8e]' : 'bg-[#f5f9fa] text-[#687f87]'}`}
                              >
                                {post.status === 'published' ? 'Publié' : 'Brouillon'}
                              </button>
                              <button onClick={() => handleDeletePost(post.id)} className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-full bg-[#fff3f2] text-[#8c2a22]">
                                <Trash2 size={12} /> Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentSection === 'media' && (
                <div className="bg-white border border-[#eef3f5] rounded-[20px] p-6">
                  <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-5">Médiathèque</h3>
                  {mediaFiles.length === 0 ? (
                    <div className="rounded-[14px] border border-dashed border-[#dce8ec] p-8 text-center text-[#9ba1a4]">Médiathèque vide.</div>
                  ) : (
                    <div className="space-y-3">
                      {mediaFiles.map((file) => (
                        <div key={file.id} className="rounded-[14px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{file.name}</p>
                            <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[13px] text-[#9ba1a4]">{file.type} · {Math.round(file.size / 1024)} Ko</p>
                          </div>
                          <button onClick={() => handleDeleteMedia(file.id)} className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-full bg-[#fff3f2] text-[#8c2a22]">
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentSection === 'settings' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#eef3f5] rounded-[20px] p-6">
                    <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-3">Permissions</h3>
                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#38484e] text-[15px] mb-3">Rôle courant : administrateur CMS.</p>
                    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-[#ebf9ff] text-[#006f8e] text-[13px]">
                      <Shield size={14} /> Actions d'édition autorisées
                    </div>
                  </div>
                  <div className="bg-white border border-[#eef3f5] rounded-[20px] p-6">
                    <h3 className="font-['Abhaya_Libre:Bold',sans-serif] text-[20px] text-[#273a41] mb-3">État du contenu</h3>
                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#38484e] text-[15px]">Le blog et la médiathèque utilisent le repository local validé avec protection de schéma et retours d'erreur utilisateur.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
