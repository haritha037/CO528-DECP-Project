import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, fontSize, fontWeight } from '@/theme';

interface AvatarProps {
  url?: string;
  initials: string;
  size?: number;
}

export default function Avatar({ url, initials, size = 40 }: AvatarProps) {
  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: size / 2 }
  ];

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={containerStyle}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View style={[containerStyle, styles.placeholder]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
});
