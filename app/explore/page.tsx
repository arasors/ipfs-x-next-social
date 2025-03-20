"use client";
import { useState, useEffect } from "react";
import BoardFeed from "@/components/BoardFeed";
import { usePostStore } from "@/store/postStore";

export default function ExplorePage() {
  const { loading } = usePostStore();
  const [clientReady, setClientReady] = useState(false);

  // Client-side'da olduğumuzu doğrula
  useEffect(() => {
    setClientReady(true);
  }, []);

  if (!clientReady) {
    return (
      <div className="w-full p-8 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <BoardFeed 
      title="Explore" 
      subtitle="Discover popular content and trends"
      showCreatePost={false}
    />
  );
} 