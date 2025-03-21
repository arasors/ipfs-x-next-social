"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { UserPlus, UserMinus, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  targetAddress: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FollowButton({
  targetAddress,
  variant = "default",
  size = "default",
  className = ""
}: FollowButtonProps) {
  const router = useRouter();
  const { 
    currentUser, 
    followUser, 
    unfollowUser, 
    isFollowing,
    setCurrentUser
  } = useUserStore();
  
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // On first render, check if user is logged in and following status
  useEffect(() => {
    // Check if we need to set current user from localStorage
    if (!currentUser) {
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress) {
        setCurrentUser(storedAddress);
      }
    }
    
    // Initialize following state
    setFollowing(isFollowing(targetAddress));
    setLoading(false);
  }, [currentUser, targetAddress, isFollowing, setCurrentUser]);
  
  // Update local state when following status changes
  useEffect(() => {
    setFollowing(isFollowing(targetAddress));
  }, [isFollowing, targetAddress]);

  // Handle the follow/unfollow action
  const handleFollowAction = () => {
    if (!currentUser) {
      // Redirect to login page if not logged in
      router.push("/profile");
      return;
    }
    
    if (following) {
      unfollowUser(targetAddress);
    } else {
      followUser(targetAddress);
    }
  };

  if (loading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </Button>
    );
  }

  // Don't show follow button for own profile
  if (currentUser?.address === targetAddress) {
    return null;
  }

  return (
    <Button
      variant={following ? "outline" : variant}
      size={size}
      className={className}
      onClick={handleFollowAction}
    >
      {following ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          <span>Following</span>
          <Check className="h-3 w-3 ml-1" />
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          <span>Follow</span>
        </>
      )}
    </Button>
  );
} 