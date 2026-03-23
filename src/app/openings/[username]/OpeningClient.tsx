"use client";

import { useCallback, useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { MoveTree } from "@/components/chess/MoveTree";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { OpeningData, ParsedGame, type MoveNode } from "@/types";
import { ArrowLeft, Users, Trophy, Crown, Shield, Target } from "lucide-react";
import Link from "next/link";
import { calculateWinrate } from "@/lib/utils";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface OpeningClientProps {
  username: string;
  initialEco?: string;
}

export function OpeningClient({ username, initialEco }: OpeningClientProps) {
  const [eco, setEco] = useState(initialEco || "");
  const [openings, setOpenings] = useState<OpeningData[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<OpeningData | null>(null);
  const [selectedFen, setSelectedFen] = useState(STARTING_FEN);
  const [moveTree, setMoveTree] = useState<MoveNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const buildMoveTree = useCallback((gameList: ParsedGame[]) => {
    const root: Record<string, MoveNode> = {};

    for (const game of gameList) {
      const chess = new Chess();
      let current: Record<string, MoveNode> = root;
      const pathParts: string[] = [];

      for (const move of game.moves) {
        const key = move.ply % 2 === 1 ? `${Math.floor(move.ply / 2) + 1}. ${move.san}` : move.san;
        const moveKey = move.san;
        const pathKey = [...pathParts, moveKey].join(" > ");
        const chessMove = chess.move(move.san);

        if (!chessMove) {
          break;
        }

        const fen = chess.fen();

        if (!current[key]) {
          current[key] = {
            id: pathKey,
            move: move.san,
            san: move.san,
            ply: move.ply,
            fen,
            pathKey,
            children: [],
            wins: 0,
            draws: 0,
            losses: 0,
            games: 0,
          };
        }

        const result =
          game.winner === null
            ? "draw"
            : (game.userColor === "white" && game.winner === "white") ||
                (game.userColor === "black" && game.winner === "black")
              ? "win"
              : "loss";

        if (result === "win") current[key].wins++;
        else if (result === "draw") current[key].draws++;
        else current[key].losses++;
        current[key].games++;

        current[key].fen = fen;
        current[key].pathKey = pathKey;

        pathParts.push(moveKey);
        current = current[key].children as unknown as Record<string, MoveNode>;
      }
    }

    setMoveTree(Object.values(root));
  }, []);

  const fetchOpeningData = useCallback(
    async (ecoCode: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/openings/${username}?eco=${ecoCode}&max=300`);
        const data = await res.json();

        if (data.openings) {
          setOpenings(Object.values(data.openings));
          setSelectedOpening(data.openings[ecoCode]);
        }
        if (data.games) {
          buildMoveTree(data.games);
        }
      } catch (error) {
        console.error("Error fetching opening data:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [buildMoveTree, username]
  );

  useEffect(() => {
    setSelectedFen(STARTING_FEN);
  }, [eco]);

  useEffect(() => {
    if (eco) {
      void fetchOpeningData(eco);
    }
  }, [eco, fetchOpeningData]);

  const handleOpeningSelect = (ecoCode: string) => {
    setEco(ecoCode);
  };

  if (!eco && !selectedOpening) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href={`/dashboard/${username}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{username}&apos;s Openings</h1>
          <p className="text-muted-foreground mb-8">
            Select an opening to view detailed analysis
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {openings.map((opening) => (
              <button
                key={opening.eco}
                onClick={() => handleOpeningSelect(opening.eco)}
                className="bg-background-secondary rounded-lg p-4 text-left hover:bg-background-tertiary transition-colors"
              >
                <div className="font-mono text-accent-blue mb-1">
                  {opening.eco}
                </div>
                <div className="font-medium mb-2">{opening.name}</div>
                <div className="text-sm text-muted-foreground">
                  {opening.games} games
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const opening = selectedOpening;
  if (!opening) return null;

  const winrate = calculateWinrate(opening.wins, opening.games);
  const drawRate = calculateWinrate(opening.draws, opening.games);
  const lossRate = calculateWinrate(opening.losses, opening.games);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/dashboard/${username}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="font-mono text-accent-blue">{opening.eco}</span>{" "}
              {opening.name}
            </h1>
            <p className="text-muted-foreground">
              Detailed analysis for {username}
            </p>
          </div>
          <Link href="/train">
            <Button variant="outline">
              <Target className="w-4 h-4 mr-2" />
              Entrenar Apertura
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Games"
            value={opening.games.toString()}
            icon={<Users className="w-5 h-5" />}
            isLoading={isLoading}
          />
          <StatCard
            label="Win Rate"
            value={`${winrate.toFixed(1)}%`}
            icon={<Trophy className="w-5 h-5" />}
            isLoading={isLoading}
          />
          <StatCard
            label="As White"
            value={opening.asWhite.toString()}
            icon={<Crown className="w-5 h-5" />}
            isLoading={isLoading}
          />
          <StatCard
            label="As Black"
            value={opening.asBlack.toString()}
            icon={<Shield className="w-5 h-5" />}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-background-secondary rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Interactive Board</h2>
              <div className="flex justify-center mb-4">
                <ChessBoard
                  position={selectedFen}
                  onPositionChange={setSelectedFen}
                  boardWidth={400}
                />
              </div>
            </div>

            <div className="bg-background-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Move Tree</h2>
              <MoveTree
                tree={moveTree}
                selectedFen={selectedFen}
                onMoveClick={(node) => setSelectedFen(node.fen)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-background-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Wins</span>
                    <span className="text-accent-green">
                      {opening.wins} ({(opening.wins / opening.games * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-background-tertiary rounded overflow-hidden">
                    <div
                      className="h-full bg-accent-green"
                      style={{ width: `${(opening.wins / opening.games) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Draws</span>
                    <span className="text-accent-yellow">
                      {opening.draws} ({(opening.draws / opening.games * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-background-tertiary rounded overflow-hidden">
                    <div
                      className="h-full bg-accent-yellow"
                      style={{ width: `${(opening.draws / opening.games) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Losses</span>
                    <span className="text-accent-red">
                      {opening.losses} ({(opening.losses / opening.games * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-background-tertiary rounded overflow-hidden">
                    <div
                      className="h-full bg-accent-red"
                      style={{ width: `${(opening.losses / opening.games) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">By Time Control</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bullet</span>
                  <span>{opening.bulletGames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blitz</span>
                  <span>{opening.blitzGames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rapid</span>
                  <span>{opening.rapidGames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Classical</span>
                  <span>{opening.classicalGames}</span>
                </div>
              </div>
            </div>

            <div className="bg-background-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Games</h2>
              <div className="space-y-2">
                {opening.recentGames.map((game) => (
                  <div
                    key={game.id}
                    className="p-3 bg-background-tertiary rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        vs {game.opponent}
                      </span>
                      <span
                        className={`text-sm ${
                          game.result === "win"
                            ? "text-accent-green"
                            : game.result === "draw"
                            ? "text-accent-yellow"
                            : "text-accent-red"
                        }`}
                      >
                        {game.result}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {game.eco} • {game.moves} moves
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
