/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Post, Story } from './types';

export const PROVINCES = [
  'Niassa',
  'Cabo Delgado',
  'Nampula',
  'Zambézia',
  'Tete',
  'Manica',
  'Sofala',
  'Inhambane',
  'Gaza',
  'Maputo Província',
  'Maputo Cidade'
];

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  'Niassa': ['Lichinga', 'Cuamba', 'Lago', 'Majune', 'Mandimba', 'Marrupa', 'Maúa', 'Mavago', 'Mecanhelas', 'Mecula', 'Metarica', 'Muembe', 'Ngauma', 'Nipepe', 'Sanga'],
  'Cabo Delgado': ['Pemba', 'Ancuabe', 'Balama', 'Chiúre', 'Ibo', 'Macomia', 'Muidumbe', 'Montepuez', 'Mueda', 'Nangade', 'Palma', 'Quissanga'],
  'Nampula': ['Nampula', 'Angoche', 'Eráti', 'Ilha de Moçambique', 'Lalaua', 'Larde', 'Liúpo', 'Malema', 'Meconta', 'Mecubúri', 'Memba', 'Mogincual', 'Mogovolas', 'Moma', 'Monapo', 'Mossuril', 'Muecate', 'Murrupula', 'Nacarôa', 'Nampula Rapale', 'Ribáuè'],
  'Zambézia': ['Quelimane', 'Alto Molócue', 'Chinde', 'Gilé', 'Guruné', 'Inhassunge', 'Lugela', 'Maganja da Costa', 'Milange', 'Mocuba', 'Mocubela', 'Mopeia', 'Morrumbala', 'Namacurra', 'Namarroi', 'Nicoadala', 'Pebane'],
  'Tete': ['Angónia', 'Cahora-Bassa', 'Changara', 'Chifunde', 'Chiúta', 'Dôa', 'Macanga', 'Magoé', 'Marávia', 'Moatize', 'Mutarara', 'Tete', 'Tsangano', 'Zumbo'],
  'Manica': ['Chimoio', 'Bárue', 'Gondola', 'Guro', 'Macate', 'Machaze', 'Macossa', 'Manica', 'Mossurize', 'Sussundenga', 'Tambara', 'Vanduzi'],
  'Sofala': ['Beira', 'Buzi', 'Caia', 'Chembba', 'Cheringoma', 'Chibabava', 'Dondo', 'Gorongosa', 'Marromeu', 'Machanga', 'Maringué', 'Muanza', 'Nhamatanda'],
  'Inhambane': ['Funhalouro', 'Govuro', 'Homoíne', 'Inharrime', 'Inhassoro', 'Jangamo', 'Mabote', 'Massinga', 'Maxixe', 'Morrumbene', 'Panda', 'Vilankulo', 'Zavala'],
  'Gaza': ['Bilene', 'Chibuto', 'Chicualacuala', 'Chigubo', 'Chókwè', 'Guijá', 'Mabalane', 'Manjacaze', 'Massangena', 'Massingir', 'Xai-Xai'],
  'Maputo Província': ['Boane', 'Magude', 'Manhiça', 'Marracuene', 'Matola', 'Moamba', 'Namaacha', 'Matutuíne'],
  'Maputo Cidade': ['KaMpfumo', 'KaNhaka', 'KaTembe', 'KaMaxaquene', 'KaMavota', 'KaMubukwana', 'Lhanguene']
};

export const FONTS_LIST = [
  'Poppins',
  'Roboto',
  'Arial',
  'Times New Roman',
  'Calibri',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Impact',
  'Comic Sans MS'
];

export const COLOR_OPTIONS = [
  '#ffffff',
  '#00ffea',
  '#00d9ff',
  '#9d00ff',
  '#ff00aa',
  '#ff3366',
  '#00ccff'
];

// Simple compatible hash matching user's original logic
export function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Phone number normalization and validation
export function validatePhone(phoneInput: string): { ok: boolean; normalized: string; error?: string } {
  let phone = phoneInput.trim().replace(/\s+/g, '');
  if (phone.startsWith('+258')) {
    phone = phone.slice(4);
  }
  if (!/^\d{9}$/.test(phone)) {
    return { ok: false, normalized: '', error: 'O número de telefone deve possuir exatamente 9 dígitos.' };
  }
  const prefix = phone.slice(0, 2);
  const allowedPrefixes = new Set(['82', '83', '84', '85', '86', '87']);
  if (!allowedPrefixes.has(prefix)) {
    return { ok: false, normalized: '', error: 'Prefixo de Moçambique inválido (Use 82-87).' };
  }
  return { ok: true, normalized: '+258' + phone };
}

// Email validator
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(email.trim());
}

// Name token validator
export function validateNames(fullName: string, firstName: string, surname: string): { ok: boolean; error?: string } {
  const fName = fullName.trim();
  const tokens = fName.split(/\s+/).filter(Boolean);
  
  if (tokens.length < 3) {
    return { ok: false, error: 'O nome completo deve possuir pelo menos 3 palavras.' };
  }
  if (tokens[0].toLowerCase() !== firstName.trim().toLowerCase()) {
    return { ok: false, error: 'O primeiro nome informado não corresponde à primeira palavra do nome completo.' };
  }
  if (tokens[tokens.length - 1].toLowerCase() !== surname.trim().toLowerCase()) {
    return { ok: false, error: 'O apelido informado não corresponde à última palavra do nome completo.' };
  }
  return { ok: true };
}

// Nickname format validator
export function validateNickname(nickname: string): boolean {
  const re = /^[\p{L}0-9_ ]+$/u;
  return re.test(nickname.trim()) && nickname.trim().length >= 3;
}

// Initial Data Seeds
export const SEED_USERS: User[] = [
  {
    id: 'user1',
    phone: '+25884000111',
    email: 'alex@openmz.com',
    fullname: 'Alex Manuel Zandamel',
    firstname: 'Alex',
    surname: 'Zandamel',
    nickname: 'Alex MZ',
    password: simpleHash('123456'), // Default pass
    province: 'Maputo Cidade',
    district: 'KaMpfumo',
    created: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    stats: { likes: 1240, posts: 14, friends: 342 },
    nameEditDate: null,
    isVIP: true
  },
  {
    id: 'user2',
    phone: '+258870755639',
    email: 'oficiofaustinorachide10@gmail.com',
    fullname: 'Oficio Faustino Rachide',
    firstname: 'Oficio',
    surname: 'Rachide',
    nickname: 'Oficio MZ',
    password: simpleHash('123456'),
    province: 'Zambézia',
    district: 'Quelimane',
    created: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    stats: { likes: 350, posts: 4, friends: 98 },
    nameEditDate: null,
    isVIP: false
  }
];

export const SEED_POSTS: Post[] = [
  {
    id: 'post_1',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600',
    text: 'A produzir o nosso próximo filme focado no dia a dia em Maputo! Sua visão é a nossa missão 🎬🎥✨',
    style: { font: 'Poppins', color: '#00ffea' },
    author: {
      name: 'Alex MZ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      id: 'user1'
    },
    stars: 342,
    views: 1245,
    starred: true,
    timestamp: Date.now() - 3600000 * 2 // 2 hours ago
  },
  {
    id: 'post_2',
    image: null,
    text: 'Cultura moçambicana no topo do mundo! Novidades incríveis chegando no canal de cinema em breve. Fiquem atentos, olhos bem abertos! 👁️🔥🇲🇿',
    style: { font: 'Courier New', color: '#ff00aa' },
    author: {
      name: 'Alex MZ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      id: 'user1'
    },
    stars: 189,
    views: 742,
    starred: false,
    timestamp: Date.now() - 3600000 * 8 // 8 hours ago
  },
  {
    id: 'post_3',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=600',
    text: 'Concerto incrível que registramos na Beira neste final de semana. A energia de Moçambique é simplesmente contagiante! 🎸🔥🇲🇿',
    style: { font: 'Impact', color: '#00d9ff' },
    author: {
      name: 'Oficio MZ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      id: 'user2'
    },
    stars: 254,
    views: 890,
    starred: false,
    timestamp: Date.now() - 3600000 * 24 // 1 day ago
  }
];

export const SEED_STORIES: Story[] = [
  {
    id: 'story_1',
    type: 'photo',
    src: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=400',
    text: 'Cinematografia Digital 📽️',
    style: { font: 'Poppins', color: '#ffffff' },
    author: {
      name: 'Alex MZ',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      id: 'user1'
    },
    stars: 45,
    views: 120,
    starred: false,
    timestamp: Date.now() - 1000 * 60 * 30 // 30 mins ago
  },
  {
    id: 'story_2',
    type: 'photo',
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400',
    text: 'A todo vapor nos bastidores! 🚀',
    style: { font: 'Courier New', color: '#00ffea' },
    author: {
      name: 'Oficio MZ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      id: 'user2'
    },
    stars: 23,
    views: 64,
    starred: false,
    timestamp: Date.now() - 1000 * 60 * 90 // 90 mins ago
  }
];
