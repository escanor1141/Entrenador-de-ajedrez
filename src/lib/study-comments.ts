import type { OpeningVariantComment as PrismaOpeningVariantComment } from "@prisma/client";
import type { Annotation } from "@/types/training";
import type {
  OpeningVariantCommentIdentity,
  OpeningVariantCommentRecord,
} from "@/types/comments";
import { prisma } from "@/lib/prisma";

export interface ParsedOpeningVariantCommentInput {
  identity: OpeningVariantCommentIdentity;
  comment: string;
  annotation?: Annotation | null;
}

export type ParseResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      status: 400;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeAnnotation(value: unknown): Annotation | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (
    value === "!" ||
    value === "!!" ||
    value === "?" ||
    value === "??" ||
    value === "!?" ||
    value === "?!"
  ) {
    return value;
  }

  return null;
}

export function parseOpeningVariantCommentInput(
  payload: unknown,
  identity: OpeningVariantCommentIdentity
): ParseResult<ParsedOpeningVariantCommentInput> {
  if (!isRecord(payload)) {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }

  const comment = normalizeText(payload.comment);
  if (!comment) {
    return { ok: false, status: 400, error: "Comment is required" };
  }

  const moveKey = normalizeText(payload.moveKey);
  if (!moveKey) {
    return { ok: false, status: 400, error: "moveKey is required" };
  }

  const annotation = normalizeAnnotation(payload.annotation);

  return {
    ok: true,
    data: {
      identity: {
        username: identity.username,
        eco: identity.eco,
        variantId: identity.variantId,
        moveKey,
      },
      comment,
      annotation,
    },
  };
}

function mapComment(record: PrismaOpeningVariantComment): OpeningVariantCommentRecord {
  return {
    id: record.id,
    username: record.username,
    eco: record.eco,
    variantId: record.variantId,
    moveKey: record.moveKey,
    comment: record.comment,
    annotation: (record.annotation as Annotation | null) ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listOpeningVariantComments(identity: OpeningVariantCommentIdentity) {
  const comments = await prisma.openingVariantComment.findMany({
    where: {
      username: identity.username,
      eco: identity.eco,
      variantId: identity.variantId,
    },
    orderBy: { createdAt: "asc" },
  });

  return comments.map(mapComment);
}

export async function upsertOpeningVariantComment(
  input: ParsedOpeningVariantCommentInput
): Promise<OpeningVariantCommentRecord> {
  const record = await prisma.openingVariantComment.upsert({
    where: {
      username_eco_variantId_moveKey: {
        username: input.identity.username,
        eco: input.identity.eco,
        variantId: input.identity.variantId,
        moveKey: input.identity.moveKey,
      },
    },
    create: {
      username: input.identity.username,
      eco: input.identity.eco,
      variantId: input.identity.variantId,
      moveKey: input.identity.moveKey,
      comment: input.comment,
      annotation: input.annotation,
    },
    update: {
      comment: input.comment,
      annotation: input.annotation,
    },
  });

  return mapComment(record);
}

export async function deleteOpeningVariantComment(
  identity: OpeningVariantCommentIdentity
): Promise<boolean> {
  const result = await prisma.openingVariantComment.deleteMany({
    where: {
      username: identity.username,
      eco: identity.eco,
      variantId: identity.variantId,
      moveKey: identity.moveKey,
    },
  });

  return result.count > 0;
}

export function buildOpeningVariantCommentIdentity(
  username: string,
  eco: string,
  variantId: string,
  moveKey?: string
): OpeningVariantCommentIdentity {
  return {
    username,
    eco,
    variantId,
    moveKey: moveKey ?? "",
  };
}
