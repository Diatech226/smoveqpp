import { Fragment, type ReactNode } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { BlogContentBlock } from '../domain/contentSchemas';

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;

function inlineMarkup(text: string): ReactNode[] {
  return text.split(INLINE_PATTERN).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function ArticleText({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    const listType = /^[-*]\s+/.test(line) ? 'ul' : /^\d+\.\s+/.test(line) ? 'ol' : '';
    if (listType) {
      const items: string[] = [];
      while (index < lines.length && (listType === 'ul' ? /^[-*]\s+/.test(lines[index].trim()) : /^\d+\.\s+/.test(lines[index].trim()))) {
        items.push(lines[index].trim().replace(listType === 'ul' ? /^[-*]\s+/ : /^\d+\.\s+/, ''));
        index += 1;
      }
      const List = listType;
      nodes.push(<List key={`list-${index}`}>{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkup(item)}</li>)}</List>);
      continue;
    }
    if (line.startsWith('### ')) nodes.push(<h3 key={index}>{inlineMarkup(line.slice(4))}</h3>);
    else if (line.startsWith('## ')) nodes.push(<h2 key={index}>{inlineMarkup(line.slice(3))}</h2>);
    else if (line.startsWith('# ')) nodes.push(<h2 key={index}>{inlineMarkup(line.slice(2))}</h2>);
    else if (line.startsWith('> ')) nodes.push(<blockquote key={index}>{inlineMarkup(line.slice(2))}</blockquote>);
    else nodes.push(<p key={index}>{inlineMarkup(line)}</p>);
    index += 1;
  }
  return <div className="article-copy">{nodes.length ? nodes : <p>Contenu à venir.</p>}</div>;
}

export function ArticleContentBlocks({ blocks }: { blocks: BlogContentBlock[] }) {
  if (!blocks.length) return null;
  return <div className="mt-12 space-y-10 sm:mt-16 sm:space-y-14">{blocks.map((block) => {
    if (block.type === 'heading') return <h2 key={block.id} className="text-[28px] leading-tight text-[#20343b] sm:text-[36px]">{block.text}</h2>;
    if (block.type === 'paragraph') return <div key={block.id} className="article-copy"><p>{inlineMarkup(block.text || '')}</p></div>;
    const alignment = block.layout === 'left' ? 'md:mr-auto md:w-[72%]' : block.layout === 'right' ? 'md:ml-auto md:w-[72%]' : 'w-full';
    return <figure key={block.id} className={`${alignment} overflow-hidden rounded-[20px] border border-[#e1ecef] bg-[#f8fbfc] shadow-[0_14px_40px_rgba(39,58,65,.08)]`}>
      <ImageWithFallback src={block.media || ''} alt={block.title || block.caption || 'Illustration de l’article'} className="aspect-[16/10] h-auto w-full object-cover" />
      {(block.title || block.caption || block.text) ? <figcaption className="space-y-2 px-5 py-4 sm:px-6"><strong className="block text-[17px] text-[#273a41]">{block.title}</strong>{block.caption ? <span className="block text-sm leading-relaxed text-[#687c83]">{block.caption}</span> : null}{block.text ? <p className="pt-2 text-[16px] leading-[1.75] text-[#3d555e]">{block.text}</p> : null}</figcaption> : null}
    </figure>;
  })}</div>;
}
