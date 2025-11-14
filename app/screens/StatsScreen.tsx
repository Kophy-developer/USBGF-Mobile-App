import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchUserStats, UserStatsPeriod } from '../services/api';

type StatCardProps = { label: string; value: string | number };

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <View style={styles.card}>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

export const StatsScreen: React.FC = () => {
  const { token, user } = useAuth();
  const [allTime, setAllTime] = useState<UserStatsPeriod | null>(null);
  const [yearly, setYearly] = useState<UserStatsPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserStats(token, user?.playerId);
        setAllTime(data.allTime?.[0] ?? null);
        setYearly(Array.isArray(data.yearly) ? data.yearly : []);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load statistics.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [token, user?.playerId]);

  const allTimeCards = useMemo(() => {
    if (!allTime) {
      return [
        { label: 'Current Rating', value: '—' },
        { label: 'Highest Rating', value: '—' },
        { label: 'Total Matches', value: '—' },
        { label: 'Wins', value: '—' },
        { label: 'Losses', value: '—' },
        { label: 'Experience', value: '—' },
        { label: 'Events Entered', value: '—' },
        { label: 'Events Won', value: '—' },
        { label: 'Events Placed', value: '—' },
        { label: 'Total Master Points', value: '—' },
        { label: 'Match Points', value: '—' },
        { label: 'Rank Points', value: '—' },
      ];
    }
    return [
      { label: 'Current Rating', value: (allTime.LastEloRating ?? 0).toFixed(2) },
      { label: 'Highest Rating', value: (allTime.LastEloRatingHigh ?? 0).toFixed(2) },
      { label: 'Total Matches', value: Number(((allTime.MatchesWon ?? 0) + (allTime.MatchesLost ?? 0)).toFixed(2)) },
      { label: 'Wins', value: Number((allTime.MatchesWon ?? 0).toFixed(2)) },
      { label: 'Losses', value: Number((allTime.MatchesLost ?? 0).toFixed(2)) },
      { label: 'Experience', value: Number((allTime.Experience ?? 0).toFixed(2)) },
      { label: 'Events Entered', value: Number((allTime.EventsEntered ?? 0).toFixed(2)) },
      { label: 'Events Won', value: Number((allTime.EventsWon ?? 0).toFixed(2)) },
      { label: 'Events Placed', value: Number((allTime.EventsPlaced ?? 0).toFixed(2)) },
      { label: 'Total Master Points', value: (allTime.TotalMasterPointsReceived ?? 0).toFixed(2) },
      { label: 'Match Points', value: (allTime.MatchPointsReceived ?? 0).toFixed(2) },
      { label: 'Rank Points', value: (allTime.RankPointsReceived ?? 0).toFixed(2) },
    ];
  }, [allTime]);

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['top','left','right']}>
        <View style={styles.titleBar}><Text style={styles.titleText}>Statistics - All Time</Text></View>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.infoText}>Please sign in to view your statistics.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <View style={styles.titleBar}><Text style={styles.titleText}>Statistics - All Time</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? (
          <Text style={styles.infoText}>Loading...</Text>
        ) : (
        <View style={styles.grid}>
          {allTimeCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </View>
        )}

        <Text style={styles.sectionHeading}>Yearly Statistics</Text>

        {loading ? (
          <Text style={styles.infoText}>Loading yearly stats...</Text>
        ) : yearly.length === 0 ? (
          <Text style={styles.infoText}>No yearly statistics available.</Text>
        ) : (
          yearly.map((period) => (
            <View key={period.id ?? period.periodName}>
              <Text style={styles.yearHeading}>{period.periodName ?? '—'}</Text>
              <View style={styles.grid}>
                <StatCard label="Rating" value={(period.LastEloRating ?? 0).toFixed(2)} />
                <StatCard label="Wins" value={Number((period.MatchesWon ?? 0).toFixed(2))} />
                <StatCard label="Losses" value={Number((period.MatchesLost ?? 0).toFixed(2))} />
                <StatCard label="Events" value={Number((period.EventsEntered ?? 0).toFixed(2))} />
                <StatCard label="Events Won" value={Number((period.EventsWon ?? 0).toFixed(2))} />
                <StatCard label="Master Points" value={(period.TotalMasterPointsReceived ?? 0).toFixed(2)} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  titleBar: { backgroundColor: '#1B365D', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing['3xl'], marginHorizontal: theme.spacing['3xl'], marginTop: theme.spacing.lg, borderRadius: 4 },
  titleText: { ...theme.typography.heading, color: theme.colors.surface, fontWeight: '700', fontSize: 18 },
  content: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing['2xl'] },
  card: { flexBasis: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: theme.spacing['2xl'], paddingHorizontal: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  cardValue: { ...theme.typography.heading, color: '#4F46E5', fontWeight: '800', fontSize: 24, marginBottom: theme.spacing.xs },
  cardLabel: { ...theme.typography.body, color: theme.colors.textSecondary },
  sectionHeading: { ...theme.typography.heading, fontWeight: '800', fontSize: 18, marginBottom: theme.spacing.lg },
  yearHeading: { ...theme.typography.heading, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
  infoText: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, textAlign: 'center' },
  errorText: { ...theme.typography.body, color: theme.colors.error, marginBottom: theme.spacing.md, textAlign: 'center' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing['3xl'] },
});


