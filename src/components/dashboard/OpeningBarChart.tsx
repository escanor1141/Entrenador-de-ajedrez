"use client";

import { Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { OpeningData } from "@/types";
import { sortOpeningsByGamesDesc } from "@/lib/openings";

interface OpeningBarChartProps {
  openings: OpeningData[];
}

export function OpeningBarChart({ openings }: OpeningBarChartProps) {
  if (openings.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No opening data available
      </div>
    );
  }

  const data = sortOpeningsByGamesDesc(openings)
    .slice(0, 10)
    .map((opening) => ({
      name: opening.eco || opening.name,
      fullName: `${opening.eco} ${opening.name}`,
      winrate: (opening.wins / opening.games) * 100,
      games: opening.games,
    }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6B7280"
            fontSize={12}
            width={80}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1A1F",
              border: "1px solid #2E2E35",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#F5F5F7" }}
          />
          <Bar
            dataKey="winrate"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.winrate >= 55
                    ? "#10B981"
                    : entry.winrate >= 45
                    ? "#F59E0B"
                    : "#EF4444"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
