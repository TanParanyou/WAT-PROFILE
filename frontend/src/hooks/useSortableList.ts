import { useState, useCallback } from "react";

export function useSortableList(moveItem: (from: number, to: number) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overIndex !== index) {
        setOverIndex(index);
      }
      if (draggedIndex !== null && draggedIndex !== index) {
        moveItem(draggedIndex, index);
        setDraggedIndex(index);
      }
    },
    [draggedIndex, overIndex, moveItem],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setOverIndex(null);
  }, []);

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

