import { useState, useCallback, useMemo } from "react";

export function useRowSelection<TId = string | number>(
  initialSelected: TId[] = [],
) {
  const [selectedIds, setSelectedIds] = useState<Set<TId>>(
    new Set(initialSelected),
  );

  const toggleSelection = useCallback((id: TId) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: TId[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: TId) => {
      return selectedIds.has(id);
    },
    [selectedIds],
  );

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectedIds,
    selectedArray,
    selectedCount: selectedIds.size,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
  };
}
