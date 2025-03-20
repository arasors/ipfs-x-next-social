import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Post, Comment } from '@/models/Post';

interface PostState {
  posts: Post[];
  loading: boolean;
  addPost: (post: Omit<Post, 'id'>) => void;
  likePost: (postId: string) => void;
  getPosts: () => Post[];
  addComment: (postId: string, comment: Comment) => void;
  reset: () => void;
}

export const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      posts: [],
      loading: false,
      addPost: (post) => {
        const newPost: Post = {
          id: uuidv4(),
          ...post,
          likes: 0,
          comments: [],
          reposts: 0,
        };
        console.log("Store'a yeni gönderi ekleniyor:", newPost);
        set((state) => ({ posts: [newPost, ...state.posts] }));
        return newPost;
      },
      likePost: (postId) => {
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          ),
        }));
      },
      getPosts: () => {
        return get().posts;
      },
      addComment: (postId, comment) => {
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, comment] }
              : post
          ),
        }));
      },
      reset: () => {
        set({ posts: [] });
      },
    }),
    {
      name: 'ipfs-x-posts-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ posts: state.posts }),
    }
  )
); 