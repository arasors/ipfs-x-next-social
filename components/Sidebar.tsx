"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Settings,
  Tag,
  PenSquare
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useUserStore } from "@/store/userStore";
import { useHashtagStore } from "@/store/hashtagStore";

export default function Sidebar() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { reset, currentUser, setCurrentUser } = useUserStore();
  const { followedHashtags } = useHashtagStore();

  useEffect(() => {
    setIsClient(true);
    // Get wallet info from local storage (if previously logged in)
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      // Sync with userStore if not already set
      if (!currentUser) {
        setCurrentUser(storedAddress);
      }
    }
  }, [currentUser, setCurrentUser]);

  const handleWalletClick = async () => {
    if (currentUser) {
      // Properly logout user
      reset(); // This resets the user store state
      localStorage.removeItem('walletAddress'); // Remove from local storage
      
      // Redirect to home page
      router.push('/');
    } else {
      try {
        // Connect wallet
        const walletAddress = await connectWallet();
        if (walletAddress) {
          localStorage.setItem('walletAddress', walletAddress);
          setCurrentUser(walletAddress);
        }
      } catch (error) {
        console.error("Wallet connection error:", error);
      }
    }
  };

  // Function to shorten wallet address for display
  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Active link check
  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    // Notifications moved to custom item below
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { name: 'Tags', href: '/tags', icon: Tag },
    { name: 'Community', href: '/community', icon: Users },
  ];

  return (
    <div className="h-screen sticky top-0 flex flex-col py-4 bg-card border-r">
      {/* Logo and Main Title */}
      <div className="px-4 mb-8">
        <Link href="/" className="flex items-center">
          <h1 className="text-xl font-bold">IPFS-X</h1>
        </Link>
      </div>

      {/* Navigation */}
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
        
        {/* Custom notification item with popup */}
        <div className={`flex items-center px-4 py-3 text-base transition-colors hover:bg-primary/10 ${
          isActive('/notifications') 
            ? 'font-semibold text-primary border-r-2 border-primary' 
            : 'text-muted-foreground'
        }`}>
          
            <NotificationBell showIcon={true} showLabel={false} iconSize="sm" side="right">
              <div className="flex items-center  flex-1">
           
              <Bell className="mr-4 h-5 w-5" />
               <span>Notifications</span>
               </div>
            </NotificationBell>
          
        </div>
      </nav>

      {/* Profile and Wallet Connection */}
      <div className="mt-auto px-4 pt-4 border-t">
        {isClient && !currentUser ? (
          <Button onClick={handleWalletClick} className="w-full">
            Connect Wallet
          </Button>
        ) : (
          currentUser && (
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
                  <div className="text-sm text-muted-foreground">
                    {shortenAddress(currentUser.address)}
                  </div>
                </div>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleWalletClick}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          )
        )}
      </div>

      {followedHashtags.length > 0 && (
        <div className="px-4 py-2">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">
            Following
          </h3>
          <ul className="space-y-1">
            {followedHashtags.map(tag => (
              <li key={tag}>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href={`/hashtag/${tag}`} className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span>{tag}</span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 