// 프론트(apps/web/src)와 백엔드(apps/web/api)가 함께 쓰는 타입

export interface Participant {
  id: string;
  name: string;
  team: string;
  role: string;
  interests: string[];
}

export interface HealthResponse {
  ok: boolean;
  time: string;
}
