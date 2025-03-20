import { useRef, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, X, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addContent, addJson } from '@/lib/ipfs';
import { UploadButton } from '@/lib/components/UploadButton';
import { MediaPreview } from '@/lib/components/MediaPreview';

export interface CreatePostProps {
  onPostCreated?: (post: any) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mediaCids, setMediaCids] = useState<string[]>([]);
  const [category, setCategory] = useState('genel');
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle form submit
  const handleSubmit = async () => {
    if (!content && mediaCids.length === 0) return;
    
    try {
      setIsPosting(true);
      
      // Get connected wallet or return error
      const walletAddress = localStorage.getItem('walletAddress');
      if (!walletAddress) {
        throw new Error('Cüzdan bağlı değil');
      }
      
      // Create post metadata
      const postData = {
        content,
        category,
        author: walletAddress,
        media: mediaCids,
        timestamp: Date.now(),
        type: 'post',
      };
      
      // Save post to IPFS
      const contentCid = await addContent(content);
      const metadataCid = await addJson(postData);
      
      if (!metadataCid) {
        throw new Error('Post IPFS\'e kaydedilemedi');
      }
      
      // Create a complete post object
      const post = {
        ...postData,
        id: metadataCid,
        contentCid,
      };
      
      // Reset form
      setContent('');
      setMediaCids([]);
      setCategory('genel');
      
      // Call the callback
      if (onPostCreated) {
        onPostCreated(post);
      }
    } catch (error) {
      console.error('Post oluşturma hatası:', error);
      alert('Post oluşturulurken bir hata oluştu');
    } finally {
      setIsPosting(false);
    }
  };
  
  // Handle file uploads
  const handleFileUpload = (uploadedCids: string[]) => {
    setMediaCids(prev => [...prev, ...uploadedCids]);
  };
  
  // Remove media
  const removeMedia = (index: number) => {
    setMediaCids(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <Tabs defaultValue="post" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="post" className="flex-1">Yazı</TabsTrigger>
          <TabsTrigger value="media" className="flex-1">Medya</TabsTrigger>
          <TabsTrigger value="category" className="flex-1">Kategori</TabsTrigger>
        </TabsList>
        
        <TabsContent value="post">
          <CardContent className="pt-4">
            <Textarea
              ref={textareaRef}
              placeholder="Ne düşünüyorsun?"
              className="min-h-32 resize-none border-none focus-visible:ring-0 p-0 shadow-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
            />
          </CardContent>
        </TabsContent>
        
        <TabsContent value="media">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4">
              <UploadButton 
                onUploadComplete={handleFileUpload}
                multiple={true}
                label="Medya Ekle"
              />
              
              {mediaCids.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mediaCids.map((cid, index) => (
                    <div key={cid} className="relative group">
                      <MediaPreview 
                        cid={cid} 
                        width={150} 
                        height={150} 
                      />
                      <button
                        className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="category">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['genel', 'teknoloji', 'sanat', 'müzik', 'spor', 'seyahat'].map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  onClick={() => setCategory(cat)}
                  className="capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex gap-2">
          {mediaCids.length > 0 && (
            <Button variant="ghost" size="sm" className="text-primary">
              <ImageIcon className="h-4 w-4 mr-1" />
              {mediaCids.length}
            </Button>
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isPosting || (!content && mediaCids.length === 0)}
        >
          {isPosting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Paylaşılıyor
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Paylaş
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 