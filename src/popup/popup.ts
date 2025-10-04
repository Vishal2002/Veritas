// src/popup/popup.ts

// Show status message
function showStatus(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const existing = document.querySelector('.veritas-status');
    if (existing) existing.remove();
    
    const status = document.createElement('div');
    status.className = `veritas-status veritas-status-${type}`;
    status.textContent = message;
    
    const container = document.querySelector('.popup-container');
    container?.insertBefore(status, container.firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => status.remove(), 3000);
  }
  
  // Save API key
  document.getElementById('saveBtn')?.addEventListener('click', () => {
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }
    
    if (!apiKey.startsWith('csk-')) {
      showStatus('Invalid API key format. Cerebras keys start with "csk-"', 'error');
      return;
    }
    
    chrome.storage.sync.set({ apiKey }, () => {
      showStatus('API Key saved successfully! ✓', 'success');
      
      // Notify background script
      chrome.runtime.sendMessage({ action: 'updateApiKey', apiKey });
    });
  });
  
  // Analyze button
  document.getElementById('analyzeBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('analyzeBtn') as HTMLButtonElement;
    const originalText = btn.textContent;
    
    // Check if API key is configured
    const result = await chrome.storage.sync.get(['apiKey']);
    if (!result.apiKey) {
      showStatus('Please configure your API key first', 'error');
      return;
    }
    
    // Disable button and show loading
    btn.disabled = true;
    btn.textContent = '🔄 Analyzing...';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        showStatus('No active tab found', 'error');
        return;
      }
      
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { action: 'analyze' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message error:', chrome.runtime.lastError);
          showStatus('Failed to connect to page. Try refreshing.', 'error');
        } else if (response?.success) {
          showStatus('Analysis started! Check the page.', 'success');
        } else {
          showStatus('Analysis failed. See page for details.', 'error');
        }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      showStatus('Failed to start analysis', 'error');
    } finally {
      // Re-enable button
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = originalText || 'Analyze Current Page';
      }, 2000);
    }
  });
  
  // Auto-analyze toggle
  document.getElementById('autoAnalyze')?.addEventListener('change', (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    chrome.storage.sync.set({ autoAnalyze: enabled }, () => {
      showStatus(
        enabled ? 'Auto-analyze enabled ✓' : 'Auto-analyze disabled', 
        'success'
      );
    });
  });
  
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'autoAnalyze'], (result) => {
    const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    const autoAnalyzeCheckbox = document.getElementById('autoAnalyze') as HTMLInputElement;
    
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
      // Show masked key for security
      apiKeyInput.placeholder = '••••••••' + result.apiKey.slice(-4);
    }
    
    autoAnalyzeCheckbox.checked = result.autoAnalyze !== false;
  });
  
  // Show keyboard shortcuts
  document.addEventListener('DOMContentLoaded', () => {
    const hints = document.createElement('div');
    hints.className = 'veritas-hints';
    hints.innerHTML = `
      <small>💡 Tip: Press ESC on any page to close the indicator</small>
    `;
    document.body.appendChild(hints);
  });
  
  console.log('Veritas popup loaded');