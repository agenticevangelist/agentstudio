"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils";
import type { CSSProperties } from "react";

type CSSVarStyle = CSSProperties & { [key: string]: string | number | undefined };

type CommitsGridProps = {
  cols?: number
  rows?: number
  seed?: string
  className?: string
  values?: number[]
  onCellTitle?: (index: number) => string | undefined
}

export const CommitsGrid = ({ cols = 10, rows = 3, seed, className, values, onCellTitle }: CommitsGridProps) => {

  const generateGridCells = (cols: number, rows: number, seedStr: string) => {
    const count = cols * rows;
    // Use seeded PRNG to sprinkle activity cells (about 25% active)
    const seedVal = fnv1aHash(seedStr || "grid");
    const rnd = mulberry32(seedVal);
    const cells: number[] = [];
    for (let i = 0; i < count; i++) {
      if (rnd() < 0.25) cells.push(i);
    }
    return { cells, width: cols, height: rows };
  };

  const computed = React.useMemo(() => {
    return generateGridCells(cols, rows, seed ?? "");
  }, [cols, rows, seed]);
  const highlightedCells = computed.cells;
  const gridWidth = computed.width;
  const gridHeight = computed.height;

  // Deterministic pseudo-random generator seeded so SSR/CSR match
  function fnv1aHash(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(seed: number) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  const commitColors = ["#48d55d", "#016d32", "#0d4429"] as const;

  const totalCells = gridWidth * gridHeight;
  const seeded = React.useMemo(() => {
    const baseSeed = (seed ?? "");
    const seedNum = fnv1aHash(baseSeed + ":" + gridWidth + "x" + gridHeight);
    const rnd = mulberry32(seedNum);
    const colors: string[] = new Array(totalCells);
    const delays: string[] = new Array(totalCells);
    const flashes: number[] = new Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      const r1 = rnd();
      const r2 = rnd();
      const r3 = rnd();
      colors[i] = commitColors[Math.floor(r1 * commitColors.length) % commitColors.length];
      // Snap delays to a single decimal step for stability
      const delay = Math.round(r2 * 6) / 10; // 0.0 .. 0.6 in steps of 0.1
      delays[i] = `${delay.toFixed(1)}s`;
      flashes[i] = r3 < 0.3 ? 1 : 0;
    }
    return { colors, delays, flashes };
  }, [seed, gridWidth, gridHeight, totalCells]);

  return (
    <section
      className={cn(
        "w-full max-w-xl bg-card  grid gap-0.5 sm:gap-1 ",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: gridWidth * gridHeight }).map((_, index) => {
        const level = Array.isArray(values) ? (values[index] ?? 0) : undefined;
        const useValues = Array.isArray(values);
        const isHighlighted = useValues ? (level ?? 0) > 0 : highlightedCells.includes(index);
        const shouldFlash = useValues ? false : (!isHighlighted && !!seeded.flashes[index]);
        const colorVar = useValues
          ? commitColors[Math.max(0, Math.min(commitColors.length - 1, (level ?? 1) - 1))]
          : seeded.colors[index];
        const inlineHighlight = useValues && isHighlighted ? { backgroundColor: colorVar } : {};

        return (
          <div
            key={index}
            className={cn(
              `border h-full w-full aspect-square`,
              // In values mode, we color statically; otherwise use animation class
              !useValues && isHighlighted ? "animate-highlight" : "",
              shouldFlash ? "animate-flash" : "",
              !isHighlighted && !shouldFlash ? "bg-card" : ""
            )}
            style={((): CSSVarStyle => {
              const s: CSSVarStyle = {
                animationDelay: seeded.delays[index],
                "--highlight": colorVar,
              };
              if (inlineHighlight.backgroundColor) s.backgroundColor = inlineHighlight.backgroundColor;
              return s;
            })()}
            title={onCellTitle ? onCellTitle(index) : undefined}
          />
        );
      })}
    </section>
  );
};
