import { NextResponse } from "next/server";
import {
  buildOpeningVariantCommentIdentity,
  deleteOpeningVariantComment,
  listOpeningVariantComments,
  parseOpeningVariantCommentInput,
  upsertOpeningVariantComment,
} from "@/lib/study-comments";

function decodeParam(value: string) {
  return decodeURIComponent(value);
}

function readMoveKey(searchParams: URLSearchParams) {
  return searchParams.get("moveKey") ?? undefined;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string; eco: string; variantId: string }> }
) {
  try {
    const { username, eco, variantId } = await params;
    const identity = buildOpeningVariantCommentIdentity(
      decodeParam(username),
      decodeParam(eco),
      decodeParam(variantId)
    );

    const comments = await listOpeningVariantComments(identity);

    return NextResponse.json({
      username: identity.username,
      eco: identity.eco,
      variantId: identity.variantId,
      comments,
    });
  } catch (error) {
    console.error("Error fetching variant comments:", error);
    return NextResponse.json({ error: "Failed to fetch variant comments" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string; eco: string; variantId: string }> }
) {
  try {
    const { username, eco, variantId } = await params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseOpeningVariantCommentInput(body, {
      username: decodeParam(username),
      eco: decodeParam(eco),
      variantId: decodeParam(variantId),
      moveKey: "",
    });

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const comment = await upsertOpeningVariantComment(parsed.data);

    return NextResponse.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string; eco: string; variantId: string }> }
) {
  try {
    const { username, eco, variantId } = await params;
    const { searchParams } = new URL(request.url);
    const moveKey = readMoveKey(searchParams);

    if (!moveKey) {
      return NextResponse.json({ error: "moveKey is required" }, { status: 400 });
    }

    const deleted = await deleteOpeningVariantComment({
      username: decodeParam(username),
      eco: decodeParam(eco),
      variantId: decodeParam(variantId),
      moveKey: decodeParam(moveKey),
    });

    if (!deleted) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
