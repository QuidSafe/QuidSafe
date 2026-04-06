import { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors, BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/lib/ThemeContext';

interface SearchFilterProps {
  searchPlaceholder?: string;
  onSearchChange: (query: string) => void;
  onDateRangeChange?: (from: string, to: string) => void;
  showDateFilter?: boolean;
}

/**
 * Reusable search bar + expandable date range filter.
 * - Debounced search (300ms)
 * - Date range with "From" / "To" inputs
 * - Web uses <input type="date">, native uses DD/MM/YYYY text input (same as DateInput.tsx)
 * - Glass-effect styling matching app theme
 */
export function SearchFilter({
  searchPlaceholder = 'Search...',
  onSearchChange,
  onDateRangeChange,
  showDateFilter = true,
}: SearchFilterProps) {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [dateExpanded, setDateExpanded] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromDisplay, setFromDisplay] = useState('');
  const [toDisplay, setToDisplay] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(text);
      }, 300);
    },
    [onSearchChange],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearSearch = useCallback(() => {
    setSearchText('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchChange('');
  }, [onSearchChange]);

  const hasActiveFilters = searchText.length > 0 || fromDate.length > 0 || toDate.length > 0;

  const clearAll = useCallback(() => {
    setSearchText('');
    setFromDate('');
    setToDate('');
    setFromDisplay('');
    setToDisplay('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchChange('');
    onDateRangeChange?.('', '');
  }, [onSearchChange, onDateRangeChange]);

  // Native date input handler (DD/MM/YYYY -> YYYY-MM-DD)
  const handleNativeDateChange = useCallback(
    (text: string, setter: (v: string) => void, displaySetter: (v: string) => void) => {
      const digits = text.replace(/\D/g, '');
      let formatted = '';
      if (digits.length <= 2) {
        formatted = digits;
      } else if (digits.length <= 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
      }
      displaySetter(formatted);

      if (digits.length === 8) {
        const dd = digits.slice(0, 2);
        const mm = digits.slice(2, 4);
        const yyyy = digits.slice(4, 8);
        setter(`${yyyy}-${mm}-${dd}`);
      } else {
        setter('');
      }
    },
    [],
  );

  // Notify parent when dates change
  useEffect(() => {
    onDateRangeChange?.(fromDate, toDate);
  }, [fromDate, toDate, onDateRangeChange]);

  return (
    <View style={styles.wrapper}>
      {/* Search bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surfaceGlass,
            borderColor: colors.border,
          },
        ]}
      >
        <FontAwesome name="search" size={14} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={handleSearchChange}
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={clearSearch} hitSlop={8} accessibilityLabel="Clear search">
            <FontAwesome name="times-circle" size={16} color={colors.textSecondary} />
          </Pressable>
        )}

        {showDateFilter && (
          <Pressable
            onPress={() => setDateExpanded((v) => !v)}
            style={[
              styles.filterChip,
              {
                backgroundColor: dateExpanded || fromDate || toDate
                  ? Colors.accent + '20'
                  : colors.background,
                borderColor: dateExpanded || fromDate || toDate
                  ? Colors.accent
                  : colors.border,
              },
            ]}
            accessibilityLabel="Toggle date filter"
            accessibilityRole="button"
          >
            <FontAwesome
              name="calendar"
              size={12}
              color={dateExpanded || fromDate || toDate ? Colors.accent : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color: dateExpanded || fromDate || toDate ? Colors.accent : colors.textSecondary,
                },
              ]}
            >
              Filter
            </Text>
          </Pressable>
        )}
      </View>

      {/* Expandable date range */}
      {dateExpanded && showDateFilter && (
        <View
          style={[
            styles.dateRangeContainer,
            {
              backgroundColor: colors.surfaceGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From</Text>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.dateInputWrapper,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 13,
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.dateInput,
                    { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.textSecondary}
                  value={fromDisplay}
                  onChangeText={(t) => handleNativeDateChange(t, setFromDate, setFromDisplay)}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              )}
            </View>
            <View style={styles.dateField}>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To</Text>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.dateInputWrapper,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 13,
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.dateInput,
                    { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.textSecondary}
                  value={toDisplay}
                  onChangeText={(t) => handleNativeDateChange(t, setToDate, setToDisplay)}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              )}
            </View>
          </View>
        </View>
      )}

      {/* Clear filters link */}
      {hasActiveFilters && (
        <Pressable onPress={clearAll} style={styles.clearLink} accessibilityLabel="Clear all filters">
          <FontAwesome name="times" size={11} color={Colors.accent} />
          <Text style={styles.clearLinkText}>Clear filters</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },

  // Search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    padding: 0,
  },

  // Filter chip
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    marginLeft: 4,
  },
  filterChipText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },

  // Date range
  dateRangeContainer: {
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateInputWrapper: {
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateInput: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // Clear link
  clearLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  clearLinkText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: Colors.accent,
  },
});
