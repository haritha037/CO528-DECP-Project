import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Text 
} from 'react-native';
import { postApi, PostDTO } from '@/api/postApi';
import { colors, spacing, fontSize } from '@/theme';
import PostCard from '@/components/PostCard';
import { useRouter } from 'expo-router';

export default function FeedScreen() {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const fetchFeed = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      const response = await postApi.getFeed(pageNum);
      if (isRefresh) {
        setPosts(response.content);
      } else {
        setPosts(prev => [...prev, ...response.content]);
      }
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed(0, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchFeed(page + 1);
    }
  };

  const renderItem = ({ item }: { item: PostDTO }) => (
    <PostCard 
      post={item} 
      onPress={() => router.push(`/post/${item.id}`)}
      onLike={() => {/* Implement optimistic like toggle if needed */}}
    />
  );

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
        data={posts}
        renderItem={renderItem}
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
            <Text style={styles.emptyText}>No posts yet.</Text>
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
