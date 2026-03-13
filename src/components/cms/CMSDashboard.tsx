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
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { blogRepository } from '../../repositories/blogRepository';
import { cmsRepository } from '../../repositories/cmsRepository';
import { mediaRepository } from '../../repositories/mediaRepository';
import { projectRepository } from '../../repositories/projectRepository';
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

export default function CMSDashboard({ currentSection, onSectionChange }: CMSDashboardProps) {
  const { user, logout, canAccessCMS } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sectionBusy, setSectionBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [sectionError, setSectionError] = useState('');

  const cmsStats = cmsRepository.getStats();
  const projects = useMemo(() => projectRepository.getAll(), []);
  const posts = useMemo(() => blogRepository.getAll(), []);
  const mediaFiles = useMemo(() => mediaRepository.getAll(), []);

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
      value: cmsStats.blogPostCount,
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
    setSectionBusy(section);
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

  if (!canAccessCMS) {
    return (
      <div className="min-h-screen bg-[#f5f9fa] flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[20px] shadow-sm border border-[#eef3f5] p-8 text-center">
          <h1 className="font-['Medula_One:Regular',sans-serif] text-[32px] tracking-[2px] uppercase text-[#273a41] mb-4">
            Accès refusé
          </h1>
          <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[16px] text-[#38484e] mb-6">
            Seuls les comptes administrateurs peuvent accéder au CMS.
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
    if (sectionBusy === currentSection) {
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
                onClick={() => showSuccess('Nouveau brouillon projet créé.')}
                className="bg-[#00b3e8] text-white rounded-[12px] px-4 py-2 font-['Abhaya_Libre:Bold',sans-serif]"
              >
                Nouveau projet
              </button>
            }
          />
          <AdminActionBar>
            <button
              onClick={() => showSuccess('Changements enregistrés pour les projets.')}
              className="inline-flex items-center gap-2 bg-[#273a41] text-white px-4 py-2 rounded-[10px]"
            >
              <Save size={16} /> Enregistrer
            </button>
            <button
              onClick={() => {
                if (window.confirm('Supprimer les projets archivés ?')) {
                  showSuccess('Archivage des projets confirmé.');
                }
              }}
              className="inline-flex items-center gap-2 text-red-600 border border-red-200 px-4 py-2 rounded-[10px]"
            >
              <Trash2 size={16} /> Action destructive
            </button>
          </AdminActionBar>
          <AdminPanel title="Projets récents">
            {projects.length === 0 ? (
              <AdminEmptyState label="Aucun projet trouvé. Créez votre premier projet pour commencer." />
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((project) => (
                  <div key={project.id} className="rounded-[12px] border border-[#eef3f5] px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{project.title}</p>
                      <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">{project.client} • {project.year}</p>
                    </div>
                    <span className="text-[13px] text-[#9ba1a4]">{project.category}</span>
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
            subtitle="Statut de publication, cohérence des slugs et qualité de contenu."
            actions={
              <button
                onClick={() => showSuccess('Nouveau brouillon d\'article initialisé.')}
                className="bg-[#00b3e8] text-white rounded-[12px] px-4 py-2 font-['Abhaya_Libre:Bold',sans-serif]"
              >
                Nouvel article
              </button>
            }
          />
          <AdminPanel title="Articles">
            {posts.length === 0 ? (
              <AdminEmptyState label="Aucun article disponible." />
            ) : (
              <div className="space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="rounded-[12px] border border-[#eef3f5] px-4 py-3">
                    <p className="font-['Abhaya_Libre:Bold',sans-serif] text-[#273a41]">{post.title}</p>
                    <p className="font-['Abhaya_Libre:Regular',sans-serif] text-[#6f7f85] text-[14px]">
                      /{post.slug} • {post.status === 'published' ? 'Publié' : 'Brouillon'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
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
          {sectionError ? <AdminErrorState label={sectionError} /> : null}
          <AdminPanel title="Publication">
            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-[12px] border border-[#eef3f5] p-4">
                <span className="font-['Abhaya_Libre:Regular',sans-serif] text-[#273a41]">Autoriser la publication immédiate</span>
                <input type="checkbox" defaultChecked />
              </label>
              <button
                onClick={() => showSuccess('Paramètres enregistrés avec succès.')}
                className="bg-[#273a41] text-white rounded-[10px] px-4 py-2"
              >
                Sauvegarder
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
