"use client";

import { cn } from "@/lib/utils";

interface ColorWinrateProps {
  whiteGames: number;
  whiteWins: number;
  whiteLosses: number;
  blackGames: number;
  blackWins: number;
  blackLosses: number;
}

export function ColorWinrate({
  whiteGames,
  whiteWins,
  whiteLosses,
  blackGames,
  blackWins,
  blackLosses,
}: ColorWinrateProps) {
  const whiteDraws = whiteGames - whiteWins - whiteLosses;
  const blackDraws = blackGames - blackWins - blackLosses;

  const whiteWinrate = whiteGames > 0 ? (whiteWins / whiteGames) * 100 : 0;
  const blackWinrate = blackGames > 0 ? (blackWins / blackGames) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border border-border" />
            <span className="font-medium">White</span>
          </div>
          <span className="text-muted-foreground">
            {whiteGames} games • {whiteWinrate.toFixed(1)}% wins
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-accent-green">Wins: {whiteWins}</span>
            <span className="text-accent-yellow">Draws: {whiteDraws}</span>
            <span className="text-accent-red">Losses: {whiteLosses}</span>
          </div>
          <div className="h-3 bg-background-tertiary rounded overflow-hidden">
            <div
              className="h-full bg-accent-green"
              style={{ width: `${(whiteWins / whiteGames) * 100}%` }}
            />
            <div
              className="h-full bg-accent-yellow"
              style={{
                width: `${(whiteDraws / whiteGames) * 100}%`,
                marginTop: "-12px",
              }}
            />
            <div
              className="h-full bg-accent-red"
              style={{
                width: `${(whiteLosses / whiteGames) * 100}%`,
                marginTop: "-12px",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-black border border-border" />
            <span className="font-medium">Black</span>
          </div>
          <span className="text-muted-foreground">
            {blackGames} games • {blackWinrate.toFixed(1)}% wins
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-accent-green">Wins: {blackWins}</span>
            <span className="text-accent-yellow">Draws: {blackDraws}</span>
            <span className="text-accent-red">Losses: {blackLosses}</span>
          </div>
          <div className="h-3 bg-background-tertiary rounded overflow-hidden">
            <div
              className="h-full bg-accent-green"
              style={{ width: `${(blackWins / blackGames) * 100}%` }}
            />
            <div
              className="h-full bg-accent-yellow"
              style={{
                width: `${(blackDraws / blackGames) * 100}%`,
                marginTop: "-12px",
              }}
            />
            <div
              className="h-full bg-accent-red"
              style={{
                width: `${(blackLosses / blackGames) * 100}%`,
                marginTop: "-12px",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
