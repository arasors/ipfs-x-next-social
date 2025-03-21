"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/models/Post";
import { UserProfile } from "@/models/User";
import { usePostStore } from "@/store/postStore";
import { useUserStore } from "@/store/userStore";
import { getAddressDisplay } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CommentItemProps {
  comment: Comment;
  postId: string;
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const { updateComment, removeComment } = usePostStore();
  const { getUserProfile } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const initialProfile = getUserProfile(comment.authorAddress);
  const [author, setAuthor] = useState<UserProfile>({
    address: comment.authorAddress,
    username: initialProfile?.username,
    displayName: initialProfile?.displayName,
    profileImageCID: initialProfile?.profileImageCID,
    followingCount: initialProfile?.followingCount || 0,
    followersCount: initialProfile?.followersCount || 0,
    postCount: initialProfile?.postCount || 0
  });
  
  // Check if current user is the comment owner
  const isCurrentUserComment = () => {
    const currentUserAddress = localStorage.getItem('walletAddress');
    return currentUserAddress === comment.authorAddress;
  };
  
  // Save comment edits
  const saveEdit = () => {
    if (editContent.trim() === '') return;
    
    updateComment(postId, comment.id, { content: editContent });
    setIsEditing(false);
    toast.success("Comment updated successfully");
  };
  
  // Cancel comment editing
  const cancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };
  
  // Handle comment deletion
  const handleDelete = () => {
    removeComment(postId, comment.id);
    toast.success("Comment deleted successfully");
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex space-x-3 text-sm">
        <Avatar className="h-6 w-6">
          <AvatarImage 
            src={author.profileImageCID ? 
              `https://ipfs.io/ipfs/${author.profileImageCID}` : 
              `https://api.dicebear.com/7.x/shapes/svg?seed=${comment.authorAddress}`}
            alt={author.displayName || author.username || comment.authorAddress}
          />
          <AvatarFallback>
            {(author.displayName?.[0] || author.username?.[0] || comment.authorAddress.substring(0, 2)).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              {author.displayName || author.username || getAddressDisplay(comment.authorAddress)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
            </span>
            
            {isCurrentUserComment() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-auto">
                    <MoreHorizontal className="h-3 w-3" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit comment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete comment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[80px] text-sm"
                placeholder="Update your comment..."
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={editContent.trim() === ''}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1">{comment.content}</p>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 