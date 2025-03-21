"use client";

import { useState } from "react";
import { Comment as CommentType, Post } from "@/models/Post";
import { useUserStore } from "@/store/userStore";
import { usePostStore } from "@/store/postStore";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentForm } from "./CommentForm";
import { ThumbsUp, MessageSquare, Reply, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface CommentsProps {
  post: Post;
  showForm?: boolean;
  limit?: number;
}

export function Comments({ post, showForm = true, limit }: CommentsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  
  const { currentUser } = useUserStore();
  const { likeComment } = usePostStore();
  
  // Get comments to display
  const comments = post.comments || [];
  const displayComments = limit && !showAllComments 
    ? comments.slice(0, limit) 
    : comments;
  
  const handleLikeComment = (commentId: string) => {
    if (!currentUser) return;
    likeComment(post.id, commentId);
  };
  
  const handleCommentAdded = () => {
    // Scroll to the new comment
    setTimeout(() => {
      const commentsContainer = document.getElementById("comments-container");
      if (commentsContainer) {
        commentsContainer.scrollTop = commentsContainer.scrollHeight;
      }
    }, 100);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          Comments ({comments.length})
        </h3>
        
        {limit && comments.length > limit && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAllComments(!showAllComments)}
          >
            {showAllComments ? "Show less" : `View all (${comments.length})`}
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <CommentSkeleton count={3} />
      ) : (
        <div id="comments-container" className="space-y-4 max-h-[500px] overflow-y-auto">
          {displayComments.length > 0 ? (
            displayComments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onLike={() => handleLikeComment(comment.id)}
              />
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No comments yet</p>
              {showForm && currentUser && (
                <p className="text-sm mt-1">Be the first to comment on this post!</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {showForm && (
        <CommentForm 
          postId={post.id} 
          postAuthorAddress={post.authorAddress}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: CommentType;
  onLike: () => void;
}

function CommentItem({ comment, onLike }: CommentItemProps) {
  const { currentUser } = useUserStore();
  const formattedDate = formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true });
  
  return (
    <Card className="border bg-card/50">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link href={`/profile/${comment.authorAddress}`}>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {(comment.authorName?.[0] || comment.authorAddress[0]).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <Link 
                href={`/profile/${comment.authorAddress}`}
                className="font-medium hover:underline"
              >
                {comment.authorName || comment.authorAddress.substring(0, 8) + '...'}
              </Link>
              
              <span className="text-xs text-muted-foreground">
                {formattedDate}
              </span>
            </div>
            
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex items-center gap-4 pt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={onLike}
                disabled={!currentUser}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                <span>{comment.likes}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                disabled={!currentUser}
              >
                <Reply className="h-4 w-4 mr-1" />
                <span>Reply</span>
              </Button>
            </div>
            
            {comment.replies && comment.replies.length > 0 && (
              <div className="pl-4 border-l space-y-4 mt-4">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onLike={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array(count).fill(0).map((_, index) => (
        <Card key={index} className="border bg-card/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                
                <div className="flex items-center gap-4 pt-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 