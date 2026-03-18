import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobDTO, JOB_TYPE_LABELS } from '@/api/jobApi';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { formatDate } from '@/utils/dateUtils';

interface JobCardProps {
  job: JobDTO;
  onPress?: () => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const jobTypeColor = colors.jobType[job.jobType as keyof typeof colors.jobType] || colors.primary;

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.8} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: jobTypeColor + '20' }]}>
          <Text style={[styles.typeText, { color: jobTypeColor }]}>
            {JOB_TYPE_LABELS[job.jobType] || job.jobType}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        {job.location && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{job.location}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{job.remote ? 'Remote' : 'On-site'}</Text>
        </View>
        {job.salaryRange && (
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{job.salaryRange}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.postedAt}>
          Posted {formatDate(job.createdAt)}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  company: {
    color: colors.primaryLight,
    fontSize: fontSize.md,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    marginBottom: spacing.xs,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  postedAt: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
