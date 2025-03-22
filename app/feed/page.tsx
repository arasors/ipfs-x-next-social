"use client";

import { useEffect, useState } from 'react';
import BoardFeed from '@/components/BoardFeed';
import CreatePost from '@/components/CreatePost';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePostStore } from '@/store/postStore';
import { useUserStore } from '@/store/userStore';
import { useHashtagStore } from '@/store/hashtagStore';
import { syncFeeds } from '@/lib/syncRemotePosts';
import { initOrbitDB } from '@/lib/orbitdb';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Basit bir TabNav bileşeni
const TabNav = ({ tabs, activeTab, onTabChange, loading }: any) => {
  return (
    <div className="border-b px-4 py-2 flex items-center justify-between">
      <div className="flex gap-4">
        {tabs.map((tab: any) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => onTabChange(tab.id)}
            size="sm"
            className="rounded-full"
          >
            {tab.label}
          </Button>
        ))}
      </div>
      {loading && (
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
};

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<string>('following');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const getUserProfile = useUserStore((state) => state.getUserProfile);
  const updateTrendingHashtags = useHashtagStore((state) => state.updateTrendingHashtags);
  const isFollowingHashtag = useHashtagStore((state) => state.isFollowingHashtag);
  const currentUserAddress = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;
  const postsCount = usePostStore((state) => state.posts.length);

  // Feed senkronizasyonu
  useEffect(() => {
    const loadData = async () => {
      try {
        // Veri yükleniyor durumunu belirt
        setIsSyncing(true);
        
        // OrbitDB'yi başlat
        await initOrbitDB();
        
        // Feed verilerini senkronize et (hem OrbitDB hem IPFS)
        await syncFeeds();
        
        // Etiketleri güncelle
        updateTrendingHashtags();
        
        // Yükleme durumunu güncelle
        setIsInitialized(true);
      } catch (error) {
        console.error('Feed verileri yüklenirken hata:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    loadData();
    
    // Periyodik olarak senkronizasyon yap
    const intervalId = setInterval(async () => {
      try {
        setIsSyncing(true);
        await syncFeeds();
        updateTrendingHashtags();
      } catch (error) {
        console.error('Periyodik senkronizasyon sırasında hata:', error);
      } finally {
        setIsSyncing(false);
      }
    }, 60000); // Her 1 dakikada bir
    
    return () => clearInterval(intervalId);
  }, [updateTrendingHashtags]);
  
  // Paylaşım sayısı değiştiğinde etiketleri güncelle
  useEffect(() => {
    if (isInitialized) {
      updateTrendingHashtags();
    }
  }, [postsCount, isInitialized, updateTrendingHashtags]);
  
  const tabs = [
    {
      id: 'following',
      label: 'Takip Edilenler',
      hidden: !currentUserAddress,
    },
    {
      id: 'trending',
      label: 'Gündem',
    },
    {
      id: 'recent',
      label: 'Yeni',
    },
    {
      id: 'hashtags',
      label: 'Takip Edilen Etiketler',
      hidden: !currentUserAddress,
    }
  ];
  
  return (
    <AuthGuard allowUnauthenticated>
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Feed içeriği - Ana içerik */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-4">
            {/* Post oluşturma bileşeni */}
            {currentUserAddress && (
              <div className="rounded-lg border shadow-sm p-4 bg-background">
                <CreatePost />
              </div>
            )}
            
            {/* Tab navigasyonu */}
            <div className="border rounded-lg shadow-sm bg-background overflow-hidden">
              <TabNav 
                tabs={tabs.filter(tab => !tab.hidden)} 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                loading={isSyncing}
              />
              
              {/* Feed içeriği */}
              <BoardFeed 
                mode={activeTab} 
                currentUserAddress={currentUserAddress || ''}
                isFollowingHashtag={isFollowingHashtag}
                getUserProfile={getUserProfile}
                isLoading={!isInitialized}
                isSyncing={isSyncing}
              />
            </div>
          </div>
          
          {/* Sağ sidebar - Trend konular, önerilen kullanıcılar vb. */}
          <div className="hidden lg:block space-y-4">
            {/* Buraya trend konular, önerilen kullanıcılar vb. bileşenler eklenebilir */}
            <div className="border rounded-lg shadow-sm bg-background p-4">
              <h3 className="font-medium mb-2">IPFS-X Feed</h3>
              <p className="text-sm text-muted-foreground">
                OrbitDB ve IPFS üzerinde tamamen merkezsiz bir sosyal medya deneyimi.
              </p>
              {isSyncing && (
                <div className="text-xs text-muted-foreground mt-2">
                  Dağıtık ağdan veriler senkronize ediliyor...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 