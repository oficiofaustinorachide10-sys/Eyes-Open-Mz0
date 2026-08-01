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
    id: 'book-1',
    title: 'A Madrasta',
    author: 'Ofício Faustino Rachide',
    synopsis: 'Uma trama intensa que explora os meandros de uma família misteriosa em Maputo. Quando segredos do passado começam a emergir, cada membro da casa descobre que a confiança é um privilégio mortal.',
    category: 'Drama',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 48,
    downloadCount: 342,
    likesCount: 189,
    ratingAverage: 4.8,
    ratingCount: 24,
    pageCount: 198,
    language: 'Português',
    publishedYear: 2025,
    isFeatured: true,
    uploadedBy: 'Ofício Faustino Rachide',
    fileSizeFormatted: '2.4 MB'
  },
  {
    id: 'book-2',
    title: 'A Caça Começou',
    author: 'Imperador Rachide',
    synopsis: 'Nas ruas movimentadas de Nampula, um detetive privado descobre uma rede de conspiração corporativa. Com o tempo a esgotar-se, o caçador passa a ser a caça numa corrida pela sobrevivência.',
    category: 'Thriller',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 96,
    downloadCount: 512,
    likesCount: 290,
    ratingAverage: 4.9,
    ratingCount: 38,
    pageCount: 254,
    language: 'Português',
    publishedYear: 2026,
    isFeatured: true,
    uploadedBy: 'Imperador Rachide',
    fileSizeFormatted: '3.8 MB'
  },
  {
    id: 'book-3',
    title: 'O Segredo da Ilha',
    author: 'Helena Vilanculos',
    synopsis: 'Um romance de aventura nas águas quentes do Arquipélago das Quirimbas. Uma jovem arquivista encontra um diário antigo escondido no farol que revela um tesouro esquecido.',
    category: 'Ficção',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 120,
    downloadCount: 215,
    likesCount: 142,
    ratingAverage: 4.6,
    ratingCount: 18,
    pageCount: 180,
    language: 'Português',
    publishedYear: 2024,
    isFeatured: false,
    uploadedBy: 'Helena Vilanculos',
    fileSizeFormatted: '1.9 MB'
  },
  {
    id: 'book-4',
    title: 'Cânticos do Mar',
    author: 'Sérgio Matusse',
    synopsis: 'Uma coletânea poética inspirada nas marés do Oceano Índico, na nostalgia da brisa marinha e nas memórias das cidades costeiras de Moçambique.',
    category: 'Poesia',
    coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 200,
    downloadCount: 180,
    likesCount: 98,
    ratingAverage: 4.7,
    ratingCount: 15,
    pageCount: 92,
    language: 'Português',
    publishedYear: 2025,
    isFeatured: false,
    uploadedBy: 'Sérgio Matusse',
    fileSizeFormatted: '1.2 MB'
  },
  {
    id: 'book-5',
    title: 'Redes e Algoritmos Modernos',
    author: 'Ofício F. Rachide',
    synopsis: 'Um ensaio técnico e acessível sobre arquiteturas distribuídas, bases de dados em tempo real e desenvolvimento de plataformas digitais no contexto moçambicano.',
    category: 'Tecnologia',
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    createdAt: Date.now() - 3600000 * 300,
    downloadCount: 680,
    likesCount: 420,
    ratingAverage: 5.0,
    ratingCount: 52,
    pageCount: 310,
    language: 'Português',
    publishedYear: 2026,
    isFeatured: true,
    uploadedBy: 'Ofício F. Rachide',
    fileSizeFormatted: '4.5 MB'
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
