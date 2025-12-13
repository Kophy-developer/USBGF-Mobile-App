import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import {
  fetchBracketList,
  fetchBracketInfo,
  BracketNode,
  fetchEvents as fetchEventsAPI,
  EventSummary as APIEventSummary,
} from '../services/api';

type EventSummary = {
  id: number;
  name: string;
  clubId?: number;
  startTime?: string;
};

const parseEventDate = (value?: string): number => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const normalized = value.replace(/-/g, ' ');
  const parsed = new Date(normalized).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
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
  const [filter, setFilter] = useState<'all' | 'final'>('all');
  const [selectedBracketId, setSelectedBracketId] = useState<number | null>(null);
  const [brackets, setBrackets] = useState<
    Array<{ id: number; name: string; tree: BracketNode[] }>
  >([]);
  const [loadingBrackets, setLoadingBrackets] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [bracketPickerOpen, setBracketPickerOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!token) {
      setEventError('Please sign in to view brackets.');
      return;
    }
    setLoadingEvents(true);
    setEventError(null);
    try {
      const clubId = 5;
      
      const [currentEvents, completedEvents] = await Promise.all([
        fetchEventsAPI(token, { clubId, playerId: undefined, tab: 'In Progress' }),
        fetchEventsAPI(token, { clubId, playerId: undefined, tab: 'Completed' }),
      ]);

      const eventMap = new Map<number, EventSummary>();
      const collect = (eventsList: APIEventSummary[], club: number, isCompleted: boolean) => {
        eventsList.forEach((event) => {
          if (event?.id) {
            const hasWinner = event.winner && String(event.winner).trim().length > 0;
            if (isCompleted ? hasWinner : !hasWinner) {
              eventMap.set(event.id, {
                id: event.id,
                name: event.nameWithTournament || (event.name ?? `Event #${event.id}`),
                clubId: club,
                startTime:
                  event.start ||
                  event.tournament?.start ||
                  (event as any)?.updatedAt ||
                  (event as any)?.createdAt,
              });
            }
          }
        });
      };

      collect(Array.isArray(currentEvents?.events) ? currentEvents.events : [], clubId, false);
      const acceptingEvents = await fetchEventsAPI(token, {
        clubId,
        playerId: undefined,
        tab: 'Accepting Entries',
      });
      collect(Array.isArray(acceptingEvents?.events) ? acceptingEvents.events : [], clubId, false);
      collect(Array.isArray(completedEvents?.events) ? completedEvents.events : [], clubId, true);

      const sortedEvents = Array.from(eventMap.values()).sort((a, b) => {
        const aTime = parseEventDate(a.startTime);
        const bTime = parseEventDate(b.startTime);
        if (aTime !== bTime) return bTime - aTime;
        return (b.id || 0) - (a.id || 0);
      });
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

  type BracketRound = {
    name: string;
    matches: Array<{
      id: string | number;
      players: Array<string | null>;
      winner: string | null;
    }>;
  };

  const transformBracketToRounds = useCallback((nodes: BracketNode[]): BracketRound[] => {
    const allMatches: Array<{
      round: number;
      id: number;
      players: Array<{ name: string; isWinner: boolean }>;
    }> = [];

    const traverse = (node: BracketNode) => {
      if (node.type === 'contest' && node.children) {
        const contestants = node.children.filter((child) => child.type === 'contestant');
        if (contestants.length >= 1) {
          const round = node.data?.roundOfPlay ?? 0;
          allMatches.push({
            round,
            id: node.data?.id ?? Math.random(),
            players: contestants.map((child) => ({
              name: child.data?.entrant?.name ?? 'TBD',
              isWinner: !!child.data?.isWinner,
            })),
          });
        }
      }
      node.children?.forEach(traverse);
    };

    nodes.forEach(traverse);

    const roundMap = new Map<number, BracketRound['matches']>();
    
    allMatches.forEach((match) => {
      const round = match.round;
      const players = match.players.map((p) => p.name);
      const winner = match.players.find((p) => p.isWinner)?.name || null;
      const matchPlayers: Array<string | null> = [players[0] || null, players[1] || null];

      if (!roundMap.has(round)) {
        roundMap.set(round, []);
      }
      roundMap.get(round)!.push({
        id: match.id,
        players: matchPlayers,
        winner,
      });
    });

    const rounds: BracketRound[] = Array.from(roundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([roundNum, matches]) => ({
        name: roundNum === 0 ? 'Final' : `Round ${roundNum}`,
        matches,
      }));

    return rounds;
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

        const parsed = infos.map(({ bracket, response }) => ({
          id: bracket.id,
          name: bracket.name,
          tree: response?.data?.children || [],
        }));

        setBrackets(parsed);
        if (parsed.length > 0 && !selectedBracketId) {
          setSelectedBracketId(parsed[0].id);
        }
      } catch (err: any) {
        setBracketError(err?.message || 'Unable to load bracket information.');
        setBrackets([]);
      } finally {
        setLoadingBrackets(false);
      }
    },
    [token, selectedBracketId]
  );

  useEffect(() => {
    if (selectedEvent) {
      loadBrackets(selectedEvent, filter);
    }
  }, [selectedEvent, filter, loadBrackets]);

  const selectedBracket = useMemo(() => {
    return brackets.find((b) => b.id === selectedBracketId) || null;
  }, [brackets, selectedBracketId]);

  const bracketRounds = useMemo(() => {
    if (!selectedBracket) return [];
    let rounds = transformBracketToRounds(selectedBracket.tree);
    
    if (filter === 'final' && rounds.length > 0) {
      const maxRoundIndex = rounds.length - 1;
      const startIndex = Math.max(0, maxRoundIndex - 2);
      rounds = rounds.slice(startIndex);
    }
    
    return rounds;
  }, [selectedBracket, filter, transformBracketToRounds]);

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

    const filteredEvents = events;

    if (!filteredEvents.length) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.infoText}>No events available yet.</Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.pageTitle}>ABT Events</Text>
        {filteredEvents.map((event) => (
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

    if (!brackets.length || !selectedBracket) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.infoText}>No bracket data available for this filter.</Text>
        </View>
      );
    }

    const PLAYER_BOX_HEIGHT = 50;
    const GAP_BETWEEN_PLAYERS = 8;
    const MATCH_HEIGHT = PLAYER_BOX_HEIGHT * 2 + GAP_BETWEEN_PLAYERS;
    const VERTICAL_SPACING_BETWEEN_MATCHES = 40;
    const HORIZONTAL_ROUND_SPACING = 100;
    const CONNECTOR_WIDTH = 40;

    return (
      <View style={styles.bracketContainer}>
        <Text style={styles.bracketTitle}>{selectedBracket.name}</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bracketScrollContent}
        >
          <View style={{ flexDirection: 'row' }}>
            {bracketRounds.map((round, roundIndex) => {
              const isLastRound = roundIndex === bracketRounds.length - 1;
              
              return (
                <View key={roundIndex} style={{ marginRight: isLastRound ? 0 : HORIZONTAL_ROUND_SPACING }}>
                  <View style={styles.roundHeaderBox}>
                    <Ionicons name="trophy" size={20} color="#1B365D" />
                    <Text style={styles.roundHeaderText}>{round.name}</Text>
                  </View>

                  <View style={{ marginTop: 20, position: 'relative' }}>
                    {round.matches.map((match, matchIndex) => {
                      const player1 = match.players[0];
                      const player2 = match.players[1];
                      const isPlayer1Winner = player1 === match.winner;
                      const isPlayer2Winner = player2 === match.winner;

                      // Calculate vertical spacing: each subsequent round should center between pairs
                      const verticalMultiplier = Math.pow(2, roundIndex);
                      const baseSpacing = MATCH_HEIGHT + VERTICAL_SPACING_BETWEEN_MATCHES;
                      const topPosition = matchIndex * verticalMultiplier * baseSpacing + 
                                         (verticalMultiplier - 1) * baseSpacing / 2;

                      // Calculate center Y position of this match for connector drawing
                      const matchCenterY = topPosition + MATCH_HEIGHT / 2;

                      return (
                        <View key={match.id}>
                          {/* Draw connectors from previous round if not first round */}
                          {roundIndex > 0 && (
                            <View style={{ position: 'absolute', top: topPosition, left: -CONNECTOR_WIDTH }}>
                              {/* Horizontal line from left connecting to this match */}
                              <View 
                                style={{
                                  position: 'absolute',
                                  top: MATCH_HEIGHT / 2,
                                  left: 0,
                                  width: CONNECTOR_WIDTH,
                                  height: 2,
                                  backgroundColor: '#1B365D',
                                }}
                              />
                              
                              {/* Vertical line connecting two matches from previous round */}
                              {matchIndex * 2 + 1 < bracketRounds[roundIndex - 1].matches.length && (
                                <>
                                  <View 
                                    style={{
                                      position: 'absolute',
                                      top: -verticalMultiplier * baseSpacing / 2 + MATCH_HEIGHT / 2,
                                      left: 0,
                                      width: 2,
                                      height: verticalMultiplier * baseSpacing,
                                      backgroundColor: '#1B365D',
                                    }}
                                  />
                                </>
                              )}
                            </View>
                          )}

                          {/* Match container with players */}
                          <View 
                            style={{
                              position: 'absolute',
                              top: topPosition,
                              left: 0,
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            {/* Player boxes */}
                            <View style={{ gap: GAP_BETWEEN_PLAYERS }}>
                              <View
                                style={[
                                  styles.playerBox,
                                  isPlayer1Winner ? styles.playerBoxWinner : styles.playerBoxLoser,
                                ]}
                              >
                                <Text style={styles.playerNameText}>{player1 || 'TBD'}</Text>
                              </View>

                              <View
                                style={[
                                  styles.playerBox,
                                  isPlayer2Winner ? styles.playerBoxWinner : styles.playerBoxLoser,
                                ]}
                              >
                                <Text style={styles.playerNameText}>{player2 || 'TBD'}</Text>
                              </View>
                            </View>

                            {/* Horizontal connector line extending to the right (except for last round) */}
                            {!isLastRound && (
                              <View 
                                style={{
                                  width: CONNECTOR_WIDTH,
                                  height: 2,
                                  backgroundColor: '#1B365D',
                                  position: 'absolute',
                                  left: 180,
                                  top: MATCH_HEIGHT / 2,
                                }}
                              />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
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
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                  All Rounds
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, filter === 'final' && styles.filterPillActive]}
                onPress={() => setFilter('final')}
              >
                <Text style={[styles.filterText, filter === 'final' && styles.filterTextActive]}>
                  Final 3
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.bracketSelector}
              onPress={() => setBracketPickerOpen(true)}
            >
              <Text style={styles.bracketSelectorText}>
                {selectedBracket?.name || 'Show All Brackets'}
              </Text>
              <Text style={styles.bracketSelectorChevron}>▾</Text>
            </TouchableOpacity>

            {renderBrackets()}
          </>
        )}
      </ScrollView>

      <Modal transparent visible={bracketPickerOpen} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setBracketPickerOpen(false)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Bracket</Text>
          {brackets.map((bracket) => (
            <TouchableOpacity
              key={bracket.id}
              style={[
                styles.eventTypeOption,
                selectedBracketId === bracket.id && styles.eventTypeOptionActive,
              ]}
              onPress={() => {
                setSelectedBracketId(bracket.id);
                setBracketPickerOpen(false);
              }}
            >
              <Text
                style={[
                  styles.eventTypeOptionText,
                  selectedBracketId === bracket.id && styles.eventTypeOptionTextActive,
                ]}
              >
                {bracket.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCancel} onPress={() => setBracketPickerOpen(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  vContent: {
    paddingVertical: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing['3xl'],
    paddingBottom: 160,
    gap: theme.spacing['2xl'],
  },
  pageTitle: {
    ...theme.typography.heading,
    fontWeight: '800',
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
  },
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
  eventName: {
    ...theme.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
  },
  eventMeta: { ...theme.typography.caption, color: '#6B7280', fontFamily: theme.typography.caption.fontFamily },
  backLink: { marginTop: theme.spacing.sm },
  backLinkText: { ...theme.typography.caption, color: '#1B365D', fontWeight: '700', fontFamily: theme.typography.caption.fontFamily },
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
    fontFamily: theme.typography.caption.fontFamily,
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
    fontFamily: theme.typography.button.fontFamily,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: theme.typography.body.fontFamily,
  },
  bracketContainer: {
    marginTop: theme.spacing.lg,
  },
  bracketTitle: {
    ...theme.typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.heading.fontFamily,
  },
  bracketSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  bracketSelectorText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontFamily: theme.typography.body.fontFamily,
  },
  bracketSelectorChevron: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
  },
  bracketScrollContent: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  roundHeaderBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  roundHeaderText: {
    ...theme.typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
  },
  playerBox: {
    width: 180,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  playerBoxWinner: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1B365D',
    borderWidth: 2,
  },
  playerBoxLoser: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  playerNameText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: theme.typography.body.fontFamily,
  },
  eventTypeOption: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.radius.md,
    backgroundColor: '#F9FAFB',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventTypeOptionActive: {
    backgroundColor: '#1B365D',
    borderColor: '#1B365D',
  },
  eventTypeOptionText: {
    ...theme.typography.heading,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontFamily: theme.typography.heading.fontFamily,
  },
  eventTypeOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    ...theme.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.heading.fontFamily,
  },
  modalCancel: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  modalCancelText: {
    ...theme.typography.button,
    color: theme.colors.error,
    fontWeight: '600',
    fontFamily: theme.typography.button.fontFamily,
  },
});
