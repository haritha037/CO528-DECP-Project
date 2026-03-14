import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { db } from '@/auth/firebase';
import { ref, onValue, push, serverTimestamp, set, update, DataSnapshot } from 'firebase/database';
import { useAuth } from '@/auth/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '@/utils/dateUtils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string | number | null;
}

export default function ChatScreen() {
  const { id: threadId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!threadId || !user) return;

    const messagesRef = ref(db, `messages/${threadId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })) as Message[];
        setMessages(list);
      }
      setLoading(false);
    });

    // Mark as read
    const threadRef = ref(db, `userThreads/${user.uid}/${threadId}`);
    update(threadRef, { unreadCount: 0 });

    return () => unsubscribe();
  }, [threadId, user]);

  const handleSend = async () => {
    if (!text.trim() || !user || !threadId) return;

    const messageData = {
      senderId: user.uid,
      text: text.trim(),
      timestamp: serverTimestamp(),
    };

    const messagesRef = ref(db, `messages/${threadId}`);
    const newMessageRef = push(messagesRef);
    
    setText('');
    await set(newMessageRef, messageData);
    
    // Update thread for both users (simplified logic)
    // In a real app, you'd update both userThreads[user.uid] and userThreads[otherUid]
    const threadRef = ref(db, `userThreads/${user.uid}/${threadId}`);
    update(threadRef, {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
    });
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
          {item.timestamp ? formatTime(item.timestamp) : ''}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: 'Chat' }} />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item: Message) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirMessageTime: {
    color: colors.textMuted,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: fontSize.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
