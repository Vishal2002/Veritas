// Save API key
document.getElementById('saveBtn')?.addEventListener('click', () => {
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
    chrome.storage.sync.set({ apiKey }, () => {
      alert('API Key saved!');
    });
  });
  
  // Analyze button
  document.getElementById('analyzeBtn')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'analyze' });
    }
  });
  
  // Auto-analyze toggle
  document.getElementById('autoAnalyze')?.addEventListener('change', (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    chrome.storage.sync.set({ autoAnalyze: enabled });
  });
  
  // Load saved API key and toggle
  chrome.storage.sync.get(['apiKey', 'autoAnalyze'], (result) => {
    if (result.apiKey) {
      (document.getElementById('apiKey') as HTMLInputElement).value = result.apiKey;
    }
    (document.getElementById('autoAnalyze') as HTMLInputElement).checked = result.autoAnalyze !== false;
  });