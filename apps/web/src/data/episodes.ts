/**
 * 에피소드 데이터. 타입은 packages/types(@sb/types)에 있다.
 * 화면 문구는 Figma "최종" 섹션(홈 136:2362, 에피소드 상세 136:2411, 스토리 136:2455) 기준.
 * 장소 문제 · 단서는 Figma 문제 7/8, 스토리(단서 발견) 프레임 기준 (docs/design/ASSETS.md 표).
 */

import type { Episode, Place } from "@sb/types";

/** 위치 인증 통과 거리(m) */
export const ARRIVAL_RADIUS = 150;

export const EPISODES: Episode[] = [
  {
    id: "ep01",
    badge: "EP.01",
    title: "사라진 편지",
    teaser: "1937년, 성북동에서 사라진\n한 통의 편지를 찾아서!",
    cardImage: "episode-ep01-card.webp",
    photo: "episode-ep01-photo.webp",
    mascots: "episode-ep01-mascots.webp",
    hook: "1937년, 성북동에서\n한 통의 {{“ 편지 “}}가 사라졌습니다",
    summary: "편지에 담긴 진실을 찾아내기 위해\n성북동의 {{네 곳}}을 탐험하고, 흩어진 기록을 모아\n편지의 수신인을 밝혀주세요.",
    intro: {
      title: "의문의 편지",
      lead: "1937년, 성북동에서\n한 통의 편지가 사라졌습니다",
      body: "이 편지에는 성북동의 중요한 비밀이\n담겨 있다고 하는데요.\n편지에 남은 단서를 따라 성북동의 네 곳을\n탐험하고, 흩어진 기록을 모아\n편지의 수신인을 밝혀주세요.",
      mission: "성북동의 네 장소를 탐험하며\n단서를 모아 편지의 수신인을 찾아보세요!",
    },
    // Figma 오타 "미해의", "메세지"는 고침
    secret: {
      lead: "사라진 편지의 수신인은",
      headline: "바로 {{당신}}이었습니다",
      body: "이 편지는 과거의 누군가가\n미래의 성북동을 살아갈 사람들에게\n남긴 메시지였어요.",
      closing: "성북동의 진짜 보물은\n건물에 숨겨진 것이 아니라,\n그곳에 남겨진 사람들의 이야기였습니다.",
    },
    points: 100,
    startPlace: "길상사",
    distance: "약 3.2km",
    duration: "1시간 30분",
    // 순서: 성북동 A 인문산책 코스 (https://www.sb.go.kr/tour/contents.do?key=6582)
    // 좌표 출처 (2026-11-05 확인): 길상사 · 수연산방은 OpenStreetMap, 심우장 · 수도회 구 본원은 한국어 위키백과 문화유산 좌표.
    // 시연 단계에는 위치 확인 생략 (data/stage.ts)
    places: [
      {
        id: "gilsangsa",
        name: "길상사",
        pinLabel: "길상사",
        address: "서울 성북구 선잠로5길 68", // Figma 시안은 "성북로 131"
        lat: 37.59888,
        lng: 126.99389,
        radius: ARRIVAL_RADIUS,
        photo: "place-gilsangsa.webp",
        pinPhoto: "pin-gilsangsa.webp",
        pin: { x: 29.74, y: 74.89, w: 147, h: 71, ring: [75, 71], photo: [1, 0, 69, 71], label: [40, 17, 117, 37], drawnSign: true, text: [88, 25.08, 0], fontSize: 15 },
        ordinal: "첫번째",
        // Figma 원본 136:3821 · 3848 · 3875 · 3907 문구 (오타 "요청" → "요정", 마침표 뒤 띄어쓰기, NanumHuman에 없는 한자 "故" 빼기만 고침)
        story: {
          title: "대원각에서 길상사로,\n나눔의 마음이 깃든 절",
          body:
            "1960년대부터 1980년대 말까지\n" +
            "최고급 요정이었던 대원각 자리에 세워졌어요.\n" +
            "대원각의 주인이었던 고 김영한 여사가 7천여 평의 대지와 건물 40여 동을 법정 스님에게 시주하며 길상사로 탈바꿈하게 되었답니다.\n\n" +
            "현재는 불교체험, 템플스테이 등 다양한\n" +
            "행사가 열리는 도심 속 문화공간이기도 해요.",
          tip: "화려한 요정이 수행과\n나눔의 공간이 된 이유, 정말 특별하죠?",
        },
        faq: [
          { question: "대원각은 어떤 곳이었나요?", answer: "1960년대부터 1980년대 말까지 최고급 요정이었던 곳이에요. 지금의 길상사 자리에 있었답니다!" },
          { question: "김영한 여사는 어떤 분인가요?", answer: "대원각의 주인이었던 분이에요. 7천여 평의 대지와 건물 40여 동을 법정 스님에게 시주해서, 이곳이 길상사로 탈바꿈했어요." },
          { question: "길상사에서는 어떤 활동을 하나요?", answer: "불교체험, 템플스테이 같은 다양한 행사가 열리는 도심 속 문화공간이에요." },
        ],
        quiz: {
          question: "다음 설명이 가리키는\n장소는 어디일까요?",
          options: ["성북동 성곽길", "길상사", "심우장", "수연산방"],
          hint: "조선시대 왕실과 관련된 역사 이야기가 남아 있고, 아름다운 정원과 사찰이 어우러진 성북동의 대표 명소예요.",
          hintImage: [48, 257, 289.636, 108],
          mascot: [279, 304],
          reflection: "길상사에서 느낀 분위기를\n한 줄로 기록해보세요!",
        },
        clue: { word: "마음", image: [82, 373, 222.732, 155.047], foundAt: "길상사", thumb: [105, 315, 69, 71] },
      },
      {
        id: "martyrs",
        name: "한국순교복자성직수도회 구 본원",
        pinLabel: "한국순교복자성직\n수도회 구 본원",
        // 지금 이름은 복자사랑 피정의 집. 3번지 건물 좌표는 지도에 없어서, 같은 이름의 따릉이 대여소와 성북로24길 4번지 사이로 잡음
        heroSub: "한국순교복자성직수도회",
        heroName: "구 본원",
        address: "서울 성북구 성북로24길 3",
        lat: 37.5945,
        lng: 126.99545,
        radius: ARRIVAL_RADIUS,
        photo: "place-martyrs.webp",
        pinPhoto: "pin-martyrs.webp",
        pin: { x: 10.51, y: 53.18, w: 194, h: 67, ring: [70, 67], photo: [2, 2, 65, 65], label: [40, 10, 167, 47], lockedLabel: [40, 10, 167, 47], drawnSign: true, text: [87, 15.08, 93], fontSize: 13 },
        ordinal: "두번째",
        // Figma 원본 136:3821 · 3848 · 3875 · 3907 문구 (오타 "요청" → "요정", 마침표 뒤 띄어쓰기, NanumHuman에 없는 한자 "故" 빼기만 고침)
        story: {
          title: "한국 천주교의 발자취,\n믿음이 깃든 공간",
          body:
            "1953년에 건립된 이곳은 한국 최초의 내국인 남자 수도회인 한국순교복자성직수도회의 옛 본원 건물이에요. " +
            "방유룡 신부가 직접 설계했으며, 라틴 십자가 형태의 평면과 타원형 돔 등 독특한 건축적 특징을 지니고 있어요.\n\n" +
            "이러한 역사적·건축적 가치를 인정받아\n" +
            "2015년 국가등록문화유산으로 등록되었답니다.",
          tip: "한국인 신부가 직접 설계한 건물이라니,\n특별하죠?",
        },
        faq: [
          { question: "언제 지어졌나요?", answer: "1953년에 지어졌어요. 2015년에는 국가등록문화유산으로 등록되었답니다!" },
          { question: "누가 설계했나요?", answer: "방유룡 신부가 직접 설계했어요. 한국인 신부가 직접 설계한 건물이라니 특별하죠?" },
          { question: "건물의 특징은 무엇인가요?", answer: "라틴 십자가 형태의 평면과 타원형 돔이 독특한 특징이에요. 건물 모양을 잘 살펴보세요!" },
        ],
        quiz: {
          question: "이곳의 수도회 이름은\n무엇일까요?",
          options: ["성 베네딕도 수도회", "한국순교복자성직수도회", "예수회", "프란치스코 수도회"],
          hint: "1953년에 세워진 한국 최초의 내국인 남자 수도회예요.",
          hintImage: [42, 252, 306, 117],
          mascot: [273, 296],
          reflection: "구 본원에서 느낀 분위기를\n한 줄로 기록해보세요!",
        },
        clue: {
          word: "믿음",
          image: [102, 370, 199, 141],
          foundAt: "구 본원",
          subLabel: "한국순교복자성직수도회",
          thumb: [102, 316, 65, 65],
        },
      },
      {
        id: "suyeonsanbang",
        name: "이태준가옥(수연산방)",
        pinLabel: "이태준 가옥\n(수연산방)",
        heroSub: "이태준 가옥",
        heroName: "수연산방",
        address: "서울 성북구 성북로26길 8",
        lat: 37.59498,
        lng: 126.99497,
        radius: ARRIVAL_RADIUS,
        photo: "place-suyeonsanbang.webp",
        pinPhoto: "pin-suyeonsanbang.webp",
        pin: { x: 38.46, y: 33.38, w: 160, h: 67, ring: [70, 67], photo: [3, 3, 63, 61], label: [40, 11.1, 130.5, 44.8], lockedLabel: [40, 11.1, 130.5, 44.8], drawnSign: true, text: [85, 15.08, 64], fontSize: 13 },
        ordinal: "세번째",
        // Figma 원본 136:3821 · 3848 · 3875 · 3907 문구 (오타 "요청" → "요정", 마침표 뒤 띄어쓰기, NanumHuman에 없는 한자 "故" 빼기만 고침)
        story: {
          title: "문학의 숨결이 머무는,\n이태준의 옛집",
          body:
            "이곳은 『문장강화』와 『무서록』을 쓴 소설가 상허 이태준이 살았던 집이에요. " +
            "현재는 전통 찻집인 수연산방으로 운영되고 있으며, 옛 한옥의 정취를 느낄 수 있는 공간이에요.\n\n" +
            "특히 사랑방에서는 담장 너머 북악산\n" +
            "자락을 바라볼 수 있어,\n" +
            "전통차와 함께 문학과 여유를 즐길 수 있답니다.",
          tip: "이태준은 어떤 이야기를 글로 남겼을까요?",
        },
        faq: [
          { question: "지금은 어떤 곳인가요?", answer: "지금은 전통 찻집으로 운영되고 있어요. 옛 한옥의 정취를 느낄 수 있답니다." },
          { question: "어디에서 보면 좋나요?", answer: "사랑방이 좋아요! 담장 너머 북악산 자락을 바라보며 전통차와 여유를 즐길 수 있어요." },
          { question: "어떤 사람이 살았나요?", answer: "『문장강화』와 『무서록』을 쓴 소설가가 살았던 집이에요." },
        ],
        quiz: {
          question: "이 집의 원래 주인은\n누구일까요?",
          options: ["염상섭", "이태준", "김동인", "이상"],
          hint: "『문장강화』, 『무서록』을 쓴 소설가예요.",
          hintImage: [33, 259, 315, 118],
          mascot: [279, 300],
          reflection: "수연산방에서 느낀 분위기를\n한 줄로 기록해보세요!",
        },
        clue: {
          word: "기록",
          image: [96, 382, 202, 144],
          foundAt: "수연산방",
          subLabel: "이태준 가옥",
          thumb: [99, 316, 63, 61],
        },
      },
      {
        id: "simujang",
        name: "심우장",
        pinLabel: "심우장",
        address: "서울 성북구 성북로29길 24",
        lat: 37.59361,
        lng: 126.99167,
        radius: ARRIVAL_RADIUS,
        photo: "place-simujang.webp",
        pinPhoto: "pin-simujang.webp",
        pin: { x: 37.69, y: 16.4, w: 134, h: 67, ring: [70, 67], photo: [3, 3, 63, 62.07], label: [40, 14.85, 109.8, 37.3], lockedLabel: [40, 14.85, 109.8, 37.3], drawnSign: true, text: [86, 23.08, 41], fontSize: 15 },
        ordinal: "네번째",
        // Figma 원본 136:3821 · 3848 · 3875 · 3907 문구 (오타 "요청" → "요정", 마침표 뒤 띄어쓰기, NanumHuman에 없는 한자 "故" 빼기만 고침)
        story: {
          title: "만해 한용운이 머문,\n자유와 신념의 집",
          body:
            "심우장은 독립운동가이자 시인인 만해 한용운 선생이 1933년부터 1944년까지 살았던 집이에요. " +
            "한용운 선생은 민족대표 33인 중 한 명으로, 『님의 침묵』을 집필하고 불교 개혁에도 힘썼어요.\n\n" +
            "이곳에서는 선생의 생활 흔적과\n" +
            "직접 심었다고 전해지는 향나무를 만나며,\n" +
            "독립을 향한 신념과 삶을 되새겨 볼 수 있어요.",
          tip: "한용운 선생은 어떤 마음으로\n독립을 꿈꾸었을까요?",
        },
        faq: [
          { question: "언제 사람이 살았나요?", answer: "1933년부터 1944년까지 독립운동가이자 시인인 분이 살았던 집이에요." },
          { question: "여기서 무엇을 볼 수 있나요?", answer: "선생의 생활 흔적과, 직접 심었다고 전해지는 향나무를 만날 수 있어요." },
          { question: "어떤 분이 살았나요?", answer: "민족대표 33인 중 한 명으로, 『님의 침묵』을 집필하고 불교 개혁에도 힘쓴 분이에요." },
        ],
        quiz: {
          question: "이 집에 살았던\n인물은 누구일까요?",
          options: ["이상화", "김소월", "한용운", "윤동주"],
          hint: "『님의 침묵』을 지은 시인이자 독립운동가예요.",
          hintImage: [42, 259, 301, 112],
          mascot: [273, 300],
          reflection: "심우장에서 느낀 분위기를\n한 줄로 기록해보세요!",
        },
        clue: { word: "자유", image: [89, 379, 220, 144], foundAt: "심우장", thumb: [108, 316, 68, 67] },
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

/** 짧은 장소 이름: "구 본원", "수연산방"처럼 화면 제목에 쓰는 이름이 있으면 그것, 없으면 name */
export const placeName = (place: Place) => place.heroName ?? place.name;

/** 홈 카드에 "공개 예정"으로만 보여주는 다음 에피소드 (아직 내용 없음) */
export type ComingSoonEpisode = {
  /** "EP.02" */
  badge: string;
  /** 카드 안내 문구 (줄바꿈은 \n) */
  message: string;
};

export const COMING_SOON_EPISODES: ComingSoonEpisode[] = [
  { badge: "EP.02", message: "새로운 이야기가\n곧 찾아와요!" },
  { badge: "EP.03", message: "새로운 이야기가\n곧 찾아와요!" },
];
