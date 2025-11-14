import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchMatches, fetchBracketList, fetchBracketInfo, BracketNode, MatchSummary } from '../services/api';

type FlattenedMatch = {
  contestId: number;
  label: string;
  roundOfPlay: number;
  contestants: Array<{ name: string; isWinner: boolean }>;
};

type EventSummary = {
  id: number;
  name: string;
  clubId?: number;
  startTime?: string;
};

const parseEventDate = (value?: string): number => {
  if (!value) return Number.POSITIVE_INFINITY;
  const normalized = value.replace(/-/g, ' ');
  const parsed = new Date(normalized).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
};

const formatEventDate = (value?: string) => {
  if (!value) return null;
  const timestamp = parseEventDate(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Date(timestamp).toLocaleDateString();
};

const getClubLabel = (clubId?: number) => {
  if (clubId === 5) return 'ABT Events';
  if (clubId === 2) return 'Online Events';
  return `Club ${clubId ?? '—'}`;
};

export const BracketsScreen: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EventSummary | null>(null);
  const [filter, setFilter] = useState<'all' | 'remaining' | 'final'>('all');
  const [brackets, setBrackets] = useState<
    Array<{ id: number; name: string; matches: FlattenedMatch[] }>
  >([]);
  const [loadingBrackets, setLoadingBrackets] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) {
      setEventError('Please sign in to view brackets.');
      return;
    }
    setLoadingEvents(true);
    setEventError(null);
    try {
      const [abt, online] = await Promise.all([fetchMatches(token, 5), fetchMatches(token, 2)]);

      const eventMap = new Map<number, EventSummary>();
      const collect = (payload: MatchSummary[], clubId: number) => {
        payload.forEach((match) => {
          const event = match.event;
          if (event?.id) {
            eventMap.set(event.id, {
              id: event.id,
              name: event.name ?? `Event #${event.id}`,
              clubId,
              startTime: match.date,
            });
          }
        });
      };

      collect(Array.isArray(abt) ? abt : [], 5);
      collect(Array.isArray(online) ? online : [], 2);

      const sortedEvents = Array.from(eventMap.values()).sort(
        (a, b) => parseEventDate(a.startTime) - parseEventDate(b.startTime)
      );
      setEvents(sortedEvents);
    } catch (err: any) {
      setEventError(err?.message || 'Unable to load events.');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const flattenMatches = useCallback((nodes: BracketNode[]): FlattenedMatch[] => {
    const matches: FlattenedMatch[] = [];

    const traverse = (node: BracketNode) => {
      if (node.type === 'contest' && node.children) {
        const contestants = node.children.filter((child) => child.type === 'contestant');
        if (contestants.length >= 1) {
          matches.push({
            contestId: node.data?.id ?? Math.random(),
            label: node.data?.label ?? 'Match',
            roundOfPlay: node.data?.roundOfPlay ?? 0,
            contestants: contestants.map((child) => ({
              name: child.data?.entrant?.name ?? 'TBD',
              isWinner: !!child.data?.isWinner,
            })),
          });
        }
      }
      node.children?.forEach(traverse);
    };

    nodes.forEach(traverse);
    return matches;
  }, []);

  const loadBrackets = useCallback(
    async (event: EventSummary, selectedFilter: 'all' | 'remaining' | 'final') => {
      if (!token) {
        return;
      }
      setLoadingBrackets(true);
      setBracketError(null);
      try {
        const list = await fetchBracketList(token, event.id);
        if (!list.length) {
          setBrackets([]);
          setBracketError('No brackets available for this event yet.');
          return;
        }

        const fromRoundParam =
          selectedFilter === 'remaining' ? 0 : selectedFilter === 'final' ? -3 : undefined;

        const infos = await Promise.all(
          list.map((bracket) =>
            fetchBracketInfo(token, bracket.id, fromRoundParam).then((response) => ({
              bracket,
              response,
            }))
          )
        );

        const parsed = infos.map(({ bracket, response }) => {
          const matches = response?.data?.children
            ? flattenMatches(response.data.children)
            : [];
          return {
            id: bracket.id,
            name: bracket.name,
            matches,
          };
        });

        setBrackets(parsed);
      } catch (err: any) {
        setBracketError(err?.message || 'Unable to load bracket information.');
        setBrackets([]);
      } finally {
        setLoadingBrackets(false);
      }
    },
    [token, flattenMatches]
  );

  useEffect(() => {
    if (selectedEvent) {
      loadBrackets(selectedEvent, filter);
    }
  }, [selectedEvent, filter, loadBrackets]);

  const groupedMatches = (matches: FlattenedMatch[]) => {
    const groups = new Map<number, FlattenedMatch[]>();
    matches.forEach((match) => {
      const key = match.roundOfPlay ?? 0;
      const list = groups.get(key) ?? [];
      list.push(match);
      groups.set(key, list);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, list]) => ({ round, matches: list }));
  };

  const renderEvents = () => {
    if (loadingEvents) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (eventError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{eventError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!events.length) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.infoText}>No events available yet.</Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.pageTitle}>Upcoming Events</Text>
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => {
              setSelectedEvent(event);
              setFilter('all');
            }}
          >
            <Text style={styles.eventName}>{event.name}</Text>
            {formatEventDate(event.startTime) && (
              <Text style={styles.eventMeta}>Starts: {formatEventDate(event.startTime)}</Text>
            )}
            <Text style={styles.eventMeta}>{getClubLabel(event.clubId)}</Text>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderBrackets = () => {
    if (!selectedEvent) return null;

    if (loadingBrackets) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (bracketError) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{bracketError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadBrackets(selectedEvent, filter)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!brackets.length) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.infoText}>No bracket data available for this filter.</Text>
        </View>
      );
    }

    return brackets.map((bracket) => {
      const grouped = groupedMatches(bracket.matches);
      return (
        <View key={bracket.id} style={styles.bracketCard}>
          <Text style={styles.bracketTitle}>{bracket.name}</Text>
          {grouped.map((group, groupIndex) => {
            const nextRoundLabel =
              groupIndex === grouped.length - 1 ? 'Champion' : `Round ${group.round + 1}`;
            return (
              <View key={group.round} style={styles.roundBlock}>
                <View style={styles.roundHeader}>
                  <View style={styles.roundIndicator}>
                    <Text style={styles.roundIndicatorText}>{group.round}</Text>
                  </View>
                  <Text style={styles.roundTitle}>Round {group.round}</Text>
                </View>
                {group.matches.map((match) => (
                  <View key={match.contestId} style={styles.matchCard}>
                    <Text style={styles.matchLabel}>{match.label}</Text>
                    {match.contestants.map((contestant, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.contestantRow,
                        contestant.isWinner && styles.contestantRowWinner,
                      ]}
                    >
                      <Text
                        style={[
                          styles.contestantName,
                          contestant.isWinner && styles.contestantNameWinner,
                        ]}
                      >
                        {contestant.name}
                      </Text>
                      {contestant.isWinner ? (
                        <View style={styles.advanceBadge}>
                          <Text style={styles.advanceBadgeText}>Advances to {nextRoundLabel}</Text>
                        </View>
                      ) : null}
                    </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.vContent} showsVerticalScrollIndicator={false}>
        {!selectedEvent ? (
          renderEvents()
        ) : (
          <>
            <TouchableOpacity style={styles.backLink} onPress={() => setSelectedEvent(null)}>
              <Text style={styles.backLinkText}>← Back to Events</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>{selectedEvent.name}</Text>

            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, filter === 'remaining' && styles.filterPillActive]}
                onPress={() => setFilter('remaining')}
              >
                <Text style={[styles.filterText, filter === 'remaining' && styles.filterTextActive]}>
                  Remaining
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, filter === 'final' && styles.filterPillActive]}
                onPress={() => setFilter('final')}
              >
                <Text style={[styles.filterText, filter === 'final' && styles.filterTextActive]}>Final 3</Text>
              </TouchableOpacity>
            </View>

            {renderBrackets()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  vContent: { paddingVertical: theme.spacing['2xl'], paddingHorizontal: theme.spacing['3xl'], paddingBottom: 160, gap: theme.spacing['2xl'] },
  pageTitle: { ...theme.typography.heading, fontWeight: '800', fontSize: 22, color: theme.colors.textPrimary },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing['2xl'],
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: theme.spacing.xs,
  },
  eventName: { ...theme.typography.heading, fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  eventMeta: { ...theme.typography.caption, color: '#6B7280' },
  backLink: { marginTop: theme.spacing.sm },
  backLinkText: { ...theme.typography.caption, color: '#1B365D', fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing.md,
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1B365D',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  filterPillActive: {
    backgroundColor: '#1B365D',
  },
  filterText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: '#1B365D',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
    gap: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
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
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  bracketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  bracketTitle: {
    ...theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  roundBlock: {
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5F5',
    paddingLeft: theme.spacing.lg,
    marginLeft: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roundIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1B365D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundIndicatorText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  roundTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  matchCard: {
    backgroundColor: '#F4F6FB',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  matchLabel: {
    ...theme.typography.caption,
    color: '#4F46E5',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  contestantRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: theme.spacing.xs,
  },
  contestantRowWinner: {
    borderColor: '#1A9E55',
    backgroundColor: '#ECFDF3',
  },
  contestantName: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  contestantNameWinner: {
    fontWeight: '700',
    color: '#047857',
  },
  advanceBadge: {
    backgroundColor: '#1A9E55',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  advanceBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '700',
  },
});


