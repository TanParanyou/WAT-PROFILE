"use client";

import React from "react";
import { useSortableList } from "@/hooks/useSortableList";

interface SortableListProps<T> {
  items: T[];
  onReorder: (from: number, to: number) => void;
  onCommit?: () => void;
  renderItem: (
    item: T,
    index: number,
    dragProps: {
      draggable: boolean;
      onDragStart: () => void;
      onDragOver: (e: React.DragEvent) => void;
      onDragEnd: () => void;
    },
    isDragging: boolean,
    isOver: boolean,
  ) => React.ReactNode;
  className?: string;
}

export function SortableList<T>({
  items,
  onReorder,
  onCommit,
  renderItem,
  className = "space-y-4",
}: SortableListProps<T>) {
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    draggedIndex,
    overIndex,
  } = useSortableList({
    onMove: onReorder,
    onCommit,
  });

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isDragging = draggedIndex === index;
        const isOver = overIndex === index && draggedIndex !== index;
        const dragProps = {
          draggable: true,
          onDragStart: () => handleDragStart(index),
          onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
          onDragEnd: handleDragEnd,
        };

        return renderItem(item, index, dragProps, isDragging, isOver);
      })}
    </div>
  );
}
