export interface ChatMessageHistoryItem {
  role: "user" | "model";
  content: string;
}

export interface ChatMessageRequestDto {
  message: string;
  locale?: string;
  history?: ChatMessageHistoryItem[];
}

export interface ChatMessageResponseDto {
  reply: string;
  suggested_followups?: string[];
}

export interface QuickQuestionDto {
  id: number;
  text: string;
  category?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  timestamp: string;
  isPending?: boolean;
  isError?: boolean;
}
