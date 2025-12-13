import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { fetchUpcomingMatches } from '../services/api';

interface Notification {
  id: string;
  title: string;
  content: string;
  contactName?: string;
  playerId?: number | string;
  email?: string;
  messageId?: number; // For hardcoded notifications
}

const hardcodedNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Jersey Member Blitz - 2026',
    content: 'Round 2 vs kophy test.',
    contactName: 'kophy test',
    playerId: 13903,
    email: 'kophytech@gmail.com',
    messageId: 218, // Use messageId 218 for hardcoded notifications
  },
  {
    id: '2',
    title: 'Florida Member Blitz - 2026',
    content: 'Round 2 vs SSC.',
    contactName: 'SSC',
    playerId: 12357,
    email: 'stuart.steene@gmail.com',
    messageId: 218, // Use messageId 218 for hardcoded notifications
  },
];

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { token, user } = useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>(hardcodedNotifications);
  const [loading, setLoading] = useState(true);

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
    setExpanded((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const loadNotifications = useCallback(async () => {
    if (!token || !user?.playerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const upcomingData = await fetchUpcomingMatches(token, { playerId: user.playerId });
      const awaitingResults = upcomingData?.awaitingResults || [];
      
      // Create notifications from awaitingResults
      const dynamicNotifications: Notification[] = awaitingResults
        .filter((match: any) => match?.opponent?.id && match?.opponent?.name)
        .map((match: any, index: number) => {
          const opponent = match.opponent;
          const event = match.event;
          const round = match.round;

          return {
            id: `match-${match.contestId || index}`,
            title: event?.name || 'Match',
            content: `Round ${round || 'N/A'} vs ${opponent.name}.`,
            contactName: opponent.name,
            playerId: opponent.id,
          };
        });

      // Combine hardcoded notifications with dynamic ones
      setNotifications([...hardcodedNotifications, ...dynamicNotifications]);
    } catch (error) {
      // On error, just use hardcoded notifications
      console.log('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.playerId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleContactPress = (notification: Notification) => {
    if (!notification.contactName || !notification.playerId) return;
    navigation.navigate('Contact', { 
      name: notification.contactName, 
      playerId: notification.playerId,
      email: notification.email,
      messageId: notification.messageId, // Pass messageId for hardcoded notifications
    });
  };

  const visibleNotifications = notifications.filter((n) => !deletedIds.has(n.id));

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>

      <GestureHandlerRootView style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {visibleNotifications.map((n) => {
            const clickable = Boolean(n.contactName);
            const isOpen = !!expanded[n.id];
            
            const renderLeftActions = () => (
              <View style={styles.swipeDeleteContainer}>
                <TouchableOpacity
                  style={styles.swipeDeleteButton}
                  onPress={() => handleDelete(n.id)}
                >
                  <Ionicons name="trash" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
            
            return (
              <Swipeable
                key={n.id}
                renderLeftActions={clickable ? renderLeftActions : undefined}
                overshootLeft={false}
              >
                <View>
                  <TouchableOpacity style={[styles.messageItem, isOpen && styles.messageItemExpanded]} activeOpacity={0.7} onPress={() => clickable && toggle(n.id)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.messageTitle}>{n.title}</Text>
                      <Text style={styles.messageText}>{n.content}</Text>
                    </View>
                    {clickable ? (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          style={styles.deleteIconBtn}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
                      </View>
                    ) : <View style={{ width: 24 }} />}
                  </TouchableOpacity>
                  {clickable && isOpen && (
                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => handleContactPress(n)}
                      >
                        <Text style={styles.contactBtnText}>Contact</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Swipeable>
            );
          })}
          </ScrollView>
        )}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: 160,
    gap: theme.spacing.md,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  messageItemExpanded: {
    borderBottomWidth: 0, 
  },
  messageTitle: {
    ...theme.typography.heading,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  messageText: {
    ...theme.typography.body,
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  deleteIconBtn: {
    padding: theme.spacing.xs,
  },
  deleteIcon: {
    // Icon component handles its own styling
  },
  swipeDeleteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    marginVertical: theme.spacing.sm,
    marginRight: theme.spacing.md,
    borderRadius: 8,
    width: 80,
  },
  swipeDeleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  swipeDeleteIcon: {
    // Icon component handles its own styling
  },
  chevron: { 
    fontSize: 18, 
    color: theme.colors.textSecondary, 
    lineHeight: 18,
    width: 18,
    height: 18,
    textAlign: 'center',
    includeFontPadding: false,
  },
  dropdown: { paddingLeft: 0, paddingBottom: theme.spacing.md },
  contactBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1B365D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  contactBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
