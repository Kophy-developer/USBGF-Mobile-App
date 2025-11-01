import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

type Props = StackScreenProps<RootStackParamList, 'Contact'>;

type ChatMessage = { id: string; text: string; from: 'me' | 'them' };

export const ContactScreen: React.FC<Props> = ({ route, navigation }) => {
  const { name, message } = route.params;
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    ...(message ? [{ id: 'm1', text: message, from: 'them' as const }] : []),
    { id: 'm2', text: 'Yay! See you then x', from: 'me' },
  ]);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: `m${prev.length + 1}`, text: input.trim(), from: 'me' }]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen((v) => !v)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/USBGF_com_logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="USBGF Logo" />
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleBar}>
        <Text style={styles.titleText}>Contact</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <View style={styles.content}> 
          <Text style={styles.contactName}>{name}</Text>
          <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
            {messages.map((m) => (
              <View key={m.id} style={[styles.bubbleRow, m.from === 'me' ? styles.bubbleRowMe : styles.bubbleRowThem]}>
                <View style={[styles.bubble, m.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, m.from === 'me' && styles.bubbleTextMe]}>{m.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {isMenuOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setIsMenuOpen(false)} />
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('Dashboard' as any, { screen: 'Events' } as any); }}>
              <Text style={styles.menuItemText}>View Events</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('Dashboard' as any, { screen: 'AccountBalance' } as any); }}>
              <Text style={styles.menuItemText}>Account Balance</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('Dashboard' as any, { screen: 'MembershipPlans' } as any); }}>
              <Text style={styles.menuItemText}>Membership Plan</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.reset({ index: 0, routes: [{ name: 'AuthStack' as any }] }); }}>
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing['3xl'], paddingVertical: theme.spacing.sm, paddingTop: theme.spacing['2xl'], backgroundColor: theme.colors.surface, minHeight: 120 },
  menuButton: { padding: theme.spacing.sm },
  menuIcon: { fontSize: 30, color: theme.colors.textPrimary },
  logoContainer: { alignItems: 'center', justifyContent: 'center' },
  logo: { width: 240, height: 120 },
  searchButton: { padding: theme.spacing.sm },
  searchIcon: { fontSize: 45, color: theme.colors.textPrimary },
  titleBar: { backgroundColor: '#1E3553', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing['3xl'], marginHorizontal: theme.spacing['3xl'], marginTop: theme.spacing.lg, borderRadius: 4 },
  titleText: { color: theme.colors.surface, fontWeight: '700', fontSize: 22 },

  content: { flex: 1, paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'] },
  contactName: { fontSize: 28, color: theme.colors.textPrimary, fontWeight: '700', marginBottom: theme.spacing['4xl'] },
  chat: { flex: 1 },
  chatContent: { paddingBottom: theme.spacing['2xl'] },
  bubbleRow: { marginBottom: theme.spacing.md, flexDirection: 'row' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleMe: { backgroundColor: '#0B5FFF' },
  bubbleThem: { backgroundColor: '#F0F0F0' },
  bubbleText: { fontSize: 16, color: '#111' },
  bubbleTextMe: { color: '#FFFFFF' },

  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, backgroundColor: '#F8F8F8', borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: Platform.select({ ios: 10, android: 6 }), borderWidth: 1, borderColor: '#E5E5E5' },
  sendBtn: { backgroundColor: '#1E3553', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700' },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 900 },
  menuDropdown: { position: 'absolute', top: 120, left: theme.spacing['3xl'], width: 220, backgroundColor: '#FFFFFF', borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5, overflow: 'hidden', zIndex: 1000 },
  menuItem: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing['2xl'], backgroundColor: '#FFFFFF' },
  menuItemText: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: '500' },
  logoutText: { color: '#B91C1C' },
  menuDivider: { height: 1, backgroundColor: theme.colors.border },
});
