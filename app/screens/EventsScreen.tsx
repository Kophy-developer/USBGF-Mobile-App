import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/tokens';

type EventType = 'ABT' | 'ONLINE';

const Chevron: React.FC = () => <Text style={{ ...theme.typography.body, fontSize: 18 }}>▾</Text>;

export const EventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectorOpen, setSelectorOpen] = React.useState(true);
  const [viewType, setViewType] = React.useState<EventType | null>(null);

  const choose = (t: EventType) => {
    setViewType(t);
    setSelectorOpen(false);
  };

  const Row: React.FC<{ left: string } > = ({ left }) => (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Chevron />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!viewType && (
          <Text style={styles.helper}>Select an events type to view</Text>
        )}

        {viewType === 'ABT' && (
          <>
            <Text style={styles.sectionHeading}>Current ABT Events</Text>
            <Row left="Viking Classic (Minnesota)" />
            <View style={styles.detailBox}>
              <Row left="Boston Open (Massachusetts)" />
              <View style={styles.detailInner}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailLabel}>Registration: Open</Text>
                <Text style={styles.detailLabel}>Website Link: bostonopenbg.com</Text>
              </View>
            </View>
            <Row left="Miami Open (Florida)" />

            <TouchableOpacity 
              style={styles.calendarBtn}
              onPress={() => navigation.navigate('ABTCalendar' as never)}
            >
              <Text style={styles.calendarText}>View ABT Calendar</Text>
            </TouchableOpacity>
          </>
        )}

        {viewType === 'ONLINE' && (
          <>
            <Text style={styles.sectionHeading}>Online Events</Text>
            <View style={styles.tabsRow}>
              <Text style={styles.tabActive}>Accepting</Text>
              <Text style={styles.tab}>In Progress</Text>
              <Text style={styles.tab}>Completed</Text>
      </View>
            <Row left="Speedgammon - June 2025" />
            <Row left="Board Jackpot" />
            <Row left="ABT Advanced - June" />
          </>
        )}
      </ScrollView>

      <Modal transparent visible={selectorOpen} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectorOpen(false)} />
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalBtn} onPress={() => choose('ABT')}>
            <Text style={styles.modalBtnText}>Current ABT Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalBtn} onPress={() => choose('ONLINE')}>
            <Text style={styles.modalBtnText}>Online Events</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { paddingHorizontal: theme.spacing['3xl'], paddingTop: theme.spacing['2xl'], paddingBottom: 160, gap: theme.spacing.md },
  helper: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing['2xl'] },
  sectionHeading: { ...theme.typography.heading, fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowLeft: { ...theme.typography.body, fontSize: 18, color: theme.colors.textPrimary, flex: 1, paddingRight: 8 },
  detailBox: { },
  detailInner: { paddingVertical: theme.spacing.md, paddingLeft: theme.spacing['2xl'], gap: theme.spacing.sm },
  detailLabel: { color: theme.colors.textPrimary },
  calendarBtn: { backgroundColor: '#1B365D', alignSelf: 'center', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: theme.spacing['2xl'] },
  calendarText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },

  tabsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: theme.spacing.md },
  tabActive: { ...theme.typography.body, fontWeight: '800' },
  tab: { ...theme.typography.body, color: theme.colors.textPrimary },

  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: theme.spacing['2xl'], gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  modalBtn: { backgroundColor: '#1B365D', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { ...theme.typography.button, color: '#FFFFFF', fontWeight: '700' },
});
