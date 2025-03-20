"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { connectWallet } from "@/lib/web3auth";
import { 
  Home, 
  Search, 
  User, 
  Users, 
  Menu,
  LogOut,
  MessageSquare,
  Bell,
  Bookmark,
  Hash,
  Settings
} from "lucide-react";

export default function Sidebar() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    // Local storage'dan cüzdan bilgisini al (eğer daha önce giriş yapıldıysa)
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      setAddress(storedAddress);
      setConnected(true);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const { address } = await connectWallet();
      setAddress(address);
      setConnected(true);
      // Local storage'a cüzdan adresini kaydet
      localStorage.setItem('walletAddress', address);
    } catch (error) {
      console.error("Bağlantı hatası:", error);
    }
  };

  // Cüzdan adresini kısaltma
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Aktif link kontrolü
  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    //{ name: 'Notifications', href: '/notifications', icon: Bell },
    //{ name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { name: 'Tags', href: '#', icon: Hash },
    { name: 'Community', href: '#', icon: Users },
  ];

  return (
    <div className="h-screen sticky top-0 flex flex-col py-4 bg-card border-r">
      {/* Logo ve Ana Başlık */}
      <div className="px-4 mb-8">
        <Link href="/" className="flex items-center">
          <h1 className="text-xl font-bold">IPFS-X</h1>
        </Link>
      </div>

      {/* Navigasyon */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item,index) => {
          const Icon = item.icon;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center px-4 py-3 text-base transition-colors hover:bg-primary/10 ${
                isActive(item.href) 
                  ? 'font-semibold text-primary border-r-2 border-primary' 
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="mr-4 h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profil ve Cüzdan Bağlantısı */}
      <div className="mt-auto px-4 pt-4 border-t">
        {isClient && !connected ? (
          <Button onClick={handleConnect} className="w-full">
            Connect Wallet
          </Button>
        ) : (
          address && (
            <>
              <Link 
                href="/profile"
                className={`flex items-center px-2 py-3 rounded-md transition-colors hover:bg-primary/10 ${
                  isActive('/profile') ? 'bg-primary/10' : ''
                }`}
              >
                <div className="bg-primary h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground mr-3">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Profile</span>
                  <span className="text-xs text-muted-foreground">{shortenAddress(address)}</span>
                </div>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  localStorage.removeItem('walletAddress');
                  setConnected(false);
                  setAddress(null);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          )
        )}
      </div>
    </div>
  );
} 