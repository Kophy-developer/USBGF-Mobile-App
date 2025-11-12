import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchMatches, MatchesPayload, MATCHES_PERIOD_ID } from '../services/api';

type EventType = 'ABT' | 'ONLINE';

const Chevron: React.FC = () => <Text style={{ ...theme.typography.body, fontSize: 18 }}>▾</Text>;

export const MatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectorOpen, setSelectorOpen] = React.useState(true);
  const [viewType, setViewType] = React.useState<EventType | null>(null);
  const [matchesData, setMatchesData] = useState<MatchesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      setViewType(null);
      setSelectorOpen(true);
      setMatchesData(null);
      setError(null);
    }, [])
  );

  const loadMatches = useCallback(
    async (selectedType: EventType | null) => {
      if (!token) {
        setMatchesData(null);
        setError('Please sign in to view matches.');
        return;
      }
      const club = selectedType === 'ABT' ? 5 : selectedType === 'ONLINE' ? 2 : null;
      if (!club) {
        setMatchesData(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMatches(token, club);
        setMatchesData(data);
      } catch (err: any) {
        setError(err?.message || 'Unable to load matches.');
        setMatchesData(null);
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

  const renderAwaitingResults = (data?: MatchesPayload | null) => {
    if (!data?.awaitingResults?.length) return null;
    return (
      <>
        <Text style={styles.sectionHeading}>Awaiting Match Result</Text>
        {data.awaitingResults.map((item, index) => (
          <View key={`${item.contestId ?? index}`} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryName}>{item.opponent?.name ?? 'Opponent TBD'}</Text>
                <Text style={styles.entryEvent}>{item.event?.name ?? 'Event TBD'}</Text>
              </View>
              <Chevron />
            </View>
            <View style={styles.entryDetails}>
              <Text style={styles.detailLine}>Format: {item.contestFormat ?? '—'}</Text>
              <Text style={styles.detailLine}>Round: {item.round ?? '—'}</Text>
              <Text style={styles.detailLine}>Deadline: {item.deadline ?? '—'}</Text>
            </View>
          </View>
        ))}
      </>
    );
  };

  const renderAwaitingDraw = (data?: MatchesPayload | null) => {
    if (!data?.awaitingDraw?.length) return null;
    return (
      <>
        <Text style={styles.sectionHeading}>Awaiting Draw</Text>
        {data.awaitingDraw.map((item, index) => (
          <View key={`${item.bracket?.id ?? index}`} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryName}>{item.event?.name ?? 'Event TBD'}</Text>
                <Text style={styles.entryEvent}>{item.bracket?.name ?? 'Bracket TBD'}</Text>
              </View>
            </View>
            {item.event?.startTime && <Text style={styles.detailLine}>Start: {item.event.startTime}</Text>}
          </View>
        ))}
      </>
    );
  };

  const renderAwaitingOpponent = (data?: MatchesPayload | null) => {
    if (!data?.awaitingOpponent?.length) return null;
    return (
      <>
        <Text style={styles.sectionHeading}>Awaiting Opponent</Text>
        {data.awaitingOpponent.map((item, index) => (
          <View key={`${item.factContestantId ?? index}`} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryName}>{item.event?.name ?? 'Event TBD'}</Text>
                <Text style={styles.entryEvent}>{item.awaitingWOrL ?? 'Awaiting Result'}</Text>
              </View>
            </View>
            <Text style={styles.detailLine}>
              {item.awaiting?.p1?.name ?? 'TBD'} vs {item.awaiting?.p2?.name ?? 'TBD'}
            </Text>
            <Text style={styles.detailLine}>Round: {item.round ?? '—'}</Text>
            <Text style={styles.detailLine}>Format: {item.contestFormat ?? '—'}</Text>
            <Text style={styles.detailLine}>Deadline: {item.deadline ?? '—'}</Text>
          </View>
        ))}
      </>
    );
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

    if (!matchesData) {
      return null;
    }

    const hasContent =
      matchesData.awaitingResults?.length ||
      matchesData.awaitingOpponent?.length ||
      matchesData.awaitingDraw?.length;

    if (!hasContent) {
      return <Text style={styles.helper}>No matches available at the moment.</Text>;
    }

    return (
      <>
        {renderAwaitingResults(matchesData)}
        {renderAwaitingOpponent(matchesData)}
        {renderAwaitingDraw(matchesData)}
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
  sectionHeading: { ...theme.typography.heading, fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
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
  entryCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  entryName: { ...theme.typography.heading, fontSize: 18, color: theme.colors.textPrimary },
  entryEvent: { ...theme.typography.caption, fontSize: 14, color: theme.colors.textSecondary },
  entryDetails: { marginTop: theme.spacing.sm, gap: 4 },
  detailLine: { ...theme.typography.body, color: theme.colors.textSecondary },
  periodNote: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});

