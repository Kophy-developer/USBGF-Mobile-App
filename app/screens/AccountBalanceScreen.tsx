import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';

export const AccountBalanceScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showAddFunds, setShowAddFunds] = React.useState(false);
  const [amount, setAmount] = React.useState('99.50');
  const [method, setMethod] = React.useState<'paypal' | 'credit' | 'card'>('paypal');
  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      {/* Header (logo + hamburger + search) */}
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
        <Text style={styles.titleText}>Account Balance</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Balance rows */}
        <View style={styles.row}> 
          <Text style={styles.label}>Cash:</Text>
          <Text style={styles.value}></Text>
        </View>
        <View style={styles.row}> 
          <Text style={styles.label}>Credit:</Text>
          <Text style={styles.value}></Text>
        </View>

        {/* Add Funds button */}
        <View style={styles.addFundsContainer}>
          <TouchableOpacity style={styles.addFundsButton} onPress={() => setShowAddFunds(true)}>
            <Text style={styles.addFundsText}>Add Funds</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <Text style={styles.historyTitle}>Transaction History</Text>

        <View style={styles.tableHeader}> 
          <Text style={[styles.th, styles.colDate]}>Date</Text>
          <Text style={[styles.th, styles.colDelta]}>+ / -</Text>
          <Text style={[styles.th, styles.colBalance]}>Balance</Text>
        </View>

        <View style={styles.tableRow}> 
          <Text style={[styles.td, styles.colDate]}>10/14/2025</Text>
          <Text style={[styles.td, styles.colDelta]}>+$30</Text>
          <Text style={[styles.td, styles.colBalance]}>$40</Text>
        </View>
      </ScrollView>

      {isMenuOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setIsMenuOpen(false)} accessibilityLabel="Close menu" />
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('Dashboard' as any, { screen: 'Events' } as any);
              }}
            >
              <Text style={styles.menuItemText}>View Events</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('Dashboard' as any, { screen: 'AccountBalance' } as any);
              }}
            >
              <Text style={styles.menuItemText}>Account Balance</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('Dashboard' as any, { screen: 'MembershipPlans' } as any);
              }}
            >
              <Text style={styles.menuItemText}>Membership Plan</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.reset({ index: 0, routes: [{ name: 'AuthStack' as any }] });
              }}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Add Funds Modal */}
      <Modal visible={showAddFunds} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Funds</Text>
            <Text style={styles.modalSub}>You Pay:</Text>
            <TextField
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <View style={styles.methods}>
              <TouchableOpacity style={[styles.methodBtn, method==='paypal' && styles.methodSelected]} onPress={() => setMethod('paypal')}>
                <Text style={styles.methodText}>PayPal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodBtn, method==='credit' && styles.methodSelected]} onPress={() => setMethod('credit')}>
                <Text style={styles.methodText}>PayPal CREDIT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodBtn, method==='card' && styles.methodSelected]} onPress={() => setMethod('card')}>
                <Text style={styles.methodText}>Debit or Credit Card</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Pay Now"
                variant="primary"
                onPress={() => {
                  setShowAddFunds(false);
                  navigation.navigate('Payment', { planKey: 'add_funds', billing: 'annual' });
                }}
              />
              <TouchableOpacity onPress={() => setShowAddFunds(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.sm,
    paddingTop: theme.spacing['2xl'],
    backgroundColor: theme.colors.surface,
    minHeight: 120,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 900,
  },
  menuButton: {
    padding: theme.spacing.sm,
  },
  menuIcon: {
    fontSize: 30,
    color: theme.colors.textPrimary,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 240,
    height: 120,
  },
  searchButton: {
    padding: theme.spacing.sm,
  },
  searchIcon: {
    fontSize: 45,
    color: theme.colors.textPrimary,
  },
  titleBar: {
    backgroundColor: '#1E3553',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['3xl'],
    marginHorizontal: theme.spacing['3xl'],
    marginTop: theme.spacing.lg,
    borderRadius: 4,
  },
  titleText: {
    color: theme.colors.surface,
    fontSize: 22,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: 160,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  label: {
    fontSize: 28,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  value: {
    marginLeft: theme.spacing['2xl'],
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  addFundsContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing['3xl'],
  },
  addFundsButton: {
    backgroundColor: '#1E3553',
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    minWidth: 220,
    alignItems: 'center',
  },
  addFundsText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  historyTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing['2xl'],
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
  },
  th: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  td: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  colDate: { flex: 2 },
  colDelta: { flex: 1, textAlign: 'center' as const },
  colBalance: { flex: 1, textAlign: 'right' as const },
  menuDropdown: {
    position: 'absolute',
    top: 120,
    left: theme.spacing['3xl'],
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  menuItem: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    backgroundColor: '#FFFFFF',
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  logoutText: {
    color: '#B91C1C',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  modalSub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  methods: { gap: theme.spacing.sm, marginVertical: theme.spacing.md },
  methodBtn: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
  },
  methodSelected: {
    backgroundColor: '#1E3553',
  },
  methodText: {
    color: '#111',
    fontWeight: '600',
  },
  modalButtons: { gap: theme.spacing.md, marginTop: theme.spacing.lg, alignItems: 'center' },
  cancelText: { color: '#DC2626', fontWeight: '600' },
});
