// src/background/background.ts
import { VeritasAPI } from '../utils/api';
import type { Article } from '../types/index';

let api: VeritasAPI | null = null;

// Initialize API with stored key
chrome.storage.sync.get(['apiKey'], (result) => {
  if (result.apiKey) {
    api = new VeritasAPI(result.apiKey);
    console.log('Veritas API initialized');
  }
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    handleAnalysis(request.article, sender.tab?.id)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Analysis error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async
  }
  
  if (request.action === 'updateApiKey') {
    api = new VeritasAPI(request.apiKey);
    sendResponse({ success: true });
  }
  
  return false;
});

async function handleAnalysis(article: Article, tabId?: number) {
  if (!api) {
    console.error('API not initialized - please add API key in popup');
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'showResult',
        result: {
          score: 0,
          confidence: 0,
          verdict: 'unreliable' as const,
          reasons: ['API key not configured. Click extension icon to add your Cerebras API key.'],
          sources: [],
        },
      });
    }
    return;
  }

  try {
    console.log('Analyzing article:', article.title);
    const result = await api.analyzeContent(article);
    
    // Send result back to content script
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'showResult',
        result,
      });
    }
    
    // Store in cache
    const cacheKey = `analysis_${article.url}`;
    await chrome.storage.local.set({
      [cacheKey]: {
        result,
        timestamp: Date.now(),
      },
    });
    
    console.log('Analysis complete:', result);
  } catch (error) {
    console.error('Analysis failed:', error);
    
    // Show error in UI
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'showResult',
        result: {
          score: 0,
          confidence: 0,
          verdict: 'unreliable' as const,
          reasons: [`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          sources: [],
        },
      });
    }
  }
}

// Listen for API key updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.apiKey?.newValue) {
    api = new VeritasAPI(changes.apiKey.newValue);
    console.log('API key updated');
  }
});

console.log('Veritas background script loaded');

// Export for module
export {};