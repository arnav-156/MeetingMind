// ============================================
// Action Item Animations - Detection & Interaction
// ============================================

import { animationEngine } from './animation-engine.js';

export class ActionItemAnimations {
  constructor() {
    this.attentionTimers = new Map();
  }
  
  /**
   * Animate new action item detection
   * @param {HTMLElement} cardElement - Action item card
   * @param {HTMLElement} badgeCounter - Badge counter element
   */
  animateNewActionItem(cardElement, badgeCounter = null) {
    if (!cardElement) return;
    
    // Play notification sound
    this.playNotificationSound();
    
    // Increment badge counter
    if (badgeCounter) {
      this.animateBadgeIncrement(badgeCounter);
    }
    
    // Grand entrance animation
    cardElement.style.transform = 'translateX(100%)';
    cardElement.style.opacity = '0';
    
    // Add "will-animate" class for performance
    cardElement.classList.add('will-animate');
    
    requestAnimationFrame(() => {
      // Slide in from right with bounce
      cardElement.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease-out';
      cardElement.style.transform = 'translateX(0)';
      cardElement.style.opacity = '1';
      
      // Glow pulse effect
      setTimeout(() => {
        this.glowPulse(cardElement, 2);
      }, 400);
      
      // Spin in icon
      const icon = cardElement.querySelector('.action-icon');
      if (icon) {
        setTimeout(() => {
          this.spinInIcon(icon);
        }, 500);
      }
      
      // Start attention-seeking animation
      this.startAttentionAnimation(cardElement);
      
      // Remove will-animate after animation completes
      setTimeout(() => {
        cardElement.classList.remove('will-animate');
        cardElement.classList.add('will-animate-complete');
      }, 1000);
    });
  }
  
  /**
   * Animate badge counter increment
   * @param {HTMLElement} badge - Badge element
   */
  animateBadgeIncrement(badge) {
    if (!badge) return;
    
    // Get current value
    const currentValue = parseInt(badge.textContent) || 0;
    const newValue = currentValue + 1;
    
    // Scale animation
    badge.style.transform = 'scale(1)';
    
    requestAnimationFrame(() => {
      badge.style.transition = 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      badge.style.transform = 'scale(1.3)';
      
      // Update number
      badge.textContent = newValue;
      
      // Scale back
      setTimeout(() => {
        badge.style.transform = 'scale(1)';
      }, 100);
    });
  }
  
  /**
   * Glow pulse effect
   * @param {HTMLElement} element - Element to pulse
   * @param {number} count - Number of pulses
   */
  glowPulse(element, count = 1) {
    if (!element) return;
    
    let pulseCount = 0;
    
    const pulse = () => {
      if (pulseCount >= count) return;
      
      element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.6)';
      
      setTimeout(() => {
        element.style.boxShadow = '0 0 5px rgba(102, 126, 234, 0.3)';
        pulseCount++;
        
        if (pulseCount < count) {
          setTimeout(pulse, 500);
        }
      }, 500);
    };
    
    element.style.transition = 'box-shadow 500ms ease-in-out';
    pulse();
  }
  
  /**
   * Spin in icon
   * @param {HTMLElement} icon - Icon element
   */
  spinInIcon(icon) {
    if (!icon) return;
    
    icon.style.transform = 'rotate(0deg) scale(0)';
    icon.style.opacity = '0';
    
    requestAnimationFrame(() => {
      icon.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out';
      icon.style.transform = 'rotate(270deg) scale(1)';
      icon.style.opacity = '1';
    });
  }
  
  /**
   * Start attention-seeking animation
   * @param {HTMLElement} element - Element to animate
   */
  startAttentionAnimation(element) {
    if (!element) return;
    
    // Pulse every 5 seconds for 30 seconds
    let pulseCount = 0;
    const maxPulses = 6;
    
    const pulseInterval = setInterval(() => {
      if (pulseCount >= maxPulses) {
        clearInterval(pulseInterval);
        // Switch to gentle breathing animation
        element.classList.add('breathing');
        return;
      }
      
      animationEngine.pulse(element, 1, 300);
      pulseCount++;
    }, 5000);
    
    // Store interval for cleanup
    this.attentionTimers.set(element, pulseInterval);
  }
  
  /**
   * Stop attention animation
   * @param {HTMLElement} element - Element to stop animating
   */
  stopAttentionAnimation(element) {
    if (!element) return;
    
    const timer = this.attentionTimers.get(element);
    if (timer) {
      clearInterval(timer);
      this.attentionTimers.delete(element);
    }
    
    element.classList.remove('breathing');
  }
  
  /**
   * Animate checkbox completion
   * @param {HTMLElement} checkboxElement - Checkbox element
   * @param {HTMLElement} cardElement - Parent card element
   * @param {HTMLElement} textElement - Task text element
   * @param {Function} onComplete - Callback when animation completes
   */
  animateCompletion(checkboxElement, cardElement, textElement, onComplete) {
    if (!checkboxElement || !cardElement) return;
    
    // Stop attention animation
    this.stopAttentionAnimation(cardElement);
    
    // Step 1: Draw checkmark (SVG animation)
    const checkmark = checkboxElement.querySelector('.checkmark');
    if (checkmark) {
      checkmark.style.strokeDasharray = '50';
      checkmark.style.strokeDashoffset = '50';
      checkmark.style.transition = 'stroke-dashoffset 300ms ease-out';
      
      requestAnimationFrame(() => {
        checkmark.style.strokeDashoffset = '0';
      });
    }
    
    // Step 2: Green color fill
    setTimeout(() => {
      checkboxElement.style.backgroundColor = '#10B981';
      checkboxElement.style.borderColor = '#10B981';
    }, 200);
    
    // Step 3: Strike-through text
    if (textElement) {
      setTimeout(() => {
        textElement.style.textDecoration = 'line-through';
        textElement.style.textDecorationColor = '#9CA3AF';
        textElement.style.transition = 'text-decoration 400ms ease-out';
      }, 300);
    }
    
    // Step 4: Fade card
    setTimeout(() => {
      cardElement.style.opacity = '0.6';
      cardElement.style.transition = 'opacity 300ms ease-out';
    }, 500);
    
    // Step 5: Success confetti
    setTimeout(() => {
      animationEngine.createConfetti(cardElement, {
        count: 50,
        colors: ['#10B981', '#34D399', '#6EE7B7'],
        duration: 1000,
        origin: { x: 0.2, y: 0.5 }
      });
    }, 600);
    
    // Step 6: Shrink card
    setTimeout(() => {
      cardElement.style.transform = 'scaleY(0.8)';
      cardElement.style.maxHeight = cardElement.offsetHeight + 'px';
      cardElement.style.transition = 'transform 300ms ease-out, max-height 300ms ease-out, margin 300ms ease-out';
      
      requestAnimationFrame(() => {
        cardElement.style.maxHeight = '0';
        cardElement.style.marginBottom = '0';
      });
    }, 800);
    
    // Callback after all animations complete
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1100);
  }
  
  /**
   * Check if all action items are completed and celebrate
   * @param {number} completedCount - Number of completed items
   * @param {number} totalCount - Total number of items
   * @param {HTMLElement} container - Container element
   */
  celebrateAllCompleted(completedCount, totalCount, container) {
    if (completedCount !== totalCount || totalCount === 0) return;
    
    // Create celebration toast
    const toast = document.createElement('div');
    toast.className = 'completion-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
      font-size: 20px;
      font-weight: 700;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    
    toast.innerHTML = `
      <span style="font-size: 32px;">🎉</span>
      <span>All Done! Great Work!</span>
    `;
    
    document.body.appendChild(toast);
    
    // Slide in
    requestAnimationFrame(() => {
      toast.style.transition = 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Confetti from top
    setTimeout(() => {
      animationEngine.createConfetti(document.body, {
        count: 200,
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'],
        duration: 3000,
        origin: { x: 0.5, y: 0 }
      });
    }, 400);
    
    // Trophy badge
    setTimeout(() => {
      this.showTrophyBadge(container);
    }, 800);
    
    // Slide out
    setTimeout(() => {
      toast.style.transition = 'transform 300ms ease-in, opacity 300ms ease-in';
      toast.style.transform = 'translateX(-50%) translateY(-100px)';
      toast.style.opacity = '0';
      
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  /**
   * Show trophy badge
   * @param {HTMLElement} container - Container element
   */
  showTrophyBadge(container) {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-size: 100px;
      z-index: 10001;
      filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
    `;
    
    badge.textContent = '🏆';
    document.body.appendChild(badge);
    
    // Scale in with bounce
    animationEngine.scaleIn(badge, 500);
    
    // Wiggle
    setTimeout(() => {
      animationEngine.bounce(badge);
    }, 500);
    
    // Fade out
    setTimeout(() => {
      badge.style.transition = 'opacity 500ms ease-out, transform 500ms ease-out';
      badge.style.opacity = '0';
      badge.style.transform = 'translate(-50%, -50%) scale(1.5)';
      
      setTimeout(() => badge.remove(), 500);
    }, 2000);
  }
  
  /**
   * Animate priority change
   * @param {HTMLElement} cardElement - Card element
   * @param {string} oldPriority - Old priority level
   * @param {string} newPriority - New priority level
   */
  animatePriorityChange(cardElement, oldPriority, newPriority) {
    if (!cardElement) return;
    
    const priorityColors = {
      low: '#3B82F6',
      medium: '#F59E0B',
      high: '#EF4444'
    };
    
    const newColor = priorityColors[newPriority] || '#3B82F6';
    
    // Pulse animation
    animationEngine.pulse(cardElement, 1, 200);
    
    // Border color transition
    setTimeout(() => {
      cardElement.style.transition = 'border-color 300ms ease-out, box-shadow 300ms ease-out';
      cardElement.style.borderColor = newColor;
      cardElement.style.boxShadow = `0 0 15px ${newColor}33`;
      
      // Remove glow after 1 second
      setTimeout(() => {
        cardElement.style.boxShadow = '';
      }, 1000);
    }, 100);
    
    // Icon crossfade
    const icon = cardElement.querySelector('.priority-icon');
    if (icon) {
      icon.style.transition = 'opacity 200ms ease-out';
      icon.style.opacity = '0';
      
      setTimeout(() => {
        // Update icon (would be done by parent component)
        icon.style.opacity = '1';
      }, 200);
    }
  }
  
  /**
   * Animate drag start
   * @param {HTMLElement} element - Element being dragged
   */
  animateDragStart(element) {
    if (!element) return;
    
    element.classList.add('dragging');
    element.style.transform = 'scale(1.05)';
    element.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    element.style.transition = 'transform 100ms ease-out, box-shadow 100ms ease-out';
  }
  
  /**
   * Animate drag end
   * @param {HTMLElement} element - Element being dragged
   */
  animateDragEnd(element) {
    if (!element) return;
    
    element.classList.remove('dragging');
    element.style.transform = 'scale(1)';
    element.style.boxShadow = '';
    element.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease-out';
  }
  
  /**
   * Animate drop zone activation
   * @param {HTMLElement} dropZone - Drop zone element
   * @param {boolean} isValid - Whether drop is valid
   */
  animateDropZone(dropZone, isValid = true) {
    if (!dropZone) return;
    
    if (isValid) {
      dropZone.classList.add('active');
      dropZone.style.borderColor = '#10B981';
      dropZone.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
    } else {
      dropZone.classList.add('invalid');
      animationEngine.shake(dropZone);
      
      setTimeout(() => {
        dropZone.classList.remove('invalid');
      }, 300);
    }
  }
  
  /**
   * Play notification sound
   */
  playNotificationSound() {
    if (!animationEngine.animationSettings.soundEnabled) return;
    
    // Future: Implement audio playback
    console.log('🔊 Action item notification');
  }
}

// Export singleton
export const actionItemAnimations = new ActionItemAnimations();
