export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface ChatQuelle {
  dokument: string;
  seite?: number;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  quellen: ChatQuelle[];
  timestamp: string;
  token_count?: number;
}

export interface ChatSession {
  id: string;
  titel: string;
  erstellt_am: string;
  letzte_nachricht_am: string;
  nachrichten_anzahl: number;
}

export interface ChatRequest {
  frage: string;
  session_id?: string;
}
