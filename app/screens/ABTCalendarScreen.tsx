import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { CalendarEvent, fetchABTCalendar } from '../services/api';

const monthAbbr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

const sanitizeText = (text?: string) => {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&ndash;|&#8211;|&#x2013;/g, '-')
    .replace(/&mdash;|&#8212;|&#x2014;/g, '—')
    .replace(/&#8220;|&ldquo;|&#8221;|&rdquo;/g, '"')
    .replace(/&#8216;|&lsquo;|&#8217;|&rsquo;/g, "'")
    .replace(/&#\d+;|&#x[0-9a-fA-F]+;/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

function parseDateOnly(value?: string): Date | null {
  if (!value) return null;
  const parts = value.split('-').map((p) => parseInt(p, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const formatDateRange = (start: string, end: string) => {
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) {
    return { dayRange: '—', month: '—', pretty: 'Date TBD', weekday: '' };
  }
  const dayRange = `${String(startDate.getDate()).padStart(2, '0')} - ${String(endDate.getDate()).padStart(2, '0')}`;
  const month = monthAbbr[startDate.getMonth()] ?? '—';
  const pretty = `${monthFull[startDate.getMonth()]} ${startDate.getDate()} – ${monthFull[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
  const weekday = startDate.toLocaleDateString(undefined, { weekday: 'long' });
  return { dayRange, month, pretty, weekday };
};

export const ABTCalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchABTCalendar(1);
      const sorted = [...data].sort((a, b) => {
        const aDate = parseDateOnly(a.start)?.getTime() ?? Number.NEGATIVE_INFINITY;
        const bDate = parseDateOnly(b.start)?.getTime() ?? Number.NEGATIVE_INFINITY;
        const aEnd = parseDateOnly(a.end)?.getTime() ?? Number.NEGATIVE_INFINITY;
        const bEnd = parseDateOnly(b.end)?.getTime() ?? Number.NEGATIVE_INFINITY;
        // Sort by start date, fallback to end date if start is missing
        const aKey = aDate === Number.NEGATIVE_INFINITY ? aEnd : aDate;
        const bKey = bDate === Number.NEGATIVE_INFINITY ? bEnd : bDate;
        return bKey - aKey; // most recent first
      });
      setEvents(sorted);
    } catch (err: any) {
      setError(err?.message || 'Unable to load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const nextYear = currentYear + 1;
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    return events
      .filter((event) => {
      const hasABTLiveCategory = (event.categories || []).some(
        (cat) => cat?.trim().toLowerCase() === 'abt live'
      );
      if (!hasABTLiveCategory) return false;

        const startDate = parseDateOnly(event.start);
        if (!startDate) return false;

      const eventYear = startDate.getFullYear();
      const eventMonth = startDate.getMonth();

      const isCurrentMonthThisYear = eventYear === currentYear && eventMonth === currentMonth;
      const isAnyMonthNextYear = eventYear === nextYear;

        const isNotPast = startDate.getTime() >= today.getTime();

        return (isCurrentMonthThisYear || isAnyMonthNextYear) && isNotPast;
      })
      .sort((a, b) => {
        const aStart = parseDateOnly(a.start)?.getTime() ?? Number.POSITIVE_INFINITY;
        const bStart = parseDateOnly(b.start)?.getTime() ?? Number.POSITIVE_INFINITY;
        return aStart - bStart;
      });
  }, [events]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const renderEvent = ({ item }: { item: CalendarEvent }) => {
    const { dayRange, month, pretty, weekday } = formatDateRange(item.start, item.end);
    const cleanTitle = sanitizeText(item.title) || 'Untitled Event';
    const subtitle = [weekday, sanitizeText(item.categories?.join(' • '))].filter(Boolean).join(' • ');
    return (
      <View style={styles.eventCard}>
        <View style={styles.dateBox}>
          <Text style={styles.dateRange}>{dayRange}</Text>
          <Text style={styles.monthAbbr}>{month}</Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {cleanTitle}
          </Text>
          <Text style={styles.eventSubtitle} numberOfLines={1}>
            {subtitle || sanitizeText(pretty)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.emptyText}>Loading events...</Text>
          <Text style={styles.emptySubtext}>This may take a moment while we fetch all events</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No events found</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1B365D" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ABT Calendar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    backgroundColor: '#1B365D',
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: Platform.OS === 'ios' ? 8 : 8,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    ...theme.typography.heading,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: theme.typography.heading.fontFamily,
  },
  headerTitle: {
    flex: 1,
    ...theme.typography.heading,
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: theme.typography.heading.fontFamily,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['6xl'] || theme.spacing['4xl'],
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 0.5,
    borderColor: '#E4E7EC',
  },
  dateBox: {
    width: 72,
    minHeight: 72,
    backgroundColor: '#1B365D',
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  dateRange: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.textOnDark,
    fontWeight: '700',
    fontFamily: theme.typography.body.fontFamily,
    textAlign: 'center',
  },
  monthAbbr: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textOnDark,
    fontWeight: '600',
    fontFamily: theme.typography.body.fontFamily,
    marginTop: 4,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  eventContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eventTitle: {
    ...theme.typography.heading,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
    fontWeight: '700',
  },
  eventSubtitle: {
    ...theme.typography.caption,
    fontSize: 13,
    color: '#4B5563',
    fontFamily: theme.typography.body.fontFamily,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['4xl'],
    minHeight: 400,
  },
  emptyText: {
    ...theme.typography.heading,
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.heading.fontFamily,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    ...theme.typography.caption,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.error,
    fontFamily: theme.typography.body.fontFamily,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.lg,
  },
  retryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textOnDark,
    fontFamily: theme.typography.button.fontFamily,
  },
});
