// ============================================
// Side Panel - Main UI Logic
// ============================================

// Import calendar integration utilities
import {
  generateFollowUpICS,
  downloadICSFile,
  generateCalendarNotes,
  copyToClipboard,
  createShareableLink,
  generateICSFilename,
  scheduleFollowUpReminders
} from '../utils/calendar-integration.js';

// Import Pre-Meeting Brief Manager
import { PreMeetingBriefManager } from '../utils/pre-meeting-brief-manager.js';

// ✨ Animation System Integration
// Access animation modules loaded from HTML
const animations = window.animations || {};

// Pre-Meeting Brief Manager
let briefManager = null;

let currentMeeting = null;
let currentMeetingId = null;
let transcripts = [];
let summaries = [];
let actionItems = [];
let isRecording = false;
let isPaused = false;
let autoScroll = true;
let startTime = null;
let durationInterval = null;
let analyticsInterval = null;

// Meeting Type Selection
let selectedMeetingType = 'GENERAL'; // Default

// Animation state tracking
let _previousMeetingIQScore = 0;
let _previousActionItemCount = 0;

// Performance optimization: Only render last N transcripts
const MAX_VISIBLE_TRANSCRIPTS = 50;
let transcriptOffset = 0;

// DOM Elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const pauseBtn = document.getElementById('pause-btn');
const summarizeBtn = document.getElementById('summarize-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const meetingInfo = document.getElementById('meeting-info');
const meetingTitle = document.getElementById('meeting-title');
const meetingDuration = document.getElementById('meeting-duration');
const meetingPlatform = document.getElementById('meeting-platform');
const transcriptList = document.getElementById('transcript-list');
const summaryContainer = document.getElementById('summary-container');
const actionItemsContainer = document.getElementById('action-items-container');
const actionCount = document.getElementById('action-count');
const autoScrollToggle = document.getElementById('auto-scroll-toggle');
const exportTxt = document.getElementById('export-txt');
const exportMd = document.getElementById('export-md');
const exportJson = document.getElementById('export-json');
const generateEmail = document.getElementById('generate-email');
const meetingTypeDropdown = document.getElementById('meeting-type-dropdown');
const meetingTypeHint = document.getElementById('meeting-type-hint');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎨 Side panel loaded');
  
  // Initialize Pre-Meeting Brief Manager
  try {
    briefManager = new PreMeetingBriefManager();
    await briefManager.initialize();
    console.log('📋 Pre-Meeting Brief Manager initialized');
  } catch (error) {
    console.error('❌ Error initializing brief manager:', error);
  }
  
  // Check current status
  await checkStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Check AI availability
  await checkAIAvailability();
  
  // Check AI status and update indicator
  checkAIStatus();
  
  // Initialize meeting type selector
  updateMeetingTypeHint();
  
  // Try to auto-detect meeting type from page title
  attemptAutoDetectMeetingType();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (briefManager) {
    briefManager.cleanup();
  }
});

// Set up event listeners
function setupEventListeners() {
  // Remove existing listeners first to prevent duplicates
  startBtn.removeEventListener('click', startRecording);
  stopBtn.removeEventListener('click', stopRecording);
  pauseBtn.removeEventListener('click', togglePause);
  summarizeBtn.removeEventListener('click', generateSummary);
  autoScrollToggle.removeEventListener('click', toggleAutoScroll);
  
  exportTxt.removeEventListener('click', exportTxtHandler);
  exportMd.removeEventListener('click', exportMdHandler);
  exportJson.removeEventListener('click', exportJsonHandler);
  generateEmail.removeEventListener('click', generateEmailDraft);
  
  // Add event listeners
  startBtn.addEventListener('click', startRecording);
  stopBtn.addEventListener('click', stopRecording);
  pauseBtn.addEventListener('click', togglePause);
  summarizeBtn.addEventListener('click', generateSummary);
  autoScrollToggle.addEventListener('click', toggleAutoScroll);
  
  exportTxt.addEventListener('click', exportTxtHandler);
  exportMd.addEventListener('click', exportMdHandler);
  exportJson.addEventListener('click', exportJsonHandler);
  generateEmail.addEventListener('click', generateEmailDraft);
  
  // Calendar integration buttons
  const calendarFollowupBtn = document.getElementById('calendar-followup');
  const calendarNotesBtn = document.getElementById('calendar-notes');
  const calendarShareBtn = document.getElementById('calendar-share');
  
  if (calendarFollowupBtn) {
    calendarFollowupBtn.removeEventListener('click', generateFollowUpMeeting);
    calendarFollowupBtn.addEventListener('click', generateFollowUpMeeting);
  }
  
  if (calendarNotesBtn) {
    calendarNotesBtn.removeEventListener('click', generateCalendarNotes);
    calendarNotesBtn.addEventListener('click', generateCalendarNotes);
  }
  
  if (calendarShareBtn) {
    calendarShareBtn.removeEventListener('click', shareTranscript);
    calendarShareBtn.addEventListener('click', shareTranscript);
  }
  
  // Meeting type dropdown
  if (meetingTypeDropdown) {
    meetingTypeDropdown.removeEventListener('change', handleMeetingTypeChange);
    meetingTypeDropdown.addEventListener('change', handleMeetingTypeChange);
  }
  
  // Keyboard shortcuts (global)
  document.removeEventListener('keydown', globalKeyboardHandler);
  document.addEventListener('keydown', globalKeyboardHandler);
}

// Share transcript function
async function shareTranscript() {
  try {
    console.log('📤 Sharing transcript...');
    showNotification('🔗 Share functionality coming soon!', 'info');
    // TODO: Implement sharing functionality
  } catch (error) {
    console.error('❌ Error sharing transcript:', error);
    showNotification('❌ Error sharing transcript', 'error');
  }
}

// Global keyboard shortcut handler (defined separately so it can be removed)
function globalKeyboardHandler(e) {
  // Don't trigger if user is typing in an input field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Ctrl/Cmd + R: Start/Stop recording
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    const isRecording = !startBtn.classList.contains('hidden');
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }
  // Ctrl/Cmd + S: Generate summary
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (transcripts.length > 0) {
      generateSummary();
    }
  }
  // Ctrl/Cmd + E: Export transcript
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    if (transcripts.length > 0) {
      exportTranscript('txt');
    }
  }
  // Ctrl/Cmd + K: Toggle auto-scroll
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    toggleAutoScroll();
  }
  // Ctrl/Cmd + P: Pause/Resume
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    if (!pauseBtn.classList.contains('hidden')) {
      togglePause();
    }
  }
}

// Export handlers (defined separately so they can be removed)
function exportTxtHandler() { exportTranscript('txt'); }
function exportMdHandler() { exportTranscript('md'); }
function exportJsonHandler() { exportTranscript('json'); }

// Check current recording status
async function checkStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    
    if (response && response.isRecording && response.meeting) {
      updateUIForRecording(response.meeting);
      
      // Get existing transcript
      const transcriptResponse = await chrome.runtime.sendMessage({ type: 'GET_TRANSCRIPT' });
      if (transcriptResponse && transcriptResponse.transcript) {
        transcripts = transcriptResponse.transcript;
        renderTranscripts();
      }
    }
  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

// Check AI availability
async function checkAIAvailability() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_AI_AVAILABILITY' });
    
    if (response.availability) {
      const { promptAPI, summarizerAPI, writerAPI } = response.availability;
      
      if (!promptAPI && !summarizerAPI) {
        showNotification('⚠️ Chrome AI APIs not available. Using fallback methods.', 'warning');
      }
    }
  } catch (error) {
    console.error('❌ Error checking AI availability:', error);
  }
}

// Start recording
async function startRecording() {
  try {
    showLoading(startBtn, true, 'Starting...');
    
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Verify we're on a supported platform
    const supportedDomains = ['meet.google.com', 'zoom.us', 'teams.microsoft.com'];
    const isSupported = supportedDomains.some(domain => tab.url.includes(domain));
    
    if (!isSupported) {
      showNotification('⚠️ Please open a Google Meet, Zoom, or Teams meeting first', 'warning');
      showLoading(startBtn, false);
      return;
    }
    
    // Get meeting info from content script
    let meetingData = {
      meetingTitle: 'Meeting',
      platform: 'unknown',
      tabId: tab.id,
      meetingType: selectedMeetingType // Include selected meeting type
    };
    
    try {
      const contentResponse = await chrome.tabs.sendMessage(tab.id, { 
        type: 'GET_MEETING_INFO' 
      });
      
      if (contentResponse) {
        meetingData = {
          meetingTitle: contentResponse.meetingTitle,
          platform: contentResponse.platform,
          tabId: tab.id,
          meetingType: selectedMeetingType // Include selected meeting type
        };
      }
    } catch (error) {
      console.warn('Could not get meeting info from content script:', error);
      showNotification('ℹ️ Meeting detection limited. Recording will still work.', 'info', 2000);
    }
    
    console.log('🎯 Starting recording with meeting type:', selectedMeetingType);
    
    // Send request to background script to start recording
    // Background script has proper context to capture the tab
    const response = await chrome.runtime.sendMessage({
      type: 'START_RECORDING',
      data: meetingData
    });
    
    showLoading(startBtn, false);
    
    if (response && response.success) {
      currentMeetingId = response.meetingId;
      updateUIForRecording(meetingData);
      
      // Show appropriate success message
      if (response.aiAvailable) {
        showNotification('✅ Recording started with Chrome AI!', 'success');
      } else {
        showNotification('✅ Recording started with Web Speech API', 'success');
      }
    } else {
      const errorMsg = response?.error || 'Unknown error';
      showNotification('❌ Failed to start recording: ' + errorMsg, 'error', 5000);
    }
    
  } catch (error) {
    console.error('❌ Error starting recording:', error);
    showNotification('❌ Error: ' + error.message, 'error');
    showLoading(startBtn, false);
  }
}

// Stop recording
async function stopRecording() {
  try {
    showLoading(stopBtn, true);
    
    const response = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    
    if (response && response.success) {
      updateUIForStopped();
      stopDurationTimer();
      showNotification('✅ Recording stopped', 'success');
    } else {
      showNotification('❌ Failed to stop recording', 'error');
    }
    
    showLoading(stopBtn, false);
    
  } catch (error) {
    console.error('❌ Error stopping recording:', error);
    showNotification('❌ Error: ' + error.message, 'error');
    showLoading(stopBtn, false);
  }
}

// Toggle pause
async function togglePause() {
  try {
    if (isPaused) {
      await chrome.runtime.sendMessage({ type: 'RESUME_RECORDING' });
      pauseBtn.textContent = '⏸️';
      pauseBtn.classList.remove('bg-green-500');
      pauseBtn.classList.add('bg-yellow-500');
      statusText.textContent = 'Recording';
      statusDot.classList.remove('bg-yellow-500');
      statusDot.classList.add('bg-red-500');
      isPaused = false;
    } else {
      await chrome.runtime.sendMessage({ type: 'PAUSE_RECORDING' });
      pauseBtn.textContent = '▶️';
      pauseBtn.classList.remove('bg-yellow-500');
      pauseBtn.classList.add('bg-green-500');
      statusText.textContent = 'Paused';
      statusDot.classList.remove('bg-red-500');
      statusDot.classList.add('bg-yellow-500');
      isPaused = true;
    }
  } catch (error) {
    console.error('❌ Error toggling pause:', error);
  }
}

// Generate summary manually
async function generateSummary() {
  try {
    showLoading(summarizeBtn, true);
    
    const response = await chrome.runtime.sendMessage({ type: 'GENERATE_SUMMARY' });
    
    if (response.success) {
      showNotification('✅ Summary generated!', 'success');
    } else {
      showNotification('❌ Failed to generate summary', 'error');
    }
    
    showLoading(summarizeBtn, false);
    
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    showLoading(summarizeBtn, false);
  }
}

// Toggle auto-scroll
function toggleAutoScroll() {
  autoScroll = !autoScroll;
  autoScrollToggle.textContent = `Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
  autoScrollToggle.classList.toggle('bg-purple-100');
  autoScrollToggle.classList.toggle('text-purple-700');
  
  // Update ARIA
  updateAutoScrollARIA();
}

// Update UI for recording state
function updateUIForRecording(meeting) {
  isRecording = true;
  
  startBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');
  pauseBtn.classList.remove('hidden');
  summarizeBtn.classList.remove('hidden');
  
  meetingInfo.classList.remove('hidden');
  meetingInfo.classList.add('active');
  meetingTitle.textContent = meeting.meetingTitle || meeting.title || 'Meeting';
  meetingPlatform.textContent = meeting.platform || 'Unknown';
  
  // Update status indicator with recording class
  const statusIndicator = document.getElementById('status-indicator');
  statusIndicator.classList.add('recording');
  statusText.textContent = 'Recording';
  
  // Enable export buttons
  exportTxt.disabled = false;
  exportMd.disabled = false;
  exportJson.disabled = false;
  generateEmail.disabled = false;
  
  // Enable calendar buttons
  updateCalendarButtonStates();
  
  // Start analytics tracking
  startAnalyticsTracking();
}

// Update UI for stopped state
function updateUIForStopped() {
  isRecording = false;
  
  startBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  pauseBtn.classList.add('hidden');
  summarizeBtn.classList.add('hidden');
  
  // Update status indicator
  const statusIndicator = document.getElementById('status-indicator');
  statusIndicator.classList.remove('recording');
  statusText.textContent = 'Stopped';
  
  // Stop analytics tracking
  stopAnalyticsTracking();
}

// Start duration timer
function startDurationTimer() {
  startTime = Date.now();
  durationInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    meetingDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// Stop duration timer
function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
  }
}

// Render transcripts
function renderTranscripts() {
  if (transcripts.length === 0) {
    transcriptList.innerHTML = `
      <div class="empty-state">
        <p>Waiting for audio...</p>
        <p style="font-size: var(--text-xs); margin-top: var(--space-2); color: var(--neutral-500);">Make sure you've granted microphone permissions</p>
      </div>
    `;
    return;
  }
  
  // Performance optimization: Only render last MAX_VISIBLE_TRANSCRIPTS items
  const startIndex = Math.max(0, transcripts.length - MAX_VISIBLE_TRANSCRIPTS);
  const visibleTranscripts = transcripts.slice(startIndex);
  
  // Show load more button if there are hidden transcripts
  const hasMore = startIndex > 0;
  
  // Helper to get speaker color based on speaker ID
  const getSpeakerColor = (speakerId) => {
    const colors = [
      '#8B5CF6', // purple-500
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // orange-500
      '#EC4899'  // pink-500
    ];
    const hash = (speakerId || '').split('_')[1] || 1;
    return colors[(hash - 1) % colors.length];
  };
  
  let html = '';
  
  if (hasMore) {
    html += `
      <div style="text-align: center; padding: var(--space-3); position: sticky; top: 0; background: var(--neutral-0); z-index: 10; border-bottom: 1px solid var(--neutral-200);">
        <button 
          id="load-more-btn"
          style="font-size: var(--text-xs); color: var(--primary-600); font-weight: var(--font-medium); background: none; border: none; cursor: pointer;">
          ⬆ Load ${startIndex} older transcripts
        </button>
      </div>
    `;
  }
  
  html += visibleTranscripts.map((t, index) => {
    const speakerColor = getSpeakerColor(t.speakerId);
    const isLatest = index === visibleTranscripts.length - 1;
    return `
      <div class="transcript-card ${isLatest ? 'latest' : ''}">
        <div class="transcript-header">
          <div class="transcript-meta">
            <span class="transcript-speaker" style="color: ${speakerColor};">${t.speaker || 'Speaker'}</span>
            <span class="transcript-time">${formatTime(t.timestamp)}</span>
            ${t.confidence ? `<span style="font-size: var(--text-xs); color: var(--neutral-400);" title="Confidence: ${Math.round(t.confidence * 100)}%">●</span>` : ''}
          </div>
          ${isLatest ? '<span class="badge badge-primary">Latest</span>' : ''}
        </div>
        <div class="transcript-text">${t.text}</div>
      </div>
    `;
  }).join('');
  
  transcriptList.innerHTML = html;
  
  // ✨ ANIMATION: Animate new transcript appearance
  if (animations.transcript && visibleTranscripts.length > 0) {
    const transcriptCards = transcriptList.querySelectorAll('.transcript-card');
    const latestCard = transcriptCards[transcriptCards.length - 1];
    
    if (latestCard && latestCard.classList.contains('latest')) {
      const latestTranscript = transcripts[transcripts.length - 1];
      animations.transcript.animateNewTranscript(
        latestCard,
        latestTranscript.text,
        autoScroll
      );
      
      // Flash highlight on new text
      animations.transcript.flashHighlight(latestCard);
    }
  }
  
  // Add event listener for load more button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreTranscripts);
  }
  
  if (autoScroll) {
    const container = document.getElementById('transcript-container');
    
    // ✨ ANIMATION: Smooth scroll to bottom
    if (animations.transcript) {
      animations.transcript.smoothScrollToElement(container.lastElementChild);
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }
}

// Load more transcripts (performance optimization)
function loadMoreTranscripts() {
  // Simply re-render with increased limit
  // In a more advanced implementation, this would load from storage
  const container = document.getElementById('transcript-container');
  const scrollPos = container.scrollTop;
  
  // Double the visible limit temporarily
  const originalMax = MAX_VISIBLE_TRANSCRIPTS;
  window.MAX_VISIBLE_TRANSCRIPTS = transcripts.length; // Show all
  renderTranscripts();
  
  // Restore scroll position
  setTimeout(() => {
    container.scrollTop = scrollPos + 100; // Add offset for the "load more" button
  }, 0);
}

// Add new transcript entry
function addTranscript(transcript) {
  transcripts.push(transcript);
  renderTranscripts();
}

// Render summaries
function renderSummaries() {
  if (summaries.length === 0) {
    summaryContainer.innerHTML = `
      <div class="empty-state">
        <p>Summaries will be generated automatically every 5 minutes</p>
      </div>
    `;
    return;
  }
  
  summaryContainer.innerHTML = summaries.map(s => `
    <div class="summary-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid var(--neutral-100);">
        <span class="badge badge-primary">Summary</span>
        <span style="font-size: var(--text-xs); color: var(--neutral-500);">${formatTime(s.timestamp)}</span>
      </div>
      <div style="font-size: var(--text-sm); color: var(--neutral-800); line-height: var(--leading-relaxed); white-space: pre-wrap;">${s.text || s.summary}</div>
      ${s.keyMoments && s.keyMoments.length > 0 ? `
        <div style="margin-top: var(--space-3);">
          <p style="font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--neutral-700); margin-bottom: var(--space-2);">Key Moments:</p>
          ${s.keyMoments.map(km => `
            <p style="font-size: var(--text-xs); color: var(--neutral-600); margin-bottom: var(--space-1); padding-left: var(--space-4); position: relative;">
              <span style="position: absolute; left: 0; top: 8px; width: 4px; height: 4px; background: var(--primary-500); border-radius: var(--radius-full);"></span>
              ${km}
            </p>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Add new summary
function addSummary(summary) {
  summaries.push(summary);
  renderSummaries();
}

// Render action items
function renderActionItems() {
  actionCount.textContent = `${actionItems.length} item${actionItems.length !== 1 ? 's' : ''}`;
  
  if (actionItems.length === 0) {
    actionItemsContainer.innerHTML = `
      <div class="empty-state">
        <p>Action items will be detected automatically</p>
      </div>
    `;
    return;
  }
  
  // Check for highlighted item from notification
  chrome.storage.session.get(['highlightActionItem'], (result) => {
    const highlightId = result.highlightActionItem;
    if (highlightId) {
      // Clear highlight request
      chrome.storage.session.remove(['highlightActionItem']);
    }
    
    actionItemsContainer.innerHTML = actionItems.map((item, index) => {
      // Support both old and new formats
      const who = item.who || item.assignee || 'Unassigned';
      const task = item.task || item.text || 'No task description';
      const due = item.due || item.deadline || null;
      const priority = item.priority || 'medium';
      const status = item.status || 'pending';
      const isHighlighted = item.id === highlightId;
      
      // Get emoji for assignee type
      const whoEmoji = who === 'Unassigned' ? '👤' : who === 'Team' ? '👥' : '👤';
      
      // Get due date styling
      const hasDue = due && due !== 'Not specified';
      const dueClass = hasDue ? (due.toLowerCase().includes('today') || due.toLowerCase().includes('eod') ? 'urgent' : '') : '';
      
      return `
        <div class="action-item ${status === 'completed' ? 'completed' : ''} ${priority === 'high' ? 'priority-high' : priority === 'medium' ? 'priority-medium' : ''} ${isHighlighted ? 'highlighted-item' : ''}" data-item-id="${item.id}">
          <div class="action-checkbox-wrapper" data-action-index="${index}" style="width: 20px; height: 20px; border: 2px solid var(--neutral-300); border-radius: var(--radius-sm); cursor: pointer; flex-shrink: 0; margin-top: 2px; position: relative; ${status === 'completed' ? 'background: var(--primary-500); border-color: var(--primary-500);' : ''}">
            ${status === 'completed' ? '<span style="position: absolute; color: white; font-size: 14px; top: -2px; left: 2px;">✓</span>' : ''}
          </div>
          <div style="flex: 1;">
            <div style="font-size: var(--text-sm); color: var(--neutral-900); margin-bottom: var(--space-2); font-weight: var(--font-medium); ${status === 'completed' ? 'text-decoration: line-through; color: var(--neutral-500);' : ''}">${task}</div>
            <div style="display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-2);">
              <span class="badge badge-primary" style="display: inline-flex; align-items: center; gap: 4px;">
                <span>${whoEmoji}</span>
                <span>${who}</span>
              </span>
              ${hasDue ? `
                <span class="badge ${dueClass === 'urgent' ? 'badge-error' : 'badge-info'}" style="display: inline-flex; align-items: center; gap: 4px; background: var(--${dueClass === 'urgent' ? 'error' : 'info'}-50); color: var(--${dueClass === 'urgent' ? 'error' : 'info'}-600);">
                  <span>📅</span>
                  <span>${due}</span>
                </span>
              ` : ''}
              ${hasDue && status !== 'completed' ? `
                <span class="badge" style="display: inline-flex; align-items: center; gap: 4px; background: var(--success-50); color: var(--success-600); font-size: 10px;">
                  <span>⏰</span>
                  <span>Reminder set</span>
                </span>
              ` : ''}
            </div>
            ${status !== 'completed' ? `
              <button class="mark-done-btn" data-action-id="${item.id}" style="font-size: var(--text-xs); padding: 4px 8px; border-radius: var(--radius-sm); background: var(--success-500); color: white; border: none; cursor: pointer; font-weight: var(--font-medium); transition: all 0.2s;">
                ✓ Mark Done
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    // ✨ ANIMATION: Animate new action items
    if (animations.actionItem) {
      const actionCards = actionItemsContainer.querySelectorAll('.action-item');
      const badgeCounter = document.getElementById('action-count');
      
      // Check for newly added items
      const newItemsCount = actionItems.length - _previousActionItemCount;
      
      if (newItemsCount > 0 && _previousActionItemCount > 0) {
        // Animate badge increment
        animations.actionItem.animateBadgeIncrement(badgeCounter);
        
        // Animate the newest items
        const newCards = Array.from(actionCards).slice(-newItemsCount);
        newCards.forEach(card => {
          animations.actionItem.animateNewActionItem(card, badgeCounter);
        });
      }
      
      // Track count for next render
      _previousActionItemCount = actionItems.length;
    }
    
    // Add event listeners for checkboxes
    document.querySelectorAll('.action-checkbox-wrapper').forEach(checkbox => {
      checkbox.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-action-index'));
        const item = actionItems[index];
        if (item) {
          // ✨ ANIMATION: Animate completion
          if (animations.actionItem && item.status !== 'completed') {
            const card = this.closest('.action-item');
            const textEl = card.querySelector('div[style*="font-weight"]');
            
            animations.actionItem.animateCompletion(
              this,
              card,
              textEl,
              () => {
                toggleActionItem(item.id);
                
                // Check if all completed
                const allComplete = actionItems.every(i => i.status === 'completed');
                if (allComplete && actionItems.length > 0) {
                  animations.actionItem.celebrateAllCompleted(
                    actionItems.length,
                    actionItems.length,
                    actionItemsContainer
                  );
                }
              }
            );
          } else {
            toggleActionItem(item.id);
          }
        }
      });
    });
    
    // Add event listeners for Mark Done buttons
    document.querySelectorAll('.mark-done-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const itemId = this.getAttribute('data-action-id');
        toggleActionItem(itemId);
      });
      
      // Hover effect
      btn.addEventListener('mouseenter', function() {
        this.style.background = 'var(--success-600)';
        this.style.transform = 'scale(1.05)';
      });
      
      btn.addEventListener('mouseleave', function() {
        this.style.background = 'var(--success-500)';
        this.style.transform = 'scale(1)';
      });
    });
    
    // Scroll to highlighted item if exists
    if (highlightId) {
      setTimeout(() => {
        const highlightedEl = document.querySelector('.highlighted-item');
        if (highlightedEl) {
          highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Remove highlight after 3 seconds
          setTimeout(() => {
            highlightedEl.classList.remove('highlighted-item');
          }, 3000);
        }
      }, 100);
    }
  });
}

// Add new action items
function addActionItems(items) {
  actionItems.push(...items);
  renderActionItems();
}

// Toggle action item status
window.toggleActionItem = async (id) => {
  const item = actionItems.find(a => a.id === id);
  if (item) {
    item.status = item.status === 'completed' ? 'pending' : 'completed';
    renderActionItems();
    
    // Update in background
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_ACTION_ITEM',
        data: { id, status: item.status }
      });
    } catch (error) {
      console.error('Error updating action item:', error);
    }
  }
};

// Export transcript
async function exportTranscript(format) {
  try {
    let content = '';
    let filename = '';
    let mimeType = '';
    
    const meetingName = currentMeeting ? (meetingTitle.textContent || 'Meeting') : 'Meeting';
    const date = new Date().toISOString().split('T')[0];
    
    if (format === 'txt') {
      content = generateTxtExport();
      filename = `${meetingName}_${date}.txt`;
      mimeType = 'text/plain';
    } else if (format === 'md') {
      content = generateMarkdownExport();
      filename = `${meetingName}_${date}.md`;
      mimeType = 'text/markdown';
    } else if (format === 'json') {
      content = JSON.stringify({
        meeting: currentMeeting,
        title: meetingName,
        date: date,
        transcripts: transcripts,
        summaries: summaries,
        actionItems: actionItems
      }, null, 2);
      filename = `${meetingName}_${date}.json`;
      mimeType = 'application/json';
    }
    
    downloadFile(content, filename, mimeType);
    showNotification(`✅ Exported as ${format.toUpperCase()}`, 'success');
    
  } catch (error) {
    console.error('Error exporting:', error);
    showNotification('❌ Export failed', 'error');
  }
}

// Generate TXT export
function generateTxtExport() {
  let content = '';
  content += `Meeting: ${meetingTitle.textContent}\n`;
  content += `Date: ${new Date().toLocaleString()}\n`;
  content += `Platform: ${meetingPlatform.textContent}\n`;
  content += `\n${'='.repeat(50)}\n\n`;
  
  content += `TRANSCRIPT\n`;
  content += `${'='.repeat(50)}\n\n`;
  transcripts.forEach(t => {
    content += `[${formatTime(t.timestamp)}] ${t.speaker}: ${t.text}\n\n`;
  });
  
  if (summaries.length > 0) {
    content += `\n${'='.repeat(50)}\n`;
    content += `SUMMARIES\n`;
    content += `${'='.repeat(50)}\n\n`;
    summaries.forEach(s => {
      content += `[${formatTime(s.timestamp)}]\n${s.text || s.summary}\n\n`;
    });
  }
  
  if (actionItems.length > 0) {
    content += `\n${'='.repeat(50)}\n`;
    content += `ACTION ITEMS\n`;
    content += `${'='.repeat(50)}\n\n`;
    actionItems.forEach(item => {
      content += `[ ] ${item.task} (${item.assignee})\n`;
    });
  }
  
  return content;
}

// Generate Markdown export
function generateMarkdownExport() {
  let content = '';
  content += `# ${meetingTitle.textContent}\n\n`;
  content += `**Date:** ${new Date().toLocaleString()}\n`;
  content += `**Platform:** ${meetingPlatform.textContent}\n\n`;
  content += `---\n\n`;
  
  content += `## 📝 Transcript\n\n`;
  transcripts.forEach(t => {
    content += `**[${formatTime(t.timestamp)}] ${t.speaker}:** ${t.text}\n\n`;
  });
  
  if (summaries.length > 0) {
    content += `\n## 📊 Summaries\n\n`;
    summaries.forEach(s => {
      content += `### ${formatTime(s.timestamp)}\n\n`;
      content += `${s.text || s.summary}\n\n`;
    });
  }
  
  if (actionItems.length > 0) {
    content += `\n## ✅ Action Items\n\n`;
    actionItems.forEach(item => {
      content += `- [ ] **${item.task}** (${item.assignee}) - ${item.priority}\n`;
    });
  }
  
  return content;
}

// Generate email draft
async function generateEmailDraft() {
  try {
    showLoading(generateEmail, true);
    
    const response = await chrome.runtime.sendMessage({ type: 'GENERATE_EMAIL' });
    
    if (response.success && response.email) {
      // Format email with proper structure
      const emailContent = `Subject: ${response.email.subject}\n\n${response.email.body}`;
      
      // Show email preview modal
      showEmailPreviewModal(response.email.subject, response.email.body);
      
      // Also copy to clipboard immediately
      await navigator.clipboard.writeText(emailContent);
      showNotification('✅ Email draft generated & copied to clipboard!', 'success');
      
      console.log('📧 Email generated:', {
        subject: response.email.subject,
        bodyLength: response.email.body.length
      });
    } else {
      showNotification('❌ Failed to generate email', 'error');
    }
    
    showLoading(generateEmail, false);
    
  } catch (error) {
    console.error('Error generating email:', error);
    showNotification('❌ Error: ' + error.message, 'error');
    showLoading(generateEmail, false);
  }
}

// Show email preview modal
function showEmailPreviewModal(subject, body) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: var(--space-4);
    animation: fadeIn 0.2s;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: var(--neutral-0);
    border-radius: var(--radius-lg);
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
  `;
  
  modalContent.innerHTML = `
    <div style="padding: var(--space-4); border-bottom: 1px solid var(--neutral-200); display: flex; align-items: center; justify-content: space-between;">
      <h3 style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--neutral-900); display: flex; align-items: center; gap: var(--space-2);">
        <span>📧</span>
        <span>Follow-up Email Draft</span>
      </h3>
      <button id="close-email-modal" style="background: none; border: none; font-size: 24px; color: var(--neutral-500); cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); transition: all 0.2s;">×</button>
    </div>
    
    <div style="flex: 1; overflow-y: auto; padding: var(--space-4);">
      <div style="margin-bottom: var(--space-4);">
        <div style="font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--neutral-600); margin-bottom: var(--space-1);">SUBJECT:</div>
        <div style="font-size: var(--text-base); font-weight: var(--font-medium); color: var(--neutral-900); padding: var(--space-2); background: var(--neutral-50); border-radius: var(--radius-sm);">${subject}</div>
      </div>
      
      <div>
        <div style="font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--neutral-600); margin-bottom: var(--space-1);">BODY:</div>
        <div style="font-size: var(--text-sm); color: var(--neutral-800); line-height: 1.6; white-space: pre-wrap; padding: var(--space-3); background: var(--neutral-50); border-radius: var(--radius-sm);">${body}</div>
      </div>
    </div>
    
    <div style="padding: var(--space-4); border-top: 1px solid var(--neutral-200); display: flex; gap: var(--space-2);">
      <button id="copy-email-again" class="btn btn-primary" style="flex: 1;">
        <span>📋</span>
        <span>Copy Again</span>
      </button>
      <button id="close-email-modal-2" class="btn btn-secondary" style="flex: 1; background: var(--neutral-200); color: var(--neutral-700);">
        <span>Close</span>
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Event listeners
  const closeModal = () => {
    modal.style.animation = 'fadeOut 0.2s';
    setTimeout(() => modal.remove(), 200);
  };
  
  document.getElementById('close-email-modal').onclick = closeModal;
  document.getElementById('close-email-modal-2').onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
  
  document.getElementById('copy-email-again').onclick = async () => {
    const emailContent = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(emailContent);
    showNotification('✅ Copied to clipboard!', 'success');
  };
  
  // Close button hover effect
  const closeBtn = document.getElementById('close-email-modal');
  closeBtn.onmouseenter = () => {
    closeBtn.style.background = 'var(--neutral-200)';
    closeBtn.style.color = 'var(--neutral-800)';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = 'var(--neutral-500)';
  };
  
  // Add keydown listener for escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Download file
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Utility: Convert blob to base64
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Utility: Format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
}

// Utility: Get priority color
function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}

// Utility: Copy to clipboard
window.copyToClipboard = async function(text, successMessage = 'Copied!') {
  try {
    // Unescape HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    const cleanText = textarea.value;
    
    await navigator.clipboard.writeText(cleanText);
    showNotification(successMessage, 'success', 2000);
  } catch (error) {
    console.error('Copy failed:', error);
    showNotification('❌ Failed to copy', 'error');
  }
};

// Utility: Escape HTML for safe insertion
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
}

// Check AI Status
async function checkAIStatus() {
  const statusDot = document.getElementById('ai-status-dot');
  const statusText = document.getElementById('ai-status-text');
  const statusContainer = document.getElementById('ai-status-indicator');
  
  try {
    const hasChromeAI = 'ai' in window && 'languageModel' in window.ai;
    const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (hasChromeAI) {
      // Chrome AI available
      statusDot.className = 'w-2 h-2 rounded-full bg-green-500 animate-pulse';
      statusText.textContent = 'Chrome AI';
      statusText.className = 'text-xs font-medium text-green-700';
      statusContainer.className = 'flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full';
      statusContainer.title = 'Chrome Built-in AI active';
    } else if (hasWebSpeech) {
      // Web Speech API fallback
      statusDot.className = 'w-2 h-2 rounded-full bg-blue-500';
      statusText.textContent = 'Web Speech';
      statusText.className = 'text-xs font-medium text-blue-700';
      statusContainer.className = 'flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full';
      statusContainer.title = 'Using Web Speech API (Chrome AI not available)';
    } else {
      // No AI available
      statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
      statusText.textContent = 'No AI';
      statusText.className = 'text-xs font-medium text-red-700';
      statusContainer.className = 'flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full';
      statusContainer.title = 'No AI capabilities detected';
    }
  } catch (error) {
    console.error('AI status check failed:', error);
    statusDot.className = 'w-2 h-2 rounded-full bg-gray-400';
    statusText.textContent = 'Unknown';
    statusText.className = 'text-xs text-gray-600';
    statusContainer.className = 'flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full';
  }
}

// Utility: Show loading state - ENHANCED
function showLoading(button, loading, message = '') {
  if (loading) {
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.cursor = 'not-allowed';
    
    // Add spinner if not exists
    if (!button.querySelector('.loading-spinner')) {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner inline-block ml-2';
      button.appendChild(spinner);
    }
    
    // Store original text
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    
    // Show loading message if provided
    if (message) {
      const textNode = Array.from(button.childNodes).find(n => n.nodeType === 3);
      if (textNode) textNode.textContent = message + ' ';
    }
  } else {
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
    
    // Remove spinner
    const spinner = button.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
    
    // Restore original text
    if (button.dataset.originalText) {
      const textNode = Array.from(button.childNodes).find(n => n.nodeType === 3);
      if (textNode) textNode.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

// Utility: Show notification with improved UX
function showNotification(message, type = 'info', duration = 3000) {
  // Remove any existing notifications
  document.querySelectorAll('.mm-notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = `mm-notification ${type}`;
  
  // Add icon based on type
  const icon = type === 'success' ? '✅' : 
               type === 'error' ? '❌' : 
               type === 'warning' ? '⚠️' : 'ℹ️';
  
  const messageSpan = document.createElement('span');
  messageSpan.style.fontSize = 'var(--text-lg)';
  messageSpan.textContent = icon;
  
  const textSpan = document.createElement('span');
  textSpan.style.flex = '1';
  textSpan.textContent = message;
  
  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => notification.remove());
  
  notification.appendChild(messageSpan);
  notification.appendChild(textSpan);
  notification.appendChild(closeBtn);
  
  document.body.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100px)';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Side panel received message:', message.type);
  
  switch (message.type) {
    case 'NEW_TRANSCRIPT':
      addTranscript(message.data);
      // Update analytics after each transcript
      if (isRecording) {
        updateAnalytics();
      }
      // Enable calendar buttons after first transcript
      updateCalendarButtonStates();
      break;
      
    case 'NEW_SUMMARY':
      addSummary(message.data);
      break;
      
    case 'NEW_ACTION_ITEMS':
      addActionItems(message.data);
      break;
      
    case 'RECORDING_STARTED':
      updateUIForRecording(message.meeting);
      break;
      
    case 'RECORDING_STOPPED':
      updateUIForStopped();
      break;
      
    case 'MEETING_IQ_UPDATE':
      updateMeetingIQUI(message.data);
      break;
      
    case 'MEETING_IQ_FINAL_REPORT':
      showFinalIQReport(message.data);
      break;
      
    case 'MEETING_TYPE_SUGGESTION':
      showMeetingTypeSuggestion(message.data);
      break;
  }
  
  return true;
});

// ============================================
// Analytics Functions
// ============================================

async function updateAnalytics() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_ANALYTICS'
    });

    if (response && response.success && response.analytics) {
      displayAnalytics(response.analytics);
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }
}

function displayAnalytics(analytics) {
  const analyticsSection = document.getElementById('analytics-section');
  analyticsSection.classList.remove('hidden');

  const { statistics, wordCloud, distribution } = analytics;

  if (!statistics) return;

  // Update duration & stats
  document.getElementById('analytics-duration').textContent = statistics.duration.formatted || '0m 0s';
  document.getElementById('analytics-words').textContent = statistics.words.total || 0;
  document.getElementById('analytics-speakers').textContent = statistics.speakers.count || 0;

  // Update speaker bars
  const speakerBars = document.getElementById('speaker-bars');
  if (distribution && distribution.length > 0) {
    speakerBars.innerHTML = distribution.map(speaker => `
      <div class="speaker-bar">
        <div class="speaker-name" style="color: ${speaker.color}">${speaker.name}</div>
        <div class="speaker-progress">
          <div class="speaker-progress-fill" style="width: ${speaker.percentage}%; background-color: ${speaker.color}"></div>
        </div>
        <div class="speaker-percentage">${speaker.percentage}%</div>
      </div>
    `).join('');
  } else {
    speakerBars.innerHTML = '<p style="font-size: var(--text-xs); color: var(--neutral-400);">No speaker data yet...</p>';
  }

  // Update word cloud
  const wordCloudContainer = document.getElementById('word-cloud');
  if (wordCloud && wordCloud.length > 0) {
    wordCloudContainer.innerHTML = wordCloud.map(item => `
      <span class="word-cloud-item" style="font-size: ${item.size}px; opacity: ${0.5 + item.weight * 0.5}; color: ${getRandomColor()}; font-weight: var(--font-semibold);" 
            title="${item.count} times">
        ${item.word}
      </span>
    `).join('');
  } else {
    wordCloudContainer.innerHTML = '<p style="font-size: var(--text-xs); color: var(--neutral-400);">Word cloud will appear as you speak...</p>';
  }

  // Update most active speaker
  if (statistics.speakers.mostActive) {
    const mostActiveContainer = document.getElementById('most-active-container');
    mostActiveContainer.classList.remove('hidden');
    document.getElementById('most-active-speaker').textContent = statistics.speakers.mostActive.name;
    document.getElementById('most-active-stats').textContent = 
      `${statistics.speakers.mostActive.wordCount} words (${statistics.speakers.mostActive.percentage}%)`;
  }
}

function getRandomColor() {
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function startAnalyticsTracking() {
  // Show analytics section
  document.getElementById('analytics-section').classList.remove('hidden');
  
  // Update analytics every 5 seconds
  analyticsInterval = setInterval(updateAnalytics, 5000);
  
  // Initial update
  updateAnalytics();
}

function stopAnalyticsTracking() {
  if (analyticsInterval) {
    clearInterval(analyticsInterval);
    analyticsInterval = null;
  }
  
  // One final update
  updateAnalytics();
}

// ============================================
// Meeting IQ Functions
// ============================================

/**
 * Update Meeting IQ UI with new score data
 */
function updateMeetingIQUI(iqData) {
  if (!iqData || !iqData.isReady) {
    return; // Don't show UI until score is ready
  }

  console.log('🧠 Updating Meeting IQ UI:', iqData.overallScore);

  // Show Meeting IQ section
  const iqSection = document.getElementById('meeting-iq-section');
  if (iqSection) {
    iqSection.style.display = 'block';
  }

  // Update meeting type badge
  if (iqData.meetingType && iqData.meetingTypeIcon && iqData.meetingTypeName) {
    const badge = document.getElementById('meeting-type-badge');
    const badgeIcon = document.getElementById('meeting-type-badge-icon');
    const badgeName = document.getElementById('meeting-type-badge-name');
    
    if (badge && badgeIcon && badgeName) {
      badgeIcon.textContent = iqData.meetingTypeIcon;
      badgeName.textContent = iqData.meetingTypeName;
      badge.style.display = 'inline-flex';
    }
  }

  // ✨ ANIMATION: Animate score update
  const scoreEl = document.getElementById('iq-score');
  const oldScore = _previousMeetingIQScore || 0;
  const newScore = iqData.overallScore;
  
  if (scoreEl && animations.meetingIQ && oldScore !== newScore) {
    const progressEl = document.getElementById('iq-progress');
    
    // Animate score with number counting and ring animation
    animations.meetingIQ.animateScoreUpdate(
      scoreEl,
      oldScore,
      newScore,
      progressEl
    );
    
    // Check for milestone celebrations
    animations.meetingIQ.checkMilestone(
      newScore,
      document.getElementById('meeting-iq-widget')
    );
    
    // Show change indicator if score increased
    if (newScore > oldScore) {
      animations.meetingIQ.showScoreChange(scoreEl, newScore - oldScore);
      
      // Celebrate improvement
      if (newScore - oldScore >= 10) {
        animations.meetingIQ.celebrateImprovement(scoreEl);
      }
    }
  }
  
  // Track for next update
  _previousMeetingIQScore = newScore;

  // Update main score (if not animated)
  if (scoreEl && !animations.meetingIQ) {
    scoreEl.textContent = newScore;
    
    // Remove all existing classes
    scoreEl.className = 'iq-score';
    
    // Add color class based on score
    if (newScore >= 81) {
      scoreEl.classList.add('excellent');
    } else if (newScore >= 61) {
      scoreEl.classList.add('good');
    } else if (newScore >= 41) {
      scoreEl.classList.add('needs-work');
    } else {
      scoreEl.classList.add('poor');
    }
  }

  // Update trend indicator
  const trendEl = document.getElementById('iq-trend');
  if (trendEl && iqData.trend !== undefined) {
    if (iqData.trend > 0) {
      trendEl.textContent = `↑ +${iqData.trend}`;
      trendEl.className = 'iq-trend positive';
    } else if (iqData.trend < 0) {
      trendEl.textContent = `↓ ${iqData.trend}`;
      trendEl.className = 'iq-trend negative';
    } else {
      trendEl.textContent = '→ 0';
      trendEl.className = 'iq-trend neutral';
    }
  }

  // Update rating text
  const ratingEl = document.getElementById('iq-rating');
  if (ratingEl) {
    const rating = getScoreRating(iqData.overallScore);
    ratingEl.textContent = rating;
  }

  // Update progress bar
  const progressEl = document.getElementById('iq-progress');
  if (progressEl) {
    progressEl.style.width = `${iqData.overallScore}%`;
    
    // Remove all existing classes
    progressEl.className = 'iq-progress-fill';
    
    // Add color class
    if (iqData.overallScore >= 81) {
      progressEl.classList.add('excellent');
    } else if (iqData.overallScore >= 61) {
      progressEl.classList.add('good');
    } else if (iqData.overallScore >= 41) {
      progressEl.classList.add('needs-work');
    } else {
      progressEl.classList.add('poor');
    }
  }

  // Update primary insight
  const insightTextEl = document.getElementById('iq-insight-text');
  if (insightTextEl && iqData.insights && iqData.insights.length > 0) {
    const insight = iqData.insights[0];
    insightTextEl.textContent = `${insight.message} → ${insight.action}`;
  }

  // Update dimension scores
  if (iqData.breakdown) {
    updateDimensionScores(iqData.breakdown);
  }

  // Update additional insights
  if (iqData.insights) {
    updateAdditionalInsights(iqData.insights);
  }

  // Update meeting stats
  if (iqData.meetingData) {
    console.log('📊 Meeting stats:', iqData.meetingData);
  }
}

/**
 * Get human-readable score rating
 */
function getScoreRating(score) {
  if (score >= 81) return 'Excellent! 🟢';
  if (score >= 61) return 'Good 🔵';
  if (score >= 41) return 'Needs Work 🟠';
  return 'Poor 🔴';
}

/**
 * Update individual dimension scores and progress bars
 */
function updateDimensionScores(dimensions) {
  const dimensionKeys = {
    participation: 'participation',
    focus: 'focus',
    actions: 'actions',
    decisions: 'decisions',
    engagement: 'engagement',
    efficiency: 'efficiency'
  };

  Object.keys(dimensionKeys).forEach(key => {
    const dim = dimensions[key];
    if (!dim) return;

    // Update score text
    const scoreEl = document.getElementById(`iq-${key}-score`);
    if (scoreEl) {
      scoreEl.textContent = `${Math.round(dim.score)}/100`;
    }

    // Update progress bar
    const barEl = document.getElementById(`iq-${key}-bar`);
    if (barEl) {
      barEl.style.width = `${Math.round(dim.score)}%`;
    }
  });
}

/**
 * Update additional insights list
 */
function updateAdditionalInsights(insights) {
  const container = document.getElementById('iq-additional-insights');
  if (!container) return;

  container.innerHTML = '';

  // Show insights 2-4 (skip first one as it's shown as primary)
  const additionalInsights = insights.slice(1, 4);
  
  if (additionalInsights.length === 0) {
    container.innerHTML = '<p style="font-size: var(--text-xs); color: var(--neutral-400); text-align: center; padding: var(--space-3);">All looking good! Keep it up! 🎉</p>';
    return;
  }

  additionalInsights.forEach(insight => {
    const insightEl = document.createElement('div');
    insightEl.className = `iq-insight-item ${insight.type}`;
    
    // Create content
    const iconMap = {
      success: '✅',
      warning: '⚠️',
      critical: '🚨',
      info: '💡'
    };
    
    const icon = iconMap[insight.type] || '💡';
    insightEl.innerHTML = `<strong>${icon} ${insight.message}</strong><br><span style="font-size: var(--text-xs);">${insight.action}</span>`;
    
    container.appendChild(insightEl);
  });
}

/**
 * Show final Meeting IQ report (when recording stops)
 */
function showFinalIQReport(report) {
  console.log('📊 Final Meeting IQ Report:', report);
  
  // Show a notification with the final score
  showNotification(
    `Meeting IQ Final Score: ${report.finalScore}/100 ${report.emoji}`,
    'success'
  );

  // Update UI one last time
  if (report.overallScore !== undefined) {
    updateMeetingIQUI(report);
  }
}

/**
 * Show AI-powered meeting type suggestion
 */
function showMeetingTypeSuggestion(data) {
  console.log('🤖 AI Meeting Type Suggestion:', data);
  
  const suggestionBanner = document.getElementById('meeting-type-suggestion');
  const suggestedTypeEl = document.getElementById('suggested-type-name');
  const confidenceEl = document.getElementById('suggestion-confidence');
  const reasoningEl = document.getElementById('suggestion-reason');
  
  if (!suggestionBanner || !suggestedTypeEl || !confidenceEl || !reasoningEl) {
    console.error('Suggestion UI elements not found');
    return;
  }
  
  // Store suggestion data for accept handler
  suggestionBanner.dataset.suggestedType = data.suggestedType;
  suggestionBanner.dataset.currentType = data.currentType;
  
  // Get the friendly name for the suggested type
  const typeConfig = MEETING_TYPE_DESCRIPTIONS[data.suggestedType];
  const typeName = typeConfig ? typeConfig.name : data.suggestedType;
  
  // Update banner content
  suggestedTypeEl.textContent = typeName;
  confidenceEl.textContent = `(${Math.round(data.confidence)}% confident)`;
  reasoningEl.textContent = `Based on: ${data.reasoning}`;
  
  // Show the banner with animation
  suggestionBanner.classList.remove('hidden');
  
  // Auto-hide after 15 seconds if no action taken
  setTimeout(() => {
    if (!suggestionBanner.classList.contains('hidden')) {
      rejectTypeSuggestion();
    }
  }, 15000);
}

/**
 * Accept the AI-suggested meeting type
 */
function acceptTypeSuggestion() {
  const suggestionBanner = document.getElementById('meeting-type-suggestion');
  if (!suggestionBanner) return;
  
  const suggestedType = suggestionBanner.dataset.suggestedType;
  if (!suggestedType) return;
  
  console.log(`✅ Accepting AI suggestion: ${suggestedType}`);
  
  // Update the dropdown
  const meetingTypeDropdown = document.getElementById('meeting-type-select');
  if (meetingTypeDropdown) {
    meetingTypeDropdown.value = suggestedType;
  }
  
  // Update the selected type
  selectedMeetingType = suggestedType;
  
  // Update hint text with optimized weights
  updateMeetingTypeHint();
  
  // Notify background to update Meeting IQ Engine
  chrome.runtime.sendMessage({
    type: 'CHANGE_MEETING_TYPE',
    meetingType: suggestedType
  }).catch(err => console.warn('Failed to notify background:', err));
  
  // Hide the banner
  suggestionBanner.classList.add('hidden');
  
  // Show success notification
  const typeConfig = MEETING_TYPE_DESCRIPTIONS[suggestedType];
  const typeName = typeConfig ? typeConfig.name : suggestedType;
  showNotification(`✨ Switched to ${typeName} - scoring optimized!`, 'success');
}

/**
 * Reject the AI-suggested meeting type
 */
function rejectTypeSuggestion() {
  const suggestionBanner = document.getElementById('meeting-type-suggestion');
  if (!suggestionBanner) return;
  
  console.log('❌ Rejecting AI suggestion');
  
  // Hide the banner
  suggestionBanner.classList.add('hidden');
  
  // Clear stored data
  delete suggestionBanner.dataset.suggestedType;
  delete suggestionBanner.dataset.currentType;
}

/**
 * Toggle Meeting IQ details view
 */
function toggleMeetingIQDetails() {
  const details = document.getElementById('meeting-iq-details');
  if (details) {
    details.classList.toggle('hidden');
    
    // Update button icon
    const toggleBtn = document.getElementById('toggle-iq-details');
    if (toggleBtn) {
      const isHidden = details.classList.contains('hidden');
      toggleBtn.innerHTML = isHidden ? '<span>📊</span>' : '<span>📉</span>';
      toggleBtn.title = isHidden ? 'Show details' : 'Hide details';
    }
  }
}

// ============================================
// Meeting Type Selection Functions
// ============================================

/**
 * Meeting type descriptions and hints
 */
const MEETING_TYPE_DESCRIPTIONS = {
  'GENERAL': 'Balanced scoring across all dimensions',
  'STANDUP': 'Optimized for: Speed (30%), Participation (25%), Focus (20%)',
  'BRAINSTORM': 'Optimized for: Engagement (30%), Participation (25%), Idea capture',
  'DECISION_MAKING': 'Optimized for: Decisions (35%), Focus (25%), Clear outcomes',
  'ONE_ON_ONE': 'Optimized for: Engagement (30%), Balanced dialogue (25%)',
  'PLANNING': 'Optimized for: Action items (30%), Focus (25%), Ownership',
  'REVIEW': 'Optimized for: Focus (30%), Engagement (25%), Feedback capture',
  'PROBLEM_SOLVING': 'Optimized for: Decisions (30%), Actions (30%), Solutions',
  'CLIENT_MEETING': 'Optimized for: Client experience (30%), Listening, Value delivery'
};

/**
 * Handle meeting type selection change
 */
function handleMeetingTypeChange() {
  selectedMeetingType = meetingTypeDropdown.value;
  console.log('🎯 Meeting type changed to:', selectedMeetingType);
  
  // Update hint text
  updateMeetingTypeHint();
  
  // Store preference
  try {
    localStorage.setItem('lastMeetingType', selectedMeetingType);
  } catch (e) {
    console.warn('Could not save meeting type preference:', e);
  }
}

/**
 * Update meeting type hint text
 */
function updateMeetingTypeHint() {
  if (!meetingTypeHint) return;
  
  const currentType = meetingTypeDropdown?.value || 'GENERAL';
  const description = MEETING_TYPE_DESCRIPTIONS[currentType] || 'Standard meeting';
  meetingTypeHint.textContent = description;
}

/**
 * Restore last selected meeting type
 */
function restoreLastMeetingType() {
  try {
    const lastType = localStorage.getItem('lastMeetingType');
    if (lastType && meetingTypeDropdown) {
      meetingTypeDropdown.value = lastType;
      selectedMeetingType = lastType;
      updateMeetingTypeHint();
    }
  } catch (e) {
    console.warn('Could not restore meeting type:', e);
  }
}

/**
 * Attempt to auto-detect meeting type from page title or URL
 */
async function attemptAutoDetectMeetingType() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    const title = tab.title?.toLowerCase() || '';
    const url = tab.url?.toLowerCase() || '';
    
    // Pattern matching for meeting types
    const patterns = {
      STANDUP: ['standup', 'stand up', 'daily sync', 'daily scrum', 'morning sync', 'status'],
      BRAINSTORM: ['brainstorm', 'ideation', 'creative', 'ideas'],
      DECISION_MAKING: ['decision', 'approval', 'vote'],
      ONE_ON_ONE: ['1:1', '1-1', 'one on one', 'check-in'],
      PLANNING: ['planning', 'roadmap', 'strategy', 'quarterly', 'okr'],
      REVIEW: ['review', 'demo', 'presentation', 'showcase'],
      PROBLEM_SOLVING: ['bug', 'issue', 'incident', 'troubleshoot'],
      CLIENT_MEETING: ['client', 'customer', 'partner']
    };
    
    // Check for pattern matches
    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        console.log(`🎯 Auto-detected meeting type: ${type} (from title: "${tab.title}")`);
        
        // Only auto-select if user hasn't manually chosen one yet
        if (selectedMeetingType === 'GENERAL' && meetingTypeDropdown) {
          meetingTypeDropdown.value = type;
          selectedMeetingType = type;
          updateMeetingTypeHint();
          
          // Show subtle notification
          const hint = meetingTypeHint;
          if (hint) {
            const original = hint.innerHTML;
            hint.innerHTML = `<div style="color: var(--success-600);"><strong>✨ Auto-detected:</strong> ${MEETING_TYPE_DESCRIPTIONS[type]}</div>`;
            setTimeout(() => {
              hint.innerHTML = original;
              updateMeetingTypeHint();
            }, 3000);
          }
        }
        return;
      }
    }
    
    console.log('ℹ️ No meeting type auto-detected from title');
  } catch (error) {
    console.warn('Could not auto-detect meeting type:', error);
  }
}

// ============================================
// CALENDAR INTEGRATION
// ============================================

/**
 * Generate and download follow-up meeting .ics file
 */
async function generateFollowUpMeeting() {
  console.log('[Calendar] Generating follow-up meeting...');
  
  try {
    if (!currentMeeting || !currentMeetingId) {
      showToast('error', '❌ No active meeting to create follow-up for');
      return;
    }
    
    showToast('info', '⏳ Generating follow-up meeting...');
    
    // Generate ICS file
    const icsContent = generateFollowUpICS(currentMeeting, actionItems);
    const filename = generateICSFilename(currentMeeting);
    
    // Download file
    downloadICSFile(icsContent, filename);
    
    // Schedule Smart Reminders for follow-up meeting
    try {
      const followUpDate = extractFollowUpDate(icsContent);
      if (followUpDate) {
        await scheduleFollowUpReminders(followUpDate, currentMeeting, actionItems);
        showToast('success', `✅ Follow-up meeting created with reminders scheduled!`);
      } else {
        showToast('success', `✅ Follow-up meeting created (${filename})`);
      }
    } catch (reminderError) {
      console.warn('[Calendar] Could not schedule reminders:', reminderError);
      showToast('success', `✅ Follow-up meeting created (${filename})`);
    }
    
  } catch (error) {
    console.error('[Calendar] Error generating follow-up meeting:', error);
    showToast('error', '❌ Failed to generate follow-up meeting');
  }
}

/**
 * Extract follow-up date from ICS content
 */
function extractFollowUpDate(icsContent) {
  try {
    const match = icsContent.match(/DTSTART;TZID=[^:]+:(\d{8}T\d{6})/);
    if (match) {
      const dateStr = match[1];
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(9, 11));
      const minute = parseInt(dateStr.substring(11, 13));
      return new Date(year, month, day, hour, minute);
    }
  } catch (error) {
    console.warn('[Calendar] Could not extract follow-up date:', error);
  }
  return null;
}

/**
 * Copy formatted notes to clipboard
 */
async function copyCalendarNotes() {
  console.log('[Calendar] Copying calendar notes...');
  
  try {
    if (!currentMeeting || !currentMeetingId) {
      showToast('error', '❌ No meeting data to copy');
      return;
    }
    
    showToast('info', '⏳ Generating calendar notes...');
    
    // Get summary
    const summary = summaries.length > 0 ? summaries[summaries.length - 1] : null;
    
    // Generate formatted notes
    const notes = generateCalendarNotes(currentMeeting, transcripts, summary, actionItems);
    
    // Copy to clipboard
    const success = await copyToClipboard(notes);
    
    if (success) {
      showToast('success', '✅ Notes copied to clipboard!');
    } else {
      showToast('error', '❌ Failed to copy notes');
    }
    
  } catch (error) {
    console.error('[Calendar] Error copying calendar notes:', error);
    showToast('error', '❌ Failed to copy notes');
  }
}

/**
 * Generate shareable transcript link
 */
async function generateShareableLink() {
  console.log('[Calendar] Generating shareable link...');
  
  try {
    if (!currentMeeting || !currentMeetingId) {
      showToast('error', '❌ No meeting data to share');
      return;
    }
    
    showToast('info', '⏳ Creating shareable link...');
    
    // Get summary and Meeting IQ
    const summary = summaries.length > 0 ? summaries[summaries.length - 1] : null;
    const meetingIQReport = currentMeeting.meetingIQReport || null;
    
    // Create shareable link
    const { shareLink, expiryDate } = await createShareableLink(
      currentMeeting,
      transcripts,
      summary,
      actionItems,
      meetingIQReport
    );
    
    // Show modal with link
    showShareLinkModal(shareLink, expiryDate);
    
  } catch (error) {
    console.error('[Calendar] Error generating shareable link:', error);
    showToast('error', '❌ Failed to generate shareable link');
  }
}

/**
 * Show modal with shareable link
 */
function showShareLinkModal(shareLink, expiryDate) {
  const modal = document.getElementById('calendar-modal');
  const modalTitle = document.getElementById('calendar-modal-title');
  const modalBody = document.getElementById('calendar-modal-body-content');
  const modalFooter = document.getElementById('calendar-modal-footer');
  
  modalTitle.textContent = '🔗 Shareable Link Generated';
  
  modalBody.innerHTML = `
    <p style="margin-bottom: var(--space-4); color: var(--neutral-700);">
      Share this link to give others access to the meeting transcript, summary, action items, and Meeting IQ score.
    </p>
    
    <label class="modal-label" for="share-link-input">Shareable Link</label>
    <div class="modal-link" id="share-link-input">${shareLink}</div>
    
    <div class="modal-info">
      <span class="modal-info-icon">ℹ️</span>
      <div class="modal-info-text">
        <strong>Privacy & Security:</strong><br>
        • Link expires on <strong>${expiryDate}</strong> (30 days)<br>
        • Anyone with the link can view the content<br>
        • No personal data or attendee information is shared<br>
        • All data stored locally in your browser
      </div>
    </div>
  `;
  
  modalFooter.innerHTML = `
    <button class="btn-secondary" onclick="closeCalendarModal()">Close</button>
    <button class="btn-primary" onclick="copyShareLink('${shareLink}')">📋 Copy Link</button>
  `;
  
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

/**
 * Copy share link to clipboard
 */
window.copyShareLink = async function(shareLink) {
  const success = await copyToClipboard(shareLink);
  if (success) {
    showToast('success', '✅ Link copied to clipboard!');
    closeCalendarModal();
  } else {
    showToast('error', '❌ Failed to copy link');
  }
};

/**
 * Close calendar modal
 */
window.closeCalendarModal = function() {
  const modal = document.getElementById('calendar-modal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
};

// Modal close button handler
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('calendar-modal');
  const closeBtn = modal.querySelector('.modal-close');
  const overlay = modal.querySelector('.modal-overlay');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCalendarModal);
  }
  
  if (overlay) {
    overlay.addEventListener('click', closeCalendarModal);
  }
  
  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeCalendarModal();
    }
  });
});

/**
 * Show toast notification
 */
function showToast(type, message) {
  // ✨ ANIMATION: Use enhanced toast from navigation animations
  if (animations.navigation) {
    animations.navigation.showToast(message, type, 3000);
    return;
  }
  
  // Fallback to existing implementation
  const toast = document.getElementById('toast-notification');
  const icon = document.getElementById('toast-icon');
  const messageEl = document.getElementById('toast-message');
  
  // Set icon based on type
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  icon.textContent = icons[type] || '📣';
  messageEl.textContent = message;
  
  // Reset classes
  toast.className = 'toast';
  toast.classList.add(type);
  
  // Show toast
  toast.classList.add('show');
  toast.setAttribute('aria-hidden', 'false');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    toast.setAttribute('aria-hidden', 'true');
  }, 3000);
}

/**
 * Enable calendar buttons when meeting data is available
 */
function updateCalendarButtonStates() {
  const hasData = currentMeeting && currentMeetingId && transcripts.length > 0;
  
  const calendarFollowupBtn = document.getElementById('calendar-followup');
  const calendarNotesBtn = document.getElementById('calendar-notes');
  const calendarShareBtn = document.getElementById('calendar-share');
  
  if (calendarFollowupBtn) {
    calendarFollowupBtn.disabled = !hasData;
  }
  
  if (calendarNotesBtn) {
    calendarNotesBtn.disabled = !hasData;
  }
  
  if (calendarShareBtn) {
    calendarShareBtn.disabled = !hasData;
  }
}

// ============================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================

/**
 * Manage focus trap for modal
 */
function setupFocusTrap(modalElement) {
  const focusableElements = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  modalElement.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
  
  // Focus first element when modal opens
  setTimeout(() => firstElement.focus(), 100);
}

/**
 * Announce to screen readers
 */
function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Update ARIA attributes for recording state
 */
function updateRecordingARIA(isRecording, isPaused) {
  const statusText = document.getElementById('status-text');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const pauseBtn = document.getElementById('pause-btn');
  
  if (isRecording) {
    if (isPaused) {
      announceToScreenReader('Recording paused');
      if (pauseBtn) pauseBtn.setAttribute('aria-label', 'Resume recording');
    } else {
      announceToScreenReader('Recording started');
      if (pauseBtn) pauseBtn.setAttribute('aria-label', 'Pause recording');
    }
  } else {
    announceToScreenReader('Recording stopped');
  }
  
  // Update status text for screen readers
  if (statusText) {
    statusText.setAttribute('aria-live', 'polite');
  }
}

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Don't trigger shortcuts when typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Ctrl/Cmd + R: Toggle recording
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    return;
  }
  
  // Ctrl/Cmd + P: Toggle pause (when recording)
  if ((e.ctrlKey || e.metaKey) && e.key === 'p' && isRecording) {
    e.preventDefault();
    togglePause();
    return;
  }
  
  // Ctrl/Cmd + S: Generate summary
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const summarizeBtn = document.getElementById('summarize-btn');
    if (summarizeBtn && !summarizeBtn.disabled) {
      generateSummary();
    }
    return;
  }
  
  // Escape: Close modal
  if (e.key === 'Escape') {
    const modal = document.getElementById('calendar-modal');
    if (modal && modal.classList.contains('active')) {
      closeCalendarModal();
    }
  }
});

/**
 * Update auto-scroll button ARIA
 */
function updateAutoScrollARIA() {
  const autoScrollToggle = document.getElementById('auto-scroll-toggle');
  if (autoScrollToggle) {
    autoScrollToggle.setAttribute('aria-pressed', autoScroll ? 'true' : 'false');
    autoScrollToggle.textContent = `Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
    announceToScreenReader(`Auto-scroll ${autoScroll ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Close calendar modal with proper focus management
 */
function closeCalendarModal() {
  const modal = document.getElementById('calendar-modal');
  if (!modal) return;
  
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  
  // Return focus to the button that opened the modal
  const lastFocusedButton = modal._lastFocusedElement;
  if (lastFocusedButton && lastFocusedButton.focus) {
    lastFocusedButton.focus();
  }
}

/**
 * Enhance button states with ARIA
 */
function updateButtonARIA(button, isEnabled) {
  if (!button) return;
  
  button.disabled = !isEnabled;
  button.setAttribute('aria-disabled', isEnabled ? 'false' : 'true');
  
  if (!isEnabled) {
    button.setAttribute('title', 'This feature is not available yet');
  } else {
    button.removeAttribute('title');
  }
}

/**
 * Initialize accessibility features
 */
function initializeAccessibility() {
  console.log('♿ Initializing accessibility features...');
  
  // Add skip link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'sr-only skip-link';
  skipLink.textContent = 'Skip to main content';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary-600);
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  `;
  skipLink.addEventListener('focus', function() {
    this.style.top = '0';
  });
  skipLink.addEventListener('blur', function() {
    this.style.top = '-40px';
  });
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Add main landmark
  const mainContent = document.querySelector('.content-area');
  if (mainContent) {
    mainContent.id = 'main-content';
    mainContent.setAttribute('role', 'main');
  }
  
  // Enhance auto-scroll toggle
  const autoScrollToggle = document.getElementById('auto-scroll-toggle');
  if (autoScrollToggle) {
    const originalClick = autoScrollToggle.onclick;
    autoScrollToggle.onclick = function(e) {
      if (originalClick) originalClick.call(this, e);
      updateAutoScrollARIA();
    };
  }
  
  // Setup modal accessibility
  const modal = document.getElementById('calendar-modal');
  if (modal) {
    // Store last focused element when modal opens
    const originalShowModal = window.showShareLinkModal || function() {};
    window.showShareLinkModal = function(...args) {
      modal._lastFocusedElement = document.activeElement;
      originalShowModal.apply(this, args);
      setupFocusTrap(modal);
      announceToScreenReader('Dialog opened');
    };
    
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCalendarModal);
    }
    
    // Overlay click
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeCalendarModal);
    }
  }
  
  // Add ARIA labels to dynamically generated content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          // Add ARIA labels to transcript items
          if (node.classList && node.classList.contains('transcript-item')) {
            node.setAttribute('role', 'article');
            const speaker = node.querySelector('.transcript-speaker');
            const text = node.querySelector('.transcript-text');
            if (speaker && text) {
              node.setAttribute('aria-label', `${speaker.textContent}: ${text.textContent}`);
            }
          }
          
          // Add ARIA labels to action items
          if (node.classList && node.classList.contains('action-item')) {
            node.setAttribute('role', 'article');
            const task = node.querySelector('.action-task');
            if (task) {
              node.setAttribute('aria-label', `Action item: ${task.textContent}`);
            }
          }
        }
      });
    });
  });
  
  // Observe transcript and action items containers
  const transcriptList = document.getElementById('transcript-list');
  const actionItemsContainer = document.getElementById('action-items-container');
  
  if (transcriptList) {
    observer.observe(transcriptList, { childList: true, subtree: true });
  }
  
  if (actionItemsContainer) {
    observer.observe(actionItemsContainer, { childList: true, subtree: true });
  }
  
  console.log('✅ Accessibility features initialized');
}

// Initialize accessibility on load
initializeAccessibility();

console.log('✅ Side panel initialized');
