/**
 * 에피소드 데이터와 타입.
 * 화면 문구는 Figma "최종" 섹션(홈 136:2362, 에피소드 상세 136:2411, 스토리 136:2455) 기준.
 * 장소별 역사 이야기는 3단계에서 채움. 문제·단서는 4단계에서 채운다.
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

/**
 * 탐험 지도 위 장소 핀. Figma 프레임 8(136:2839)의 Component 11/13/15/17 값.
 * x, y는 지도 이미지(390 × 677) 기준 %, 나머지는 핀 안쪽 px.
 */
export type MapPin = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 사진 뒤 크림색 원 [w, h] */
  ring: [number, number];
  /** 원형 사진 [left, top, w, h] */
  photo: [number, number, number, number];
  /** 이름표 [left, top, w, h] */
  label: [number, number, number, number];
  /** 이름 글자 [left, top, w], 글자 크기 */
  text: [number, number, number];
  fontSize: number;
};

export type Place = {
  id: string;
  /** 지도/인증 화면 이름 */
  name: string;
  /** 지도 핀 이름 (줄바꿈은 \n) */
  pinLabel: string;
  address: string;
  /** 도착 인증용 좌표 */
  lat: number;
  lng: number;
  /** 도착으로 인정하는 반경(m) */
  radius: number;
  /** 인증 · 역사 화면 위쪽 사진 (354 × 194) */
  photo: string;
  /** 지도 핀 원형 사진 */
  pinPhoto: string;
  pin: MapPin;
  /** "첫번째", "두번째" … (버튼 "첫번째 단서 찾기") */
  ordinal: string;
  story: {
    /** 줄바꿈은 \n */
    title: string;
    body: string;
    /** 마스코트 말풍선 */
    tip: string;
  };
  quiz?: Quiz;
  clue?: Clue;
};

/** 위치 인증 통과 거리(m) */
export const ARRIVAL_RADIUS = 150;

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
    // 순서: 성북동 A 인문산책 코스 (https://www.sb.go.kr/tour/contents.do?key=6582)
    // TODO: lat/lng는 대략값. 카카오맵/네이버지도에서 확인해서 고칠 것 (시연은 ?demo=1로 위치 확인 생략)
    places: [
      {
        id: "gilsangsa",
        name: "길상사",
        pinLabel: "길상사",
        address: "서울 성북구 선잠로5길 68", // Figma 시안은 "성북로 131"
        lat: 37.5992,
        lng: 126.9944,
        radius: ARRIVAL_RADIUS,
        photo: "place-gilsangsa.jpg",
        pinPhoto: "pin-gilsangsa.png",
        pin: { x: 29.74, y: 74.89, w: 147, h: 71, ring: [75, 71], photo: [1, 0, 69, 71], label: [61, 11, 86, 28], text: [88, 17, 0], fontSize: 15 },
        ordinal: "첫번째",
        story: {
          title: "대원각에서 길상사로,\n나눔의 마음이 깃든 절",
          body:
            "1960년대부터 1980년대 말까지 이곳은 삼청각, 청운각과 함께 최고급 요정으로 손꼽히던 대원각이었어요. " +
            "대원각의 주인이던 김영한 여사가 7천여 평의 대지와 건물 40여 동을 법정 스님에게 시주하면서 " +
            "지금의 길상사가 되었답니다.\n\n" +
            "현재는 불교체험, 템플스테이 등 다양한 행사가 열리는 도심 속 문화공간이에요.",
          tip: "가진 것을 모두 내어준 마음, 편지와도 관련이 있을까요?",
        },
      },
      {
        id: "martyrs",
        name: "한국순교복자성직수도회 구 본원",
        pinLabel: "한국순교복자성직\n수도회 구 본원",
        address: "서울 성북구 성북동", // TODO: 정확한 주소 확인
        lat: 37.5946,
        lng: 126.9958,
        radius: ARRIVAL_RADIUS,
        photo: "place-martyrs.jpg",
        pinPhoto: "pin-martyrs.png",
        pin: { x: 10.51, y: 53.18, w: 194, h: 67, ring: [70, 67], photo: [2, 2, 65, 65], label: [73, 9, 121, 37], text: [87, 12, 93], fontSize: 13 },
        ordinal: "두번째",
        story: {
          title: "한국 최초의 내국인\n남자 수도회 본원",
          body:
            "1953년에 세워진 한국 가톨릭 최초의 내국인 남자 수도회, 한국순교복자성직수도회의 본원이었어요. " +
            "방유룡 신부가 직접 설계했고, 라틴십자가 모양 평면에 타원형 후진과 돔을 갖춘 건물이에요.\n\n" +
            "2015년 국가등록문화재 제655호로 지정되었답니다.",
          tip: "건물의 모양을 잘 살펴보세요. 단서가 숨어 있을지도 몰라요!",
        },
      },
      {
        id: "suyeonsanbang",
        name: "이태준가옥(수연산방)",
        pinLabel: "이태준 가옥\n(수연산방)",
        address: "서울 성북구 성북동", // TODO: 정확한 주소 확인
        lat: 37.5951,
        lng: 126.9968,
        radius: ARRIVAL_RADIUS,
        photo: "place-suyeonsanbang.jpg",
        pinPhoto: "pin-suyeonsanbang.png",
        pin: { x: 38.46, y: 33.38, w: 160, h: 67, ring: [70, 67], photo: [3, 3, 63, 61], label: [77, 15, 83, 37], text: [85, 16, 64], fontSize: 13 },
        ordinal: "세번째",
        story: {
          title: "문장가 이태준의 집,\n수연산방",
          body:
            "「문장강화」, 「무서록」을 쓴 소설가 상허 이태준이 살던 고택이에요. " +
            "지금은 그의 손녀가 전통찻집 ‘수연산방’으로 운영하고 있어요.\n\n" +
            "사랑방 문에는 한지 대신 유리를 끼워, 방 안에서도 북악산 자락이 보인답니다.",
          tip: "문장가의 집이라니, 편지를 쓴 사람과 관련이 있을까요?",
        },
      },
      {
        id: "simujang",
        name: "심우장",
        pinLabel: "심우장",
        address: "서울 성북구 성북동", // TODO: 정확한 주소 확인
        lat: 37.5973,
        lng: 127.0013,
        radius: ARRIVAL_RADIUS,
        photo: "place-simujang.jpg",
        pinPhoto: "pin-simujang.png",
        pin: { x: 37.69, y: 16.4, w: 134, h: 67, ring: [70, 67], photo: [3, 3, 63, 62.07], label: [80, 14, 54, 25], text: [86, 21, 41], fontSize: 15 },
        ordinal: "네번째",
        story: {
          title: "만해 한용운이\n마지막까지 머문 집",
          body:
            "「님의 침묵」을 쓴 시인이자 민족대표 33인 중 한 명인 만해 한용운이 " +
            "1933년부터 1944년 6월 세상을 떠날 때까지 살았던 집이에요.\n\n" +
            "마당에는 만해가 직접 심은 향나무가 지금도 자라고 있어요.",
          tip: "마지막 단서예요. 지금까지 모은 단서를 떠올려 보세요!",
        },
      },
    ],
  },
];

export function getEpisode(id: string | undefined): Episode | undefined {
  return EPISODES.find((e) => e.id === id);
}

/** 장소 id로 장소와 그 에피소드를 찾는다. */
export function findPlace(placeId: string | undefined): { episode: Episode; place: Place; index: number } | undefined {
  for (const episode of EPISODES) {
    const index = episode.places.findIndex((p) => p.id === placeId);
    if (index >= 0) return { episode, place: episode.places[index], index };
  }
  return undefined;
}
