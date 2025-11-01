// ============================================
// Meeting IQ Animations - Score & Breakdown
// ============================================

import { animationEngine } from './animation-engine.js';

export class MeetingIQAnimations {
  constructor() {
    this.lastScore = 0;
    this.animating = false;
    this.milestones = new Set();
  }
  
  /**
   * Animate Meeting IQ score update
   * @param {HTMLElement} scoreElement - Score display element
   * @param {number} oldScore - Previous score
   * @param {number} newScore - New score
   * @param {HTMLElement} ringElement - Progress ring element (optional)
   */
  animateScoreUpdate(scoreElement, oldScore, newScore, ringElement = null) {
    if (!scoreElement || this.animating) return;
    
    this.animating = true;
    const scoreDiff = newScore - oldScore;
    
    // Step 1: Pulse current score
    animationEngine.pulse(scoreElement, 1, 80);
    
    setTimeout(() => {
      // Step 2: Count up/down to new score
      animationEngine.animateNumber(scoreElement, oldScore, newScore, 800, () => {
        this.animating = false;
        
        // Check for milestone celebrations
        this.checkMilestone(newScore, scoreElement.closest('.meeting-iq-card'));
      });
      
      // Step 3: Animate progress ring if provided
      if (ringElement) {
        this.animateProgressRing(ringElement, oldScore, newScore);
      }
      
      // Step 4: Color transition
      this.animateScoreColor(scoreElement, newScore);
      
      // Step 5: Show score change indicator
      if (Math.abs(scoreDiff) >= 5) {
        this.showScoreChange(scoreElement, scoreDiff);
      }
      
      // Step 6: Celebration for big improvements
      if (scoreDiff >= 10) {
        this.celebrateImprovement(scoreElement);
      }
    }, 100);
    
    this.lastScore = newScore;
  }
  
  /**
   * Animate progress ring
   * @param {HTMLElement} ringElement - SVG circle element
   * @param {number} oldScore - Previous score (0-100)
   * @param {number} newScore - New score (0-100)
   */
  animateProgressRing(ringElement, oldScore, newScore) {
    if (!ringElement) return;
    
    const radius = ringElement.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate dash offsets
    const oldOffset = circumference - (oldScore / 100) * circumference;
    const newOffset = circumference - (newScore / 100) * circumference;
    
    // Set initial state
    ringElement.style.strokeDasharray = `${circumference} ${circumference}`;
    ringElement.style.strokeDashoffset = oldOffset;
    
    // Animate to new state
    requestAnimationFrame(() => {
      ringElement.style.transition = 'stroke-dashoffset 800ms cubic-bezier(0.4, 0.0, 0.2, 1), stroke 500ms ease';
      ringElement.style.strokeDashoffset = newOffset;
      
      // Update ring color based on score
      const color = this.getScoreColor(newScore);
      ringElement.style.stroke = color;
    });
  }
  
  /**
   * Animate score color transition
   * @param {HTMLElement} element - Score element
   * @param {number} score - New score value
   */
  animateScoreColor(element, score) {
    if (!element) return;
    
    const color = this.getScoreColor(score);
    element.style.transition = 'color 500ms ease';
    element.style.color = color;
  }
  
  /**
   * Get color based on score bracket
   * @param {number} score - Score value (0-100)
   * @returns {string} - CSS color value
   */
  getScoreColor(score) {
    if (score >= 81) return '#10B981'; // Green
    if (score >= 61) return '#3B82F6'; // Blue
    if (score >= 41) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  }
  
  /**
   * Show floating score change indicator
   * @param {HTMLElement} scoreElement - Score display element
   * @param {number} change - Score change amount
   */
  showScoreChange(scoreElement, change) {
    if (!scoreElement) return;
    
    const indicator = document.createElement('div');
    indicator.className = `score-change ${change > 0 ? 'positive' : 'negative'}`;
    indicator.textContent = change > 0 ? `+${change}` : change;
    indicator.style.cssText = `
      position: absolute;
      top: -10px;
      right: -30px;
      font-size: 16px;
      font-weight: 600;
      pointer-events: none;
    `;
    
    const container = scoreElement.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(indicator);
      
      animationEngine.floatUp(indicator, 50, 1000);
    }
  }
  
  /**
   * Celebration effect for big improvements
   * @param {HTMLElement} element - Element to celebrate around
   */
  celebrateImprovement(element) {
    if (!element) return;
    
    const container = element.closest('.meeting-iq-card') || element.parentElement;
    
    animationEngine.createConfetti(container, {
      count: 30,
      colors: ['#10B981', '#3B82F6', '#F59E0B'],
      duration: 1500,
      origin: { x: 0.5, y: 0.3 }
    });
    
    // Play success sound if enabled
    this.playSound('improvement');
  }
  
  /**
   * Animate breakdown reveal
   * @param {HTMLElement} container - Breakdown container
   * @param {Array} dimensions - Array of dimension scores
   */
  animateBreakdownReveal(container, dimensions) {
    if (!container || !dimensions) return;
    
    const bars = container.querySelectorAll('.dimension-bar-fill');
    const icons = container.querySelectorAll('.dimension-icon');
    
    // Expand container
    container.style.maxHeight = '0';
    container.style.opacity = '0';
    container.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      container.style.transition = 'max-height 300ms ease-out, opacity 300ms ease-out';
      container.style.maxHeight = '500px';
      container.style.opacity = '1';
    });
    
    // Stagger bar animations
    bars.forEach((bar, index) => {
      const dimension = dimensions[index];
      if (!dimension) return;
      
      setTimeout(() => {
        // Animate bar fill
        bar.style.width = '0%';
        requestAnimationFrame(() => {
          bar.style.transition = 'width 500ms cubic-bezier(0.4, 0.0, 0.2, 1)';
          bar.style.width = `${dimension.score}%`;
        });
        
        // Bounce icon when bar completes
        setTimeout(() => {
          if (icons[index]) {
            animationEngine.bounce(icons[index]);
          }
        }, 500);
      }, index * 80);
    });
  }
  
  /**
   * Check and celebrate milestones
   * @param {number} score - Current score
   * @param {HTMLElement} container - Container element
   */
  checkMilestone(score, container) {
    const milestones = [
      { threshold: 75, title: 'Good Meeting!', icon: '✓', color: '#10B981', particles: 50 },
      { threshold: 85, title: 'Great Meeting!', icon: '⭐', color: '#F59E0B', particles: 100 },
      { threshold: 90, title: 'Meeting Excellence!', icon: '🏆', color: '#8B5CF6', particles: 150 },
      { threshold: 95, title: 'Perfect Score!', icon: '🎉', color: '#EC4899', particles: 200 }
    ];
    
    for (const milestone of milestones) {
      if (score >= milestone.threshold && !this.milestones.has(milestone.threshold)) {
        this.milestones.add(milestone.threshold);
        this.showMilestoneAchievement(milestone, container);
        break; // Only show one at a time
      }
    }
  }
  
  /**
   * Show milestone achievement modal
   * @param {Object} milestone - Milestone data
   * @param {HTMLElement} container - Container element
   */
  showMilestoneAchievement(milestone, container) {
    if (!container) return;
    
    // Create achievement overlay
    const overlay = document.createElement('div');
    overlay.className = 'achievement-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
    `;
    
    // Create badge
    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      transform: scale(0);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    badge.innerHTML = `
      <div style="font-size: 80px; margin-bottom: 20px;">${milestone.icon}</div>
      <h2 style="font-size: 32px; font-weight: 700; color: ${milestone.color}; margin-bottom: 10px;">${milestone.title}</h2>
      <p style="font-size: 18px; color: #6B7280;">Keep up the excellent work!</p>
      <button id="close-achievement" style="margin-top: 30px; padding: 12px 24px; background: ${milestone.color}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
        Awesome!
      </button>
    `;
    
    overlay.appendChild(badge);
    document.body.appendChild(overlay);
    
    // Animate overlay
    requestAnimationFrame(() => {
      overlay.style.transition = 'opacity 300ms ease-out';
      overlay.style.opacity = '1';
    });
    
    // Animate badge with delay
    setTimeout(() => {
      animationEngine.scaleIn(badge, 500);
      
      // Confetti explosion
      animationEngine.createConfetti(overlay, {
        count: milestone.particles,
        colors: [milestone.color, '#ffffff'],
        duration: 3000,
        origin: { x: 0.5, y: 0.5 }
      });
      
      // Play celebration sound
      this.playSound('milestone');
    }, 300);
    
    // Close button
    const closeBtn = badge.querySelector('#close-achievement');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.style.transition = 'opacity 300ms ease-in';
        overlay.style.opacity = '0';
        
        setTimeout(() => {
          overlay.remove();
        }, 300);
      });
    }
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        closeBtn.click();
      }
    }, 5000);
  }
  
  /**
   * Show real-time coaching tip
   * @param {string} message - Tip message
   * @param {string} action - Suggested action
   * @param {HTMLElement} container - Container to show tip in
   */
  showCoachingTip(message, action, container) {
    if (!container) return;
    
    const tip = document.createElement('div');
    tip.className = 'coaching-tip';
    tip.style.cssText = `
      position: fixed;
      right: 20px;
      top: 80px;
      max-width: 300px;
      background: white;
      border: 2px solid #3B82F6;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      z-index: 9000;
      transform: translateX(400px);
      opacity: 0;
    `;
    
    tip.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 24px;">💡</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">${message}</div>
          <div style="font-size: 14px; color: #6B7280;">${action}</div>
        </div>
        <button class="close-tip" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #9CA3AF;">×</button>
      </div>
    `;
    
    document.body.appendChild(tip);
    
    // Slide in
    animationEngine.slideIn(tip, 'right', 400, 300);
    
    // Pulse border
    setTimeout(() => {
      animationEngine.pulse(tip, 1, 500);
    }, 300);
    
    // Close button
    const closeBtn = tip.querySelector('.close-tip');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        tip.style.transition = 'transform 250ms ease-in, opacity 250ms ease-in';
        tip.style.transform = 'translateX(400px)';
        tip.style.opacity = '0';
        
        setTimeout(() => tip.remove(), 250);
      });
    }
    
    // Auto-dismiss after 10s (unless hovered)
    let dismissTimer = setTimeout(() => {
      if (closeBtn && tip.parentElement) {
        closeBtn.click();
      }
    }, 10000);
    
    tip.addEventListener('mouseenter', () => {
      clearTimeout(dismissTimer);
    });
    
    tip.addEventListener('mouseleave', () => {
      dismissTimer = setTimeout(() => {
        if (closeBtn && tip.parentElement) {
          closeBtn.click();
        }
      }, 5000);
    });
  }
  
  /**
   * Play sound effect
   * @param {string} type - Sound type ('improvement', 'milestone')
   */
  playSound(type) {
    if (!animationEngine.animationSettings.soundEnabled) return;
    
    // Future: Implement audio playback
    // For now, just log
    console.log(`🔊 Sound: ${type}`);
  }
  
  /**
   * Reset milestones (for new meeting)
   */
  resetMilestones() {
    this.milestones.clear();
    this.lastScore = 0;
  }
}

// Export singleton
export const meetingIQAnimations = new MeetingIQAnimations();
