// ============================================
// Animation Engine - Centralized Animation System
// ============================================

/**
 * Animation Engine for MeetingMind
 * Provides reusable animation utilities and manages performance
 */

export class AnimationEngine {
  constructor() {
    this.activeAnimations = new Set();
    this.respectReducedMotion = this.checkReducedMotion();
    this.animationSettings = {
      enabled: true,
      celebrationsEnabled: true,
      soundEnabled: false
    };
    
    // Listen for reduced motion preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
        this.respectReducedMotion = this.checkReducedMotion();
      });
    }
  }
  
  /**
   * Check if user prefers reduced motion
   */
  checkReducedMotion() {
    if (!window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Get animation duration based on user preferences
   * @param {number} duration - Base duration in milliseconds
   * @returns {number} - Adjusted duration
   */
  getDuration(duration) {
    if (this.respectReducedMotion || !this.animationSettings.enabled) {
      return 1; // Nearly instant
    }
    return duration;
  }
  
  /**
   * Animate a number counter
   * @param {HTMLElement} element - Element to update
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} duration - Animation duration in ms
   * @param {Function} callback - Optional callback on complete
   */
  animateNumber(element, start, end, duration = 800, callback = null) {
    if (!element) return;
    
    duration = this.getDuration(duration);
    const startTime = performance.now();
    const difference = end - start;
    
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const currentValue = Math.round(start + (difference * easedProgress));
      element.textContent = currentValue;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * Create confetti celebration effect
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Confetti options
   */
  createConfetti(container, options = {}) {
    if (this.respectReducedMotion || !this.animationSettings.celebrationsEnabled) {
      return;
    }
    
    const {
      count = 50,
      colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444'],
      duration = 2000,
      origin = { x: 0.5, y: 0.5 }
    } = options;
    
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 9999;
    `;
    
    container.appendChild(confettiContainer);
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;
      const startX = origin.x * container.offsetWidth;
      const startY = origin.y * container.offsetHeight;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 300 + 200;
      const rotation = Math.random() * 360;
      
      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 2px;
        left: ${startX}px;
        top: ${startY}px;
        transform: rotate(${rotation}deg);
        opacity: 1;
      `;
      
      confettiContainer.appendChild(particle);
      
      const animation = particle.animate([
        {
          transform: `translate(0, 0) rotate(${rotation}deg)`,
          opacity: 1
        },
        {
          transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity + 400}px) rotate(${rotation + 720}deg)`,
          opacity: 0
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      animation.onfinish = () => particle.remove();
    }
    
    setTimeout(() => confettiContainer.remove(), duration + 100);
  }
  
  /**
   * Pulse element animation
   * @param {HTMLElement} element - Element to pulse
   * @param {number} count - Number of pulses
   * @param {number} duration - Duration per pulse
   */
  pulse(element, count = 1, duration = 500) {
    if (!element || this.respectReducedMotion) return;
    
    duration = this.getDuration(duration);
    
    element.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: duration,
      iterations: count,
      easing: 'ease-in-out'
    });
  }
  
  /**
   * Bounce element animation
   * @param {HTMLElement} element - Element to bounce
   */
  bounce(element) {
    if (!element || this.respectReducedMotion) return;
    
    const duration = this.getDuration(400);
    
    element.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-20px)', offset: 0.4 },
      { transform: 'translateY(0)', offset: 0.6 },
      { transform: 'translateY(-10px)', offset: 0.8 },
      { transform: 'translateY(0)' }
    ], {
      duration: duration,
      easing: 'ease-out'
    });
  }
  
  /**
   * Shake element animation (for errors)
   * @param {HTMLElement} element - Element to shake
   */
  shake(element) {
    if (!element || this.respectReducedMotion) return;
    
    const duration = this.getDuration(300);
    
    element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: duration,
      easing: 'ease-in-out'
    });
  }
  
  /**
   * Fade in element
   * @param {HTMLElement} element - Element to fade in
   * @param {number} duration - Duration in ms
   */
  fadeIn(element, duration = 300) {
    if (!element) return;
    
    duration = this.getDuration(duration);
    element.style.opacity = '0';
    
    requestAnimationFrame(() => {
      element.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], {
        duration: duration,
        easing: 'ease-out',
        fill: 'forwards'
      });
    });
  }
  
  /**
   * Slide in element from direction
   * @param {HTMLElement} element - Element to slide
   * @param {string} direction - 'left', 'right', 'top', 'bottom'
   * @param {number} distance - Distance to slide in pixels
   * @param {number} duration - Duration in ms
   */
  slideIn(element, direction = 'right', distance = 20, duration = 300) {
    if (!element || this.respectReducedMotion) return;
    
    duration = this.getDuration(duration);
    
    const transforms = {
      left: `translateX(-${distance}px)`,
      right: `translateX(${distance}px)`,
      top: `translateY(-${distance}px)`,
      bottom: `translateY(${distance}px)`
    };
    
    element.animate([
      { 
        transform: transforms[direction],
        opacity: 0
      },
      { 
        transform: 'translate(0, 0)',
        opacity: 1
      }
    ], {
      duration: duration,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards'
    });
  }
  
  /**
   * Scale in element with bounce
   * @param {HTMLElement} element - Element to scale
   * @param {number} duration - Duration in ms
   */
  scaleIn(element, duration = 400) {
    if (!element || this.respectReducedMotion) return;
    
    duration = this.getDuration(duration);
    
    element.animate([
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
  }
  
  /**
   * Float element up and fade out
   * @param {HTMLElement} element - Element to float
   * @param {number} distance - Distance to float
   * @param {number} duration - Duration in ms
   */
  floatUp(element, distance = 50, duration = 1000) {
    if (!element || this.respectReducedMotion) return;
    
    duration = this.getDuration(duration);
    
    const animation = element.animate([
      { transform: 'translateY(0)', opacity: 1 },
      { transform: `translateY(-${distance}px)`, opacity: 0 }
    ], {
      duration: duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
    
    animation.onfinish = () => element.remove();
  }
  
  /**
   * Shimmer loading animation
   * @param {HTMLElement} element - Element to add shimmer to
   */
  addShimmer(element) {
    if (!element || this.respectReducedMotion) return;
    
    element.classList.add('shimmer-loading');
  }
  
  /**
   * Remove shimmer loading animation
   * @param {HTMLElement} element - Element to remove shimmer from
   */
  removeShimmer(element) {
    if (!element) return;
    
    element.classList.remove('shimmer-loading');
  }
  
  /**
   * Stagger animation for multiple elements
   * @param {NodeList|Array} elements - Elements to animate
   * @param {Function} animationFn - Animation function to apply
   * @param {number} delay - Delay between each element in ms
   */
  stagger(elements, animationFn, delay = 80) {
    if (!elements || elements.length === 0) return;
    
    delay = this.respectReducedMotion ? 1 : delay;
    
    elements.forEach((element, index) => {
      setTimeout(() => {
        animationFn(element);
      }, index * delay);
    });
  }
  
  /**
   * Create typing effect for text
   * @param {HTMLElement} element - Element to type into
   * @param {string} text - Text to type
   * @param {number} speed - Speed in ms per character
   */
  typeText(element, text, speed = 30) {
    if (!element) return;
    
    if (this.respectReducedMotion) {
      element.textContent = text;
      return;
    }
    
    element.textContent = '';
    let index = 0;
    
    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      }
    };
    
    type();
  }
  
  /**
   * Draw progress bar
   * @param {HTMLElement} bar - Progress bar element
   * @param {number} from - Start percentage (0-100)
   * @param {number} to - End percentage (0-100)
   * @param {number} duration - Duration in ms
   */
  animateProgress(bar, from, to, duration = 800) {
    if (!bar) return;
    
    duration = this.getDuration(duration);
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = from + (to - from) * progress;
      
      bar.style.width = `${currentValue}%`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
}

// Export singleton instance
export const animationEngine = new AnimationEngine();
