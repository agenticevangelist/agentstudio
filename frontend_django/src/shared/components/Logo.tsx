"use client";

import React from "react";

type LogoProps = {
  className?: string;
  size?: number;
};

// Renders a central circle surrounded by evenly spaced orbiting circles
// with one slot left empty at the bottom.
export default function Logo({ className, size = 24 }: LogoProps) {
  const r = size / 2;
  const center = r;

  // Orbit config
  const orbitRadius = r * 0.75;
  const dotRadius = Math.max(2, Math.floor(size * 0.12));

  // Angles: place 8 positions around the circle, including the bottom slot.
  // Start from top (-90deg) and step by 45deg.
  const positions: number[] = [];
  for (let i = 0; i < 8; i++) {
    const angleDeg = -90 + i * 45;
    positions.push(angleDeg);
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Logo"
    >
      {/* Central circle */}
      <circle cx={center} cy={center} r={r * 0.3} className="fill-current" />

      {/* Orbiting dots (complete ring) */}
      {positions.map((deg, idx) => {
        const rad = (deg * Math.PI) / 180;
        const x = center + orbitRadius * Math.cos(rad);
        const y = center + orbitRadius * Math.sin(rad);
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={dotRadius}
            className="fill-current"
          />
        );
      })}
    </svg>
  );
}


