import { Chess } from "chess.js";
import type { RepertoireMove, RepertoireLine, Annotation, PgnParseResult, Color } from "@/types/training";

const ANNOTATION_MAP: Record<string, Annotation> = {
  "$1": "!",
  "$2": "?",
  "$3": "!!",
  "$4": "??",
  "$5": "!?",
  "$6": "?!",
};

const SAN_REGEX = /^(O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?)$/;

interface ParsedMoveToken {
  san: string;
  comment?: string;
  annotation?: Annotation;
  variations: ParsedMoveToken[][];
}

interface TokenizerResult {
  mainLine: ParsedMoveToken[];
  headers: Record<string, string>;
}

function stripPgnHeaders(pgn: string): { headers: Record<string, string>; moves: string } {
  const headers: Record<string, string> = {};
  const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match;
  while ((match = headerRegex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  const moves = pgn.replace(/\[[^\]]*\]/g, "").replace(/\{[^}]*\}/g, (m) => m).trim();
  return { headers, moves };
}

function hasVariations(text: string): boolean {
  let depth = 0;
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth > 0 && ch !== "(" && ch !== ")" && ch !== " ") return true;
  }
  return false;
}

function tokenizeMoves(text: string): ParsedMoveToken[] {
  const tokens: ParsedMoveToken[] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    while (i < len && /\s/.test(text[i])) i++;
    if (i >= len) break;

    if (text[i] === "(") {
      i++;
      let depth = 1;
      const start = i;
      while (i < len && depth > 0) {
        if (text[i] === "(") depth++;
        if (text[i] === ")") depth--;
        i++;
      }
      const varText = text.slice(start, i - 1);
      if (tokens.length > 0) {
        const lastToken = tokens[tokens.length - 1];
        lastToken.variations = [tokenizeMoves(varText)];
      }
      continue;
    }

    if (text[i] === ")") {
      i++;
      continue;
    }

    if (text[i] === "{") {
      i++;
      const start = i;
      while (i < len && text[i] !== "}") i++;
      const comment = text.slice(start, i).trim();
      i++;
      if (tokens.length > 0) {
        tokens[tokens.length - 1].comment = comment;
      }
      continue;
    }

    if (text[i] === "$") {
      const annStart = i;
      i++;
      while (i < len && /\d/.test(text[i])) i++;
      const annCode = text.slice(annStart, i);
      const annotation = ANNOTATION_MAP[annCode];
      if (annotation && tokens.length > 0) {
        tokens[tokens.length - 1].annotation = annotation;
      }
      continue;
    }

    if (text[i] === "(" || text[i] === ")") continue;

    let word = "";
    while (i < len && !/[\s()]/.test(text[i])) {
      word += text[i];
      i++;
    }

    if (!word) continue;

    if (/^\d+\.+$/.test(word)) continue;
    if (/^\{/.test(word)) continue;

    const cleanSan = word.replace(/[+#!?]/g, "");
    if (SAN_REGEX.test(cleanSan)) {
      tokens.push({ san: cleanSan, variations: [] });
    }
  }

  return tokens;
}

function buildMoveTreeFromTokens(
  tokens: ParsedMoveToken[],
  game: Chess,
  ply: number
): RepertoireMove[] {
  const moves: RepertoireMove[] = [];

  for (const token of tokens) {
    const fen = game.fen();
    const move = game.move(token.san);

    if (!move) continue;

    const repertoireMove: RepertoireMove = {
      san: token.san,
      uci: move.from + move.to + (move.promotion || ""),
      fen,
      comment: token.comment,
      annotation: token.annotation,
      children: [],
      ply,
    };

    if (token.variations.length > 0) {
      for (const varTokens of token.variations) {
        const varGame = new Chess(fen);
        const varMoves = buildMoveTreeFromTokens(varTokens, varGame, ply + 1);
        repertoireMove.children.push(...varMoves);
      }
    }

    const nextTokens = tokens.slice(tokens.indexOf(token) + 1);
    if (nextTokens.length > 0) {
      const continuationGame = new Chess(game.fen());
      const continuationMoves = buildMoveTreeFromTokens(nextTokens, continuationGame, ply + 1);
      repertoireMove.children = [...repertoireMove.children, ...continuationMoves];
    }

    moves.push(repertoireMove);
    break;
  }

  return moves;
}

function parseLinear(text: string): RepertoireMove[] {
  const cleanText = text
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\$\d+/g, " ")
    .replace(/\d+\.+\s*/g, " ")
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, "")
    .replace(/[+#!?]/g, "")
    .trim();

  const sanMoves = cleanText.split(/\s+/).filter((m) => m && SAN_REGEX.test(m));

  const game = new Chess();
  const moves: RepertoireMove[] = [];
  let ply = 1;

  for (const san of sanMoves) {
    const fen = game.fen();
    const move = game.move(san);
    if (!move) break;

    moves.push({
      san,
      uci: move.from + move.to + (move.promotion || ""),
      fen,
      children: [],
      ply,
    });
    ply++;
  }

  return moves;
}

export function parsePgn(pgn: string): PgnParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const gameBlocks = pgn
      .split(/\n(?=\[)/)
      .map((b) => b.trim())
      .filter(Boolean);

    if (gameBlocks.length === 0) {
      const { headers, moves: moveText } = stripPgnHeaders(pgn);
      const repertoires = processSinglePgn(moveText, headers, warnings);
      return { success: repertoires.length > 0, repertoires, errors, warnings };
    }

    const allRepertoires: RepertoireLine[] = [];

    for (const block of gameBlocks) {
      const { headers, moves: moveText } = stripPgnHeaders(block);
      const repertoires = processSinglePgn(moveText, headers, warnings);
      allRepertoires.push(...repertoires);
    }

    if (allRepertoires.length === 0) {
      const { headers, moves: moveText } = stripPgnHeaders(pgn);
      const repertoires = processSinglePgn(moveText, headers, warnings);
      return { success: repertoires.length > 0, repertoires, errors, warnings };
    }

    return { success: true, repertoires: allRepertoires, errors, warnings };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Error desconocido al parsear PGN");
    return { success: false, repertoires: [], errors, warnings };
  }
}

function processSinglePgn(
  moveText: string,
  headers: Record<string, string>,
  warnings: string[]
): RepertoireLine[] {
  const cleanMoveText = moveText
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, "")
    .trim();

  if (!cleanMoveText) {
    warnings.push("No se encontraron movimientos en el PGN");
    return [];
  }

  const usesVariations = hasVariations(cleanMoveText);

  if (usesVariations) {
    return parseWithVariations(cleanMoveText, headers);
  }

  const rootMoves = parseLinear(cleanMoveText);
  if (rootMoves.length === 0) {
    warnings.push("No se pudieron parsear movimientos válidos");
    return [];
  }

  const name = headers.Event || headers.Opening || "Repertorio";
  const color: Color = headers.Color === "black" ? "black" : "white";

  return [
    {
      id: generateId(),
      name,
      color,
      rootMoves,
      createdAt: Date.now(),
    },
  ];
}

function parseWithVariations(
  text: string,
  headers: Record<string, string>
): RepertoireLine[] {
  const tokens = tokenizeMoves(text);
  if (tokens.length === 0) return [];

  const game = new Chess();
  const rootMoves: RepertoireMove[] = [];
  let ply = 1;

  function processTokens(tkns: ParsedMoveToken[], g: Chess, currentPly: number) {
    const result: RepertoireMove[] = [];

    for (const token of tkns) {
      const fen = g.fen();
      const move = g.move(token.san);
      if (!move) continue;

      const repMove: RepertoireMove = {
        san: token.san,
        uci: move.from + move.to + (move.promotion || ""),
        fen,
        comment: token.comment,
        annotation: token.annotation,
        children: [],
        ply: currentPly,
      };

      for (const varTokens of token.variations) {
        const varGame = new Chess(fen);
        const varChildren = processTokens(varTokens, varGame, currentPly + 1);
        repMove.children.push(...varChildren);
      }

      result.push(repMove);
      currentPly++;
    }

    return result;
  }

  const mainLine = processTokens(tokens, game, ply);

  const name = headers.Event || headers.Opening || "Repertorio con variantes";
  const color: Color = headers.Color === "black" ? "black" : "white";

  return [
    {
      id: generateId(),
      name,
      color,
      rootMoves: mainLine,
      createdAt: Date.now(),
    },
  ];
}

export function validatePgnFormat(pgn: string): { valid: boolean; message: string; hasVariations: boolean } {
  const trimmed = pgn.trim();
  if (!trimmed) return { valid: false, message: "El PGN está vacío", hasVariations: false };

  const { moves } = stripPgnHeaders(trimmed);
  const cleanMoves = moves.replace(/\{[^}]*\}/g, " ").replace(/\$\d+/g, " ");

  const hasMoves = /\d+\.+\s*[KQRBNPa-hO]/.test(cleanMoves) || SAN_REGEX.test(cleanMoves.split(/\s+/)[0]);
  if (!hasMoves) return { valid: false, message: "No se encontraron movimientos válidos", hasVariations: false };

  const usesVariations = hasVariations(cleanMoves);

  return {
    valid: true,
    message: usesVariations
      ? `PGN válido con variaciones detectadas`
      : "PGN válido (líneas lineales)",
    hasVariations: usesVariations,
  };
}

export function extractCommentsFromPgn(pgn: string): Map<string, string> {
  const comments = new Map<string, string>();
  const { moves } = stripPgnHeaders(pgn);

  const game = new Chess();
  const parts = moves.split(/(\{[^}]*\})/);
  let ply = 1;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith("{")) {
      const comment = part.slice(1, -1).trim();
      if (comment && i > 0) {
        const prevPart = parts[i - 1].trim();
        const sanMatch = prevPart.match(/([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?)/);
        if (sanMatch) {
          comments.set(`${game.fen()}:${sanMatch[1]}`, comment);
        }
      }
      continue;
    }

    const cleanPart = part.replace(/\d+\.+\s*/g, "").replace(/[+#!?]/g, "").trim();
    const sanMoves = cleanPart.split(/\s+/).filter((m) => m && SAN_REGEX.test(m));
    for (const san of sanMoves) {
      game.move(san);
      ply++;
    }
  }

  return comments;
}

function generateId(): string {
  return `rep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
