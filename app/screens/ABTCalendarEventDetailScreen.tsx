import React, { useMemo } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarEvent } from '../services/api';
import { theme } from '../theme/tokens';

type ParamList = {
  ABTCalendarEvent: {
    event: CalendarEvent;
  };
};

const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return 'Date TBD';
  }
  const sameMonth = s.getMonth() === e.getMonth();
  const monthStart = monthFull[s.getMonth()] ?? '';
  const monthEnd = monthFull[e.getMonth()] ?? '';
  const year = e.getFullYear();
  if (sameMonth) {
    return `${monthStart} ${s.getDate()} – ${e.getDate()}, ${year}`;
  }
  return `${monthStart} ${s.getDate()} – ${monthEnd} ${e.getDate()}, ${year}`;
};

const sanitizeDescription = (html?: string) => {
  if (!html) return 'No description provided.';
  return html
    .replace(/<\/?p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const ABTCalendarEventDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'ABTCalendarEvent'>>();
  const event = route.params?.event;

  const description = useMemo(() => sanitizeDescription(event?.description), [event?.description]);
  const dateRange = useMemo(() => formatDateRange(event?.start ?? '', event?.end ?? ''), [event?.start, event?.end]);
  const categories = event?.categories?.length ? event.categories.join(' • ') : 'ABT Event';

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Event not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
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
            <Text style={styles.heroPlaceholderText}>ABT Calendar</Text>
          </View>
        )}

        <View style={styles.meta}>
          <Text style={styles.category}>{categories}</Text>
          <Text style={styles.title}>{event.title || 'Untitled Event'}</Text>
          <Text style={styles.date}>{dateRange}</Text>
          {event.start_time || event.end_time ? (
            <Text style={styles.time}>
              {event.start_time ? `Starts: ${event.start_time}` : ''} {event.end_time ? `Ends: ${event.end_time}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>About</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: theme.spacing['4xl'],
  },
  hero: {
    width: '100%',
    height: 220,
    backgroundColor: '#E5E7EB',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    ...theme.typography.heading,
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  category: {
    ...theme.typography.caption,
    color: '#1B365D',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    ...theme.typography.heading,
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  date: {
    ...theme.typography.body,
    color: '#4B5563',
    fontSize: 15,
  },
  time: {
    ...theme.typography.caption,
    color: '#6B7280',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionHeading: {
    ...theme.typography.heading,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  fallbackText: {
    ...theme.typography.heading,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#1B365D',
    borderRadius: theme.radius.md,
  },
  backButtonText: {
    ...theme.typography.button,
    color: theme.colors.textOnDark,
  },
});




