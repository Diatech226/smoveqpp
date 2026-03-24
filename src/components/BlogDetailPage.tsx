import { useEffect, useState } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getBlogPostBySlugContract, type BlogDetailContract } from '../features/blog/blogContentService';

interface BlogDetailPageProps {
  slug: string;
}

export default function BlogDetailPage({ slug }: BlogDetailPageProps) {
  const [post, setPost] = useState<BlogDetailContract | null>(null);

  useEffect(() => {
    let active = true;
    void getBlogPostBySlugContract(slug).then((result) => {
      if (active) setPost(result || null);
    });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.seo.title || post.title} | SMOVE`;
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation currentPath="/blog" />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-[42px] text-[#273a41]">Article non trouvé</h1>
          <a href="#blog" className="text-[#00b3e8] underline">Retour au blog</a>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPath="/blog" />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <a href="#blog" className="text-[#00b3e8] underline">← Retour au blog</a>
        <h1 className="mt-4 text-[44px] text-[#273a41]">{post.title}</h1>
        <p className="text-[#6f7f85] mt-2">{new Date(post.publishedDate).toLocaleDateString('fr-FR')} • {post.readTime} • {post.category || 'Non classé'}</p>
        <div className="mt-8 rounded-[16px] overflow-hidden">
          <ImageWithFallback src={post.featuredImage} alt={post.media.alt || post.title} className="w-full h-[360px] object-cover" />
        </div>
        <p className="mt-8 text-[20px] text-[#38484e]">{post.excerpt}</p>
        <div className="mt-8 whitespace-pre-line text-[#273a41] leading-8">{post.content || 'Contenu indisponible.'}</div>
      </article>
      <Footer />
    </div>
  );
}
