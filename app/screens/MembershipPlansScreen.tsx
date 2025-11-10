import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';

type Nav = StackNavigationProp<RootStackParamList, 'MembershipPlans'>;

export const MembershipPlansScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');

  const plans = useMemo(() => {
    if (billing === 'annual') {
      return [
        {
          key: 'basic',
          badge: 'B',
          title: 'Basic Membership',
          priceLine: '$45/Annually',
          bullets: [
            'Access to ABT Events',
            'Access to Online Tournaments',
            'All Educational Resources',
          ],
        },
        {
          key: 'premium',
          badge: 'P',
          title: 'Premium Membership',
          priceLine: '$85/Annually',
          bullets: [
            'All Basic Benefits',
            'PrimeTime Magazine (Digital)',
            'Partner Discounts',
          ],
        },
        {
          key: 'premium_plus',
          badge: 'P+',
          title: 'Premium Plus Membership',
          priceLine: '$195/Annually',
          bullets: [
            'All Premium Benefits',
            'Print edition of Primetime',
          ],
        },
      ];
    }
    return [
      {
        key: 'basic',
        badge: 'B',
        title: 'Basic Membership',
        priceLine: '$5/ Monthly',
        bullets: [
          'Access to ABT Events',
          'Access to Online Tournaments',
          'All Educational Resources',
        ],
      },
      {
        key: 'premium',
        badge: 'P',
        title: 'Premium Membership',
        priceLine: '$9/ Monthly',
        bullets: [
          'All Basic Benefits',
          'PrimeTime Magazine (Digital)',
          'Partner Discounts',
        ],
      },
      {
        key: 'premium_plus',
        badge: 'P+',
        title: 'Premium Plus Membership',
        priceLine: '$19/Annually',
        bullets: [
          'All Premium Benefits',
          'Print edition of Primetime',
        ],
      },
    ];
  }, [billing]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, billing === 'annual' && styles.toggleLabelActive]}>Annual Recurring</Text>
        <TouchableOpacity
          style={[
            styles.switchOuter,
            billing === 'annual' ? styles.switchOuterAnnual : styles.switchOuterMonthly,
          ]}
          onPress={() => setBilling(billing === 'annual' ? 'monthly' : 'annual')}
          accessibilityRole="switch"
          accessibilityState={{ checked: billing === 'monthly' }}
        >
          <View
            style={[
              styles.switchKnob,
              billing === 'monthly' ? styles.switchKnobRight : styles.switchKnobLeft,
            ]}
          />
        </TouchableOpacity>
        <Text style={[styles.toggleLabel, billing === 'monthly' && styles.toggleLabelActive]}>Monthly Recurring</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {plans.map((p) => (
          <View key={p.key} style={styles.planCard}>
            <View style={styles.planRow}>
              <View style={styles.badge}><Text style={styles.badgeText}>{p.badge}</Text></View>
              <View style={styles.planTextCol}>
                <Text style={styles.planTitle}>{p.title}</Text>
                <Text style={styles.priceLine}>{p.priceLine}</Text>
                {p.bullets.map((b, i) => (
                  <Text key={i} style={styles.bullet}>{'\u2022'} {b}</Text>
                ))}
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => navigation.navigate('Payment', { planKey: p.key, billing })}
                >
                  <Text style={styles.selectBtnText}>Select Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing['2xl'],
  },
  toggleLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  toggleLabelActive: {
    color: theme.colors.textPrimary,
  },
  switchOuter: {
    width: 56,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 3,
    position: 'relative',
    overflow: 'visible',
  },
  switchOuterAnnual: {
    backgroundColor: '#1B365D',
  },
  switchOuterMonthly: {
    backgroundColor: '#DC2626',
  },
  switchKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  switchKnobLeft: {
    left: -2,
  },
  switchKnobRight: {
    right: -2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
  },
  planCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  planRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#0B1420',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...theme.typography.heading,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  planTextCol: {
    flex: 1,
  },
  planTitle: {
    ...theme.typography.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  priceLine: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  bullet: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  selectBtn: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.md,
    backgroundColor: '#1B365D',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: 6,
  },
  selectBtnText: {
    ...theme.typography.button,
    color: theme.colors.surface,
    fontWeight: '700',
  },
});
