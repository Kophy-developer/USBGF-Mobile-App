import React, { useCallback, useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Pressable,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import {
  fetchMatches,
  fetchUpcomingMatches,
  MatchSummary,
  UpcomingMatchesPayload,
  reportMatchResult,
  unreportMatch,
  fetchEvents,
  EventSummary,
} from '../services/api';

type EventType = 'ABT' | 'ONLINE';
type TabType = 'current' | 'history';

const Chevron: React.FC = () => (
  <Text style={{ ...theme.typography.body, fontSize: 18 }}>▾</Text>
);

const formatDate = (value?: string) => {
  if (!value) return 'Date TBD';
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

const parseMatchDateTime = (value?: string): number => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;

  const parts = value.split(/[-\s]/).filter(Boolean);
  if (parts.length === 3) {
    const [yearRaw, monthRaw, dayRaw] = parts;
    const year = parseInt(yearRaw, 10);
    const month = MONTH_MAP[monthRaw.toLowerCase()] ?? Number.NaN;
    const day = parseInt(dayRaw, 10);
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return Date.UTC(year, month, day);
    }
  }

  return Number.NEGATIVE_INFINITY;
};

const matchSortValue = (m: any): number => {
  const primary = m?.date || m?.deadline || m?.event?.start;
  const fallback = m?.event?.tournament?.start || m?.updatedAt || m?.createdAt;
  const tsPrimary = parseMatchDateTime(primary);
  if (tsPrimary !== Number.NEGATIVE_INFINITY) return tsPrimary;
  const tsFallback = parseMatchDateTime(fallback);
  return tsFallback;
};

export const MatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { token, user } = useAuth();

  const [viewType, setViewType] = useState<EventType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [upcomingData, setUpcomingData] = useState<UpcomingMatchesPayload | null>(null);
  const [availableEvents, setAvailableEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportedMatches, setReportedMatches] = useState<Set<string>>(new Set());
  const reportedMatchesRef = useRef<Set<string>>(new Set());
  const [reportedEntrants, setReportedEntrants] = useState<Record<string, number | string>>({});
  const reportedEntrantsRef = useRef<Record<string, number | string>>({});

  // Load reported matches / entrants from AsyncStorage on mount
  useEffect(() => {
    loadReportedMatches();
    loadReportedEntrants();
  }, []);

  // Set viewType from route params or default to ABT
  useEffect(() => {
    const routeViewType = route.params?.viewType as EventType | undefined;
    if (routeViewType === 'ABT' || routeViewType === 'ONLINE') {
      setViewType(routeViewType);
    } else {
      // Default to ABT if no param provided
      setViewType('ABT');
    }
  }, [route.params?.viewType]);

  const loadReportedMatches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('reportedMatches');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        const set = new Set(parsed);
        setReportedMatches(set);
        reportedMatchesRef.current = set;
      }
    } catch (error) {
      console.error('Error loading reported matches:', error);
    }
  }, []);

  const saveReportedMatch = useCallback(async (contestId: number) => {
    try {
      const key = `contest_${contestId}`;
      const newSet = new Set(reportedMatchesRef.current);
      newSet.add(key);
      setReportedMatches(newSet);
      reportedMatchesRef.current = newSet;
      await AsyncStorage.setItem('reportedMatches', JSON.stringify(Array.from(newSet)));
    } catch (error) {
      console.error('Error saving reported match:', error);
    }
  }, []);

  const removeReportedMatch = useCallback(async (contestId: number) => {
    try {
      const key = `contest_${contestId}`;
      const newSet = new Set(reportedMatchesRef.current);
      newSet.delete(key);
      setReportedMatches(newSet);
      reportedMatchesRef.current = newSet;
      await AsyncStorage.setItem('reportedMatches', JSON.stringify(Array.from(newSet)));
    } catch (error) {
      console.error('Error removing reported match:', error);
    }
  }, []);

  const loadReportedEntrants = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('reportedEntrants');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number | string>;
        setReportedEntrants(parsed);
        reportedEntrantsRef.current = parsed;
      }
    } catch (error) {
      console.error('Error loading reported entrants:', error);
    }
  }, []);

  const saveReportedEntrant = useCallback(async (contestId: number | string | undefined, entrantId: number | string | undefined) => {
    if (!contestId || !entrantId) return;
    try {
      const key = `contest_${contestId}`;
      const next = { ...reportedEntrantsRef.current, [key]: entrantId };
      reportedEntrantsRef.current = next;
      setReportedEntrants(next);
      await AsyncStorage.setItem('reportedEntrants', JSON.stringify(next));
    } catch (error) {
      console.error('Error saving reported entrant:', error);
    }
  }, []);

  const removeReportedEntrant = useCallback(async (contestId: number | string | undefined) => {
    if (!contestId) return;
    try {
      const key = `contest_${contestId}`;
      const next = { ...reportedEntrantsRef.current };
      delete next[key];
      reportedEntrantsRef.current = next;
      setReportedEntrants(next);
      await AsyncStorage.setItem('reportedEntrants', JSON.stringify(next));
    } catch (error) {
      console.error('Error removing reported entrant:', error);
    }
  }, []);

  useLayoutEffect(() => {
    if (viewType === 'ONLINE') {
      navigation.setOptions({
        title: 'Online Matches',
      });
    } else if (viewType === 'ABT') {
      navigation.setOptions({
        title: 'ABT Matches',
      });
    } else {
      navigation.setOptions({
        title: 'Matches',
      });
    }
  }, [viewType, navigation]);

  useFocusEffect(
    useCallback(() => {
      // Set viewType from route params when screen comes into focus
      const routeViewType = route.params?.viewType as EventType | undefined;
      if (routeViewType === 'ABT' || routeViewType === 'ONLINE') {
        setViewType(routeViewType);
      } else {
        setViewType('ABT'); // Default to ABT
      }
      setMatches([]);
      setUpcomingData(null);
      setAvailableEvents([]);
      setError(null);
      setActiveTab('current');
    }, [route.params?.viewType])
  );

  const loadHistoryMatches = useCallback(
    async (selectedType: EventType, silent = false) => {
      if (!token) {
        setMatches([]);
        setError('Please sign in to view matches.');
        return;
      }

      const clubId = selectedType === 'ABT' ? 5 : 2;
      if (!silent) {
      setLoading(true);
      }
      setError(null);

      try {
        const matchesData = await fetchMatches(token, clubId);

        // Enrich matches with cached entrantIds (from upcoming) if present
        const enrichedMatches = (Array.isArray(matchesData) ? matchesData : []).map((m) => {
          const contestId = m.contestId ?? m.contest?.id;
          const cachedEntrant =
            contestId && reportedEntrantsRef.current[`contest_${contestId}`]
              ? reportedEntrantsRef.current[`contest_${contestId}`]
              : undefined;
          if (cachedEntrant && !m.entrantId) {
            return {
              ...m,
              entrantId: cachedEntrant,
              contestantId: m.contestantId ?? m.factContestantId ?? cachedEntrant,
            };
          }
          return m;
        }).sort((a, b) => {
          const tA = matchSortValue(a);
          const tB = matchSortValue(b);
          if (tA !== tB) return tB - tA;
          return (b.contestId ?? b.matchId ?? 0) - (a.contestId ?? a.matchId ?? 0);
        });

        setMatches(enrichedMatches);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load matches.');
        setMatches([]);
      } finally {
        if (!silent) {
        setLoading(false);
        }
      }
    },
    [token]
  );

  const loadCurrentMatches = useCallback(
    async (selectedType: EventType, silent = false) => {
      if (!token || !user?.playerId) {
        setUpcomingData(null);
        setAvailableEvents([]);
        setError('Please sign in to view matches.');
        return;
      }

      const clubId = selectedType === 'ABT' ? 5 : 2;
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        console.log(`[Matches Screen] Loading ${selectedType} matches:`, {
          clubId,
          playerId: user.playerId,
          hasToken: !!token,
          tokenLength: token?.length,
        });

        const [upcomingData, eventsData] = await Promise.all([
          fetchUpcomingMatches(token, { clubId, playerId: user.playerId }),
          selectedType === 'ONLINE' ? fetchEvents(token, { clubId: 2, playerId: user.playerId }) : Promise.resolve({ events: [] }),
        ]);
        
        console.log(`[Matches Screen] ${selectedType} matches loaded successfully:`, {
          upcomingDataKeys: upcomingData ? Object.keys(upcomingData) : null,
          eventsCount: eventsData?.events?.length ?? 0,
        });
        
        // Cache entrantId by contest for fast unreport later
        const cacheEntrantIds = (list: any[]) => {
          (list || []).forEach((m) => {
            const contestId = m?.contestId ?? m?.contest?.id;
            const entrantId = m?.entrantId;
            if (contestId && entrantId) {
              saveReportedEntrant(contestId, entrantId);
            }
          });
        };

        setUpcomingData(upcomingData ?? null);
        cacheEntrantIds(upcomingData?.awaitingResults || []);
        cacheEntrantIds(upcomingData?.awaitingOpponent || []);
        cacheEntrantIds(upcomingData?.awaitingDraw || []);
        
        if (selectedType === 'ONLINE' && eventsData?.events) {
          const acceptingEvents = eventsData.events.filter((event) => {
            const hasWinner = event.winner && String(event.winner).trim().length > 0;
            const isStarted = event.isPlayStarted;
            return !hasWinner && !isStarted && !event.userIsEntered;
          });
          setAvailableEvents(acceptingEvents);
        } else {
          setAvailableEvents([]);
        }
      } catch (err: any) {
        console.error(`[Matches Screen] Error loading ${selectedType} matches:`, {
          error: err,
          message: err?.message,
          stack: err?.stack,
        });
        
        // Check if it's an authentication error
        const errorMessage = err?.message || '';
        if (errorMessage.toLowerCase().includes('unauthorized') || 
            errorMessage.toLowerCase().includes('401') ||
            errorMessage.toLowerCase().includes('authentication')) {
          setError('Your session has expired. Please sign in again.');
        } else {
          setError(err?.message ?? 'Unable to load matches.');
        }
        setUpcomingData(null);
        setAvailableEvents([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [token, user?.playerId]
  );

  const loadData = useCallback(
    async (selectedType: EventType, tab: TabType, silent = false) => {
      if (tab === 'history') {
        await loadHistoryMatches(selectedType, silent);
      } else {
        await loadCurrentMatches(selectedType, silent);
      }
    },
    [loadHistoryMatches, loadCurrentMatches]
  );

  useEffect(() => {
    if (viewType) {
      loadData(viewType, activeTab);
    } else {
      setMatches([]);
      setUpcomingData(null);
      setAvailableEvents([]);
      setError(null);
    }
  }, [viewType, activeTab, loadData]);

  const matchItems = useMemo(() => {
    return matches.map((match, index) => {
      const eventName = match.event?.name ?? 'Event TBD';
      const opponent = match.opponent?.name ?? 'Opponent TBD';
      return {
        key: match.matchId ?? `${eventName}-${index}`,
        eventName,
        opponent,
        deadline: match.date ? formatDate(match.date) : null,
        length: match.matchLength ? `${match.matchLength} pt` : null,
        matchPoints:
          match.matchPoints != null && match.matchPoints !== ''
            ? `${match.matchPoints}`
            : null,
        rating:
          match.playerRating != null && match.playerRating !== ''
            ? `${match.playerRating}`
            : null,
        result: match.result ?? null,
        matchFile: match.matchFile ?? null,
      };
    });
  }, [matches]);

  const handleOpenMatchFile = useCallback((url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
    });
  }, []);

  const handleReportMatch = useCallback(async (item: any, outcome: 'WIN' | 'LOSS') => {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to report a match.');
      return;
    }

    const contestId: number | undefined = item?.contestId ?? item?.contest?.id;
    const userFactContestantId: number | undefined =
      item?.factContestantId ?? item?.contestantId ?? item?.entrantId;
    const opponentFactContestantId: number | undefined =
      item?.opponent?.factContestantId ?? item?.opponent?.contestantId ?? item?.opponent?.entrantId;
    const winnerFactContestantId =
      outcome === 'WIN' ? userFactContestantId : opponentFactContestantId;

    if (!contestId || !winnerFactContestantId) {
      Alert.alert('Unable to report match', 'Missing match identifiers.');
      return;
    }


    // Show confirmation dialog
    Alert.alert(
      'Confirm Match Result',
      `Are you sure you want to report this match as a ${outcome === 'WIN' ? 'WIN' : 'LOSS'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              console.log('[ABT Matches] Reporting match payload:', {
                contestId,
                winnerFactContestantId,
                outcome,
                opponent: item?.opponent?.name,
                eventId: item?.event?.id,
                entrantId: item?.entrantId,
                contestantId: item?.contestantId,
                factContestantId: item?.factContestantId,
              });
              await reportMatchResult(token, {
                contestId,
                winnerFactContestantId,
              });
              // Track this match as reported locally
              await saveReportedMatch(contestId);
              Alert.alert(
                'Match Reported',
                outcome === 'WIN' ? 'Result submitted as a win.' : 'Result submitted as a loss.'
              );
              if (viewType) {
                loadData(viewType, 'current', true);
    }
            } catch (err: any) {
              Alert.alert('Unable to report match', err?.message ?? 'Please try again later.');
            }
          },
        },
      ]
    );
  }, [token, viewType, loadData]);

  const handleRetry = useCallback(() => {
    if (viewType) {
      loadData(viewType, activeTab);
    }
  }, [viewType, activeTab, loadData]);

  const renderAwaitingResults = () => {
    let awaitingResults = upcomingData?.awaitingResults ?? [];
    awaitingResults = awaitingResults
      .slice()
      .sort((a, b) => {
        const tA = matchSortValue(a);
        const tB = matchSortValue(b);
        // For Online matches, sort ascending (earliest first); for ABT, sort descending (latest first)
        if (tA !== tB) {
          return viewType === 'ONLINE' ? tA - tB : tB - tA;
        }
        return viewType === 'ONLINE' 
          ? (a.contestId ?? a.matchId ?? 0) - (b.contestId ?? b.matchId ?? 0)
          : (b.contestId ?? b.matchId ?? 0) - (a.contestId ?? a.matchId ?? 0);
      });
    
    // Filter out locally reported matches (they'll show with un-report button instead)
    // But we still want to show them if they're in our local tracking
    // So we'll show all matches, but mark which ones are reported locally
    
    if (awaitingResults.length === 0) return null;

    return (
      <>
        <Text style={styles.sectionHeading}>Awaiting Match Result</Text>
        {awaitingResults.map((item, index) => {
          const id = `${item.contestId ?? item.opponent?.id ?? index}-${index}`;
          const isOpen = true;
          const canReportMatch =
            item.actions?.isAllowReportMatch &&
            item.contestId &&
            ((item.factContestantId ?? item.contestantId ?? item.entrantId) ||
              item.opponent?.factContestantId);
          // Check if match is reported: either from API response or from local tracking
          const contestId = item.contestId ?? item.contest?.id;
          const isReportedBackend = !!item.reportedResult || item.result === 'W' || item.result === 'L';
          // For current/awaiting matches, ignore stale local flags if backend shows no result
          const isReported = isReportedBackend;
          const entrantForUnreport =
            item.entrantId ??
            item.contestantId ??
            item.factContestantId ??
            (contestId ? reportedEntrantsRef.current[`contest_${contestId}`] : undefined);
          const canUnreport =
            isReported && !!entrantForUnreport;

          const opponentId = item.opponent?.id ?? item.opponent?.playerId;
          const opponentName = item.opponent?.name ?? 'Opponent TBD';

          return (
            <View key={id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={{ flex: 1 }}>
                  {opponentId ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('Contact' as never, {
                          name: opponentName,
                          playerId: opponentId,
                        } as never);
                      }}
                      style={styles.nameContainer}
                    >
                      <Text style={[styles.entryName, styles.entryNameLink]}>💬 {opponentName}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.entryName}>{opponentName}</Text>
                  )}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      if (item.event?.id) {
                        navigation.navigate('EventDetails' as never, {
                          eventId: item.event.id,
                          eventName: item.event.name,
                        } as never);
                      }
                    }}
                  >
                    <Text style={[styles.entryEvent, styles.entryEventLink]}>{item.event?.name ?? 'Event TBD'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.entryDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Round</Text>
                  <Text style={styles.detailValue}>{item.round ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Format</Text>
                  <Text style={styles.detailValue}>{item.contestFormat ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deadline</Text>
                  <Text style={styles.detailValue}>{item.deadline ?? '—'}</Text>
                </View>
                {canUnreport ? (
                  <View style={[styles.detailRow, styles.detailReport]}>
                    <Text style={styles.detailLabel}>Report</Text>
                    <View style={styles.reportContainer}>
                      <TouchableOpacity
                        style={[styles.reportBadge, styles.reportUnreport]}
                        onPress={() => {
                          Alert.alert(
                            'Un-report Match',
                            'Are you sure you want to un-report this match?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Un-report',
                                style: 'destructive',
                                onPress: async () => {
                                  const entrantId = entrantForUnreport;
                                  if (!entrantId) {
                                    Alert.alert('Error', 'Unable to un-report match: missing entrant ID.');
                                    return;
                                  }

                                  try {
                                    await unreportMatch(token, { entrantId });
                                    // Remove from local tracking
                                    if (contestId) {
                                      await removeReportedMatch(contestId);
                                    }
                                    // Refresh data
                                    if (viewType) {
                                      loadData(viewType, 'current', true);
                                    }
                                    Alert.alert(
                                      'Match Un-reported',
                                      'The match result has been successfully un-reported.'
                                    );
                                  } catch (err: any) {
                                    Alert.alert('Unable to un-report match', err?.message ?? 'Please try again later.');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.reportText}>Un-report</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : canReportMatch ? (
                  <View style={[styles.detailRow, styles.detailReport]}>
                    <Text style={styles.detailLabel}>Report</Text>
                    <View style={styles.reportContainer}>
                      <>
                        <TouchableOpacity
                          style={[styles.reportBadge, styles.reportWin]}
                          onPress={() => handleReportMatch(item, 'WIN')}
                        >
                          <Text style={styles.reportText}>W</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.reportBadge, styles.reportLoss]}
                          onPress={() => handleReportMatch(item, 'LOSS')}
                        >
                          <Text style={styles.reportText}>L</Text>
                        </TouchableOpacity>
                      </>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </>
    );
  };

  const renderAwaitingOpponents = () => {
    const awaitingOpponents = (upcomingData?.awaitingOpponent ?? []).slice().sort((a, b) => {
      const tA = matchSortValue(a);
      const tB = matchSortValue(b);
      if (tA !== tB) return tB - tA;
      return (b.contestId ?? b.matchId ?? 0) - (a.contestId ?? a.matchId ?? 0);
    });
    if (awaitingOpponents.length === 0) return null;

    return (
      <>
        <Text style={styles.sectionHeading}>Awaiting Opponent</Text>
        {awaitingOpponents.map((item, index) => (
          <View key={`${item.event?.id ?? index}-${index}`} style={styles.simpleCard}>
            <Text style={styles.entryName}>
              {item.awaitingWOrL ? `${item.awaitingWOrL}: ${item.awaiting?.p1?.name ?? 'TBD'} vs ${item.awaiting?.p2?.name ?? 'TBD'}` : 'Awaiting Opponent'}
                </Text>
            <Text style={styles.entryEvent}>{item.event?.name ?? 'Event TBD'}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Round</Text>
              <Text style={styles.detailValue}>{item.round ?? '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Format</Text>
              <Text style={styles.detailValue}>{item.contestFormat ?? '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deadline</Text>
              <Text style={styles.detailValue}>{item.deadline ?? '—'}</Text>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderAwaitingDraw = () => {
    const awaitingDraw = (upcomingData?.awaitingDraw ?? []).slice().sort((a, b) => {
      const tA = matchSortValue(a);
      const tB = matchSortValue(b);
      if (tA !== tB) return tB - tA;
      return (b.contestId ?? b.matchId ?? 0) - (a.contestId ?? a.matchId ?? 0);
    });
    if (awaitingDraw.length === 0) return null;

    return (
      <>
        <Text style={styles.sectionHeading}>Awaiting Draw</Text>
        {awaitingDraw.map((item, index) => (
          <View key={`${item.event?.id ?? index}-${index}`} style={styles.simpleCard}>
            <Text style={styles.entryName}>{item.event?.name ?? 'Event TBD'}</Text>
            <Text style={styles.entryEvent}>{item.bracket?.name ?? 'Bracket TBD'}</Text>
          </View>
        ))}
      </>
    );
  };

  const renderAvailableEvents = () => {
    if (availableEvents.length === 0) return null;

    return (
      <>
        <Text style={styles.sectionHeading}>Events You Can Enter</Text>
        {availableEvents.map((event) => (
                <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => {
              navigation.navigate('EventDetails' as never, {
                eventId: event.id,
                eventName: event.nameWithTournament || event.name,
                clubId: 2,
                viewType: 'ONLINE',
              } as never);
            }}
          >
            <Text style={styles.eventTitle}>{event.nameWithTournament || event.name}</Text>
            <Text style={styles.eventMeta}>Start: {formatDate(event.start)}</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderHistoryTab = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
        </View>
      );
    }

    if (!matchItems.length) {
      return <Text style={styles.helper}>No match history available.</Text>;
    }

    return (
      <View style={styles.cardStack}>
        {matchItems.map((item) => {
          const resultFlag = item.result?.toString().toUpperCase() ?? null;
          const badgeStyle =
            resultFlag === 'W'
              ? styles.badgeWin
              : resultFlag === 'L'
              ? styles.badgeLoss
              : styles.badgePending;
          const badgeLabel =
            resultFlag === 'W'
              ? 'Won'
              : resultFlag === 'L'
              ? 'Lost'
              : resultFlag === 'BYE'
              ? 'Bye'
              : 'Upcoming';
          const secondaryLines = [
            item.length ? `Length • ${item.length}` : null,
            item.rating ? `Rating • ${item.rating}` : null,
          ].filter(Boolean);

          return (
            <View key={item.key} style={styles.matchCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchOpponent}>{item.opponent}</Text>
                  <Text style={styles.matchEvent}>{item.eventName}</Text>
                </View>
                <View style={[styles.resultBadge, badgeStyle]}>
                  <Text style={styles.badgeText}>{badgeLabel}</Text>
                </View>
              </View>

              <View style={styles.cardMeta}>
                {item.deadline ? (
                  <Text style={styles.metaPrimary}>{item.deadline}</Text>
                ) : null}
                {secondaryLines.length ? (
                  <Text style={styles.metaSecondary}>
                    {secondaryLines.join('   •   ')}
                  </Text>
              ) : null}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderCurrentTab = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (viewType === 'ABT') {
      // For ABT, show all sections in order: awaiting results, awaiting opponent, awaiting draw
      const hasContent =
        (upcomingData?.awaitingResults?.length ?? 0) > 0 ||
        (upcomingData?.awaitingOpponent?.length ?? 0) > 0 ||
        (upcomingData?.awaitingDraw?.length ?? 0) > 0;

      if (!hasContent) {
        return <Text style={styles.helper}>No current matches at the moment.</Text>;
      }

      return (
        <>
          {renderAwaitingResults()}
          {renderAwaitingOpponents()}
          {renderAwaitingDraw()}
        </>
      );
    }

    // For ONLINE, show pending matches first, then awaiting draw
    const hasContent =
      (upcomingData?.awaitingResults?.length ?? 0) > 0 ||
      (upcomingData?.awaitingOpponent?.length ?? 0) > 0 ||
      (upcomingData?.awaitingDraw?.length ?? 0) > 0;

    if (!hasContent) {
      return <Text style={styles.helper}>No current matches at the moment.</Text>;
    }

    return (
      <>
        {renderAwaitingResults()}
        {renderAwaitingOpponents()}
        {renderAwaitingDraw()}
      </>
    );
  };

  const renderBody = () => {
    if (!viewType) {
      return <Text style={styles.helper}>Loading matches...</Text>;
    }

    if (!token) {
      return <Text style={styles.helper}>Please sign in to view matches.</Text>;
    }

    return (
      <>
        {(viewType === 'ONLINE' || viewType === 'ABT') && (
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'current' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('current');
                if (viewType) {
                  loadData(viewType, 'current', false);
                }
              }}
            >
              <Text style={[styles.tabLabel, activeTab === 'current' && styles.tabLabelActive]}>
                Current
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab('history');
                if (viewType) {
                  loadData(viewType, 'history', false);
                }
              }}
            >
              <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
                History
        </Text>
            </TouchableOpacity>
          </View>
        )}
        {activeTab === 'current' ? renderCurrentTab() : renderHistoryTab()}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          viewType ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData(viewType, activeTab, true).finally(() => setRefreshing(false));
              }}
            />
          ) : undefined
        }
      >
        {renderBody()}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: 160,
    gap: theme.spacing['2xl'],
  },
  helper: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['2xl'],
  },
  sectionHeading: {
    ...theme.typography.heading,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
  },
  listHeader: {
    gap: 4,
  },
  cardStack: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  matchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(27, 54, 93, 0.08)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  matchOpponent: {
    ...theme.typography.heading,
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
  },
  matchEvent: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontFamily: theme.typography.caption.fontFamily,
  },
  resultBadge: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 6,
    backgroundColor: '#CBD5F5',
  },
  badgeWin: {
    backgroundColor: '#1A9E55',
  },
  badgeLoss: {
    backgroundColor: '#DA291C',
  },
  badgePending: {
    backgroundColor: '#1B365D',
  },
  badgeText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
  cardMeta: {
    gap: 4,
  },
  metaPrimary: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
  },
  metaSecondary: {
    ...theme.typography.caption,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.caption.fontFamily,
  },
  fileButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing['2xl'],
    backgroundColor: '#1B365D',
  },
  fileButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  awaitingSection: {
    marginTop: theme.spacing['3xl'],
    gap: theme.spacing.md,
  },
  awaitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(27, 54, 93, 0.12)',
    backgroundColor: 'rgba(27, 54, 93, 0.04)',
  },
  awaitTitle: {
    ...theme.typography.body,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
  },
  awaitSubtitle: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: theme.typography.caption.fontFamily,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.radius.md,
  },
  retryText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
  calendarBtn: {
    backgroundColor: '#1B365D',
    alignSelf: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: theme.spacing['2xl'],
  },
  calendarText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing['2xl'],
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBtn: {
    backgroundColor: '#1B365D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#1B365D',
  },
  modalSecondaryText: {
    color: '#1B365D',
  },
  modalBtnText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
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
  tabLabel: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontFamily: theme.typography.body.fontFamily,
  },
  tabLabelActive: {
    color: theme.colors.surface,
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  entryName: {
    ...theme.typography.body,
    fontWeight: '700',
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
  },
  entryNameLink: {
    color: '#1B365D',
    textDecorationLine: 'underline',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryEvent: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.caption.fontFamily,
  },
  entryEventLink: {
    color: '#1B365D',
    textDecorationLine: 'underline',
  },
  entryDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontFamily: theme.typography.caption.fontFamily,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontFamily: theme.typography.body.fontFamily,
  },
  detailReport: {
    alignItems: 'flex-start',
  },
  reportContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  reportBadge: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportWin: {
    backgroundColor: '#1A9E55',
  },
  reportLoss: {
    backgroundColor: '#DA291C',
  },
  reportUnreport: {
    backgroundColor: '#6B7280',
  },
  reportText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '700',
    fontFamily: theme.typography.caption.fontFamily,
  },
  reportHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.caption.fontFamily,
  },
  simpleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  eventCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  eventTitle: {
    ...theme.typography.heading,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
  },
  eventMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.caption.fontFamily,
  },
});

