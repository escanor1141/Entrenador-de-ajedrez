import type { OpeningVariantCommentRecord } from "@/types/comments";

export const VARIANT_NOTE_KEY = "__variant__";

export type CommentSyncStatus = "idle" | "loading" | "saving" | "synced" | "error";

export interface ManagedCommentState {
  value: string;
  serverValue: string;
  syncStatus: CommentSyncStatus;
  error: string | null;
}

export interface ManagedVariantCommentState {
  variantNote: ManagedCommentState;
  moveComments: Record<string, ManagedCommentState>;
  backendStatus: Exclude<CommentSyncStatus, "saving">;
  backendError: string | null;
}

interface CommentApiInput {
  username: string;
  eco: string;
  variantId: string;
}

interface ErrorResponse {
  error?: string;
}

function createErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isManagedCommentState(value: unknown): value is ManagedCommentState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.value === "string" &&
    typeof value.serverValue === "string" &&
    (value.syncStatus === "idle" ||
      value.syncStatus === "loading" ||
      value.syncStatus === "saving" ||
      value.syncStatus === "synced" ||
      value.syncStatus === "error") &&
    (typeof value.error === "string" || value.error === null || value.error === undefined)
  );
}

export function createSyncedCommentState(value: string): ManagedCommentState {
  return {
    value,
    serverValue: value,
    syncStatus: "synced",
    error: null,
  };
}

export function normalizeCommentState(value: unknown): ManagedCommentState {
  if (typeof value === "string") {
    return createSyncedCommentState(value);
  }

  if (isManagedCommentState(value)) {
    return {
      value: value.value,
      serverValue: value.serverValue,
      syncStatus: value.syncStatus,
      error: value.error ?? null,
    };
  }

  return createSyncedCommentState("");
}

export function normalizeVariantCommentState(value: unknown): ManagedVariantCommentState {
  const variantNote = isRecord(value) ? normalizeCommentState(value.variantNote) : createSyncedCommentState("");
  const moveComments: Record<string, ManagedCommentState> = {};

  if (isRecord(value) && isRecord(value.moveComments)) {
    for (const [moveKey, moveComment] of Object.entries(value.moveComments)) {
      moveComments[moveKey] = normalizeCommentState(moveComment);
    }
  }

  return {
    variantNote,
    moveComments,
    backendStatus: isRecord(value) && (value.backendStatus === "loading" || value.backendStatus === "synced" || value.backendStatus === "error")
      ? value.backendStatus
      : "idle",
    backendError: isRecord(value) && typeof value.backendError === "string" ? value.backendError : null,
  };
}

function isDirty(comment: ManagedCommentState): boolean {
  return comment.value !== comment.serverValue;
}

function mergeComment(current: ManagedCommentState | undefined, incoming: string): ManagedCommentState {
  if (current && isDirty(current)) {
    return current;
  }

  return createSyncedCommentState(incoming);
}

export function mergeVariantCommentsFromServer(
  current: ManagedVariantCommentState | undefined,
  comments: OpeningVariantCommentRecord[]
): ManagedVariantCommentState {
  const base = current ?? normalizeVariantCommentState(undefined);
  const nextMoveComments: Record<string, ManagedCommentState> = {};

  if (current) {
    for (const [moveKey, comment] of Object.entries(current.moveComments)) {
      if (isDirty(comment)) {
        nextMoveComments[moveKey] = comment;
      }
    }
  }

  let nextVariantNote = base.variantNote;

  for (const comment of comments) {
    if (comment.moveKey === VARIANT_NOTE_KEY) {
      nextVariantNote = mergeComment(current?.variantNote, comment.comment);
      continue;
    }

    nextMoveComments[comment.moveKey] = mergeComment(current?.moveComments[comment.moveKey], comment.comment);
  }

  if (!comments.some((comment) => comment.moveKey === VARIANT_NOTE_KEY) && current && !isDirty(current.variantNote)) {
    nextVariantNote = createSyncedCommentState("");
  }

  return {
    variantNote: nextVariantNote,
    moveComments: nextMoveComments,
    backendStatus: "synced",
    backendError: null,
  };
}

function buildCommentsEndpoint({ username, eco, variantId }: CommentApiInput): string {
  return `/api/openings/${encodeURIComponent(username)}/${encodeURIComponent(eco)}/variants/${encodeURIComponent(
    variantId
  )}/comments`;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorResponse;
    return createErrorMessage(payload.error, fallback);
  } catch {
    return fallback;
  }
}

async function parseJsonResponse<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallback));
  }

  return (await response.json()) as T;
}

export async function fetchOpeningVariantComments(input: CommentApiInput) {
  const response = await fetch(buildCommentsEndpoint(input), {
    method: "GET",
    cache: "no-store",
  });

  const payload = await parseJsonResponse<{ comments?: OpeningVariantCommentRecord[] }>(
    response,
    "Failed to fetch variant comments"
  );

  return payload.comments ?? [];
}

export async function saveOpeningVariantComment(
  input: CommentApiInput & { moveKey: string; comment: string }
): Promise<OpeningVariantCommentRecord> {
  const response = await fetch(buildCommentsEndpoint(input), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ moveKey: input.moveKey, comment: input.comment }),
  });

  const payload = await parseJsonResponse<{ comment?: OpeningVariantCommentRecord }>(
    response,
    "Failed to save variant comment"
  );

  if (!payload.comment) {
    throw new Error("Failed to save variant comment");
  }

  return payload.comment;
}

export async function deleteOpeningVariantComment(
  input: CommentApiInput & { moveKey: string }
): Promise<void> {
  const endpoint = new URL(buildCommentsEndpoint(input), "http://localhost");
  endpoint.searchParams.set("moveKey", input.moveKey);

  const response = await fetch(endpoint.pathname + endpoint.search, {
    method: "DELETE",
  });

  if (response.status === 404) {
    return;
  }

  await parseJsonResponse<{ deleted?: boolean }>(response, "Failed to delete variant comment");
}
