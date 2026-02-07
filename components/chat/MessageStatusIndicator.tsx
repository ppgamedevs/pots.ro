/**
 * Message Status Indicator Component
 * Shows message delivery status (sent, delivered, read) with checkmarks
 */

import { Check, CheckCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  className?: string;
}

export function MessageStatusIndicator({ status, className }: MessageStatusIndicatorProps) {
  if (status === 'sending') {
    return (
      <div className={cn('flex items-center', className)}>
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className={cn('flex items-center text-gray-400', className)}>
        <Check className="h-3 w-3" />
      </div>
    );
  }

  if (status === 'delivered') {
    return (
      <div className={cn('flex items-center text-gray-400', className)}>
        <CheckCheck className="h-3 w-3" />
      </div>
    );
  }

  if (status === 'read') {
    return (
      <div className={cn('flex items-center text-blue-500', className)}>
        <CheckCheck className="h-3 w-3" />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className={cn('flex items-center text-red-500', className)}>
        <X className="h-3 w-3" />
      </div>
    );
  }

  return null;
}
