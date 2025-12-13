import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/tokens';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, value, placeholder, options, onValueChange }) => {
  const [open, setOpen] = React.useState(false);

  const handleChoose = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setOpen(true)} activeOpacity={0.8}>
          <Text style={[styles.valueText, !selectedLabel && styles.placeholderText]}>
            {selectedLabel ?? placeholder ?? 'Select an option'}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <ScrollView contentContainerStyle={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionRow}
                onPress={() => handleChoose(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.value === value && styles.optionSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
    fontFamily: theme.typography.body.fontFamily,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    minHeight: 48,
  },
  valueText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
  },
  placeholderText: {
    ...theme.typography.body,
    color: theme.colors.placeholder,
    fontFamily: theme.typography.body.fontFamily,
  },
  chevron: {
    ...theme.typography.body,
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.body.fontFamily,
    marginLeft: theme.spacing.sm,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing['2xl'],
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  sheetTitle: {
    ...theme.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.heading.fontFamily,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionRow: {
    paddingVertical: theme.spacing.sm,
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.body.fontFamily,
  },
  optionSelected: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: theme.typography.body.fontFamily,
  },
});

