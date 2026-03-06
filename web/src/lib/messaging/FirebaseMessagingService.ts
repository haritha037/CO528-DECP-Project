import { db } from '../firebase';
import { ref, push, onValue, off } from 'firebase/database';
import { MessagingService } from './MessagingService';

export class FirebaseMessagingService implements MessagingService {
  async sendMessage(message: any) {
    const messagesRef = ref(db, 'messages');
    await push(messagesRef, message);
  }

  subscribeToMessages(callback: (msg: any) => void) {
    const messagesRef = ref(db, 'messages');
    onValue(messagesRef, (snapshot) => {
      callback(snapshot.val());
    });
    return () => off(messagesRef);
  }
}
