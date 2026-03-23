"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoveNode } from "@/types";

interface MoveTreeProps {
  tree: MoveNode[];
  selectedFen: string;
  onMoveClick: (node: MoveNode) => void;
}

function TreeNode({
  node,
  depth,
  selectedFen,
  onMoveClick,
}: {
  node: MoveNode;
  depth: number;
  selectedFen: string;
  onMoveClick: (node: MoveNode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = selectedFen === node.fen;
  const winrate = node.games > 0 ? (node.wins / node.games) * 100 : 0;
  const drawrate = node.games > 0 ? (node.draws / node.games) * 100 : 0;
  const lossrate = node.games > 0 ? (node.losses / node.games) * 100 : 0;

  return (
    <div className="text-sm">
      <div
        className={cn(
          "flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors",
          isActive
            ? "bg-accent-blue/20 text-accent-blue"
            : "hover:bg-background-secondary"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onMoveClick(node)}
      >
        {node.children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-background-tertiary rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        <span className="font-mono text-muted-foreground">
          {Math.floor((node.ply + 1) / 2)}.
        </span>
        <span className="font-medium">{node.san}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-xs">
          <div className="flex w-20 h-3 rounded overflow-hidden">
            <div
              className="h-full bg-accent-green"
              style={{ width: `${winrate}%` }}
            />
            <div
              className="h-full bg-accent-yellow"
              style={{ width: `${drawrate}%` }}
            />
            <div
              className="h-full bg-accent-red"
              style={{ width: `${lossrate}%` }}
            />
          </div>
          <span className="text-muted-foreground w-12 text-right">
            {node.games}g
          </span>
        </div>
      </div>
      {isExpanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.pathKey}
            node={child}
            depth={depth + 1}
            selectedFen={selectedFen}
            onMoveClick={onMoveClick}
          />
        ))}
    </div>
  );
}

export function MoveTree({ tree, selectedFen, onMoveClick }: MoveTreeProps) {
  return (
    <div className="bg-background-secondary rounded-lg p-4 overflow-auto max-h-[400px] scrollbar-thin">
      {tree.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No moves recorded yet
        </div>
      ) : (
        tree.map((node) => (
          <TreeNode
            key={node.pathKey}
            node={node}
            depth={0}
            selectedFen={selectedFen}
            onMoveClick={onMoveClick}
          />
        ))
      )}
    </div>
  );
}
