// ============================================
// Transcript Animations - Text & Speaker Changes
// ============================================

import { animationEngine } from './animation-engine.js';

export class TranscriptAnimations {
  constructor() {
    this.lastSpeaker = null;
    this.typingIndicator = null;
    this.fastSpeechMode = false;
    this.recentTranscriptCount = 0;
    this.resetTimeout = null;
  }
  
  /**
   * Animate new transcript text appearance
   * @param {HTMLElement} transcriptElement - New transcript element
   * @param {string} text - Transcript text
   * @param {boolean} autoScroll - Whether to auto-scroll
   */
  animateNewTranscript(transcriptElement, text, autoScroll = true) {
    if (!transcriptElement) return;
    
    // Check for fast speech (optimization)
    this.trackSpeechRate();
    
    if (this.fastSpeechMode || text.split(' ').length > 10) {
      // Fast mode: Skip fade-in, just append
      transcriptElement.style.opacity = '1';
      
      // Subtle highlight flash
      this.flashHighlight(transcriptElement);
    } else {
      // Normal mode: Fade in with slide
      animationEngine.slideIn(transcriptElement, 'bottom', 10, 200);
    }
    
    // Auto-scroll if enabled
    if (autoScroll) {
      this.smoothScrollToElement(transcriptElement);
    }
  }
  
  /**
   * Show typing indicator before text arrives
   * @param {HTMLElement} container - Container element
   */
  showTypingIndicator(container) {
    if (!container || this.typingIndicator) return;
    
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'typing-indicator';
    this.typingIndicator.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    
    container.appendChild(this.typingIndicator);
    animationEngine.fadeIn(this.typingIndicator, 200);
  }
  
  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    if (this.typingIndicator && this.typingIndicator.parentElement) {
      animationEngine.fadeOut(this.typingIndicator, 150);
      setTimeout(() => {
        if (this.typingIndicator) {
          this.typingIndicator.remove();
          this.typingIndicator = null;
        }
      }, 150);
    }
  }
  
  /**
   * Flash highlight effect on element
   * @param {HTMLElement} element - Element to highlight
   */
  flashHighlight(element) {
    if (!element) return;
    
    element.style.animation = 'none';
    
    requestAnimationFrame(() => {
      element.style.animation = 'highlightFlash 1s ease-out';
    });
    
    setTimeout(() => {
      element.style.animation = '';
    }, 1000);
  }
  
  /**
   * Animate speaker change
   * @param {HTMLElement} dividerElement - Speaker divider element
   * @param {HTMLElement} badgeElement - Speaker badge element
   * @param {HTMLElement} previousTranscript - Previous speaker's last transcript
   */
  animateSpeakerChange(dividerElement, badgeElement, previousTranscript = null) {
    if (!dividerElement || !badgeElement) return;
    
    // Animate divider line
    dividerElement.style.width = '0';
    dividerElement.style.opacity = '0';
    
    requestAnimationFrame(() => {
      dividerElement.style.transition = 'width 150ms ease-out, opacity 150ms ease-out';
      dividerElement.style.width = '100%';
      dividerElement.style.opacity = '1';
    });
    
    // Slide in speaker badge
    setTimeout(() => {
      animationEngine.slideIn(badgeElement, 'left', 20, 200);
    }, 150);
    
    // Dim previous speaker's text
    if (previousTranscript) {
      previousTranscript.style.transition = 'opacity 300ms ease-out';
      previousTranscript.style.opacity = '0.7';
    }
  }
  
  /**
   * Highlight important moments (action items, decisions, questions)
   * @param {HTMLElement} element - Transcript element
   * @param {string} type - Type: 'action-item', 'decision', 'question'
   */
  highlightImportantMoment(element, type) {
    if (!element) return;
    
    const animations = {
      'action-item': {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        icon: '✓',
        iconColor: '#F59E0B'
      },
      'decision': {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6',
        icon: '📌',
        iconColor: '#3B82F6'
      },
      'question': {
        backgroundColor: '#F3E8FF',
        borderColor: '#8B5CF6',
        icon: '❓',
        iconColor: '#8B5CF6'
      }
    };
    
    const config = animations[type];
    if (!config) return;
    
    // Animate background color
    element.style.transition = 'background-color 300ms ease-out, transform 300ms ease-out';
    element.style.backgroundColor = config.backgroundColor;
    
    // Add left border
    const border = document.createElement('div');
    border.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0;
      background: ${config.borderColor};
      transition: width 200ms ease-out;
    `;
    
    element.style.position = 'relative';
    element.appendChild(border);
    
    requestAnimationFrame(() => {
      border.style.width = '4px';
    });
    
    // Add icon
    const iconEl = document.createElement('span');
    iconEl.textContent = config.icon;
    iconEl.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%) rotate(0deg) scale(0);
      font-size: 20px;
      transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    
    element.appendChild(iconEl);
    
    setTimeout(() => {
      iconEl.style.transform = 'translateY(-50%) rotate(180deg) scale(1)';
    }, 50);
    
    // Scale pulse
    setTimeout(() => {
      element.style.transform = 'scale(1.02)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 150);
    }, 200);
    
    // Pulse border for questions (until answered)
    if (type === 'question') {
      border.style.animation = 'glowPulse 2s ease-in-out infinite';
    }
    
    // Add notification badge
    this.addNotificationBadge(element, type);
  }
  
  /**
   * Add notification badge to important moments
   * @param {HTMLElement} element - Element to add badge to
   * @param {string} type - Type of moment
   */
  addNotificationBadge(element, type) {
    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 20px;
      height: 20px;
      background: #EF4444;
      border-radius: 50%;
      border: 2px solid white;
      transform: scale(0);
    `;
    
    element.appendChild(badge);
    
    setTimeout(() => {
      animationEngine.scaleIn(badge, 200);
    }, 300);
  }
  
  /**
   * Animate search highlight
   * @param {HTMLElement} element - Element containing search match
   * @param {number} index - Match index
   * @param {boolean} isCurrent - Whether this is the current match
   */
  highlightSearchMatch(element, index, isCurrent = false) {
    if (!element) return;
    
    const highlightClass = isCurrent ? 'search-highlight-current' : 'search-highlight';
    element.classList.add(highlightClass);
    
    if (isCurrent) {
      // Brighter highlight with scale
      element.style.backgroundColor = '#FDE047';
      element.style.transform = 'scale(1.05)';
      element.style.transition = 'background-color 150ms ease-out, transform 150ms ease-out';
      
      // Smooth scroll to match
      this.smoothScrollToElement(element);
    } else {
      // Standard highlight
      element.style.backgroundColor = '#FEF3C7';
      element.style.transition = 'background-color 150ms ease-out';
    }
  }
  
  /**
   * Navigate between search matches
   * @param {HTMLElement} currentMatch - Current highlighted match
   * @param {HTMLElement} nextMatch - Next match to highlight
   */
  navigateSearchMatches(currentMatch, nextMatch) {
    if (currentMatch) {
      // Fade out current
      currentMatch.style.transform = 'scale(1)';
      currentMatch.style.backgroundColor = '#FEF3C7';
    }
    
    if (nextMatch) {
      // Fade in next
      setTimeout(() => {
        this.highlightSearchMatch(nextMatch, 0, true);
      }, 100);
    }
  }
  
  /**
   * Clear all search highlights
   * @param {HTMLElement} container - Container element
   */
  clearSearchHighlights(container) {
    if (!container) return;
    
    const highlights = container.querySelectorAll('.search-highlight, .search-highlight-current');
    highlights.forEach(element => {
      element.style.transition = 'background-color 200ms ease-out, transform 200ms ease-out';
      element.style.backgroundColor = 'transparent';
      element.style.transform = 'scale(1)';
      
      setTimeout(() => {
        element.classList.remove('search-highlight', 'search-highlight-current');
      }, 200);
    });
  }
  
  /**
   * Smooth scroll to element
   * @param {HTMLElement} element - Element to scroll to
   * @param {string} behavior - Scroll behavior ('smooth' or 'auto')
   */
  smoothScrollToElement(element, behavior = 'smooth') {
    if (!element) return;
    
    const scrollBehavior = animationEngine.respectReducedMotion ? 'auto' : behavior;
    
    element.scrollIntoView({
      behavior: scrollBehavior,
      block: 'nearest',
      inline: 'nearest'
    });
  }
  
  /**
   * Track speech rate to optimize animations
   */
  trackSpeechRate() {
    this.recentTranscriptCount++;
    
    // Reset counter after 3 seconds
    clearTimeout(this.resetTimeout);
    this.resetTimeout = setTimeout(() => {
      this.recentTranscriptCount = 0;
      this.fastSpeechMode = false;
    }, 3000);
    
    // Enable fast mode if > 5 transcripts in 3 seconds
    if (this.recentTranscriptCount > 5) {
      this.fastSpeechMode = true;
    }
  }
  
  /**
   * Create speaker avatar animation
   * @param {HTMLElement} avatarElement - Avatar element
   */
  animateSpeakerAvatar(avatarElement) {
    if (!avatarElement) return;
    
    avatarElement.style.transform = 'scale(0)';
    animationEngine.scaleIn(avatarElement, 150);
  }
  
  /**
   * Batch update for multiple transcripts (performance optimization)
   * @param {Array} transcriptElements - Array of transcript elements
   * @param {HTMLElement} container - Container element
   */
  batchUpdateTranscripts(transcriptElements, container) {
    if (!transcriptElements || transcriptElements.length === 0) return;
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    transcriptElements.forEach((element, index) => {
      // Skip animations in batch mode
      element.style.opacity = '1';
      fragment.appendChild(element);
    });
    
    if (container) {
      container.appendChild(fragment);
    }
  }
}

// Export singleton
export const transcriptAnimations = new TranscriptAnimations();
