// src/content/content.ts
import type { Article, AnalysisResult } from "../types/index"; 
import { localAnalyzer } from "../utils/analyzer"; 
import "./content.css";

let highlightedElements: HTMLElement[] = [];
let currentArticle: Article | null = null;
let currentIndicator: HTMLElement | null = null;

// Extract article content from page
function extractArticle(): Article {
  const title = document.querySelector('h1')?.innerText || document.title;
  const url = window.location.href;
  
  // Try to get main content (adjust selectors for different sites)
  const contentSelectors = [
    'article',
    '[role="article"]',
    '.post-content',
    '.article-body',
    'main',
  ];
  
  let content = '';
  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      content = el.textContent || '';
      break;
    }
  }
  
  return { url, title, content };
}

// Highlight suspicious sentences
function highlightSentences(content: string, reasons: string[]) {
  // Clear previous highlights
  highlightedElements.forEach(el => {
    el.style.backgroundColor = '';
    el.title = '';
  });
  highlightedElements = [];

  const suspiciousRegex = new RegExp(reasons.join('|'), 'gi');
  const sentences = content.split(/[.!?]+/);
  const allParagraphs = document.querySelectorAll('p, .article-body p');
  
  sentences.forEach((sentence, idx) => {
    if (suspiciousRegex.test(sentence) && idx < allParagraphs.length) {
      const el = allParagraphs[idx] as HTMLElement;
      el.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      el.style.transition = 'background-color 0.3s ease';
      el.title = 'Questionable claim - Veritas flagged';
      highlightedElements.push(el);
    }
  });
}

// Remove indicator with animation
function removeIndicator() {
  if (currentIndicator) {
    currentIndicator.classList.add('veritas-closing');
    setTimeout(() => {
      currentIndicator?.remove();
      currentIndicator = null;
    }, 300); // Match animation duration
  }
  
  // Clear highlights
  highlightedElements.forEach(el => {
    el.style.backgroundColor = '';
    el.title = '';
  });
  highlightedElements = [];
}

// Create floating indicator with close button
function createIndicator(result: AnalysisResult) {
  // Remove old indicator
  removeIndicator();

  const indicator = document.createElement('div');
  indicator.id = 'veritas-indicator';
  indicator.className = `veritas-indicator veritas-${result.verdict}`;
  
  indicator.innerHTML = `
    <button class="veritas-close" aria-label="Close" title="Close"></button>
    <div class="veritas-header">
      <span class="veritas-icon">🛡️</span>
      <span class="veritas-title">Veritas Check</span>
    </div>
    <div class="veritas-score">${result.score}/100</div>
    <div class="veritas-verdict">${result.verdict.toUpperCase()}</div>
    <div class="veritas-reasons">
      ${result.reasons.map(r => `<div>• ${r}</div>`).join('')}
    </div>
    ${result.sources && result.sources.length > 0 ? `
      <div class="veritas-sources">
        <strong>Sources:</strong> ${result.sources.join(', ')}
      </div>
    ` : ''}
    ${result.biasDetected ? `
      <div class="veritas-bias">
        <strong>Bias Detected:</strong> ${result.biasDetected}
      </div>
    ` : ''}
  `;
  
  document.body.appendChild(indicator);
  currentIndicator = indicator;
  
  // Add close button functionality
  const closeBtn = indicator.querySelector('.veritas-close');
  closeBtn?.addEventListener('click', removeIndicator);

  // Highlight if questionable/unreliable
  if (result.verdict !== 'credible' && currentArticle) {
    highlightSentences(currentArticle.content, result.reasons);
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'showResult') {
    createIndicator(request.result);
    sendResponse({ success: true });
  } else if (request.action === 'analyze') {
    currentArticle = extractArticle();
    
    // Quick local check first (optional feedback)
    const localResult = localAnalyzer(currentArticle);
    if (localResult.score < 50) {
      createIndicator({
        ...localResult,
        reasons: ['Analyzing...', ...localResult.reasons]
      });
    }
    
    chrome.runtime.sendMessage({ action: 'analyze', article: currentArticle });
    sendResponse({ success: true });
  } else if (request.action === 'closeIndicator') {
    removeIndicator();
    sendResponse({ success: true });
  }
  return true;
});

// Auto-analyze on load (configurable)
chrome.storage.sync.get(['autoAnalyze'], (result) => {
  if (result.autoAnalyze !== false) {
    const analyzeOnLoad = () => {
      currentArticle = extractArticle();
      
      // Only analyze if content is substantial
      if (currentArticle.content.length > 300) {
        chrome.runtime.sendMessage({ 
          action: 'analyze', 
          article: currentArticle 
        });
      }
    };
    
    if (document.readyState === 'loading') {
      window.addEventListener('load', analyzeOnLoad);
    } else {
      // Page already loaded
      analyzeOnLoad();
    }
  }
});

// Keyboard shortcut: ESC to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentIndicator) {
    removeIndicator();
  }
});

console.log('Veritas content script loaded');