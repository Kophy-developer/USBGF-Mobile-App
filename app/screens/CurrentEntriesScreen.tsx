import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchUpcomingMatches, UpcomingMatchesPayload, reportMatchResult } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

export const CurrentEntriesScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [matchesData, setMatchesData] = useState<UpcomingMatchesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const toggleResult = (id: string) => {
    setExpandedResult((prev) => (prev === id ? null : id));
  };

  const handleReportMatch = async (item: any, outcome: 'WIN' | 'LOSS') => {
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to report a match.');
      return;
    }

    const contestId: number | undefined = item?.contestId ?? item?.contest?.id;
    const userFactContestantId: number | undefined =
      item?.factContestantId ?? item?.contestantId ?? item?.entrantId;
    const opponentFactContestantId: number | undefined = item?.opponent?.factContestantId;
    const winnerFactContestantId =
      outcome === 'WIN' ? userFactContestantId : opponentFactContestantId;

    if (!contestId || !winnerFactContestantId) {
      Alert.alert('Unable to report match', 'Missing match identifiers.');
      return;
    }

    try {
      await reportMatchResult(token, {
        contestId,
        winnerFactContestantId,
      });
      Alert.alert(
        'Match Reported',
        outcome === 'WIN' ? 'Result submitted as a win.' : 'Result submitted as a loss.'
      );
      loadEntries({ refresh: true });
    } catch (err: any) {
      Alert.alert('Unable to report match', err?.message ?? 'Please try again later.');
    }
  };

  const loadEntries = async (opts: { refresh?: boolean } = {}) => {
    if (!token || !user?.playerId) {
      return;
    }
    if (opts.refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchUpcomingMatches(token, { playerId: user.playerId });
      setMatchesData(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load your current entries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [token, user?.playerId]);

  const awaitingResults = matchesData?.awaitingResults ?? [];
  const awaitingOpponents = matchesData?.awaitingOpponent ?? [];
  const awaitingDraw = matchesData?.awaitingDraw ?? [];

  const isEmpty = useMemo(
    () => awaitingResults.length === 0 && awaitingOpponents.length === 0 && awaitingDraw.length === 0,
    [awaitingResults.length, awaitingOpponents.length, awaitingDraw.length]
  );

  const renderAwaitingResults = () => (
    <>
      <Text style={styles.sectionHeading}>Awaiting Match Result</Text>
      {awaitingResults.map((item, index) => {
        const id = `${item.contestId ?? item.opponent?.id ?? index}-${index}`;
        const isOpen = expandedResult === id;
        const canReportMatch =
          item.actions?.isAllowReportMatch &&
          item.contestId &&
          ((item.factContestantId ?? item.contestantId ?? item.entrantId) ||
            item.opponent?.factContestantId);

        const opponentId = item.opponent?.id ?? item.opponent?.playerId;
        const opponentName = item.opponent?.name ?? 'Opponent TBD';

        return (
          <View key={id} style={styles.entryCard}>
            <TouchableOpacity style={styles.entryHeader} onPress={() => toggleResult(id)}>
              <View style={{ flex: 1 }}>
                {opponentId ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('OpponentProfile', {
                        playerId: opponentId,
                        playerName: opponentName,
                      });
                    }}
                    style={styles.nameContainer}
                  >
                    <Text style={[styles.entryName, styles.entryNameLink]}>{opponentName}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.entryName}>{opponentName}</Text>
                )}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    if (item.event?.id) {
                      navigation.navigate('EventDetails', {
                        eventId: item.event.id,
                        eventName: item.event.name,
                      });
                    }
                  }}
                >
                  <Text style={styles.entryEvent}>{item.event?.name ?? 'Event TBD'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.entryChevron}>{isOpen ? '▴' : '▾'}</Text>
            </TouchableOpacity>
            {isOpen && (
              <View style={styles.entryDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Round</Text>
                  <Text style={styles.detailValue}>{item.round ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Format</Text>
                  <Text style={styles.detailValue}>{item.contestFormat ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deadline</Text>
                  <Text style={styles.detailValue}>{item.deadline ?? '—'}</Text>
                </View>
                {opponentId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Message</Text>
                    <TouchableOpacity
                      style={styles.messageButton}
                      onPress={() => {
                        navigation.navigate('Contact', {
                          name: opponentName,
                          playerId: opponentId,
                        });
                      }}
                    >
                      <Text style={styles.messageButtonText}>💬 Message Opponent</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {canReportMatch ? (
                  <View style={[styles.detailRow, styles.detailReport]}>
                    <Text style={styles.detailLabel}>Report</Text>
                    <View style={styles.reportContainer}>
                      <TouchableOpacity
                        style={[styles.reportBadge, styles.reportWin]}
                        onPress={() => handleReportMatch(item, 'WIN')}
                      >
                        <Text style={styles.reportText}>W</Text>
                      </TouchableOpacity>
                        <TouchableOpacity
                        style={[styles.reportBadge, styles.reportLoss]}
                        onPress={() => handleReportMatch(item, 'LOSS')}
                        >
                        <Text style={styles.reportText}>L</Text>
                        </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        );
      })}
    </>
  );

  const renderAwaitingOpponents = () => (
    <>
      <Text style={styles.sectionHeading}>Awaiting Opponent</Text>
      {awaitingOpponents.map((item, index) => (
        <View key={`${item.event?.id ?? index}-${index}`} style={styles.simpleCard}>
          <Text style={styles.entryName}>
            {item.awaitingWOrL ? `${item.awaitingWOrL}: ${item.awaiting?.p1?.name ?? 'TBD'} vs ${item.awaiting?.p2?.name ?? 'TBD'}` : 'Awaiting Opponent'}
          </Text>
          <Text style={styles.entryEvent}>{item.event?.name ?? 'Event TBD'}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Round</Text>
            <Text style={styles.detailValue}>{item.round ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Format</Text>
            <Text style={styles.detailValue}>{item.contestFormat ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deadline</Text>
            <Text style={styles.detailValue}>{item.deadline ?? '—'}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderAwaitingDraw = () => (
    <>
      <Text style={styles.sectionHeading}>Awaiting Draw</Text>
      {awaitingDraw.map((item, index) => (
        <View key={`${item.event?.id ?? index}-${index}`} style={styles.simpleCard}>
          <Text style={styles.entryName}>{item.event?.name ?? 'Event TBD'}</Text>
          <Text style={styles.entryEvent}>{item.bracket?.name ?? 'Bracket TBD'}</Text>
          {item.event?.startTime && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{item.event.startTime}</Text>
            </View>
          )}
        </View>
      ))}
    </>
  );

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.infoText}>Please sign in to view your current entries.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadEntries({ refresh: true })} />}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadEntries()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : isEmpty ? (
          <View style={styles.centerContent}>
            <Text style={styles.infoText}>No current entries at the moment.</Text>
          </View>
        ) : (
          <>
            {awaitingResults.length > 0 && renderAwaitingResults()}
            {awaitingOpponents.length > 0 && renderAwaitingOpponents()}
            {awaitingDraw.length > 0 && renderAwaitingDraw()}
          </>
        )}
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
    paddingBottom: 160,
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
  entryNameLink: {
    color: '#1B365D',
    textDecorationLine: 'underline',
  },
  nameContainer: {
    flex: 1,
  },
  messageButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  entryEvent: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  entryChevron: {
    ...theme.typography.body,
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
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
    minWidth: 40,
    height: 40,
    borderRadius: 20,
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
  reportHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
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
  centerContent: {
    flex: 1,
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
});

