import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import {
  ABTEvent,
  getInMemoryEvents,
  getCachedEvents,
  getABTEvents,
} from '../services/abtCalendarService';

interface ABTCalendarScreenProps {
  navigation: any;
}

export const ABTCalendarScreen: React.FC<ABTCalendarScreenProps> = ({ navigation }) => {
  const [events, setEvents] = useState<ABTEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async (forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh) {
        setLoading(true);
      }
      setError(null);

      const fetchedEvents = await getABTEvents(forceRefresh);
      
      if (fetchedEvents && fetchedEvents.length > 0) {
        setEvents(fetchedEvents);
        setLoading(false);
        setRefreshing(false);
      } else {
        setError('No events found.');
        setLoading(false);
        setRefreshing(false);
      }
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents(false);
    }, [loadEvents])
  );


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await loadEvents(true);
  }, [loadEvents]);

  const formatMonthYear = (month: string, year: string): string => {
    return `${month} ${year}`;
  };

  const groupedEvents = events.reduce((acc, event) => {
    const key = `${event.month} ${event.year}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as Record<string, ABTEvent[]>);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1B365D" translucent />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ABT Calendar</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : error && events.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadEvents(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {Object.keys(groupedEvents).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          ) : (
            Object.keys(groupedEvents).map((monthYear) => {
              const monthEvents = groupedEvents[monthYear];
              const firstEvent = monthEvents[0];
              
              return (
                <View key={monthYear} style={styles.monthSection}>
                  <Text style={styles.monthHeader}>{monthYear}</Text>
                  {monthEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventCard}
                      onPress={() => {}}
                    >
                      <View style={styles.eventHeader}>
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeText}>{event.dateRange}</Text>
                        </View>
                      </View>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
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
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 8,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
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
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
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
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing['3xl'],
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing['3xl'],
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: 8,
  },
  retryButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  monthSection: {
    paddingHorizontal: theme.spacing['3xl'],
    marginBottom: theme.spacing['2xl'],
  },
  monthHeader: {
    ...theme.typography.heading,
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    fontFamily: theme.typography.heading.fontFamily,
  },
  eventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  eventHeader: {
    marginBottom: theme.spacing.sm,
  },
  dateBadge: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  dateBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.textOnDark,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: theme.typography.caption.fontFamily,
  },
  eventTitle: {
    ...theme.typography.heading,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
    fontFamily: theme.typography.heading.fontFamily,
  },
  eventLocation: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.body.fontFamily,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['3xl'],
    minHeight: 400,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
