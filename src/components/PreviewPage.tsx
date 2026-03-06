import Navigation from './Navigation';
import Footer from './Footer';
import { getCMSContent, type ContentType } from '../data/cmsContent';
import { getMediaFileById } from '../data/media';
import type { PostBlock } from '../data/cmsContent';

function PreviewBlocks({ blocks, fallback }: { blocks?: PostBlock[]; fallback: string }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-[#38484e] whitespace-pre-wrap">{fallback}</p>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.type === 'heading') return <h2 key={block.id} className="text-2xl font-semibold text-[#273a41]">{block.data.text}</h2>;
        if (block.type === 'quote') return <blockquote key={block.id} className="border-l-4 border-[#00b3e8] pl-4 italic text-[#38484e]">{block.data.text}</blockquote>;
        if (block.type === 'image' && typeof block.data.mediaId === 'string') {
          const media = getMediaFileById(block.data.mediaId);
          if (!media) return null;
          return <img key={block.id} src={media.variants.md?.url || media.originalUrl} alt={media.altText || ''} className="w-full rounded-xl" />;
        }
        return <p key={block.id} className="text-[#38484e]">{block.data.text}</p>;
      })}
    </div>
  );
}

export default function PreviewPage({ type, itemId }: { type: ContentType; itemId: string }) {
  const item = getCMSContent().find((entry) => entry.id === itemId && entry.type === type);

  if (!item) {
    return <div className="min-h-screen bg-white"><Navigation currentPath="/" /><main className="max-w-5xl mx-auto px-4 py-24">Contenu introuvable.</main><Footer /></div>;
  }

  const cover = item.coverId ? getMediaFileById(item.coverId) : undefined;
  const gallery = item.galleryIds.map((id) => getMediaFileById(id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPath="/" />
      <main className="max-w-5xl mx-auto px-4 py-24 space-y-6">
        <span className="inline-flex bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-semibold">Draft preview</span>
        <h1 className="text-4xl font-semibold text-[#273a41]">{item.title}</h1>
        <p className="text-[#38484e]">{item.excerpt}</p>

        {cover && <img src={cover.variants.lg?.url || cover.originalUrl} alt={item.coverAltText || item.title} className="w-full rounded-2xl" />}

        <PreviewBlocks blocks={item.contentBlocks} fallback={item.content} />

        {item.videoUrl && (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[#273a41]">Vidéo</h2>
            <a className="text-[#00b3e8] underline" href={item.videoUrl} target="_blank" rel="noreferrer">Ouvrir la vidéo</a>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#273a41]">Galerie</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {gallery.map((media) => media && <img key={media.id} src={media.variants.md?.url || media.originalUrl} alt={media.altText || media.name} className="w-full rounded-xl" />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
