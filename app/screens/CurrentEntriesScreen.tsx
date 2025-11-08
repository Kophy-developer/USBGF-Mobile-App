import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';
import * as DocumentPicker from 'expo-document-picker';

type Navigation = StackNavigationProp<RootStackParamList>;

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
  deadline: string;
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
  const navigation = useNavigation<Navigation>();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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

  const navigateTo = (route: string) => {
    setIsMenuOpen(false);
    navigation.navigate('Dashboard' as any, { screen: route } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Awaiting Match Result</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colOpponent]}>Opponent</Text>
            <View style={[styles.colReport, styles.reportHeader]}>
              <Text style={styles.headerCell}>Report</Text>
              <TouchableOpacity onPress={() => Alert.alert('Report Result', 'Tap W or L to report your result and upload supporting documentation.')}>
                <Text style={styles.infoIcon}>ℹ️</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerCell, styles.colEvent]}>Event</Text>
            <Text style={[styles.headerCell, styles.colRound]}>Round</Text>
          </View>
          {awaitingResults.map((item, index) => {
            const orderedReport = [...item.report].sort((a, b) => {
              if (a === b) return 0;
              return a === 'W' ? -1 : 1;
            });

            return (
              <View key={`${item.opponent}-${index}`} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colOpponent]}>{item.opponent}</Text>
                <View style={[styles.colReport, styles.reportContainer]}>
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
                <Text style={[styles.cellText, styles.colEvent]}>{item.event}</Text>
                <Text style={[styles.cellText, styles.colRound]}>{item.round}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Awaiting Opponent</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colWaitingFor]}>Waiting For</Text>
            <Text style={[styles.headerCell, styles.colEvent]}>Event</Text>
            <Text style={[styles.headerCell, styles.colRound]}>Round</Text>
            <Text style={[styles.headerCell, styles.colFormat]}>Format</Text>
          </View>
          {awaitingOpponents.map((item, index) => (
            <View key={`${item.event}-${index}`} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colWaitingFor]}>{item.waitingFor}</Text>
              <Text style={[styles.cellText, styles.colEvent]}>{item.event}</Text>
              <Text style={[styles.cellText, styles.colRound]}>{item.round}</Text>
              <Text style={[styles.cellText, styles.colFormat]}>{item.format}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Awaiting Draw</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colEvent]}>Event</Text>
            <Text style={[styles.headerCell, styles.colBracket]}>Bracket</Text>
          </View>
          {awaitingDraw.map((item, index) => (
            <View key={`${item.event}-${index}`} style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colEvent]}>{item.event}</Text>
              <Text style={[styles.cellText, styles.colBracket]}>{item.bracket}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {isMenuOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setIsMenuOpen(false)} accessibilityLabel="Close menu" />
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Events')}>
              <Text style={styles.menuItemText}>View Events</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('AccountBalance')}>
              <Text style={styles.menuItemText}>Account Balance</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('MembershipPlans')}>
              <Text style={styles.menuItemText}>Membership Plan</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setIsMenuOpen(false)}>
              <Text style={[styles.menuItemText, styles.menuHighlight]}>Current Entries</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.reset({ index: 0, routes: [{ name: 'AuthStack' as any }] });
              }}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    gap: theme.spacing['3xl'],
  },
  sectionCard: {
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
  sectionTitle: {
    ...theme.typography.heading,
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8ECF7',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
  },
  headerCell: {
    ...theme.typography.caption,
    color: '#1B365D',
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cellText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  cellButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  scheduleButton: {
    backgroundColor: '#1B365D',
  },
  buttonText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  reportContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  infoIcon: {
    fontSize: 16,
  },
  linkText: {
    color: '#1B365D',
    textDecorationLine: 'underline',
  },
  colOpponent: {
    flex: 1.4,
  },
  colSchedule: {
    width: 110,
    alignItems: 'center',
  },
  colTimeZone: {
    width: 110,
  },
  colReport: {
    width: 80,
    justifyContent: 'center',
  },
  colEvent: {
    flex: 1.5,
    paddingRight: theme.spacing.sm,
  },
  colRound: {
    width: 55,
    textAlign: 'center',
  },
  colFormat: {
    width: 90,
    textAlign: 'center',
  },
  colDeadline: {
    width: 120,
    textAlign: 'center',
  },
  colWaitingFor: {
    flex: 1.5,
    paddingRight: theme.spacing.sm,
  },
  colBracket: {
    flex: 1.5,
  },
  menuDropdown: {
    position: 'absolute',
    top: 120,
    left: theme.spacing['3xl'],
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    backgroundColor: '#FFFFFF',
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  menuHighlight: {
    color: '#1B365D',
    fontWeight: '700',
  },
  logoutText: {
    color: '#B91C1C',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 900,
  },
});
