import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

interface Notification {
  id: string;
  title: string;
  content: string;
  contactName?: string;
}

const notifications: Notification[] = [
  { id: '1', title: '+ ABT Denver', content: 'You have a new match! Advanced Division Round 4 vs Matt Patterson', contactName: 'Matt Patterson' },
  { id: '2', title: '+ ALERT:', content: 'Tournament Director is looking for you.' },
  { id: '3', title: 'Daniel Bachio', content: "Let’s meet at 12:30 by the registration table.", contactName: 'Daniel Bachio' },
  { id: '4', title: 'Challenge from Ben Friesen', content: 'Please make your way to the tournament room.' },
];

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {notifications.map((n) => {
          const clickable = Boolean(n.contactName);
          const isOpen = !!expanded[n.id];
          return (
            <View key={n.id}>
              <TouchableOpacity style={styles.messageItem} activeOpacity={0.7} onPress={() => clickable && toggle(n.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.messageTitle}>{n.title}</Text>
                  <Text style={styles.messageText}>{n.content}</Text>
                </View>
                {clickable ? <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text> : <View style={{ width: 24 }} />}
              </TouchableOpacity>
              {clickable && isOpen && (
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => navigation.navigate('Contact', { name: n.contactName!, message: n.content })}
                  >
                    <Text style={styles.contactBtnText}>Contact</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
  chevron: { fontSize: 20, color: theme.colors.textSecondary, paddingTop: theme.spacing.xs },
  dropdown: { paddingLeft: theme.spacing['3xl'], paddingBottom: theme.spacing.md },
  contactBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1B365D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  contactBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },
});
