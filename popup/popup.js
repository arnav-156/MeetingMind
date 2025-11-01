// ============================================
// Popup - Quick Settings & Actions
// ============================================

// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const openSidepanel = document.getElementById('open-sidepanel');
const quickStart = document.getElementById('quick-start');
const viewMeetings = document.getElementById('view-meetings');
const summaryInterval = document.getElementById('summary-interval');
const language = document.getElementById('language');
const autoStart = document.getElementById('auto-start');
const darkMode = document.getElementById('dark-mode');
const retentionDays = document.getElementById('retention-days');
const saveSettings = document.getElementById('save-settings');
const helpLink = document.getElementById('help-link');
const privacyLink = document.getElementById('privacy-link');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkStatus();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    
    if (result.settings) {
      summaryInterval.value = result.settings.summaryInterval || 5;
      language.value = result.settings.language || 'en';
      autoStart.checked = result.settings.autoStart || false;
      darkMode.checked = result.settings.darkMode !== undefined ? result.settings.darkMode : true;
      retentionDays.value = result.settings.retentionDays || 30;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings to storage
async function saveSettingsToStorage() {
  try {
    const settings = {
      summaryInterval: parseInt(summaryInterval.value),
      language: language.value,
      autoStart: autoStart.checked,
      darkMode: darkMode.checked,
      retentionDays: parseInt(retentionDays.value)
    };
    
    await chrome.storage.local.set({ settings });
    
    showNotification('✅ Settings saved!');
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('❌ Failed to save settings');
  }
}

// Check recording status
async function checkStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    
    if (response.isRecording) {
      updateStatus('recording');
    } else {
      updateStatus('idle');
    }
  } catch (error) {
    console.error('Error checking status:', error);
    updateStatus('idle');
  }
}

// Update status indicator
function updateStatus(status) {
  if (status === 'recording') {
    statusIndicator.classList.remove('bg-gray-400');
    statusIndicator.classList.add('bg-red-500');
    statusText.textContent = 'Recording';
    quickStart.textContent = '🛑 Stop Recording';
    quickStart.classList.remove('from-purple-600', 'to-indigo-600');
    quickStart.classList.add('bg-red-500');
  } else {
    statusIndicator.classList.remove('bg-red-500');
    statusIndicator.classList.add('bg-gray-400');
    statusText.textContent = 'Idle';
    quickStart.textContent = '🎙️ Start Recording';
    quickStart.classList.remove('bg-red-500');
    quickStart.classList.add('from-purple-600', 'to-indigo-600');
  }
}

// Setup event listeners
function setupEventListeners() {
  openSidepanel.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  });

  quickStart.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    
    if (response.isRecording) {
      await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
      showNotification('✅ Recording stopped');
      updateStatus('idle');
    } else {
      // Open side panel to start recording
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  });

  viewMeetings.addEventListener('click', () => {
    showNotification('📋 Feature coming soon!');
  });

  saveSettings.addEventListener('click', saveSettingsToStorage);

  helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/yourusername/meetingmind#readme' });
  });

  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('🔒 All data is stored locally on your device');
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 left-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

console.log('✅ Popup initialized');
