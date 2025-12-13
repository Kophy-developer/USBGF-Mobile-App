import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { theme } from '../theme/tokens';
import { Button } from '../components/Button';

type LegalWebviewNavigationProp = StackNavigationProp<RootStackParamList, 'LegalWebview'>;
type LegalWebviewRouteProp = RouteProp<RootStackParamList, 'LegalWebview'>;

interface LegalWebviewProps {
  navigation: LegalWebviewNavigationProp;
  route: LegalWebviewRouteProp;
}

export const LegalWebview: React.FC<LegalWebviewProps> = ({ navigation, route }) => {
  const { type } = route.params;

  const handleOpenPDF = async () => {
    const pdfUrl = 'https://usbgf.org/wp-content/uploads/2021/05/USBGF-ByLaws-C-2017-03-07.pdf';
    
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        console.log('Cannot open PDF URL');
      }
    } catch (error) {
      console.log('Error opening PDF:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>USBGF ByLaws</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>USBGF ByLaws Document</Text>
          <Text style={styles.infoText}>
            The USBGF ByLaws contain the official rules and regulations governing the United States Backgammon Federation. This document outlines the organization's structure, membership requirements, and operational procedures.
          </Text>
          
          <Text style={styles.infoText}>
            To view the complete ByLaws document, please tap the button below to open it in your browser.
          </Text>
          
          <Button
            title="View USBGF ByLaws PDF"
            onPress={handleOpenPDF}
            variant="primary"
            style={styles.pdfButton}
          />
          
          <Text style={styles.noteText}>
            Note: The PDF will open in your default browser or PDF viewer.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['3xl'],
    paddingVertical: theme.spacing['2xl'],
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  pdfButton: {
    marginVertical: theme.spacing['2xl'],
  },
  noteText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
});
