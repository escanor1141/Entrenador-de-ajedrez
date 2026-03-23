import { notFound } from "next/navigation";
import { fetchGamesFromLichess, parseGame } from "@/lib/lichess";
import { ReviewClient } from "./ReviewClient";

interface PageProps {
  params: Promise<{ username: string; gameId: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { username: rawUsername, gameId } = await params;
  const username = decodeURIComponent(rawUsername);

  const games = await fetchGamesFromLichess(username, { max: 300 });
  const parsedGames = games.map((game) => parseGame(game, username));
  const game = parsedGames.find((item) => item.id === gameId);

  if (!game) {
    notFound();
  }

  return <ReviewClient username={username} game={game} />;
}
