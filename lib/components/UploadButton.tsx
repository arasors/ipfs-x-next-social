import { ChangeEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadIcon } from 'lucide-react';
import { addBytes } from '@/lib/ipfs';
import { Progress } from '@/components/ui/progress';

interface UploadButtonProps {
  onUploadComplete: (cids: string[]) => void;
  multiple?: boolean;
  accept?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function UploadButton({ 
  onUploadComplete, 
  multiple = false, 
  accept = "image/*,video/*,audio/*",
  variant = "secondary",
  size = "default",
  label = "Dosya Yükle"
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      const totalSize = fileArray.reduce((acc, file) => acc + file.size, 0);
      let uploadedSize = 0;

      const cids: string[] = [];

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const fileBuffer = await file.arrayBuffer();
        const fileBytes = new Uint8Array(fileBuffer);
        
        // Upload file with progress tracking
        const cid = await addBytes(fileBytes, {
          filename: file.name,
          mimeType: file.type,
          onProgress: (fileProgress: number) => {
            // Calculate global progress percentage
            const fileSizeContribution = file.size / totalSize;
            const fileContribution = fileProgress * fileSizeContribution;
            
            // For completed files
            const previousFilesContribution = uploadedSize / totalSize;
            
            setUploadProgress(Math.round((previousFilesContribution + fileContribution) * 100));
          }
        });
        
        if (cid) {
          cids.push(cid);
          uploadedSize += file.size;
          setUploadProgress(Math.round((uploadedSize / totalSize) * 100));
        } else {
          throw new Error(`"${file.name}" yüklenirken hata oluştu`);
        }
      }

      // Set progress to 100% when all files are uploaded
      setUploadProgress(100);
      onUploadComplete(cids);
    } catch (err) {
      console.error("Dosya yükleme hatası:", err);
      setError(err instanceof Error ? err.message : "Dosya yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
      // Reset the input value to allow uploading the same file again
      const input = document.getElementById("file-upload") as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Button
          variant={variant}
          size={size}
          disabled={isUploading}
          onClick={() => document.getElementById("file-upload")?.click()}
          className="relative"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {label}
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="hidden"
            multiple={multiple}
            accept={accept}
          />
        </Button>
        {isUploading && (
          <span className="text-sm text-muted-foreground animate-pulse">
            Yükleniyor... {uploadProgress}%
          </span>
        )}
      </div>
      
      {isUploading && (
        <div className="mt-2">
          <Progress value={uploadProgress} className="h-2 w-full" />
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
} 