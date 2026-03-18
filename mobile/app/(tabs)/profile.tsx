import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { userApi, UserDTO } from '@/api/userApi';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import Avatar from '@/components/Avatar';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      userApi.getMyProfile()
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Avatar 
            url={profile?.profilePictureUrl} 
            initials={profile?.initials || ''} 
            size={100} 
          />
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.roleBadge[profile?.roleBadge as keyof typeof colors.roleBadge] || colors.primary }]}>
            <Text style={styles.roleText}>{profile?.role}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bio}>{profile?.bio || 'No bio provided yet.'}</Text>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Department</Text>
            <Text style={styles.detailValue}>{profile?.department || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Batch</Text>
            <Text style={styles.detailValue}>{profile?.batch || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Links</Text>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
          <Text style={styles.linkText}>{profile?.linkedinUrl || 'LinkedIn not linked'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem}>
          <Ionicons name="logo-github" size={24} color={colors.text} />
          <Text style={styles.linkText}>{profile?.githubUrl || 'GitHub not linked'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in the next update.')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  email: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  section: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: {
    color: colors.textSecondary,
    marginLeft: spacing.md,
    fontSize: fontSize.sm,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  editButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  editButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  signOutButton: {
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
