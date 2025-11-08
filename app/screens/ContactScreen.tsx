import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
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

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: `m${prev.length + 1}`, text: input.trim(), from: 'me' }]);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left','right','top']}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
            style={styles.avatar}
            defaultSource={require('../assets/USBGF_com_logo.png')}
          />
          <Text style={styles.contactName}>{name}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <ScrollView style={styles.chat} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleRow, m.from === 'me' ? styles.bubbleRowMe : styles.bubbleRowThem]}>
              <View style={[styles.bubble, m.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, m.from === 'me' && styles.bubbleTextMe]}>{m.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  contactName: {
    ...theme.typography.heading,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: theme.spacing['2xl'] },
  bubbleRow: { marginBottom: theme.spacing.md, flexDirection: 'row' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleMe: { backgroundColor: '#0B5FFF' },
  bubbleThem: { backgroundColor: '#F0F0F0' },
  bubbleText: { ...theme.typography.body, fontSize: 16, color: '#111' },
  bubbleTextMe: { color: '#FFFFFF' },

  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingTop: 10, paddingBottom: 10, marginBottom: 25, gap: 8, backgroundColor: '#F8F8F8', borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: Platform.select({ ios: 10, android: 6 }), borderWidth: 1, borderColor: '#E5E5E5' },
  sendBtn: { backgroundColor: '#1B365D', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  sendBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },
});
