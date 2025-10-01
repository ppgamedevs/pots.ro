import { apiGet, apiPost } from './client';
import { Conversation, Message, MessageResponse } from '../types';

export async function getConversation(orderId: string): Promise<{
  ok: boolean;
  conversationId: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
}> {
  return apiGet(`/api/conversations/${orderId}`);
}

export async function getMessages(conversationId: string): Promise<{
  ok: boolean;
  messages: Message[];
}> {
  return apiGet(`/api/messages/${conversationId}`);
}

export async function postMessage(conversationId: string, body: string): Promise<MessageResponse> {
  return apiPost(`/api/messages/${conversationId}`, { body });
}
