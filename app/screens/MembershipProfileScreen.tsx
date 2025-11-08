import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import * as ImagePicker from 'expo-image-picker';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';

export const MembershipProfileScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
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

      <View style={styles.titleBar}>
        <Text style={styles.titleText}>Profile</Text>
      </View>

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
            <TextField label="State" placeholder="State / Region" value={stateRegion} onChangeText={setStateRegion} />
            <TextField label="Birthdate" placeholder="YYYY-MM-DD" value={birthdate} onChangeText={setBirthdate} />
            <TextField label="Country" placeholder="Country" value={country} onChangeText={setCountry} />
            <TextField label="Timezone" placeholder="Timezone" value={timezone} onChangeText={setTimezone} />
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

      {isMenuOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setIsMenuOpen(false)} accessibilityLabel="Close menu" />
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('Events'); }}>
              <Text style={styles.menuItemText}>View Events</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('Dashboard' as any, { screen: 'CurrentEntries' } as any); }}>
              <Text style={styles.menuItemText}>Current Entries</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('Dashboard' as any, { screen: 'AccountBalance' } as any); }}>
              <Text style={styles.menuItemText}>Account Balance</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuOpen(false); navigation.navigate('MembershipPlans'); }}>
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

  titleBar: {
    backgroundColor: '#1B365D', paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['3xl'], marginHorizontal: theme.spacing['3xl'],
    marginTop: theme.spacing.lg, borderRadius: 4,
  },
  titleText: { ...theme.typography.heading, color: theme.colors.surface, fontWeight: '700', fontSize: 22 },

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

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 900 },
  menuDropdown: {
    position: 'absolute', top: 120, left: theme.spacing['3xl'], width: 220, backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5, overflow: 'hidden', zIndex: 1000,
  },
  menuItem: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing['2xl'], backgroundColor: '#FFFFFF' },
  menuItemText: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: '500' },
  logoutText: { color: '#B91C1C' },
  menuDivider: { height: 1, backgroundColor: theme.colors.border },
});
