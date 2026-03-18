import { db } from '../firebase';
import { ref, push, set, update, onValue, runTransaction } from 'firebase/database';
import { MessagingService, Message, ConversationMetadata } from './MessagingService';

export class FirebaseMessagingService implements MessagingService {
  getConversationId(uidA: string, uidB: string): string {
    return [uidA, uidB].sort().join('_');
  }

  async ensureConversation(myUid: string, otherUid: string): Promise<string> {
    const convId = this.getConversationId(myUid, otherUid);
    const [a, b] = [myUid, otherUid].sort();
    const updates: Record<string, unknown> = {};
    // Write conversation metadata (idempotent — update won't overwrite existing fields)
    updates[`conversations/${convId}/metadata/participantA`] = a;
    updates[`conversations/${convId}/metadata/participantB`] = b;
    // Only write the initiator's index entry — recipient sees the conversation only after
    // the first message is sent (sendMessage writes their entry then)
    updates[`user_conversations/${myUid}/${convId}/otherUid`] = otherUid;
    updates[`user_conversations/${myUid}/${convId}/lastMessageAt`] = 0;
    updates[`user_conversations/${myUid}/${convId}/unreadCount`] = 0;
    updates[`user_conversations/${myUid}/${convId}/lastMessage`] = '';
    await update(ref(db), updates);
    return convId;
  }

  async sendMessage(conversationId: string, senderId: string, otherUid: string, text: string): Promise<void> {
    const sentAt = Date.now();
    const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;

    // 1. Push the message
    await push(ref(db, `conversations/${conversationId}/messages`), { senderId, text, sentAt });

    // 2. Update conversation metadata
    await update(ref(db, `conversations/${conversationId}/metadata`), {
      lastMessage: preview,
      lastMessageAt: sentAt,
      lastMessageSenderId: senderId,
    });

    // 3. Update sender's index (no unread for yourself)
    await update(ref(db, `user_conversations/${senderId}/${conversationId}`), {
      lastMessage: preview,
      lastMessageAt: sentAt,
    });

    // 4. Ensure recipient's index exists (created here on first message) and increment unread
    await update(ref(db, `user_conversations/${otherUid}/${conversationId}`), {
      otherUid: senderId,
      lastMessage: preview,
      lastMessageAt: sentAt,
    });
    await runTransaction(
      ref(db, `user_conversations/${otherUid}/${conversationId}/unreadCount`),
      (current) => (current || 0) + 1,
    );
  }

  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = ref(db, `conversations/${conversationId}/messages`);
    const unsub = onValue(messagesRef, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((child) => {
        msgs.push({ id: child.key!, ...child.val() });
      });
      msgs.sort((a, b) => a.sentAt - b.sentAt);
      callback(msgs);
    });
    return unsub;
  }

  subscribeToConversationList(uid: string, callback: (conversations: ConversationMetadata[]) => void): () => void {
    const convRef = ref(db, `user_conversations/${uid}`);
    const unsub = onValue(convRef, (snapshot) => {
      const convs: ConversationMetadata[] = [];
      snapshot.forEach((child) => {
        const val = child.val();
        convs.push({
          conversationId: child.key!,
          otherUid: val.otherUid,
          lastMessage: val.lastMessage || '',
          lastMessageAt: val.lastMessageAt || 0,
          unreadCount: val.unreadCount || 0,
        });
      });
      convs.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      callback(convs);
    });
    return unsub;
  }

  markConversationRead(uid: string, conversationId: string): void {
    set(ref(db, `user_conversations/${uid}/${conversationId}/unreadCount`), 0);
  }

  markMessagesRead(conversationId: string, uid: string): void {
    set(ref(db, `conversations/${conversationId}/readBy/${uid}`), Date.now());
  }

  subscribeToReadReceipts(conversationId: string, callback: (readBy: Record<string, number>) => void): () => void {
    const readByRef = ref(db, `conversations/${conversationId}/readBy`);
    return onValue(readByRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }

  setTyping(conversationId: string, uid: string, isTyping: boolean): void {
    const typingRef = ref(db, `conversations/${conversationId}/typing/${uid}`);
    if (isTyping) {
      set(typingRef, Date.now());
    } else {
      set(typingRef, null);
    }
  }

  subscribeToTyping(conversationId: string, callback: (typingUids: Record<string, number>) => void): () => void {
    const typingRef = ref(db, `conversations/${conversationId}/typing`);
    return onValue(typingRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }
}
