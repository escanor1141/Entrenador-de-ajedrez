import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createStockfishEvaluator, type StockfishWorkerLike } from "@/lib/stockfish";

class MockStockfishWorker implements StockfishWorkerLike {
  public readonly messages: string[] = [];
  public terminated = false;
  public readonly postMessage = vi.fn((message: string) => {
    this.messages.push(message);
  });

  private readonly listeners = {
    message: new Set<(event: { data: unknown }) => void>(),
    error: new Set<(event: { message?: string; error?: unknown }) => void>(),
  };

  addEventListener(type: string, listener: (event: any) => void): void {
    if (type === "message") {
      this.listeners.message.add(listener);
      return;
    }

    if (type === "error") {
      this.listeners.error.add(listener);
    }
  }

  terminate(): void {
    this.terminated = true;
  }

  emitMessage(data: string): void {
    for (const listener of this.listeners.message) {
      listener({ data });
    }
  }

  emitError(message: string): void {
    for (const listener of this.listeners.error) {
      listener({ message });
    }
  }
}

function createMockFactory() {
  const workers: MockStockfishWorker[] = [];

  return {
    workers,
    createWorker: () => {
      const worker = new MockStockfishWorker();
      workers.push(worker);
      return worker;
    },
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("stockfish evaluator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("serializes requests and keeps results isolated", async () => {
    const { workers, createWorker } = createMockFactory();
    const evaluator = createStockfishEvaluator({ createWorker, requestTimeoutMs: 1000 });
    const first = evaluator.evaluatePosition({ fen: "fen-one", depth: 12 });
    const second = evaluator.evaluatePosition({ fen: "fen-two", depth: 14 });

    expect(workers).toHaveLength(1);
    expect(workers[0]?.messages).toEqual(["uci", "isready"]);

    workers[0]?.emitMessage("readyok");
    await flushMicrotasks();

    expect(workers[0]?.messages).toEqual(["uci", "isready", "position fen fen-one", "go depth 12"]);

    workers[0]?.emitMessage("info depth 12 score cp 23 pv e2e4 e7e5 nodes 10 nps 20");
    workers[0]?.emitMessage("bestmove e2e4");

    const firstResult = await first;
    await flushMicrotasks();

    expect(workers[0]?.messages).toEqual([
      "uci",
      "isready",
      "position fen fen-one",
      "go depth 12",
      "position fen fen-two",
      "go depth 14",
    ]);

    workers[0]?.emitMessage("info depth 14 score cp 31 pv d2d4 d7d5 nodes 11 nps 21");
    workers[0]?.emitMessage("bestmove d2d4");

    const secondResult = await second;

    expect(firstResult).toMatchObject({
      fen: "fen-one",
      bestMove: "e2e4",
      score: { kind: "cp", cp: 23 },
    });
    expect(secondResult).toMatchObject({
      fen: "fen-two",
      bestMove: "d2d4",
      score: { kind: "cp", cp: 31 },
    });
    expect(firstResult.requestId).not.toBe(secondResult.requestId);
  });

  it("parses cp and mate scores", async () => {
    const { workers, createWorker } = createMockFactory();
    const evaluator = createStockfishEvaluator({ createWorker, requestTimeoutMs: 1000 });
    const resultPromise = evaluator.evaluatePosition({ fen: "fen-mate", depth: 18 });

    workers[0]?.emitMessage("readyok");
    await flushMicrotasks();

    workers[0]?.emitMessage("info depth 18 score mate -3 pv e7e8q nodes 5 nps 6");
    workers[0]?.emitMessage("bestmove e7e8q");

    await expect(resultPromise).resolves.toMatchObject({
      fen: "fen-mate",
      depth: 18,
      bestMove: "e7e8q",
      score: { kind: "mate", mate: -3 },
      pv: ["e7e8q"],
      nodes: 5,
      nps: 6,
    });
  });

  it("times out a request and recovers for later evaluations", async () => {
    vi.useFakeTimers();

    const { workers, createWorker } = createMockFactory();
    const evaluator = createStockfishEvaluator({ createWorker, requestTimeoutMs: 25 });
    const timedOut = evaluator.evaluatePosition({ fen: "fen-timeout", depth: 10 });
    const timedOutHandled = timedOut.catch((error) => error);

    workers[0]?.emitMessage("readyok");
    await flushMicrotasks();

    await vi.advanceTimersByTimeAsync(26);

    await expect(timedOutHandled).resolves.toBeInstanceOf(Error);
    await expect(timedOut).rejects.toThrow(/timed out/i);
    expect(workers[0]?.terminated).toBe(true);

    const recovery = evaluator.evaluatePosition({ fen: "fen-recovery", depth: 10 });
    expect(workers).toHaveLength(2);

    workers[1]?.emitMessage("readyok");
    await flushMicrotasks();

    workers[1]?.emitMessage("info depth 10 score cp 9 pv g1f3 nodes 7 nps 8");
    workers[1]?.emitMessage("bestmove g1f3");

    await expect(recovery).resolves.toMatchObject({
      fen: "fen-recovery",
      bestMove: "g1f3",
      score: { kind: "cp", cp: 9 },
    });
  });

  it("rejects worker errors and recovers on the next request", async () => {
    const { workers, createWorker } = createMockFactory();
    const evaluator = createStockfishEvaluator({ createWorker, requestTimeoutMs: 1000 });
    const failing = evaluator.evaluatePosition({ fen: "fen-error", depth: 9 });

    workers[0]?.emitMessage("readyok");
    await flushMicrotasks();

    workers[0]?.emitError("worker boom");

    await expect(failing).rejects.toThrow(/worker boom/i);
    expect(workers[0]?.terminated).toBe(true);

    const recovery = evaluator.evaluatePosition({ fen: "fen-error-recovery", depth: 9 });
    expect(workers).toHaveLength(2);

    workers[1]?.emitMessage("readyok");
    await flushMicrotasks();

    workers[1]?.emitMessage("info depth 9 score cp 5 pv d2d4 nodes 4 nps 5");
    workers[1]?.emitMessage("bestmove d2d4");

    await expect(recovery).resolves.toMatchObject({
      fen: "fen-error-recovery",
      bestMove: "d2d4",
      score: { kind: "cp", cp: 5 },
    });
  });

  it("returns cached results for the same key and misses on depth changes", async () => {
    const { workers, createWorker } = createMockFactory();
    const evaluator = createStockfishEvaluator({ createWorker, requestTimeoutMs: 1000 });

    const first = evaluator.evaluatePosition({ fen: "fen-cache", depth: 12 });
    workers[0]?.emitMessage("readyok");
    await flushMicrotasks();
    workers[0]?.emitMessage("info depth 12 score cp 15 pv e2e4 nodes 1 nps 2");
    workers[0]?.emitMessage("bestmove e2e4");

    const firstResult = await first;
    const messagesAfterFirst = [...(workers[0]?.messages ?? [])];

    const cached = await evaluator.evaluatePosition({ fen: "fen-cache", depth: 12 });
    expect(cached).toEqual(firstResult);
    expect(workers[0]?.messages).toEqual(messagesAfterFirst);

    const miss = evaluator.evaluatePosition({ fen: "fen-cache", depth: 13 });
    await flushMicrotasks();

    expect(workers[0]?.messages).toEqual([...messagesAfterFirst, "position fen fen-cache", "go depth 13"]);

    workers[0]?.emitMessage("info depth 13 score cp 18 pv d2d4 nodes 3 nps 4");
    workers[0]?.emitMessage("bestmove d2d4");

    await expect(miss).resolves.toMatchObject({
      bestMove: "d2d4",
      score: { kind: "cp", cp: 18 },
    });
  });
});
