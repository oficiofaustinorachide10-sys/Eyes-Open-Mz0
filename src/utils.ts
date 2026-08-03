/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, BookCategory, Review, BookComment, User } from './types';

export const ADMIN_UID = 'admin_alax_master';

export const BOOK_CATEGORIES: BookCategory[] = [
  { id: 'cat-all', name: 'Todas as Obras', slug: 'todas', icon: 'BookOpen', description: 'Explore toda a biblioteca do Ala X' },
  { id: 'cat-thriller', name: 'Thriller & Suspense', slug: 'thriller', icon: 'ShieldAlert', description: 'Histórias intensas e misteriosas' },
  { id: 'cat-drama', name: 'Drama & Romance', slug: 'drama', icon: 'Heart', description: 'Narrativas emotivas e relacionamentos profundos' },
  { id: 'cat-ficcao', name: 'Ficção Científica', slug: 'ficcao', icon: 'Sparkles', description: 'Mundos imaginários e futuros distópicos' },
  { id: 'cat-poesia', name: 'Poesia & Lírica', slug: 'poesia', icon: 'Feather', description: 'Versos, estrofes e sentimentos poéticos' },
  { id: 'cat-ensaio', name: 'Ensaios & Crítica', slug: 'ensaio', icon: 'FileText', description: 'Análises acadêmicas e pensamentos críticos' },
  { id: 'cat-historia', name: 'História & Cultura', slug: 'historia', icon: 'Globe', description: 'Patrimônio, memória e narrativas históricas' },
  { id: 'cat-tecnologia', name: 'Tecnologia & Ciência', slug: 'tecnologia', icon: 'Cpu', description: 'Inovação, programação e computação' }
];

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book-madrasta',
    title: 'A Madrasta',
    author: 'Ofélio Faustino',
    synopsis: 'Um drama envolvente sobre amor, família e os desafios que transformam destinos. Quando segredos do passado vêm à tona, as escolhas de uma vida colocam à prova a fé e a união familiar.',
    category: 'Drama',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 24,
    downloadCount: 1420,
    likesCount: 890,
    ratingAverage: 4.9,
    ratingCount: 38,
    pageCount: 240,
    language: 'Português',
    publishedYear: 2025,
    isFeatured: true,
    uploadedBy: 'Ofélio Faustino',
    fileSizeFormatted: '2.8 MB'
  },
  {
    id: 'book-lagrimas',
    title: 'Lágrimas do Silêncio',
    author: 'Maria Sousa',
    synopsis: 'Uma jornada emocional sobre a superação das dores guardadas no peito e a busca pela verdadeira libertação através do perdão.',
    category: 'Romance',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 48,
    downloadCount: 980,
    likesCount: 650,
    ratingAverage: 4.8,
    ratingCount: 29,
    pageCount: 198,
    language: 'Português',
    publishedYear: 2025,
    isFeatured: true,
    uploadedBy: 'Maria Sousa',
    fileSizeFormatted: '2.1 MB'
  },
  {
    id: 'book-ecos',
    title: 'Ecos da Alma',
    author: 'João Mendes',
    synopsis: 'Reflexões poéticas e filosóficas que conectam os sussurros da natureza com a voz interior de cada indivíduo.',
    category: 'Poesia',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 72,
    downloadCount: 750,
    likesCount: 420,
    ratingAverage: 4.7,
    ratingCount: 21,
    pageCount: 160,
    language: 'Português',
    publishedYear: 2024,
    isFeatured: true,
    uploadedBy: 'João Mendes',
    fileSizeFormatted: '1.8 MB'
  },
  {
    id: 'book-caminho',
    title: 'O Caminho da Luz',
    author: 'Ana Paula',
    synopsis: 'Um guia inspirador sobre propósito, espiritualidade e a busca constante por clareza em tempos incertos.',
    category: 'Autoajuda',
    coverUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 96,
    downloadCount: 1120,
    likesCount: 780,
    ratingAverage: 4.9,
    ratingCount: 34,
    pageCount: 220,
    language: 'Português',
    publishedYear: 2025,
    isFeatured: true,
    uploadedBy: 'Ana Paula',
    fileSizeFormatted: '3.2 MB'
  },
  {
    id: 'book-entre-mundos',
    title: 'Entre Dois Mundos',
    author: 'Carlos Lima',
    synopsis: 'Ficção fascinante ambientada numa metrópole futurista onde escolhas morais dividem dois universos paralelos.',
    category: 'Contos',
    coverUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=800',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 120,
    downloadCount: 630,
    likesCount: 390,
    ratingAverage: 4.6,
    ratingCount: 19,
    pageCount: 280,
    language: 'Português',
    publishedYear: 2026,
    isFeatured: true,
    uploadedBy: 'Carlos Lima',
    fileSizeFormatted: '3.9 MB'
  }
];

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    bookId: 'book-1',
    userId: 'user-reader-1',
    userName: 'Mateus Cossa',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    comment: 'Uma leitura eletrizante do início ao fim! Os detalhes da ambientação em Maputo tornam tudo fascinante.',
    createdAt: Date.now() - 3600000 * 12
  },
  {
    id: 'rev-2',
    bookId: 'book-1',
    userId: 'user-reader-2',
    userName: 'Ana Paula Langa',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    rating: 4,
    comment: 'Excelente desenvolvimento de personagens. Mal posso esperar pelo próximo volume!',
    createdAt: Date.now() - 3600000 * 24
  },
  {
    id: 'rev-3',
    bookId: 'book-2',
    userId: 'user-reader-3',
    userName: 'Celso Sitoe',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
    rating: 5,
    comment: 'Ritmo acelerado e diálogos afiados. Imperador Rachide acertou em cheio!',
    createdAt: Date.now() - 3600000 * 18
  }
];

export const SAMPLE_COMMENTS: BookComment[] = [
  {
    id: 'comm-1',
    bookId: 'book-1',
    userId: 'user-reader-4',
    userName: 'Eurico Machava',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    text: 'Alguém já terminou o Capítulo 5? Que reviravolta incrível no enredo! 🔥',
    createdAt: Date.now() - 3600000 * 6,
    likesCount: 14,
    likedBy: ['admin_alax_master']
  },
  {
    id: 'comm-2',
    bookId: 'book-1',
    userId: 'user-reader-2',
    userName: 'Ana Paula Langa',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    text: 'Recomendo a todos descarregarem o PDF para ler durante as viagens, a qualidade do ficheiro no Ala X está impecável.',
    createdAt: Date.now() - 3600000 * 3,
    likesCount: 8,
    likedBy: []
  }
];

export const ADMIN_USER: User = {
  id: ADMIN_UID,
  email: 'admin@alax.mz',
  name: 'Ofício Faustino',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  favoriteBookIds: ['book-1', 'book-2', 'book-5'],
  createdAt: Date.now()
};

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(email.trim());
}

export function compressBase64Image(dataUrl: string, maxDim = 800, quality = 0.65): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    if (dataUrl.length < 200000) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
}
