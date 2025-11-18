import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, ChatSession, MessageRole } from '../types/chat';
import { nanoid } from 'nanoid';

interface ChatStore {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;

  // Actions
  startNewSession: () => void;
  addMessage: (role: MessageRole, content: string, thinkingTime?: number) => void;
  endCurrentSession: (affectionGained: number, isDeep: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: [],
      isLoading: false,

      // 새 세션 시작
      startNewSession: () => {
        const newSession: ChatSession = {
          id: nanoid(),
          messages: [],
          startedAt: new Date(),
          affectionGained: 0,
          isDeepConversation: false,
        };

        set({ currentSession: newSession });
      },

      // 메시지 추가
      addMessage: (role: MessageRole, content: string, thinkingTime?: number) => {
        const currentSession = get().currentSession;

        if (!currentSession) {
          get().startNewSession();
        }

        const newMessage: Message = {
          id: nanoid(),
          role,
          content,
          timestamp: new Date(),
          ...(thinkingTime !== undefined && { thinkingTime }),
        };

        set((state) => ({
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                messages: [...state.currentSession.messages, newMessage],
              }
            : null,
        }));
      },

      // 현재 세션 종료
      endCurrentSession: (affectionGained: number, isDeep: boolean) => {
        set((state) => {
          if (!state.currentSession) return state;

          const endedSession: ChatSession = {
            ...state.currentSession,
            endedAt: new Date(),
            affectionGained,
            isDeepConversation: isDeep,
          };

          return {
            currentSession: null,
            sessions: [endedSession, ...state.sessions],
          };
        });
      },

      // 로딩 상태 설정
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // 히스토리 삭제
      clearHistory: () => set({ sessions: [], currentSession: null }),
    }),
    {
      name: 'saedam-chat',
    }
  )
);
