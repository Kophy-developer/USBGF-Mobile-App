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
import { fetchUserProfile, fetchUserTransactions, UserTransaction } from '../services/api';

export const AccountBalanceScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { token, user } = useAuth();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('99.50');
  const [method, setMethod] = useState<'paypal' | 'stripe' | 'card'>('paypal');
  const [cash, setCash] = useState<number | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'cash' | 'credit'>('cash');
  const [displayedCount, setDisplayedCount] = useState(20); // Show 20 transactions initially
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

      const accountId = typeof account?.accountId === 'number' ? account.accountId : undefined;
      if (accountId) {
        const tx = await fetchUserTransactions(token, accountId);
        setTransactions(
          tx
            .slice()
            .sort((a, b) => {
              const aDate = a.timestamp ?? a.date ?? a.created_at ?? '';
              const bDate = b.timestamp ?? b.date ?? b.created_at ?? '';
              const aTime = new Date(aDate.replace(' ', 'T').replace('(UTC)', 'Z')).getTime() || 0;
              const bTime = new Date(bDate.replace(' ', 'T').replace('(UTC)', 'Z')).getTime() || 0;
              return bTime - aTime;
            })
        );
        setDisplayedCount(20); // Reset to initial count when new data loads
      } else {
        setTransactions([]);
        setDisplayedCount(20);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load account balance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, user?.playerId, user?.id]);

  const formattedCash = useMemo(() => (cash != null ? `$${cash.toFixed(2)}` : '—'), [cash]);
  const formattedCredits = useMemo(() => (credits != null ? `$${credits.toFixed(2)}` : '—'), [credits]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'cash') {
      return transactions.filter(tx => {
        const cashAmt = Number(tx.cashAmount ?? 0);
        return !Number.isNaN(cashAmt) && cashAmt !== 0;
      });
    } else {
      return transactions.filter(tx => {
        const creditsAmt = Number(tx.creditsAmount ?? 0);
        return !Number.isNaN(creditsAmt) && creditsAmt !== 0;
      });
    }
  }, [transactions, activeTab]);

  useEffect(() => {
    setDisplayedCount(20);
  }, [activeTab]);

  const renderCashDelta = (transaction: UserTransaction) => {
    const cashAmt = Number(transaction.cashAmount ?? 0);
    if (Number.isNaN(cashAmt) || cashAmt === 0) {
      return '—';
    }
    const sign = cashAmt >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(cashAmt).toFixed(2)}`;
  };

  const renderCreditsDelta = (transaction: UserTransaction) => {
    const creditsAmt = Number(transaction.creditsAmount ?? 0);
    if (Number.isNaN(creditsAmt) || creditsAmt === 0) {
      return '—';
    }
    const sign = creditsAmt >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(creditsAmt).toFixed(2)}`;
  };

  const formatDate = (transaction: UserTransaction) => {
    const dateValue = transaction.timestamp ?? transaction.date ?? transaction.created_at;
    if (!dateValue) return '—';
    const cleaned = dateValue.replace('(UTC)', 'Z').replace(' ', 'T');
    const parsed = new Date(cleaned);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
            {/* Balance Cards */}
            <View style={styles.balanceContainer}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Cash Balance</Text>
                <Text style={styles.balanceValue}>{formattedCash}</Text>
              </View>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Credit Balance</Text>
                <Text style={styles.balanceValue}>{formattedCredits}</Text>
        </View>
        </View>

        <View style={styles.addFundsContainer}>
          <TouchableOpacity style={styles.addFundsButton} onPress={() => setShowAddFunds(true)}>
            <Text style={styles.addFundsText}>Add Funds</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.historyTitle}>Transaction History</Text>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'cash' && styles.tabActive]}
                onPress={() => setActiveTab('cash')}
              >
                <Text style={[styles.tabText, activeTab === 'cash' && styles.tabTextActive]}>
                  Cash Transactions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'credit' && styles.tabActive]}
                onPress={() => setActiveTab('credit')}
              >
                <Text style={[styles.tabText, activeTab === 'credit' && styles.tabTextActive]}>
                  Credit Transactions
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : filteredTransactions.length === 0 ? (
              <Text style={styles.infoText}>
                No {activeTab === 'cash' ? 'cash' : 'credit'} transactions recorded yet.
              </Text>
            ) : (
              <>
        <View style={styles.tableHeader}> 
                  <View style={styles.colDate}>
                    <Text style={styles.th}>Date</Text>
                  </View>
                  <View style={styles.colDelta}>
                    <Text style={[styles.th, styles.centerText]}>
                      {activeTab === 'cash' ? 'Cash +/-' : 'Credit +/-'}
                    </Text>
                  </View>
                  <View style={styles.colBalance}>
                    <Text style={[styles.th, styles.rightText]}>
                      {activeTab === 'cash' ? 'Cash Balance' : 'Credit Balance'}
                    </Text>
                  </View>
        </View>

                {filteredTransactions.slice(0, displayedCount).map((transaction) => (
                  <View key={transaction.id ?? transaction.trans_num ?? Math.random()} style={styles.tableRow}> 
                    <View style={styles.colDate}>
                      <Text style={styles.td}>{formatDate(transaction)}</Text>
                    </View>
                    <View style={styles.colDelta}>
                      <Text style={[styles.td, styles.centerText]}>
                        {activeTab === 'cash' ? renderCashDelta(transaction) : renderCreditsDelta(transaction)}
                      </Text>
                    </View>
                    <View style={styles.colBalance}>
                      <Text style={[styles.td, styles.rightText]}>
                        {activeTab === 'cash' 
                          ? (transaction.newCashBalance != null 
                              ? `$${Number(transaction.newCashBalance).toFixed(2)}` 
                              : '—')
                          : (transaction.newCreditsBalance != null 
                              ? `$${Number(transaction.newCreditsBalance).toFixed(2)}` 
                              : '—')}
                      </Text>
                    </View>
                  </View>
                ))}

                {filteredTransactions.length > displayedCount && (
                  <View style={styles.loadMoreContainer}>
                    <TouchableOpacity 
                      style={styles.loadMoreButton} 
                      onPress={() => setDisplayedCount(prev => Math.min(prev + 20, filteredTransactions.length))}
                    >
                      <Text style={styles.loadMoreText}>
                        Load More ({filteredTransactions.length - displayedCount} remaining)
                      </Text>
                    </TouchableOpacity>
        </View>
                )}
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
              keyboardType="numeric"
            />

            <View style={styles.methods}>
              <TouchableOpacity style={[styles.methodBtn, method==='paypal' && styles.methodSelected]} onPress={() => setMethod('paypal')}>
                <Text style={[styles.methodText, method==='paypal' && styles.methodTextSelected]}>PayPal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodBtn, method==='stripe' && styles.methodSelected]} onPress={() => setMethod('stripe')}>
                <Text style={[styles.methodText, method==='stripe' && styles.methodTextSelected]}>Stripe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.methodBtn, method==='card' && styles.methodSelected]} onPress={() => setMethod('card')}>
                <Text style={[styles.methodText, method==='card' && styles.methodTextSelected]}>Debit or Credit Card</Text>
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
  balanceContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing['3xl'],
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
  },
  balanceLabel: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
    fontFamily: theme.typography.caption.fontFamily,
  },
  balanceValue: {
    ...theme.typography.heading,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontFamily: theme.typography.heading.fontFamily,
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
    fontFamily: theme.typography.button.fontFamily,
  },
  historyTitle: {
    ...theme.typography.heading,
    fontSize: 22,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.heading.fontFamily,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing['2xl'],
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1B365D',
  },
  tabText: {
    ...theme.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
  },
  tabTextActive: {
    color: theme.colors.surface,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  th: {
    ...theme.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
  },
  td: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
  },
  colDate: { 
    flex: 1.5,
    minWidth: 100,
  },
  colDelta: { 
    flex: 1.2,
    minWidth: 100,
    alignItems: 'center',
  },
  colBalance: { 
    flex: 1.3,
    minWidth: 120,
    alignItems: 'flex-end',
  },
  centerText: {
    textAlign: 'center',
  },
  rightText: {
    textAlign: 'right',
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing.lg,
  },
  loadMoreButton: {
    backgroundColor: '#1B365D',
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
    minWidth: 200,
    alignItems: 'center',
  },
  loadMoreText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.typography.button.fontFamily,
  },
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
    fontFamily: theme.typography.heading.fontFamily,
  },
  modalSub: {
    ...theme.typography.caption,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.caption.fontFamily,
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
    fontFamily: theme.typography.body.fontFamily,
  },
  methodTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: { gap: theme.spacing.md, marginTop: theme.spacing.lg, alignItems: 'center' },
  cancelText: { ...theme.typography.button, color: '#DC2626', fontWeight: '600', fontFamily: theme.typography.button.fontFamily },
});
