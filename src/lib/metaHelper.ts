import { Book } from '../types';

export function updateBookMetaTags(book: Book | null) {
  if (typeof document === 'undefined') return;

  const title = book ? `${book.title} - por ${book.author} | ALA X` : 'ALA X - Biblioteca Digital';
  const description = book
    ? (book.synopsis || `Confira a obra "${book.title}" por ${book.author} na plataforma ALA X Digital Library.`).slice(0, 180)
    : 'Explore, leia e descarregue livros e obras literárias de autores na plataforma ALA X.';
  const imageUrl = book?.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200';
  const pageUrl = book ? `${window.location.origin}${window.location.pathname}?book=${book.id}` : window.location.href;

  document.title = title;

  const setMeta = (selector: string, attrKey: 'property' | 'name', attrVal: string, contentVal: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrKey, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentVal);
  };

  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
  setMeta('meta[property="og:url"]', 'property', 'og:url', pageUrl);
  setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'ALA X — Biblioteca Digital');

  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);
}
