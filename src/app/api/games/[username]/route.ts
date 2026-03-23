import { NextResponse } from "next/server";
import { fetchGamesFromLichess, parseGame } from "@/lib/lichess";
import { parseGameFilters } from "@/lib/gameFilters";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const { color, ...gameFilters } = parseGameFilters(searchParams, { max: 100 });

    const games = await fetchGamesFromLichess(username, gameFilters);

    const parsedGames = games
      .map((game) => parseGame(game, username))
      .filter((game) => {
        if (color === "white") return game.userColor === "white";
        if (color === "black") return game.userColor === "black";
        return true;
      });

    const result = {
      username,
      games: parsedGames,
      total: parsedGames.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}
