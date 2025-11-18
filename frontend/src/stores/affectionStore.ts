import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AffectionData,
  AffectionLevel,
  AffectionIncreaseReason,
  AFFECTION_POINTS,
  LEVEL_POINTS,
} from '../types/affection';

interface AffectionStore extends AffectionData {
  // Actions
  increaseAffection: (reason: AffectionIncreaseReason) => void;
  addPoints: (points: number) => void;
  incrementConversation: (isDeep: boolean) => void;
  updateVisit: () => void;
  calculateLevel: (points: number) => AffectionLevel;
  getProgressToNextLevel: () => { current: number; needed: number; percentage: number };
  reset: () => void;
}

const initialState: AffectionData = {
  level: 1,
  points: 0,
  totalConversations: 0,
  deepConversations: 0,
  consecutiveDays: 0,
  lastVisitDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

export const useAffectionStore = create<AffectionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 호감도 증가 (이유에 따라)
      increaseAffection: (reason: AffectionIncreaseReason) => {
        const points = AFFECTION_POINTS[reason];
        get().addPoints(points);
      },

      // 포인트 추가
      addPoints: (points: number) => {
        set((state) => {
          const newPoints = state.points + points;
          const newLevel = get().calculateLevel(newPoints);

          return {
            points: newPoints,
            level: newLevel,
          };
        });
      },

      // 대화 횟수 증가
      incrementConversation: (isDeep: boolean) => {
        set((state) => ({
          totalConversations: state.totalConversations + 1,
          deepConversations: isDeep ? state.deepConversations + 1 : state.deepConversations,
        }));
      },

      // 방문 업데이트 (연속 방문 체크)
      updateVisit: () => {
        set((state) => {
          const lastVisit = new Date(state.lastVisitDate);
          const today = new Date();
          const daysDiff = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

          let newConsecutiveDays = state.consecutiveDays;

          if (daysDiff === 1) {
            // 연속 방문
            newConsecutiveDays += 1;
            get().increaseAffection(AffectionIncreaseReason.CONSECUTIVE_VISIT);
          } else if (daysDiff > 1) {
            // 연속 끊김
            newConsecutiveDays = 1;
          }

          return {
            lastVisitDate: today.toISOString(),
            consecutiveDays: newConsecutiveDays,
          };
        });
      },

      // 포인트로부터 레벨 계산
      calculateLevel: (points: number): AffectionLevel => {
        const levels = Object.entries(LEVEL_POINTS)
          .sort(([, a], [, b]) => b - a); // 내림차순 정렬

        for (const [level, requiredPoints] of levels) {
          if (points >= requiredPoints) {
            return parseInt(level) as AffectionLevel;
          }
        }

        return 1;
      },

      // 다음 레벨까지 진행도
      getProgressToNextLevel: () => {
        const currentLevel = get().level;
        const currentPoints = get().points;

        if (currentLevel === 10) {
          return { current: currentPoints, needed: LEVEL_POINTS[10], percentage: 100 };
        }

        const nextLevel = (currentLevel + 1) as AffectionLevel;
        const currentLevelPoints = LEVEL_POINTS[currentLevel];
        const nextLevelPoints = LEVEL_POINTS[nextLevel];

        const needed = nextLevelPoints - currentLevelPoints;
        const current = currentPoints - currentLevelPoints;
        const percentage = Math.floor((current / needed) * 100);

        return { current, needed, percentage };
      },

      // 리셋 (테스트용)
      reset: () => set(initialState),
    }),
    {
      name: 'saedam-affection',
    }
  )
);
