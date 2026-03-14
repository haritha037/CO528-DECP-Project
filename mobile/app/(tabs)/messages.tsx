import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { db } from '../../src/auth/firebase';
import { ref, onValue } from 'firebase/database';
import { useAuth } from '../../src/auth/AuthContext';
import { userApi, UserDTO } from '../../src/api/userApi';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import Avatar from '@/components/Avatar';
import { useRouter, Stack } from 'expo-router';
import { formatDate } from '@/utils/dateUtils';

interface ConversationMetadata {
  conversationId: string;
  otherUid: string;
  lastMessage: string;
  lastMessageAt: number;
  unreadCount: number;
}

export default function MessagesScreen() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserDTO>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !user) return;

    // Use the same path as web: user_conversations
    const convRef = ref(db, `user_conversations/${user.uid}`);
    
    const unsubscribe = onValue(convRef, (snapshot) => {
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
      // Sort newest first
      convs.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Separate effect to fetch missing profiles
  useEffect(() => {
    if (authLoading || !user || conversations.length === 0) return;

    conversations.forEach(conv => {
      // Use a local check to avoid re-fetching if we already have it in state
      // or if it's currently being fetched.
      if (conv.otherUid && !profiles[conv.otherUid]) {
        userApi.getUserByUid(conv.otherUid)
          .then(profile => {
            setProfiles(prev => ({ ...prev, [conv.otherUid]: profile }));
          })
          .catch(err => {
            console.error(`Failed to fetch profile for ${conv.otherUid}:`, err);
          });
      }
    });
  }, [conversations, user, authLoading]);

  const renderItem = ({ item }: { item: ConversationMetadata }) => {
    const profile = profiles[item.otherUid];
    return (
      <TouchableOpacity 
        style={styles.threadItem} 
        onPress={() => router.push(`/messages/${item.conversationId}`)}
      >
        <Avatar 
          url={profile?.profilePictureUrl} 
          initials={profile?.initials || item.otherUid.substring(0, 2).toUpperCase()} 
          size={56} 
        />
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={styles.userName}>{profile?.name || 'Loading...'}</Text>
            <Text style={styles.time}>
              {item.lastMessageAt ? formatDate(item.lastMessageAt) : ''}
            </Text>
          </View>
          <View style={styles.lastMessageRow}>
            <Text 
              style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadText]} 
              numberOfLines={1}
            >
              {item.lastMessage || 'Say hello!'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
      <Stack.Screen options={{ title: 'Messages' }} />
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.conversationId}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
            <Text style={styles.emptySubText}>Message someone to start a chat!</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  threadItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  threadContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadText: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptySubText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
