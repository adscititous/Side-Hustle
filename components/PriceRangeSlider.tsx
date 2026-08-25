"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function PriceRangeSlider({ min, max, step = 50, value, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const range = Math.max(max - min, 1);
  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);
  const snap = useCallback((v: number) => Math.round(v / step) * step, [step]);
  const pctFor = useCallback((v: number) => ((v - min) / range) * 100, [min, range]);

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
      return clamp(snap(min + ratio * range));
    },
    [min, range, clamp, snap],
  );

  function handlePointerDown(thumb: "min" | "max") {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(thumb);
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const newVal = valueFromClientX(e.clientX);
    if (dragging === "min") {
      onChange([Math.min(newVal, value[1]), value[1]]);
    } else {
      onChange([value[0], Math.max(newVal, value[0])]);
    }
  }

  function handlePointerUp() {
    setDragging(null);
  }

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    // Ignore clicks that actually originated on a thumb (drag/click already handled it).
    if (e.target !== trackRef.current) return;
    const newVal = valueFromClientX(e.clientX);
    const distMin = Math.abs(newVal - value[0]);
    const distMax = Math.abs(newVal - value[1]);
    if (distMin <= distMax) {
      onChange([Math.min(newVal, value[1]), value[1]]);
    } else {
      onChange([value[0], Math.max(newVal, value[0])]);
    }
  }

  function handleKeyDown(thumb: "min" | "max") {
    return (e: React.KeyboardEvent<HTMLButtonElement>) => {
      let delta = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
      else return;
      e.preventDefault();
      if (thumb === "min") {
        onChange([clamp(Math.min(value[0] + delta, value[1])), value[1]]);
      } else {
        onChange([value[0], clamp(Math.max(value[1] + delta, value[0]))]);
      }
    };
  }

  const minPct = pctFor(value[0]);
  const maxPct = pctFor(value[1]);

  return (
    <div
      ref={trackRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleTrackClick}
      className="relative flex h-4 items-center cursor-pointer touch-none select-none"
    >
      <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-stone-200" />
      <div
        className="pointer-events-none absolute h-1 rounded-full bg-brand-600"
        style={{ left: `${minPct}%`, width: `${Math.max(maxPct - minPct, 0)}%` }}
      />
      <button
        type="button"
        role="slider"
        aria-label="Minimum price"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[0]}
        tabIndex={0}
        onPointerDown={handlePointerDown("min")}
        onKeyDown={handleKeyDown("min")}
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-200 active:scale-110"
        style={{ left: `${minPct}%` }}
      />
      <button
        type="button"
        role="slider"
        aria-label="Maximum price"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        tabIndex={0}
        onPointerDown={handlePointerDown("max")}
        onKeyDown={handleKeyDown("max")}
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-200 active:scale-110"
        style={{ left: `${maxPct}%` }}
      />
    </div>
  );
}
