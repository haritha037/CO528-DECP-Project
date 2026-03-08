export interface Message {
  id: string;
  senderId: string;
  text: string;
  sentAt: number;
}

export interface ConversationMetadata {
  conversationId: string;
  otherUid: string;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface MessagingService {
  getConversationId(uidA: string, uidB: string): string;
  ensureConversation(myUid: string, otherUid: string): Promise<string>;
  sendMessage(conversationId: string, senderId: string, otherUid: string, text: string): Promise<void>;
  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void;
  subscribeToConversationList(uid: string, callback: (conversations: ConversationMetadata[]) => void): () => void;
  markConversationRead(uid: string, conversationId: string): void;
}
