import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';

type StatCardProps = { label: string; value: string | number };

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <View style={styles.card}>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

export const StatsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <View style={styles.titleBar}><Text style={styles.titleText}>Statistics - All Time</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* All Time grid */}
        <View style={styles.grid}>
          <StatCard label="Current Rating" value="1590.4" />
          <StatCard label="Highest Rating" value="1622.2" />
          <StatCard label="Total Matches" value="429" />
          <StatCard label="Wins" value="214" />
          <StatCard label="Losses" value="215" />
          <StatCard label="Experience" value="3979" />
          <StatCard label="Events Entered" value="60" />
          <StatCard label="Events Won" value="1" />
          <StatCard label="Events Placed" value="8" />
          <StatCard label="Total Master Points" value="81.72" />
          <StatCard label="Match Points" value="76.76" />
          <StatCard label="Rank Points" value="4.96" />
        </View>

        {/* Yearly section */}
        <Text style={styles.sectionHeading}>Yearly Statistics</Text>

        <Text style={styles.yearHeading}>2025</Text>
        <View style={styles.grid}>
          <StatCard label="Rating" value="1590.4" />
          <StatCard label="Wins" value="125" />
          <StatCard label="Losses" value="109" />
          <StatCard label="Events" value="31" />
          <StatCard label="Events Won" value="1" />
          <StatCard label="Master Points" value="48.08" />
        </View>

        <Text style={styles.yearHeading}>2024</Text>
        <View style={styles.grid}>
          <StatCard label="Rating" value="1495.3" />
          <StatCard label="Wins" value="89" />
          <StatCard label="Losses" value="106" />
          <StatCard label="Events" value="29" />
          <StatCard label="Events Won" value="0" />
          <StatCard label="Master Points" value="33.64" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  titleBar: { backgroundColor: '#1E3553', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing['3xl'], marginHorizontal: theme.spacing['3xl'], marginTop: theme.spacing.lg, borderRadius: 4 },
  titleText: { color: theme.colors.surface, fontWeight: '700', fontSize: 18 },
  content: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing['2xl'] },
  card: { flexBasis: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: theme.spacing['2xl'], paddingHorizontal: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  cardValue: { color: '#4F46E5', fontWeight: '800', fontSize: 24, marginBottom: theme.spacing.xs },
  cardLabel: { color: theme.colors.textSecondary },
  sectionHeading: { fontWeight: '800', fontSize: 18, marginBottom: theme.spacing.lg },
  yearHeading: { fontWeight: '800', color: theme.colors.textPrimary, marginBottom: theme.spacing.md },
});


