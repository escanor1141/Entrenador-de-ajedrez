import { GameFilters } from "@/types";

export type DashboardTimeFilter = "all" | NonNullable<GameFilters["perfType"]>;
export type DashboardColorFilter = "all" | NonNullable<GameFilters["color"]>;

export interface DashboardFilterState {
  time: DashboardTimeFilter;
  color: DashboardColorFilter;
}

const TIME_FILTERS: NonNullable<GameFilters["perfType"]>[] = [
  "bullet",
  "blitz",
  "rapid",
  "classical",
];

const COLOR_FILTERS: NonNullable<GameFilters["color"]>[] = ["white", "black"];

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function isTimeFilter(value: string | null): value is NonNullable<GameFilters["perfType"]> {
  return !!value && TIME_FILTERS.includes(value as NonNullable<GameFilters["perfType"]>);
}

function isColorFilter(value: string | null): value is NonNullable<GameFilters["color"]> {
  return !!value && COLOR_FILTERS.includes(value as NonNullable<GameFilters["color"]>);
}

export function dashboardStateToFilters(state: DashboardFilterState): GameFilters {
  return {
    perfType: state.time === "all" ? undefined : state.time,
    color: state.color === "all" ? undefined : state.color,
  };
}

export function parseGameFilters(
  searchParams: URLSearchParams,
  defaults: { max?: number } = {}
): GameFilters {
  const perfType = searchParams.get("perfType");
  const time = searchParams.get("time");
  const color = searchParams.get("color");
  const max = parseNumber(searchParams.get("max")) ?? defaults.max;
  const since = parseNumber(searchParams.get("since"));
  const until = parseNumber(searchParams.get("until"));
  const rated = parseBoolean(searchParams.get("rated"));
  const selectedPerfType = isTimeFilter(perfType) ? perfType : isTimeFilter(time) ? time : undefined;

  return {
    ...(max !== undefined ? { max } : {}),
    ...(since !== undefined ? { since } : {}),
    ...(until !== undefined ? { until } : {}),
    ...(rated !== undefined ? { rated } : {}),
    ...(selectedPerfType ? { perfType: selectedPerfType } : {}),
    ...(isColorFilter(color) ? { color } : {}),
  };
}

export function buildGameFiltersQuery(filters: GameFilters): string {
  const params = new URLSearchParams();

  if (filters.max !== undefined) params.set("max", filters.max.toString());
  if (filters.since !== undefined) params.set("since", filters.since.toString());
  if (filters.until !== undefined) params.set("until", filters.until.toString());
  if (filters.rated !== undefined) params.set("rated", filters.rated.toString());
  if (filters.perfType) params.set("perfType", filters.perfType);
  if (filters.color) params.set("color", filters.color);

  return params.toString();
}
