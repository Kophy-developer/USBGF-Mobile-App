import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import * as DocumentPicker from 'expo-document-picker';

interface AwaitingResultRow {
  opponent: string;
  report: Array<'W' | 'L'>;
  event: string;
  round: string;
}

interface AwaitingOpponentRow {
  waitingFor: string;
  event: string;
  round: string;
  format: string;
  deadline?: string;
}

interface AwaitingDrawRow {
  event: string;
  bracket: string;
}

const awaitingResults: AwaitingResultRow[] = [
  {
    opponent: 'Kevin Jones',
    report: ['W', 'L'],
    event: 'OTS Monthly Double Elimination - October 2025',
    round: '1',
  },
  {
    opponent: 'Jon Douglas',
    report: ['L', 'W'],
    event: 'Rapid Rounds - October 2025',
    round: '4',
  },
  {
    opponent: 'Arvel Toten',
    report: ['W', 'L'],
    event: 'Member Blitz - 2026',
    round: '1',
  },
  {
    opponent: 'Irina Litzenberger',
    report: ['W', 'L'],
    event: 'OTS Monthly Double Elimination - November 2025',
    round: '1',
  },
];

const awaitingOpponents: AwaitingOpponentRow[] = [
  {
    waitingFor: 'Winner of Arvel Toten vs. Roberto Litzenberger',
    event: 'Member Blitz - 2025',
    round: '3',
    format: '7 Points',
  },
  {
    waitingFor: 'Winner of Stephen Douglas vs. Pete Jarvis',
    event: 'Pick-a-Pro Lesson Jackpot - 2025',
    round: '2',
    format: '9 Points',
  },
];

const awaitingDraw: AwaitingDrawRow[] = [
  {
    event: 'Member Blitz - 2025',
    bracket: 'Bracket Winners (not played)',
  },
  {
    event: 'Pick-a-Pro Lesson Jackpot - 2025',
    bracket: 'Bracket Winners (not played)',
  },
  {
    event: 'USBGF Divisional - November 2025: Masters',
    bracket: 'Qualifier #3',
  },
];

export const CurrentEntriesScreen: React.FC = () => {
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const handleUploadReport = async (opponent: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false,
      });

      if (result.type === 'success') {
        Alert.alert('Report Uploaded', `${result.name} uploaded for ${opponent}`);
      }
    } catch (error) {
      console.error('Report upload failed', error);
      Alert.alert('Upload Failed', 'Unable to upload report. Please try again.');
    }
  };

  const toggleResult = (id: string) => {
    setExpandedResult((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Awaiting Match Result</Text>
        {awaitingResults.map((item, index) => {
            const orderedReport = [...item.report].sort((a, b) => {
              if (a === b) return 0;
              return a === 'W' ? -1 : 1;
            });
            const id = `${item.opponent}-${index}`;
            const isOpen = expandedResult === id;

            return (
              <View key={id} style={styles.entryCard}>
                <TouchableOpacity style={styles.entryHeader} onPress={() => toggleResult(id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>{item.opponent}</Text>
                    <Text style={styles.entryEvent}>{item.event}</Text>
                  </View>
                  <Text style={styles.entryChevron}>{isOpen ? '▴' : '▾'}</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.entryDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Round</Text>
                      <Text style={styles.detailValue}>{item.round}</Text>
                    </View>
                    <View style={[styles.detailRow, styles.detailReport]}>
                      <Text style={styles.detailLabel}>Report</Text>
                      <View style={styles.reportContainer}>
                        {orderedReport.map((mark, idx) => (
                          <TouchableOpacity
                            key={`${mark}-${idx}`}
                            style={[styles.reportBadge, mark === 'W' ? styles.reportWin : styles.reportLoss]}
                            onPress={() => handleUploadReport(item.opponent)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.reportText}>{mark}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

        <Text style={styles.sectionHeading}>Awaiting Opponent</Text>
        {awaitingOpponents.map((item, index) => (
          <View key={`${item.event}-${index}`} style={styles.simpleCard}>
            <Text style={styles.entryName}>{item.waitingFor}</Text>
            <Text style={styles.entryEvent}>{item.event}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Round</Text>
              <Text style={styles.detailValue}>{item.round}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Format</Text>
              <Text style={styles.detailValue}>{item.format}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionHeading}>Awaiting Draw</Text>
        {awaitingDraw.map((item, index) => (
          <View key={`${item.event}-${index}`} style={styles.simpleCard}>
            <Text style={styles.entryName}>{item.event}</Text>
            <Text style={styles.entryEvent}>{item.bracket}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing['4xl'],
    gap: theme.spacing['2xl'],
  },
  sectionHeading: {
    ...theme.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
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
  },
  entryEvent: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  entryChevron: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.md,
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
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  detailReport: {
    alignItems: 'flex-start',
  },
  reportContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  reportBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportWin: {
    backgroundColor: '#1A9E55',
  },
  reportLoss: {
    backgroundColor: '#DA291C',
  },
  reportText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '700',
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
  },
});
