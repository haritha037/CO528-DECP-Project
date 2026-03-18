import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { EventDTO, EVENT_TYPE_LABELS } from '@/api/eventApi';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { formatDate, formatTime } from '@/utils/dateUtils';

interface EventCardProps {
  event: EventDTO;
  onPress?: () => void;
}

export default function EventCard({ event, onPress }: EventCardProps) {
  const eventTypeColor = colors.eventType[event.eventType as keyof typeof colors.eventType] || colors.primary;
  
  const formattedDate = formatDate(event.startTime);
  const formattedTime = formatTime(event.startTime);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9} 
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: eventTypeColor + '30' }]}>
            <Ionicons name="calendar" size={40} color={eventTypeColor} />
          </View>
        )}
        <View style={[styles.typeBadge, { backgroundColor: eventTypeColor }]}>
          <Text style={styles.typeText}>{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{formattedDate} • {formattedTime}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {event.online ? 'Online Event' : (event.location || 'TBA')}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.attendees}>
            <Ionicons name="people-outline" size={14} color={colors.primaryLight} />
            <Text style={styles.attendeeText}>{event.goingCount} going</Text>
          </View>
          <View style={styles.rsvpBadge}>
            <Text style={styles.rsvpText}>{event.myRsvpStatus || 'No RSVP'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
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
  typeBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: fontWeight.medium,
    marginLeft: 4,
  },
  rsvpBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rsvpText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
});
