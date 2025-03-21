"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusSquare, User, LogOut, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";
import { useUserStore } from "@/store/userStore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, reset } = useUserStore();
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  
  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Create', href: '/create', icon: PlusSquare },
    // Notifications now handled separately
  ];

  // Check if current path matches the nav item
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  const handleLogout = () => {
    reset();
    setShowProfileSheet(false);
    router.push('/');
  };

  // Function to shorten wallet address for display
  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="md:hidden fixed bottom-0 w-full border-t bg-background z-40">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full py-1 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-1" />
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-0 right-0 mx-auto w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span>{item.name}</span>
            </Link>
          );
        })}
        
        {/* Custom notification item with the notification bell */}
        <div className={cn(
          "flex flex-col items-center justify-center w-full py-1 text-xs transition-colors",
          isActive('/notifications') ? "text-primary" : "text-muted-foreground"
        )}>
          <div className="relative">
            <NotificationBell 
              showLabel={false} 
              showIcon={true} 
              iconSize="md" 
              side="bottom"
            />
            {isActive('/notifications') && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -bottom-1 left-0 right-0 mx-auto w-1 h-1 bg-primary rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </div>
          <span className="mt-1">Notifications</span>
        </div>

        {/* Profile with Sheet */}
        <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
          <SheetTrigger asChild>
            <div 
              className={cn(
                "flex flex-col items-center justify-center w-full py-1 text-xs transition-colors cursor-pointer",
                isActive('/profile') ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <User className="h-5 w-5 mb-1" />
                {isActive('/profile') && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-0 right-0 mx-auto w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span>Profile</span>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <div className="py-4 flex flex-col space-y-4">
              {currentUser ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{currentUser.displayName || 'User'}</div>
                        <div className="text-sm text-muted-foreground">{shortenAddress(currentUser.address)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      setShowProfileSheet(false);
                      router.push('/profile');
                    }}
                  >
                    View Profile
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setShowProfileSheet(false);
                    router.push('/');
                  }}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
} 