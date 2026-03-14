import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PostDTO } from '@/api/postApi';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import Avatar from './Avatar';
import { formatDate } from '@/utils/dateUtils';

interface PostCardProps {
  post: PostDTO;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

export default function PostCard({ post, onPress, onLike, onComment }: PostCardProps) {
  const formattedDate = formatDate(post.createdAt);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <Avatar 
          url={post.author.profilePictureUrl} 
          initials={post.author.initials} 
          size={44} 
        />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.author.name}</Text>
            <View style={[styles.badge, { backgroundColor: colors.roleBadge[post.author.roleBadge as keyof typeof colors.roleBadge] || colors.primary }]}>
              <Text style={styles.badgeText}>{post.author.role}</Text>
            </View>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>

      {post.textContent && (
        <Text style={styles.content} numberOfLines={4}>
          {post.textContent}
        </Text>
      )}

      {post.mediaItems && post.mediaItems.length > 0 && (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: post.mediaItems[0].mediaUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          {post.mediaItems.length > 1 && (
            <View style={styles.mediaOverlay}>
              <Text style={styles.overlayText}>+{post.mediaItems.length - 1}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons 
            name={post.reactedByCurrentUser ? "heart" : "heart-outline"} 
            size={22} 
            color={post.reactedByCurrentUser ? colors.error : colors.textSecondary} 
          />
          <Text style={[styles.actionText, post.reactedByCurrentUser && { color: colors.error }]}>
            {post.reactionCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  badge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  date: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  content: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  mediaContainer: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginLeft: 6,
    fontWeight: fontWeight.medium,
  },
});
