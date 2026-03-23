import type { Annotation } from "./training";

export interface OpeningVariantCommentIdentity {
  username: string;
  eco: string;
  variantId: string;
  moveKey: string;
}

export interface OpeningVariantCommentInput extends OpeningVariantCommentIdentity {
  comment: string;
  annotation?: Annotation | null;
}

export interface OpeningVariantCommentRecord extends OpeningVariantCommentInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningVariantCommentListResponse {
  username: string;
  eco: string;
  variantId: string;
  comments: OpeningVariantCommentRecord[];
}

export interface OpeningVariantCommentUpsertResponse {
  comment: OpeningVariantCommentRecord;
}
