'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConversationTabProps {
  messages: Message[];
  currentUserId: string;
  hasWarning?: boolean;
}

export function ConversationTab({ messages, currentUserId, hasWarning }: ConversationTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAvatarInitial = (role: string) => {
    switch (role) {
      case 'buyer': return 'B';
      case 'seller': return 'S';
      case 'admin': return 'A';
      default: return '?';
    }
  };

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'buyer': return 'bg-blue-500';
      case 'seller': return 'bg-green-500';
      case 'admin': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      {hasWarning && (
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Contact information has been automatically blocked to protect privacy.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation below.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.author.id === currentUserId ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(message.author.role)} text-white flex items-center justify-center text-sm font-medium`}
                aria-label={`${message.author.role} avatar`}
              >
                {getAvatarInitial(message.author.role)}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 max-w-xs ${
                  message.author.id === currentUserId ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-lg ${
                    message.author.id === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
