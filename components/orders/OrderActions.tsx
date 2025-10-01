'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/modal';
import { OrderDetail, OrderStatus } from '@/lib/types';
import { 
  PackageIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  LoaderIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { packOrder, shipOrder, deliverOrder, cancelOrder } from '@/lib/api/orders';
import { createAwb } from '@/lib/api/shipping';
import { AwbLabelButton } from './AwbLabelButton';

interface OrderActionsProps {
  order: OrderDetail;
  role: 'seller' | 'admin';
  onOrderUpdate: () => void;
}

export function OrderActions({ order, role, onOrderUpdate }: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [awbNumber, setAwbNumber] = useState('');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);

  const handleAction = async (action: () => Promise<any>, successMessage: string) => {
    setIsLoading(true);
    try {
      await action();
      toast.success(successMessage);
      onOrderUpdate();
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePack = () => {
    handleAction(
      () => packOrder(order.id),
      'Order marked as packed'
    );
  };

  const handleCreateAwb = () => {
    handleAction(
      () => createAwb(order.id, 1.0),
      'AWB created successfully'
    );
  };

  const handleShip = () => {
    if (!awbNumber.trim()) {
      toast.error('AWB number is required');
      return;
    }
    
    handleAction(
      () => shipOrder(order.id, awbNumber),
      'Order marked as shipped'
    );
    setIsShipDialogOpen(false);
    setAwbNumber('');
  };

  const handleDeliver = () => {
    handleAction(
      () => deliverOrder(order.id),
      'Order marked as delivered'
    );
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error('Cancel reason is required');
      return;
    }
    
    handleAction(
      () => cancelOrder(order.id, cancelReason),
      'Order canceled'
    );
    setIsCancelDialogOpen(false);
    setCancelReason('');
  };

  const canPack = order.status === 'paid';
  const canCreateAwb = order.status === 'packed' || order.status === 'paid';
  const canShip = order.status === 'packed' && order.awbNumber;
  const canDeliver = order.status === 'shipped' && role === 'admin';
  const canCancel = ['pending', 'paid', 'packed'].includes(order.status) && role === 'admin';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Actions</h3>
      
      <div className="flex flex-wrap gap-2">
        {/* Seller Actions */}
        {role === 'seller' && (
          <>
            {canPack && (
              <Button
                onClick={handlePack}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageIcon className="h-4 w-4" />
                )}
                Mark as Packed
              </Button>
            )}

            {canCreateAwb && !order.awbNumber && (
              <Button
                onClick={handleCreateAwb}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageIcon className="h-4 w-4" />
                )}
                Generate AWB
              </Button>
            )}

            {canShip && (
              <Dialog open={isShipDialogOpen} onOpenChange={setIsShipDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TruckIcon className="h-4 w-4" />
                    Mark as Shipped
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark Order as Shipped</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="awbNumber">AWB Number</Label>
                      <Input
                        id="awbNumber"
                        value={awbNumber}
                        onChange={(e) => setAwbNumber(e.target.value)}
                        placeholder="Enter AWB number"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsShipDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleShip} disabled={isLoading}>
                        {isLoading ? (
                          <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Ship Order
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {order.awbLabelUrl && (
              <AwbLabelButton
                orderId={order.id}
                awbNumber={order.awbNumber}
                awbLabelUrl={order.awbLabelUrl}
                disabled={isLoading}
              />
            )}
          </>
        )}

        {/* Admin Actions */}
        {role === 'admin' && (
          <>
            {canDeliver && (
              <Button
                onClick={handleDeliver}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                Force Deliver
              </Button>
            )}

            {canCancel && (
              <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isLoading}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Cancel Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Order</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cancelReason">Cancel Reason</Label>
                      <Input
                        id="cancelReason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Enter reason for cancellation"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCancel} disabled={isLoading} variant="destructive">
                        {isLoading ? (
                          <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Cancel Order
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {order.awbLabelUrl && (
              <AwbLabelButton
                orderId={order.id}
                awbNumber={order.awbNumber}
                awbLabelUrl={order.awbLabelUrl}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </div>

      {/* Action Help Text */}
      <div className="text-sm text-gray-600">
        {role === 'seller' && order.status === 'paid' && (
          <p>Mark the order as packed when items are ready for shipping.</p>
        )}
        {role === 'seller' && order.status === 'packed' && !order.awbNumber && (
          <p>Generate an AWB to create shipping label.</p>
        )}
        {role === 'seller' && order.status === 'packed' && order.awbNumber && (
          <p>Mark as shipped after the package is dispatched.</p>
        )}
        {role === 'admin' && order.status === 'shipped' && (
          <p>Mark as delivered when the package reaches the customer.</p>
        )}
      </div>
    </div>
  );
}
