/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'reader';
  avatar: string;
  photoURL?: string;
  bio?: string;
  favoriteBookIds?: string[];
  readHistory?: string[];
  createdAt: number;
  lastLogin?: number;
  isGuest?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  authorUserId?: string;
  publisherUserId?: string;
  synopsis: string;
  category: string;
  coverUrl: string;
  pdfUrl: string;
  createdAt: number;
  downloadCount: number;
  likesCount: number;
  ratingAverage: number;
  ratingCount: number;
  pageCount?: number;
  language?: string;
  publishedYear?: number;
  isFeatured?: boolean;
  uploadedBy?: string;
  fileSizeFormatted?: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: number;
}

export interface BookComment {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
  likesCount: number;
  likedBy?: string[];
  parentId?: string | null;
  isAuthor?: boolean;
}

export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  count?: number;
}

export interface AdminStats {
  totalBooks: number;
  totalDownloads: number;
  totalUsers: number;
  totalReviews: number;
}
