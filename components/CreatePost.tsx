"use client";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
// IPFS fonksiyonlarını doğrudan içe aktarmıyoruz
// import { createHeliaNode, addJsonContent } from "@/lib/ipfs";
import { connectWallet } from "@/lib/web3auth";
import { IPFSPost, Post, MediaItem } from "@/models/Post";
import { toast } from "sonner";
import { usePostStore } from "@/store/postStore";
import { useDropzone } from 'react-dropzone';
// react-file-icon için tip tanımı ekliyoruz
// @ts-ignore
import {FileIcon, defaultStyles} from 'react-file-icon';
import { Loader2, Share2, Copy, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Dosya tipi ve önizleme bilgilerini tutan tip
interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document';
  uploaded: boolean;
  cid?: string;
}

// IPFS işlemi durumu
type ProcessStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function CreatePost() {
  const { addPost } = usePostStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // IPFS işlemleri için durum bilgileri
  const [showDialog, setShowDialog] = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [processMessage, setProcessMessage] = useState("");
  const [postCID, setPostCID] = useState("");
  const [ipfsShareUrl, setIpfsShareUrl] = useState("");
  const [ipfsError, setIpfsError] = useState("");

  // Dosya yükleme için react-dropzone konfigürasyonu
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Yükleme durumunu başlat
    setIsUploading(true);
    
    const newMediaFiles = await Promise.all(acceptedFiles.map(async (file) => {
      // Dosya tipini belirleme
      let fileType: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      }
      
      // Önizleme oluşturma
      let preview = '';
      if (fileType === 'image' || fileType === 'video') {
        preview = URL.createObjectURL(file);
      }
      
      // Yeni dosya nesnesi oluştur
      const mediaFile: MediaFile = {
        file,
        preview,
        type: fileType,
        uploaded: false
      };
      
      try {
        // IPFS modüllerini dinamik olarak import et
        const ipfsModule = await import('@/lib/ipfs');
        const { createHeliaNode } = ipfsModule;
        const { helia, fs } = await createHeliaNode();
        
        if (fs) {
          // Dosyayı binary olarak oku
          const arrayBuffer = await file.arrayBuffer();
          const fileBytes = new Uint8Array(arrayBuffer);
          
          // IPFS'e yükle
          const mediaCID = await fs.addBytes(fileBytes);
          const mediaCIDString = mediaCID.toString();
          console.log('Medya dosyası IPFS CID:', mediaCIDString);
          
          // CID'yi dosya bilgisine ekle
          mediaFile.cid = mediaCIDString;
          mediaFile.uploaded = true;
        }
      } catch (error) {
        console.error('Medya dosyası yüklenirken hata:', error);
        toast.error(`${file.name} yüklenirken hata oluştu`);
      }
      
      return mediaFile;
    }));
    
    // Yeni dosyaları mevcut dosyalara ekle
    setMediaFiles(prev => [...prev, ...newMediaFiles]);
    setIsUploading(false);
  }, []);
  
  // Dropzone konfigürasyonu
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

  // Dosya kaldırma işlevi
  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      // Eğer önizleme URL'i varsa, kaynağı serbest bırak
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Component unmount olduğunda önizleme URL'lerini temizle
  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [mediaFiles]);

  // IPFS bağlantısını panoya kopyala
  const copyToClipboard = () => {
    navigator.clipboard.writeText(ipfsShareUrl);
    toast.success("IPFS link copied to clipboard");
  };

  // İşlem sonrası dialog'u kapat ve durumu sıfırla
  const closeDialog = () => {
    setShowDialog(false);
    // Form zaten temizlenmiş olacak, dialog'u kapatınca işlem durumunu sıfırla
    setTimeout(() => {
      setProcessStatus('idle');
      setProcessMessage("");
      setPostCID("");
      setIpfsShareUrl("");
      setIpfsError("");
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    try {
      setIsLoading(true);
      // İşlem durum dialogunu göster
      setShowDialog(true);
      setProcessStatus('uploading');
      setProcessMessage("Cüzdana bağlanılıyor...");

      // Cüzdana bağlan
      const { address } = await connectWallet();
      setProcessMessage("Medya dosyaları kontrol ediliyor...");

      // Post verisini oluştur
      const postData: IPFSPost = {
        content,
        authorAddress: address,
        timestamp: Date.now(),
      };

      // IPFS düğümünü dinamik olarak yükle ve içeriği ekle
      let contentCIDString = "";

      try {
        // IPFS modüllerini dinamik olarak import et
        const ipfsModule = await import('@/lib/ipfs');
        const { createHeliaNode, addJsonContent } = ipfsModule;
        
        setProcessMessage("IPFS düğümüne bağlanılıyor...");
        const { jsonHandler } = await createHeliaNode();
        
        // Media bilgilerini ekle (birden fazla medya desteği için)
        if (mediaFiles.length > 0) {
          setProcessMessage("Medya dosyaları IPFS'e kaydediliyor...");
          // Yüklenen medyaların CID'lerini ve tiplerini bir dizide sakla
          const mediaItems = mediaFiles.map(mediaFile => ({
            contentCID: mediaFile.cid,
            type: mediaFile.type
          }));
          
          // Post verilerine medya bilgilerini ekle
          postData.mediaItems = mediaItems;
        }
        
        // JSON verisini IPFS'e ekle
        setProcessMessage("Post içeriği IPFS'e kaydediliyor...");
        const cid = await addJsonContent(jsonHandler, postData);
        contentCIDString = cid.toString();
        
        // IPFS CID'sini sakla ve paylaşım URL'ini oluştur
        setPostCID(contentCIDString);
        const shareUrl = `https://ipfs.io/ipfs/${contentCIDString}`;
        setIpfsShareUrl(shareUrl);
        
        console.log("IPFS'e eklenen içeriğin CID'si:", contentCIDString);
        setProcessMessage("Post başarıyla IPFS'e kaydedildi!");
        setProcessStatus('success');
      } catch (error) {
        console.error("IPFS'e yüklenirken hata:", error);
        setIpfsError("IPFS'e yüklenirken bir hata oluştu. Post lokal olarak kaydedilecek.");
        setProcessStatus('error');
        // IPFS hatası olsa bile post oluşturmaya devam et
      }

      // Zustand store'a postu ekle (eski mediaContentCID yerine mediaItems kullan)
      addPost({
        content: postData.content,
        authorAddress: postData.authorAddress,
        timestamp: postData.timestamp,
        contentCID: contentCIDString || undefined,
        mediaItems: postData.mediaItems,
        likes: 0,
        comments: [],
        reposts: 0,
      });

      // Post oluşturuldu bildirimi
      toast.success("Post başarıyla oluşturuldu!");

      // Formu temizle
      setContent("");
      // Önizleme URL'lerini temizle ve array'i sıfırla
      mediaFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setMediaFiles([]);
    } catch (error) {
      console.error("Post oluşturulurken hata:", error);
      toast.error("Post oluşturulurken bir hata oluştu");
      setProcessStatus('error');
      setIpfsError("Post oluşturulurken beklenmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dosya önizlemesi
  const renderPreview = (file: MediaFile, index: number) => {
    return (
      <div key={index} className="relative border rounded-md p-2 mb-2">
        <div className="flex items-center">
          {file.type === 'image' && (
            <img 
              src={file.preview} 
              alt={`Preview ${index}`}
              className="w-20 h-20 object-cover rounded-md mr-2" 
            />
          )}
          
          {file.type === 'video' && (
            <video 
              src={file.preview}
              className="w-20 h-20 object-cover rounded-md mr-2"
            />
          )}
          
          {file.type === 'document' && (
            <div className="w-16 h-16 mr-2">
              <FileIcon 
                extension={file.file.name.split('.').pop() || ''} 
                {...(defaultStyles?.[file.file.name.split('.').pop() as keyof typeof defaultStyles]!)}
              />
            </div>
          )}
          
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{file.file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.file.size / 1024).toFixed(1)} KB
              {file.uploaded ? ' (Yüklendi ✓)' : ' (Yükleniyor...)'}
            </p>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => removeFile(index)}
          >
            <span className="sr-only">Kaldır</span>
            ×
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 bg-card p-4 rounded-lg shadow">
        <div>
          <Label htmlFor="content">Mesajınız</Label>
          <Textarea
            id="content"
            placeholder="Ne düşünüyorsunuz?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Dosya önizleme alanı */}
        {mediaFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Yüklenen Medyalar</Label>
            <div className="max-h-60 overflow-y-auto">
              {mediaFiles.map((file, index) => renderPreview(file, index))}
            </div>
          </div>
        )}

        {/* Dosya sürükleme ve bırakma alanı */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <p className="text-sm text-gray-500">Dosyalar yükleniyor...</p>
          ) : isDragActive ? (
            <p className="text-sm text-blue-500">Dosyaları buraya bırakın...</p>
          ) : (
            <div>
              <p className="text-sm text-gray-500">
                Dosya eklemek için tıklayın veya sürükleyip bırakın
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Resim, video ve doküman (5 dosyaya kadar)
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading || ((!content.trim()) && mediaFiles.length === 0) || isUploading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Paylaş</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* İşlem durum dialogu */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {processStatus === 'uploading' && "Post Gönderiliyor..."}
              {processStatus === 'success' && "Post Başarıyla Gönderildi!"}
              {processStatus === 'error' && "Gönderim Sırasında Hata Oluştu"}
            </DialogTitle>
            <DialogDescription>
              {processStatus === 'uploading' && "Postunuz IPFS ağına yükleniyor, lütfen bekleyin."}
              {processStatus === 'success' && "Postunuz başarıyla IPFS ağına kaydedildi ve paylaşıldı."}
              {processStatus === 'error' && "IPFS ağına yüklenirken bir hata oluştu. Post sadece yerel olarak kaydedildi."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Yükleme durumu */}
            {processStatus === 'uploading' && (
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-center">{processMessage}</p>
              </div>
            )}
            
            {/* Başarılı durum */}
            {processStatus === 'success' && (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        {processMessage}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">IPFS İçerik Tanımlayıcısı (CID):</p>
                  <div className="flex items-center space-x-2">
                    <input className="bg-zinc-100 p-2 rounded text-xs flex-1 truncate dark:bg-gray-800" value={postCID} readOnly />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(postCID);
                          toast.success("CID copied to clipboard");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">IPFS Bağlantısı:</p>
                  <div className="flex items-center space-x-2">
                    <input className="bg-zinc-100 p-2 rounded text-xs flex-1 truncate dark:bg-gray-800" value={ipfsShareUrl} readOnly />
                    <Button size="sm" variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Hata durumu */}
            {processStatus === 'error' && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {ipfsError}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-between">
            {processStatus === 'success' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={ipfsShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    <span>IPFS'te Görüntüle</span>
                  </a>
                </Button>
                <Button size="sm" onClick={copyToClipboard} className="flex items-center gap-1">
                  <Copy className="h-4 w-4" />
                  <span>Bağlantıyı Kopyala</span>
                </Button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={closeDialog}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 