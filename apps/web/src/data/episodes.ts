/**
 * 에피소드 데이터와 타입.
 * 화면 문구는 Figma "최종" 섹션(홈 136:2362, 에피소드 상세 136:2411, 스토리 136:2455) 기준.
 * 장소별 문제·단서 내용은 3, 4단계에서 채운다.
 */

export type Quiz = {
  id: string;
  question: string;
  /** 정답 (공백 무시, 대소문자 무시로 비교) */
  answer: string;
  hint?: string;
};

export type Clue = {
  id: string;
  title: string;
  description: string;
  /** public/assets/ 아래 이미지 파일 이름 */
  image?: string;
};

export type Place = {
  id: string;
  name: string;
  /** 도착 인증용 좌표 */
  lat: number;
  lng: number;
  /** 도착으로 인정하는 반경(m) */
  radius: number;
  story: string;
  quiz?: Quiz;
  clue?: Clue;
};

export type Episode = {
  id: string;
  /** "EP.01" */
  badge: string;
  title: string;
  /** 홈 카드 말풍선 (줄바꿈은 \n) */
  teaser: string;
  /** 홈 카드 이미지 (public/assets/) */
  cardImage: string;
  /** 상세 화면 위쪽 사진 */
  photo: string;
  /** 상세 화면 사진 위 마스코트 */
  mascots: string;
  /** 상세 화면 인용문. {{ }} 안은 주황 강조 (줄바꿈은 \n) */
  hook: string;
  /** 상세 화면 설명. {{ }} 안은 주황 강조 */
  summary: string;
  /** 시작하기 다음의 "의문의 편지" 화면 */
  intro: {
    title: string;
    lead: string;
    body: string;
    mission: string;
  };
  startPlace: string;
  distance: string;
  duration: string;
  places: Place[];
};

export const EPISODES: Episode[] = [
  {
    id: "ep01",
    badge: "EP.01",
    title: "사라진 편지",
    teaser: "1937년, 성북동에서 사라진\n한 통의 편지를 찾아서!",
    cardImage: "episode-ep01-card.png",
    photo: "episode-ep01-photo.jpg",
    mascots: "episode-ep01-mascots.png",
    hook: "1937년, 성북동에서\n한 통의 {{“ 편지 “}}가 사라졌습니다",
    summary: "편지에 담긴 진실을 찾아내기 위해\n성북동의 {{네 곳}}을 탐험하고, 흩어진 기록을 모아\n편지의 수신인을 밝혀주세요.",
    intro: {
      title: "의문의 편지",
      lead: "1937년, 성북동에서\n한 통의 편지가 사라졌습니다",
      body: "이 편지에는 성북동의 중요한 비밀이\n담겨 있다고 하는데요.\n편지에 남은 단서를 따라 성북동의 네 곳을\n탐험하고, 흩어진 기록을 모아\n편지의 수신인을 밝혀주세요.",
      mission: "성북동의 네 장소를 탐험하며\n단서를 모아 편지의 수신인을 찾아보세요!",
    },
    startPlace: "길상사",
    distance: "약 3.2km",
    duration: "1시간 30분",
    // 좌표는 대략값. 3단계에서 현장 기준으로 확정한다.
    places: [
      { id: "gilsangsa", name: "길상사", lat: 37.5996, lng: 126.9939, radius: 80, story: "" },
      { id: "simujang", name: "심우장", lat: 37.5963, lng: 127.0004, radius: 50, story: "" },
      { id: "suyeonsanbang", name: "수연산방", lat: 37.5949, lng: 126.9966, radius: 50, story: "" },
      { id: "choisunu", name: "최순우 옛집", lat: 37.5938, lng: 126.9952, radius: 50, story: "" },
    ],
  },
];

export function getEpisode(id: string | undefined): Episode | undefined {
  return EPISODES.find((e) => e.id === id);
}
