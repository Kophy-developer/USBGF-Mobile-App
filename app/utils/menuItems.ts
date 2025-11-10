import { CommonActions } from '@react-navigation/native';

export const buildPrimaryMenuItems = (navigation: any) => [
  {
    label: 'View Events',
    onPress: () => navigation.navigate('Events'),
  },
  {
    label: 'Current Entries',
    onPress: () => navigation.navigate('Dashboard' as never, { screen: 'CurrentEntries' } as never),
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
    onPress: () =>
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        })
      ),
  },
];

