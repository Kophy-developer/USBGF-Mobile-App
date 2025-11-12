import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchMatches, MatchSummary, MATCHES_PERIOD_ID } from '../services/api';

type EventType = 'ABT' | 'ONLINE';

export const MatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectorOpen, setSelectorOpen] = React.useState(true);
  const [viewType, setViewType] = React.useState<EventType | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      setViewType(null);
      setSelectorOpen(true);
      setMatches([]);
      setError(null);
    }, [])
  );

  const loadMatches = useCallback(
    async (selectedType: EventType | null) => {
      if (!token) {
        setMatches([]);
        setError(null);
        return;
      }
      const club = selectedType === 'ABT' ? 5 : selectedType === 'ONLINE' ? 2 : null;
      if (!club) {
        setMatches([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMatches(token, club);
        setMatches(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load matches.');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (viewType) {
      loadMatches(viewType);
    }
  }, [viewType, loadMatches]);

  const choose = (t: EventType) => {
    setViewType(t);
    setSelectorOpen(false);
  };

  const groupedMatches = useMemo(() => {
    const map = new Map<string, { key: string; eventId?: number; eventName?: string; matches: MatchSummary[] }>();
    matches.forEach((match, index) => {
      const key = match.event?.id != null
        ? `event-${match.event.id}`
        : match.event?.name
        ? `name-${match.event.name}`
        : `unknown-${index}`;
      const bucket = map.get(key) ?? { key, eventId: match.event?.id, eventName: match.event?.name, matches: [] };
      bucket.matches.push(match);
      bucket.eventName = bucket.eventName || match.event?.name;
      map.set(key, bucket);
    });
    return Array.from(map.values());
  }, [matches]);

  const formatDate = useCallback((value?: string) => {
    if (!value) {
      return 'Date TBD';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const openMatchFile = useCallback((url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      setError('Unable to open match file.');
    });
  }, []);

  const renderMatchGroups = () => {
    if (!groupedMatches.length) {
      return <Text style={styles.helper}>No matches available at the moment.</Text>;
    }

    return groupedMatches.map((group) => (
      <View key={group.key} style={styles.eventSection}>
        <Text style={styles.sectionHeading}>{group.eventName ?? 'Event'}</Text>
        {group.matches.map((match, index) => {
          const result = match.result?.toUpperCase?.() ?? null;
          return (
            <View key={match.matchId ?? `${group.key}-${index}`} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.opponentName}>{match.opponent?.name ?? 'Opponent TBD'}</Text>
                  <Text style={styles.matchMeta}>{formatDate(match.date)}</Text>
                </View>
                {result && (
                  <View
                    style={[
                      styles.resultBadge,
                      result === 'W' ? styles.resultWin : result === 'L' ? styles.resultLoss : styles.resultNeutral,
                    ]}
                  >
                    <Text style={styles.resultText}>{result}</Text>
                  </View>
                )}
              </View>
              <View style={styles.matchDetails}>
                <Text style={styles.detailLine}>
                  Length: {match.matchLength ? `${match.matchLength} pt` : '—'}
                </Text>
                <Text style={styles.detailLine}>
                  Rating: {match.playerRating ?? '—'}
                </Text>
                <Text style={styles.detailLine}>
                  Match Points: {match.matchPoints ?? '—'}
                </Text>
              </View>
              {match.matchFile ? (
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={() => openMatchFile(match.matchFile)}
                  accessibilityRole="button"
                >
                  <Text style={styles.fileButtonText}>View Match File</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>
    ));
  };

  const renderMatches = () => {
    if (!viewType) {
      return <Text style={styles.helper}>Select an events type to view</Text>;
    }

    if (!token) {
      return <Text style={styles.helper}>Please sign in to view matches.</Text>;
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadMatches(viewType)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionHeading}>
          {viewType === 'ABT' ? 'Current ABT Matches' : 'Online Matches'}
        </Text>
        {renderMatchGroups()}
        <Text style={styles.periodNote}>Period ID: {MATCHES_PERIOD_ID}</Text>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderMatches()}

        <TouchableOpacity 
          style={styles.calendarBtn}
          onPress={() => navigation.navigate('ABTCalendar' as never)}
        >
          <Text style={styles.calendarText}>View ABT Calendar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={selectorOpen} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectorOpen(false)} />
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalBtn} onPress={() => choose('ABT')}>
            <Text style={styles.modalBtnText}>Current ABT Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalBtn} onPress={() => choose('ONLINE')}>
            <Text style={styles.modalBtnText}>Online Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, styles.modalSecondary]}
            onPress={() => {
              setSelectorOpen(false);
              navigation.navigate('ABTCalendar' as never);
            }}
          >
            <Text style={[styles.modalBtnText, styles.modalSecondaryText]}>View ABT Calendar</Text>
          </TouchableOpacity>
      </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160, gap: theme.spacing.md },
  helper: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing['2xl'] },
  sectionHeading: { ...theme.typography.heading, fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
  calendarBtn: { backgroundColor: '#1B365D', alignSelf: 'center', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: theme.spacing['2xl'] },
  calendarText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },

  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: theme.spacing['2xl'], gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  modalBtn: { backgroundColor: '#1B365D', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalSecondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#1B365D' },
  modalSecondaryText: { color: '#1B365D' },
  modalBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },
  loadingContainer: { paddingVertical: theme.spacing['4xl'], alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  errorText: { ...theme.typography.body, color: theme.colors.error, textAlign: 'center' },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.radius.md,
  },
  retryText: { ...theme.typography.button, color: theme.colors.surface, fontWeight: '700' },
  eventSection: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  matchCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  opponentName: {
    ...theme.typography.heading,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  matchMeta: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  matchDetails: {
    gap: 4,
  },
  detailLine: { ...theme.typography.body, color: theme.colors.textSecondary },
  resultBadge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#A1A1AA',
  },
  resultWin: {
    backgroundColor: '#1A9E55',
  },
  resultLoss: {
    backgroundColor: '#DA291C',
  },
  resultNeutral: {
    backgroundColor: '#52525B',
  },
  resultText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  fileButton: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  fileButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  periodNote: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});

