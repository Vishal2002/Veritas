import {type Article, type AnalysisResult } from "../types/index";

export function localAnalyzer(article: Article): AnalysisResult {
  // Basic heuristic checks (no API needed) - enhances UX for hackathon demo
  const reasons: string[] = [];
  let score = 100;
  let confidence = 0.8;

  // Check for sensational words
  const sensationalWords = ['breaking', 'shocking', 'urgent', 'exclusive'];
  if (sensationalWords.some(word => article.title.toLowerCase().includes(word))) {
    reasons.push('Sensational title detected');
    score -= 20;
  }

  // Check content length (too short = suspicious?)
  if (article.content.length < 500) {
    reasons.push('Article too brief for in-depth reporting');
    score -= 15;
  }

  // Mock bias check
  if (article.content.toLowerCase().includes('trump') || article.content.toLowerCase().includes('biden')) {
    reasons.push('Potential political bias in content');
    score -= 10;
  }

  // Source check (basic URL heuristic)
  if (!article.url.includes('nytimes.com') && !article.url.includes('bbc.com') && Math.random() > 0.7) {
    reasons.push('Unknown source credibility');
    score -= 25;
  }

  const verdict = score >= 70 ? 'credible' : score >= 40 ? 'questionable' : 'unreliable';

  return {
    score: Math.max(0, Math.min(100, score)),
    confidence,
    verdict,
    reasons,
  };
}