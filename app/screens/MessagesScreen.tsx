import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

interface Notification {
  id: string;
  title: string; // e.g. + ABT Denver or sender name
  content: string; // message preview
  contactName?: string; // when available for Contact screen
}

const notifications: Notification[] = [
  { id: '1', title: '+ ABT Denver', content: 'You have a new match! Advanced Division Round 4 vs Matt Patterson', contactName: 'Matt Patterson' },
  { id: '2', title: '+ ALERT:', content: 'Tournament Director is looking for you.' },
  { id: '3', title: 'Daniel Bachio', content: "Let’s meet at 12:30 by the registration table.", contactName: 'Daniel Bachio' },
  { id: '4', title: 'Challenge from Ben Friesen', content: 'Please make your way to the tournament room.' },
];

export const MessagesScreen: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen((v) => !v)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/USBGF_com_logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="USBGF Logo"
          />
        </View>
        
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>Messages</Text>
      </View>

      {/* Messages List */}
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

      {isMenuOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setIsMenuOpen(false)} />
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>View Events</Text></TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>Account Balance</Text></TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>Membership Plan</Text></TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}><Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text></TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['3xl'], paddingVertical: theme.spacing.sm,
    paddingTop: theme.spacing['2xl'], backgroundColor: theme.colors.surface, minHeight: 120,
  },
  menuButton: { padding: theme.spacing.sm },
  menuIcon: { fontSize: 30, color: theme.colors.textPrimary },
  logoContainer: { alignItems: 'center', justifyContent: 'center' },
  logo: { width: 240, height: 120 },
  searchButton: { padding: theme.spacing.sm },
  searchIcon: { fontSize: 45, color: theme.colors.textPrimary },

  titleBar: { backgroundColor: '#1B365D', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing['3xl'], marginHorizontal: theme.spacing['3xl'], marginTop: theme.spacing.lg, borderRadius: 4 },
  titleText: { ...theme.typography.heading, color: theme.colors.surface, fontWeight: '700', fontSize: 22 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160 },

  messageItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: theme.spacing['2xl'] },
  messageTitle: { ...theme.typography.heading, fontSize: 22, color: theme.colors.textPrimary, fontWeight: '700', marginBottom: theme.spacing.sm },
  messageText: { ...theme.typography.body, fontSize: 22, color: theme.colors.textPrimary, lineHeight: 32 },
  chevron: { fontSize: 24, color: theme.colors.textPrimary, paddingLeft: theme.spacing.md, paddingTop: theme.spacing.md },

  dropdown: { paddingLeft: theme.spacing['3xl'], paddingRight: theme.spacing['3xl'], paddingBottom: theme.spacing.md },
  contactBtn: { alignSelf: 'flex-start', backgroundColor: '#1B365D', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  contactBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 900 },
  menuDropdown: { position: 'absolute', top: 120, left: theme.spacing['3xl'], width: 220, backgroundColor: '#FFFFFF', borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5, overflow: 'hidden', zIndex: 1000 },
  menuItem: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing['2xl'], backgroundColor: '#FFFFFF' },
  menuItemText: { ...theme.typography.body, fontSize: 16, color: theme.colors.textPrimary, fontWeight: '500' },
  logoutText: { color: '#B91C1C' },
  menuDivider: { height: 1, backgroundColor: theme.colors.border },
});
