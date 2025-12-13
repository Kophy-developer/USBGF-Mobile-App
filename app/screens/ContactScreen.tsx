import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/tokens';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile, fetchAllMessages, fetchMessageDetails, sendMessageNew } from '../services/api';

type Props = StackScreenProps<RootStackParamList, 'Contact'>;

type ChatMessage = { id: string; text: string; from: 'me' | 'them'; timestamp?: string };

export const ContactScreen: React.FC<Props> = ({ route, navigation }) => {
  const { name, message, playerId, email, messageId: routeMessageId } = route.params;
  const { token, user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactAvatar, setContactAvatar] = useState<string | null>(null);
  const [opponentEmail, setOpponentEmail] = useState<string | null>(email || null);
  const [messageId, setMessageId] = useState<number | null>(routeMessageId || null);
  const scrollViewRef = useRef<ScrollView>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const backgroundSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to match names (exact or close match)
  const matchNames = (name1: string, name2: string): boolean => {
    if (!name1 || !name2) return false;
    const normalize = (str: string) => str.toLowerCase().trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Exact match
    if (n1 === n2) return true;
    
    // Check if one contains the other (for partial matches)
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Check if names are very similar (fuzzy match for typos)
    const similarity = (s1: string, s2: string): number => {
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      if (longer.length === 0) return 1.0;
      const distance = levenshteinDistance(longer, shorter);
      return (longer.length - distance) / longer.length;
    };
    
    return similarity(n1, n2) > 0.7; // Lowered threshold for better matching
  };

  // Helper function to extract user ID from avatar URL (e.g., /avatars/13222/...)
  const extractUserIdFromAvatar = (avatarUrl: string): number | null => {
    if (!avatarUrl) return null;
    const match = avatarUrl.match(/\/avatars\/(\d+)\//);
    return match ? parseInt(match[1], 10) : null;
  };

  // Helper function to match avatars (fuzzy match - same user ID in URL)
  const matchAvatars = (avatar1: string, avatar2: string): boolean => {
    if (!avatar1 || !avatar2) return false;
    
    // Exact match
    if (avatar1 === avatar2) return true;
    
    // Extract user IDs from avatar URLs and compare
    const userId1 = extractUserIdFromAvatar(avatar1);
    const userId2 = extractUserIdFromAvatar(avatar2);
    
    if (userId1 && userId2 && userId1 === userId2) return true;
    
    // Check if URLs are similar (same base path)
    const normalizeUrl = (url: string) => {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const avatarsIndex = pathParts.indexOf('avatars');
        if (avatarsIndex >= 0 && pathParts[avatarsIndex + 1]) {
          return `${pathParts[avatarsIndex]}/${pathParts[avatarsIndex + 1]}`;
        }
      } catch {
        // If URL parsing fails, try regex
        const match = url.match(/\/avatars\/\d+/);
        return match ? match[0] : '';
      }
      return '';
    };
    
    const base1 = normalizeUrl(avatar1);
    const base2 = normalizeUrl(avatar2);
    return base1 && base2 && base1 === base2;
  };

  // Simple Levenshtein distance for name matching
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const loadMessages = useCallback(async (silent = false) => {
    if (!token || !playerId || !name) return;

    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      // Step 1: Get opponent email if not provided
      let emailToUse = opponentEmail;
      if (!emailToUse) {
        try {
          const profile = await fetchUserProfile(token, Number(playerId));
          emailToUse = profile.email || null;
          setOpponentEmail(emailToUse);
        } catch (err) {
          // If we can't get email, we can't send messages but can still try to load
        }
      }

      // Step 2: Determine messageId
      // If messageId is provided in route params (hardcoded notifications), use it directly
      // Otherwise, find it by matching opponent name in all message threads
      let foundMessageId: number | null = messageId || routeMessageId || null;
      let foundThread: any = null;
      
      if (!foundMessageId) {
        // Get all message threads to find the correct message_id
        const allThreads = await fetchAllMessages(token);
        
        // Find the correct message_id by matching opponent name
        for (const thread of allThreads) {
          if (thread.recipients && Array.isArray(thread.recipients)) {
            for (const recipient of thread.recipients) {
              if (matchNames(recipient.username || '', name)) {
                foundMessageId = thread.message_id;
                foundThread = thread; // Store the thread for current_user info
                break;
              }
            }
            if (foundMessageId) break;
          }
        }
      }

      if (!foundMessageId) {
        // No existing conversation found
        setMessages([]);
        setMessageId(null);
        setError(null);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      setMessageId(foundMessageId);

      // Step 3: Get message details by messageId
      const messageDetails = await fetchMessageDetails(token, foundMessageId);
      
      // Step 4: Extract messages and determine sender
      const allMessagesList = messageDetails?.all_messages || [];
      const currentUserId = user?.playerId;
      
      // Get current user ID from multiple sources (prioritize most reliable)
      let effectiveCurrentUserId: number | null = null;
      
      // Priority 1: current_user from messageDetails (if not 0)
      if (messageDetails.current_user && messageDetails.current_user !== 0) {
        effectiveCurrentUserId = messageDetails.current_user;
      }
      
      // Priority 2: current_user from found thread (if available)
      if (!effectiveCurrentUserId && foundThread?.current_user) {
        effectiveCurrentUserId = foundThread.current_user;
      }
      
      // Priority 3: user's playerId
      if (!effectiveCurrentUserId && currentUserId) {
        effectiveCurrentUserId = currentUserId;
      }
      
      // Get current user's recipient info - try multiple methods
      let currentUserRecipient = messageDetails.recipients?.find((r: any) => 
        effectiveCurrentUserId && String(r.user_id) === String(effectiveCurrentUserId)
      );
      
      // If still not found, try with user's playerId
      if (!currentUserRecipient && currentUserId) {
        currentUserRecipient = messageDetails.recipients?.find((r: any) => 
          String(r.user_id) === String(currentUserId)
        );
      }
      
      // Get all possible identifiers for current user
      const currentUserName = currentUserRecipient?.username || 
        user?.username || 
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 
        '';
      const currentUserAvatar = currentUserRecipient?.avatar?.full || '';
      const currentUserRecipientId = currentUserRecipient?.user_id;
      
      // Extract user ID from current user's avatar if available
      const currentUserAvatarId = extractUserIdFromAvatar(currentUserAvatar);
      
      const chatMessages: ChatMessage[] = allMessagesList.map((msg: any, index: number) => {
        const senderName = msg.sender?.sender_name || '';
        const senderAvatar = msg.sender?.user_avatars?.full || '';
        
        // Multiple methods to determine if message is from current user
        let isFromMe = false;
        
        // Method 1: Match sender avatar with current user's recipient avatar (fuzzy match)
        if (senderAvatar && currentUserAvatar) {
          isFromMe = matchAvatars(senderAvatar, currentUserAvatar);
        }
        
        // Method 2: Extract user ID from sender avatar and compare with effective current user ID
        if (!isFromMe && senderAvatar && effectiveCurrentUserId) {
          const senderAvatarId = extractUserIdFromAvatar(senderAvatar);
          if (senderAvatarId && String(senderAvatarId) === String(effectiveCurrentUserId)) {
            isFromMe = true;
          }
        }
        
        // Method 3: Extract user ID from sender avatar and compare with current user's recipient user_id
        if (!isFromMe && senderAvatar && currentUserRecipientId) {
          const senderAvatarId = extractUserIdFromAvatar(senderAvatar);
          if (senderAvatarId && senderAvatarId === currentUserRecipientId) {
            isFromMe = true;
          }
        }
        
        // Method 4: Extract user ID from sender avatar and compare with current user's playerId
        if (!isFromMe && senderAvatar && currentUserId) {
          const senderAvatarId = extractUserIdFromAvatar(senderAvatar);
          if (senderAvatarId && String(senderAvatarId) === String(currentUserId)) {
            isFromMe = true;
          }
        }
        
        // Method 4: Match sender avatar user ID with current user's avatar user ID
        if (!isFromMe && senderAvatar && currentUserAvatarId) {
          const senderAvatarId = extractUserIdFromAvatar(senderAvatar);
          if (senderAvatarId && senderAvatarId === currentUserAvatarId) {
            isFromMe = true;
          }
        }
        
        // Method 5: Name match with current user's recipient username (fuzzy)
        if (!isFromMe && currentUserRecipient?.username) {
          isFromMe = matchNames(senderName, currentUserRecipient.username);
        }
        
        // Method 6: Name match with current user's name from user object (fuzzy)
        if (!isFromMe && currentUserName) {
          isFromMe = matchNames(senderName, currentUserName);
        }
        
        // Method 7: Check if sender name matches any variation of current user's name
        if (!isFromMe && currentUserName) {
          const nameParts = currentUserName.toLowerCase().split(/\s+/);
          const senderNameLower = senderName.toLowerCase();
          // Check if sender name contains any part of current user's name
          if (nameParts.some(part => part.length > 2 && senderNameLower.includes(part))) {
            isFromMe = true;
          }
        }
        
        // Method 8: Reverse check - if current user's name contains sender name parts
        if (!isFromMe && currentUserName && senderName) {
          const senderNameParts = senderName.toLowerCase().split(/\s+/);
          const currentUserNameLower = currentUserName.toLowerCase();
          if (senderNameParts.some(part => part.length > 2 && currentUserNameLower.includes(part))) {
            isFromMe = true;
          }
        }
        
        const msgId = `msg-${foundMessageId}-${index}-${msg.date || Date.now()}`;
        if (!messageIdsRef.current.has(msgId)) {
          messageIdsRef.current.add(msgId);
        }
        
        return {
          id: msgId,
          text: msg.message || '',
          from: isFromMe ? 'me' : 'them',
          timestamp: msg.date,
        };
      });

      // Step 5: Set avatar from recipients - find the one that doesn't match current user
      if (messageDetails.recipients && Array.isArray(messageDetails.recipients)) {
        // Find the recipient that is NOT the current user (by user_id)
        const opponentRecipient = messageDetails.recipients.find((r: any) => {
          const recipientUserId = String(r.user_id || '');
          const currentUserIdStr = String(currentUserId || '');
          
          // This recipient is the opponent if their user_id doesn't match current user's
          return recipientUserId !== currentUserIdStr;
        });
        
        if (opponentRecipient?.avatar?.full) {
          setContactAvatar(opponentRecipient.avatar.full);
        }
      }

      const sortedMessages = chatMessages.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      });

      // Remove duplicates based on message ID and text content
      const uniqueMessages = sortedMessages.filter((msg, index, self) => 
        index === self.findIndex((m) => 
          m.id === msg.id || (m.text === msg.text && m.timestamp === msg.timestamp)
        )
      );

      setMessages(uniqueMessages);
      setError(null);
      
      // Scroll to bottom if new messages were added (only if not silent to avoid interrupting user)
      if (!silent && uniqueMessages.length > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (err: any) {
      const errorMsg = err?.message ?? 'Failed to load messages';
      if (!silent) {
        if (!errorMsg.toLowerCase().includes('retries') && !errorMsg.toLowerCase().includes('not found')) {
          setError(errorMsg);
        } else {
          setError(null);
        }
      }
      setMessages([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [token, playerId, name, user?.playerId, user?.username, user?.first_name, user?.last_name, opponentEmail, messageId, routeMessageId]);

  useEffect(() => {
    if (!token || !playerId || !name) {
      setError('Contact information is missing');
      setLoading(false);
      return;
    }

    loadMessages(false);

    // Set up polling for new messages (every 2 seconds for real-time updates)
    backgroundSyncIntervalRef.current = setInterval(() => {
      loadMessages(true);
    }, 2000);

    return () => {
      if (backgroundSyncIntervalRef.current) {
        clearInterval(backgroundSyncIntervalRef.current);
        backgroundSyncIntervalRef.current = null;
      }
      messageIdsRef.current.clear();
    };
  }, [token, playerId, name, loadMessages]);

  // Avatar is loaded in loadMessages from message details

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Reload messages when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token && playerId && name) {
        loadMessages(true);
      }
    }, [token, playerId, name, loadMessages])
  );

  const handleSendMessage = async () => {
    if (!input.trim() || !token || !playerId || !opponentEmail || sending) return;

    const messageText = input.trim();
    setInput('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      text: messageText,
      from: 'me',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await sendMessageNew(token, {
        content: messageText,
        receiver: String(playerId),
        receiverUsername: opponentEmail,
      });

      // Reload messages immediately after sending to get the actual message from server
      try {
        await loadMessages(true);
        // Remove optimistic message after successful reload
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        // Scroll to bottom to show the new message
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (reloadErr) {
        // Keep optimistic message if reload fails
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const errorMsg = err?.message ?? 'Failed to send message';
      Alert.alert('Error', errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['left','right','top']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please sign in to view messages.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!playerId) {
    return (
      <SafeAreaView style={styles.container} edges={['left','right','top']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Contact information is missing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left','right','top']}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Image
            source={contactAvatar ? { uri: contactAvatar } : require('../assets/USBGF_com_logo.png')}
            style={styles.avatar}
            defaultSource={require('../assets/USBGF_com_logo.png')}
          />
          <Text style={styles.contactName}>{name}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                loadMessages(false);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chat} 
            contentContainerStyle={styles.chatContent} 
            showsVerticalScrollIndicator={false}
          >
          {messages.map((m) => (
            <View key={m.id} style={[styles.bubbleRow, m.from === 'me' ? styles.bubbleRowMe : styles.bubbleRowThem]}>
              <View style={[styles.bubble, m.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, m.from === 'me' && styles.bubbleTextMe]}>{m.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            editable={!sending}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]} 
            onPress={handleSendMessage}
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
            <Text style={styles.sendBtnText}>Send</Text>
            )}
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
    fontFamily: theme.typography.heading.fontFamily,
  },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing['2xl'], paddingBottom: theme.spacing['2xl'] },
  bubbleRow: { 
    marginBottom: theme.spacing.md, 
    flexDirection: 'row',
    width: '100%',
  },
  bubbleRowMe: { 
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleRowThem: { 
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: { 
    maxWidth: '75%', 
    borderRadius: 18, 
    paddingVertical: 12, 
    paddingHorizontal: 16,
  },
  bubbleMe: { 
    backgroundColor: '#1B365D', // Dark blue for sent messages
    alignSelf: 'flex-end',
  },
  bubbleThem: { 
    backgroundColor: '#E5E5E5', // Light gray for received messages
    alignSelf: 'flex-start',
  },
  bubbleText: { 
    ...theme.typography.body, 
    fontSize: 16, 
    color: '#111111', 
    fontFamily: theme.typography.body.fontFamily,
    lineHeight: 20,
  },
  bubbleTextMe: { 
    color: '#FFFFFF', // White text for sent messages
  },

  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingTop: 10, paddingBottom: 10, marginBottom: 25, gap: 8, backgroundColor: '#F8F8F8', borderTopWidth: 1, borderTopColor: '#E5E5E5' },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: Platform.select({ ios: 10, android: 6 }), borderWidth: 1, borderColor: '#E5E5E5' },
  sendBtn: { backgroundColor: '#1B365D', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, minWidth: 60, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700', fontFamily: theme.typography.button.fontFamily },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['3xl'],
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: '#1B365D',
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    marginTop: theme.spacing.md,
  },
  retryButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

