import type { CID } from 'multiformats/cid';

// Bir medya öğesini temsil eden arayüz
export interface MediaItem {
  contentCID?: string;
  type: 'image' | 'video' | 'document';
}

export interface Post {
  id: string;
  content: string;
  authorAddress: string;
  authorName?: string;
  timestamp: number;
  contentCID?: CID | string;
  likes: number;
  comments: Comment[];
  reposts: number;
  // Eski tekli medya desteği
  mediaContentCID?: CID | string;
  mediaType?: 'image' | 'video' | 'audio';
  // Yeni çoklu medya desteği
  mediaItems?: MediaItem[];
  tags?: string[];
  // Kategori bilgisi
  category?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorAddress: string;
  authorName?: string;
  timestamp: number;
  contentCID?: CID | string;
  likes: number;
  replies?: Comment[];
}

export interface User {
  address: string;
  username?: string;
  displayName?: string;
  bio?: string;
  profileImageCID?: CID | string;
  coverImageCID?: CID | string;
  followers: number;
  following: number;
  posts: string[]; // Post ID'leri
}

// IPFS'e kaydedilecek post verisi
export interface IPFSPost {
  content: string;
  authorAddress: string;
  authorName?: string;
  timestamp: number;
  // Eski tekli medya desteği
  mediaContentCID?: string;
  mediaType?: 'image' | 'video' | 'audio';
  // Yeni çoklu medya desteği
  mediaItems?: MediaItem[];
  tags?: string[];
  // Kategori bilgisi
  category?: string;
} 