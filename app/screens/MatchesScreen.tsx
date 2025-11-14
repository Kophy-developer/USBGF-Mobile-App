import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import {
  fetchMatches,
  fetchUpcomingMatches,
  MatchSummary,
  UpcomingMatchesPayload,
} from '../services/api';

type EventType = 'ABT' | 'ONLINE';

const Chevron: React.FC = () => (
  <Text style={{ ...theme.typography.body, fontSize: 18 }}>▾</Text>
);

const formatDate = (value?: string) => {
  if (!value) return 'Date TBD';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const MatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token, user } = useAuth();

  const [selectorOpen, setSelectorOpen] = useState(true);
  const [viewType, setViewType] = useState<EventType | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingMatchesPayload | null>(null);

  useEffect(() => {
    setSelectorOpen(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setViewType(null);
      setSelectorOpen(true);
      setMatches([]);
      setError(null);
    }, [])
  );

  const loadMatches = useCallback(
    async (selectedType: EventType) => {
      if (!token) {
        setMatches([]);
        setError('Please sign in to view matches.');
        setUpcoming(null);
        return;
      }

      const clubId = selectedType === 'ABT' ? 5 : 2;
      setLoading(true);
      setError(null);

      try {
        const [matchesData, upcomingData] = await Promise.all([
          fetchMatches(token, clubId),
          fetchUpcomingMatches(token, { clubId, playerId: user?.playerId }),
        ]);
        setUpcoming(upcomingData ?? null);
        const data = matchesData ?? [];
        setMatches(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message ?? 'Unable to load matches.');
        setMatches([]);
        setUpcoming(null);
      } finally {
        setLoading(false);
      }
    },
    [token, user?.playerId]
  );

  useEffect(() => {
    if (viewType) {
      loadMatches(viewType);
    } else {
      setMatches([]);
      setError(null);
      setUpcoming(null);
    }
  }, [viewType, loadMatches]);

  const matchItems = useMemo(() => {
    return matches.map((match, index) => {
      const eventName = match.event?.name ?? 'Event TBD';
      const opponent = match.opponent?.name ?? 'Opponent TBD';
      return {
        key: match.matchId ?? `${eventName}-${index}`,
        eventName,
        opponent,
        deadline: match.date ? formatDate(match.date) : null,
        length: match.matchLength ? `${match.matchLength} pt` : null,
        matchPoints:
          match.matchPoints != null && match.matchPoints !== ''
            ? `${match.matchPoints}`
            : null,
        rating:
          match.playerRating != null && match.playerRating !== ''
            ? `${match.playerRating}`
            : null,
        result: match.result ?? null,
        matchFile: match.matchFile ?? null,
      };
    });
  }, [matches]);

  const handleOpenMatchFile = useCallback((url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      // intentionally swallow errors from user cancel
    });
  }, []);

  const handleRetry = useCallback(() => {
    if (viewType) {
      loadMatches(viewType);
    }
  }, [viewType, loadMatches]);

  const renderBody = () => {
    if (!viewType) {
      return <Text style={styles.helper}>Select an events type to view</Text>;
    }

    if (!token) {
      return <Text style={styles.helper}>Please sign in to view matches.</Text>;
    }

    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!matchItems.length) {
      return <Text style={styles.helper}>No matches available at the moment.</Text>;
    }

    const awaitingDraw: any[] = Array.isArray(upcoming?.awaitingDraw)
      ? (upcoming?.awaitingDraw as any[])
      : [];

    return (
      <>
        <View style={styles.listHeader}>
          <Text style={styles.sectionHeading}>
            {viewType === 'ABT' ? 'ABT Matches' : 'Online Matches'}
          </Text>
        </View>

        <View style={styles.cardStack}>
          {matchItems.map((item) => {
            const resultFlag = item.result?.toString().toUpperCase() ?? null;
            const badgeStyle =
              resultFlag === 'W'
                ? styles.badgeWin
                : resultFlag === 'L'
                ? styles.badgeLoss
                : styles.badgePending;
            const badgeLabel =
              resultFlag === 'W'
                ? 'Won'
                : resultFlag === 'L'
                ? 'Lost'
                : resultFlag === 'BYE'
                ? 'Bye'
                : 'Upcoming';
            const secondaryLines = [
              item.length ? `Length • ${item.length}` : null,
              item.rating ? `Rating • ${item.rating}` : null,
            ].filter(Boolean);

            return (
              <View key={item.key} style={styles.matchCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchOpponent}>{item.opponent}</Text>
                    <Text style={styles.matchEvent}>{item.eventName}</Text>
                  </View>
                  <View style={[styles.resultBadge, badgeStyle]}>
                    <Text style={styles.badgeText}>{badgeLabel}</Text>
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  {item.deadline ? (
                    <Text style={styles.metaPrimary}>{item.deadline}</Text>
                  ) : null}
                  {secondaryLines.length ? (
                    <Text style={styles.metaSecondary}>
                      {secondaryLines.join('   •   ')}
                    </Text>
                  ) : null}
                </View>

                {item.matchFile ? (
                  <TouchableOpacity
                    style={styles.fileButton}
                    onPress={() => handleOpenMatchFile(item.matchFile)}
                  >
                    <Text style={styles.fileButtonText}>View Match File</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        {awaitingDraw.length ? (
          <View style={styles.awaitingSection}>
            <Text style={styles.sectionHeading}>Awaiting Draw</Text>
            {awaitingDraw.map((item, index) => {
              const leftLabel =
                item?.matchTitle ??
                item?.title ??
                item?.label ??
                item?.opponentName ??
                item?.name ??
                `${item?.playerName ?? 'TBD'} vs ${item?.opponent?.name ?? 'TBD'}`;
              const subtitle =
                item?.eventName ??
                item?.event?.name ??
                item?.tournament ??
                item?.division ??
                '';
              return (
                <View key={`${index}-${leftLabel}`} style={styles.awaitCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.awaitTitle}>{leftLabel}</Text>
                    {subtitle ? (
                      <Text style={styles.awaitSubtitle}>{subtitle}</Text>
                    ) : null}
                  </View>
                  <Chevron />
                </View>
              );
            })}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderBody()}

        {!selectorOpen && viewType && (
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => navigation.navigate('ABTCalendar' as never)}
          >
            <Text style={styles.calendarText}>View ABT Calendar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal transparent visible={selectorOpen} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectorOpen(false)} />
        <View style={styles.modalCard}>
          <TouchableOpacity
            style={styles.modalBtn}
            onPress={() => {
              setViewType('ABT');
              setSelectorOpen(false);
            }}
          >
            <Text style={styles.modalBtnText}>Current ABT Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalBtn}
            onPress={() => {
              setViewType('ONLINE');
              setSelectorOpen(false);
            }}
          >
            <Text style={styles.modalBtnText}>Online Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, styles.modalSecondary]}
            onPress={() => {
              setSelectorOpen(false);
              navigation.navigate('ABTCalendar' as never);
            }}
          >
            <Text style={[styles.modalBtnText, styles.modalSecondaryText]}>
              View ABT Calendar
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: 160,
    gap: theme.spacing['2xl'],
  },
  helper: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['2xl'],
  },
  sectionHeading: {
    ...theme.typography.heading,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  listHeader: {
    gap: 4,
  },
  cardStack: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  matchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(27, 54, 93, 0.08)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  matchOpponent: {
    ...theme.typography.heading,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  matchEvent: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  resultBadge: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 6,
    backgroundColor: '#CBD5F5',
  },
  badgeWin: {
    backgroundColor: '#1A9E55',
  },
  badgeLoss: {
    backgroundColor: '#DA291C',
  },
  badgePending: {
    backgroundColor: '#1B365D',
  },
  badgeText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  cardMeta: {
    gap: 4,
  },
  metaPrimary: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  metaSecondary: {
    ...theme.typography.caption,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  fileButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing['2xl'],
    backgroundColor: '#1B365D',
  },
  fileButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  awaitingSection: {
    marginTop: theme.spacing['3xl'],
    gap: theme.spacing.md,
  },
  awaitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(27, 54, 93, 0.12)',
    backgroundColor: 'rgba(27, 54, 93, 0.04)',
  },
  awaitTitle: {
    ...theme.typography.body,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  awaitSubtitle: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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
  calendarBtn: {
    backgroundColor: '#1B365D',
    alignSelf: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: theme.spacing['2xl'],
  },
  calendarText: {
    ...theme.typography.button,
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
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBtn: {
    backgroundColor: '#1B365D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#1B365D',
  },
  modalSecondaryText: {
    color: '#1B365D',
  },
  modalBtnText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

