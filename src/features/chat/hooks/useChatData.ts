import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { ChatMessage, Contact, ConversationDetail, ConversationSummary, MessagePage } from '../types';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: ['chat', 'conversations'] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
  unread: ['chat', 'unread'] as const,
};

export const useContacts = (search: string) =>
  useQuery({
    queryKey: ['chat', 'contacts', search],
    queryFn: () => api<Contact[]>(`/chat/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

export const useConversations = () => useQuery({ queryKey: chatKeys.conversations, queryFn: () => api<ConversationSummary[]>('/chat/conversations') });

export const useConversation = (id: string) =>
  useQuery({ queryKey: chatKeys.conversation(id), queryFn: () => api<ConversationDetail>(`/chat/conversations/${id}`) });

export const useChatUnread = () =>
  useQuery({ queryKey: chatKeys.unread, queryFn: () => api<{ unread: number }>('/chat/unread-count'), staleTime: 30_000 });

// History from the newest message; the cursor of each page asks for the one before it.
export function useMessages(id: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(id),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api<MessagePage>(`/chat/conversations/${id}/messages?limit=30${pageParam ? `&before=${pageParam}` : ''}`),
    getNextPageParam: (last) => last.next ?? undefined,
  });
}

export function useCreateDirect() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api<ConversationDetail>('/chat/conversations', { method: 'POST', body: { userId } }),
    onSuccess: (conversation) => {
      client.setQueryData(chatKeys.conversation(conversation.id), conversation);
      void client.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

export function useMarkRead(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ unread: number }>(`/chat/conversations/${id}/read`, { method: 'POST' }),
    onSuccess: (total) => {
      client.setQueryData(chatKeys.unread, total);
      void client.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

// A message that just arrived (by socket or by a confirmed send) goes to the top of its history, once.
export function insertMessage(client: ReturnType<typeof useQueryClient>, message: ChatMessage) {
  client.setQueryData<InfiniteData<MessagePage, string | undefined>>(chatKeys.messages(message.conversationId), (old) => {
    if (!old || old.pages.some((page) => page.data.some((m) => m.id === message.id))) return old;
    const [first, ...rest] = old.pages;
    return { ...old, pages: [{ ...first, data: [message, ...first.data] }, ...rest] };
  });
}
