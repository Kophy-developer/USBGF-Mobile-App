import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

type RegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Registration'>;

interface RegistrationScreenProps {
  navigation: RegistrationScreenNavigationProp;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    country: '',
    city: '',
    address1: '',
    zip: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const next: Partial<Record<keyof typeof form, string>> = {};
    if (!form.username.trim()) next.username = 'Username is required';
    if (!form.first_name.trim()) next.first_name = 'First name is required';
    if (!form.last_name.trim()) next.last_name = 'Last name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.password.trim()) next.password = 'Password is required';
    else if (form.password.length < 6) next.password = 'Min 6 characters';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.address1.trim()) next.address1 = 'Address is required';
    if (!form.zip.trim()) next.zip = 'ZIP is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      if (form.password.trim().length > 0 && form.password.length < 6) {
        Alert.alert('Weak password', 'Password must be at least 6 characters.');
      }
      return;
    }
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      navigation.replace('MembershipPlans');
    }, 1200);
  };

  const isValid =
    form.username.trim() &&
    form.first_name.trim() &&
    form.last_name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 6 &&
    form.country.trim() &&
    form.city.trim() &&
    form.address1.trim() &&
    form.zip.trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Create Account</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <TextField
            label="Username"
            placeholder="Enter username"
            value={form.username}
            onChangeText={(t) => setField('username', t)}
            error={errors.username}
            autoCapitalize="none"
          />
          <TextField
            label="First name"
            placeholder="Enter first name"
            value={form.first_name}
            onChangeText={(t) => setField('first_name', t)}
            error={errors.first_name}
          />
          <TextField
            label="Last name"
            placeholder="Enter last name"
            value={form.last_name}
            onChangeText={(t) => setField('last_name', t)}
            error={errors.last_name}
          />
          <TextField
            label="Email"
            placeholder="Enter email"
            value={form.email}
            onChangeText={(t) => setField('email', t)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Password"
            placeholder="Create a password"
            value={form.password}
            onChangeText={(t) => setField('password', t)}
            error={errors.password}
            secureTextEntry={true}
          />
          <TextField
            label="Country"
            placeholder="Enter country"
            value={form.country}
            onChangeText={(t) => setField('country', t)}
            error={errors.country}
          />
          <TextField
            label="City"
            placeholder="Enter city"
            value={form.city}
            onChangeText={(t) => setField('city', t)}
            error={errors.city}
          />
          <TextField
            label="Address"
            placeholder="Enter address"
            value={form.address1}
            onChangeText={(t) => setField('address1', t)}
            error={errors.address1}
          />
          <TextField
            label="ZIP"
            placeholder="Enter ZIP / Postal code"
            value={form.zip}
            onChangeText={(t) => setField('zip', t)}
            error={errors.zip}
          />

          <Button title="Create account" onPress={handleSubmit} variant="primary" loading={submitting} disabled={!isValid} />
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
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['3xl'],
  },
  headerText: {
    ...theme.typography.heading,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing['4xl'],
  },
  form: {
    gap: theme.spacing.md,
  },
});
