import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

type Props = StackScreenProps<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { planKey, billing } = route.params;

  const [nameOnCard, setNameOnCard] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = nameOnCard.trim() && cardNumber.length >= 0 && expiry.length >= 0 && cvv.length >= 0;

  const handlePay = async () => {
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.form}> 
          <TextField label="Name on card" placeholder="Enter name as on card" value={nameOnCard} onChangeText={setNameOnCard} />
          <TextField label="Card number" placeholder="1234 5678 9012 3456" value={cardNumber} onChangeText={setCardNumber} />
          <View style={styles.row}> 
            <View style={styles.col}> 
              <TextField label="Expiry (MM/YY)" placeholder="MM/YY" value={expiry} onChangeText={setExpiry} />
            </View>
            <View style={styles.col}> 
              <TextField label="CVV" placeholder="123" value={cvv} onChangeText={setCvv} />
            </View>
          </View>
          <Button title="Pay now" onPress={handlePay} variant="primary" disabled={!isValid} loading={loading} />
        </View>
      </ScrollView>
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
    paddingBottom: theme.spacing['4xl'],
  },
  form: { gap: theme.spacing.md },
  row: { flexDirection: 'row', gap: theme.spacing.md },
  col: { flex: 1 },
});


