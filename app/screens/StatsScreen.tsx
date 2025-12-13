import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

type StatsType = 'ABT' | 'ONLINE';

export const StatsScreen: React.FC = () => {
  const { token, user } = useAuth();
  const [statsType, setStatsType] = useState<StatsType>('ABT');
  const [allTime, setAllTime] = useState<UserStatsPeriod | null>(null);
  const [yearly, setYearly] = useState<UserStatsPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!token || !user?.playerId) return;
      setLoading(true);
      setError(null);
      // Reset selected year when switching stats type
      setSelectedYear(null);
      try {
        const clubId = statsType === 'ABT' ? 5 : 2;
        const data = await fetchUserStats(token, user.playerId, clubId);
        setAllTime(data.allTime?.[0] ?? null);
        const yearlyData = Array.isArray(data.yearly) ? data.yearly : [];
        setYearly(yearlyData);
        // Set default selected year to the most recent year
        if (yearlyData.length > 0) {
          const years = yearlyData.map((p) => p.periodName ?? '').filter(Boolean);
          if (years.length > 0) {
            setSelectedYear(years[0]);
          }
        }
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load statistics.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [token, user?.playerId, statsType]);

  const availableYears = useMemo(() => {
    return yearly
      .map((period) => period.periodName ?? '')
      .filter(Boolean)
      .sort((a, b) => {
        // Sort years in descending order (newest first)
        const yearA = parseInt(a) || 0;
        const yearB = parseInt(b) || 0;
        return yearB - yearA;
      });
  }, [yearly]);

  const selectedYearData = useMemo(() => {
    if (!selectedYear) return null;
    return yearly.find((period) => period.periodName === selectedYear) ?? null;
  }, [yearly, selectedYear]);

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
      <SafeAreaView style={styles.container} edges={['left','right']}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.infoText}>Please sign in to view your statistics.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Type Selector */}
        <View style={styles.statsTypeSection}>
          <Text style={styles.sectionHeading}>Statistics Type</Text>
          <View style={styles.statsSwitch}>
            <TouchableOpacity
              style={[styles.switchPill, statsType === 'ABT' && styles.switchPillActiveLeft]}
              onPress={() => setStatsType('ABT')}
            >
              <Text style={[styles.switchText, statsType === 'ABT' && styles.switchTextActive]}>
                ABT
              </Text>
            </TouchableOpacity>
          <TouchableOpacity
              style={[styles.switchPill, statsType === 'ONLINE' && styles.switchPillActiveRight]}
              onPress={() => setStatsType('ONLINE')}
          >
              <Text style={[styles.switchText, statsType === 'ONLINE' && styles.switchTextActive]}>
                Online
            </Text>
          </TouchableOpacity>
          </View>
        </View>

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

        <View style={styles.yearlySection}>
          <Text style={styles.sectionHeading}>Yearly Statistics</Text>
          {yearly.length > 0 && (
            <View style={styles.yearSwitch}>
              {availableYears.map((year) => (
            <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearPill,
                    selectedYear === year && styles.yearPillActive,
                  ]}
                  onPress={() => setSelectedYear(year)}
            >
                  <Text
                    style={[
                      styles.yearPillText,
                      selectedYear === year && styles.yearPillTextActive,
                    ]}
                  >
                    {year}
              </Text>
            </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {loading ? (
          <Text style={styles.infoText}>Loading yearly stats...</Text>
        ) : yearly.length === 0 ? (
          <Text style={styles.infoText}>No yearly statistics available.</Text>
        ) : selectedYearData ? (
          <View style={styles.grid}>
            <StatCard label="Rating" value={(selectedYearData.LastEloRating ?? 0).toFixed(2)} />
            <StatCard label="Wins" value={Number((selectedYearData.MatchesWon ?? 0).toFixed(2))} />
            <StatCard label="Losses" value={Number((selectedYearData.MatchesLost ?? 0).toFixed(2))} />
            <StatCard label="Events" value={Number((selectedYearData.EventsEntered ?? 0).toFixed(2))} />
            <StatCard label="Events Won" value={Number((selectedYearData.EventsWon ?? 0).toFixed(2))} />
            <StatCard label="Master Points" value={(selectedYearData.TotalMasterPointsReceived ?? 0).toFixed(2)} />
          </View>
        ) : (
          <Text style={styles.infoText}>Please select a year to view statistics.</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing.sm, paddingBottom: 160 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing['2xl'] },
  card: { flexBasis: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: theme.spacing['2xl'], paddingHorizontal: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  cardValue: { ...theme.typography.heading, color: '#4F46E5', fontWeight: '800', fontSize: 24, marginBottom: theme.spacing.xs, fontFamily: theme.typography.heading.fontFamily },
  cardLabel: { ...theme.typography.body, color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily },
  sectionHeading: { ...theme.typography.heading, fontWeight: '800', fontSize: 18, marginBottom: theme.spacing.md, fontFamily: theme.typography.heading.fontFamily },
  statsTypeSection: { marginBottom: theme.spacing['2xl'] },
  statsSwitch: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    padding: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  switchPill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  switchPillActiveLeft: {
    backgroundColor: '#1B365D',
  },
  switchPillActiveRight: {
    backgroundColor: '#1B365D',
  },
  switchText: {
    ...theme.typography.button,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  switchTextActive: {
    color: theme.colors.textOnDark,
  },
  yearlySection: { marginBottom: theme.spacing.lg },
  yearSwitch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  yearPill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  yearPillActive: {
    backgroundColor: '#1B365D',
    borderColor: '#1B365D',
  },
  yearPillText: {
    ...theme.typography.button,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  yearPillTextActive: {
    color: theme.colors.textOnDark,
  },
  yearHeading: { ...theme.typography.heading, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: theme.spacing.md, fontFamily: theme.typography.heading.fontFamily },
  infoText: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, textAlign: 'center' },
  errorText: { ...theme.typography.body, color: theme.colors.error, marginBottom: theme.spacing.md, textAlign: 'center' },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing['3xl'] },
});


