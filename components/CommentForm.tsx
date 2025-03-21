"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Comment } from "@/models/Post";
import { useUserStore } from "@/store/userStore";
import { usePostStore } from "@/store/postStore";
import { addJson } from "@/lib/ipfs";
import { useNotificationStore } from "@/store/notificationStore";

interface CommentFormProps {
  postId: string;
  postAuthorAddress: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ 
  postId, 
  postAuthorAddress,
  onCommentAdded 
}: CommentFormProps) {
  const { currentUser } = useUserStore();
  const { addComment } = usePostStore();
  const { addNotification } = useNotificationStore();
  
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to comment");
      return;
    }
    
    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create comment object
      const comment: Comment = {
        id: uuidv4(),
        content: content.trim(),
        authorAddress: currentUser.address,
        authorName: currentUser.displayName || currentUser.username,
        timestamp: Date.now(),
        likes: 0
      };
      
      // Store comment on IPFS
      const cidStr = await addJson(comment);
      if (cidStr) {
        comment.contentCID = cidStr;
        
        // Add comment to post
        addComment(postId, comment);
        
        // Create notification for post author if it's not the current user
        if (postAuthorAddress !== currentUser.address) {
          addNotification({
            type: 'comment',
            title: 'New Comment',
            message: `${currentUser.displayName || currentUser.username || currentUser.address} commented on your post`,
            actorAddress: currentUser.address,
            actorName: currentUser.displayName || currentUser.username,
            recipientAddress: postAuthorAddress,
            postId
          });
        }
        
        // Reset form
        setContent("");
        
        // Callback
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        throw new Error("Failed to add comment to IPFS");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={currentUser?.profileImageCID ? 
              `https://ipfs.io/ipfs/${currentUser.profileImageCID}` : 
              undefined
            } 
            alt={currentUser?.displayName || currentUser?.username || currentUser?.address || "User"} 
          />
          <AvatarFallback>
            {currentUser ? 
              (currentUser.displayName?.[0] || currentUser.username?.[0] || currentUser.address[0]).toUpperCase() : 
              "U"
            }
          </AvatarFallback>
        </Avatar>
        
        <Textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none min-h-[80px]"
          disabled={isSubmitting || !currentUser}
        />
      </div>
      
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || !content.trim() || !currentUser}
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
              Submitting...
            </>
          ) : (
            "Comment"
          )}
        </Button>
      </div>
    </form>
  );
} 