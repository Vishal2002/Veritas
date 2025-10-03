export interface AnalysisResult {
    score: number; // 0-100 (100 = most credible)
    confidence: number; // 0-1
    verdict: 'credible' | 'questionable' | 'unreliable';
    reasons: string[];
    sources?: string[];
    biasDetected?: string;
  }
  
  export interface Article {
    url: string;
    title: string;
    content: string;
    author?: string;
    publishDate?: string;
  }
  
  export interface CerebrasRequest {
    model: string;
    messages: Message[];
    temperature?: number;
    max_tokens?: number;
  }
  
  export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }