import { useAffectionStore } from '../stores/affectionStore';
import { AFFECTION_STAGE } from '../types/affection';

export const AffectionBar = () => {
  const { level, getProgressToNextLevel } = useAffectionStore();
  const progress = getProgressToNextLevel();

  // 현재 레벨의 단계 찾기
  const currentStage = Object.values(AFFECTION_STAGE).find(
    (stage) => level >= stage.min && level <= stage.max
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧚</span>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {currentStage?.label}
            </p>
            <p className="text-xs text-gray-500">
              {currentStage?.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-fairy-600">Lv {level}</p>
          {level < 10 && (
            <p className="text-xs text-gray-500">
              {progress.current}/{progress.needed}
            </p>
          )}
        </div>
      </div>

      {/* 호감도 게이지 */}
      <div className="affection-bar">
        <div
          className="affection-fill"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* 레벨업 안내 */}
      {level === 10 && (
        <p className="text-xs text-center text-fairy-600 font-medium mt-2">
          ✨ 커뮤니티가 열렸어요!
        </p>
      )}
    </div>
  );
};
