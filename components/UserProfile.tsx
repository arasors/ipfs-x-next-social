"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getContent } from "@/lib/ipfs";
import { useUserStore } from "@/store/userStore";
import { FollowButton } from "./FollowButton";
import { UserList } from "./UserList";
import { UserProfile as UserProfileType } from "@/models/User";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, Users, MessageSquare, Images } from "lucide-react";

interface UserProfileProps {
  address: string;
}

export function UserProfile({ address }: UserProfileProps) {
  const { getUserProfile, getFollowers, getFollowing } = useUserStore();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  
  // Initialize profile data
  useEffect(() => {
    try {
      const userProfile = getUserProfile(address);
      setProfile(userProfile);
      
      // Get followers and following
      setFollowers(getFollowers(address));
      setFollowing(getFollowing(address));
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [address, getUserProfile, getFollowers, getFollowing]);

  if (loading) {
    return <UserProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <UserIcon size={64} className="text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground">
          The user profile you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        {profile.coverImageCID && (
          <Image
            src={`https://ipfs.io/ipfs/${profile.coverImageCID}`}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Info Card */}
      <Card className="border shadow-sm">
        <CardHeader className="relative pb-0">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            {/* Avatar */}
            <div className="relative -mt-16 border-4 border-background rounded-full h-24 w-24 overflow-hidden bg-muted">
              <Avatar className="h-full w-full">
                <AvatarImage 
                  src={profile.profileImageCID ? 
                    `https://ipfs.io/ipfs/${profile.profileImageCID}` : 
                    undefined
                  } 
                  alt={profile.displayName || profile.username || profile.address} 
                />
                <AvatarFallback>
                  {(profile.displayName?.[0] || profile.username?.[0] || profile.address[0]).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.displayName || profile.username || profile.address.substring(0, 10) + '...'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile.username ? `@${profile.username}` : profile.address}
              </p>
            </div>
            
            {/* Follow Button */}
            <div className="mt-2 md:mt-0">
              <FollowButton targetAddress={profile.address} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Bio */}
          {profile.bio && (
            <p className="text-sm mb-4">{profile.bio}</p>
          )}
          
          {/* Stats */}
          <div className="flex gap-4 text-sm mb-6">
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span className="font-medium">{profile.followersCount}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span className="font-medium">{profile.followingCount}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={16} />
              <span className="font-medium">{profile.postCount}</span>
              <span className="text-muted-foreground">Posts</span>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
              <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
              <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
              <TabsTrigger value="followers" className="flex-1">Followers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="min-h-[200px]">
              <p className="text-center text-muted-foreground py-10">
                Posts will appear here
              </p>
            </TabsContent>
            
            <TabsContent value="media" className="min-h-[200px]">
              <div className="text-center text-muted-foreground py-10">
                <Images className="mx-auto h-10 w-10 mb-2" />
                <p>Media posts will appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="following" className="min-h-[200px] pt-4">
              <UserList 
                users={following}
                emptyMessage={`${profile.displayName || profile.username || 'This user'} isn't following anyone yet`}
              />
            </TabsContent>
            
            <TabsContent value="followers" className="min-h-[200px] pt-4">
              <UserList 
                users={followers}
                emptyMessage={`${profile.displayName || profile.username || 'This user'} doesn't have any followers yet`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton
function UserProfileSkeleton() {
  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto">
      <Skeleton className="h-48 w-full rounded-lg" />
      
      <Card className="border shadow-sm">
        <CardHeader className="relative pb-0">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <Skeleton className="relative -mt-16 rounded-full h-24 w-24" />
            
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            
            <Skeleton className="h-10 w-28 mt-2 md:mt-0" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
} 