/**
 * Connection Status Indicator
 * Shows real-time connection status
 */

import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/lib/hooks/useChatRealtime';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionStatusIndicator({ status, className }: ConnectionStatusProps) {
  if (status === 'connected') {
    return (
      <div className={cn('flex items-center gap-1 text-xs text-green-600', className)}>
        <Wifi className="h-3 w-3" />
        <span>Conectat</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className={cn('flex items-center gap-1 text-xs text-yellow-600', className)}>
        <Wifi className="h-3 w-3 animate-pulse" />
        <span>Se conectează...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={cn('flex items-center gap-1 text-xs text-red-600', className)}>
        <AlertCircle className="h-3 w-3" />
        <span>Eroare conexiune</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 text-xs text-gray-500', className)}>
      <WifiOff className="h-3 w-3" />
      <span>Deconectat</span>
    </div>
  );
}
