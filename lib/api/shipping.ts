import { apiGet, apiPost } from './client';

export async function createAwb(orderId: string, weightKg?: number): Promise<{
  ok: boolean;
  awb: {
    awbNumber: string;
    awbLabelUrl: string;
    carrierMeta: any;
  };
}> {
  return apiPost('/api/shipping/awb', { orderId, weightKg });
}

export async function downloadLabel(orderId: string): Promise<Blob> {
  const response = await fetch(`/api/shipping/awb/${orderId}/label`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to download label: ${response.status}`);
  }

  return response.blob();
}

export function forceDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
