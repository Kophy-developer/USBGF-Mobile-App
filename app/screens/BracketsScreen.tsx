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

      setEvents(Array.from(eventMap.values()));
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
            {event.startTime && <Text style={styles.eventMeta}>Starts: {event.startTime}</Text>}
            <Text style={styles.eventMeta}>Club: {event.clubId ?? '—'}</Text>
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
          {grouped.map((group) => (
            <View key={group.round} style={styles.roundBlock}>
              <Text style={styles.roundTitle}>Round {group.round}</Text>
              {group.matches.map((match) => (
                <View key={match.contestId} style={styles.matchRow}>
                  {match.contestants.map((contestant, idx) => (
                    <View
                      key={idx}
                      style={[styles.contestantBadge, contestant.isWinner && styles.contestantWinner]}
                    >
                      <Text
                        style={[styles.contestantText, contestant.isWinner && styles.contestantTextWinner]}
                      >
                        {contestant.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
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
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  roundTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  matchRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  contestantBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  contestantWinner: {
    backgroundColor: '#1A9E55',
  },
  contestantText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  contestantTextWinner: {
    color: '#FFFFFF',
  },
});


