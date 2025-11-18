import { useState } from 'react';
import { setOnboardingDone } from '../utils/auth';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const [step, setStep] = useState(0);

  const handleStart = () => {
    setOnboardingDone();
    onComplete();
  };

  const steps = [
    {
      title: '안녕하세요, 새담입니다 🧚',
      description: '저는 여러분의 이야기를 들어주는 요정이에요.\n혼자 고민하지 마시고, 편하게 이야기 나눠요.',
    },
    {
      title: '당신의 이야기를 들려주세요',
      description: '히키코모리 자녀를 둔 부모님들의\n어려움을 이해하고 함께 고민합니다.',
    },
    {
      title: '함께 걸어갈게요',
      description: '대화를 나누며 요정과 친해지면\n같은 고민을 하는 분들과도 만날 수 있어요.',
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-purple-50 to-green-50">
      <div className="max-w-md w-full space-y-8">
        {/* 요정 아이콘 */}
        <div className="text-center">
          <span className="text-8xl">🧚</span>
        </div>

        {/* 콘텐츠 */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">
            {currentStep.title}
          </h1>
          <p className="text-lg text-gray-600 whitespace-pre-line leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* 인디케이터 */}
        <div className="flex justify-center gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === step ? 'bg-fairy-500 w-8' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* 버튼 */}
        <div className="flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                handleStart();
              }
            }}
            className={`px-6 py-4 font-medium rounded-xl transition-colors shadow-lg ${
              step === 0 ? 'w-full' : 'flex-1'
            } btn-primary`}
          >
            {step === steps.length - 1 ? '시작하기' : '다음'}
          </button>
        </div>

        {/* 건너뛰기 */}
        {step < steps.length - 1 && (
          <button
            onClick={handleStart}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
};
