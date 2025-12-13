import React, { useCallback, useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { EventSummary, fetchEvents } from '../services/api';

type EventType = 'ABT' | 'ONLINE';
type EventStatus = 'ACCEPTING' | 'IN_PROGRESS' | 'COMPLETED';

type EventsScreenProps = {
  initialViewType?: EventType;
  initialOnlineTab?: EventStatus;
  lockViewType?: boolean;
};

const ABT_TABS: Array<{ key: 'CURRENT' | 'COMPLETED'; label: string }> = [
  { key: 'CURRENT', label: 'Current' },
  { key: 'COMPLETED', label: 'Completed' },
];

const getEventStatus = (event: EventSummary): EventStatus => {
  if (event.winner && String(event.winner).trim().length > 0) {
    return 'COMPLETED';
  }
  if (event.isPlayStarted) {
    return 'IN_PROGRESS';
  }
  return 'ACCEPTING';
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'Date TBD';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const parseEventDateTime = (value?: string): number => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;

  // Try custom format like "2022-Jan-7"
  const parts = value.split(/[-\s]/).filter(Boolean);
  if (parts.length === 3) {
    const [yearRaw, monthRaw, dayRaw] = parts;
    const year = parseInt(yearRaw, 10);
    const month = MONTH_MAP[monthRaw.toLowerCase()] ?? Number.NaN;
    const day = parseInt(dayRaw, 10);
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      const date = Date.UTC(year, month, day);
      return date;
    }
  }

  return Number.NEGATIVE_INFINITY;
};

const eventSortValue = (event: EventSummary): number => {
  const primary = event.start || event.tournament?.start;
  const fallback = (event as any)?.updatedAt || (event as any)?.createdAt;
  const tsPrimary = parseEventDateTime(primary);
  if (tsPrimary !== Number.NEGATIVE_INFINITY) return tsPrimary;
  const tsFallback = parseEventDateTime(fallback);
  return tsFallback;
};

export const EventsScreen: React.FC<EventsScreenProps> = ({
  initialViewType,
  initialOnlineTab,
  lockViewType = false,
}) => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { token, user } = useAuth();
  const [viewType, setViewType] = useState<EventType | null>(
    lockViewType
      ? initialViewType ?? 'ABT'
      : initialViewType ?? (route.params?.initialViewType as EventType | undefined) ?? 'ABT'
  );
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abtTab, setAbtTab] = useState<'CURRENT' | 'COMPLETED'>('CURRENT');
  const [onlineTab, setOnlineTab] = useState<EventStatus>(initialOnlineTab ?? 'ACCEPTING');

  // Update navigation header title based on viewType
  useLayoutEffect(() => {
    if (viewType === 'ABT') {
      navigation.setOptions({ title: 'ABT Events' });
    } else if (viewType === 'ONLINE') {
      navigation.setOptions({ title: 'Online Events' });
    } else {
      navigation.setOptions({ title: 'Events' });
    }
  }, [viewType, navigation]);

  useEffect(() => {
    // Determine initial view type preference: prop takes priority, then route
    const routeInitialView = route.params?.initialViewType as EventType | undefined;
    const desiredView = initialViewType ?? routeInitialView ?? viewType ?? 'ABT';

    setViewType(desiredView);
    if (desiredView === 'ONLINE') {
      const requestedTab = initialOnlineTab ?? (route.params?.initialOnlineTab as EventStatus | undefined);
      setOnlineTab(requestedTab ?? 'ACCEPTING');
    }

    // Clear route params after use
    navigation.setParams?.({
      initialViewType: undefined,
      initialOnlineTab: undefined,
    });
  }, [route.params?.initialViewType, route.params?.initialOnlineTab, navigation, initialViewType, initialOnlineTab, viewType]);

  const loadEvents = useCallback(
    async (selectedType: EventType, tab?: 'CURRENT' | 'COMPLETED') => {
      if (!token || !user?.playerId) {
        setEvents([]);
        return;
      }

      const clubId = selectedType === 'ABT' ? 5 : 2;
      
      // For ABT events, load CURRENT (Accepting + In Progress) or COMPLETED
      if (selectedType === 'ABT') {
        if (tab === 'COMPLETED') {
          // Load completed events
          setLoading(true);
          setError(null);
          try {
            const data = await fetchEvents(token, {
              clubId,
              player: user.playerId,
              tab: 'Completed',
            });
            setEvents(data.events ?? []);
          } catch (err: any) {
            setError(err?.message ?? 'Unable to load events.');
            setEvents([]);
          } finally {
            setLoading(false);
          }
        } else {
          // Load CURRENT: both Accepting Entries and In Progress
          setLoading(true);
          setError(null);
          try {
            const [acceptingData, inProgressData] = await Promise.all([
              fetchEvents(token, {
                clubId,
                player: user.playerId,
                tab: 'Accepting Entries',
              }),
              fetchEvents(token, {
                clubId,
                player: user.playerId,
                tab: 'In Progress',
              }),
            ]);
            // Combine both arrays
            const combinedEvents = [
              ...(acceptingData.events ?? []),
              ...(inProgressData.events ?? []),
            ];
            // Remove duplicates based on event ID
            const uniqueEvents = combinedEvents.filter((event, index, self) =>
              index === self.findIndex((e) => e.id === event.id)
            );
            setEvents(uniqueEvents);
          } catch (err: any) {
            setError(err?.message ?? 'Unable to load events.');
            setEvents([]);
          } finally {
            setLoading(false);
          }
        }
        return;
      }

      // For ONLINE events, load all and filter client-side
      let tabParam: string | undefined;

      setLoading(true);
      setError(null);
      try {
        const data = await fetchEvents(token, {
          clubId,
          player: user.playerId,
          tab: tabParam,
        });
        const eventsList = data.events ?? [];
        console.log(`[EventsScreen] Loaded ${eventsList.length} events for ${selectedType} (clubId: ${clubId}, tab: ${tabParam || 'none'})`);
        setEvents(eventsList);
      } catch (err: any) {
        console.error('[EventsScreen] Error loading events:', err);
        setError(err?.message ?? 'Unable to load events.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [token, user?.playerId]
  );

  useEffect(() => {
    if (!viewType) {
      setEvents([]);
      setError(null);
      return;
    }

    if (viewType === 'ABT') {
      // For ABT, load events based on the selected tab
      loadEvents(viewType, abtTab);
    } else if (viewType === 'ONLINE') {
      // For ONLINE, load accepting entries (includes repeating qualifiers)
      loadEvents(viewType, undefined);
    }
  }, [viewType, abtTab, loadEvents]);

  const filteredEvents = useMemo(() => {
    let result: EventSummary[];
    
    if (viewType === 'ONLINE') {
      // For ONLINE events, show all accepting entries (includes repeating qualifiers)
      // Filter to show only accepting entries - events that are not completed and not started
      result = events.filter((event) => {
        const hasWinner = event.winner && String(event.winner).trim().length > 0;
        const isStarted = event.isPlayStarted;
        // Show accepting entries: not completed, not started, or repeating qualifiers
        // Repeating qualifiers can be identified by checking if event is in progress but still accepting
        return !hasWinner;
      });
    } else if (viewType === 'ABT') {
      // For ABT events, sort completed tab by most recent first
      if (abtTab === 'COMPLETED') {
        result = [...events].sort((a, b) => eventSortValue(b) - eventSortValue(a));
      } else {
        result = events;
      }
    } else {
      result = events;
    }
    
    return result;
  }, [events, viewType, abtTab]);


  const handleEventPress = useCallback(
    (event: EventSummary) => {
      if (!viewType) return;
      navigation.navigate('EventDetails' as never, {
        eventId: event.id,
        eventName: event.nameWithTournament || event.name,
        clubId: viewType === 'ABT' ? 5 : 2,
        status: getEventStatus(event),
        initialEvent: event,
        viewType,
        initialOnlineTab: viewType === 'ONLINE' ? onlineTab : undefined,
      } as never);
    },
    [navigation, viewType, onlineTab]
  );

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        scrollEnabled
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {viewType && (
          <>
            {!token ? (
              <Text style={styles.helper}>Please sign in to view events.</Text>
            ) : (
              <>
                {viewType === 'ABT' && (
                  <View style={styles.tabsRow}>
                    {ABT_TABS.map((tab) => {
                      const isActive = abtTab === tab.key;
                      return (
                        <TouchableOpacity
                          key={tab.key}
                          style={[
                            styles.tabButton,
                            isActive ? styles.tabButtonActive : undefined,
                          ]}
                          onPress={() => {
                            setAbtTab(tab.key);
                            // Load events for the selected tab
                            if (viewType === 'ABT') {
                              loadEvents(viewType, tab.key);
                            }
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.tabLabel,
                              isActive ? styles.tabLabelActive : undefined,
                            ]}
                          >
                            {tab.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  </View>
                )}

                {!loading && error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => viewType && loadEvents(viewType, viewType === 'ABT' ? abtTab : undefined)}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
              </View>
                )}

                {!loading && !error && (
                  <>
                    {!filteredEvents.length ? (
                      <Text style={styles.helper}>
                        {viewType === 'ABT' 
                          ? `No ${abtTab === 'CURRENT' ? 'current' : 'completed'} events available at the moment.`
                          : 'No events available at the moment.'}
                      </Text>
                    ) : (
                      filteredEvents.map((event) => {
                        // For ONLINE events, determine symbol
                        let eventStatusIcon: any = null;
                        if (viewType === 'ONLINE') {
                          const isEntered = event.userIsEntered === true;
                          const eligibility = (event.userEligibility || '').toLowerCase();
                          if (isEntered) {
                            eventStatusIcon = require('../assets/star.png');
                          } else if (eligibility === 'eligible') {
                            eventStatusIcon = require('../assets/green.png');
                          } else if (eligibility === 'ineligible') {
                            eventStatusIcon = require('../assets/grey.png');
                          }
                        }
                        
                        return (
                          <TouchableOpacity 
                            key={event.id} 
                            style={styles.eventCard}
                            onPress={() => handleEventPress(event)}
                            activeOpacity={0.85}
                          >
                            <View style={styles.eventTitleRow}>
                              <Text style={styles.eventTitle}>{event.nameWithTournament || event.name}</Text>
                            </View>
                            {event.tournament?.name && event.tournament?.name !== event.nameWithTournament ? (
                              <Text style={styles.eventSubTitle}>{event.tournament?.name}</Text>
                            ) : null}
                            <View style={styles.eventMeta}>
                              <Text style={styles.metaLine}>
                                <Text style={styles.metaLabel}>Start: </Text>
                                <Text style={styles.metaValue}>{formatDate(event.start)}</Text>
                              </Text>
                              {eventStatusIcon && (
                                <View style={styles.statusRow}>
                                  <Image source={eventStatusIcon} style={styles.statusIcon} resizeMode="contain" />
                                </View>
                              )}
            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { flexGrow: 1, paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160, gap: theme.spacing.md },
  helper: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing['2xl'] },
  sectionHeading: { ...theme.typography.heading, fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, fontFamily: theme.typography.heading.fontFamily },
  tabsRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabLabel: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '600', fontFamily: theme.typography.body.fontFamily },
  tabLabelActive: { color: theme.colors.surface },
  loadingContainer: { paddingVertical: theme.spacing['4xl'], alignItems: 'center', justifyContent: 'center' },
  errorContainer: { paddingVertical: theme.spacing['3xl'], alignItems: 'center', gap: theme.spacing.md },
  errorText: { ...theme.typography.body, color: theme.colors.error, textAlign: 'center', fontFamily: theme.typography.body.fontFamily },
  retryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing['2xl'], paddingVertical: theme.spacing.sm, borderRadius: theme.radius.md },
  retryText: { ...theme.typography.button, color: theme.colors.surface, fontWeight: '700', fontFamily: theme.typography.button.fontFamily },
  eventCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  eventTitle: { ...theme.typography.heading, fontSize: 18, color: theme.colors.textPrimary, fontFamily: theme.typography.heading.fontFamily, flexWrap: 'wrap' },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  statusIcon: { width: 36, height: 36 },
  eventSubTitle: { ...theme.typography.caption, color: theme.colors.textSecondary, fontFamily: theme.typography.caption.fontFamily },
  eventMeta: { gap: theme.spacing.xs },
  metaLine: { ...theme.typography.body, color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily },
  metaLabel: { ...theme.typography.body, fontWeight: '600', color: theme.colors.textPrimary, fontFamily: theme.typography.body.fontFamily },
  metaValue: { color: theme.colors.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: theme.spacing['2xl'], gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  modalBtn: { backgroundColor: '#1B365D', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700', fontFamily: theme.typography.button.fontFamily },
});
