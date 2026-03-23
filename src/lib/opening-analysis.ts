import { Chess } from "chess.js";
import { classifyOpening } from "@/lib/eco";
import { calculateWinrate, getResult } from "@/lib/utils";
import type { MoveNode, OpeningVariant, ParsedGame } from "@/types";

interface TreeNode {
  id: string;
  move: string;
  san: string;
  ply: number;
  fen: string;
  pathKey: string;
  children: Record<string, TreeNode>;
  wins: number;
  draws: number;
  losses: number;
  games: number;
}

interface VariantOptions {
  limit?: number;
  maxDepth?: number;
  unlockThreshold?: number;
}

function getTreeKey(ply: number, san: string): string {
  return ply % 2 === 1 ? `${Math.floor(ply / 2) + 1}. ${san}` : san;
}

function createNode(move: string, ply: number, fen: string, pathKey: string): TreeNode {
  return {
    id: pathKey,
    move,
    san: move,
    ply,
    fen,
    pathKey,
    children: {},
    wins: 0,
    draws: 0,
    losses: 0,
    games: 0,
  };
}

function buildTree(games: ParsedGame[]): Record<string, TreeNode> {
  const root: Record<string, TreeNode> = {};

  for (const game of games) {
    const chess = new Chess();
    let current = root;
    const pathParts: string[] = [];

    for (const move of game.moves) {
      const key = getTreeKey(move.ply, move.san);
      const pathKey = [...pathParts, move.san].join(" > ");
      if (!chess.move(move.san)) {
        break;
      }

      const fen = chess.fen();

      if (!current[key]) {
        current[key] = createNode(move.san, move.ply, fen, pathKey);
      }

      const result = getResult(game.winner, game.userColor === "white");

      if (result === "win") {
        current[key].wins += 1;
      } else if (result === "draw") {
        current[key].draws += 1;
      } else {
        current[key].losses += 1;
      }

      current[key].games += 1;
      current[key].fen = fen;
      current[key].pathKey = pathKey;

      pathParts.push(move.san);
      current = current[key].children;
    }
  }

  return root;
}

function buildContinuationTree(games: ParsedGame[]): Record<string, TreeNode> {
  const root: Record<string, TreeNode> = {};

  for (const game of games) {
    const chess = new Chess();
    const openingPly = game.openingPly ?? 0;
    const startingMoves = game.moves.filter((move) => move.ply <= openingPly);
    const continuationMoves = game.moves.filter((move) => move.ply > openingPly);

    for (const move of startingMoves) {
      if (!chess.move(move.san)) {
        break;
      }
    }

    let current = root;
    const pathParts: string[] = [];

    for (const move of continuationMoves) {
      const key = getTreeKey(move.ply, move.san);
      const pathKey = [...pathParts, move.san].join(" > ");
      if (!chess.move(move.san)) {
        break;
      }

      const fen = chess.fen();

      if (!current[key]) {
        current[key] = createNode(move.san, move.ply, fen, pathKey);
      }

      const result = getResult(game.winner, game.userColor === "white");

      if (result === "win") {
        current[key].wins += 1;
      } else if (result === "draw") {
        current[key].draws += 1;
      } else {
        current[key].losses += 1;
      }

      current[key].games += 1;
      current[key].fen = fen;
      current[key].pathKey = pathKey;

      pathParts.push(move.san);
      current = current[key].children;
    }
  }

  return root;
}

function toMoveNode(node: TreeNode): MoveNode {
  return {
    id: node.id,
    move: node.move,
    san: node.san,
    ply: node.ply,
    fen: node.fen,
    pathKey: node.pathKey,
    children: Object.values(node.children).map(toMoveNode),
    wins: node.wins,
    draws: node.draws,
    losses: node.losses,
    games: node.games,
  };
}

function buildDisplayMoveText(node: TreeNode): string {
  return getTreeKey(node.ply, node.san);
}

function buildClassificationMoveText(node: TreeNode): string {
  return node.ply % 2 === 1 ? `${Math.floor(node.ply / 2) + 1}.${node.san}` : node.san;
}

function buildPrincipalLine(node: TreeNode, maxDepth: number): TreeNode[] {
  const line: TreeNode[] = [node];
  let current = node;

  while (line.length < maxDepth) {
    const children = Object.values(current.children).sort((a, b) => b.games - a.games);

    if (children.length === 0) {
      break;
    }

    current = children[0];
    line.push(current);
  }

  return line;
}

function lineToText(line: TreeNode[]): string {
  return line.map(buildDisplayMoveText).join(" ");
}

function buildOpeningPrefixText(game: ParsedGame): string {
  const openingPly = game.openingPly ?? 0;
  const prefixMoves = game.moves.filter((move) => move.ply <= openingPly);

  return prefixMoves.map((move) => (move.ply % 2 === 1 ? `${Math.floor(move.ply / 2) + 1}. ${move.san}` : move.san)).join(" ");
}

function buildOpeningPrefixClassificationText(game: ParsedGame): string {
  const openingPly = game.openingPly ?? 0;
  const prefixMoves = game.moves.filter((move) => move.ply <= openingPly);

  return prefixMoves
    .map((move) => (move.ply % 2 === 1 ? `${Math.floor(move.ply / 2) + 1}.${move.san}` : move.san))
    .join(" ");
}

function matchesOpeningEco(gameEco: string | undefined, openingEco: string): boolean {
  if (openingEco === "other") {
    return !gameEco;
  }

  return gameEco?.startsWith(openingEco) ?? false;
}

export function buildOpeningMoveTree(games: ParsedGame[]): MoveNode[] {
  return Object.values(buildTree(games))
    .sort((a, b) => b.games - a.games)
    .map(toMoveNode);
}

export function buildOpeningVariants(
  games: ParsedGame[],
  openingEco: string,
  options: VariantOptions = {}
): OpeningVariant[] {
  const limit = options.limit ?? 6;
  const maxDepth = options.maxDepth ?? 5;
  const unlockThreshold = options.unlockThreshold ?? 10;
  const filteredGames = games.filter((game) => matchesOpeningEco(game.eco, openingEco));
  const root = buildContinuationTree(filteredGames);
  const prefixText = filteredGames[0] ? buildOpeningPrefixText(filteredGames[0]) : "";
  const prefixClassificationText = filteredGames[0] ? buildOpeningPrefixClassificationText(filteredGames[0]) : "";

  return Object.values(root)
    .sort((a, b) => b.games - a.games)
    .slice(0, limit)
    .map((node, index) => {
      const principalLine = buildPrincipalLine(node, maxDepth);
      const continuationText = lineToText(principalLine);
      const continuationClassificationText = principalLine.map(buildClassificationMoveText).join(" ");
      const lineText = prefixText ? `${prefixText} ${continuationText}` : continuationText;
      const classificationInput = prefixClassificationText
        ? `${prefixClassificationText} ${continuationClassificationText}`
        : continuationClassificationText;
      const classification = classifyOpening(classificationInput);
      const title = classification.name !== "Irregular" ? classification.name : `Main line ${index + 1}`;
      const finalFen = principalLine[principalLine.length - 1]?.fen ?? node.fen;

      return {
        id: `${openingEco}:${node.pathKey}`,
        title,
        lineText,
        fen: finalFen,
        games: node.games,
        wins: node.wins,
        draws: node.draws,
        losses: node.losses,
        winrate: calculateWinrate(node.wins, node.games),
        isUnlocked: node.games >= unlockThreshold,
        unlockThreshold,
        pathKey: node.pathKey,
        depth: principalLine.length,
      } satisfies OpeningVariant;
    });
}
