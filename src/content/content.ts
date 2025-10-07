// src/content/content.ts
import type { Article, AnalysisResult } from "../types/index"; 
import "./content.css";

let highlightedElements: HTMLElement[] = [];
let currentArticle: Article | null = null;
let currentIndicator: HTMLElement | null = null;
let isAnalyzing = false;

// Extract article content from page
function extractArticle(): Article {
  const title = document.querySelector('h1')?.innerText || document.title;
  const url = window.location.href;
  
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
    }, 300);
  }
  
  highlightedElements.forEach(el => {
    el.style.backgroundColor = '';
    el.title = '';
  });
  highlightedElements = [];
}

// Show loading indicator
function showLoadingIndicator() {
  removeIndicator();
  
  const indicator = document.createElement('div');
  indicator.id = 'veritas-indicator';
  indicator.className = 'veritas-indicator veritas-loading';
  
  indicator.innerHTML = `
    <button class="veritas-close" aria-label="Close" title="Close"></button>
    <div class="veritas-header">
      <span class="veritas-icon">🛡️</span>
      <span class="veritas-title">Veritas Check</span>
    </div>
    <div class="veritas-loading-container">
      <div class="veritas-spinner"></div>
      <div class="veritas-loading-text">Analyzing article...</div>
      <div class="veritas-loading-subtext">Checking for misinformation and bias</div>
    </div>
  `;
  
  document.body.appendChild(indicator);
  currentIndicator = indicator;
  
  const closeBtn = indicator.querySelector('.veritas-close');
  closeBtn?.addEventListener('click', () => {
    removeIndicator();
    isAnalyzing = false;
  });
}

// Show error indicator
function showErrorIndicator(errorMessage: string) {
  removeIndicator();
  
  const indicator = document.createElement('div');
  indicator.id = 'veritas-indicator';
  indicator.className = 'veritas-indicator veritas-error';
  
  indicator.innerHTML = `
    <button class="veritas-close" aria-label="Close" title="Close"></button>
    <div class="veritas-header">
      <span class="veritas-icon">⚠️</span>
      <span class="veritas-title">Analysis Failed</span>
    </div>
    <div class="veritas-error-content">
      <div class="veritas-error-message">${errorMessage}</div>
      <button class="veritas-retry-btn" id="veritasRetry">
        🔄 Retry Analysis
      </button>
    </div>
  `;
  
  document.body.appendChild(indicator);
  currentIndicator = indicator;
  
  const closeBtn = indicator.querySelector('.veritas-close');
  closeBtn?.addEventListener('click', removeIndicator);
  
  const retryBtn = indicator.querySelector('#veritasRetry');
  retryBtn?.addEventListener('click', () => {
    if (currentArticle) {
      startAnalysis(currentArticle);
    }
  });
  
  isAnalyzing = false;
}

// Create result indicator
function createIndicator(result: AnalysisResult) {
  removeIndicator();
  isAnalyzing = false;

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
    <div class="veritas-confidence">
      Confidence: ${Math.round(result.confidence * 100)}%
    </div>
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
  
  const closeBtn = indicator.querySelector('.veritas-close');
  closeBtn?.addEventListener('click', removeIndicator);

  if (result.verdict !== 'credible' && currentArticle) {
    highlightSentences(currentArticle.content, result.reasons);
  }
}

// Start analysis with timeout
function startAnalysis(article: Article) {
  if (isAnalyzing) {
    console.log('Analysis already in progress');
    return;
  }
  
  isAnalyzing = true;
  showLoadingIndicator();
  
  // Set timeout for analysis (30 seconds)
  const timeout = setTimeout(() => {
    if (isAnalyzing) {
      showErrorIndicator('Analysis timed out. The API might be slow or unavailable. Please try again.');
    }
  }, 30000);
  
  // Send to background for API analysis
  chrome.runtime.sendMessage({ action: 'analyze', article }, (response) => {
    clearTimeout(timeout);
    
    if (chrome.runtime.lastError) {
      console.error('Message error:', chrome.runtime.lastError);
      showErrorIndicator('Connection error. Please refresh the page and try again.');
      return;
    }
    
    if (!response?.success) {
      showErrorIndicator('Failed to start analysis. Check if your API key is configured.');
    }
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'showResult') {
    createIndicator(request.result);
    sendResponse({ success: true });
  } else if (request.action === 'showError') {
    showErrorIndicator(request.error || 'Analysis failed. Please try again.');
    sendResponse({ success: true });
  } else if (request.action === 'analyze') {
    currentArticle = extractArticle();
    
    // Check if content is substantial
    if (currentArticle.content.length < 300) {
      showErrorIndicator('Article content too short to analyze reliably.');
      sendResponse({ success: false });
      return true;
    }
    
    startAnalysis(currentArticle);
    sendResponse({ success: true });
  } else if (request.action === 'closeIndicator') {
    removeIndicator();
    sendResponse({ success: true });
  }
  return true;
});

// Auto-analyze on load
chrome.storage.sync.get(['autoAnalyze'], (result) => {
  if (result.autoAnalyze !== false) {
    const analyzeOnLoad = () => {
      // Wait a bit for page to fully load
      setTimeout(() => {
        currentArticle = extractArticle();
        
        if (currentArticle.content.length > 300) {
          startAnalysis(currentArticle);
        }
      }, 1000); // 1 second delay
    };
    
    if (document.readyState === 'loading') {
      window.addEventListener('load', analyzeOnLoad);
    } else {
      analyzeOnLoad();
    }
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentIndicator) {
    removeIndicator();
    isAnalyzing = false;
  }
});

console.log('Veritas content script loaded');