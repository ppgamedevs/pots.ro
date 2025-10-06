"use client";

import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onRemove?: () => void;
  currentImage?: string;
  className?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onUpload,
  onRemove,
  currentImage,
  className,
  maxFileSize = 10 * 1024 * 1024,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  placeholder = "Trage și plasează o imagine sau click pentru a selecta",
  disabled = false,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const { uploadSingle, isUploading, error, reset } = useImageUpload({
    maxFileSize,
    allowedTypes,
    onSuccess: (result) => {
      setPreview(result.url);
      onUpload(result.url);
      reset();
    },
    onError: () => {
      reset();
    },
  });

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled || isUploading) return;
    
    const result = await uploadSingle(file);
    if (result) {
      setPreview(result.url);
    }
  }, [uploadSingle, disabled, isUploading]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  }, [handleFileSelect, disabled, isUploading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    onRemove?.();
  }, [onRemove]);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400',
          preview ? 'border-solid' : ''
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isUploading && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 mx-auto">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-sm text-gray-600">Se încarcă...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">{placeholder}</p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP, AVIF până la {Math.round(maxFileSize / 1024 / 1024)}MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Componentă pentru upload multiple
interface MultipleImageUploadProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
}

export function MultipleImageUpload({
  onUpload,
  maxFiles = 5,
  className,
}: MultipleImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const { uploadMultiple, isUploading, error } = useImageUpload({
    onSuccess: (result) => {
      setPreviews(prev => [...prev, result.url]);
    },
  });

  const handleFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const limitedFiles = imageFiles.slice(0, maxFiles - previews.length);
    
    if (limitedFiles.length > 0) {
      await uploadMultiple(limitedFiles);
    }
  }, [uploadMultiple, maxFiles, previews.length]);

  return (
    <div className={cn('space-y-4', className)}>
      <ImageUpload
        onUpload={(url) => {
          const newPreviews = [...previews, url];
          setPreviews(newPreviews);
          onUpload(newPreviews);
        }}
        placeholder={`Adaugă imagini (${previews.length}/${maxFiles})`}
        disabled={previews.length >= maxFiles || isUploading}
      />
      
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  const newPreviews = previews.filter((_, i) => i !== index);
                  setPreviews(newPreviews);
                  onUpload(newPreviews);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
