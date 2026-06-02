export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ProblemInfo {
  params: string[];
  example?: string;
  prerequisites?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface DSAPattern {
  category: string;
  problems: string[];
}

export type View = 'home' | 'forge';
export type Language = 'javascript' | 'python' | 'java' | 'cpp';

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
}

export interface ForgeProgress {
  code_map: Record<string, string>;
  user_notes: Record<string, string>;
  approach_board: Record<string, string>;
  mastered_problems: string[];
  last_review_date: Record<string, string>;
}
