import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { db } from '../../src/auth/firebase';
import { ref, onValue, push, set, update, runTransaction, get } from 'firebase/database';
import { useAuth } from '../../src/auth/AuthContext';
import { userApi, UserDTO } from '../../src/api/userApi';
import { colors, spacing, borderRadius } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '@/utils/dateUtils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  sentAt: number;
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<UserDTO | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    if (!conversationId || !user) return;

    const messagesRef = ref(db, `conversations/${conversationId}/messages`);

    const unsubscribe = onValue(messagesRef, async (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((child) => {
        list.push({
          id: child.key!,
          ...child.val(),
        });
      });

      list.sort((a, b) => a.sentAt - b.sentAt);
      setMessages(list);
      setLoading(false);

      try {
        const myConvRef = ref(db, `user_conversations/${user.uid}/${conversationId}`);
        await update(myConvRef, { unreadCount: 0 });

        const readReceiptRef = ref(db, `conversations/${conversationId}/readBy/${user.uid}`);
        await set(readReceiptRef, Date.now());
      } catch (error) {
        console.error('Failed to update read state:', error);
      }
    });

    return () => unsubscribe();
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const loadOtherUser = async () => {
      try {
        const metaRef = ref(db, `conversations/${conversationId}/metadata`);
        const snapshot = await get(metaRef);
        const meta = snapshot.val();

        if (meta) {
          const otherUid = meta.participantA === user.uid ? meta.participantB : meta.participantA;
          const fetchedUser = await userApi.getUserByUid(otherUid);
          setOtherUser(fetchedUser);
        }
      } catch (error) {
        console.error('Failed to load other user:', error);
      }
    };

    loadOtherUser();
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!text.trim() || !user || !conversationId || !otherUser) return;

    try {
      const sentAt = Date.now();
      const messageText = text.trim();
      const preview = messageText.length > 60 ? messageText.substring(0, 60) + '...' : messageText;

      const messageData = {
        senderId: user.uid,
        text: messageText,
        sentAt,
      };

      setText('');

      const messagesRef = ref(db, `conversations/${conversationId}/messages`);
      await push(messagesRef, messageData);

      const metaRef = ref(db, `conversations/${conversationId}/metadata`);
      await update(metaRef, {
        lastMessage: preview,
        lastMessageAt: sentAt,
        lastMessageSenderId: user.uid,
      });

      const myConvRef = ref(db, `user_conversations/${user.uid}/${conversationId}`);
      await update(myConvRef, {
        lastMessage: preview,
        lastMessageAt: sentAt,
      });

      const otherUid = (otherUser as any).firebaseUid ?? (otherUser as any).uid;
      const otherConvRef = ref(db, `user_conversations/${otherUid}/${conversationId}`);
      await update(otherConvRef, {
        otherUid: user.uid,
        lastMessage: preview,
        lastMessageAt: sentAt,
      });

      await runTransaction(
        ref(db, `user_conversations/${otherUid}/${conversationId}/unreadCount`),
        (current) => (current || 0) + 1
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
          {item.sentAt ? formatTime(item.sentAt) : ''}
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: otherUser ? otherUser.name : 'Chat',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: Platform.OS === 'ios' ? 0 : 4, marginRight: 16 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerShadowVisible: false,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    fontSize: 15,
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
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginBottom: 2,
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