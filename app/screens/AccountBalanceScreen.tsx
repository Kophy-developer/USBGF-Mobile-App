import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';

export const AccountBalanceScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showAddFunds, setShowAddFunds] = React.useState(false);
  const [amount, setAmount] = React.useState('99.50');
  const [method, setMethod] = React.useState<'paypal' | 'credit' | 'card'>('paypal');
  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.row}> 
          <Text style={styles.label}>Cash:</Text>
          <Text style={styles.value}></Text>
        </View>
        <View style={styles.row}> 
          <Text style={styles.label}>Credit:</Text>
          <Text style={styles.value}></Text>
        </View>

        <View style={styles.addFundsContainer}>
          <TouchableOpacity style={styles.addFundsButton} onPress={() => setShowAddFunds(true)}>
            <Text style={styles.addFundsText}>Add Funds</Text>
          </TouchableOpacity>
        </View>

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
    gap: theme.spacing.lg,
  },
  label: {
    ...theme.typography.heading,
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  value: {
    ...theme.typography.body,
    marginLeft: theme.spacing['2xl'],
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  addFundsContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing['3xl'],
  },
  addFundsButton: {
    backgroundColor: '#1B365D',
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    minWidth: 220,
    alignItems: 'center',
  },
  addFundsText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  historyTitle: {
    ...theme.typography.heading,
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: '700',
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
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  td: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  colDate: { flex: 2 },
  colDelta: { flex: 1, textAlign: 'center' as const },
  colBalance: { flex: 1, textAlign: 'right' as const },
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
    ...theme.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  modalSub: {
    ...theme.typography.caption,
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
    backgroundColor: '#1B365D',
  },
  methodText: { ...theme.typography.body,
    color: '#111',
    fontWeight: '600',
  },
  modalButtons: { gap: theme.spacing.md, marginTop: theme.spacing.lg, alignItems: 'center' },
  cancelText: { ...theme.typography.button, color: '#DC2626', fontWeight: '600' },
});
