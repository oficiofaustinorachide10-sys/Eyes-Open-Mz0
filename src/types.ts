/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserStats {
  likes: number;
  posts: number;
  friends: number;
}

export interface User {
  id: string;
  phone: string;
  email: string;
  fullname: string;
  firstname: string;
  surname: string;
  nickname: string;
  password?: string; // Hashed password
  province: string;
  district?: string;
  created: string;
  avatar: string;
  stats: UserStats;
  nameEditDate: string | null;
  isVIP?: boolean;
  isVerified?: boolean;
  lastReadChatTimestamp?: number;
  lastReadNotificationsTimestamp?: number;
  mutedNotifications?: boolean;
  birthday?: string;
  gender?: string;
  orientation?: string;
  bio?: string;
  hideLocation?: boolean;
  ghostMode?: boolean;
  e2eeEnabled?: boolean;
  cover?: string;
  privacySettings?: {
    comment: 'public' | 'community' | 'friends' | 'family' | 'conhecidos' | 'only_me';
    react: 'public' | 'community' | 'friends' | 'family' | 'conhecidos' | 'only_me';
    share: 'public' | 'community' | 'friends' | 'family' | 'conhecidos' | 'only_me';
    view: 'public' | 'community' | 'friends' | 'family' | 'conhecidos' | 'only_me';
  };
  accountStatus?: 'active' | 'deactivated';
  isGuest?: boolean;
  expiresAt?: number;
}

export interface Notification {
  id: string;
  recipientId: string; // 'all' or specific userId
  title: string;
  text: string;
  type: 'like' | 'comment' | 'star' | 'system' | 'mention' | 'friend_request' | 'chat_request' | 'friend_accepted' | 'chat_accepted';
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  read: boolean;
  targetId?: string; // e.g. post ID or request ID
  targetView?: 'feed' | 'conversas' | 'abra-olhos' | 'notificacoes' | 'comunidade' | 'profile';
  timestamp: number;
}

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'ignored';
  level: 'amigo' | 'familia' | 'conhecido';
  timestamp: number;
}

export interface ChatPermission {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'ignored';
  duration: '24h' | '48h' | '7d' | 'permanent';
  acceptedAt?: number;
  expiresAt?: number | null;
  level: 'conhecido' | 'amigo' | 'parceiro' | 'familia' | 'equipe' | 'vip';
  timestamp: number;
}

export interface PostStyle {
  font: string;
  color: string;
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: number;
  audioUrl?: string;
  audioDuration?: number;
}

export interface Post {
  id: string;
  image: string | null;
  text: string | null;
  style?: PostStyle;
  author: {
    name: string;
    avatar: string;
    id: string;
  };
  stars: number;
  views: number;
  starred?: boolean;
  starredBy?: Record<string, boolean>;
  viewedBy?: Record<string, boolean>;
  isPrivate?: boolean;
  timestamp: number;
  comments?: Comment[];
  type?: 'photo' | 'video' | 'audio' | 'voice' | 'document' | 'file' | 'text';
  mediaUrl?: string;
  mediaCover?: string;
  title?: string;
  artist?: string;
  duration?: number;
  resolution?: string;
  fileSize?: string;
  pageCount?: number;
  location?: string;
  hashtags?: string[];
  taggedPeople?: string[];
  ratings?: Record<string, number>; // Maps userId to star rating value (1-5)
  listensCount?: number;
  sharesCount?: number;
}

export interface Story {
  id: string;
  type: 'photo' | 'text';
  src: string;
  text?: string;
  style?: PostStyle;
  music?: string | null;
  musicName?: string;
  author: {
    name: string;
    avatar: string;
    id: string;
  };
  stars?: number;
  views?: number;
  starred?: boolean;
  starredBy?: Record<string, boolean>;
  viewedBy?: Record<string, boolean>;
  timestamp: number;
}
