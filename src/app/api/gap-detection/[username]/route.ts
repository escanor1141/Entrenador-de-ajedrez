import { NextRequest, NextResponse } from "next/server";
import { fetchGamesFromLichess, parseGame } from "@/lib/lichess";
import { detectGaps, summarizeGaps } from "@/lib/gap-detection";
import type { Repertoire } from "@/types/training";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const resolvedParams = await params;
  const username = decodeURIComponent(resolvedParams.username);

  try {
    const body = await request.json();
    const repertoires: Repertoire[] = body.repertoires || [];
    const maxGames = body.maxGames || 50;

    if (repertoires.length === 0) {
      return NextResponse.json(
        { error: "No repertoires provided" },
        { status: 400 }
      );
    }

    const lichessGames = await fetchGamesFromLichess(username, {
      max: maxGames,
      rated: true,
    });

    const parsedGames = lichessGames.map((g) => parseGame(g, username));
    const gaps = detectGaps(parsedGames, repertoires);
    const summary = summarizeGaps(gaps);

    return NextResponse.json({
      username,
      totalGames: parsedGames.length,
      totalGaps: gaps.length,
      gaps,
      summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
