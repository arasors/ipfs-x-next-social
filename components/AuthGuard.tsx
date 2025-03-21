"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { connectWallet } from "@/lib/web3auth";
import { Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function AuthGuard({ 
  children, 
  redirectTo = "/", 
  requireAuth = true 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, setCurrentUser, reset } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for wallet address first
    const storedAddress = localStorage.getItem('walletAddress');
    
    if (storedAddress) {
      // Set current user based on stored address
      setCurrentUser(storedAddress);
      setIsLoading(false);
    } else {
      // If no wallet address found but we're requiring auth and on a protected route, 
      // make sure we clear any stale user data
      if (requireAuth && isProtectedRoute(pathname as string)) {
        reset(); // Clear any user state
        
        // Check if we need to redirect the user
        if (redirectTo && redirectTo !== "/") {
          router.push("/");
        }
      }
      setIsLoading(false);
    }
    
    // Add event listener for storage changes to handle logout from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletAddress') {
        if (!e.newValue && currentUser) {
          // walletAddress was removed, user has logged out
          reset();
          if (requireAuth && isProtectedRoute(pathname as string)) {
            router.push("/");
          }
        } else if (e.newValue && e.newValue !== currentUser?.address) {
          // User changed to a different wallet
          setCurrentUser(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname, currentUser, setCurrentUser, reset, requireAuth, router, redirectTo]);

  // Helper function to determine if the current route is protected
  const isProtectedRoute = (path: string): boolean => {
    const protectedRoutes = ['/profile', '/create', '/messages', '/settings'];
    return protectedRoutes.some(route => path.startsWith(route));
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const address = await connectWallet();
      if (address) {
        setCurrentUser(address);
        localStorage.setItem('walletAddress', address);
        // Redirect to the originally requested page after successful login
        if (redirectTo && redirectTo !== "/") {
          router.push(redirectTo);
        }
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError("Wallet connection failed. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle logout function to expose to child components if needed
  const handleLogout = () => {
    reset();
    localStorage.removeItem('walletAddress');
    router.push("/");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // If auth is required and user is not authenticated, show login screen
  if (requireAuth && !currentUser && isProtectedRoute(pathname as string)) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              You need to connect your wallet to view this content.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex justify-center">
              <Button 
                size="lg"
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" /> 
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="text-center text-sm text-muted-foreground">
            <p className="w-full">
              You need an Ethereum wallet to use IPFS-X.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If auth is NOT required but user is authenticated, or if auth is required and user is authenticated
  return <>{children}</>;
} 