'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, LoaderIcon } from 'lucide-react';
import { downloadLabel, forceDownload } from '@/lib/api/shipping';
import { toast } from 'sonner';

interface AwbLabelButtonProps {
  orderId: string;
  awbNumber?: string | null;
  awbLabelUrl?: string | null;
  disabled?: boolean;
  className?: string;
}

export function AwbLabelButton({ 
  orderId, 
  awbNumber, 
  awbLabelUrl, 
  disabled = false,
  className 
}: AwbLabelButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!awbNumber || !awbLabelUrl) {
      toast.error('AWB label not available');
      return;
    }

    setIsDownloading(true);
    
    try {
      const blob = await downloadLabel(orderId);
      const filename = `${orderId}-${awbNumber}.pdf`;
      forceDownload(blob, filename);
      toast.success('AWB label downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download AWB label');
    } finally {
      setIsDownloading(false);
    }
  };

  const isDisabled = disabled || !awbNumber || !awbLabelUrl || isDownloading;

  return (
    <Button
      onClick={handleDownload}
      disabled={isDisabled}
      variant="outline"
      size="sm"
      className={className}
      aria-label={`Download AWB label for order ${orderId}`}
    >
      {isDownloading ? (
        <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <DownloadIcon className="h-4 w-4 mr-2" />
      )}
      {isDownloading ? 'Downloading...' : 'Download Label'}
    </Button>
  );
}
