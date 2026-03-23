export interface OpeningData {
  eco: string;
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  asWhite: number;
  asBlack: number;
  bulletGames: number;
  blitzGames: number;
  rapidGames: number;
  classicalGames: number;
  recentGames: RecentGame[];
}

export interface RecentGame {
  id: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  date: string;
  eco: string;
  moves: number;
}

export interface Move {
  ply: number;
  san: string;
  uci: string;
}

export interface LichessPlayer {
  user?: {
    name: string;
    id: string;
  };
  rating?: number;
  ratingDiff?: number;
}

export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf?: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: LichessPlayer;
    black: LichessPlayer;
  };
  winner?: "white" | "black";
  opening?: {
    eco: string;
    name: string;
    ply: number;
  };
  moves: string;
  clock?: {
    initial: number;
    increment: number;
  };
}

export interface ParsedGame {
  id: string;
  white: string;
  black: string;
  winner: "white" | "black" | null;
  result: string;
  userColor: "white" | "black";
  eco?: string;
  openingName?: string;
  openingPly?: number;
  rated: boolean;
  speed: string;
  whiteElo?: number;
  blackElo?: number;
  moves: Move[];
  playedAt: string;
}

export interface GameFilters {
  since?: number;
  until?: number;
  rated?: boolean;
  perfType?: "bullet" | "blitz" | "rapid" | "classical";
  max?: number;
  color?: "white" | "black";
}

export interface OpeningStats {
  eco: string;
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  whiteGames: number;
  whiteWins: number;
  blackGames: number;
  blackWins: number;
  bulletGames: number;
  blitzGames: number;
  rapidGames: number;
  classicalGames: number;
}

export interface MoveNode {
  move: string;
  san: string;
  ply: number;
  children: MoveNode[];
  wins: number;
  draws: number;
  losses: number;
  games: number;
}

export interface UserData {
  id: string;
  username: string;
  perfs: {
    [key: string]: {
      games: number;
      rating: number;
      rd: number;
      prog: number;
    };
  };
  createdAt: number;
  seenAt: number;
  playTime: {
    total: number;
    tv: number;
  };
}

export interface GamesResponse {
  username: string;
  games: ParsedGame[];
  total: number;
}

export interface OpeningStatsResponse {
  username: string;
  openings: OpeningData[];
  stats: OpeningStats;
}
