import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { fetchMemberTransactions, fetchUserProfile, MemberPressTransaction } from '../services/api';

export const AccountBalanceScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { token, user } = useAuth();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('99.50');
  const [method, setMethod] = useState<'paypal' | 'credit' | 'card'>('paypal');
  const [cash, setCash] = useState<number | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<MemberPressTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(token);

  const loadData = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profileData = await fetchUserProfile(token, user?.playerId);
      const account = profileData.userAccountInfo?.userAccount;
      setCash(typeof account?.cash === 'number' ? account.cash : null);
      setCredits(typeof account?.credits === 'number' ? account.credits : null);

      const memberId = user?.id ?? (typeof account?.userId === 'number' ? account.userId : undefined);
      if (memberId) {
        const tx = await fetchMemberTransactions(memberId);
        setTransactions(
          tx
            .slice()
            .sort((a, b) => {
              const aTime = new Date((a.created_at ?? '').replace(' ', 'T')).getTime() || 0;
              const bTime = new Date((b.created_at ?? '').replace(' ', 'T')).getTime() || 0;
              return bTime - aTime;
            })
        );
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load account balance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.playerId, user?.id]);

  const formattedCash = useMemo(() => (cash != null ? `$${cash.toFixed(2)}` : '—'), [cash]);
  const formattedCredits = useMemo(() => (credits != null ? `$${credits.toFixed(2)}` : '—'), [credits]);

  const renderAmountDelta = (transaction: MemberPressTransaction) => {
    const amountValue = Number(transaction.amount ?? transaction.total ?? 0);
    if (Number.isNaN(amountValue)) {
      return transaction.amount ?? transaction.total ?? '—';
    }
    const sign = amountValue >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(amountValue).toFixed(2)}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value.replace(' ', 'T'));
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['left','right']}>
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.infoText}>Please sign in to view your account balance.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Retry" variant="primary" onPress={loadData} />
          </View>
        ) : (
          <>
        <View style={styles.row}> 
          <Text style={styles.label}>Cash:</Text>
          <Text style={styles.value}>{formattedCash}</Text>
        </View>
        <View style={styles.row}> 
          <Text style={styles.label}>Credit:</Text>
          <Text style={styles.value}>{formattedCredits}</Text>
        </View>

        <View style={styles.addFundsContainer}>
          <TouchableOpacity style={styles.addFundsButton} onPress={() => setShowAddFunds(true)}>
            <Text style={styles.addFundsText}>Add Funds</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.historyTitle}>Transaction History</Text>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <Text style={styles.infoText}>No transactions recorded yet.</Text>
        ) : (
          <>
        <View style={styles.tableHeader}> 
          <Text style={[styles.th, styles.colDate]}>Date</Text>
          <Text style={[styles.th, styles.colDelta]}>+ / -</Text>
          <Text style={[styles.th, styles.colBalance]}>Balance</Text>
        </View>

        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.tableRow}> 
            <Text style={[styles.td, styles.colDate]}>{formatDate(transaction.created_at)}</Text>
            <Text style={[styles.td, styles.colDelta]}>{renderAmountDelta(transaction)}</Text>
            <Text style={[styles.td, styles.colBalance]}>
              {transaction.total ? `$${Number(transaction.total).toFixed(2)}` : '—'}
            </Text>
          </View>
        ))}
          </>
        )}
          </>
        )}
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
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
  methodText: {
    ...theme.typography.body,
    color: '#111',
    fontWeight: '600',
  },
  modalButtons: { gap: theme.spacing.md, marginTop: theme.spacing.lg, alignItems: 'center' },
  cancelText: { ...theme.typography.button, color: '#DC2626', fontWeight: '600' },
});
