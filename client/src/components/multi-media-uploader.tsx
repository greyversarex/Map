import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image, Video, Star, GripVertical, Crop } from "lucide-react";
import { ImageCropper } from "./image-cropper";

export interface MediaItem {
  id?: number;
  file?: File;
  url: string;
  mediaType: "photo" | "video";
  isPrimary: boolean;
  sortOrder: number;
  isNew?: boolean;
}

interface MultiMediaUploaderProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
}

export function MultiMediaUploader({ media, onChange, onUpload, disabled }: MultiMediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null, type: "photo" | "video") => {
    if (!files || files.length === 0) return;

    if (type === "video") {
      // Videos don't need cropping
      setIsUploading(true);
      try {
        const newMedia: MediaItem[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const url = await onUpload(file);
          newMedia.push({
            file,
            url,
            mediaType: type,
            isPrimary: media.length === 0 && i === 0,
            sortOrder: media.length + i,
            isNew: true,
          });
        }
        onChange([...media, ...newMedia]);
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Photos go through cropper one by one
      const fileArray = Array.from(files);
      setPendingFiles(fileArray);
      setCurrentFileIndex(0);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(fileArray[0]);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setIsUploading(true);
    
    try {
      const url = await onUpload(new File([croppedBlob], `photo-${Date.now()}.png`, { type: "image/png" }));
      
      const newItem: MediaItem = {
        url,
        mediaType: "photo",
        isPrimary: media.length === 0 && currentFileIndex === 0,
        sortOrder: media.length,
        isNew: true,
      };
      
      onChange([...media, newItem]);
      
      // Process next file if any
      const nextIndex = currentFileIndex + 1;
      if (nextIndex < pendingFiles.length) {
        setCurrentFileIndex(nextIndex);
        const reader = new FileReader();
        reader.onload = () => {
          setImageToCrop(reader.result as string);
          setShowCropper(true);
        };
        reader.readAsDataURL(pendingFiles[nextIndex]);
      } else {
        setPendingFiles([]);
        setCurrentFileIndex(0);
      }
    } catch (error) {
      console.error("Error uploading cropped image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    
    // Process next file if any
    const nextIndex = currentFileIndex + 1;
    if (nextIndex < pendingFiles.length) {
      setCurrentFileIndex(nextIndex);
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(pendingFiles[nextIndex]);
    } else {
      setPendingFiles([]);
      setCurrentFileIndex(0);
    }
    
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    if (newMedia.length > 0 && !newMedia.some((m) => m.isPrimary)) {
      newMedia[0].isPrimary = true;
    }
    onChange(newMedia.map((m, i) => ({ ...m, sortOrder: i })));
  };

  const setPrimary = (index: number) => {
    const newMedia = media.map((m, i) => ({
      ...m,
      isPrimary: i === index,
    }));
    onChange(newMedia);
  };

  const moveMedia = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= media.length) return;
    
    const newMedia = [...media];
    const [movedItem] = newMedia.splice(fromIndex, 1);
    newMedia.splice(toIndex, 0, movedItem);
    
    onChange(newMedia.map((m, i) => ({ ...m, sortOrder: i })));
  };

  return (
    <>
      {showCropper && imageToCrop && (
        <ImageCropper
          open={showCropper}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={handleCropCancel}
          cropShape="rect"
          aspectRatio={16/9}
        />
      )}
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            ref={photoInputRef}
            type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files, "photo")}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files, "video")}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => photoInputRef.current?.click()}
          className="flex-1 text-black border-gray-300"
          data-testid="button-add-photos"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Image className="h-4 w-4 mr-2" />
          )}
          Добавить фото
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => videoInputRef.current?.click()}
          className="flex-1 text-black border-gray-300"
          data-testid="button-add-videos"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Video className="h-4 w-4 mr-2" />
          )}
          Добавить видео
        </Button>
      </div>

      {media.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Нажмите на звезду чтобы выбрать главное медиа. Перетаскивайте для изменения порядка.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {media.map((item, index) => (
              <div
                key={item.id || `new-${index}`}
                className={`relative group rounded-lg overflow-hidden border-2 ${
                  item.isPrimary ? "border-yellow-400 ring-2 ring-yellow-200" : "border-gray-200"
                }`}
              >
                {item.mediaType === "photo" ? (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-20 object-cover"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-800 flex items-center justify-center">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:text-yellow-400"
                    onClick={() => setPrimary(index)}
                    data-testid={`button-primary-${index}`}
                  >
                    <Star className={`h-4 w-4 ${item.isPrimary ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  </Button>
                  
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white"
                      onClick={() => moveMedia(index, index - 1)}
                      data-testid={`button-move-up-${index}`}
                    >
                      <span className="text-xs">←</span>
                    </Button>
                  )}
                  
                  {index < media.length - 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white"
                      onClick={() => moveMedia(index, index + 1)}
                      data-testid={`button-move-down-${index}`}
                    >
                      <span className="text-xs">→</span>
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white hover:text-red-400"
                    onClick={() => removeMedia(index)}
                    data-testid={`button-remove-media-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {item.isPrimary && (
                  <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs px-1 rounded">
                    Главное
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

        {media.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
            Нет загруженных медиафайлов
          </div>
        )}
      </div>
    </>
  );
}
