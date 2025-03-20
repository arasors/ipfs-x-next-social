import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getContent, getBinaryContentFromGateways } from '@/lib/ipfs';
import { Loader2 } from 'lucide-react';

interface MediaPreviewProps {
  cid: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export function MediaPreview({ 
  cid, 
  alt = 'Medya içeriği', 
  className = '', 
  width = 300, 
  height = 300,
  mimeType
}: MediaPreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackGateway, setFallbackGateway] = useState(false);

  // Determine media type from mimeType or try to guess from content
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'other'>(
    mimeType?.startsWith('image/') ? 'image' : 
    mimeType?.startsWith('video/') ? 'video' : 
    mimeType?.startsWith('audio/') ? 'audio' : 'other'
  );

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);
        setError(null);

        if (!cid) {
          setError('CID bulunamadı');
          setLoading(false);
          return;
        }

        // Try to get content from local node first
        const content = await getContent(cid);
        
        if (content) {
          // If we have a text content but need to display it as media
          if (mediaType === 'image' || mediaType === 'video' || mediaType === 'audio') {
            // For text content that should be media, we need to get binary and create blob URL
            const binaryContent = await getBinaryContentFromGateways(cid);
            
            if (binaryContent) {
              // Create a blob URL for media content
              const blob = new Blob([binaryContent], { type: mimeType || 'application/octet-stream' });
              const url = URL.createObjectURL(blob);
              setSrc(url);
              
              // Detect media type from content if not specified
              if (!mimeType) {
                // Simple detection based on first bytes
                if (binaryContent.length > 2) {
                  const signature = binaryContent.slice(0, 4);
                  
                  // Check for common file signatures
                  if (signature[0] === 0xFF && signature[1] === 0xD8) {
                    setMediaType('image'); // JPEG
                  } else if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
                    setMediaType('image'); // PNG
                  } else if (signature[0] === 0x47 && signature[1] === 0x49 && signature[2] === 0x46) {
                    setMediaType('image'); // GIF
                  } else if (signature[0] === 0x66 && signature[1] === 0x74 && signature[2] === 0x79 && signature[3] === 0x70) {
                    setMediaType('video'); // MP4 and other formats
                  }
                }
              }
            } else {
              throw new Error('Medya içeriği alınamadı');
            }
          } else {
            // For text content
            setSrc(`data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
          }
        } else {
          // If local node failed, try using gateway URL directly
          setFallbackGateway(true);
          setSrc(`https://ipfs.io/ipfs/${cid}`);
        }
      } catch (err) {
        console.error('IPFS içeriği yüklenirken hata:', err);
        setError('İçerik yüklenemedi');
        // Fallback to gateway
        setFallbackGateway(true);
        setSrc(`https://ipfs.io/ipfs/${cid}`);
      } finally {
        setLoading(false);
      }
    }

    loadContent();

    // Cleanup blob URLs on unmount
    return () => {
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    };
  }, [cid, mediaType, mimeType]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <p className="text-sm text-muted-foreground">
          {error} {fallbackGateway && '(Gateway kullanılıyor)'}
        </p>
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <p className="text-sm text-muted-foreground">Önizleme yok</p>
      </div>
    );
  }

  switch (mediaType) {
    case 'image':
      return (
        <div className={`relative ${className}`} style={{ width, height }}>
          <Image 
            src={src} 
            alt={alt} 
            fill 
            className="object-cover rounded-md" 
            unoptimized={src.startsWith('blob:') || fallbackGateway}
          />
          {fallbackGateway && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
              Gateway
            </div>
          )}
        </div>
      );
    
    case 'video':
      return (
        <div className={`relative ${className}`} style={{ width, height }}>
          <video 
            src={src} 
            controls 
            className="w-full h-full rounded-md" 
          />
          {fallbackGateway && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
              Gateway
            </div>
          )}
        </div>
      );
    
    case 'audio':
      return (
        <div className={`flex flex-col items-center justify-center ${className}`} style={{ width, height: 'auto' }}>
          <audio 
            src={src} 
            controls 
            className="w-full" 
          />
          {fallbackGateway && (
            <div className="mt-1 text-xs text-muted-foreground">
              Gateway üzerinden yüklendi
            </div>
          )}
        </div>
      );
    
    default:
      return (
        <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
          <p className="text-sm text-muted-foreground px-4 py-2 text-center">
            İçerik görüntülenemiyor. <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline">İndirmek için tıklayın</a>
          </p>
        </div>
      );
  }
} 