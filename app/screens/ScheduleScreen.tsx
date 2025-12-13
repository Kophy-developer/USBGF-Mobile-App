import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CalendarEvent, fetchABTCalendar } from '../services/api';
import { theme } from '../theme/tokens';

const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 'Date TBD';
  const sameMonth = s.getMonth() === e.getMonth();
  const monthStart = monthFull[s.getMonth()] ?? '';
  const monthEnd = monthFull[e.getMonth()] ?? '';
  const year = e.getFullYear();
  return sameMonth
    ? `${monthStart} ${s.getDate()} – ${e.getDate()}, ${year}`
    : `${monthStart} ${s.getDate()} – ${monthEnd} ${e.getDate()}, ${year}`;
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

export const ScheduleScreen: React.FC = () => {
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
      const withDescription = (data || []).filter((ev) => {
        const desc = sanitizeDescription(ev.description);
        if (!desc) return false;
        const lower = desc.toLowerCase();
        return lower.includes('registration opens');
      });
      const sorted = [...withDescription].sort((a, b) => {
        const aTime = new Date(a.start).getTime();
        const bTime = new Date(b.start).getTime();
        return bTime - aTime;
      });
      setEvents(sorted);
    } catch (err: any) {
      setError(err?.message || 'Unable to load schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const renderItem = ({ item }: { item: CalendarEvent }) => {
    const dateRange = formatDateRange(item.start, item.end);
    const desc = sanitizeDescription(item.description);
    return (
      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={2}>{item.title || 'Untitled Event'}</Text>
        <Text style={styles.date}>{dateRange}</Text>
        <Text style={styles.desc} numberOfLines={3}>{desc}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ScheduleDetail' as never, { event: item } as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>View Schedule</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.emptyText}>Loading schedule...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.empty}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={loadEvents}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No schedule items with descriptions yet.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
    paddingTop: 10,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: theme.spacing.xs,
  },
  title: { ...theme.typography.heading, fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  date: { ...theme.typography.caption, color: theme.colors.textSecondary },
  desc: { ...theme.typography.body, color: theme.colors.textSecondary },
  button: {
    marginTop: theme.spacing.sm,
    backgroundColor: '#1B365D',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.sm,
    alignSelf: 'flex-start',
  },
  buttonText: { ...theme.typography.button, color: theme.colors.textOnDark, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing['4xl'], gap: theme.spacing.md },
  emptyText: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center' },
  errorText: { ...theme.typography.body, color: theme.colors.error, textAlign: 'center' },
});

