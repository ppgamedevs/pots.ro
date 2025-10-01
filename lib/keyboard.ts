import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let keyBuffer = '';
    let bufferTimeout: NodeJS.Timeout;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle single character keys
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        keyBuffer += event.key.toLowerCase();
        
        // Clear buffer after 1 second
        clearTimeout(bufferTimeout);
        bufferTimeout = setTimeout(() => {
          keyBuffer = '';
        }, 1000);

        // Handle shortcuts
        if (keyBuffer === 'go') {
          // Navigate to seller orders
          router.push('/seller/orders');
          keyBuffer = '';
          event.preventDefault();
        } else if (keyBuffer === 'gs') {
          // Navigate to seller dashboard
          router.push('/seller');
          keyBuffer = '';
          event.preventDefault();
        } else if (keyBuffer === 'ga') {
          // Navigate to admin orders
          router.push('/admin/orders');
          keyBuffer = '';
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimeout);
    };
  }, [router]);
}

export function useOrderKeyboardShortcuts(orderId: string) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle when not in input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === 'Escape') {
        router.back();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);
}
