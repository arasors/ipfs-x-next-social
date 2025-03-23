import type { CID } from 'multiformats/cid';

// Contact with custom nickname
export interface Contact {
  address: string;
  nickname?: string;
  addedAt: number;
}

export interface User {
  address: string;
  username?: string;
  displayName?: string;
  bio?: string;
  profileImageCID?: CID | string;
  coverImageCID?: CID | string;
  followingCount: number;
  followersCount: number;
  posts: string[]; // Post IDs
  following: string[]; // Addresses of users being followed
  followers: string[]; // Addresses of followers
  contacts: Record<string, Contact>; // Map of address to Contact with nickname
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  address: string;
  username?: string;
  displayName?: string;
  bio?: string;
  profileImageCID?: CID | string;
  coverImageCID?: CID | string;
  followingCount: number;
  followersCount: number;
  postCount: number;
  isFollowing?: boolean; // Whether the current user is following this profile
  isCurrentUser?: boolean; // Whether this is the current user's profile
  nickname?: string; // Custom nickname for this contact if any
} 