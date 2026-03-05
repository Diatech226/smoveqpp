import Navigation from './Navigation';
import Footer from './Footer';
import { getPublicPublishedContent } from '../data/cmsContent';
import { getMediaFileById } from '../data/media';

function BlockRenderer({ blocks }: { blocks: { id: string; type: string; data: Record<string, string | string[] | undefined> }[] }) {
  return <div className="space-y-4">{blocks.map((block) => {
    if (block.type === 'heading') return <h2 key={block.id} className="text-3xl font-semibold text-[#273a41]">{block.data.text}</h2>;
    if (block.type === 'quote') return <blockquote key={block.id} className="border-l-4 pl-4 text-[#38484e] italic">{block.data.text}</blockquote>;
    if (block.type === 'image' && typeof block.data.mediaId === 'string') {
      const media = getMediaFileById(block.data.mediaId);
      return media ? <img key={block.id} src={media.variants.md?.url || media.originalUrl} alt={media.altText || ''} className="w-full rounded-xl" /> : null;
    }
    return <p key={block.id} className="text-[#38484e]">{block.data.text}</p>;
  })}</div>;
}

export default function BlogPageEnhanced() {
  const posts = getPublicPublishedContent('posts');
  const current = posts[0];
  const mostCommented = [...posts].sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0)).slice(0, 4);
  const sameCategory = posts.filter((post) => post.category === current?.category && post.id !== current?.id).slice(0, 4);

  if (!current) {
    return <div className="min-h-screen bg-white"><Navigation currentPath="/blog" /><main className="max-w-6xl mx-auto px-4 py-24">Aucun article publié.</main><Footer /></div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPath="/blog" />
      <main className="max-w-6xl mx-auto px-4 py-24 grid lg:grid-cols-[1fr_320px] gap-10">
        <article className="space-y-6">
          <h1 className="text-4xl font-semibold text-[#273a41]">{current.title}</h1>
          <p className="text-sm text-gray-500">{current.category} · {current.viewsCount || 0} vues · {current.commentsCount || 0} commentaires</p>
          <BlockRenderer blocks={current.contentBlocks || [{ id: 'fallback', type: 'paragraph', data: { text: current.content } }]} />
        </article>
        <aside className="space-y-6">
          <section className="bg-[#f5f9fa] p-4 rounded-xl">
            <h3 className="font-semibold mb-3">Les plus commentés</h3>
            <ul className="space-y-2 text-sm">{mostCommented.map((post) => <li key={post.id}>{post.title} ({post.commentsCount || 0})</li>)}</ul>
          </section>
          <section className="bg-[#f5f9fa] p-4 rounded-xl">
            <h3 className="font-semibold mb-3">Dans la même rubrique</h3>
            <ul className="space-y-2 text-sm">{sameCategory.length > 0 ? sameCategory.map((post) => <li key={post.id}>{post.title}</li>) : <li>Aucun article similaire pour le moment.</li>}</ul>
          </section>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
