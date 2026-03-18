import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { Image } from 'expo-image';
import { eventApi, EventDTO, EVENT_TYPE_LABELS } from '@/api/eventApi';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (id && !authLoading && user) {
      eventApi.getEvent(id)
        .then(setEvent)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, user, authLoading]);

  const handleRSVP = async (status: string) => {
    if (!id || rsvpSubmitting) return;
    setRsvpSubmitting(true);
    try {
      const updated = await eventApi.rsvp(id, status);
      setEvent(updated);
    } catch (error) {
      console.error('RSVP failed:', error);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Event not found.</Text>
      </View>
    );
  }

  const eventTypeColor = colors.eventType[event.eventType as keyof typeof colors.eventType] || colors.primary;
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Event Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: Platform.OS === 'ios' ? 0 : 4, marginRight: 16 }}>
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.mediaContainer}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: eventTypeColor + '30' }]}>
              <Ionicons name="calendar" size={80} color={eventTypeColor} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={[styles.typeBadge, { backgroundColor: eventTypeColor + '20' }]}>
            <Text style={[styles.typeText, { color: eventTypeColor }]}>
              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
            </Text>
          </View>
          
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{event.goingCount}</Text>
              <Text style={styles.statLabel}>Going</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{event.maybeCount}</Text>
              <Text style={styles.statLabel}>Maybe</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{event.notGoingCount}</Text>
              <Text style={styles.statLabel}>Declined</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={24} color={colors.primaryLight} />
              <View style={styles.infoRight}>
                <Text style={styles.infoTitle}>Date & Time</Text>
                <Text style={styles.infoValue}>
                  {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.infoSubValue}>
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={24} color={colors.primaryLight} />
              <View style={styles.infoRight}>
                <Text style={styles.infoTitle}>Location</Text>
                <Text style={styles.infoValue}>
                  {event.online ? 'Online Event' : (event.location || 'To be announced')}
                </Text>
                {event.onlineLink && (
                  <TouchableOpacity onPress={() => Linking.openURL(event.onlineLink!)}>
                    <Text style={styles.linkText}>Join Meeting</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.rsvpPrompt}>Will you attend?</Text>
        <View style={styles.rsvpRow}>
          <TouchableOpacity 
            style={[styles.rsvpButton, event.myRsvpStatus === 'GOING' && { backgroundColor: colors.success }]} 
            onPress={() => handleRSVP('GOING')}
            disabled={rsvpSubmitting}
          >
            <Text style={[styles.rsvpButtonText, event.myRsvpStatus === 'GOING' && { color: '#fff' }]}>Going</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rsvpButton, event.myRsvpStatus === 'MAYBE' && { backgroundColor: colors.warning }]} 
            onPress={() => handleRSVP('MAYBE')}
            disabled={rsvpSubmitting}
          >
            <Text style={[styles.rsvpButtonText, event.myRsvpStatus === 'MAYBE' && { color: '#fff' }]}>Maybe</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rsvpButton, event.myRsvpStatus === 'NOT_GOING' && { backgroundColor: colors.error }]} 
            onPress={() => handleRSVP('NOT_GOING')}
            disabled={rsvpSubmitting}
          >
            <Text style={[styles.rsvpButtonText, event.myRsvpStatus === 'NOT_GOING' && { color: '#fff' }]}>No</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 160,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  mediaContainer: {
    height: 200,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.xl,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  typeText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  infoRight: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  infoTitle: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  infoSubValue: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  linkText: {
    color: colors.primaryLight,
    fontWeight: fontWeight.bold,
    marginTop: 8,
  },
  descriptionSection: {
    marginTop: spacing.sm,
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
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rsvpPrompt: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  rsvpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rsvpButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: colors.surfaceLight,
  },
  rsvpButtonText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.bold,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.lg,
  },
});
