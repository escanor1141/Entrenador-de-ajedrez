import { NextResponse } from "next/server";
import { fetchGamesFromLichess, parseGame } from "@/lib/lichess";
import { OpeningData, ParsedGame } from "@/types";
import { classifyOpening } from "@/lib/eco";
import { getResult } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; eco: string }> }
) {
  try {
    const { username, eco } = await params;
    const { searchParams } = new URL(request.url);
    const max = parseInt(searchParams.get("max") || "300", 10);
    const color = searchParams.get("color");

    const games = await fetchGamesFromLichess(username, { max });

    const parsedGames = games
      .map((game) => parseGame(game, username))
      .filter((game) => {
        if (game.eco?.startsWith(eco) || eco === "other") {
          if (color === "white") return game.userColor === "white";
          if (color === "black") return game.userColor === "black";
          return true;
        }
        return false;
      });

    const openings: Record<string, OpeningData> = {};
    
    for (const game of parsedGames) {
      const key = game.eco || "Unknown";
      if (!openings[key]) {
        const info = classifyOpening(key);
        openings[key] = {
          eco: key,
          name: info.name,
          games: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          asWhite: 0,
          asBlack: 0,
          bulletGames: 0,
          blitzGames: 0,
          rapidGames: 0,
          classicalGames: 0,
          recentGames: [],
        };
      }
      
      const opening = openings[key];
      opening.games++;
      
      if (game.userColor === "white") {
        opening.asWhite++;
      } else {
        opening.asBlack++;
      }
      
      const speedKey = `${game.speed}Games` as keyof OpeningData;
      if (speedKey in opening) {
        (opening[speedKey] as number)++;
      }
      
      const result = getResult(game.winner, game.userColor === "white");
      if (result === "win") {
        opening.wins++;
      } else if (result === "draw") {
        opening.draws++;
      } else {
        opening.losses++;
      }
      
      if (opening.recentGames.length < 5) {
        opening.recentGames.push({
          id: game.id,
          opponent: game.userColor === "white" ? game.black : game.white,
          result,
          date: game.playedAt,
          eco: game.eco || "Unknown",
          moves: game.moves.length,
        });
      }
    }

    const opening = openings[eco] || {
      eco,
      name: classifyOpening(eco).name,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      asWhite: 0,
      asBlack: 0,
      bulletGames: 0,
      blitzGames: 0,
      rapidGames: 0,
      classicalGames: 0,
      recentGames: [],
    };

    return NextResponse.json({
      username,
      eco,
      opening,
      games: parsedGames.slice(0, 50),
      total: parsedGames.length,
    });
  } catch (error) {
    console.error("Error fetching opening data:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening data" },
      { status: 500 }
    );
  }
}
