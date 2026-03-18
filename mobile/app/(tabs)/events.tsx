import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Text 
} from 'react-native';
import { eventApi, EventDTO } from '@/api/eventApi';
import { colors, spacing, fontSize } from '@/theme';
import EventCard from '@/components/EventCard';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';

export default function EventsScreen() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const fetchEvents = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      const response = await eventApi.listEvents({ 
        page: pageNum,
        status: 'ACTIVE'
      });
      if (isRefresh) {
        setEvents(response.content);
      } else {
        setEvents(prev => [...prev, ...response.content]);
      }
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchEvents();
    }
  }, [fetchEvents, user, authLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(0, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchEvents(page + 1);
    }
  };

  if (loading && page === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={({ item }) => (
          <EventCard 
            event={item} 
            onPress={() => router.push(`/event/${item.id}`)} 
          />
        )}
        keyExtractor={item => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No upcoming events.</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} />
          ) : null
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
