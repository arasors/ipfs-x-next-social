"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBox } from "@/components/SearchBox";
import { usePostStore } from "@/store/postStore";
import { useUserStore } from "@/store/userStore";
import { User, Hash, FileText } from "lucide-react";
import { Post } from "@/models/Post";
import { UserProfile } from "@/models/User";
import PostItem from "@/components/PostItem";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState("all");
  
  const { posts } = usePostStore();
  const { users, getUserProfile } = useUserStore();
  
  const [results, setResults] = useState<{
    users: UserProfile[];
    posts: Post[];
    tags: string[];
    loading: boolean;
  }>({
    users: [],
    posts: [],
    tags: [],
    loading: true
  });
  
  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults({
        users: [],
        posts: [],
        tags: [],
        loading: false
      });
      return;
    }
    
    setResults(prev => ({ ...prev, loading: true }));
    
    try {
      // Search users
      const userResults = Object.values(users)
        .map(user => getUserProfile(user.address))
        .filter(profile => 
          profile.displayName?.toLowerCase().includes(query.toLowerCase()) || 
          profile.username?.toLowerCase().includes(query.toLowerCase()) ||
          profile.address.toLowerCase().includes(query.toLowerCase())
        );
      
      // Search posts
      const postResults = posts
        .filter(post => 
          post.content?.toLowerCase().includes(query.toLowerCase()) ||
          post.authorAddress?.toLowerCase().includes(query.toLowerCase()) ||
          post.authorName?.toLowerCase().includes(query.toLowerCase())
        );
      
      // Search for tags in posts
      const tagMatches = new Set<string>();
      posts.forEach(post => {
        const content = post.content || "";
        const hashtags = content.match(/#(\w+)/g) || [];
        
        hashtags.forEach(tag => {
          const cleanTag = tag.substring(1).toLowerCase();
          if (cleanTag.includes(query.toLowerCase())) {
            tagMatches.add(cleanTag);
          }
        });
      });
      
      setResults({
        users: userResults,
        posts: postResults,
        tags: Array.from(tagMatches),
        loading: false
      });
    } catch (error) {
      console.error("Search error:", error);
      setResults({
        users: [],
        posts: [],
        tags: [],
        loading: false
      });
    }
  }, [query, users, posts, getUserProfile]);
  
  const totalResultsCount = results.users.length + results.posts.length + results.tags.length;
  
  return (
    <MainLayout>
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            {results.loading 
              ? "Searching..." 
              : totalResultsCount 
                ? `Found ${totalResultsCount} results for "${query}"`
                : `No results found for "${query}"`
            }
          </p>
          
          <div className="mt-4">
            <SearchBox variant="full" className="w-full" />
          </div>
        </div>
        
        {results.loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : totalResultsCount > 0 ? (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({totalResultsCount})
              </TabsTrigger>
              <TabsTrigger value="users" disabled={results.users.length === 0}>
                Users ({results.users.length})
              </TabsTrigger>
              <TabsTrigger value="posts" disabled={results.posts.length === 0}>
                Posts ({results.posts.length})
              </TabsTrigger>
              <TabsTrigger value="tags" disabled={results.tags.length === 0}>
                Tags ({results.tags.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6 mt-6">
              {results.users.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Users</h2>
                    {results.users.length > 3 && (
                      <Button variant="link" size="sm" onClick={() => setActiveTab("users")}>
                        See all
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {results.users.slice(0, 3).map((user) => (
                      <UserCard key={user.address} user={user} />
                    ))}
                  </div>
                </div>
              )}
              
              {results.posts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Posts</h2>
                    {results.posts.length > 3 && (
                      <Button variant="link" size="sm" onClick={() => setActiveTab("posts")}>
                        See all
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {results.posts.slice(0, 3).map((post) => (
                      <PostItem key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
              
              {results.tags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Tags</h2>
                    {results.tags.length > 8 && (
                      <Button variant="link" size="sm" onClick={() => setActiveTab("tags")}>
                        See all
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.tags.slice(0, 8).map((tag) => (
                      <Link key={tag} href={`/tag/${tag}`}>
                        <div className="bg-muted hover:bg-muted/80 transition-colors px-3 py-2 rounded-md flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span>#{tag}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
              <div className="space-y-2">
                {results.users.map((user) => (
                  <UserCard key={user.address} user={user} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="posts" className="mt-6">
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="tags" className="mt-6">
              <div className="flex flex-wrap gap-2">
                {results.tags.map((tag) => (
                  <Link key={tag} href={`/tag/${tag}`}>
                    <div className="bg-muted hover:bg-muted/80 transition-colors px-3 py-2 rounded-md flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>#{tag}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium">No results found</h3>
            <p className="text-muted-foreground mt-1">
              Try searching for something else
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

interface UserCardProps {
  user: UserProfile;
}

function UserCard({ user }: UserCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <Link href={`/profile/${user.address}`} className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{user.displayName || 'Anonymous'}</div>
            <div className="text-sm text-muted-foreground">
              {user.username ? `@${user.username}` : user.address.substring(0, 10) + '...'}
            </div>
          </div>
          {user.followersCount && (
            <div className="text-sm text-muted-foreground">
              {user.followersCount} followers
            </div>
          )}
        </Link>
      </CardContent>
    </Card>
  );
} 