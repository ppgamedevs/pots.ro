"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { Upload, X, Star, GripVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";

export interface ImageItem {
  id: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  order: number;
}

interface ProductImagesUploaderProps {
  productId: string;
  initialImages: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  minImages?: number;
}

interface ImageThumbnailProps {
  image: ImageItem;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

function ImageThumbnail({ 
  image, 
  onDelete, 
  onSetPrimary, 
  isUploading = false, 
  uploadProgress = 0 
}: ImageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    >
      {/* Image */}
      <div className="aspect-square relative">
        <Image
          src={image.url}
          alt={image.alt || "Product image"}
          fill
          className="object-cover"
        />
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Progress Bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700">
            <div 
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Overlay Actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSetPrimary(image.id)}
          className="text-white hover:bg-white/20"
          aria-label={image.isPrimary ? "Imagină principală" : "Setează ca imagine principală"}
        >
          <Star className={`h-4 w-4 ${image.isPrimary ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(image.id)}
          className="text-white hover:bg-red-500/20"
          aria-label="Șterge imaginea"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 bg-white/80 dark:bg-slate-800/80 rounded cursor-grab active:cursor-grabbing"
        aria-label="Trage pentru a reordona"
      >
        <GripVertical className="h-3 w-3 text-slate-600 dark:text-slate-300" />
      </div>

      {/* Primary Badge */}
      {image.isPrimary && (
        <div className="absolute top-2 left-2">
          <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
            Principală
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductImagesUploader({
  productId,
  initialImages,
  onChange,
  maxImages = 8,
  minImages = 1
}: ProductImagesUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update parent when images change
  const updateImages = useCallback((newImages: ImageItem[]) => {
    setImages(newImages);
    onChange(newImages);
  }, [onChange]);

  // Upload file to presigned URL
  const uploadFile = async (file: File): Promise<{ url: string; alt: string }> => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Get presigned URL
      const uploadResponse = await fetch(`/api/upload-url?fileName=${encodeURIComponent(file.name)}&contentType=${file.type}`);
      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, publicUrl } = await uploadResponse.json();
      
      // Upload file
      const uploadProgress = (progress: number) => {
        setUploadingFiles(prev => new Map(prev).set(fileId, progress));
      };
      
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            uploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileId);
              return newMap;
            });
            resolve({ url: publicUrl, alt: file.name });
          } else {
            reject(new Error('Upload failed'));
          }
        });
        
        xhr.addEventListener('error', () => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
          reject(new Error('Upload failed'));
        });
        
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } catch (error) {
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
      throw error;
    }
  };

  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      toast({
        title: "Prea multe imagini",
        description: `Poți adăuga maximum ${maxImages} imagini.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const { url, alt } = await uploadFile(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          alt,
          isPrimary: false,
          order: images.length + acceptedFiles.indexOf(file)
        };
      });

      const newImages = await Promise.all(uploadPromises);
      
      // If this is the first image, make it primary
      const updatedImages = [...images, ...newImages].map((img, index) => ({
        ...img,
        isPrimary: images.length === 0 && index === 0 ? true : img.isPrimary,
        order: index
      }));

      // Update product images via API
      await updateProductImages(updatedImages);
      
      toast({
        title: "Succes",
        description: `${acceptedFiles.length} imagine${acceptedFiles.length > 1 ? 'i' : ''} încărcată${acceptedFiles.length > 1 ? 'e' : ''} cu succes.`,
      });
    } catch (error) {
      toast({
        title: "Eroare la încărcare",
        description: "Nu s-au putut încărca imaginile.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [images, maxImages, toast]);

  // Update product images via API
  const updateProductImages = async (newImages: ImageItem[]) => {
    try {
      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          add: newImages.filter(img => !images.find(existing => existing.id === img.id)),
          reorder: newImages.map((img, index) => ({ id: img.id, order: index }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product images');
      }

      const updatedImages = await response.json();
      updateImages(updatedImages);
    } catch (error) {
      console.error('Failed to update product images:', error);
      throw error;
    }
  };

  // Delete image
  const handleDelete = async (imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;

    const newImages = images.filter(img => img.id !== imageId);
    
    // If deleting primary image, set next image as primary
    if (imageToDelete.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    try {
      await updateProductImages(newImages);
      
      toast({
        title: "Succes",
        description: "Imaginea a fost ștearsă.",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge imaginea.",
        variant: "destructive",
      });
    }
  };

  // Set primary image
  const handleSetPrimary = async (imageId: string) => {
    const newImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));

    try {
      await updateProductImages(newImages);
      
      toast({
        title: "Succes",
        description: "Imaginea principală a fost setată.",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut seta imaginea principală.",
        variant: "destructive",
      });
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over.id);
      
      const newImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        order: index
      }));

      try {
        await updateProductImages(newImages);
      } catch (error) {
        toast({
          title: "Eroare",
          description: "Nu s-a putut reordona imaginile.",
          variant: "destructive",
        });
      }
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: maxImages - images.length,
    disabled: isUploading || images.length >= maxImages
  });

  const canUpload = images.length < maxImages && !isUploading;
  const hasMinImages = images.length >= minImages;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Imagini produs
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {images.length}/{maxImages} imagini
            {!hasMinImages && (
              <span className="text-red-600 ml-2">
                (minimum {minImages} necesar{minImages > 1 ? 'e' : ''})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer
          ${isDragActive 
            ? 'border-brand bg-brand/5' 
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
          }
          ${!canUpload ? 'opacity-50 cursor-not-allowed' : ''}
          focus:ring-2 focus:ring-brand/20 focus:outline-none
        `}
        tabIndex={canUpload ? 0 : -1}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-slate-400" />
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {isDragActive ? (
              "Lasă imaginile aici..."
            ) : (
              <>
                Trage imaginile aici sau{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-brand hover:text-brand-dark font-medium"
                  disabled={!canUpload}
                >
                  selectează imagini
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            JPG, PNG, WebP, GIF (max 10MB fiecare)
          </p>
        </div>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <ImageThumbnail
                  key={image.id}
                  image={image}
                  onDelete={handleDelete}
                  onSetPrimary={handleSetPrimary}
                  isUploading={uploadingFiles.has(image.id)}
                  uploadProgress={uploadingFiles.get(image.id) || 0}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Validation Message */}
      {!hasMinImages && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>Adaugă cel puțin {minImages} imagine{minImages > 1 ? 'i' : ''} pentru a publica produsul.</span>
        </div>
      )}
    </div>
  );
}
