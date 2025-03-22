"use client";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid"; 
// We don't import IPFS functions directly
// import { createHeliaNode, addJsonContent } from "@/lib/ipfs";
import { connectWallet } from "@/lib/web3auth";
import { IPFSPost, Post, MediaItem, PostVisibility } from "@/models/Post";
import { toast } from "sonner";
import { usePostStore } from "@/store/postStore";
import { useUserStore } from "@/store/userStore";
import { useDropzone } from 'react-dropzone';
// Add type definition for react-file-icon
// @ts-ignore
import {FileIcon, defaultStyles} from 'react-file-icon';
import { Loader2, Share2, Copy, ExternalLink, Globe, Users, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractHashtags } from '@/lib/hashtags';
import { useHashtagStore } from '@/store/hashtagStore';
import { MediaPreview } from "@/lib/components/MediaPreview";

// Type for file type and preview information
interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
  uploaded: boolean;
  cid?: string;
}

// IPFS process status
type ProcessStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function CreatePost() {
  const { addPost } = usePostStore();
  const { currentUser } = useUserStore();
  const { updateTrendingHashtags, addRecentHashtag } = useHashtagStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [allowedAddresses, setAllowedAddresses] = useState<string>('');
  
  // IPFS process status information
  const [showDialog, setShowDialog] = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [processMessage, setProcessMessage] = useState("");
  const [postCID, setPostCID] = useState("");
  const [ipfsShareUrl, setIpfsShareUrl] = useState("");
  const [ipfsError, setIpfsError] = useState("");

  // File upload with react-dropzone configuration
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Start upload state
    setIsUploading(true);
    
    try {
      // Dynamically import IPFS modules
      const ipfsModule = await import('@/lib/ipfs');
      const { addBytes } = ipfsModule;
      
      const newMediaFiles = await Promise.all(acceptedFiles.map(async (file) => {
        // Determine file type
        let fileType: 'image' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        }
        
        // Create preview
        let preview = '';
        if (fileType === 'image' || fileType === 'video') {
          preview = URL.createObjectURL(file);
        }
        
        // Create new file object
        const mediaFile: MediaFile = {
          file,
          preview,
          type: fileType,
          uploaded: false
        };
        
        try {
          // Convert file to bytes
          const arrayBuffer = await file.arrayBuffer();
          const fileBytes = new Uint8Array(arrayBuffer);
          
          // Upload to IPFS with progress tracking
          const mediaCIDString = await addBytes(fileBytes, {
            filename: file.name,
            mimeType: file.type,
            onProgress: (progress) => {
              console.log(`Upload progress for ${file.name}: ${progress * 100}%`);
            },
            pin: true
          });
          
          if (mediaCIDString) {
            console.log('Media file IPFS CID:', mediaCIDString);
            
            // Add CID to file info
            mediaFile.cid = mediaCIDString;
            mediaFile.uploaded = true;
            
            return mediaFile;
          } else {
            throw new Error('Failed to get CID from upload');
          }
        } catch (error) {
          console.error('Error uploading media file:', error);
          toast.error(`Error uploading ${file.name}`);
          return mediaFile; // Return without CID
        }
      }));
      
      // Add new files to existing files
      setMediaFiles(prev => [...prev, ...newMediaFiles]);
    } catch (error) {
      console.error("Error in file upload process:", error);
      toast.error("File upload error. Please try again.");
    } finally {
      // Always reset uploading state
      setIsUploading(false);
    }
  }, []);
  
  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
    maxFiles: 5
  });

  // File removal function
  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      // If there's a preview URL, release it
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [mediaFiles]);

  // Format allowed addresses as array
  const formatAllowedAddresses = (): string[] | undefined => {
    if (visibility !== 'private' || !allowedAddresses.trim()) return undefined;
    
    return allowedAddresses
      .split(',')
      .map(address => address.trim())
      .filter(address => address.length > 0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ipfsShareUrl);
    toast.success("Link copied to clipboard");
  };

  const closeDialog = () => {
    if (processStatus === 'success' || processStatus === 'error') {
      setShowDialog(false);
      setProcessStatus('idle');
    }
  };
  
  // Post visibility icon based on selection
  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public':
        return <Globe className="w-4 h-4 mr-2" />;
      case 'followers':
        return <Users className="w-4 h-4 mr-2" />;
      case 'private':
        return <Lock className="w-4 h-4 mr-2" />;
      default:
        return <Globe className="w-4 h-4 mr-2" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    try {
      setIsLoading(true);
      // Show process dialog
      setShowDialog(true);
      setProcessStatus('uploading');
      setProcessMessage("Connecting to wallet...");

      // Connect to wallet
      const address = await connectWallet();
      setProcessMessage("Checking media files...");

      // Check if all media files are properly uploaded
      const allUploaded = mediaFiles.every(file => file.uploaded && file.cid);
      if (mediaFiles.length > 0 && !allUploaded) {
        setProcessMessage("Waiting for media files to finish uploading...");
        // Give a short timeout for files to finish uploading
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check again
        const stillNotUploaded = mediaFiles.some(file => !file.uploaded || !file.cid);
        if (stillNotUploaded) {
          setProcessStatus('error');
          setIpfsError("Some media files failed to upload. Please try again.");
          return;
        }
      }

      // Extract hashtags from content
      const hashtags = extractHashtags(content);
      
      // Create post data
      const postData: IPFSPost = {
        content,
        authorAddress: address,
        timestamp: Date.now(),
        visibility: visibility,
        allowedAddresses: formatAllowedAddresses(),
        tags: hashtags.length > 0 ? hashtags : undefined,
      };

      // Load IPFS node dynamically and add content
      let contentCIDString = "";

      try {
        // Dynamically import IPFS modules
        const ipfsModule = await import('@/lib/ipfs');
        const { addJsonContent } = ipfsModule;
        
        setProcessMessage("Preparing to upload post to IPFS...");
        
        // Add media information (for multiple media support)
        if (mediaFiles.length > 0) {
          setProcessMessage("Finalizing media files...");
          // Store CIDs and types of uploaded media in an array
          const mediaItems = mediaFiles
            .filter(mediaFile => mediaFile.uploaded && mediaFile.cid)
            .map(mediaFile => ({
              contentCID: mediaFile.cid,
              type: mediaFile.type
            }));
          
          // Add media info to post data
          postData.mediaItems = mediaItems;
        }
        
        // Add JSON data to IPFS
        setProcessMessage("Uploading post content to IPFS...");
        const cid = await addJsonContent(postData);
        contentCIDString = cid?.toString() || "";
        
        // Store IPFS CID and create share URL
        setPostCID(contentCIDString);
        const shareUrl = `https://ipfs.io/ipfs/${contentCIDString}`;
        setIpfsShareUrl(shareUrl);
        
        console.log("CID of content added to IPFS:", contentCIDString);
        
        // Add post to the posts index API if this is a public post
        if (contentCIDString && visibility === 'public') {
          try {
            setProcessMessage("Adding post to global index...");
            
            const indexResponse = await fetch('/api/posts/index', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ cid: contentCIDString })
            });
            
            if (indexResponse.ok) {
              console.log("Post added to global index successfully");
            } else {
              console.warn("Failed to add post to global index", await indexResponse.text());
            }
          } catch (error) {
            console.error("Error adding post to index:", error);
            // Continue even if this fails
          }
        }
        
        // Add post to our local API
        try {
          setProcessMessage("Saving post to your feed...");
          
          // Convert to the format our API expects
          const apiPost = {
            id: contentCIDString || uuidv4(),
            content: postData.content,
            authorAddress: postData.authorAddress,
            authorName: currentUser?.displayName || '',
            timestamp: postData.timestamp,
            contentCID: contentCIDString,
            mediaItems: postData.mediaItems,
            visibility: postData.visibility,
            tags: postData.tags
          };
          
          const apiResponse = await fetch('/api/posts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiPost)
          });
          
          if (apiResponse.ok) {
            console.log("Post added to API successfully");
          } else {
            console.warn("Failed to add post to API", await apiResponse.text());
          }
        } catch (error) {
          console.error("Error adding post to API:", error);
          // Continue even if this fails
        }
        
        setProcessMessage("Post successfully uploaded to IPFS!");
        setProcessStatus('success');
        
      } catch (error) {
        console.error("Error uploading to IPFS:", error);
        setIpfsError("An error occurred while uploading to IPFS. The post will be saved locally only.");
        setProcessStatus('error');
        // Continue creating post even if IPFS error
      }

      // Add post to Zustand store (use mediaItems instead of old mediaContentCID)
      addPost({
        content: postData.content,
        authorAddress: postData.authorAddress,
        timestamp: postData.timestamp,
        contentCID: contentCIDString || undefined,
        mediaItems: postData.mediaItems,
        likes: 0,
        comments: [],
        reposts: 0,
        visibility: postData.visibility,
        allowedAddresses: postData.allowedAddresses,
        tags: postData.tags,
      });

      // Update hashtag store with any hashtags used in the post
      if (hashtags.length > 0) {
        // Add each hashtag to recent hashtags
        hashtags.forEach(tag => addRecentHashtag(tag));
        
        // Update trending hashtags
        updateTrendingHashtags();
      }

      // Toast notification for post creation
      toast.success("Post successfully created!");

      // Clear form
      setContent("");
      setVisibility('public');
      setAllowedAddresses('');
      
      // Clear preview URLs and reset array
      mediaFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setMediaFiles([]);
    } catch (error) {
      console.error("Post creation error:", error);
      toast.error("Post creation failed");
      setProcessStatus('error');
      setIpfsError("Unexpected error occurred while creating post.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render preview of uploaded files
  const renderPreview = () => {
    if (mediaFiles.length === 0) return null;
    
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {mediaFiles.map((file, index) => (
          <div key={index} className="relative border rounded-md overflow-hidden bg-muted/30">
            <div className="absolute top-2 right-2 z-10">
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => removeFile(index)}
              >
                &times;
              </Button>
            </div>
            
            {file.type === 'image' || file.type === 'video' ? (
              <div className="w-full h-32 relative">
                <MediaPreview 
                  dataUrl={file.preview}
                  cid={file.cid}
                  alt={file.file.name}
                  width={300}
                  height={128}
                  mimeType={file.file.type}
                  className="h-32"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center p-4 h-32 justify-center">
                <div className="w-10 h-10">
                  <FileIcon 
                    extension={file.file.name.split('.').pop() || ''} 
                    {...defaultStyles[file.file.name.split('.').pop() as keyof typeof defaultStyles]} 
                  />
                </div>
                <p className="mt-2 text-sm truncate max-w-full">{file.file.name}</p>
              </div>
            )}
            
            {!file.uploaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-xs mt-2">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px]"
        />
        
        {/* File uploader section */}
        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-md p-4 cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}
          `}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Uploading files...</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p>{isDragActive ? "Drop files here" : "Drag and drop files here, or click to select"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports images, videos, and documents (up to 5 files)
              </p>
            </div>
          )}
        </div>
        
        {/* Preview section */}
        {renderPreview()}
        
        {/* Post visibility selector */}
        <div className="flex flex-col space-y-2">
          <Label>Visibility</Label>
          <Select 
            value={visibility} 
            onValueChange={(value: PostVisibility) => {
              setVisibility(value);
              // Clear allowed addresses if not private
              if (value !== 'private') {
                setAllowedAddresses('');
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  <span>Public</span>
                </div>
              </SelectItem>
              <SelectItem value="followers">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Followers only</span>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Private (Specific addresses)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Allowed addresses input for private posts */}
          {visibility === 'private' && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="allowedAddresses">Allowed wallet addresses (comma separated)</Label>
              <Input
                id="allowedAddresses"
                value={allowedAddresses}
                onChange={(e) => setAllowedAddresses(e.target.value)}
                placeholder="0x123..., 0xabc..."
              />
            </div>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={(!content.trim() && mediaFiles.length === 0) || isLoading || isUploading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating post...
            </>
          ) : (
            <>Post</>
          )}
        </Button>
      </form>
      
      {/* IPFS process dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {processStatus === 'uploading' && "Creating Post"}
              {processStatus === 'success' && "Post Created Successfully"}
              {processStatus === 'error' && "Post Creation Issue"}
            </DialogTitle>
            <DialogDescription>
              {processStatus === 'uploading' && "Please wait while your post is being processed..."}
              {processStatus === 'success' && "Your post has been successfully created and shared on IPFS."}
              {processStatus === 'error' && ipfsError}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {processStatus === 'uploading' && (
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>{processMessage}</p>
              </div>
            )}
            
            {processStatus === 'success' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  <p className="font-medium">Share your post on IPFS</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    value={ipfsShareUrl} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button onClick={copyToClipboard} size="icon" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="pt-2">
                  <a 
                    href={ipfsShareUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in browser</span>
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={closeDialog}>
              {processStatus === 'success' || processStatus === 'error' ? 'Close' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 