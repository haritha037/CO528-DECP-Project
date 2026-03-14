import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { notificationService, AppNotification } from '../../src/notifications/FirebaseNotificationService';
import { useAuth } from '../../src/auth/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '@/utils/dateUtils';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllRead = () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      notificationService.markAllAsRead(user.uid, unreadIds);
    }
  };

  const markAsRead = (id: string) => {
    if (!user) return;
    notificationService.markAsRead(user.uid, id);
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.type === 'LIKE' ? 'heart' : 'chatbubble'} 
          size={24} 
          color={item.type === 'LIKE' ? colors.error : colors.primary} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.notificationText}>
          <Text style={styles.boldText}>{item.senderName}</Text> {item.message}
        </Text>
        <Text style={styles.timeText}>{formatDateTime(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Activity</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  markReadText: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: fontWeight.bold,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
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
    marginTop: spacing.md,
  },
});
