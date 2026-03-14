import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Text,
  TextInput
} from 'react-native';
import { jobApi, JobDTO } from '@/api/jobApi';
import { colors, spacing, borderRadius, fontSize } from '@/theme';
import JobCard from '@/components/JobCard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function JobsScreen() {
  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const fetchJobs = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      const response = await jobApi.searchJobs({ 
        search: search || undefined,
        page: pageNum,
        status: 'ACTIVE'
      });
      if (isRefresh) {
        setJobs(response.content);
      } else {
        setJobs(prev => [...prev, ...response.content]);
      }
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchJobs(0, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(0, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchJobs(page + 1);
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, companies..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={jobs}
        renderItem={({ item }) => (
          <JobCard 
            job={item} 
            onPress={() => router.push(`/job/${item.id}`)} 
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
            <Text style={styles.emptyText}>No matching jobs found.</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: fontSize.md,
  },
  listContent: {
    paddingBottom: spacing.lg,
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
