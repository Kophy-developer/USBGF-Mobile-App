import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';

type Match = { top: string; bottom: string; winner?: string };
type Round = { title: string; points: string; by: string; matches: Match[] };

const SAMPLE: Round[] = [
  {
    title: 'Round 1',
    points: '13 Points',
    by: 'By: 2025-09-03',
    matches: [
      { top: 'Catherine Winfree', bottom: 'Jeanna Kish', winner: 'Jeanna Kish' },
      { top: 'Marjie Harbrecht', bottom: 'Irina Litzenberger', winner: 'Marjie Harbrecht' },
      { top: 'Amy Latek', bottom: 'Erica Wutka', winner: 'Amy Latek' },
      { top: 'Lynda Clay', bottom: 'Marianne Bowen', winner: 'Lynda Clay' },
      { top: 'Cameron Stangel', bottom: 'Mary Morse', winner: 'Mary Morse' },
      { top: 'Genna Cowan', bottom: 'Kat Denison', winner: 'Genna Cowan' },
      { top: 'Vera Holley', bottom: 'Teri Harmon', winner: 'Teri Harmon' },
    ],
  },
  {
    title: 'Round 2',
    points: '13 Points',
    by: 'By: 2025-09-17',
    matches: [
      { top: 'Jeanna Kish', bottom: 'Marjie Harbrecht', winner: 'Jeanna Kish' },
      { top: 'Amy Latek', bottom: 'Lynda Clay', winner: 'Lynda Clay' },
      { top: 'Mary Morse', bottom: 'Genna Cowan', winner: 'Genna Cowan' },
      { top: 'Teri Harmon', bottom: '—' },
    ],
  },
  {
    title: 'Round 3',
    points: '13 Points',
    by: 'By: 2025-10-01',
    matches: [
      { top: 'Jeanna Kish', bottom: 'Lynda Clay', winner: 'Lynda Clay' },
      { top: 'Genna Cowan', bottom: 'Teri Harmon', winner: 'Antoinette-Marie Will…' },
    ],
  },
  {
    title: 'Round 4',
    points: '13 Points',
    by: 'By: 2025-10-15',
    matches: [
      { top: 'Lynda Clay', bottom: 'Antoinette-Marie Will…', winner: 'Antoinette-Marie Will…' },
    ],
  },
];

const BRACKET_EVENTS = [
  {
    id: 'viking-classic',
    name: 'Viking Classic',
    location: 'Minnesota',
    rounds: SAMPLE,
  },
  {
    id: 'boston-open',
    name: 'Boston Open',
    location: 'Massachusetts',
    rounds: SAMPLE,
  },
];

const RoundHeader: React.FC<{ title: string; points: string; by: string }> = ({ title, points, by }) => (
  <View style={styles.roundHeader}> 
    <Text style={styles.roundTitle}>{title}</Text>
    <Text style={styles.roundMeta}>{points}</Text>
    <Text style={styles.roundMeta}>{by}</Text>
  </View>
);

const MatchBox: React.FC<Match> = ({ top, bottom, winner }) => (
  <View style={styles.matchBox}>
    <View style={[styles.playerRow, winner === top && styles.winnerRow]}>
      <Text numberOfLines={1} style={styles.playerText}>{top}</Text>
    </View>
    <View style={[styles.playerRow, winner === bottom && styles.winnerRow]}> 
      <Text numberOfLines={1} style={styles.playerText}>{bottom}</Text>
    </View>
  </View>
);

export const BracketsScreen: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'remaining' | 'final3'>('all');

  const selectedEvent = React.useMemo(
    () => BRACKET_EVENTS.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId]
  );

  const filteredRounds = React.useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    if (filter === 'all') {
      return selectedEvent.rounds;
    }

    if (filter === 'remaining') {
      return selectedEvent.rounds
        .map((round) => ({
          ...round,
          matches: round.matches.filter((match) => !match.winner),
        }))
        .filter((round) => round.matches.length > 0);
    }

    const flattened = selectedEvent.rounds.flatMap((round) =>
      round.matches.map((match) => ({
        round,
        match,
      }))
    );

    const finalMatches = flattened.slice(-3);

    return finalMatches.map(({ round, match }) => ({
      ...round,
      matches: [match],
    }));
  }, [selectedEvent, filter]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.vContent} showsVerticalScrollIndicator={false}>
        {!selectedEvent && (
          <>
            <Text style={styles.pageTitle}>Current ABT Events</Text>
            {BRACKET_EVENTS.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => {
                  setSelectedEventId(event.id);
                  setFilter('all');
                }}
              >
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventMeta}>{event.location}</Text>
                <Text style={styles.eventMeta}>{`${event.rounds.length} rounds`}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {selectedEvent && (
          <>
            <TouchableOpacity style={styles.backLink} onPress={() => setSelectedEventId(null)}>
              <Text style={styles.backLinkText}>← Back to Events</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>{selectedEvent.name}</Text>
            <Text style={styles.eventMeta}>{selectedEvent.location}</Text>

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
                style={[styles.filterPill, filter === 'final3' && styles.filterPillActive]}
                onPress={() => setFilter('final3')}
              >
                <Text style={[styles.filterText, filter === 'final3' && styles.filterTextActive]}>Final 3</Text>
              </TouchableOpacity>
            </View>

            {filteredRounds.length === 0 ? (
              <Text style={styles.emptyText}>No matches to display for this filter.</Text>
            ) : (
              filteredRounds.map((round, idx) => (
                <View key={`${round.title}-${idx}`} style={styles.roundSection}>
                  <RoundHeader title={round.title} points={round.points} by={round.by} />
                  <View style={styles.roundList}>
                    {round.matches.map((m, i) => (
                      <MatchBox key={`${idx}-${i}`} {...m} />
                    ))}
                  </View>
                </View>
              ))
            )}
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
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  roundSection: { width: '100%' },
  roundList: { gap: theme.spacing.md },
  roundHeader: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: theme.spacing.md, alignItems: 'center' },
  roundTitle: { ...theme.typography.heading, fontWeight: '800', marginBottom: 4 },
  roundMeta: { ...theme.typography.caption, color: '#6B7280', fontSize: 12 },
  matchBox: { backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: theme.spacing.md },
  playerRow: { paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  winnerRow: { backgroundColor: '#E6EEF8' },
  playerText: { color: '#111827' },
});


