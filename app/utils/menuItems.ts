import { CommonActions } from '@react-navigation/native';

export const buildPrimaryMenuItems = (navigation: any, onLogout?: () => Promise<void> | void) => [
  {
    label: 'Current Matches',
    onPress: () => navigation.navigate('Dashboard' as never, { screen: 'CurrentEntries' } as never),
  },
  {
    label: 'View ABT Calendar',
    onPress: () => navigation.navigate('ABTCalendar' as never),
  },
  {
    label: 'Account Balance',
    onPress: () => navigation.navigate('Dashboard' as never, { screen: 'AccountBalance' } as never),
  },
  {
    label: 'Membership Plan',
    onPress: () => navigation.navigate('MembershipPlans'),
  },
  {
    label: 'Log Out',
    destructive: true,
    onPress: async () => {
      try {
        if (onLogout) {
          await onLogout();
        }
      } finally {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        })
        );
      }
    },
  },
];

