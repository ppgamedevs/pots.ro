'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { postMessage } from '@/lib/api/messages';

interface MessageComposerProps {
  conversationId: string;
  onMessageSent: (message: any) => void;
  disabled?: boolean;
}

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(\+?\d[\s\-()]?){7,}/;

export function MessageComposer({ conversationId, onMessageSent, disabled = false }: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactWarning, setShowContactWarning] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkForContactInfo = (text: string) => {
    const hasEmail = EMAIL_REGEX.test(text);
    const hasPhone = PHONE_REGEX.test(text);
    return hasEmail || hasPhone;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (checkForContactInfo(value)) {
      setIsBlocked(true);
      setShowContactWarning(true);
      
      // Hide warning after 2 seconds
      setTimeout(() => {
        setShowContactWarning(false);
      }, 2000);
    } else {
      setIsBlocked(false);
      setShowContactWarning(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    if (checkForContactInfo(pastedText)) {
      e.preventDefault();
      setIsBlocked(true);
      setShowContactWarning(true);
      toast.error('Contact information is not allowed');
      
      setTimeout(() => {
        setShowContactWarning(false);
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isBlocked || disabled) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await postMessage(conversationId, message.trim());
      
      if (response.ok && response.message) {
        onMessageSent(response.message);
        setMessage('');
        
        if (response.warning) {
          toast.warning('Message sent, but contact information was blocked');
        } else {
          toast.success('Message sent');
        }
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          value={message}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled || isSubmitting}
          className={`min-h-[80px] resize-none ${
            showContactWarning ? 'border-red-500 ring-red-500' : ''
          }`}
          aria-label="Message input"
        />
        
        {/* Contact Warning Tooltip */}
        {showContactWarning && (
          <div className="absolute -top-12 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
            <div className="flex items-center gap-1">
              <AlertCircleIcon className="h-3 w-3" />
              Contact info blocked
            </div>
            <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-red-500"></div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
        
        <Button
          type="submit"
          disabled={!message.trim() || isBlocked || disabled || isSubmitting}
          size="sm"
          className="flex items-center gap-2"
        >
          <SendIcon className="h-4 w-4" />
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {/* Blocked State Message */}
      {isBlocked && (
        <div className="text-sm text-red-600 flex items-center gap-2">
          <AlertCircleIcon className="h-4 w-4" />
          Please remove contact information (email/phone) before sending
        </div>
      )}
    </form>
  );
}
