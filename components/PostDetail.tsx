"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  ArrowLeft, 
  Send,
  MoreHorizontal 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Post } from '@/models/Post';
import { usePostStore } from '@/store/postStore';
import { MediaPreview } from '@/lib/components/MediaPreview';
import { getContent, getJson } from '@/lib/ipfs';
import { PostDetailSkeleton } from './PostDetailSkeleton';

interface PostDetailProps {
  postId: string;
}

export default function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter();
  const { posts, likePost, addComment } = usePostStore();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        
        // First check if post exists in store
        const storePost = posts.find(p => p.id === postId);
        
        if (storePost) {
          setPost(storePost);
          setLoading(false);
          return;
        }
        
        // If not in store, try to fetch from IPFS
        const postData = await getJson(postId);
        
        if (postData) {
          // If content is a separate CID, fetch the actual content
          let content = postData.content;
          if (postData.contentCid) {
            try {
              content = await getContent(postData.contentCid);
            } catch (err) {
              console.error('Failed to fetch post content:', err);
            }
          }
          
          const fullPost: Post = {
            id: postId,
            authorAddress: postData.author || '',
            authorName: postData.authorName || '',
            content: content || postData.content || '',
            timestamp: postData.timestamp || Date.now(),
            likes: postData.likes || 0,
            comments: postData.comments || [],
            visibility: postData.visibility || 'public',
            mediaItems: postData.media ? postData.media.map((cid: string) => ({
              contentCID: cid,
              type: 'unknown'
            })) : [],
            reposts: postData.reposts || 0,
            category: postData.category || ''
          };
          
          setPost(fullPost);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    
    if (postId) {
      fetchPost();
    }
  }, [postId, posts]);

  // Handle like
  const handleLike = () => {
    if (!post) return;
    
    setIsLiked(!isLiked);
    likePost(post.id);
  };
  
  // Handle save
  const handleSave = () => {
    setIsSaved(!isSaved);
    // Implement save functionality later
  };
  
  // Handle comment submit
  const handleCommentSubmit = async () => {
    if (!post || !comment.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const newComment = {
        id: Date.now().toString(),
        authorAddress: localStorage.getItem('walletAddress') || 'unknown',
        content: comment,
        timestamp: Date.now(),
        likes: 0
      };
      
      addComment(post.id, newComment);
      setComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: tr 
    });
  };
  
  // Shorten address for display
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return <PostDetailSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Post could not be loaded</h3>
        <p className="text-muted-foreground mt-2">{error || 'Unknown error'}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/')}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button 
        variant="ghost" 
        className="mb-4 pl-0"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      {/* Post card */}
      <Card className="overflow-hidden">
        <CardHeader className="py-4 px-6 flex-row items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${post.authorAddress}`} />
            <AvatarFallback>
              {post.authorName ? post.authorName[0].toUpperCase() : "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium">
              {post.authorName || shortenAddress(post.authorAddress)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(post.timestamp)}
            </div>
          </div>
          {post.category && (
            <div className="ml-auto mr-2">
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                {post.category}
              </span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="rounded-full ml-auto">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More Options</span>
          </Button>
        </CardHeader>
        
        <CardContent className="px-6 py-4">
          {/* Post content */}
          <div className="prose prose-sm max-w-none dark:prose-invert mb-6">
            <p className="whitespace-pre-wrap">{post.content}</p>
            <pre>{JSON.stringify(post.mediaItems, null, 2)}</pre>
          </div>
          
          {/* Media content */}
          {post.mediaItems && post.mediaItems.length > 0 && (
            <div className="mt-4 space-y-4">
              {post.mediaItems.map((item, index) => (
                <div key={`${item.contentCID}-${index}`} className="overflow-hidden rounded-md">
                  <MediaPreview 
                    cid={item.contentCID || ''} 
                    width={600} 
                    height={350}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Post stats */}
          <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
            <div>{post.likes || 0} likes</div>
            <div>{post.comments?.length || 0} comments</div>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="px-6 py-3 flex justify-between">
          <Button variant="ghost" size="sm" onClick={handleLike}>
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
            Like
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `${post.content?.substring(0, 100) || ''}${post.content && post.content.length > 100 ? '...' : ''}\n\nShared on IPFS-X`
              )}`} 
              target="_blank"
              rel="noopener noreferrer"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Bookmark className={`h-4 w-4 mr-1 ${isSaved ? 'fill-current' : ''}`} />
            Save
          </Button>
        </CardFooter>
      </Card>
      
      {/* Comments section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Comments ({post.comments?.length || 0})</h3>
        
        {/* Comment form */}
        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleCommentSubmit}
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Comments list */}
        <div className="space-y-4">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment: any) => (
              <Card key={comment.id}>
                <CardHeader className="py-3 px-4 flex-row items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${comment.authorAddress}`} />
                    <AvatarFallback>
                      {comment.authorName ? comment.authorName[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">
                      {comment.authorName || shortenAddress(comment.authorAddress)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(comment.timestamp)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 