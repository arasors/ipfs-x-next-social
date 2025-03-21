"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHashtagStore } from "@/store/hashtagStore";
import { usePostStore } from "@/store/postStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Hash, Search, TrendingUp } from "lucide-react";

export default function ExplorePage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  
  const { 
    trendingHashtags, 
    followedHashtags, 
    recentHashtags,
    isFollowingHashtag, 
    followHashtag, 
    unfollowHashtag, 
    updateTrendingHashtags 
  } = useHashtagStore();
  
  const { posts } = usePostStore();
  
  useEffect(() => {
    // Update trending hashtags when the page loads
    updateTrendingHashtags();
  }, [updateTrendingHashtags]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      const query = searchValue.trim();
      // If search starts with #, navigate to the hashtag page
      if (query.startsWith("#")) {
        const tag = query.substring(1);
        router.push(`/hashtag/${tag}`);
      } else {
        // Otherwise treat as a hashtag search anyway
        router.push(`/hashtag/${query}`);
      }
    }
  };
  
  const handleFollowToggle = (hashtag: string) => {
    if (isFollowingHashtag(hashtag)) {
      unfollowHashtag(hashtag);
    } else {
      followHashtag(hashtag);
    }
  };
  
  const renderHashtagList = (hashtags: string[] | { tag: string; count: number }[], showCount = false) => {
    if (hashtags.length === 0) {
      return (
        <div className="p-8 text-center">
          <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No hashtags found</h3>
          <p className="text-muted-foreground mt-2">
            {activeTab === "trending" 
              ? "Trending hashtags will appear here as users create more posts." 
              : activeTab === "following" 
                ? "Follow some hashtags to see them here."
                : "Your recent hashtag searches will appear here."}
          </p>
        </div>
      );
    }
    
    return (
      <div className="divide-y">
        {Array.isArray(hashtags) && hashtags.map((item) => {
          const hashtag = typeof item === 'string' ? item : item.tag;
          const count = typeof item === 'string' ? null : item.count;
          
          return (
            <div key={hashtag} className="flex items-center justify-between py-4">
              <Link 
                href={`/hashtag/${hashtag}`}
                className="flex items-center space-x-3 hover:text-primary"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">#{hashtag}</p>
                  {showCount && count !== null && (
                    <p className="text-sm text-muted-foreground">
                      {count} posts
                    </p>
                  )}
                </div>
              </Link>
              
              <Button
                variant={isFollowingHashtag(hashtag) ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleFollowToggle(hashtag)}
              >
                {isFollowingHashtag(hashtag) ? "Unfollow" : "Follow"}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Explore Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search hashtags..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="trending" onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="trending" className="flex-1">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1">
            <Bookmark className="mr-2 h-4 w-4" />
            Following
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex-1">
            <Hash className="mr-2 h-4 w-4" />
            Recent
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>Trending Hashtags</CardTitle>
            </CardHeader>
            <CardContent>
              {renderHashtagList(trendingHashtags, true)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="following">
          <Card>
            <CardHeader>
              <CardTitle>Hashtags You Follow</CardTitle>
            </CardHeader>
            <CardContent>
              {renderHashtagList(followedHashtags)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recently Viewed Hashtags</CardTitle>
            </CardHeader>
            <CardContent>
              {renderHashtagList(recentHashtags)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 