// 메시지 역할
export enum MessageRole {
  USER = 'user',
  FAIRY = 'fairy',
  SYSTEM = 'system',
}

// 메시지 인터페이스
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isDeep?: boolean; // 깊이 있는 대화인지 여부 (AI 분석)
  thinkingTime?: number; // 요정이 생각한 시간 (초)
}

// 대화 세션
export interface ChatSession {
  id: string;
  messages: Message[];
  startedAt: Date;
  endedAt?: Date;
  affectionGained: number; // 이 세션에서 얻은 호감도
  isDeepConversation: boolean; // 깊이 있는 대화였는지
}

// 대화 깊이 분석 결과
export interface ConversationDepthAnalysis {
  isDeep: boolean;
  emotionalIntensity: number; // 0-100
  topicRelevance: number; // 0-100
  userEngagement: number; // 0-100
}
