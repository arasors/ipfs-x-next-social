"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Post, MediaItem } from "@/models/Post";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
// @ts-ignore
import { FileIcon, defaultStyles } from 'react-file-icon';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Heart, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { MediaPreview } from '@/lib/components/MediaPreview';

interface PostItemProps {
  post: Post;
  onLike?: (postId: string) => void;
}

export default function PostItem({ post, onLike }: PostItemProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<{ [key: string]: string }>({});
  const [saved, setSaved] = useState(false);

  // Post verilerini kontrol et
  if (!post) {
    console.error("PostItem'a geçersiz post verisi geldi:", post);
    return null;
  }

  // IPFS URL'lerini oluştur
  useEffect(() => {
    const loadMediaUrls = async () => {
      // Eski tek medya desteği
      if (post.mediaContentCID) {
        const gateway = await getWorkingGateway(post.mediaContentCID.toString());
        if (gateway) {
          setMediaUrls(prev => ({ ...prev, legacy: gateway }));
        }
      }
      
      // Yeni çoklu medya desteği
      if (post.mediaItems && post.mediaItems.length > 0) {
        const newMediaUrls: { [key: string]: string } = {};
        
        for (let i = 0; i < post.mediaItems.length; i++) {
          const item = post.mediaItems[i];
          if (item.contentCID) {
            const gateway = await getWorkingGateway(item.contentCID);
            if (gateway) {
              newMediaUrls[`item-${i}`] = gateway;
            }
          }
        }
        
        setMediaUrls(prev => ({ ...prev, ...newMediaUrls }));
      }
    };
    
    loadMediaUrls();
  }, [post.mediaContentCID, post.mediaItems]);

  // Çalışan bir IPFS gateway'i bul
  const getWorkingGateway = async (cid: string): Promise<string | null> => {
    // IPFS Gateway URL'leri
    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://gateway.ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`
    ];
    
    // URL'nin erişilebilir olup olmadığını kontrol et
    const checkUrl = (url: string) => {
      return new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    };
    
    // Sırayla gateway'leri kontrol et
    for (const gateway of gateways) {
      const isWorking = await checkUrl(gateway);
      if (isWorking) {
        return gateway;
      }
    }
    
    return null;
  };

  const handleLike = () => {
    if (onLike) {
      onLike(post.id);
    }
    setIsLiked(true);
  };

  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: tr 
    });
  };

  // Cüzdan adresini kısaltma
  const shortenAddress = (address: string) => {
    if (!address) return "Bilinmeyen";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle save
  const handleSave = () => {
    setSaved(!saved);
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="py-4 px-4 flex-row items-center gap-3">
        <Avatar>
          <AvatarImage src={`https://avatar.vercel.sh/${post.authorName || post.authorAddress}`} />
          <AvatarFallback>{post.authorName ? post.authorName[0].toUpperCase() : "A"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <Link href={`/profile/${post.authorAddress}`} className="font-medium text-sm hover:underline">
            {shortenAddress(post.authorAddress)}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDate(post.timestamp)}</span>
            {post.category && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {post.category}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto rounded-full" asChild>
          <Link href={`/post/${post.id}`}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Daha Fazla</span>
          </Link>
        </Button>
      </CardHeader>
      
      <CardContent className="px-4 py-0">
        <div className="pb-4">
          <p className="whitespace-pre-wrap text-sm">{post.content}</p>
        </div>
        
        {/* Eski medya görüntüleme sistemi */}
        {mediaUrls.legacy && post.mediaType && (
          <div className="mt-4">
            {post.mediaType === 'image' && (
              <img 
                src={mediaUrls.legacy} 
                alt="Post içeriği" 
                className="w-full rounded-md max-h-96 object-cover"
                onError={(e) => {
                  console.error('Resim yüklenemedi:', mediaUrls.legacy);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {post.mediaType === 'video' && (
              <video 
                src={mediaUrls.legacy}
                controls
                className="w-full rounded-md max-h-96"
                onError={(e) => {
                  console.error('Video yüklenemedi:', mediaUrls.legacy);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {/* Yeni çoklu medya görüntüleme sistemi */}
        {post.mediaItems && post.mediaItems.length > 0 && (
          <div className={`grid ${post.mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 pb-4`}>
            {post.mediaItems.map((item, index) => (
              item.contentCID && mediaUrls[`item-${index}`] ? 
                <div key={item.contentCID} className="overflow-hidden rounded-md">
                  <MediaPreview 
                    cid={item.contentCID} 
                    width={post.mediaItems.length === 1 ? 500 : 250} 
                    height={250}
                    className="w-full"
                  />
                </div>
              : null
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t flex justify-between">
        <Button variant="ghost" size="sm" onClick={handleLike}>
          <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
          {post.likes || 0}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/post/${post.id}`}>
            <MessageSquare className="h-4 w-4 mr-1" />
            {post.comments || 0}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}\n\nIPFS-X üzerinde paylaşıldı`
            )}`} 
            target="_blank"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Paylaş
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSave}>
          <Bookmark className={`h-4 w-4 mr-1 ${saved ? 'fill-current' : ''}`} />
          Kaydet
        </Button>
      </CardFooter>
    </Card>
  );
} 