"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostItem from "@/components/PostItem";
import { Button } from "@/components/ui/button";
import { usePostStore } from "@/store/postStore";
import { useHashtagStore } from "@/store/hashtagStore";
import { formatHashtag } from "@/lib/hashtags";
import { Bookmark, Hash, Heart, Share2 } from "lucide-react";
import { Post } from "@/models/Post";

export default function HashtagPage() {
  const params = useParams();
  const tag = params?.tag ? (Array.isArray(params.tag) ? params.tag[0] : params.tag) : '';
  const formattedTag = formatHashtag(tag);
  
  const { 
    getPostsWithHashtag, 
    isFollowingHashtag, 
    followHashtag, 
    unfollowHashtag, 
    addRecentHashtag 
  } = useHashtagStore();
  const { getPosts } = usePostStore();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  
  useEffect(() => {
    if (!formattedTag) return;
    
    // Add to recent hashtags
    addRecentHashtag(formattedTag);
    
    // Check if user is following this hashtag
    setIsFollowing(isFollowingHashtag(formattedTag));
    
    // Get posts with this hashtag
    const postIds = getPostsWithHashtag(formattedTag);
    const allPosts = getPosts();
    
    // Filter posts by IDs and sort by timestamp (newest first)
    const matchingPosts = allPosts
      .filter(post => postIds.includes(post.id))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    setPosts(matchingPosts);
  }, [formattedTag, getPosts, getPostsWithHashtag, isFollowingHashtag, addRecentHashtag]);
  
  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowHashtag(formattedTag);
    } else {
      followHashtag(formattedTag);
    }
    setIsFollowing(!isFollowing);
  };
  
  if (!formattedTag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Invalid Hashtag</h1>
        <p className="text-muted-foreground">This hashtag is not valid or does not exist.</p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto py-8">
      <div className="bg-card rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Hash className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{`#${formattedTag}`}</h1>
              <p className="text-muted-foreground">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>
          
          <Button
            variant={isFollowing ? "secondary" : "default"}
            className="ml-auto"
            onClick={handleFollowToggle}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        </div>
        
        {posts.length > 0 && (
          <div className="mt-4 flex items-center text-sm text-muted-foreground">
            <div className="flex items-center mr-4">
              <Heart className="h-4 w-4 mr-1" />
              <span>
                {posts.reduce((sum, post) => sum + post.likes, 0)} likes
              </span>
            </div>
            <div className="flex items-center mr-4">
              <Share2 className="h-4 w-4 mr-1" />
              <span>
                {posts.reduce((sum, post) => sum + (post.reposts || 0), 0)} shares
              </span>
            </div>
            <div className="flex items-center">
              <Bookmark className="h-4 w-4 mr-1" />
              <span>
                {posts.filter(post => post.tags?.includes(formattedTag)).length} tagged
              </span>
            </div>
          </div>
        )}
      </div>
      
      {posts.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-8 text-center">
          <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No posts found</h2>
          <p className="text-muted-foreground mb-4">
            There are no posts with the hashtag #{formattedTag} yet.
          </p>
          <p className="text-sm">
            Be the first to post with this hashtag!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostItem key={post.id} post={post} showComments={false} />
          ))}
        </div>
      )}
    </div>
  );
} 