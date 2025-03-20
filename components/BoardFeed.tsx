"use client";
import { useState, useEffect } from "react";
import { Post } from "@/models/Post";
import PostItem from "@/components/PostItem";
import CreatePost from "@/components/CreatePost";
import { usePostStore } from "@/store/postStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp,
  LayoutGrid,
  Clock,
  Filter,
  Users,
  RefreshCw
} from "lucide-react";

interface BoardFeedProps {
  title?: string;
  subtitle?: string;
  showCreatePost?: boolean;
}

export default function BoardFeed({ 
  title = "Board", 
  subtitle = "Discover all posts here",
  showCreatePost = true
}: BoardFeedProps) {
  const { posts, loading, getPosts } = usePostStore();
  const [activeFeed, setActiveFeed] = useState("herkes");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshFeed = () => {
    setIsRefreshing(true);
    // Burada API'den yeni postları çekebilirsiniz
    // Şimdilik sadece bir gecikme simülasyonu yapıyoruz
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Postları kategorilere ayırma
  const filterPosts = (category: string) => {
    const allPosts = getPosts();
    
    switch(category) {
      case "trend":
        // En çok beğeni alan postlar
        return [...allPosts].sort((a, b) => b.likes - a.likes);
      case "yeni":
        // En son paylaşılan postlar
        return [...allPosts].sort((a, b) => b.timestamp - a.timestamp);
      case "takip":
        // Takip edilen kullanıcıların postları
        // Şimdilik demo olarak ilk 3 post
        return allPosts.slice(0, 3);
      case "herkes":
      default:
        // Tüm postlar
        return allPosts;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={refreshFeed}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {showCreatePost && (
        <div className="mb-6">
          <CreatePost />
        </div>
      )}
      
      <Tabs defaultValue="herkes" className="mb-6" onValueChange={setActiveFeed}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="herkes" className="flex items-center gap-1 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Public</span>
          </TabsTrigger>
          <TabsTrigger value="takip" className="flex items-center gap-1 py-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Followed</span>
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex items-center gap-1 py-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="yeni" className="flex items-center gap-1 py-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="herkes" className="mt-4">
          <div className="space-y-4">
            {loading ? (
              // Yükleniyor gösterimi
              Array(3).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-card animate-pulse p-4 rounded-lg shadow"
                  style={{ height: '150px' }}
                />
              ))
            ) : filterPosts("herkes").length > 0 ? (
              filterPosts("herkes").map(post => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No posts yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="takip" className="mt-4">
          <div className="space-y-4">
            {filterPosts("takip").length > 0 ? (
              filterPosts("takip").map(post => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No posts from followed users.</p>
                <Button variant="outline" className="mt-4">Explore</Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="trend" className="mt-4">
          <div className="space-y-4">
            {filterPosts("trend").length > 0 ? (
              filterPosts("trend").map(post => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No posts trending yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="yeni" className="mt-4">
          <div className="space-y-4">
            {filterPosts("yeni").length > 0 ? (
              filterPosts("yeni").map(post => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No new posts yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 