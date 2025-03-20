"use client";

import { useState, useEffect } from "react";
import BoardFeed from "@/components/BoardFeed";
import { usePostStore } from "@/store/postStore";

export default function Home() {
  const { loading } = usePostStore();
  const [clientReady, setClientReady] = useState(false);

  // Client-side'da olduğumuzu doğrula
  useEffect(() => {
    setClientReady(true);
  }, []);

  if (!clientReady) {
    return (
      <main className="container mx-auto py-8 px-4 md:px-0">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-center">IPFS-X</h1>
          <p className="text-center text-muted-foreground"> 
            IPFS tabanlı merkeziyetsiz sosyal medya platformu
          </p>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Yükleniyor...</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="bg-card animate-pulse p-4 rounded-lg shadow"
                  style={{ height: '150px' }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <BoardFeed 
      title="Home" 
      subtitle="Share with everyone, discover everyone"
      showCreatePost={true}
    />
  );
}
