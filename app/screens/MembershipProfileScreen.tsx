import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import * as ImagePicker from 'expo-image-picker';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { SelectField, SelectOption } from '../components/SelectField';

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

export const MembershipProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [stateRegion, setStateRegion] = React.useState('');
  const [birthdate, setBirthdate] = React.useState('');
  const [country, setCountry] = React.useState('United States');
  const [timezone, setTimezone] = React.useState('');
  const [membershipStatus, setMembershipStatus] = React.useState<'Active' | 'Expired' | 'Non-Member'>('Active');
  const [membershipLevel, setMembershipLevel] = React.useState('Basic Monthly');

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
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
            </View>
            <TouchableOpacity style={styles.editBadge} onPress={handlePickImage} accessibilityLabel="Edit profile image">
              <Text style={styles.editBadgeText}>✎</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionCol}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Dashboard' as any, { screen: 'AccountBalance' } as any)}>
              <Text style={styles.primaryButtonText}>Account Balance</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <View style={styles.displayRow}><Text style={styles.displayLabel}>Birthdate</Text><Text style={styles.displayValue}>{birthdate || '—'}</Text></View>
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
            <SelectField label="State" value={stateRegion} onValueChange={setStateRegion} options={STATE_OPTIONS} placeholder="Select state" />
            <TextField label="Birthdate" placeholder="YYYY-MM-DD" value={birthdate} onChangeText={setBirthdate} />
            <SelectField label="Country" value={country} onValueChange={setCountry} options={COUNTRY_OPTIONS} placeholder="Select country" />
            <SelectField label="Timezone" value={timezone} onValueChange={setTimezone} options={TIMEZONE_OPTIONS} placeholder="Select timezone" />
            <View style={styles.inlineChips}>
              <View style={[styles.badge, styles.badgeActive]}><Text style={styles.badgeText}>{membershipStatus}</Text></View>
              <View style={styles.badge}><Text style={styles.badgeText}>{membershipLevel}</Text></View>
            </View>
            <View style={styles.formActions}>
              <Button title="Save" variant="primary" onPress={() => setIsEditing(false)} />
              <Button title="Cancel" variant="secondary" onPress={() => setIsEditing(false)} />
            </View>
          </View>
        )}

        {!isEditing && (
          <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }]}> 
            <Text style={styles.displayLabel}>Membership</Text>
            <View style={[styles.badge, styles.badgeActive]}><Text style={styles.badgeText}>{membershipStatus}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{membershipLevel}</Text></View>
          </View>
        )}

        <View style={[styles.card, { marginTop: theme.spacing['2xl'] }]}> 
          <Text style={styles.displayLabel}>Account Balance</Text>
          <View style={styles.divider} />
          <View style={styles.displayRow}><Text style={styles.displayLabel}>Cash</Text><Text style={styles.displayValue}>$10.00</Text></View>
          <View style={styles.divider} />
          <View style={styles.displayRow}><Text style={styles.displayLabel}>Credits</Text><Text style={styles.displayValue}>$0.00</Text></View>
        </View>
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
  editBadge: { position: 'absolute', right: -2, bottom: -2, width: 36, height: 36, borderRadius: 18, backgroundColor: '#1B365D', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  editBadgeText: { ...theme.typography.caption, color: '#FFFFFF', fontWeight: '800' },
  actionCol: { flex: 1, gap: theme.spacing.lg },
  primaryButton: { backgroundColor: '#1B365D', borderRadius: 12, paddingVertical: theme.spacing.md, alignItems: 'center' },
  primaryButtonText: { ...theme.typography.button, color: theme.colors.surface, fontWeight: '700' },

  section: { marginTop: theme.spacing['2xl'] },
  itemLine: { ...theme.typography.body, fontSize: 16, color: theme.colors.textPrimary, marginBottom: theme.spacing.md, lineHeight: 24 },
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
  displayLabel: { ...theme.typography.body, color: theme.colors.textSecondary, fontWeight: '600' },
  displayValue: { ...theme.typography.body, color: theme.colors.textPrimary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.colors.border },
  formActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md, justifyContent: 'flex-end' },
  inlineChips: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm, alignItems: 'center' },
  badge: { backgroundColor: '#E5E7EB', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  badgeActive: { backgroundColor: '#16A34A' },
  badgeText: { color: '#111', fontWeight: '700' },
});
