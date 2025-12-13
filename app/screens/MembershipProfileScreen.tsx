import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { SelectField, SelectOption } from '../components/SelectField';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile, updateProfilePicture, updateProfile } from '../services/api';

const PENDING_UPDATE_KEY = 'profile.pendingUpdate';

const COUNTRY_OPTIONS: SelectOption[] = [
  { label: 'United States', value: 'United States' },
];

const STATE_OPTIONS: SelectOption[] = [
  { label: 'Alabama', value: 'Alabama' },
  { label: 'Alaska', value: 'Alaska' },
  { label: 'Arizona', value: 'Arizona' },
  { label: 'Arkansas', value: 'Arkansas' },
  { label: 'California', value: 'California' },
  { label: 'Colorado', value: 'Colorado' },
  { label: 'Connecticut', value: 'Connecticut' },
  { label: 'Delaware', value: 'Delaware' },
  { label: 'District of Columbia', value: 'District of Columbia' },
  { label: 'Florida', value: 'Florida' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Hawaii', value: 'Hawaii' },
  { label: 'Idaho', value: 'Idaho' },
  { label: 'Illinois', value: 'Illinois' },
  { label: 'Indiana', value: 'Indiana' },
  { label: 'Iowa', value: 'Iowa' },
  { label: 'Kansas', value: 'Kansas' },
  { label: 'Kentucky', value: 'Kentucky' },
  { label: 'Louisiana', value: 'Louisiana' },
  { label: 'Maine', value: 'Maine' },
  { label: 'Maryland', value: 'Maryland' },
  { label: 'Massachusetts', value: 'Massachusetts' },
  { label: 'Michigan', value: 'Michigan' },
  { label: 'Minnesota', value: 'Minnesota' },
  { label: 'Mississippi', value: 'Mississippi' },
  { label: 'Missouri', value: 'Missouri' },
  { label: 'Montana', value: 'Montana' },
  { label: 'Nebraska', value: 'Nebraska' },
  { label: 'Nevada', value: 'Nevada' },
  { label: 'New Hampshire', value: 'New Hampshire' },
  { label: 'New Jersey', value: 'New Jersey' },
  { label: 'New Mexico', value: 'New Mexico' },
  { label: 'New York', value: 'New York' },
  { label: 'North Carolina', value: 'North Carolina' },
  { label: 'North Dakota', value: 'North Dakota' },
  { label: 'Ohio', value: 'Ohio' },
  { label: 'Oklahoma', value: 'Oklahoma' },
  { label: 'Oregon', value: 'Oregon' },
  { label: 'Pennsylvania', value: 'Pennsylvania' },
  { label: 'Rhode Island', value: 'Rhode Island' },
  { label: 'South Carolina', value: 'South Carolina' },
  { label: 'South Dakota', value: 'South Dakota' },
  { label: 'Tennessee', value: 'Tennessee' },
  { label: 'Texas', value: 'Texas' },
  { label: 'Utah', value: 'Utah' },
  { label: 'Vermont', value: 'Vermont' },
  { label: 'Virginia', value: 'Virginia' },
  { label: 'Washington', value: 'Washington' },
  { label: 'West Virginia', value: 'West Virginia' },
  { label: 'Wisconsin', value: 'Wisconsin' },
  { label: 'Wyoming', value: 'Wyoming' },
];

const TIMEZONE_OPTIONS: SelectOption[] = [
  { label: 'Atlantic Time (AT)', value: 'Atlantic Time (AT)' },
  { label: 'Eastern Time (ET)', value: 'Eastern Time (ET)' },
  { label: 'Central Time (CT)', value: 'Central Time (CT)' },
  { label: 'Mountain Time (MT)', value: 'Mountain Time (MT)' },
  { label: 'Mountain Time (Arizona)', value: 'Mountain Time (Arizona)' },
  { label: 'Pacific Time (PT)', value: 'Pacific Time (PT)' },
  { label: 'Alaska Time (AKT)', value: 'Alaska Time (AKT)' },
  { label: 'Hawaii-Aleutian Time (HAT)', value: 'Hawaii-Aleutian Time (HAT)' },
  { label: 'Chamorro Time (CHST)', value: 'Chamorro Time (CHST)' },
];

const STATE_ABBREVIATIONS: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

export const MembershipProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { token, user, signOut } = useAuth();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<'Active' | 'Expired' | 'Non-Member'>('Non-Member');
  const [membershipLevel, setMembershipLevel] = useState('—');
  const [accountCash, setAccountCash] = useState<number | null>(null);
  const [accountCredits, setAccountCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateOptions, setStateOptions] = useState<SelectOption[]>(STATE_OPTIONS);
  const [countryOptions, setCountryOptions] = useState<SelectOption[]>(COUNTRY_OPTIONS);
  const [timezoneOptions, setTimezoneOptions] = useState<SelectOption[]>(TIMEZONE_OPTIONS);
  
  const pendingUpdateRef = useRef<{
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile_phone?: string;
    state?: string;
    country?: string;
    timezone?: string;
  } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadProfile = useCallback(async (forceLoad = false) => {
    if (!token) {
      return;
    }
    
    if (!forceLoad && pendingUpdateRef.current) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Fetch logged-in user's profile using playerId to get the profile picture
      const profileData = await fetchUserProfile(token, user?.playerId);
      const { userAccountInfo, avatar, name, firstName, lastName, email, phone, state, country, timezone, memberType, memberLevel } = profileData;
      const account = userAccountInfo?.userAccount;

      setName(name || [firstName, lastName].filter(Boolean).join(' ') || '');
      setEmail(email || '');
      setPhone(phone || '');

      const rawState = (state ?? '').trim();
      const normalizedState = rawState ? (STATE_ABBREVIATIONS[rawState.toUpperCase()] ?? rawState) : '';
      if (normalizedState) {
        setStateOptions((prev) =>
          prev.some((option) => option.value === normalizedState)
            ? prev
            : [...prev, { label: normalizedState, value: normalizedState }]
        );
      }
      setStateRegion(normalizedState);

      const rawCountry = (country ?? '').trim();
      const normalizedCountry = rawCountry.toUpperCase() === 'US' ? 'United States' : rawCountry || 'United States';
      if (normalizedCountry) {
        setCountryOptions((prev) =>
          prev.some((option) => option.value === normalizedCountry)
            ? prev
            : [...prev, { label: normalizedCountry, value: normalizedCountry }]
        );
      }
      setCountry(normalizedCountry);

      const rawTimezone = (timezone ?? '').trim();
      if (rawTimezone) {
        setTimezoneOptions((prev) =>
          prev.some((option) => option.value === rawTimezone)
            ? prev
            : [...prev, { label: rawTimezone, value: rawTimezone }]
        );
      }
      setTimezone(rawTimezone || '');

      // Extract avatar from the top-level avatar object - use the 'full' image
      const avatarUrl = avatar?.full || null;
      setAvatarUri(avatarUrl);

      setMembershipLevel(memberType || '—');
      const levelNumber = memberLevel ?? 0;
      setMembershipStatus(levelNumber > 0 ? 'Active' : 'Non-Member');

      setAccountCash(typeof account?.cash === 'number' ? account.cash : null);
      setAccountCredits(typeof account?.credits === 'number' ? account.credits : null);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, [token, user?.playerId]);

  const checkBackendUpdate = useCallback(async () => {
    if (!token || !pendingUpdateRef.current) {
      return;
    }

    try {
      // Fetch logged-in user's profile using playerId to get the profile picture
      const profileData = await fetchUserProfile(token, user?.playerId);
      const { firstName, lastName, email, phone, state, country, timezone } = profileData;
      
      const backendFirstName = firstName || '';
      const backendLastName = lastName || '';
      const backendEmail = email || '';
      const backendPhone = phone || '';
      const backendState = (state || '').trim();
      const backendCountry = (country || '').trim();
      const backendTimezone = (timezone || '').trim();
      
      const pending = pendingUpdateRef.current;
      
      const firstNameMatch = !pending.first_name || backendFirstName === pending.first_name;
      const lastNameMatch = !pending.last_name || backendLastName === pending.last_name;
      const emailMatch = !pending.email || backendEmail === pending.email;
      const phoneMatch = !pending.mobile_phone || backendPhone === pending.mobile_phone;
      
      const normalizedBackendState = STATE_ABBREVIATIONS[backendState.toUpperCase()] || backendState;
      const normalizedPendingState = STATE_ABBREVIATIONS[pending.state?.toUpperCase() || ''] || pending.state;
      const stateMatch = !pending.state || normalizedBackendState === normalizedPendingState || backendState === pending.state;
      
      const normalizedBackendCountry = backendCountry.toUpperCase() === 'US' ? 'US' : backendCountry;
      const normalizedPendingCountry = pending.country === 'United States' ? 'US' : pending.country;
      const countryMatch = !pending.country || normalizedBackendCountry === normalizedPendingCountry || backendCountry === pending.country;
      
      const timezoneMatch = !pending.timezone || backendTimezone === pending.timezone;
      
      if (firstNameMatch && lastNameMatch && emailMatch && phoneMatch && stateMatch && countryMatch && timezoneMatch) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        pendingUpdateRef.current = null;
        await AsyncStorage.removeItem(PENDING_UPDATE_KEY);
        await loadProfile(true);
      }
    } catch (err) {
    }
  }, [token, user?.playerId, loadProfile]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(() => {
      checkBackendUpdate();
    }, 60000);
  }, [checkBackendUpdate]);

  useEffect(() => {
    const initializeProfile = async () => {
      const storedPending = await AsyncStorage.getItem(PENDING_UPDATE_KEY);
      if (storedPending) {
        try {
          pendingUpdateRef.current = JSON.parse(storedPending);
          startPolling();
        } catch (err) {
          await AsyncStorage.removeItem(PENDING_UPDATE_KEY);
        }
      }
      await loadProfile();
    };
    
    initializeProfile();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [loadProfile, startPolling]);

  const handlePickImage = async () => {
    if (avatarUploading) {
      return;
    }
    if (!token) {
      Alert.alert('Sign In Required', 'Please sign in to update your profile picture.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert('Permission Required', 'Please allow photo library access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (!asset.uri) {
        return;
      }
      const previousAvatar = avatarUri;
      const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? `profile-${Date.now()}.jpg`;
      const extension = fileName.split('.').pop()?.toLowerCase();
      const derivedType =
        asset.mimeType ??
        (extension
          ? extension === 'jpg' || extension === 'jpeg'
            ? 'image/jpeg'
            : `image/${extension}`
          : 'image/jpeg');

      setAvatarUri(asset.uri);
      setAvatarUploading(true);
      try {
        const response = await updateProfilePicture(token, {
          uri: asset.uri,
          name: fileName,
          type: derivedType || 'image/jpeg',
        });
        const remoteUrl =
          response.data?.meta?.profile_picture_url ??
          response.data?.urls?.['96'] ??
          response.data?.urls?.['48'] ??
          response.data?.urls?.['24'] ??
          null;
        if (remoteUrl) {
          setAvatarUri(remoteUrl);
    }
        Alert.alert('Success', 'Profile picture updated successfully.');
      } catch (err: any) {
        setAvatarUri(previousAvatar ?? null);
        Alert.alert('Upload Failed', err?.message ?? 'Unable to update profile picture.');
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  const isAuthenticated = Boolean(token);
  const formattedCash = useMemo(() => (accountCash != null ? `$${accountCash.toFixed(2)}` : '—'), [accountCash]);
  const formattedCredits = useMemo(() => (accountCredits != null ? `$${accountCredits.toFixed(2)}` : '—'), [accountCredits]);

  const handleLogout = async () => {
    try {
      await signOut?.();
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthStack' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>👤</Text>
              )}
              {avatarUploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.editBadge, avatarUploading && styles.editBadgeDisabled]}
              onPress={handlePickImage}
              accessibilityLabel="Edit profile image"
              disabled={avatarUploading}
            >
              <Text style={styles.editBadgeText}>✎</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionPill, styles.actionPrimary]} onPress={() => setIsEditing(true)}>
              <Text style={styles.actionPillText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionPill, styles.actionDestructive]} onPress={handleLogout}>
              <Text style={styles.actionPillText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isAuthenticated && (
          <View style={[styles.card, styles.centerContent]}>
            <Text style={styles.infoText}>Please sign in to view your profile.</Text>
          </View>
        )}

        {isAuthenticated && loading && (
          <View style={[styles.card, styles.centerContent]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {isAuthenticated && !loading && error && (
          <View style={[styles.card, styles.centerContent]}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Retry"
              variant="primary"
              onPress={() => {
                loadProfile();
              }}
            />
          </View>
        )}

        {isAuthenticated && !loading && !error && (
          <>
        {!isEditing && (
          <View style={styles.card}>
            <View style={styles.displayRow}><Text style={styles.displayLabel}>Name</Text><Text style={styles.displayValue}>{name || '—'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.displayRow}><Text style={styles.displayLabel}>Email</Text><Text style={styles.displayValue}>{email || '—'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.displayRow}><Text style={styles.displayLabel}>Phone</Text><Text style={styles.displayValue}>{phone || '—'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.displayRow}><Text style={styles.displayLabel}>State</Text><Text style={styles.displayValue}>{stateRegion || '—'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.displayRow}><Text style={styles.displayLabel}>Country</Text><Text style={styles.displayValue}>{country || '—'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.displayRow}><Text style={styles.displayLabel}>Timezone</Text><Text style={styles.displayValue}>{timezone || '—'}</Text></View>
          </View>
        )}
        {isEditing && (
          <View style={[styles.card, styles.formCard]}> 
            <TextField label="Name" placeholder="Full name" value={name} onChangeText={setName} />
            <TextField label="Email" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="Phone" placeholder="Enter phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <SelectField label="State" value={stateRegion} onValueChange={setStateRegion} options={stateOptions} placeholder="Select state" />
            <SelectField label="Country" value={country} onValueChange={setCountry} options={countryOptions} placeholder="Select country" />
            <SelectField label="Timezone" value={timezone} onValueChange={setTimezone} options={timezoneOptions} placeholder="Select timezone" />
            <View style={styles.inlineChips}>
              <View style={[styles.badge, styles.badgeActive]}><Text style={styles.badgeText}>{membershipStatus}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>{membershipLevel}</Text></View>
            </View>
            <View style={styles.formActions}>
              <Button 
                title="Save" 
                variant="primary" 
                onPress={async () => {
                  if (!token) {
                    Alert.alert('Error', 'Please sign in to update your profile.');
                    return;
                  }
                  try {
                    setLoading(true);
                    const nameParts = name.trim().split(/\s+/);
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';
                    
                    const stateAbbr = Object.entries(STATE_ABBREVIATIONS).find(
                      ([_, fullName]) => fullName === stateRegion
                    )?.[0] || stateRegion;
                    
                    const countryCode = country === 'United States' ? 'US' : country;
                    
                    const updateData = {
                      first_name: firstName,
                      last_name: lastName,
                      email: email.trim() || undefined,
                      mobile_phone: phone.trim() || undefined,
                      state: stateAbbr || undefined,
                      country: countryCode || undefined,
                      timezone: timezone.trim() || undefined,
                    };
                    
                    await updateProfile(token, updateData);
                    
                    const pendingUpdate = {
                      first_name: firstName || undefined,
                      last_name: lastName || undefined,
                      email: email.trim() || undefined,
                      mobile_phone: phone.trim() || undefined,
                      state: stateAbbr || undefined,
                      country: countryCode || undefined,
                      timezone: timezone.trim() || undefined,
                    };
                    
                    pendingUpdateRef.current = pendingUpdate;
                    await AsyncStorage.setItem(PENDING_UPDATE_KEY, JSON.stringify(pendingUpdate));
                    
                    startPolling();
                    
                    setIsEditing(false);
                    Alert.alert('Success', 'Profile updated successfully.');
                  } catch (err: any) {
                    Alert.alert('Update Failed', err?.message ?? 'Unable to update profile.');
                  } finally {
                    setLoading(false);
                  }
                }} 
              />
              <Button 
                title="Cancel" 
                variant="secondary" 
                onPress={async () => {
                  await loadProfile();
                  setIsEditing(false);
                }} 
              />
            </View>
          </View>
        )}

        {!isEditing && (
          <View style={[styles.card, styles.membershipCard]}> 
            <View style={styles.membershipHeader}>
              <Text style={styles.displayLabel}>Membership</Text>
            </View>
            <View style={styles.membershipBadges}>
              <View style={[styles.badge, styles.badgeActive]}>
                <Text style={styles.badgeText}>{membershipStatus}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{membershipLevel}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.changePlanButton}
              onPress={() => navigation.navigate('MembershipPlans')}
            >
              <Text style={styles.changePlanText}>Change Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.card, { marginTop: theme.spacing['2xl'], gap: theme.spacing.md }]}> 
          <View style={styles.accountHeader}>
            <View style={styles.accountTitleRow}>
          <Text style={styles.displayLabel}>Account Balance</Text>
              <TouchableOpacity
                style={[styles.balanceButton]}
                onPress={() => navigation.navigate('AccountBalance')}
                activeOpacity={0.85}
              >
                <Text style={styles.balanceButtonText}>View Balance</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.displayRow}><Text style={styles.displayLabel}>Cash</Text><Text style={styles.displayValue}>{formattedCash}</Text></View>
          <View style={styles.divider} />
          <View style={styles.displayRow}><Text style={styles.displayLabel}>Credits</Text><Text style={styles.displayValue}>{formattedCredits}</Text></View>
        </View>
          </>
        )}
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['2xl'], marginBottom: theme.spacing['2xl'] },
  avatarWrapper: { position: 'relative' },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 48 },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: { position: 'absolute', right: -2, bottom: -2, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1B365D', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  editBadgeDisabled: { opacity: 0.5 },
  editBadgeText: { ...theme.typography.caption, color: '#FFFFFF', fontWeight: '800' },
  actionGrid: {
    flex: 1,
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  actionPill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: 999,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  actionPrimary: {
    backgroundColor: '#1B365D',
  },
  actionDestructive: {
    backgroundColor: '#B91C1C',
  },
  actionPillText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: theme.spacing.md,
  },
  formCard: { gap: theme.spacing.md },
  displayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  membershipCard: { gap: theme.spacing.md },
  membershipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: theme.spacing.md,
  },
  membershipBadges: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  changePlanButton: {
    backgroundColor: '#1B365D',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  changePlanText: {
    ...theme.typography.button,
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
  balanceButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 10,
    backgroundColor: '#1B365D',
    alignSelf: 'center',
  },
  balanceButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
    fontSize: 12,
  },
  displayLabel: { ...theme.typography.body, color: theme.colors.textSecondary, fontWeight: '600' },
  displayValue: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.colors.border },
  formActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md, justifyContent: 'flex-end' },
  inlineChips: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm, alignItems: 'center' },
  badge: { backgroundColor: '#E5E7EB', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  badgeActive: { backgroundColor: '#16A34A' },
  badgeText: { ...theme.typography.button, color: '#111', fontWeight: '700' },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error || '#B91C1C',
    textAlign: 'center',
  },
});
