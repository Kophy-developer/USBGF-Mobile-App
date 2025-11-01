import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';

type EventType = 'ABT' | 'ONLINE';

const Chevron: React.FC = () => <Text style={{ fontSize: 18 }}>▾</Text>;

export const EventsScreen: React.FC = () => {
  const [selectorOpen, setSelectorOpen] = React.useState(true);
  const [viewType, setViewType] = React.useState<EventType | null>(null);

  const choose = (t: EventType) => {
    setViewType(t);
    setSelectorOpen(false);
  };

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.titleBar}><Text style={styles.titleText}>{title}</Text></View>
  );

  const Row: React.FC<{ left: string } > = ({ left }) => (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Chevron />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <SectionHeader title={viewType ? 'Events' : 'Events'} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!viewType && (
          <Text style={styles.helper}>Select an events type to view</Text>
        )}

        {viewType === 'ABT' && (
          <>
            <SectionHeader title="Events" />
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

            <TouchableOpacity style={styles.calendarBtn}>
              <Text style={styles.calendarText}>View ABT Calendar</Text>
            </TouchableOpacity>
          </>
        )}

        {viewType === 'ONLINE' && (
          <>
            <SectionHeader title="Online Events" />
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
          <Text style={styles.modalTitle}>Which events do you want to view?</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={() => choose('ABT')}>
            <Text style={styles.modalBtnText}>ABT Events</Text>
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
  titleBar: { backgroundColor: '#1E3553', paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing['3xl'], marginHorizontal: theme.spacing['3xl'], marginTop: theme.spacing.lg, borderRadius: 4 },
  titleText: { color: theme.colors.surface, fontWeight: '700', fontSize: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rowLeft: { fontSize: 18, color: theme.colors.textPrimary, flex: 1, paddingRight: 8 },
  detailBox: { },
  detailInner: { paddingVertical: theme.spacing.md, paddingLeft: theme.spacing['2xl'], gap: theme.spacing.sm },
  detailLabel: { color: theme.colors.textPrimary },
  calendarBtn: { backgroundColor: '#1E3553', alignSelf: 'center', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: theme.spacing['2xl'] },
  calendarText: { color: '#FFFFFF', fontWeight: '700' },

  tabsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: theme.spacing.md },
  tabActive: { fontWeight: '800' },
  tab: { color: theme.colors.textPrimary },

  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: theme.spacing['2xl'], gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  modalTitle: { fontWeight: '700', fontSize: 18, marginBottom: theme.spacing.sm, color: theme.colors.textPrimary },
  modalBtn: { backgroundColor: '#1E3553', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
