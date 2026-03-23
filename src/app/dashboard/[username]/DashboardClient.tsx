"use client";

import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TimeFilter } from "@/components/dashboard/TimeFilter";
import { ColorFilter } from "@/components/dashboard/ColorFilter";
import { OpeningBarChart } from "@/components/dashboard/OpeningBarChart";
import { ColorWinrate } from "@/components/dashboard/ColorWinrate";
import { OpeningPieChart } from "@/components/dashboard/OpeningPieChart";
import { useGames } from "@/hooks/useGames";
import { useOpeningStats } from "@/hooks/useOpeningStats";
import { getTopOpeningByGames } from "@/lib/openings";
import {
  dashboardStateToFilters,
  DashboardColorFilter,
  DashboardTimeFilter,
} from "@/lib/gameFilters";
import { BookOpen, Trophy, Target, Crown, TrendingUp, Users, TrainFront } from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  username: string;
}

export function DashboardClient({ username }: DashboardClientProps) {
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>("all");
  const [colorFilter, setColorFilter] = useState<DashboardColorFilter>("all");

  const shouldFetch = !!username;

  const dashboardFilters = dashboardStateToFilters({ time: timeFilter, color: colorFilter });

  const { data: gamesData, isLoading: gamesLoading } = useGames(
    shouldFetch ? username : null,
    dashboardFilters
  );

  const { data: statsData, isLoading: statsLoading } = useOpeningStats(
    shouldFetch ? username : null,
    dashboardFilters
  );

  const games = gamesData?.games || [];
  const openings = statsData?.openings || [];

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-20 h-20 text-accent-yellow mx-auto mb-6 animate-float" />
          <h1 className="text-4xl font-bold mb-4">
            Lotus<span className="text-gradient">Chess</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Enter a username to get started
          </p>
        </div>
      </div>
    );
  }

  const totalGames = games.length;
  const whiteGames = games.filter((g) => g.userColor === "white").length;
  const blackGames = games.filter((g) => g.userColor === "black").length;
  const whiteWins = games.filter(
    (g) => g.userColor === "white" && g.winner === "white"
  ).length;
  const blackWins = games.filter(
    (g) => g.userColor === "black" && g.winner === "black"
  ).length;
  const draws = games.filter((g) => g.winner === null).length;
  const whiteWinrate = whiteGames > 0 ? (whiteWins / whiteGames) * 100 : 0;
  const blackWinrate = blackGames > 0 ? (blackWins / blackGames) * 100 : 0;
  const overallWinrate = totalGames > 0 ? ((whiteWins + blackWins) / totalGames) * 100 : 0;
  const drawRate = totalGames > 0 ? (draws / totalGames) * 100 : 0;

  const topOpening = getTopOpeningByGames(openings);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Trophy className="w-5 h-5 text-accent-yellow" />
                  <span className="font-semibold">LotusChess</span>
                </Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-2xl font-bold">{username}</h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Chess Opening Analysis Dashboard
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/train">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent-purple/30 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-colors text-sm font-medium">
                  <TrainFront className="w-4 h-4" />
                  Entrenar
                </button>
              </Link>
              <ColorFilter value={colorFilter} onChange={setColorFilter} />
              <TimeFilter value={timeFilter} onChange={setTimeFilter} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Total Games"
            value={totalGames.toString()}
            icon={<Target className="w-5 h-5" />}
            isLoading={gamesLoading}
            variant="default"
          />
          <StatCard
            label="Win Rate"
            value={`${overallWinrate.toFixed(1)}%`}
            icon={<Trophy className="w-5 h-5" />}
            isLoading={gamesLoading}
            variant={overallWinrate >= 50 ? "success" : "warning"}
          />
          <StatCard
            label="Draw Rate"
            value={`${drawRate.toFixed(1)}%`}
            icon={<Users className="w-5 h-5" />}
            isLoading={gamesLoading}
            variant="info"
          />
          <StatCard
            label="Favorite Opening"
            value={topOpening?.eco || "N/A"}
            subValue={topOpening?.name}
            icon={<BookOpen className="w-5 h-5" />}
            isLoading={statsLoading}
            variant="default"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-card p-6 card-hover">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-blue" />
                Winrate by Opening
              </h2>
            </div>
            <OpeningBarChart openings={openings} />
          </div>
          <div className="glass-card p-6 card-hover">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-purple" />
                Opening Distribution
              </h2>
            </div>
            <OpeningPieChart openings={openings} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 card-hover">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent-yellow" />
                Performance by Color
              </h2>
            </div>
            <ColorWinrate
              whiteGames={whiteGames}
              whiteWins={whiteWins}
              whiteLosses={whiteGames - whiteWins}
              blackGames={blackGames}
              blackWins={blackWins}
              blackLosses={blackGames - blackWins}
            />
          </div>

          <div className="glass-card p-6 card-hover">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent-green" />
                Top Opening Lines
              </h2>
            </div>
            <div className="space-y-3">
              {openings.slice(0, 5).map((opening) => (
                <Link
                  key={opening.eco}
                  href={`/openings/${username}?eco=${opening.eco}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-background-secondary/50 hover:bg-background-tertiary transition-all duration-200 group cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm px-2 py-0.5 rounded bg-accent-blue/20 text-accent-blue">
                          {opening.eco}
                        </span>
                        <span className="font-medium truncate group-hover:text-gradient transition-colors">
                          {opening.name}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {opening.games} games
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex w-24 h-2.5 rounded-full overflow-hidden bg-background">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{
                            width: `${(opening.wins / opening.games) * 100}%`,
                          }}
                        />
                        <div
                          className="h-full bg-yellow-500 transition-all duration-300"
                          style={{
                            width: `${(opening.draws / opening.games) * 100}%`,
                          }}
                        />
                        <div
                          className="h-full bg-red-500 transition-all duration-300"
                          style={{
                            width: `${(opening.losses / opening.games) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                        {((opening.wins / opening.games) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
