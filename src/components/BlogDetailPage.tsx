import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock3, User, Tag } from 'lucide-react';
import Navigation from './Navigation';
import Footer from './Footer';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getBlogPostBySlugContract, type BlogDetailContract } from '../features/blog/blogContentService';

interface BlogDetailPageProps {
  slug: string;
}

const heroTransition = { duration: 0.7, ease: 'easeOut' as const };

export default function BlogDetailPage({ slug }: BlogDetailPageProps) {
  const [post, setPost] = useState<BlogDetailContract | null>(null);

  useEffect(() => {
    let active = true;
    void getBlogPostBySlugContract(slug).then((result) => {
      if (active) setPost(result || null);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.seo.title || post.title} | SMOVE`;
  }, [post]);

  const publishedDate = useMemo(() => {
    if (!post?.publishedDate) return 'Date indisponible';
    const parsedDate = Date.parse(post.publishedDate);
    if (Number.isNaN(parsedDate)) return 'Date indisponible';
    return new Date(parsedDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [post?.publishedDate]);

  const heroMediaSrc = (post?.featuredImage || '').trim();
  const heroMediaIsVideo = useMemo(
    () => /\.(mp4|webm|ogg)(\?.*)?$/i.test(heroMediaSrc),
    [heroMediaSrc],
  );

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation currentPath="/blog" />
        <div className="pt-32 pb-20 text-center px-4">
          <h1 className="text-[42px] text-[#273a41]">Article non trouvé</h1>
          <a href="#blog" className="text-[#00b3e8] underline">
            Retour au blog
          </a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPath="/blog" />

      <motion.article
        className="bg-gradient-to-b from-[#f5f9fa] via-white to-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <section className="pt-28 sm:pt-32 pb-10 sm:pb-14 relative overflow-hidden isolate">
          {heroMediaSrc ? (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.32 }}
              transition={{ duration: 1 }}
            >
              {heroMediaIsVideo ? (
                <video
                  className="h-full w-full object-cover"
                  src={heroMediaSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <motion.div
                  className="h-full w-full"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ImageWithFallback
                    src={heroMediaSrc}
                    alt={post.media.alt || post.title}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              )}
            </motion.div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-[#f5f9fa]/80 to-white pointer-events-none" />
          <motion.div
            className="absolute top-0 right-0 w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] bg-[#00b3e8]/10 rounded-full blur-3xl pointer-events-none"
            animate={{ y: [0, 30, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] bg-[#ffc247]/10 rounded-full blur-3xl pointer-events-none"
            animate={{ y: [0, -25, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.a
              href="#blog"
              className="inline-flex items-center gap-2 text-[#00b3e8] font-['Abhaya_Libre:Bold',sans-serif] text-[15px] sm:text-[16px]"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={heroTransition}
              whileHover={{ x: -4 }}
            >
              <ArrowLeft size={18} />
              Retour au blog
            </motion.a>

            <div className="mt-7 sm:mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8 lg:gap-10 items-start">
              <motion.header
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...heroTransition, delay: 0.1 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-[#00b3e8]/10 text-[#00b3e8] px-4 py-2 text-[12px] sm:text-[13px] font-['Abhaya_Libre:Bold',sans-serif] tracking-[0.4px] uppercase">
                  <Tag size={14} />
                  {post.category || 'Non classé'}
                </div>

                <h1 className="mt-5 text-[34px] leading-[1.12] sm:text-[46px] lg:text-[56px] text-[#273a41] font-['ABeeZee:Regular',sans-serif] break-words">
                  {post.title}
                </h1>

                {post.excerpt ? (
                  <p className="mt-5 text-[18px] sm:text-[21px] leading-relaxed text-[#38484e] max-w-3xl font-['Abhaya_Libre:Regular',sans-serif]">
                    {post.excerpt}
                  </p>
                ) : null}

                <motion.div
                  className="mt-7 flex flex-wrap gap-2.5 sm:gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...heroTransition, delay: 0.25 }}
                >
                  {[
                    { icon: Calendar, label: publishedDate },
                    { icon: Clock3, label: post.readTime || 'Temps de lecture indisponible' },
                    { icon: User, label: post.author || 'Équipe SMOVE' },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-[#dce7ec] bg-white/90 backdrop-blur px-3.5 py-2 text-[13px] sm:text-[14px] text-[#5f7077]"
                    >
                      <Icon size={14} className="text-[#00b3e8]" />
                      <span className="font-['Abhaya_Libre:Regular',sans-serif]">{label}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.header>

              <motion.div
                className="lg:pt-2"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...heroTransition, delay: 0.2 }}
              >
                {post.featuredImage ? (
                  <motion.figure
                    className="rounded-[24px] overflow-hidden bg-white shadow-[0_20px_50px_rgba(39,58,65,0.16)] border border-[#e9f0f3]"
                    whileHover={{ y: -4 }}
                  >
                    <div className="aspect-[16/10] sm:aspect-[4/3] lg:aspect-[5/4] overflow-hidden">
                      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.6 }}>
                        <ImageWithFallback
                          src={post.featuredImage}
                          alt={post.media.alt || post.title}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    </div>
                    {post.media.caption ? (
                      <figcaption className="px-4 py-3 text-[13px] text-[#6f7f85] bg-white/90 border-t border-[#eef3f5]">
                        {post.media.caption}
                      </figcaption>
                    ) : null}
                  </motion.figure>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[#dce7ec] bg-white/80 p-8 sm:p-10 text-[#6f7f85] text-center font-['Abhaya_Libre:Regular',sans-serif]">
                    Image de couverture indisponible
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20">
          <motion.div
            className="max-w-3xl mx-auto px-4 sm:px-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div className="rounded-[22px] sm:rounded-[26px] border border-[#eaf1f4] bg-white shadow-[0_8px_30px_rgba(39,58,65,0.08)] px-5 py-7 sm:px-9 sm:py-10 lg:px-11 lg:py-12">
              <div className="whitespace-pre-line text-[#273a41] font-['Abhaya_Libre:Regular',sans-serif] text-[17px] sm:text-[18px] leading-[1.95] [&>h2]:text-[30px] [&>h2]:leading-tight [&>h2]:text-[#273a41] [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:font-['ABeeZee:Regular',sans-serif] [&>h3]:text-[24px] [&>h3]:leading-tight [&>h3]:text-[#273a41] [&>h3]:mt-10 [&>h3]:mb-3 [&>h3]:font-['ABeeZee:Regular',sans-serif] [&>p]:mb-7 [&>ul]:mb-8 [&>ol]:mb-8 [&>blockquote]:my-8 [&>blockquote]:rounded-r-[12px] [&>blockquote]:border-l-4 [&>blockquote]:border-[#00b3e8]/70 [&>blockquote]:bg-[#f5f9fa] [&>blockquote]:px-5 [&>blockquote]:py-4">
                {post.content || 'Contenu indisponible.'}
              </div>
            </div>
          </motion.div>
        </section>
      </motion.article>

      <Footer />
    </div>
  );
}
