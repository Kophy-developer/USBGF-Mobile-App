import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/tokens';

type EventType = 'ABT' | 'ONLINE';

const Chevron: React.FC = () => <Text style={{ fontSize: 18 }}>▾</Text>;

export const MatchesScreen: React.FC = () => {
  const [selectorOpen, setSelectorOpen] = React.useState(true);
  const [viewType, setViewType] = React.useState<EventType | null>(null);

  const choose = (t: EventType) => {
    setViewType(t);
    setSelectorOpen(false);
  };

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.titleBar}><Text style={styles.titleText}>{title}</Text></View>
  );

  const Row: React.FC<{ left: string; right: string } > = ({ left, right }) => (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.rowRight}>{right}</Text>
        <Chevron />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <SectionHeader title={viewType ? (viewType === 'ABT' ? 'Matches' : 'Online Matches') : 'Matches'} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!viewType && (
          <Text style={styles.helper}>Select an events type to view</Text>
        )}

        {viewType === 'ABT' && (
          <>
            <SectionHeader title="Matches" />
            <Row left="John Pirner" right="Amateur Jackpot" />
            <View style={styles.detailBox}>
              <Row left="Karen Davis" right="Board Jackpot" />
              <View style={styles.detailInner}>
                <Pressable style={styles.contactBtn}><Text style={styles.contactText}>Contact</Text></Pressable>
                <Text style={styles.detailText}>Round: 3{"\n"}Format: 7 pt{"\n"}Deadline: 08/25/25</Text>
              </View>
            </View>
            <Row left="Ed Corey" right="ABT Advanced" />

            <SectionHeader title="Awaiting Draw" />
            {/* Opponents on top, event name below */}
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.rowLeft}>Ted Chee vs Neil Kaza.</Text>
                <Text style={styles.rowSub}>Speedgammon - July 2025</Text>
              </View>
              <Chevron />
            </View>
            <Row left="TBD vs TBD" right="Board Jackpot" />
            <Row left="TBD vs Ed Corey" right="ABT Advanced - June" />
          </>
        )}

        {viewType === 'ONLINE' && (
          <>
            <SectionHeader title="Online Matches" />
            <Row left="Stu Steene-Connolly" right="Speedgammon - June 2025" />
            <Row left="Ted Chee" right="Board Jackpot" />
            <Row left="Ed Corey" right="ABT Advanced - June" />
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
  rowLeft: { fontSize: 18, color: theme.colors.textPrimary },
  rowRight: { fontSize: 18, color: theme.colors.textPrimary },
  rowSub: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  detailBox: { },
  detailInner: { paddingVertical: theme.spacing.md, paddingLeft: theme.spacing['2xl'], gap: theme.spacing.md },
  contactBtn: { alignSelf: 'flex-start', backgroundColor: '#1E3553', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  contactText: { color: '#FFFFFF', fontWeight: '700' },
  detailText: { color: theme.colors.textPrimary, lineHeight: 22 },

  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { position: 'absolute', left: 24, right: 24, top: '30%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: theme.spacing['2xl'], gap: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  modalTitle: { fontWeight: '700', fontSize: 18, marginBottom: theme.spacing.sm, color: theme.colors.textPrimary },
  modalBtn: { backgroundColor: '#1E3553', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
