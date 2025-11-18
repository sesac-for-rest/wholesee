import { getAnonymousId } from '../utils/auth';

// Vite proxy를 통해 /api로 접근
const API_URL = '';

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  message: string;
  affection_gained: number;
  new_level: number;
  new_points: number;
  community_unlocked: boolean;
}

export interface UserData {
  id: number;
  anonymous_id: string;
  level: number;
  points: number;
  total_conversations: number;
  deep_conversations: number;
  consecutive_days: number;
  last_visit_date: string;
  community_unlocked: boolean;
}

export interface MessageData {
  id: number;
  role: 'user' | 'fairy' | 'system';
  content: string;
  created_at: string;
  is_deep: boolean;
  affection_gained: number;
}

// 채팅 API
export async function sendMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      anonymous_id: getAnonymousId(),
      message,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

// 사용자 정보 조회
export async function getUserInfo(): Promise<UserData> {
  const anonymousId = getAnonymousId();
  const response = await fetch(`${API_URL}/api/v1/users/${anonymousId}`);

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

// 메시지 히스토리 조회
export async function getMessages(): Promise<MessageData[]> {
  const anonymousId = getAnonymousId();
  const response = await fetch(`${API_URL}/api/v1/users/${anonymousId}/messages`);

  if (!response.ok) {
    throw new Error('Failed to get messages');
  }

  return response.json();
}
