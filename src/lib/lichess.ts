import { LichessGame, ParsedGame, Move } from "@/types";
import { getResult } from "./utils";

const LICHESS_API = "https://lichess.org/api";

export interface FetchGamesOptions {
  max?: number;
  since?: number;
  until?: number;
  rated?: boolean;
  perfType?: "bullet" | "blitz" | "rapid" | "classical";
}

export async function fetchUser(username: string) {
  try {
    const res = await fetch(`${LICHESS_API}/user/${username}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("User not found");
      }
      throw new Error("Failed to fetch user data");
    }
    return res.json();
  } catch (error) {
    throw error;
  }
}

export async function fetchGamesFromLichess(
  username: string,
  options: FetchGamesOptions = {}
): Promise<LichessGame[]> {
  const params = new URLSearchParams();
  params.set("pgnInJson", "true");
  params.set("opening", "true");
  params.set("clocks", "true");
  params.set("literate", "true");

  if (options.max) params.set("max", options.max.toString());
  if (options.since) params.set("since", options.since.toString());
  if (options.until) params.set("until", options.until.toString());
  if (options.rated !== undefined) params.set("rated", options.rated.toString());
  if (options.perfType) params.set("perfType", options.perfType);

  try {
    const res = await fetch(`${LICHESS_API}/games/user/${username}?${params}`, {
      headers: { Accept: "application/x-ndjson" },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("User not found");
      }
      throw new Error("Failed to fetch games");
    }

    const text = await res.text();
    const lines = text.trim().split("\n");
    const games: LichessGame[] = [];

    for (const line of lines) {
      if (line.trim()) {
        try {
          games.push(JSON.parse(line));
        } catch {
          console.error("Failed to parse game:", line);
        }
      }
    }

    return games;
  } catch (error) {
    throw error;
  }
}

export function parseGame(game: LichessGame, username: string): ParsedGame {
  const isWhite = game.players.white.user?.name?.toLowerCase() === username.toLowerCase();
  const userColor = isWhite ? "white" : "black";
  const userPlayer = isWhite ? game.players.white : game.players.black;
  const opponent = isWhite ? game.players.black : game.players.white;

  let winner: "white" | "black" | null = null;
  if (game.winner === "white" || game.winner === "black") {
    winner = game.winner;
  }

  const result = game.winner
    ? game.winner === "white"
      ? "1-0"
      : "0-1"
    : "1/2-1/2";

  const moves: Move[] = [];
  if (game.moves) {
    const moveList = game.moves.split(" ");
    for (let i = 0; i < moveList.length; i += 2) {
      const whiteMove = moveList[i];
      const blackMove = moveList[i + 1];

      if (whiteMove) {
        moves.push({
          ply: i + 1,
          san: whiteMove.replace(/[+#!?]/g, ""),
          uci: whiteMove,
        });
      }
      if (blackMove) {
        moves.push({
          ply: i + 2,
          san: blackMove.replace(/[+#!?]/g, ""),
          uci: blackMove,
        });
      }
    }
  }

  return {
    id: game.id,
    white: game.players.white.user?.name || "Anonymous",
    black: game.players.black.user?.name || "Anonymous",
    winner,
    result,
    userColor,
    eco: game.opening?.eco,
    openingName: game.opening?.name,
    openingPly: game.opening?.ply,
    rated: game.rated,
    speed: game.perf || "rapid",
    whiteElo: game.players.white.rating,
    blackElo: game.players.black.rating,
    moves,
    playedAt: new Date(game.createdAt).toISOString(),
  };
}

export function getTimeControl(createdAt: number, lastMoveAt: number): string {
  const totalSeconds = (lastMoveAt - createdAt) / 1000;
  const estimatedMoves = 40;
  const avgTimePerMove = totalSeconds / estimatedMoves;

  if (avgTimePerMove <= 15) return "bullet";
  if (avgTimePerMove <= 60) return "blitz";
  if (avgTimePerMove <= 600) return "rapid";
  return "classical";
}

export function classifySpeed(clock?: { initial: number; increment: number }): string {
  if (!clock) return "rapid";

  const totalTime = clock.initial + clock.increment * 40;

  if (totalTime <= 60) return "bullet";
  if (totalTime <= 180) return "blitz";
  if (totalTime <= 1500) return "rapid";
  return "classical";
}
