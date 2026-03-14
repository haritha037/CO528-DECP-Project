import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import { db } from '../../src/auth/firebase';
import { ref, onValue, query, orderByChild, DataSnapshot } from 'firebase/database';
import { useAuth } from '../../src/auth/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import Avatar from '@/components/Avatar';
import { useRouter, Stack } from 'expo-router';
import { formatDate } from '@/utils/dateUtils';

interface Thread {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  lastMessage: string;
  lastMessageTime: string | number | null;
  unreadCount: number;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const threadsRef = ref(db, `userThreads/${user.uid}`);
    const q = query(threadsRef, orderByChild('lastMessageTime'));

    const unsubscribe = onValue(q, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })).reverse() as Thread[];
        setThreads(list);
      } else {
        setThreads([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderItem = ({ item }: { item: Thread }) => (
    <TouchableOpacity 
      style={styles.threadItem} 
      onPress={() => router.push(`/messages/${item.id}`)}
    >
      <Avatar 
        url={item.otherUserPhoto} 
        initials={item.otherUserName?.[0] || '?'} 
        size={56} 
      />
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text style={styles.userName}>{item.otherUserName}</Text>
          <Text style={styles.time}>
            {item.lastMessageTime ? formatDate(item.lastMessageTime) : ''}
          </Text>
        </View>
        <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadText]} numberOfLines={1}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Messages' }} />
      <FlatList
        data={threads}
        renderItem={renderItem}
        keyExtractor={(item: Thread) => item.id}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    fontSize: 10,
  },
  lastMessage: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  unreadText: {
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
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
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
