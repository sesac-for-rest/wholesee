import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { AffectionBar } from '../components/AffectionBar';
import { ChatBubble } from '../components/ChatBubble';
import { useChatStore } from '../stores/chatStore';
import { useAffectionStore } from '../stores/affectionStore';
import { MessageRole } from '../types/chat';
import { AffectionIncreaseReason } from '../types/affection';

export const ChatPage = () => {
  const [input, setInput] = useState('');
  const [waitingTime, setWaitingTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    currentSession,
    isLoading,
    startNewSession,
    addMessage,
    setLoading,
  } = useChatStore();

  const {
    level,
    updateVisit,
    increaseAffection,
    incrementConversation,
  } = useAffectionStore();

  // 초기 세션 시작 및 방문 업데이트
  useEffect(() => {
    if (!currentSession) {
      startNewSession();
      updateVisit();
    }
  }, []);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // 타이머: 로딩 중일 때 1초마다 waitingTime 업데이트
  useEffect(() => {
    if (isLoading && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setWaitingTime(elapsed);
      }, 100); // 100ms마다 업데이트 (부드러운 표시)

      return () => clearInterval(interval);
    }
  }, [isLoading, startTime]);

  // 메시지 전송
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // 사용자 메시지 추가
    addMessage(MessageRole.USER, userMessage);

    // Backend API 호출 - 타이머 시작
    const requestStartTime = Date.now();
    setStartTime(requestStartTime);
    setWaitingTime(0);
    setLoading(true);

    try {
      const { sendMessage } = await import('../services/api');
      const response = await sendMessage(userMessage);

      // 소요 시간 계산
      const thinkingTimeSeconds = Math.floor((Date.now() - requestStartTime) / 1000);

      // 요정 메시지 추가 (thinkingTime 포함)
      addMessage(MessageRole.FAIRY, response.message, thinkingTimeSeconds);

      // 호감도 업데이트 (Zustand store는 유지하되, Backend 데이터로 동기화)
      // TODO: Backend 응답에서 받은 level, points로 store 업데이트
      const affectionStore = useAffectionStore.getState();
      affectionStore.addPoints(response.affection_gained);
      affectionStore.incrementConversation(false);

    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage(MessageRole.SYSTEM, '메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setStartTime(null);
      setWaitingTime(0);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* 호감도 바 */}
      <div className="mb-4">
        <AffectionBar />
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {currentSession?.messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl mb-1">🧚</span>
              <div className="chat-bubble-fairy">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4 text-fairy-500 animate-spin-slow"
                    fill="currentColor"
                  />
                  <div>
                    <p className="text-sm text-gray-700">생각 중</p>
                    <p className="text-xs text-fairy-400 font-medium">
                      {waitingTime}초
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="요정에게 이야기를 들려주세요..."
            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-fairy-400 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

// 더 이상 필요 없음 - Backend에서 처리
