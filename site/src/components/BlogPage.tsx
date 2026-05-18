import { useEffect, useState } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getBlogContentContractFromSource, type BlogListItem } from '../features/blog/blogContentService';
import { PUBLIC_ROUTE_HASH } from '../features/marketing/publicRoutes';

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogListItem[]>([]);

  useEffect(() => {
    let active = true;
    void getBlogContentContractFromSource().then((contract) => {
      if (active) setBlogPosts(contract.posts);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPath="/blog" />
      <section className="pt-32 pb-16 max-w-5xl mx-auto px-4">
        <h1 className="text-5xl text-[#273a41] mb-8">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <a key={post.id} href={PUBLIC_ROUTE_HASH.blogDetail(post.slug)} className="border rounded-xl p-4 block">
              <ImageWithFallback src={post.image} alt={post.media.alt || post.title} className="w-full h-48 object-cover rounded-lg mb-3" />
              <h2 className="text-xl text-[#273a41]">{post.title}</h2>
              <p className="text-[#38484e]">{post.excerpt}</p>
            </a>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
