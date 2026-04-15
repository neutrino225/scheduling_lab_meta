import { NextResponse } from "next/server";

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Standardized API error response
 */
export function apiError(
  code: string,
  message: string,
  statusCode = 400,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      code,
      message,
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Standardized API success response
 */
export function apiSuccess<T>(
  data: T,
  statusCode = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}

/**
 * Common API error codes and HTTP status mappings
 */
export const API_ERRORS = {
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", status: 400 },
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  CONFLICT: { code: "CONFLICT", status: 409 },
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", status: 500 },
  BAD_REQUEST: { code: "BAD_REQUEST", status: 400 },
} as const;
