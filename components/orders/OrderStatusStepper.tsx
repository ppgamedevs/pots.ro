'use client';

import { CheckIcon } from 'lucide-react';
import { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OrderStatusStepperProps {
  status: OrderStatus;
  className?: string;
}

const STATUS_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'paid', label: 'Paid', description: 'Payment received' },
  { status: 'packed', label: 'Packed', description: 'Order prepared for shipping' },
  { status: 'shipped', label: 'Shipped', description: 'Order dispatched' },
  { status: 'delivered', label: 'Delivered', description: 'Order delivered to customer' },
];

const STATUS_ORDER: OrderStatus[] = ['paid', 'packed', 'shipped', 'delivered'];

export function OrderStatusStepper({ status, className }: OrderStatusStepperProps) {
  const currentStepIndex = STATUS_ORDER.indexOf(status);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          
          return (
            <div key={step.status} className="flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  {
                    "bg-green-500 border-green-500 text-white": isCompleted,
                    "bg-blue-500 border-blue-500 text-white": isCurrent,
                    "bg-gray-100 border-gray-300 text-gray-400": isPending,
                  }
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={isCurrent ? `Current step: ${step.description}` : step.description}
              >
                {isCompleted ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "text-sm font-medium",
                    {
                      "text-green-600": isCompleted,
                      "text-blue-600": isCurrent,
                      "text-gray-400": isPending,
                    }
                  )}
                >
                  {step.label}
                </div>
                <div
                  className={cn(
                    "text-xs mt-1",
                    {
                      "text-green-500": isCompleted,
                      "text-blue-500": isCurrent,
                      "text-gray-400": isPending,
                    }
                  )}
                >
                  {step.description}
                </div>
              </div>
              
              {/* Connector Line */}
              {index < STATUS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-0.5 -z-10",
                    {
                      "bg-green-500": index < currentStepIndex,
                      "bg-gray-300": index >= currentStepIndex,
                    }
                  )}
                  style={{ width: 'calc(100% - 2rem)', marginLeft: '2rem' }}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Screen reader only summary */}
      <div className="sr-only">
        Order status: {status}. 
        {currentStepIndex >= 0 && (
          <>Current step: {STATUS_STEPS[currentStepIndex]?.description}</>
        )}
      </div>
    </div>
  );
}
