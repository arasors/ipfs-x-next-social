"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { connectWallet } from "@/lib/web3auth";
import { Home, Search, Bell, User, Menu, PenSquare, LogOut, Hash } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { SearchBox } from "@/components/SearchBox";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isClient, setIsClient] = useState(false);
  const { currentUser, setCurrentUser, reset } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    // Check if wallet is already connected
    const walletAddress = localStorage.getItem("walletAddress");
    if (walletAddress && !currentUser) {
      setCurrentUser(walletAddress);
    }
  }, [currentUser, setCurrentUser]);

  const handleConnect = async () => {
    try {
      const walletAddress = await connectWallet();
      if (walletAddress) {
        localStorage.setItem("walletAddress", walletAddress);
        setCurrentUser(walletAddress);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleLogout = () => {
    reset();
    localStorage.removeItem('walletAddress');
    router.push('/');
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/explore",
      label: "Explore",
      icon: <Hash className="h-5 w-5" />,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="md:hidden">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center">
            <span className="hidden font-bold sm:inline-block">IPFS-X</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button variant="ghost" size="icon" key={item.href} asChild>
                <Link href={item.href}>
                  {item.icon}
                  <span className="sr-only">{item.label}</span>
                </Link>
              </Button>
            ))}
            <SearchBox variant="icon" />
            <NotificationBell />
          </nav>
          <div className="flex items-center">
            {isClient && !currentUser ? (
              <Button onClick={handleConnect} size="sm">Connect Wallet</Button>
            ) : (
              currentUser && (
                <div className="flex items-center gap-2">
                  <span className="bg-green-500 h-2 w-2 rounded-full"></span>
                  <span className="text-sm hidden sm:inline-block">{shortenAddress(currentUser.address)}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 