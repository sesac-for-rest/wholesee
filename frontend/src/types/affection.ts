// 호감도 레벨 타입
export type AffectionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// 호감도 단계별 설명
export const AFFECTION_STAGE = {
  STRANGER: { min: 1, max: 3, label: '낯선 사이', description: '첫 만남' },
  GETTING_TO_KNOW: { min: 4, max: 6, label: '알아가는 중', description: '마음을 열기 시작' },
  FRIEND: { min: 7, max: 9, label: '친구가 됨', description: '편하게 대화' },
  TRUSTED: { min: 10, max: 10, label: '신뢰하는 사이', description: '커뮤니티 언락!' },
} as const;

// 호감도 상승 이유
export enum AffectionIncreaseReason {
  DAILY_CONVERSATION = 'daily_conversation', // 일반 대화
  DEEP_CONVERSATION = 'deep_conversation', // 깊이 있는 대화
  CONSECUTIVE_VISIT = 'consecutive_visit', // 연속 방문
  SINCERE_SHARING = 'sincere_sharing', // 진솔한 공유
}

// 호감도 상승 포인트
export const AFFECTION_POINTS = {
  [AffectionIncreaseReason.DAILY_CONVERSATION]: 5,
  [AffectionIncreaseReason.DEEP_CONVERSATION]: 15,
  [AffectionIncreaseReason.CONSECUTIVE_VISIT]: 10,
  [AffectionIncreaseReason.SINCERE_SHARING]: 20,
} as const;

// 레벨별 필요 포인트 (각 레벨 도달에 필요한 총 포인트)
export const LEVEL_POINTS: Record<AffectionLevel, number> = {
  1: 0,
  2: 30,
  3: 70,
  4: 120,
  5: 180,
  6: 250,
  7: 330,
  8: 420,
  9: 520,
  10: 630,
};

// 호감도 데이터 인터페이스
export interface AffectionData {
  level: AffectionLevel;
  points: number;
  totalConversations: number;
  deepConversations: number;
  consecutiveDays: number;
  lastVisitDate: string;
  createdAt: string;
}
