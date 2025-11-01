/**
 * Pre-Meeting Brief Manager
 * 
 * Handles the display and interaction with pre-meeting briefs.
 * Integrates with:
 * - Calendar Integration (detects upcoming meetings)
 * - Meeting Series Detector (identifies series)
 * - Pre-Meeting Brief Generator (creates briefs)
 * - Background.js (notifications)
 * - Sidepanel.js (UI updates)
 */

class PreMeetingBriefManager {
  constructor() {
    this.currentBrief = null;
    this.checkInterval = null;
    this.countdownInterval = null;
    this.upcomingMeeting = null;
  }

  /**
   * Initialize the pre-meeting brief system
   */
  async initialize() {
    console.log('🔔 Initializing Pre-Meeting Brief Manager');
    
    // Set up event listeners for UI interactions
    this.setupEventListeners();
    
    // Start checking for upcoming meetings (every minute)
    this.startCheckingUpcomingMeetings();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'UPCOMING_MEETING_DETECTED') {
        this.handleUpcomingMeeting(message.meeting);
      } else if (message.type === 'BRIEF_READY') {
        this.displayBrief(message.brief);
      }
    });
  }

  /**
   * Set up event listeners for brief card interactions
   */
  setupEventListeners() {
    // Dismiss button
    const dismissBtn = document.getElementById('brief-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.dismissBrief());
    }

    // Start with context button
    const startBtn = document.getElementById('brief-start-with-context');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startWithContext());
    }

    // View later button
    const laterBtn = document.getElementById('brief-view-later');
    if (laterBtn) {
      laterBtn.addEventListener('click', () => this.viewLater());
    }
  }

  /**
   * Start periodic check for upcoming meetings
   */
  startCheckingUpcomingMeetings() {
    // Check immediately
    this.checkUpcomingMeetings();
    
    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkUpcomingMeetings();
    }, 60 * 1000); // 1 minute
  }

  /**
   * Check for meetings starting in the next 5 minutes
   */
  async checkUpcomingMeetings() {
    try {
      // Ask background script to check calendar
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_UPCOMING_MEETINGS',
        timeWindow: 5 // minutes
      });

      if (response && response.meetings && response.meetings.length > 0) {
        const nextMeeting = response.meetings[0]; // Most immediate meeting
        
        // Check if we need to show brief
        if (this.shouldShowBrief(nextMeeting)) {
          this.handleUpcomingMeeting(nextMeeting);
        }
      }
    } catch (error) {
      console.error('❌ Error checking upcoming meetings:', error);
    }
  }

  /**
   * Determine if brief should be shown for this meeting
   */
  shouldShowBrief(meeting) {
    // Don't show if already shown for this meeting
    if (this.upcomingMeeting && this.upcomingMeeting.id === meeting.id) {
      return false;
    }

    // Don't show if brief card is already visible
    const briefCard = document.getElementById('pre-meeting-brief-card');
    if (briefCard && briefCard.style.display !== 'none') {
      return false;
    }

    // Check if meeting starts in 5 minutes or less
    const startTime = new Date(meeting.startTime).getTime();
    const now = Date.now();
    const timeDiff = startTime - now;
    const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));

    return minutesUntilStart <= 5 && minutesUntilStart > 0;
  }

  /**
   * Handle upcoming meeting detection
   */
  async handleUpcomingMeeting(meeting) {
    console.log('📅 Upcoming meeting detected:', meeting.title);
    this.upcomingMeeting = meeting;

    // Show loading state
    this.showBriefCard('loading');

    try {
      // Request brief generation from background
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_PRE_MEETING_BRIEF',
        meeting: meeting
      });

      if (response && response.brief) {
        this.displayBrief(response.brief);
      } else if (response && response.error) {
        this.showBriefCard('error', response.error);
      } else {
        // No brief available (new series)
        this.showBriefCard('error', 'This appears to be a new meeting series.');
      }
    } catch (error) {
      console.error('❌ Error generating brief:', error);
      this.showBriefCard('error', 'Could not generate brief.');
    }
  }

  /**
   * Show brief card in different states
   */
  showBriefCard(state, message = null) {
    const briefCard = document.getElementById('pre-meeting-brief-card');
    const loadingDiv = document.getElementById('brief-loading');
    const loadedDiv = document.getElementById('brief-loaded');
    const errorDiv = document.getElementById('brief-error');

    if (!briefCard) return;

    // Show card
    briefCard.style.display = 'block';

    // Update state
    if (state === 'loading') {
      loadingDiv.style.display = 'flex';
      loadedDiv.style.display = 'none';
      errorDiv.style.display = 'none';
    } else if (state === 'loaded') {
      loadingDiv.style.display = 'none';
      loadedDiv.style.display = 'block';
      errorDiv.style.display = 'none';
    } else if (state === 'error') {
      loadingDiv.style.display = 'none';
      loadedDiv.style.display = 'none';
      errorDiv.style.display = 'block';
      if (message && errorDiv.querySelector('p')) {
        errorDiv.querySelector('p').textContent = message;
      }
    }

    // Start countdown if meeting time available
    if (this.upcomingMeeting) {
      this.startCountdown();
    }

    // Scroll to top to show brief
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Display generated brief
   */
  displayBrief(brief) {
    console.log('📋 Displaying pre-meeting brief');
    this.currentBrief = brief;

    // Update series info
    const seriesBadge = document.getElementById('brief-series-badge');
    const meetingCount = document.getElementById('brief-meeting-count');
    
    if (seriesBadge && brief.series_info) {
      seriesBadge.textContent = brief.series_info.name || 'Meeting';
    }
    
    if (meetingCount && brief.series_info) {
      meetingCount.textContent = `Meeting #${brief.series_info.meetingCount || 1}`;
    }

    // Update metrics
    document.getElementById('brief-last-iq').textContent = 
      brief.last_meeting?.iq_score || '--';
    document.getElementById('brief-duration').textContent = 
      `${brief.patterns?.typical_duration || '--'} min`;
    document.getElementById('brief-open-items').textContent = 
      brief.open_items?.length || 0;

    // Update AI summary
    const summaryText = document.getElementById('brief-summary-text');
    if (summaryText) {
      if (brief.ai_brief) {
        // Use AI-generated brief
        summaryText.textContent = brief.ai_brief;
      } else if (brief.last_meeting?.summary) {
        // Fallback to last meeting summary
        summaryText.textContent = brief.last_meeting.summary.substring(0, 200) + '...';
      } else {
        summaryText.textContent = 'No previous meeting summary available.';
      }
    }

    // Update insights
    this.updateInsights(brief);

    // Populate action items
    this.populateActionItems(brief.open_items || []);

    // Populate agenda
    this.populateAgenda(brief.suggestions?.agenda || []);

    // Populate engagement info
    this.populateEngagement(brief.patterns || {});

    // Show loaded state
    this.showBriefCard('loaded');
  }

  /**
   * Update quick insights section
   */
  updateInsights(brief) {
    const focusAreas = document.getElementById('brief-focus-areas');
    const patterns = document.getElementById('brief-patterns');

    if (focusAreas && brief.suggestions?.focus_areas?.[0]) {
      focusAreas.querySelector('.insight-text').textContent = 
        brief.suggestions.focus_areas[0];
    }

    if (patterns && brief.patterns?.common_topics) {
      const topics = brief.patterns.common_topics
        .slice(0, 3)
        .map(t => typeof t === 'string' ? t : t.topic)
        .join(', ');
      patterns.querySelector('.insight-text').textContent = 
        `Recurring topics: ${topics || 'None identified'}`;
    }
  }

  /**
   * Populate action items list
   */
  populateActionItems(items) {
    const list = document.getElementById('brief-action-items-list');
    if (!list) return;

    list.innerHTML = '';

    if (items.length === 0) {
      list.innerHTML = '<li><span class="item-task">No open action items</span></li>';
      return;
    }

    items.slice(0, 5).forEach(item => {
      const li = document.createElement('li');
      
      const task = document.createElement('span');
      task.className = 'item-task';
      task.textContent = item.task;
      
      const meta = document.createElement('div');
      meta.className = 'item-meta';
      meta.innerHTML = `
        <span>👤 ${item.owner}</span>
        <span>⏰ ${item.age_days} days old</span>
      `;
      
      li.appendChild(task);
      li.appendChild(meta);
      list.appendChild(li);
    });
  }

  /**
   * Populate suggested agenda
   */
  populateAgenda(agenda) {
    const list = document.getElementById('brief-agenda-list');
    if (!list) return;

    list.innerHTML = '';

    if (agenda.length === 0) {
      list.innerHTML = '<li><span class="agenda-title">No agenda suggested</span></li>';
      return;
    }

    agenda.forEach(item => {
      const li = document.createElement('li');
      
      li.innerHTML = `
        <span class="agenda-title">${item.title}</span>
        <span class="agenda-meta">${item.duration} min • ${item.description}</span>
      `;
      
      list.appendChild(li);
    });
  }

  /**
   * Populate engagement information
   */
  populateEngagement(patterns) {
    const engagementDiv = document.getElementById('brief-engagement');
    if (!engagementDiv) return;

    let html = '';

    if (patterns.active_participants?.length > 0) {
      html += `<p><strong>Active contributors:</strong> ${patterns.active_participants.join(', ')}</p>`;
    }

    if (patterns.quiet_participants?.length > 0) {
      html += `<p><strong>Consider engaging:</strong> ${patterns.quiet_participants.join(', ')}</p>`;
    }

    if (patterns.typical_duration) {
      html += `<p><strong>Typical duration:</strong> ${patterns.typical_duration} minutes</p>`;
    }

    engagementDiv.innerHTML = html || '<p>No engagement data available.</p>';
  }

  /**
   * Start countdown timer
   */
  startCountdown() {
    // Clear existing countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    const updateCountdown = () => {
      if (!this.upcomingMeeting) return;

      const startTime = new Date(this.upcomingMeeting.startTime).getTime();
      const now = Date.now();
      const timeDiff = startTime - now;

      if (timeDiff <= 0) {
        // Meeting started
        document.getElementById('brief-countdown').textContent = 'now';
        clearInterval(this.countdownInterval);
        return;
      }

      const minutes = Math.floor(timeDiff / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      const countdownEl = document.getElementById('brief-countdown');
      if (countdownEl) {
        if (minutes > 0) {
          countdownEl.textContent = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
          countdownEl.textContent = `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
      }
    };

    updateCountdown();
    this.countdownInterval = setInterval(updateCountdown, 1000);
  }

  /**
   * Dismiss brief card
   */
  async dismissBrief() {
    const briefCard = document.getElementById('pre-meeting-brief-card');
    if (briefCard) {
      // Animate out
      briefCard.style.animation = 'briefSlideOut 0.3s ease-out';
      
      setTimeout(() => {
        briefCard.style.display = 'none';
        briefCard.style.animation = '';
      }, 300);
    }

    // Update brief status in storage
    if (this.currentBrief && this.currentBrief.id) {
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_BRIEF_STATUS',
          briefId: this.currentBrief.id,
          status: 'dismissed'
        });
      } catch (error) {
        console.error('❌ Error updating brief status:', error);
      }
    }

    // Clear countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Reset state
    this.currentBrief = null;
    this.upcomingMeeting = null;
  }

  /**
   * Start meeting with brief context
   */
  async startWithContext() {
    console.log('🚀 Starting with brief context');

    if (!this.currentBrief) {
      console.error('❌ No brief available');
      return;
    }

    // Load brief context into sidepanel
    this.loadContextIntoSidepanel();

    // Update brief status
    if (this.currentBrief.id) {
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_BRIEF_STATUS',
          briefId: this.currentBrief.id,
          status: 'used'
        });
      } catch (error) {
        console.error('❌ Error updating brief status:', error);
      }
    }

    // Collapse the brief card (don't dismiss completely)
    const briefCard = document.getElementById('pre-meeting-brief-card');
    if (briefCard) {
      briefCard.style.animation = 'briefSlideOut 0.3s ease-out';
      setTimeout(() => {
        briefCard.style.display = 'none';
        briefCard.style.animation = '';
      }, 300);
    }

    // Clear countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * Load brief context into sidepanel
   */
  loadContextIntoSidepanel() {
    if (!this.currentBrief) return;

    // Create a context note in the transcript area
    const transcriptList = document.getElementById('transcript-list');
    if (transcriptList) {
      // Remove empty state
      const emptyState = transcriptList.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }

      // Add context card
      const contextCard = document.createElement('div');
      contextCard.className = 'transcript-card context-card';
      contextCard.style.cssText = `
        background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%);
        border: 2px solid #C4B5FD;
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 8px;
      `;

      let contextHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <span style="font-size: 24px;">📋</span>
          <div>
            <strong style="color: #6D28D9; font-size: 15px;">Pre-Meeting Context Loaded</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280;">
              Series: ${this.currentBrief.series_info?.name || 'Unknown'} • 
              Meeting #${this.currentBrief.series_info?.meetingCount || 1}
            </p>
          </div>
        </div>
      `;

      // Add open action items summary
      if (this.currentBrief.open_items && this.currentBrief.open_items.length > 0) {
        contextHTML += `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E0E7FF;">
            <strong style="color: #374151; font-size: 13px;">Open Action Items (${this.currentBrief.open_items.length}):</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #4B5563;">
              ${this.currentBrief.open_items.slice(0, 3).map(item => 
                `<li>${item.task} <span style="color: #7C3AED;">(${item.owner})</span></li>`
              ).join('')}
            </ul>
          </div>
        `;
      }

      // Add key points from AI brief
      if (this.currentBrief.ai_brief) {
        const briefPreview = this.currentBrief.ai_brief.substring(0, 150);
        contextHTML += `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #E0E7FF;">
            <strong style="color: #374151; font-size: 13px;">From Last Meeting:</strong>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #4B5563; line-height: 1.5;">
              ${briefPreview}...
            </p>
          </div>
        `;
      }

      contextCard.innerHTML = contextHTML;
      transcriptList.insertBefore(contextCard, transcriptList.firstChild);
    }

    // Show success notification
    this.showNotification('✅ Brief context loaded. Ready to start recording!');
  }

  /**
   * View brief later
   */
  async viewLater() {
    console.log('⏱️ Brief saved for later viewing');

    // Update status
    if (this.currentBrief && this.currentBrief.id) {
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_BRIEF_STATUS',
          briefId: this.currentBrief.id,
          status: 'saved'
        });
      } catch (error) {
        console.error('❌ Error updating brief status:', error);
      }
    }

    // Minimize the card
    const briefCard = document.getElementById('pre-meeting-brief-card');
    if (briefCard) {
      briefCard.style.animation = 'briefSlideOut 0.3s ease-out';
      setTimeout(() => {
        briefCard.style.display = 'none';
        briefCard.style.animation = '';
      }, 300);
    }

    // Show notification
    this.showNotification('💾 Brief saved. You can access it anytime from the meeting list.');
  }

  /**
   * Show notification
   */
  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'brief-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1F2937;
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideInUp 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutDown 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes briefSlideOut {
    to {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideOutDown {
    to {
      opacity: 0;
      transform: translateY(20px);
    }
  }
`;
document.head.appendChild(style);

// Export for use in sidepanel.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PreMeetingBriefManager;
}
