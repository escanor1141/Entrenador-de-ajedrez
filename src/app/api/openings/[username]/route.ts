import { NextResponse } from "next/server";
import { fetchGamesFromLichess, parseGame } from "@/lib/lichess";
import { OpeningData } from "@/types";
import { classifyOpening } from "@/lib/eco";
import { getResult } from "@/lib/utils";
import { parseGameFilters } from "@/lib/gameFilters";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const { color, ...gameFilters } = parseGameFilters(searchParams, { max: 300 });

    const games = await fetchGamesFromLichess(username, gameFilters);
    const parsedGames = games
      .map((game) => parseGame(game, username))
      .filter((game) => {
        if (color === "white") return game.userColor === "white";
        if (color === "black") return game.userColor === "black";
        return true;
      });

    const openings: Record<string, OpeningData> = {};
    
    for (const game of parsedGames) {
      const key = game.eco || "other";
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

    const openingsList = Object.values(openings).sort((a, b) => b.games - a.games);

    const totalGames = parsedGames.length;
    const totalWins = openingsList.reduce((sum, o) => sum + o.wins, 0);
    const totalDraws = openingsList.reduce((sum, o) => sum + o.draws, 0);
    const totalLosses = openingsList.reduce((sum, o) => sum + o.losses, 0);

    return NextResponse.json({
      username,
      openings: openingsList,
      stats: {
        totalOpenings: openingsList.length,
        totalGames,
        totalWins,
        totalDraws,
        totalLosses,
        winrate: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching opening stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening stats" },
      { status: 500 }
    );
  }
}
