"use client";

import React from "react";

export function MonkLineArt({ className = "w-36 h-36 text-[#C88D1E]/70" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Soft halo aura */}
      <circle cx="100" cy="65" r="46" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
      
      {/* Meditating Monk Silhouette Line Art */}
      {/* Head */}
      <circle cx="100" cy="58" r="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      
      {/* Neck & Shoulders */}
      <path d="M 88 72 C 75 80, 60 90, 45 105 C 38 112, 35 125, 42 135 C 50 145, 68 152, 85 155" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M 112 72 C 125 80, 140 90, 155 105 C 162 112, 165 125, 158 135 C 150 145, 132 152, 115 155" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      
      {/* Robe Drape Folds */}
      <path d="M 85 74 Q 100 94 115 74" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 76 85 C 92 105, 108 105, 124 85" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.8" />
      <path d="M 68 98 Q 100 126 132 98" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.7" />
      
      {/* Meditating Folded Hands */}
      <path d="M 82 145 Q 100 152 118 145" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M 88 140 Q 100 146 112 140" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Seated Lotus Base */}
      <path d="M 30 160 C 45 155, 65 152, 100 155 C 135 152, 155 155, 170 160 C 178 163, 175 172, 165 175 C 145 180, 115 182, 100 182 C 85 182, 55 180, 35 175 C 25 172, 22 163, 30 160 Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Lotus Petal Line Accent */}
      <path d="M 52 178 Q 100 190 148 178" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
