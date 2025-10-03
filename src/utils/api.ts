import type{ Article, AnalysisResult } from "../types/index";

export class VeritasAPI {
  private cerebrasApiKey: string;
  private baseUrl = 'https://api.cerebras.ai/v1/chat/completions';

  constructor(apiKey: string) {
    this.cerebrasApiKey = apiKey;
  }

  async analyzeContent(article: Article): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(article);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.cerebrasApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checking AI that analyzes news articles for credibility, bias, and misinformation. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content;
    try {
      content = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      throw new Error('Invalid JSON response from AI');
    }
    
    return {
      score: content.score || 50,
      confidence: content.confidence || 0.5,
      verdict: this.getVerdict(content.score || 50),
      reasons: content.reasons || ['Analysis incomplete'],
      sources: content.sources || [],
      biasDetected: content.bias,
    };
  }

  private buildPrompt(article: Article): string {
    return `Analyze this article for credibility and potential misinformation:

Title: ${article.title}
URL: ${article.url}
Content: ${article.content.slice(0, 2000)}

Provide analysis in JSON format:
{
  "score": <0-100>,
  "confidence": <0-1>,
  "reasons": ["reason1", "reason2"],
  "sources": ["source1", "source2"],
  "bias": "political lean if detected"
}

Consider:
1. Source credibility
2. Factual accuracy indicators
3. Emotional language/sensationalism
4. Citations and sources
5. Author credentials
6. Bias indicators`;
  }

  private getVerdict(score: number): 'credible' | 'questionable' | 'unreliable' {
    if (score >= 70) return 'credible';
    if (score >= 40) return 'questionable';
    return 'unreliable';
  }
}