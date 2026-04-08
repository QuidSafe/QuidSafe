import { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Search, XCircle, Calendar, X } from 'lucide-react-native';
import { colors, BorderRadius, Spacing } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface SearchFilterProps {
  searchPlaceholder?: string;
  onSearchChange: (query: string) => void;
  onDateRangeChange?: (from: string, to: string) => void;
  showDateFilter?: boolean;
}

export function SearchFilter({
  searchPlaceholder = 'Search...',
  onSearchChange,
  onDateRangeChange,
  showDateFilter = true,
}: SearchFilterProps) {
  const [searchText, setSearchText] = useState('');
  const [dateExpanded, setDateExpanded] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromDisplay, setFromDisplay] = useState('');
  const [toDisplay, setToDisplay] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    onDateRangeChange?.(fromDate, toDate);
  }, [fromDate, toDate, onDateRangeChange]);

  const filterActive = dateExpanded || fromDate || toDate;

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <Search size={14} color={colors.textSecondary} strokeWidth={1.5} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textSecondary}
          value={searchText}
          onChangeText={handleSearchChange}
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={clearSearch} hitSlop={8} accessibilityLabel="Clear search">
            <XCircle size={16} color={colors.textSecondary} strokeWidth={1.5} />
          </Pressable>
        )}

        {showDateFilter && (
          <Pressable
            onPress={() => setDateExpanded((v) => !v)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterActive ? colors.accentGlow : colors.background,
                borderColor: filterActive ? colors.accent : colors.border,
              },
            ]}
            accessibilityLabel="Toggle date filter"
            accessibilityRole="button"
          >
            <Calendar
              size={12}
              color={filterActive ? colors.accent : colors.textSecondary}
              strokeWidth={1.5}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: filterActive ? colors.accent : colors.textSecondary },
              ]}
            >
              Filter
            </Text>
          </Pressable>
        )}
      </View>

      {dateExpanded && showDateFilter && (
        <View style={styles.dateRangeContainer}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>From</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.dateInputWrapper}>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: 'Source Sans 3, sans-serif',
                      fontSize: 13,
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>
              ) : (
                <TextInput
                  style={styles.dateInput}
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
              <Text style={styles.dateLabel}>To</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.dateInputWrapper}>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontFamily: 'Source Sans 3, sans-serif',
                      fontSize: 13,
                      color: colors.text,
                      padding: 0,
                    }}
                  />
                </View>
              ) : (
                <TextInput
                  style={styles.dateInput}
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

      {hasActiveFilters && (
        <Pressable onPress={clearAll} style={styles.clearLink} accessibilityLabel="Clear all filters">
          <X size={11} color={colors.accent} strokeWidth={1.5} />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    padding: 0,
    color: colors.text,
  },
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
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
  },
  dateRangeContainer: {
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
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
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    color: colors.textSecondary,
  },
  dateInputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateInput: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
  },
  clearLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  clearLinkText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    color: colors.accent,
  },
});
