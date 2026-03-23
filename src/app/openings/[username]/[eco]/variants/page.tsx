import { OpeningVariantsClient } from "@/components/openings/OpeningVariantsClient";
import { buildOpeningVariants } from "@/lib/opening-analysis";
import { fetchGamesFromLichess, parseGame } from "@/lib/lichess";
import { parseGameFilters } from "@/lib/gameFilters";
import { getOpeningName } from "@/lib/eco";

interface PageProps {
  params: Promise<{ username: string; eco: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OpeningVariantsPage({ params, searchParams }: PageProps) {
  const { username, eco } = await params;
  const decodedUsername = decodeURIComponent(username);
  const resolvedSearchParams = await searchParams;
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string") {
      urlSearchParams.set(key, value);
    }
  }

  const { color, ...gameFilters } = parseGameFilters(urlSearchParams, { max: 300 });

  const games = await fetchGamesFromLichess(decodedUsername, gameFilters);
  const parsedGames = games
    .map((game) => parseGame(game, decodedUsername))
    .filter((game) => {
      const matchesEco = eco === "other" ? !game.eco : game.eco?.startsWith(eco) ?? false;

      if (!matchesEco) {
        return false;
      }

      if (color === "white") {
        return game.userColor === "white";
      }

      if (color === "black") {
        return game.userColor === "black";
      }

      return true;
    });

  const variants = buildOpeningVariants(parsedGames, eco, {
    limit: 6,
    maxDepth: 5,
    unlockThreshold: 10,
  });

  return (
    <OpeningVariantsClient
      username={decodedUsername}
      eco={eco}
      openingName={getOpeningName(eco)}
      variants={variants}
    />
  );
}
