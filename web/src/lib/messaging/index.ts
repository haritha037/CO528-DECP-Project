export type { Message, ConversationMetadata, MessagingService } from './MessagingService';
export { FirebaseMessagingService } from './FirebaseMessagingService';

import { FirebaseMessagingService } from './FirebaseMessagingService';
export const messagingService = new FirebaseMessagingService();
