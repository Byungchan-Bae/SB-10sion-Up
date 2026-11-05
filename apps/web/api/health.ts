import type { HealthResponse } from "@sb/types";

// GET /api/health
export function GET(): Response {
  const body: HealthResponse = { ok: true, time: new Date().toISOString() };
  return Response.json(body);
}
