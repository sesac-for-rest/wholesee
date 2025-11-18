import { Clock } from 'lucide-react';
import { Message, MessageRole } from '../types/chat';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble = ({ message }: ChatBubbleProps) => {
  const isUser = message.role === MessageRole.USER;
  const isFairy = message.role === MessageRole.FAIRY;

  if (message.role === MessageRole.SYSTEM) {
    return (
      <div className="text-center my-4">
        <p className="text-xs text-gray-500 bg-gray-100 rounded-full px-4 py-2 inline-block">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex items-end gap-2 max-w-[85%]">
        {isFairy && <span className="text-2xl mb-1">🧚</span>}

        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-fairy'}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-gray-400">
              {new Date(message.timestamp.toString()).toLocaleString()}
            </p>
            {isFairy && message.thinkingTime !== undefined && (
              <div className="flex items-center gap-1 text-xs text-fairy-500">
                <Clock className="w-3 h-3" />
                <span>{message.thinkingTime}초 동안 생각함</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
