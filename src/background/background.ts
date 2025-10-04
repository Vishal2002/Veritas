// src/background/background.ts
import { VeritasAPI } from '../utils/api';
import type { Article } from '../types/index';

let api: VeritasAPI | null = null;

// Initialize API with stored key
chrome.storage.sync.get(['apiKey'], (result) => {
  if (result.apiKey) {
    api = new VeritasAPI(result.apiKey);
    console.log('✅ Veritas API initialized');
  } else {
    console.log('⚠️ No API key found. Please configure in popup.');
  }
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze') {
    handleAnalysis(request.article, sender.tab?.id)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('❌ Analysis error:', error);
        
        // Send error to content script
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            action: 'showError',
            error: error.message || 'Analysis failed. Please try again.',
          });
        }
        
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async
  }
  
  if (request.action === 'updateApiKey') {
    api = new VeritasAPI(request.apiKey);
    console.log('✅ API key updated');
    sendResponse({ success: true });
  }
  
  return false;
});

async function handleAnalysis(article: Article, tabId?: number) {
  console.log('🔍 Starting analysis for:', article.title);
  
  if (!api) {
    const errorMsg = 'API key not configured. Click the Veritas extension icon to add your Cerebras API key.';
    console.error('⚠️', errorMsg);
    
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'showError',
        error: errorMsg,
      });
    }
    throw new Error(errorMsg);
  }

  // Check cache first
  const cacheKey = `analysis_${article.url}`;
  const cached = await chrome.storage.local.get(cacheKey);
  
  if (cached[cacheKey]) {
    const cacheData = cached[cacheKey];
    const age = Date.now() - cacheData.timestamp;
    
    // Use cache if less than 1 hour old
    if (age < 3600000) {
      console.log('📦 Using cached result');
      if (tabId) {
        chrome.tabs.sendMessage(tabId, {
          action: 'showResult',
          result: cacheData.result,
        });
      }
      return;
    }
  }

  try {
    console.log('🚀 Sending to Cerebras API...');
    const result = await api.analyzeContent(article);
    console.log('✅ Analysis complete:', result);
    
    // Send result back to content script
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'showResult',
        result,
      });
    }
    
    // Store in cache
    await chrome.storage.local.set({
      [cacheKey]: {
        result,
        timestamp: Date.now(),
      },
    });
    
  } catch (error) {
    console.error('❌ API call failed:', error);
    
    let errorMessage = 'Analysis failed. ';
    
    if (error instanceof Error) {
      if (error.message.includes('API error')) {
        errorMessage += 'API request failed. Check your API key and internet connection.';
      } else if (error.message.includes('Invalid JSON')) {
        errorMessage += 'Received invalid response from AI. Please try again.';
      } else {
        errorMessage += error.message;
      }
    } else {
      errorMessage += 'Unknown error occurred.';
    }
    
    // Show error in UI
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'showError',
        error: errorMessage,
      });
    }
    
    throw error;
  }
}

// Listen for API key updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.apiKey?.newValue) {
    api = new VeritasAPI(changes.apiKey.newValue);
    console.log('✅ API key updated from storage');
  }
});

console.log('🛡️ Veritas background script loaded');

// Export for module
export {};