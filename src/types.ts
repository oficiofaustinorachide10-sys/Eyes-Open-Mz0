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
  created: string;
  avatar: string;
  stats: UserStats;
  nameEditDate: string | null;
  isVIP?: boolean;
}

export interface PostStyle {
  font: string;
  color: string;
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
  timestamp: number;
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
  timestamp: number;
}
