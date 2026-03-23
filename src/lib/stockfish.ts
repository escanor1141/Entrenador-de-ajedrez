import type { EngineScore } from "@/types/review";

export interface StockfishMessage {
  type: "info" | "bestmove" | "ready" | "error";
  requestId?: string;
  data?: string;
  bestMove?: string | null;
  score?: EngineScore | null;
  depth?: number;
  pv?: string[];
  nodes?: number | null;
  nps?: number | null;
}

export interface StockfishEvaluationRequest {
  fen: string;
  depth?: number;
  timeoutMs?: number;
}

export interface EvaluationResult {
  requestId: string;
  fen: string;
  depth: number;
  engineVersion: string;
  bestMove: string | null;
  score: EngineScore | null;
  pv: string[];
  nodes: number | null;
  nps: number | null;
}

export interface StockfishWorkerLike {
  postMessage(message: string): void;
  addEventListener(type: string, listener: (event: any) => void): void;
  terminate(): void;
}

export interface StockfishEvaluatorOptions {
  createWorker?: () => StockfishWorkerLike;
  engineUrl?: string;
  engineVersion?: string;
  defaultDepth?: number;
  requestTimeoutMs?: number;
}

export class StockfishEvaluationError extends Error {
  constructor(message: string, public readonly recoverable = true) {
    super(message);
    this.name = "StockfishEvaluationError";
  }
}

export class StockfishTimeoutError extends StockfishEvaluationError {
  constructor(
    public readonly requestId: string,
    public readonly timeoutMs: number,
    public readonly fen: string
  ) {
    super(`Stockfish request ${requestId} timed out after ${timeoutMs}ms`);
    this.name = "StockfishTimeoutError";
  }
}

export class StockfishWorkerError extends StockfishEvaluationError {
  constructor(message: string, public readonly requestId: string | null) {
    super(message);
    this.name = "StockfishWorkerError";
  }
}

const STOCKFISH_WORKER_URL = "https://unpkg.com/stockfish.js@10.0.2/stockfish.js";
const DEFAULT_ENGINE_VERSION = "stockfish.js@10.0.2";
const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;
const DEFAULT_DEPTH = 20;

type CacheEntry =
  | {
      status: "pending";
      promise: Promise<EvaluationResult>;
    }
  | {
      status: "fulfilled";
      result: EvaluationResult;
    };

interface PendingRequest {
  requestId: string;
  cacheKey: string;
  fen: string;
  depth: number;
  timeoutMs: number;
  resolve: (result: EvaluationResult) => void;
  reject: (error: unknown) => void;
}

interface ActiveRequest extends PendingRequest {
  timeoutHandle: ReturnType<typeof setTimeout> | null;
  lastScore: EngineScore | null;
  lastDepth: number;
  lastPv: string[];
  lastNodes: number | null;
  lastNps: number | null;
}

interface ReadyWaiter {
  resolve: () => void;
  reject: (error: Error) => void;
}

function createDefaultWorker(engineUrl: string): StockfishWorkerLike {
  if (typeof Worker === "undefined") {
    throw new Error("Worker is not available in this environment");
  }

  return new Worker(engineUrl) as unknown as StockfishWorkerLike;
}

function normalizeFen(fen: string): string {
  return fen.trim().replace(/\s+/g, " ");
}

function createCacheKey(fen: string, depth: number, engineVersion: string): string {
  return `${engineVersion}::${depth}::${normalizeFen(fen)}`;
}

function cloneScore(score: EngineScore | null): EngineScore | null {
  if (!score) {
    return null;
  }

  return score.kind === "cp" ? { kind: "cp", cp: score.cp } : { kind: "mate", mate: score.mate };
}

function cloneEvaluationResult(result: EvaluationResult): EvaluationResult {
  return {
    ...result,
    score: cloneScore(result.score),
    pv: [...result.pv],
  };
}

function parseEngineScore(line: string): EngineScore | null {
  const mateMatch = line.match(/\bscore mate (-?\d+)/);
  if (mateMatch) {
    return {
      kind: "mate",
      mate: Number(mateMatch[1]),
    };
  }

  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  if (cpMatch) {
    return {
      kind: "cp",
      cp: Number(cpMatch[1]),
    };
  }

  return null;
}

function parseInfoLine(line: string): {
  score: EngineScore | null;
  depth: number | null;
  pv: string[] | null;
  nodes: number | null;
  nps: number | null;
} {
  const tokens = line.split(/\s+/);
  const infoKeys = new Set(["depth", "seldepth", "multipv", "score", "pv", "nodes", "nps", "time", "hashfull", "currmove", "currmovenumber", "tbhits", "cpuload"]);
  let depth: number | null = null;
  let nodes: number | null = null;
  let nps: number | null = null;
  let pv: string[] | null = null;

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === "depth" && tokens[index + 1]) {
      depth = Number(tokens[index + 1]);
      index += 1;
      continue;
    }

    if (token === "nodes" && tokens[index + 1]) {
      nodes = Number(tokens[index + 1]);
      index += 1;
      continue;
    }

    if (token === "nps" && tokens[index + 1]) {
      nps = Number(tokens[index + 1]);
      index += 1;
      continue;
    }

    if (token === "pv") {
      const pvTokens: string[] = [];

      for (let pvIndex = index + 1; pvIndex < tokens.length; pvIndex += 1) {
        const pvToken = tokens[pvIndex];
        if (infoKeys.has(pvToken)) {
          break;
        }

        pvTokens.push(pvToken);
      }

      if (pvTokens.length > 0) {
        pv = pvTokens;
      }
    }
  }

  return {
    score: parseEngineScore(line),
    depth,
    pv,
    nodes,
    nps,
  };
}

function parseBestMove(line: string): string | null {
  const match = line.match(/^bestmove\s+(\S+)/);
  if (!match) {
    return null;
  }

  return match[1] === "(none)" ? null : match[1];
}

export class StockfishEvaluator {
  private readonly createWorker: () => StockfishWorkerLike;
  private readonly engineUrl: string;
  private readonly engineVersion: string;
  private readonly defaultDepth: number;
  private readonly requestTimeoutMs: number;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly messageSubscribers = new Set<(message: StockfishMessage) => void>();
  private readonly readyWaiters: ReadyWaiter[] = [];

  private worker: StockfishWorkerLike | null = null;
  private workerReady = false;
  private disposed = false;
  private requestQueue: PendingRequest[] = [];
  private activeRequest: ActiveRequest | null = null;
  private processingQueue = false;
  private requestSequence = 0;

  constructor(options: StockfishEvaluatorOptions = {}) {
    this.engineUrl = options.engineUrl ?? STOCKFISH_WORKER_URL;
    this.createWorker = options.createWorker ?? (() => createDefaultWorker(this.engineUrl));
    this.engineVersion = options.engineVersion ?? DEFAULT_ENGINE_VERSION;
    this.defaultDepth = options.defaultDepth ?? DEFAULT_DEPTH;
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  subscribe(handler: (message: StockfishMessage) => void): () => void {
    this.messageSubscribers.add(handler);

    return () => {
      this.messageSubscribers.delete(handler);
    };
  }

  async evaluatePosition(request: StockfishEvaluationRequest): Promise<EvaluationResult> {
    if (this.disposed) {
      throw new StockfishEvaluationError("Stockfish evaluator has been disposed", false);
    }

    const fen = normalizeFen(request.fen);
    const depth = request.depth ?? this.defaultDepth;
    const timeoutMs = request.timeoutMs ?? this.requestTimeoutMs;
    const cacheKey = createCacheKey(fen, depth, this.engineVersion);
    const cached = this.cache.get(cacheKey);

    if (cached?.status === "fulfilled") {
      return cloneEvaluationResult(cached.result);
    }

    if (cached?.status === "pending") {
      return cached.promise.then(cloneEvaluationResult);
    }

    const requestId = `req-${++this.requestSequence}`;

    const promise = new Promise<EvaluationResult>((resolve, reject) => {
      this.requestQueue.push({
        requestId,
        cacheKey,
        fen,
        depth,
        timeoutMs,
        resolve,
        reject,
      });
    });

    this.cache.set(cacheKey, {
      status: "pending",
      promise,
    });

    this.kickQueue();

    return promise;
  }

  async prewarm(): Promise<void> {
    if (this.disposed) {
      throw new StockfishEvaluationError("Stockfish evaluator has been disposed", false);
    }

    if (this.workerReady) {
      return;
    }

    this.createWorkerIfNeeded();

    if (this.workerReady) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.readyWaiters.push({
        resolve,
        reject,
      });
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  dispose(): void {
    this.disposed = true;
    const queuedRequests = this.requestQueue.splice(0);
    this.rejectReadyWaiters(new StockfishEvaluationError("Stockfish evaluator disposed", false));

    if (this.activeRequest) {
      this.rejectActiveRequest(new StockfishEvaluationError("Stockfish evaluator disposed", false));
    }

    for (const request of queuedRequests) {
      this.cache.delete(request.cacheKey);
      request.reject(new StockfishEvaluationError("Stockfish evaluator disposed", false));
    }

    this.terminateWorker();
    this.cache.clear();
    this.messageSubscribers.clear();
  }

  cancelActiveRequest(): void {
    if (!this.activeRequest) {
      return;
    }

    this.handleWorkerFailure(new StockfishEvaluationError("Stockfish evaluation cancelled", true));
  }

  private createWorkerIfNeeded(): void {
    if (this.worker || this.disposed) {
      return;
    }

    const worker = this.createWorker();
    const workerRef = worker;

    this.worker = worker;
    this.workerReady = false;

    worker.addEventListener("message", (event: { data: unknown }) => {
      if (this.worker !== workerRef) {
        return;
      }

      this.handleWorkerMessage(event.data);
    });

    worker.addEventListener("error", (event: { message?: string; error?: unknown }) => {
      if (this.worker !== workerRef) {
        return;
      }

      const message = event.error instanceof Error ? event.error.message : event.message ?? "Stockfish worker error";
      this.handleWorkerFailure(new StockfishWorkerError(message, this.activeRequest?.requestId ?? null));
    });

    worker.postMessage("uci");
    worker.postMessage("isready");
  }

  private handleWorkerMessage(data: unknown): void {
    const text = typeof data === "string" ? data : String(data);
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    for (const line of lines) {
      if (line === "uciok" || line === "readyok") {
        this.workerReady = true;
        this.notifySubscribers({ type: "ready" });
        this.resolveReadyWaiters();
        queueMicrotask(() => this.kickQueue());
        continue;
      }

      const active = this.activeRequest;
      if (!active) {
        continue;
      }

      if (line.startsWith("info ")) {
        const parsed = parseInfoLine(line);
        if (parsed.score) {
          active.lastScore = parsed.score;
        }

        if (parsed.depth !== null) {
          active.lastDepth = parsed.depth;
        }

        if (parsed.pv) {
          active.lastPv = parsed.pv;
        }

        if (parsed.nodes !== null) {
          active.lastNodes = parsed.nodes;
        }

        if (parsed.nps !== null) {
          active.lastNps = parsed.nps;
        }

        this.notifySubscribers({
          type: "info",
          requestId: active.requestId,
          data: line,
          score: active.lastScore,
          depth: active.lastDepth,
          pv: [...active.lastPv],
          nodes: active.lastNodes,
          nps: active.lastNps,
        });

        continue;
      }

      if (line.startsWith("bestmove ")) {
        this.completeActiveRequest(line);
      }
    }
  }

  private completeActiveRequest(bestmoveLine: string): void {
    const active = this.activeRequest;
    if (!active) {
      return;
    }

    if (active.timeoutHandle) {
      clearTimeout(active.timeoutHandle);
    }

    this.activeRequest = null;

    const result: EvaluationResult = {
      requestId: active.requestId,
      fen: active.fen,
      depth: active.lastDepth,
      engineVersion: this.engineVersion,
      bestMove: parseBestMove(bestmoveLine),
      score: cloneScore(active.lastScore),
      pv: [...active.lastPv],
      nodes: active.lastNodes,
      nps: active.lastNps,
    };

    this.cache.set(active.cacheKey, {
      status: "fulfilled",
      result,
    });

    active.resolve(cloneEvaluationResult(result));
    this.notifySubscribers({
      type: "bestmove",
      requestId: active.requestId,
      data: bestmoveLine,
      bestMove: result.bestMove,
      score: result.score,
      depth: result.depth,
      pv: [...result.pv],
      nodes: result.nodes,
      nps: result.nps,
    });

    queueMicrotask(() => this.kickQueue());
  }

  private kickQueue(): void {
    if (this.disposed || this.processingQueue || this.activeRequest || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      this.createWorkerIfNeeded();

      if (!this.workerReady || this.activeRequest || this.requestQueue.length === 0) {
        return;
      }

      const nextRequest = this.requestQueue.shift();
      if (!nextRequest || !this.worker) {
        return;
      }

      const activeRequest: ActiveRequest = {
        ...nextRequest,
        timeoutHandle: null,
        lastScore: null,
        lastDepth: nextRequest.depth,
        lastPv: [],
        lastNodes: null,
        lastNps: null,
      };

      activeRequest.timeoutHandle = setTimeout(() => {
        if (this.activeRequest?.requestId !== activeRequest.requestId) {
          return;
        }

        this.handleWorkerFailure(
          new StockfishTimeoutError(activeRequest.requestId, activeRequest.timeoutMs, activeRequest.fen)
        );
      }, activeRequest.timeoutMs);

      this.activeRequest = activeRequest;
      this.worker.postMessage(`position fen ${activeRequest.fen}`);
      this.worker.postMessage(`go depth ${activeRequest.depth}`);
    } finally {
      this.processingQueue = false;
    }
  }

  private handleWorkerFailure(error: Error): void {
    const active = this.activeRequest;
    if (active) {
      if (active.timeoutHandle) {
        clearTimeout(active.timeoutHandle);
      }

      this.activeRequest = null;
      this.cache.delete(active.cacheKey);
      active.reject(error);
      this.notifySubscribers({
        type: "error",
        requestId: active.requestId,
        data: error.message,
      });
    }

    this.resetWorker();
    this.kickQueue();
  }

  private rejectActiveRequest(error: Error): void {
    const active = this.activeRequest;
    if (!active) {
      return;
    }

    if (active.timeoutHandle) {
      clearTimeout(active.timeoutHandle);
    }

    this.activeRequest = null;
    this.cache.delete(active.cacheKey);
    active.reject(error);
  }

  private resetWorker(): void {
    this.workerReady = false;
    this.rejectReadyWaiters(new StockfishEvaluationError("Stockfish worker reset", true));
    this.terminateWorker();
  }

  private resolveReadyWaiters(): void {
    while (this.readyWaiters.length > 0) {
      const waiter = this.readyWaiters.shift();
      waiter?.resolve();
    }
  }

  private rejectReadyWaiters(error: Error): void {
    while (this.readyWaiters.length > 0) {
      const waiter = this.readyWaiters.shift();
      waiter?.reject(error);
    }
  }

  private terminateWorker(): void {
    if (!this.worker) {
      return;
    }

    try {
      this.worker.terminate();
    } finally {
      this.worker = null;
      this.workerReady = false;
    }
  }

  private notifySubscribers(message: StockfishMessage): void {
    for (const handler of this.messageSubscribers) {
      handler(message);
    }
  }
}

export function createStockfishEvaluator(options: StockfishEvaluatorOptions = {}): StockfishEvaluator {
  return new StockfishEvaluator(options);
}

const defaultEvaluator = new StockfishEvaluator();

export async function initStockfish(): Promise<void> {
  await defaultEvaluator.prewarm();
}

export async function evaluatePosition(request: StockfishEvaluationRequest): Promise<EvaluationResult> {
  return defaultEvaluator.evaluatePosition(request);
}

export function clearCache(): void {
  defaultEvaluator.clearCache();
}

export function dispose(): void {
  defaultEvaluator.dispose();
}

export function terminateStockfish(): void {
  defaultEvaluator.dispose();
}

export function onStockfishMessage(handler: (msg: StockfishMessage) => void) {
  return defaultEvaluator.subscribe(handler);
}

export function stopEvaluation(): void {
  defaultEvaluator.cancelActiveRequest();
}

export function formatEvaluation(evaluation: number | null): string {
  if (evaluation === null) return "0.00";
  if (Math.abs(evaluation) >= 100) {
    const sign = evaluation > 0 ? "+" : "";
    return `${sign}${Math.floor(evaluation)}`;
  }

  const sign = evaluation > 0 ? "+" : "";
  return `${sign}${evaluation.toFixed(2)}`;
}

export function uciToSan(fen: string, uciMove: string): string {
  return uciMove;
}

export { DEFAULT_ENGINE_VERSION, DEFAULT_REQUEST_TIMEOUT_MS };
