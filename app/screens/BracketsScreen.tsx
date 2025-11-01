import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <View style={styles.titleBar}><Text style={styles.titleText}>Brackets</Text></View>
      <ScrollView contentContainerStyle={styles.vContent} showsVerticalScrollIndicator={false}>
        {SAMPLE.map((round, idx) => (
          <View key={idx} style={styles.roundSection}>
            <RoundHeader title={round.title} points={round.points} by={round.by} />
            <View style={styles.roundList}>
              {round.matches.map((m, i) => (
                <MatchBox key={`${idx}-${i}`} {...m} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  titleBar: { backgroundColor: '#1E3553', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing['3xl'], marginHorizontal: theme.spacing['3xl'], marginTop: theme.spacing.lg, borderRadius: 4 },
  titleText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
  vContent: { paddingVertical: theme.spacing['2xl'], paddingHorizontal: theme.spacing['3xl'], paddingBottom: 160, gap: theme.spacing['2xl'] },
  roundSection: { width: '100%' },
  roundList: { gap: theme.spacing.md },
  roundHeader: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: theme.spacing.md, alignItems: 'center' },
  roundTitle: { fontWeight: '800', marginBottom: 4 },
  roundMeta: { color: '#6B7280', fontSize: 12 },
  matchBox: { backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: theme.spacing.md },
  playerRow: { paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  winnerRow: { backgroundColor: '#E6EEF8' },
  playerText: { color: '#111827' },
});


