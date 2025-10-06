import { useState, useCallback } from 'react';

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface UploadError {
  error: string;
  details?: string;
}

interface UseImageUploadOptions {
  maxFileSize?: number; // în bytes
  allowedTypes?: string[];
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: UploadError) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    onSuccess,
    onError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadSingle = useCallback(async (file: File): Promise<UploadResult | null> => {
    // Validare client-side
    if (!allowedTypes.includes(file.type)) {
      const error = `Tip de fișier nepermis. Tipuri permise: ${allowedTypes.join(', ')}`;
      setError(error);
      onError?.({ error });
      return null;
    }

    if (file.size > maxFileSize) {
      const error = `Fișier prea mare. Mărimea maximă: ${Math.round(maxFileSize / 1024 / 1024)}MB`;
      setError(error);
      onError?.({ error });
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result: UploadResult = await response.json();
      setProgress(100);
      onSuccess?.(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onError?.({ error: errorMessage });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [allowedTypes, maxFileSize, onSuccess, onError]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setProgress(100);
      
      result.files.forEach((file: UploadResult) => {
        onSuccess?.(file);
      });

      return result.files;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onError?.({ error: errorMessage });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setIsUploading(false);
  }, []);

  return {
    uploadSingle,
    uploadMultiple,
    isUploading,
    progress,
    error,
    reset,
  };
}
