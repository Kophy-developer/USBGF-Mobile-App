import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile } from '../services/api';

type Props = StackScreenProps<RootStackParamList, 'OpponentProfile'>;

export const OpponentProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { playerId, playerName } = route.params;
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name?: string; avatar?: string | null } | null>(null);

  useEffect(() => {
    if (!token || !playerId) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await fetchUserProfile(token, Number(playerId));
        const avatar = profileData.userProfile?.avatar || null;
        setProfile({
          name: profileData.userProfile?.name ?? playerName,
          avatar,
        });
      } catch (err) {
        setProfile({
          name: playerName,
          avatar: null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token, playerId, playerName]);

  const handleContact = () => {
    if (!playerId) return;
    navigation.navigate('Contact', {
      name: profile?.name ?? playerName ?? 'Opponent',
      playerId: playerId,
    });
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please sign in to view opponent profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!playerId) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Opponent information is missing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.profileSection}>
              <Image
                source={
                  profile?.avatar
                    ? { uri: profile.avatar }
                    : require('../assets/USBGF_com_logo.png')
                }
                style={styles.avatar}
                defaultSource={require('../assets/USBGF_com_logo.png')}
              />
              <Text style={styles.playerName}>{profile?.name ?? playerName ?? 'Opponent'}</Text>
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['4xl'],
  },
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
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing['2xl'],
    backgroundColor: '#F3F4F6',
  },
  playerName: {
    ...theme.typography.heading,
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontFamily: theme.typography.heading.fontFamily,
  },
  actionsSection: {
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: '#1B365D',
    borderRadius: 12,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['3xl'],
    minWidth: 200,
    alignItems: 'center',
  },
  contactButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: theme.typography.button.fontFamily,
  },
});

