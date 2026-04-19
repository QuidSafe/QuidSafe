import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, FlatList, Platform } from 'react-native';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, colors as themedColors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  /** Stable identifier used for sort tracking. */
  key: string;
  /** Header label. */
  label: string;
  /** Cell width (px) or flex (number). Default flex 1. */
  width?: number;
  flex?: number;
  /** Text alignment. */
  align?: 'left' | 'right' | 'center';
  /** Sort comparator. Omit to disable sorting on this column. */
  sort?: (a: T, b: T) => number;
  /** Cell renderer. */
  render: (row: T) => ReactNode;
  /** Plain-text accessor for accessibility. Falls back to render output. */
  accessibilityLabel?: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T, index: number) => string;
  /** Called when a row is tapped. */
  onRowPress?: (row: T) => void;
  /** Initial sort. */
  initialSort?: { key: string; direction: SortDirection };
  /** Empty-state node shown when rows.length === 0. */
  empty?: ReactNode;
  /** Min row height - desktop gets more breathing room. */
  rowHeight?: number;
}

/**
 * Desktop-style sortable data grid. Sticky header, hover row state on web,
 * virtualised via FlatList. Deliberately neutral styling - colour comes
 * from cell renderers, not the table.
 */
export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowPress,
  initialSort,
  empty,
  rowHeight = 52,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialSort?.key);
  const [sortDir, setSortDir] = useState<SortDirection>(initialSort?.direction ?? 'desc');

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sort) return rows;
    const sorter = col.sort;
    const copy = [...rows];
    copy.sort(sorter);
    return sortDir === 'desc' ? copy.reverse() : copy;
  }, [rows, columns, sortKey, sortDir]);

  const handleHeaderPress = useCallback(
    (col: DataTableColumn<T>) => {
      if (!col.sort) return;
      if (sortKey === col.key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(col.key);
        setSortDir('desc');
      }
    },
    [sortKey],
  );

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((col) => {
        const isSorted = sortKey === col.key;
        const isSortable = Boolean(col.sort);
        return (
          <Pressable
            key={col.key}
            onPress={() => handleHeaderPress(col)}
            disabled={!isSortable}
            accessibilityRole={isSortable ? 'button' : undefined}
            accessibilityLabel={
              isSortable
                ? `Sort by ${col.label}${isSorted ? `, currently ${sortDir === 'asc' ? 'ascending' : 'descending'}` : ''}`
                : col.label
            }
            style={[
              styles.headerCell,
              cellSizing(col),
              col.align === 'right' && styles.cellAlignRight,
              col.align === 'center' && styles.cellAlignCenter,
            ]}
          >
            <Text
              style={[
                styles.headerText,
                col.align === 'right' && styles.cellAlignRightText,
                col.align === 'center' && styles.cellAlignCenterText,
              ]}
              numberOfLines={1}
            >
              {col.label}
            </Text>
            {isSortable ? (
              <View style={styles.sortIcon}>
                {isSorted && sortDir === 'asc' ? (
                  <ChevronUp size={12} color={Colors.electricBlue} strokeWidth={2} />
                ) : isSorted ? (
                  <ChevronDown size={12} color={Colors.electricBlue} strokeWidth={2} />
                ) : (
                  <ChevronsUpDown size={12} color={themedColors.textMuted} strokeWidth={1.5} />
                )}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  const renderItem = ({ item }: { item: T }) => (
    <Pressable
      onPress={onRowPress ? () => onRowPress(item) : undefined}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.bodyRow,
        { minHeight: rowHeight },
        hovered && styles.rowHovered,
        pressed && styles.rowPressed,
      ]}
    >
      {columns.map((col) => (
        <View
          key={col.key}
          style={[
            styles.bodyCell,
            cellSizing(col),
            col.align === 'right' && styles.cellAlignRight,
            col.align === 'center' && styles.cellAlignCenter,
          ]}
        >
          {col.render(item)}
        </View>
      ))}
    </Pressable>
  );

  if (rows.length === 0 && empty) {
    return (
      <View style={styles.root}>
        {renderHeader()}
        <View style={styles.emptyWrap}>{empty}</View>
      </View>
    );
  }

  // Horizontal scroll for narrow windows; FlatList drives vertical virtualisation.
  return (
    <View style={styles.root}>
      <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={Platform.OS === 'web'}>
        <View style={styles.tableInner}>
          {renderHeader()}
          <FlatList
            data={sortedRows}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            initialNumToRender={30}
            windowSize={10}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function cellSizing<T>(col: DataTableColumn<T>) {
  if (col.width !== undefined) return { width: col.width, flexGrow: 0, flexShrink: 0 };
  return { flex: col.flex ?? 1, minWidth: 120 };
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.midGrey,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
  },
  tableInner: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.midGrey,
    backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.02)' : 'transparent',
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  headerText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: themedColors.textSecondary,
  },
  sortIcon: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  bodyCell: {
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  rowHovered: {
    backgroundColor: 'rgba(0, 102, 255, 0.04)',
  },
  rowPressed: {
    backgroundColor: 'rgba(0, 102, 255, 0.08)',
  },
  cellAlignRight: {
    alignItems: 'flex-end',
  },
  cellAlignCenter: {
    alignItems: 'center',
  },
  cellAlignRightText: {
    textAlign: 'right',
  },
  cellAlignCenterText: {
    textAlign: 'center',
  },
  emptyWrap: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
