import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { EventSummary, fetchEvents } from '../services/api';

type EventType = 'ABT' | 'ONLINE';
type EventStatus = 'ACCEPTING' | 'IN_PROGRESS' | 'COMPLETED';

const ONLINE_TABS: Array<{ key: EventStatus; label: string }> = [
  { key: 'ACCEPTING', label: 'Accepting' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
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

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { token, user } = useAuth();
  const [selectorOpen, setSelectorOpen] = useState(true);
  const [viewType, setViewType] = useState<EventType | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineTab, setOnlineTab] = useState<EventStatus>('ACCEPTING');

  const choose = (t: EventType) => {
    setViewType(t);
    setSelectorOpen(false);
    setError(null);
    setEvents([]);
    if (t === 'ONLINE') {
      setOnlineTab('ACCEPTING');
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (viewType) {
        return;
      }
      setSelectorOpen(true);
      setViewType(null);
      setEvents([]);
      setError(null);
      setOnlineTab('ACCEPTING');
    }, [viewType])
  );

  useEffect(() => {
    const preselect = route.params?.initialViewType as EventType | undefined;
    if (!preselect) {
      return;
    }
    setViewType(preselect);
    setSelectorOpen(false);
    if (preselect === 'ONLINE') {
      const requestedTab = route.params?.initialOnlineTab as EventStatus | undefined;
      setOnlineTab(requestedTab ?? 'ACCEPTING');
    }
    navigation.setParams?.({
      initialViewType: undefined,
      initialOnlineTab: undefined,
    });
  }, [route.params?.initialViewType, route.params?.initialOnlineTab, navigation]);

  const loadEvents = useCallback(
    async (selectedType: EventType) => {
      if (!token) {
        setEvents([]);
        return;
      }

      const clubId = selectedType === 'ABT' ? 5 : 2;

      setLoading(true);
      setError(null);
      try {
        const data = await fetchEvents(token, {
          clubId,
          playerId: user?.playerId,
        });
        setEvents(data.events ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load events.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    },
    [token, user?.playerId]
  );

  useEffect(() => {
    if (viewType) {
      loadEvents(viewType);
    }
  }, [viewType, loadEvents]);

  const filteredEvents = useMemo(() => {
    if (viewType === 'ONLINE') {
      return events.filter((event) => getEventStatus(event) === onlineTab);
    }
    return events;
  }, [events, viewType, onlineTab]);

  const shouldShowCalendarButton = !selectorOpen && viewType === 'ABT';

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!viewType && (
          <Text style={styles.helper}>Select an events type to view</Text>
        )}

        {viewType && (
          <>
            <Text style={styles.sectionHeading}>
              {viewType === 'ABT' ? 'Current ABT Events' : 'Online Events'}
            </Text>

            {!token ? (
              <Text style={styles.helper}>Please sign in to view events.</Text>
            ) : (
              <>
                {viewType === 'ONLINE' && (
                  <View style={styles.tabsRow}>
                    {ONLINE_TABS.map((tab) => (
                      <TouchableOpacity
                        key={tab.key}
                        style={[
                          styles.tabButton,
                          onlineTab === tab.key ? styles.tabButtonActive : undefined,
                        ]}
                        onPress={() => setOnlineTab(tab.key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: onlineTab === tab.key }}
                      >
                        <Text
                          style={[
                            styles.tabLabel,
                            onlineTab === tab.key ? styles.tabLabelActive : undefined,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
                      onPress={() => viewType && loadEvents(viewType)}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!loading && !error && (
                  <>
                    {!filteredEvents.length ? (
                      <Text style={styles.helper}>No events available at the moment.</Text>
                    ) : (
                      filteredEvents.map((event) => {
                        const status = getEventStatus(event);
                        return (
                          <View key={event.id} style={styles.eventCard}>
                            <View style={styles.eventHeader}>
                              <Text style={styles.eventTitle}>{event.nameWithTournament || event.name}</Text>
                              <View style={[styles.statusPill, styles[`status${status}`]]}>
                                <Text style={styles.statusText}>
                                  {status === 'ACCEPTING'
                                    ? 'Accepting'
                                    : status === 'IN_PROGRESS'
                                    ? 'In Progress'
                                    : 'Completed'}
                                </Text>
                              </View>
                            </View>
                            {event.tournament?.name && event.tournament?.name !== event.nameWithTournament ? (
                              <Text style={styles.eventSubTitle}>{event.tournament?.name}</Text>
                            ) : null}
                            <View style={styles.eventMeta}>
                              <Text style={styles.metaLine}>
                                <Text style={styles.metaLabel}>Start: </Text>
                                <Text style={styles.metaValue}>{formatDate(event.start)}</Text>
                              </Text>
                              {event.winner ? (
                                <Text style={styles.metaLine}>
                                  <Text style={styles.metaLabel}>Winner: </Text>
                                  <Text style={styles.metaValue}>{event.winner}</Text>
                                </Text>
                              ) : null}
                              <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => handleEventPress(event)}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.viewButtonText}>View Event</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {shouldShowCalendarButton && (
          <TouchableOpacity 
            style={styles.calendarBtn}
            onPress={() => navigation.navigate('ABTCalendar' as never)}
          >
            <Text style={styles.calendarText}>View ABT Calendar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal transparent visible={selectorOpen} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectorOpen(false)} />
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalBtn} onPress={() => choose('ABT')}>
            <Text style={styles.modalBtnText}>Current ABT Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalBtn} onPress={() => choose('ONLINE')}>
            <Text style={styles.modalBtnText}>Online Events</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160, gap: theme.spacing.md },
  helper: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing['2xl'] },
  sectionHeading: { ...theme.typography.heading, fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
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
  tabLabel: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '600' },
  tabLabelActive: { color: theme.colors.surface },
  loadingContainer: { paddingVertical: theme.spacing['4xl'], alignItems: 'center', justifyContent: 'center' },
  errorContainer: { paddingVertical: theme.spacing['3xl'], alignItems: 'center', gap: theme.spacing.md },
  errorText: { ...theme.typography.body, color: theme.colors.error, textAlign: 'center' },
  retryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing['2xl'], paddingVertical: theme.spacing.sm, borderRadius: theme.radius.md },
  retryText: { ...theme.typography.button, color: theme.colors.surface, fontWeight: '700' },
  eventCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, alignItems: 'center' },
  eventTitle: { ...theme.typography.heading, fontSize: 18, color: theme.colors.textPrimary, flex: 1 },
  eventSubTitle: { ...theme.typography.caption, color: theme.colors.textSecondary },
  statusPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
  },
  statusACCEPTING: { backgroundColor: '#1B365D' },
  statusIN_PROGRESS: { backgroundColor: '#1A9E55' },
  statusCOMPLETED: { backgroundColor: '#52525B' },
  statusText: { ...theme.typography.button, color: theme.colors.surface, fontWeight: '700' },
  eventMeta: { gap: theme.spacing.xs },
  metaLine: { ...theme.typography.body, color: theme.colors.textSecondary },
  metaLabel: { fontWeight: '600', color: theme.colors.textPrimary },
  metaValue: { color: theme.colors.textSecondary },
  viewButton: {
    marginTop: theme.spacing.lg,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  viewButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  calendarBtn: { backgroundColor: '#1B365D', alignSelf: 'center', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: theme.spacing['2xl'] },
  calendarText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: theme.spacing['2xl'], gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  modalBtn: { backgroundColor: '#1B365D', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },
});
