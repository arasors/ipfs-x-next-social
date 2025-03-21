"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Check, Share, Image, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePostStore } from "@/store/postStore";
import { pinContent } from "@/lib/ipfs";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cid?: string;
  postId?: string;
  title?: string;
  shareSuccess?: () => void;
}

export function ShareDialog({ 
  open, 
  onOpenChange, 
  cid, 
  postId, 
  title = "Share Content",
  shareSuccess
}: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [ipfsUrl, setIpfsUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isGatewayChecking, setIsGatewayChecking] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);
  const [isPinningLimited, setIsPinningLimited] = useState(false);
  const { getPost } = usePostStore();
  const post = postId ? getPost(postId) : undefined;

  const APP_URL = typeof window !== 'undefined' ? `${window.location.origin}` : '';
  
  // Set up the share URLs
  useEffect(() => {
    if (!cid && !postId) return;
    
    const setupShare = async () => {
      setIsGatewayChecking(true);
      setIsPinningLimited(false);

      // If we have a CID, create an IPFS URL
      if (cid) {
        setIpfsUrl(`https://ipfs.io/ipfs/${cid}`);
        // For direct content sharing
        setShareUrl(`${APP_URL}/ipfs/${cid}`);
        
        // Check if there was a failed pinning attempt due to Pinata plan
        const pinnedData = localStorage.getItem(`ipfs-pinned-${cid}`);
        if (pinnedData) {
          try {
            const data = JSON.parse(pinnedData);
            if (data.error === 'PAID_FEATURE_ONLY') {
              setIsPinningLimited(true);
            }
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
      }
      
      // If we have a postId, create a post URL
      if (postId) {
        setShareUrl(`${APP_URL}/post/${postId}`);
        
        // Check if post has media
        if (post) {
          const hasMediaContent = Boolean(post.mediaContentCID) || 
            (Array.isArray(post.mediaItems) && post.mediaItems.length > 0);
          setHasMedia(hasMediaContent);
          
          // Ensure post content is pinned if it has a CID
          if (post.contentCID) {
            try {
              const pinResult = await pinContent(post.contentCID.toString());
              // Check if there's a pinning limitation after pinning attempt
              const pinnedData = localStorage.getItem(`ipfs-pinned-${post.contentCID.toString()}`);
              if (pinnedData) {
                try {
                  const data = JSON.parse(pinnedData);
                  if (data.error === 'PAID_FEATURE_ONLY') {
                    setIsPinningLimited(true);
                  }
                } catch (e) {
                  // Invalid JSON, ignore
                }
              }
            } catch (error) {
              console.error("Failed to pin post content:", error);
            }
          }
        }
      }
      
      // Finish gateway check
      setTimeout(() => {
        setIsGatewayChecking(false);
      }, 1000);
    };
    
    setupShare();
  }, [cid, postId, APP_URL, post]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success("Link copied to clipboard");
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);

      // Notify parent component that sharing was successful
      if (shareSuccess) {
        shareSuccess();
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      // Pin any media content if available
      if (post && hasMedia) {
        // Pin main media content if exists
        if (post.mediaContentCID) {
          await pinContent(post.mediaContentCID.toString());
        }
        
        // Pin all media items if they exist
        if (post.mediaItems && post.mediaItems.length > 0) {
          const pinPromises = post.mediaItems
            .filter(item => item.contentCID)
            .map(item => pinContent(item.contentCID as string));
          
          await Promise.allSettled(pinPromises);
        }
      }
      
      if (navigator.share) {
        await navigator.share({
          title: 'IPFS-X Content',
          text: 'Check out this content on IPFS-X:',
          url: shareUrl,
        });
      } else {
        await copyToClipboard(shareUrl);
      }
      
      // Notify parent component that sharing was successful
      if (shareSuccess) {
        shareSuccess();
      }
    } catch (error) {
      console.error("Error sharing content:", error);
      toast.error("Error sharing content");
    } finally {
      setIsSharing(false);
    }
  };

  const gateways = [
    { name: "IPFS.io", url: `https://ipfs.io/ipfs/${cid}` },
    { name: "Cloudflare", url: `https://cloudflare-ipfs.com/ipfs/${cid}` },
    { name: "Dweb.link", url: `https://dweb.link/ipfs/${cid}` },
    { name: "Gateway.pinata.cloud", url: `https://gateway.pinata.cloud/ipfs/${cid}` }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Share this content with others via a link or IPFS gateway.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          {/* Post Share URL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Share link:</label>
            <div className="flex items-center gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(shareUrl)}
                className="shrink-0"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Pinning Plan Limitation */}
          {isPinningLimited && (
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <Info className="h-4 w-4 mr-2 text-amber-800" />
              <AlertDescription className="text-sm">
                Pinning content requires a paid Pinata plan. Your content will still be available but may not persist long-term. Consider setting up a paid pinning service for better reliability.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Media content info */}
          {hasMedia && (
            <Alert>
              <Image className="h-4 w-4 mr-2" />
              <AlertDescription>
                This post contains media that will be shared via IPFS{isPinningLimited ? " but won't be pinned due to plan limitations" : ""}.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Show IPFS specific information if we have a CID */}
          {cid && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">IPFS Content ID (CID):</label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={cid} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(cid)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">IPFS Gateways:</label>
                <div className="grid grid-cols-2 gap-2">
                  {gateways.map(gateway => (
                    <Button
                      key={gateway.name}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => window.open(gateway.url, '_blank')}
                      disabled={isGatewayChecking}
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      {gateway.name}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Note about Web3.Storage being deprecated */}
          <Alert variant="default">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {isPinningLimited 
                ? "Content can be shared but pinning requires a paid Pinata plan. Web3.Storage pinning API is no longer available."
                : "Content is being pinned using Pinata instead of Web3.Storage due to API changes."}
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            className="sm:w-auto w-full"
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share className="mr-2 h-4 w-4" />
            {isSharing ? "Sharing..." : "Share"}
          </Button>
          
          {ipfsUrl && (
            <Button
              variant="outline"
              className="sm:w-auto w-full"
              onClick={() => window.open(ipfsUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on IPFS
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 