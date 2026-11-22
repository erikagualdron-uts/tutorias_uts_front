// Chat and announcements (spec 018): the shapes of contracts/chat-api.yaml.
export type ChatRole = 'SUPERADMIN' | 'TEACHER' | 'STUDENT';
export type MessageKind = 'TEXT' | 'ANNOUNCEMENT';
export type ReadOnlyReason = 'NO_SHARED_MODULE' | 'PERIOD_CLOSED' | 'PARTNER_UNAVAILABLE';

export interface ChatPerson {
  id: string;
  role: ChatRole;
  firstName: string;
  lastName: string;
}

export interface Contact extends ChatPerson {
  modules: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: ChatPerson;
  kind: MessageKind;
  body: string;
  clientMessageId: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  type: 'DIRECT' | 'MODULE';
  partner: ChatPerson | null;
  module: { id: string; name: string } | null;
  unread: number;
  lastMessage: ChatMessage | null;
  lastMessageAt: string | null;
}

export interface ConversationDetail extends ConversationSummary {
  canWrite: boolean;
  readOnlyReason: ReadOnlyReason | null;
  canAnnounce: boolean;
  limits: { messageMaxLength: number };
}

export interface MessagePage {
  data: ChatMessage[];
  next: string | null;
}

// A message the user wrote that the server has not confirmed yet. Lives in memory only: if the app closes,
// it is gone (spec 018 clarification).
export interface PendingMessage {
  clientMessageId: string;
  conversationId: string;
  body: string;
  kind: MessageKind;
  createdAt: string;
  status: 'sending' | 'failed';
  errorCode?: string;
}

export const personName = (p: Pick<ChatPerson, 'firstName' | 'lastName'>) => `${p.firstName} ${p.lastName}`.trim();
