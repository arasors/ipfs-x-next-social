"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { connectWallet } from "@/lib/web3auth";

export default function Navbar() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = async () => {
    try {
      const { address } = await connectWallet();
      setAddress(address);
      setConnected(true);
    } catch (error) {
      console.error("Bağlantı hatası:", error);
    }
  };

  // Cüzdan adresini kısaltma
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="border-b py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-xl font-bold">
            IPFS-X
          </Link>
          <div className="hidden md:flex space-x-4 sr-only">
            <Link href="/" className="hover:text-blue-500">
              Ana Sayfa
            </Link>
            <Link href="/explore" className="hover:text-blue-500">
              Keşfet
            </Link>
            {connected && (
              <Link href="/profile" className="hover:text-blue-500">
                Profil
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isClient && !connected ? (
            <Button onClick={handleConnect}>Connect Wallet</Button>
          ) : (
            address && (
              <div className="flex items-center space-x-2">
                <span className="bg-green-500 h-2 w-2 rounded-full"></span>
                <span>{shortenAddress(address)}</span>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
} 