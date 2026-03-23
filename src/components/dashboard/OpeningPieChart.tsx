"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { OpeningData } from "@/types";
import { sortOpeningsByGamesDesc } from "@/lib/openings";

interface OpeningPieChartProps {
  openings: OpeningData[];
}

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

export function OpeningPieChart({ openings }: OpeningPieChartProps) {
  if (openings.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No opening data available
      </div>
    );
  }

  const data = sortOpeningsByGamesDesc(openings)
    .slice(0, 5)
    .map((opening) => ({
      name: opening.eco
        ? `${opening.eco} ${opening.name}`
        : opening.name,
      value: opening.games,
      eco: opening.eco,
      name2: opening.name,
    }));

  const totalGames = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1A1F",
              border: "1px solid #2E2E35",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#F5F5F7" }}
            formatter={(value: number, name: string, props: any) => [
              `${value} games (${((value / totalGames) * 100).toFixed(1)}%)`,
              props.payload.name2 || props.payload.name,
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry: any) => (
              <span className="text-sm text-muted-foreground">
                {entry.payload.eco} {entry.payload.name2}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
