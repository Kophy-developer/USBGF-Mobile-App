import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { CalendarEvent } from '../services/api';
import { theme } from '../theme/tokens';

type ParamList = RootStackParamList & {
  ScheduleDetail: { event: CalendarEvent };
};

const sanitizeDescription = (html?: string) => {
  if (!html) return '';
  return html
    .replace(/<\/?p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&ndash;|&#8211;|&#x2013;/g, '-')
    .replace(/&mdash;|&#8212;|&#x2014;/g, '—')
    .replace(/&#8220;|&ldquo;|&#8221;|&rdquo;/g, '"')
    .replace(/&#8216;|&lsquo;|&#8217;|&rsquo;/g, "'")
    .replace(/&#\d+;|&#x[0-9a-fA-F]+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

export const ScheduleDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<ParamList, 'ScheduleDetail'>>();
  const event = route.params?.event;

  const description = useMemo(() => sanitizeDescription(event?.description), [event?.description]);

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {event.featured_image ? (
          <Image source={{ uri: event.featured_image }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>ABT Schedule</Text>
          </View>
        )}

        <Text style={styles.title}>{event.title || 'Untitled Event'}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Schedule</Text>
          <Text style={styles.description}>{description || 'No description provided.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingBottom: theme.spacing['4xl'] },
  hero: { width: '100%', height: 220, backgroundColor: '#E5E7EB' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { ...theme.typography.heading, color: '#6B7280', fontSize: 18, fontWeight: '700' },
  title: { ...theme.typography.heading, fontSize: 22, color: theme.colors.textPrimary, fontWeight: '700', paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  section: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  sectionHeading: { ...theme.typography.heading, fontSize: 18, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 20 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  fallbackText: { ...theme.typography.heading, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
});

