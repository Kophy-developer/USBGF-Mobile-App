import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';
import {
  EligibilityRule,
  enterEvent,
  EventDetailsPayload,
  EventSummary,
  fetchEventDetails,
  withdrawEvent,
} from '../services/api';

type EventType = 'ABT' | 'ONLINE';
type EventStatus = 'ACCEPTING' | 'IN_PROGRESS' | 'COMPLETED';

const STATUS_LABEL: Record<EventStatus, string> = {
  ACCEPTING: 'Accepting',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

type EventDetailsRouteParams = {
  eventId: number;
  eventName?: string;
  clubId?: number;
  status?: EventStatus;
  initialEvent?: EventSummary | null;
  viewType?: EventType;
  initialOnlineTab?: EventStatus;
};

const sanitizeDescription = (value?: string | null) => {
  if (!value) return 'No additional information available.';
  return value
    .replace(/<\/?p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const formatDate = (value?: string | null) => {
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

const ruleEmoji = (rule: EligibilityRule) => (rule[2] ? '✅' : '⚠️');

export const EventDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const params = (route?.params ?? {}) as EventDetailsRouteParams;
  const navigation = useNavigation();
  const { token, user } = useAuth();

  const [details, setDetails] = useState<EventDetailsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [userIsEnteredState, setUserIsEnteredState] = useState<boolean>(params?.initialEvent?.userIsEntered ?? false);
  const [userEligibilityState, setUserEligibilityState] = useState<string | null>(params?.initialEvent?.userEligibility ?? null);

  const eventId = params?.eventId;
  const eventName = params?.eventName;
  const viewTypeParam = params?.viewType;
  const onlineTabParam = params?.initialOnlineTab;

  useLayoutEffect(() => {
    const condensedTitle = (() => {
      if (!eventName) {
        return 'Event Details';
      }
      const parts = eventName.trim().split(/\s+/);
      if (parts.length <= 2) {
        return eventName;
      }
      return `${parts.slice(0, 2).join(' ')}…`;
    })();

    const handleBack = () => {
      if (viewTypeParam) {
        navigation.navigate('Events' as never, {
          initialViewType: viewTypeParam,
          initialOnlineTab: onlineTabParam,
        } as never);
        return;
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Events' as never);
      }
    };

    navigation.setOptions?.({
      headerTitle: () => (
        <Text style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit>
          {condensedTitle}
        </Text>
      ),
      headerLeft: () => (
        <TouchableOpacity style={styles.headerBack} onPress={handleBack}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
      ),
    });
  }, [eventName, navigation, viewTypeParam, onlineTabParam]);

  const loadDetails = useCallback(async () => {
    if (!token) {
      setError('Please sign in to view event details.');
      return;
    }
    if (!eventId) {
      setError('Event not found.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEventDetails(token, eventId);
      setDetails(data);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load event details.');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [token, eventId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const isAuthenticated = Boolean(token);

  const userEntry = useMemo(() => {
    if (!user?.playerId) return null;
    return (details?.players?.players ?? []).find((entry) => entry.player?.id === user.playerId) ?? null;
  }, [details?.players?.players, user?.playerId]);

  useEffect(() => {
    if (!user?.playerId) {
      setUserIsEnteredState(false);
      return;
    }
    setUserIsEnteredState(Boolean(userEntry));
  }, [user?.playerId, userEntry]);

  useEffect(() => {
    if (userEligibilityState != null) {
      return;
    }
    if (!details?.eligibility) {
      return;
    }
    const allPass = details.eligibility.every((rule) => rule?.[2]);
    setUserEligibilityState(allPass ? 'eligible' : 'ineligible');
  }, [details?.eligibility, userEligibilityState]);

  const isUserRegistered = Boolean(userIsEnteredState);

  const withdrawEntrantId = useMemo(() => {
    if (!userEntry) return null;
    const candidates = [
      userEntry.entrantId,
      userEntry.contestantId,
      userEntry.entryId,
      userEntry.registrationId,
      userEntry.id,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'number' && !Number.isNaN(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string' && candidate.trim().length) {
        const parsed = Number(candidate);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return null;
  }, [userEntry]);

  const canWithdraw = withdrawEntrantId != null;
  const isEligibleToEnter = (userEligibilityState ?? '').toLowerCase() === 'eligible';
  const canEnter = !isUserRegistered && isEligibleToEnter;

  const description = useMemo(
    () => sanitizeDescription(details?.about?.tournamentDescription),
    [details?.about?.tournamentDescription]
  );

  const handleEnterEvent = useCallback(async () => {
    if (!canEnter) {
      return;
    }
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to enter this event.');
      return;
    }
    if (!eventId) {
      Alert.alert('Unavailable', 'We could not determine this event.');
      return;
    }
    setEntering(true);
    try {
      const response = await enterEvent(token, eventId);
      Alert.alert('Entry Submitted', response?.message ?? 'You have entered the event.');
      setUserIsEnteredState(true);
      setUserEligibilityState('ineligible');
      await loadDetails();
    } catch (err: any) {
      Alert.alert('Unable to Enter', err?.message ?? 'Please try again later.');
    } finally {
      setEntering(false);
    }
  }, [canEnter, token, eventId, loadDetails]);

  const handleWithdrawEvent = useCallback(async () => {
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to manage your entry.');
      return;
    }
    if (withdrawEntrantId == null) {
      Alert.alert('Unavailable', 'We could not find your entry for this event.');
      return;
    }
    setWithdrawing(true);
    try {
      const response = await withdrawEvent(token, withdrawEntrantId);
      Alert.alert('Entry Updated', response?.message ?? 'You have withdrawn from the event.');
      setUserIsEnteredState(false);
      setUserEligibilityState('eligible');
      await loadDetails();
    } catch (err: any) {
      Alert.alert('Unable to Withdraw', err?.message ?? 'Please try again later.');
    } finally {
      setWithdrawing(false);
    }
  }, [token, withdrawEntrantId, loadDetails]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!isAuthenticated && (
          <Text style={styles.helper}>
            Please sign in to view event details and enter events.
          </Text>
        )}

        {isAuthenticated && loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {isAuthenticated && !loading && error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryLink} onPress={loadDetails}>
              Tap to retry
            </Text>
          </View>
        )}

        {isAuthenticated && !loading && !error && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Overview</Text>
              <Text style={styles.label}>
                Director: <Text style={styles.value}>{details?.about?.directorName ?? '—'}</Text>
              </Text>
              {params?.status ? (
                <Text style={styles.label}>
                  Status:{' '}
                  <Text style={styles.value}>
                    {STATUS_LABEL[params.status] ?? params.status}
                  </Text>
                </Text>
              ) : null}
              <Text style={styles.label}>
                Start: <Text style={styles.value}>{formatDate(details?.about?.start)}</Text>
              </Text>
              <Text style={styles.label}>
                Skill Level:{' '}
                <Text style={styles.value}>
                  {typeof details?.about?.skillLevel === 'number'
                    ? details?.about?.skillLevel
                    : details?.about?.skillLevel ?? '—'}
                </Text>
              </Text>
              <Text style={styles.label}>
                Days Between Rounds:{' '}
                <Text style={styles.value}>
                  {details?.about?.daysBetweenRounds != null
                    ? details?.about?.daysBetweenRounds
                    : '—'}
                </Text>
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Details</Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            {!!details?.eligibility?.length && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Eligibility</Text>
                {details.eligibility.map((rule, index) => (
                  <View key={`${rule[0]}-${index}`} style={styles.eligibilityRow}>
                    <Text style={styles.eligibilityIcon}>{ruleEmoji(rule)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eligibilityText}>{rule[0]}</Text>
                      {rule[1] ? (
                        <Text style={styles.eligibilityHint}>{rule[1]}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {details?.players?.players?.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>
                  Participants ({details.players.players.length})
                </Text>
                {details.players.players.slice(0, 15).map((entry) => (
                  <View key={`${entry.entrantId}-${entry.player?.id}`} style={styles.playerRow}>
                    <Text style={styles.playerName}>{entry.player?.name ?? 'Unknown Player'}</Text>
                    <Text style={styles.playerStatus}>{entry.status ?? '—'}</Text>
                  </View>
                ))}
                {details.players.players.length > 15 ? (
                  <Text style={styles.moreNote}>
                    and {details.players.players.length - 15} more…
                  </Text>
                ) : null}
              </View>
            ) : null}

            {viewTypeParam === 'ABT' && params?.status === 'ACCEPTING' && !isUserRegistered && (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  If you wish to register for this ABT event, you need to go to the registration desk at the tournament, or email your tournament organizer.
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Actions</Text>
              <View style={styles.actions}>
                {isUserRegistered ? (
                  <>
                    <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                      <Text style={styles.actionButtonText}>Already Entered</Text>
                    </View>
                    {canWithdraw ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.withdrawButton]}
                        onPress={handleWithdrawEvent}
                        disabled={withdrawing}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.withdrawButtonText}>
                          {withdrawing ? 'Processing...' : 'Withdraw Entry'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                ) : viewTypeParam === 'ABT' ? (
                  <View style={[styles.actionButton, styles.actionButtonDisabled]}>
                    <Text style={styles.actionButtonText}>
                      Registration at tournament desk or via organizer
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      (!canEnter || entering) && styles.actionButtonDisabled,
                    ]}
                    onPress={handleEnterEvent}
                    disabled={!canEnter || entering}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>
                      {entering ? 'Submitting...' : 'Enter Event'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  headerTitle: {
    ...theme.typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.surface,
    textAlign: 'center',
    maxWidth: 220,
    fontFamily: theme.typography.heading.fontFamily,
  },
  headerBack: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerBackIcon: {
    ...theme.typography.heading,
    fontSize: 24,
    color: theme.colors.surface,
    fontFamily: theme.typography.heading.fontFamily,
  },
  content: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing['5xl'] + 80,
    gap: theme.spacing['2xl'],
  },
  helper: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing['2xl'],
  },
  loading: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryLink: {
    ...theme.typography.button,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  sectionHeading: {
    ...theme.typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.heading.fontFamily,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
  },
  value: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontFamily: theme.typography.body.fontFamily,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    fontFamily: theme.typography.body.fontFamily,
  },
  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  eligibilityIcon: {
    ...theme.typography.body,
    fontSize: 18,
    marginTop: 2,
    fontFamily: theme.typography.body.fontFamily,
  },
  eligibilityText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: 2,
    fontFamily: theme.typography.body.fontFamily,
  },
  eligibilityHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.caption.fontFamily,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  playerName: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.md,
    fontFamily: theme.typography.body.fontFamily,
  },
  playerStatus: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.caption.fontFamily,
  },
  moreNote: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontFamily: theme.typography.caption.fontFamily,
  },
  actions: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  actionButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
  withdrawButton: {
    backgroundColor: '#DA291C',
  },
  withdrawButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
  noticeBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing['2xl'],
  },
  noticeText: {
    ...theme.typography.body,
    color: '#92400E',
    fontSize: 14,
    fontFamily: theme.typography.body.fontFamily,
  },
});


