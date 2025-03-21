"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { FollowButton } from "./FollowButton";
import { User, UserProfile } from "@/models/User";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, UserX } from "lucide-react";

interface UserListProps {
  users: string[]; // Array of user addresses
  emptyMessage?: string;
  showSearch?: boolean;
}

export function UserList({ 
  users, 
  emptyMessage = "No users to display", 
  showSearch = true 
}: UserListProps) {
  const { getUserProfile } = useUserStore();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Load user profiles
  useEffect(() => {
    try {
      const loadedProfiles = users.map(address => getUserProfile(address));
      setProfiles(loadedProfiles);
      setFilteredProfiles(loadedProfiles);
    } catch (error) {
      console.error("Error loading user profiles:", error);
    } finally {
      setLoading(false);
    }
  }, [users, getUserProfile]);
  
  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProfiles(profiles);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = profiles.filter(profile => 
      profile.displayName?.toLowerCase().includes(query) ||
      profile.username?.toLowerCase().includes(query) ||
      profile.address.toLowerCase().includes(query)
    );
    
    setFilteredProfiles(filtered);
  }, [searchQuery, profiles]);

  if (loading) {
    return <UserListSkeleton showSearch={showSearch} />;
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <UserX size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      
      {/* Results count */}
      {showSearch && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredProfiles.length} of {profiles.length} users
        </div>
      )}
      
      {/* User list */}
      <div className="space-y-2">
        {filteredProfiles.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No users match your search
          </p>
        ) : (
          filteredProfiles.map((profile) => (
            <UserListItem key={profile.address} profile={profile} />
          ))
        )}
      </div>
    </div>
  );
}

interface UserListItemProps {
  profile: UserProfile;
}

function UserListItem({ profile }: UserListItemProps) {
  return (
    <Card className="hover:bg-accent/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* User info */}
          <Link href={`/profile/${profile.address}`} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
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
            
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {profile.displayName || profile.username || profile.address.substring(0, 10) + '...'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile.username ? `@${profile.username}` : profile.address}
              </p>
            </div>
          </Link>
          
          {/* Follow button */}
          <div className="ml-2">
            <FollowButton 
              targetAddress={profile.address} 
              size="sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
function UserListSkeleton({ showSearch = true }) {
  return (
    <div className="space-y-4">
      {showSearch && <Skeleton className="h-10 w-full" />}
      {showSearch && <Skeleton className="h-5 w-48" />}
      
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 