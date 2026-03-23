export interface StockfishMessage {
  type: "info" | "bestmove" | "ready";
  data?: string;
  bestMove?: string;
  evaluation?: number;
  depth?: number;
  pv?: string;
  nodes?: number;
  nps?: number;
}

export interface StockfishState {
  ready: boolean;
  evaluating: boolean;
  evaluation: number | null;
  bestMove: string | null;
  depth: number;
  pv: string[];
  nodes: number;
  nps: number;
}

const STOCKFISH_WORKER_URL = "https://unpkg.com/stockfish.js@10.0.2/stockfish.js";

let stockfishWorker: Worker | null = null;
let messageHandlers: ((msg: StockfishMessage) => void)[] = [];

function handleMessage(event: MessageEvent) {
  const lines = event.data.split("\n");
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    if (line === "uciok" || line === "readyok") {
      messageHandlers.forEach((handler) => handler({ type: "ready" }));
      continue;
    }
    
    if (line.startsWith("info depth")) {
      const match = line.match(/score cp (-?\d+)/);
      if (match) {
        const evaluation = parseInt(match[1], 10) / 100;
        const depthMatch = line.match(/depth (\d+)/);
        const pvMatch = line.match(/pv (.+)$/);
        const nodesMatch = line.match(/nodes (\d+)/);
        const npsMatch = line.match(/nps (\d+)/);
        
        messageHandlers.forEach((handler) =>
          handler({
            type: "info",
            data: line,
            evaluation,
            depth: depthMatch ? parseInt(depthMatch[1], 10) : undefined,
            pv: pvMatch ? pvMatch[1].split(" ") : undefined,
            nodes: nodesMatch ? parseInt(nodesMatch[1], 10) : undefined,
            nps: npsMatch ? parseInt(npsMatch[1], 10) : undefined,
          })
        );
      }
      continue;
    }
    
    if (line.startsWith("bestmove")) {
      const parts = line.split(" ");
      const bestMove = parts[1];
      messageHandlers.forEach((handler) =>
        handler({
          type: "bestmove",
          data: line,
          bestMove,
        })
      );
    }
  }
}

export async function initStockfish(): Promise<void> {
  if (stockfishWorker) return;
  
  return new Promise((resolve, reject) => {
    try {
      stockfishWorker = new Worker(STOCKFISH_WORKER_URL);
      stockfishWorker.addEventListener("message", handleMessage);
      stockfishWorker.addEventListener("error", reject);
      
      stockfishWorker.postMessage("uci");
      stockfishWorker.postMessage("isready");
      
      const timeout = setTimeout(() => {
        resolve();
      }, 2000);
      
      messageHandlers.push((msg) => {
        if (msg.type === "ready") {
          clearTimeout(timeout);
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function onStockfishMessage(handler: (msg: StockfishMessage) => void) {
  messageHandlers.push(handler);
  return () => {
    messageHandlers = messageHandlers.filter((h) => h !== handler);
  };
}

export function evaluatePosition(fen: string, depth: number = 20): void {
  if (!stockfishWorker) {
    console.error("Stockfish not initialized");
    return;
  }
  
  stockfishWorker.postMessage(`position fen ${fen}`);
  stockfishWorker.postMessage(`go depth ${depth}`);
}

export function stopEvaluation(): void {
  if (stockfishWorker) {
    stockfishWorker.postMessage("stop");
  }
}

export function terminateStockfish(): void {
  if (stockfishWorker) {
    stockfishWorker.terminate();
    stockfishWorker = null;
  }
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
