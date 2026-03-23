import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateWinrate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

export function calculateDrawRate(draws: number, total: number): number {
  if (total === 0) return 0;
  return (draws / total) * 100;
}

export function calculateLossRate(losses: number, total: number): number {
  if (total === 0) return 0;
  return (losses / total) * 100;
}

export function getResult(
  winner: "white" | "black" | null,
  isUserWhite: boolean
): "win" | "loss" | "draw" {
  if (winner === null) return "draw";
  if ((isUserWhite && winner === "white") || (!isUserWhite && winner === "black")) {
    return "win";
  }
  return "loss";
}

export function getGamePhase(ply: number): "opening" | "earlyMiddlegame" | "middlegame" | "endgame" {
  if (ply <= 10) return "opening";
  if (ply <= 20) return "earlyMiddlegame";
  if (ply <= 40) return "middlegame";
  return "endgame";
}

export function parseClockTime(clock?: string): number | null {
  if (!clock) return null;
  const parts = clock.split("+");
  return parseInt(parts[0], 10);
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}
