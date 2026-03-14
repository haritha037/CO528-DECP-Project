import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity,
  Linking,
  Share
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { jobApi, JobDTO, JOB_TYPE_LABELS } from '@/api/jobApi';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/utils/dateUtils';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      jobApi.getJob(id)
        .then(setJob)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleApply = () => {
    if (job?.applicationLink) {
      Linking.openURL(job.applicationLink);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      await Share.share({
        message: `Check out this job: ${job.title} at ${job.company}\n\nApply here: ${job.applicationLink}`,
        url: job.applicationLink,
        title: job.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Job not found.</Text>
      </View>
    );
  }

  const jobTypeColor = colors.jobType[job.jobType as keyof typeof colors.jobType] || colors.primary;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Job Detail',
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={{ marginRight: spacing.md }}>
              <Ionicons name="share-social-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{job.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: job.status === 'ACTIVE' ? colors.success + '20' : colors.textMuted + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: job.status === 'ACTIVE' ? colors.success : colors.textMuted }]}>
                {job.status}
              </Text>
            </View>
          </View>
          <Text style={styles.company}>{job.company}</Text>
          {job.postedByName && (
            <Text style={styles.postedBy}>Posted by {job.postedByName}</Text>
          )}
          
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: jobTypeColor + '20' }]}>
              <Text style={[styles.badgeText, { color: jobTypeColor }]}>
                {JOB_TYPE_LABELS[job.jobType] || job.jobType}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeTextGray}>{job.remote ? 'Remote' : 'On-site'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>{job.location || 'Location not specified'}</Text>
          </View>
          {job.salaryRange && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{job.salaryRange}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>Posted {formatDate(job.createdAt)}</Text>
          </View>
          {job.applicationDeadline && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.warning} />
              <Text style={styles.infoText}>
                <Text style={{ color: colors.warning, fontWeight: fontWeight.bold }}>Deadline: </Text>
                {formatDate(job.applicationDeadline)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {job.requirements && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.description}>{job.requirements}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
          <Ionicons name="open-outline" size={20} color={colors.text} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  company: {
    fontSize: fontSize.lg,
    color: colors.primaryLight,
    marginTop: spacing.xs,
  },
  postedBy: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  badgeTextGray: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoText: {
    marginLeft: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  contentSection: {
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  applyButtonText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.lg,
  },
});
