"use client";

import React from "react";

export interface LotusIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number;
}

export const LotusIcon: React.FC<LotusIconProps> = ({
  size = 20,
  className,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Center Petal */}
      <path d="M12 3C12 3 9.5 7.5 9.5 11.5C9.5 14.5 12 17.5 12 17.5C12 17.5 14.5 14.5 14.5 11.5C14.5 7.5 12 3 12 3Z" />
      {/* Left Inner Petal */}
      <path d="M10 6.5C8 8.5 6 11.5 6.5 14.5C7 16.5 9 17.5 10.5 17.5C9.5 15.5 9.5 13 10.5 10.5" />
      {/* Right Inner Petal */}
      <path d="M14 6.5C16 8.5 18 11.5 17.5 14.5C17 16.5 15 17.5 13.5 17.5C14.5 15.5 14.5 13 13.5 10.5" />
      {/* Left Outer Petal */}
      <path d="M7 11C4.5 12.5 3 15 3.5 17C4 18.5 6 19 8 18.5" />
      {/* Right Outer Petal */}
      <path d="M17 11C19.5 12.5 21 15 20.5 17C20 18.5 18 19 16 18.5" />
      {/* Water / Base Line */}
      <path d="M4 21C8 20 12 20.5 12 20.5C12 20.5 16 20 20 21" />
    </svg>
  );
};
