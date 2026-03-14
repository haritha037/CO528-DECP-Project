import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet,
  View, 
  ScrollView, 
  ActivityIndicator, 
  Text, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView, 
  Platform,
  FlatList
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { postApi, PostDTO, CommentDTO } from '../../src/api/postApi';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../src/theme';
import PostCard from '../../src/components/PostCard';
import CommentItem from '../../src/components/CommentItem';
import { Ionicons } from '@expo/vector-icons';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState<PostDTO | null>(null);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!id || authLoading || !user) return;
    try {
      const [postData, commentData] = await Promise.all([
        postApi.getPost(id),
        postApi.getComments(id)
      ]);
      setPost(postData);
      setComments(commentData.content);
    } catch (error) {
      console.error('Failed to fetch post detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [fetchData, user, authLoading]);

  const handleAddComment = async () => {
    if (!commentText.trim() || submitting || !id) return;
    
    setSubmitting(true);
    try {
      const newComment = await postApi.addComment(id, commentText);
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      // Update post comment count locally
      if (post) setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Post not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen 
        options={{ 
          title: 'Post',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: Platform.OS === 'ios' ? 0 : 4, marginRight: 16 }}>
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        ListHeaderComponent={<PostCard post={post} />}
        renderItem={({ item }) => <CommentItem comment={item} />}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]} 
          onPress={handleAddComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="send" size={24} color={colors.text} />
          )}
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
    paddingBottom: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.lg,
  },
  emptyComments: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
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
});
