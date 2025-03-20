"use client";
import { useState, useEffect } from "react";
import { usePostStore } from "@/store/postStore";
import { connectWallet } from "@/lib/web3auth";
import { User, Edit, Settings, Link, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostItem from "@/components/PostItem";
import BoardFeed from "@/components/BoardFeed";

export default function ProfilePage() {
  const { posts } = usePostStore();
  const [address, setAddress] = useState<string>("");
  const [clientReady, setClientReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setClientReady(true);
    const fetchWalletAddress = async () => {
      // Local storage'dan cüzdan adresini al
      const storedAddress = localStorage.getItem('walletAddress');
      
      if (storedAddress) {
        setAddress(storedAddress);
      } else {
        try {
          // Eğer yoksa bağlan
          const { address } = await connectWallet();
          setAddress(address);
          localStorage.setItem('walletAddress', address);
        } catch (error) {
          console.error("Cüzdan bağlantı hatası:", error);
        }
      }
      setIsLoading(false);
    };
    
    fetchWalletAddress();
  }, []);

  // Cüzdan adresini kısaltma
  const shortenAddress = (address: string) => {
    if (!address) return "Bilinmeyen";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Kullanıcıya ait postları filtreleme
  const userPosts = posts.filter(post => post.authorAddress === address);

  if (!clientReady || isLoading) {
    return (
      <div className="w-full p-8 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="text-center p-8 border border-dashed rounded-lg">
          <h2 className="text-xl font-bold mb-4">Wallet Connection Required</h2>
          <p className="text-muted-foreground mb-4">
            To view your profile, you need to connect your wallet.
          </p>
          <Button onClick={async () => {
            try {
              const { address } = await connectWallet();
              setAddress(address);
              localStorage.setItem('walletAddress', address);
            } catch (error) {
              console.error("Cüzdan bağlantı hatası:", error);
            }
          }}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Profil Üst Bilgi */}
      <div className="mb-8">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg"></div>
        
        <div className="bg-card shadow rounded-b-lg px-6 pt-0 pb-6 -mt-12">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-end">
              <div className="bg-primary rounded-full p-1 -mt-8 border-4 border-background">
                <div className="bg-background h-20 w-20 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold">User</h1>
                <p className="text-muted-foreground">{shortenAddress(address)}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="mb-4">IPFS based decentralized social media platform user</p>
          
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-bold">0</span> Followed
            </div>
            <div>
              <span className="font-bold">0</span> Followers
            </div>
            <div>
              <span className="font-bold">{userPosts.length}</span> Posts
            </div>
          </div>
        </div>
      </div>
      
      {/* Sekmeler */}
      <Tabs defaultValue="posts" className="mb-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="reposts">Reposts</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-4">
          <div className="space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No posts yet.</p>
                <Button variant="outline" className="mt-4">Create your first post</Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="reposts" className="mt-4">
          <div className="text-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No reposts yet.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="likes" className="mt-4">
          <div className="text-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No likes yet.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 