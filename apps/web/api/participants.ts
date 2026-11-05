import type { Participant } from "@sb/types";

// 예시 데이터: 나중에 DB(Neon, Upstash 등)로 교체
const participants: Participant[] = [
  { id: "1", name: "김성북", team: "10sion Up", role: "Frontend", interests: ["React", "UX"] },
  { id: "2", name: "이스타트", team: "10sion Up", role: "Backend", interests: ["API", "DB"] },
  { id: "3", name: "박네트", team: "SB Lab", role: "PM", interests: ["Networking", "Startup"] },
];

// GET /api/participants
export function GET(): Response {
  return Response.json(participants);
}
