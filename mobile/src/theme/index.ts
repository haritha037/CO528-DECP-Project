// Design tokens for the DECP Mobile app
export const colors = {
  // Primary palette
  primary: '#6366F1',       // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Accent
  accent: '#06B6D4',        // Cyan
  accentLight: '#22D3EE',
  
  // Background
  background: '#0F172A',    // Slate 900
  surface: '#1E293B',       // Slate 800
  surfaceLight: '#334155',  // Slate 700
  card: '#1E293B',
  
  // Text
  text: '#F8FAFC',          // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B',     // Slate 500
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Borders
  border: '#334155',
  borderLight: '#475569',
  
  // Role badges
  roleBadge: {
    blue: '#3B82F6',
    gold: '#F59E0B',
    red: '#EF4444',
  },
  
  // Event type colors
  eventType: {
    SEMINAR: '#3B82F6',
    WORKSHOP: '#8B5CF6',
    SOCIAL: '#10B981',
    CAREER_FAIR: '#F97316',
    ANNOUNCEMENT: '#EAB308',
    OTHER: '#6B7280',
  },
  
  // Job type colors
  jobType: {
    FULL_TIME: '#10B981',
    PART_TIME: '#3B82F6',
    INTERNSHIP: '#F59E0B',
    CONTRACT: '#8B5CF6',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
};
