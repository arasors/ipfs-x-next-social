"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainLayout } from "@/components/layouts/MainLayout";
import { usePostStore } from "@/store/postStore";
import PostItem from "@/components/PostItem";
import { Hash, FileText } from "lucide-react";
import { Post } from "@/models/Post";

export default function TagPage() {
  const router = useRouter();
  const { tag } = router.query;
  const { posts } = usePostStore();
  const [tagPosts, setTagPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!tag || typeof tag !== 'string') return;
    
    setLoading(true);
    
    try {
      // Find posts with the specified tag
      const filteredPosts = posts.filter(post => {
        // Check in post content for hashtags
        const content = post.content || "";
        const hashtags = content.match(/#(\w+)/g) || [];
        
        return hashtags.some(hashtag => {
          const cleanTag = hashtag.substring(1).toLowerCase();
          return cleanTag === tag.toLowerCase();
        });
      });
      
      setTagPosts(filteredPosts);
    } catch (error) {
      console.error("Error filtering posts by tag:", error);
    } finally {
      setLoading(false);
    }
  }, [tag, posts]);
  
  if (!tag || typeof tag !== 'string') {
    return null;
  }
  
  return (
    <MainLayout>
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-6 w-6" />
            <h1 className="text-2xl font-bold">#{tag}</h1>
          </div>
          <p className="text-muted-foreground">
            {loading 
              ? "Loading posts..." 
              : tagPosts.length 
                ? `${tagPosts.length} posts with #${tag}`
                : `No posts found with #${tag}`
            }
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : tagPosts.length > 0 ? (
          <div className="space-y-4">
            {tagPosts.map(post => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium">No posts found</h3>
            <p className="text-muted-foreground mt-1">
              Be the first to post with #{tag}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 