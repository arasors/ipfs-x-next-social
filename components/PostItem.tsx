"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Post, MediaItem } from "@/models/Post";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
// @ts-ignore
import { FileIcon, defaultStyles } from 'react-file-icon';

interface PostItemProps {
  post: Post;
  onLike?: (postId: string) => void;
}

export default function PostItem({ post, onLike }: PostItemProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<{ [key: string]: string }>({});

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

  // Medya öğesini görüntüle
  const renderMediaItem = (type: string, url: string, index: number) => {
    if (type === 'image') {
      return (
        <img 
          key={`media-${index}`}
          src={url} 
          alt={`Post medyası ${index + 1}`} 
          className="w-full rounded-md max-h-96 object-cover mb-2"
          onError={(e) => {
            console.error('Resim yüklenemedi:', url);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    } else if (type === 'video') {
      return (
        <video 
          key={`media-${index}`}
          src={url}
          controls
          className="w-full rounded-md max-h-96 mb-2"
          onError={(e) => {
            console.error('Video yüklenemedi:', url);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    } else if (type === 'document') {
      const extension = url.split('.').pop() || '';
      return (
        <div key={`media-${index}`} className="flex items-center p-2 border rounded mb-2">
          <div className="w-10 h-10 mr-2">
          <FileIcon extension={extension} {...(defaultStyles?.[extension as keyof typeof defaultStyles]!)} />
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Dokümanı Görüntüle
          </a>
        </div>
      );
    }
    return null;
  };

  return (
    <article className="bg-card p-4 rounded-lg shadow">
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
            {post.authorName ? post.authorName[0].toUpperCase() : "A"}
          </div>
          <div>
            <h3 className="font-medium">
              {post.authorName || shortenAddress(post.authorAddress)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {formatDate(post.timestamp)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
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
        <div className="mt-4 space-y-2">
          {post.mediaItems.map((item, index) => (
            item.contentCID && mediaUrls[`item-${index}`] ? 
              renderMediaItem(item.type, mediaUrls[`item-${index}`], index) : null
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={isLiked ? "text-red-500" : ""}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill={isLiked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{post.likes}</span>
        </Button>

        <Button variant="ghost" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{post.comments ? post.comments.length : 0}</span>
        </Button>

        <Button variant="ghost" size="sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span>{post.reposts || 0}</span>
        </Button>
      </div>
    </article>
  );
} 