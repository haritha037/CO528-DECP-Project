export interface MessagingService {
  sendMessage(message: any): Promise<void>;
  subscribeToMessages(callback: (msg: any) => void): () => void;
}
