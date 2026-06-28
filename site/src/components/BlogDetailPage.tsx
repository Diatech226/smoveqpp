import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock3, Copy, Linkedin, Share2, Tag, User } from 'lucide-react';
import Navigation from './Navigation';
import Footer from './Footer';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getBlogPostBySlugContract, getRelatedBlogPostsContract, type BlogDetailContract, type BlogListItem } from '../features/blog/blogContentService';
import { applyPageMetadata } from '../features/marketing/pageMetadata';
import { PUBLIC_ROUTE_HASH } from '../features/marketing/publicRoutes';
import { trackSiteEvent } from '../utils/analytics';
import { buildContactCtaHref } from '../features/marketing/navigationCta';
import { getCloudinaryVariant } from '../utils/cloudinaryVariant';
import { ArticleContentBlocks, ArticleText } from './BlogArticleContent';

interface BlogDetailPageProps { slug: string; }
const heroTransition = { duration: 0.65, ease: 'easeOut' as const };

export default function BlogDetailPage({ slug }: BlogDetailPageProps) {
  const [post, setPost] = useState<BlogDetailContract | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void getBlogPostBySlugContract(slug).then(async (result) => {
      if (!active) return;
      setPost(result || null);
      setRelatedPosts(result ? await getRelatedBlogPostsContract(result.slug, result.category) : []);
    }).catch(() => active && setPost(null)).finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    trackSiteEvent({ name: 'blog_article_opened', route: 'blog-detail', entityType: 'blog', entityId: post.slug, targetRoute: `/blog/${post.slug}` });
    applyPageMetadata({ title: post.seo.title || post.title, description: post.seo.description || post.excerpt || 'Article du blog SMOVE.', routePath: `/blog/${post.seo.canonicalSlug || post.slug}`, image: post.seo.socialImage || post.featuredImage || '', type: 'article' });
  }, [post]);

  const publishedDate = useMemo(() => {
    const parsed = Date.parse(post?.publishedDate || '');
    return Number.isNaN(parsed) ? '' : new Date(parsed).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [post?.publishedDate]);
  const contactHref = useMemo(() => buildContactCtaHref({ source: 'blog', slug: post?.slug || slug, label: post?.title || 'Article de blog' }), [post?.slug, post?.title, slug]);
  const articleUrl = typeof window === 'undefined' ? '' : window.location.href;
  const share = async () => {
    if (!post) return;
    if (navigator.share) await navigator.share({ title: post.title, text: post.excerpt, url: articleUrl });
    else await copyLink();
  };
  const copyLink = async () => {
    await navigator.clipboard?.writeText(articleUrl);
    setShareNotice('Lien copié');
    window.setTimeout(() => setShareNotice(''), 1800);
  };

  if (isLoading) return <div className="min-h-screen bg-white"><Navigation currentPath="/blog" /><main className="mx-auto max-w-4xl px-5 pb-24 pt-36"><div className="h-9 w-2/3 animate-pulse rounded-xl bg-[#eaf2f5]" /><div className="mt-5 h-72 animate-pulse rounded-[28px] bg-[#f1f6f8]" /></main><Footer /></div>;
  if (!post) return <div className="min-h-screen bg-white"><Navigation currentPath="/blog" /><main className="mx-auto max-w-3xl px-5 pb-24 pt-36 text-center"><span className="text-sm font-semibold uppercase tracking-[.2em] text-[#00a5d5]">Erreur 404</span><h1 className="mt-4 text-[42px] leading-tight text-[#273a41]">Cet article est introuvable</h1><p className="mx-auto mt-4 max-w-xl text-lg text-[#64777e]">Il a peut-être été déplacé, dépublié ou son adresse a changé.</p><a href={PUBLIC_ROUTE_HASH.blog} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#273a41] px-6 py-3 text-white"><ArrowLeft size={18} /> Retour au blog</a></main><Footer /></div>;

  const heroImage = getCloudinaryVariant(post.featuredImage, 'hero');
  return <div className="min-h-screen overflow-x-hidden bg-white"><Navigation currentPath="/blog" />
    <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="blog-detail-hero relative overflow-hidden bg-[#f4f9fa] pb-12 pt-28 sm:pb-16 sm:pt-32">
        <div className="absolute -right-40 -top-48 h-[520px] w-[520px] rounded-full bg-[#00b3e8]/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <a href={PUBLIC_ROUTE_HASH.blog} className="inline-flex items-center gap-2 text-sm font-semibold text-[#007fa3]"><ArrowLeft size={17} /> Retour au blog</a>
          <motion.div className="mx-auto mt-8 max-w-4xl text-center" initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={heroTransition}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#bde7f2] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[.14em] text-[#008ab3]"><Tag size={13} /> {post.category || 'Non classé'}</span>
            <h1 className="mt-6 break-words text-[38px] leading-[1.08] text-[#20343b] sm:text-[54px] lg:text-[68px]">{post.title}</h1>
            {post.excerpt ? <p className="mx-auto mt-6 max-w-3xl text-[18px] leading-relaxed text-[#536970] sm:text-[21px]">{post.excerpt}</p> : null}
            <div className="blog-detail-meta mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#60757c]">
              {publishedDate ? <span className="inline-flex items-center gap-2"><Calendar size={15} className="text-[#00a5d5]" />{publishedDate}</span> : null}
              {post.author ? <span className="inline-flex items-center gap-2"><User size={15} className="text-[#00a5d5]" />{post.author}</span> : null}
              {post.readTime ? <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-[#00a5d5]" />{post.readTime}</span> : null}
            </div>
          </motion.div>
          <motion.div className="mt-10 overflow-hidden rounded-[24px] border border-white/80 bg-[#dfecef] shadow-[0_26px_70px_rgba(30,65,77,.18)] sm:rounded-[32px]" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...heroTransition, delay: .15 }}>
            {heroImage ? <ImageWithFallback src={heroImage} alt={post.media.alt || post.title} className="aspect-[16/10] h-auto w-full object-cover sm:aspect-[16/8] lg:aspect-[16/7]" /> : <div className="flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-[#dff5fa] to-[#f8e9c7] text-[#597178]"><Share2 size={34} /><span className="ml-3 font-semibold">SMOVE — Perspectives</span></div>}
          </motion.div>
        </div>
      </header>

      <section className="blog-detail-body pb-16 pt-12 sm:pb-20 sm:pt-16"><div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[150px_minmax(0,820px)] lg:px-8">
        <aside className="lg:sticky lg:top-28 lg:self-start"><p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-[#71848a]">Partager</p><div className="flex flex-wrap gap-2 lg:flex-col">
          <button onClick={() => void share()} className="inline-flex items-center gap-2 rounded-full border border-[#dbe8ec] px-4 py-2 text-sm text-[#38515a] transition hover:border-[#9fd4e0] hover:bg-[#f1fafc] hover:text-[#007fa3]"><Share2 size={15} /> Partager</button>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#dbe8ec] px-4 py-2 text-sm text-[#38515a] transition hover:border-[#9fd4e0] hover:bg-[#f1fafc] hover:text-[#007fa3]"><Linkedin size={15} /> LinkedIn</a>
          <button onClick={() => void copyLink()} className="inline-flex items-center gap-2 rounded-full border border-[#dbe8ec] px-4 py-2 text-sm text-[#38515a] transition hover:border-[#9fd4e0] hover:bg-[#f1fafc] hover:text-[#007fa3]"><Copy size={15} /> {shareNotice || 'Copier'}</button>
        </div></aside>
        <div className="blog-detail-content min-w-0 max-w-[760px]"><ArticleText content={post.content || ''} />
          <ArticleContentBlocks blocks={post.contentBlocks} />
          <div className="blog-detail-cta mt-12 overflow-hidden rounded-[20px] border border-[#b9e5ef] bg-[#eaf8fb] px-5 py-6 shadow-[0_14px_36px_rgba(0,127,163,.10)] sm:mt-16 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-7 sm:py-7"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#007fa3]">Un projet en tête&nbsp;?</p><h2 className="mt-2 text-[24px] leading-tight text-[#193841] sm:text-[28px]">Besoin d’un accompagnement sur ce sujet&nbsp;?</h2><p className="mt-2 max-w-xl text-[16px] leading-relaxed text-[#47636c]">Partagez votre contexte avec notre équipe et transformons ces idées en résultats.</p></div><a href={contactHref} className="mt-5 inline-flex shrink-0 items-center justify-center rounded-full bg-[#007fa3] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#006c8b] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007fa3] sm:mt-0">Nous contacter</a></div>
        </div>
      </div></section>

      <section className="blog-detail-related" aria-labelledby="related-articles-title">
        <div className="blog-detail-related-inner">
          <div className="blog-detail-related-header">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#008ab3]">Continuer la lecture</p>
              <h2 id="related-articles-title" className="mt-2 text-[32px] text-[#273a41] sm:text-[40px]">Articles liés</h2>
              <p className="blog-detail-related-subtitle">D’autres perspectives sélectionnées pour prolonger votre lecture.</p>
            </div>
            <a href={PUBLIC_ROUTE_HASH.blog} className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-semibold text-[#007fa3] transition hover:bg-[#e5f5f9] hover:text-[#006b89]">Tous les articles <ArrowLeft className="rotate-180" size={17} /></a>
          </div>
          {relatedPosts.length ? <div className="blog-detail-related-grid">{relatedPosts.map((related) => <a key={related.id} href={`#/blog/${related.slug}`} className="blog-detail-related-card group"><div className="blog-detail-related-media"><ImageWithFallback src={getCloudinaryVariant(related.image, 'card')} alt={related.media.alt || related.title} className="blog-detail-related-image" /></div><div className="blog-detail-related-card-body"><span className="text-xs font-semibold uppercase tracking-[.12em] text-[#008ab3]">{related.category}</span><h3 className="mt-2 text-[20px] leading-snug text-[#273a41]">{related.title}</h3><p className="mt-3 text-sm text-[#6a7d84]">{related.date} · {related.readTime}</p></div></a>)}</div> : <div className="blog-detail-related-empty">Aucun article lié pour le moment. Découvrez bientôt de nouvelles publications.</div>}
        </div>
      </section>
    </motion.article><Footer /></div>;
}
