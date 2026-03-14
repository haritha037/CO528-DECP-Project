import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CommentDTO } from '@/api/postApi';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import Avatar from './Avatar';
import { formatDateTime } from '@/utils/dateUtils';

interface CommentItemProps {
  comment: CommentDTO;
  isReply?: boolean;
}

export default function CommentItem({ comment, isReply = false }: CommentItemProps) {
  const formattedDate = formatDateTime(comment.createdAt);

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      <Avatar 
        url={comment.author.profilePictureUrl} 
        initials={comment.author.initials} 
        size={isReply ? 32 : 36} 
      />
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.name}>{comment.author.name}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.bubble}>
          <Text style={styles.content}>{comment.content}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  replyContainer: {
    marginLeft: spacing.xxl,
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  date: {
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: spacing.sm,
  },
  bubble: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: 2,
  },
  content: {
    color: colors.text,
    fontSize: fontSize.md,
  },
});
