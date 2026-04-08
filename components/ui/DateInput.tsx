import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Platform } from 'react-native';
import { colors, BorderRadius, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface DateInputProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
  error?: string;
}

export function DateInput({ value, onChange, label, minDate, error }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return '';
  });

  const handleNativeChange = (text: string) => {
    const digits = text.replace(/\D/g, '');

    let formatted = '';
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    setDisplayValue(formatted);

    if (digits.length === 8) {
      const dd = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);
      onChange(`${yyyy}-${mm}-${dd}`);
    } else {
      onChange('');
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputWrapper,
            error && { borderColor: colors.error },
          ]}
        >
          <input
            type="date"
            value={value}
            min={minDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Source Sans 3, sans-serif',
              fontSize: 14,
              color: colors.text,
              padding: 0,
            }}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && { borderColor: colors.error },
        ]}
        placeholder="DD/MM/YYYY"
        placeholderTextColor={colors.textSecondary}
        value={displayValue}
        onChangeText={handleNativeChange}
        keyboardType="number-pad"
        maxLength={10}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.sm,
    color: colors.textSecondary,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.xs,
    color: colors.text,
  },
  errorText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    color: colors.error,
    marginBottom: Spacing.xs,
  },
});
