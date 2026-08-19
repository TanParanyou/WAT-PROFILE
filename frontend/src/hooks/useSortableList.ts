import { useState, useCallback, useRef } from "react";

export interface UseSortableListOptions {
  onMove?: (from: number, to: number) => void;
  onCommit?: () => void;
}

export function useSortableList(
  moveOrOptions: ((from: number, to: number) => void) | UseSortableListOptions,
) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const startIndexRef = useRef<number | null>(null);

  const onMove =
    typeof moveOrOptions === "function" ? moveOrOptions : moveOrOptions.onMove;
  const onCommit =
    typeof moveOrOptions === "object" ? moveOrOptions.onCommit : undefined;

  const handleDragStart = useCallback((index: number) => {
    startIndexRef.current = index;
    setDraggedIndex(index);
    setOverIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overIndex !== index) {
        setOverIndex(index);
      }
      if (draggedIndex !== null && draggedIndex !== index) {
        onMove?.(draggedIndex, index);
        setDraggedIndex(index);
      }
    },
    [draggedIndex, overIndex, onMove],
  );

  const handleDragEnd = useCallback(() => {
    if (
      startIndexRef.current !== null &&
      draggedIndex !== null &&
      startIndexRef.current !== draggedIndex
    ) {
      onCommit?.();
    }
    startIndexRef.current = null;
    setDraggedIndex(null);
    setOverIndex(null);
  }, [draggedIndex, onCommit]);

  return {
    draggedIndex,
    overIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    isDragging: (index: number) => draggedIndex === index,
    isOver: (index: number) => overIndex === index,
  };
}
