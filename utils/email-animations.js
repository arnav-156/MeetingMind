/**
 * Email Generation Animations
 * Handles all animations related to email generation, editing, and copying
 */

import { animationEngine } from './animation-engine.js';

class EmailAnimations {
  constructor() {
    this.generationSteps = [
      'Analyzing meeting content...',
      'Extracting key points...',
      'Structuring email format...',
      'Generating professional copy...',
      'Finalizing email...'
    ];
    this.currentStep = 0;
    this.stepInterval = null;
  }

  /**
   * Animate the email generation loading sequence
   * @param {HTMLElement} modal - The modal container
   * @param {Function} onComplete - Callback when generation is complete
   */
  animateEmailGeneration(modal, onComplete) {
    if (!modal) return;

    // Show modal with animation
    this.showEmailModal(modal);

    // Create loading UI
    const loadingContainer = modal.querySelector('.email-loading') || this.createLoadingUI(modal);

    // Start step progression
    this.currentStep = 0;
    const progressText = loadingContainer.querySelector('.progress-text');
    const progressBar = loadingContainer.querySelector('.progress-bar-fill');
    const spinner = loadingContainer.querySelector('.spinner');

    // Animate spinner
    spinner.classList.add('spinning');

    // Progress through steps
    this.stepInterval = setInterval(() => {
      if (this.currentStep < this.generationSteps.length) {
        // Update text with typing effect
        progressText.textContent = '';
        animationEngine.typeText(
          progressText,
          this.generationSteps[this.currentStep],
          30
        );

        // Update progress bar
        const progress = ((this.currentStep + 1) / this.generationSteps.length) * 100;
        animationEngine.animateProgress(progressBar, progressBar.offsetWidth / progressBar.parentElement.offsetWidth * 100, progress, 400);

        this.currentStep++;
      } else {
        // Complete - show email content
        clearInterval(this.stepInterval);
        this.stepInterval = null;
        
        setTimeout(() => {
          this.transitionToEmailContent(modal, loadingContainer);
          if (onComplete) onComplete();
        }, 500);
      }
    }, 1200);
  }

  /**
   * Create loading UI elements
   * @param {HTMLElement} modal - The modal container
   * @returns {HTMLElement} - Loading container
   */
  createLoadingUI(modal) {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'email-loading';
    loadingContainer.innerHTML = `
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
      <p class="progress-text">${this.generationSteps[0]}</p>
      <div class="progress-bar">
        <div class="progress-bar-fill"></div>
      </div>
    `;

    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
      modalBody.appendChild(loadingContainer);
    }

    return loadingContainer;
  }

  /**
   * Show email modal with slide-up animation
   * @param {HTMLElement} modal - The modal element
   */
  showEmailModal(modal) {
    if (!modal) return;

    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999;';
    document.body.appendChild(overlay);

    // Fade in overlay
    animationEngine.fadeIn(overlay, 200);

    // Position modal
    modal.style.cssText = `
      position: fixed;
      bottom: -100%;
      left: 50%;
      transform: translateX(-50%);
      max-width: 600px;
      width: 90%;
      background: white;
      border-radius: 12px 12px 0 0;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.2);
      z-index: 1000;
      max-height: 80vh;
      overflow: hidden;
    `;
    modal.classList.add('email-modal');

    // Slide up
    modal.style.transition = 'bottom 400ms cubic-bezier(0.4, 0.0, 0.2, 1)';
    requestAnimationFrame(() => {
      modal.style.bottom = '0';
    });

    // Close on overlay click
    overlay.addEventListener('click', () => this.hideEmailModal(modal));
  }

  /**
   * Hide email modal with slide-down animation
   * @param {HTMLElement} modal - The modal element
   */
  hideEmailModal(modal) {
    if (!modal) return;

    // Clear any intervals
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }

    // Slide down
    modal.style.bottom = '-100%';

    // Remove overlay
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 200);
    }

    // Remove modal after animation
    setTimeout(() => {
      modal.remove();
    }, 400);
  }

  /**
   * Transition from loading to email content
   * @param {HTMLElement} modal - The modal container
   * @param {HTMLElement} loadingContainer - The loading UI
   */
  transitionToEmailContent(modal, loadingContainer) {
    // Fade out loading
    loadingContainer.style.transition = 'opacity 300ms ease-out';
    loadingContainer.style.opacity = '0';

    setTimeout(() => {
      loadingContainer.remove();

      // Show email content with staggered reveal
      const emailContent = modal.querySelector('.email-content');
      if (emailContent) {
        this.revealEmailContent(emailContent);
      }
    }, 300);
  }

  /**
   * Reveal email sections with staggered animation
   * @param {HTMLElement} container - Email content container
   */
  revealEmailContent(container) {
    const sections = container.querySelectorAll('.email-section');
    
    // Initially hide all sections
    sections.forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
    });

    // Reveal with stagger
    animationEngine.stagger(Array.from(sections), (section) => {
      section.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }, 100);

    // Animate the copy button
    setTimeout(() => {
      const copyBtn = container.querySelector('.copy-button');
      if (copyBtn) {
        animationEngine.bounce(copyBtn);
      }
    }, sections.length * 100 + 200);
  }

  /**
   * Animate copy to clipboard success
   * @param {HTMLElement} button - The copy button
   */
  animateCopySuccess(button) {
    if (!button) return;

    const originalText = button.textContent;
    const originalBg = button.style.backgroundColor;

    // Change button state with pulse
    button.textContent = '✓ Copied!';
    button.style.backgroundColor = '#10B981';
    button.style.color = 'white';
    
    // Pulse animation
    animationEngine.pulse(button, 2, 150);

    // Show floating success indicator
    const floatText = document.createElement('div');
    floatText.textContent = 'Email copied to clipboard!';
    floatText.style.cssText = `
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: #10B981;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      pointer-events: none;
      z-index: 1001;
    `;
    
    button.style.position = 'relative';
    button.appendChild(floatText);

    // Float up and fade
    animationEngine.floatUp(floatText, 40, 1500);

    // Confetti celebration
    const container = button.closest('.email-modal') || document.body;
    animationEngine.createConfetti(container, {
      count: 50,
      colors: ['#10B981', '#34D399', '#6EE7B7'],
      duration: 1500,
      origin: { x: 0.5, y: 0.3 }
    });

    // Reset button after delay
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = originalBg;
      button.style.color = '';
      floatText.remove();
    }, 2000);
  }

  /**
   * Animate entering edit mode
   * @param {HTMLElement} contentDiv - The content display div
   * @param {HTMLElement} textarea - The edit textarea
   */
  enterEditMode(contentDiv, textarea) {
    if (!contentDiv || !textarea) return;

    // Fade out display
    contentDiv.style.transition = 'opacity 200ms ease-out';
    contentDiv.style.opacity = '0';

    setTimeout(() => {
      contentDiv.style.display = 'none';
      textarea.style.display = 'block';
      textarea.style.opacity = '0';
      textarea.style.transform = 'scale(0.98)';

      // Focus and animate in
      textarea.focus();
      
      requestAnimationFrame(() => {
        textarea.style.transition = 'opacity 300ms ease-out, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        textarea.style.opacity = '1';
        textarea.style.transform = 'scale(1)';
      });

      // Pulse the save button
      const saveBtn = textarea.parentElement.querySelector('.save-button');
      if (saveBtn) {
        setTimeout(() => animationEngine.pulse(saveBtn, 1, 200), 300);
      }
    }, 200);
  }

  /**
   * Animate exiting edit mode (save)
   * @param {HTMLElement} contentDiv - The content display div
   * @param {HTMLElement} textarea - The edit textarea
   */
  exitEditMode(contentDiv, textarea) {
    if (!contentDiv || !textarea) return;

    // Success flash on textarea
    const originalBorder = textarea.style.border;
    textarea.style.transition = 'border-color 300ms ease-out';
    textarea.style.borderColor = '#10B981';

    // Scale out textarea
    setTimeout(() => {
      textarea.style.transition = 'opacity 200ms ease-out, transform 200ms ease-out';
      textarea.style.opacity = '0';
      textarea.style.transform = 'scale(0.98)';

      setTimeout(() => {
        textarea.style.display = 'none';
        textarea.style.borderColor = originalBorder;
        
        // Show updated content
        contentDiv.style.display = 'block';
        contentDiv.style.opacity = '0';
        contentDiv.style.transform = 'translateY(10px)';

        requestAnimationFrame(() => {
          contentDiv.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out';
          contentDiv.style.opacity = '1';
          contentDiv.style.transform = 'translateY(0)';
        });

        // Flash green background to indicate save
        this.flashSaveSuccess(contentDiv);
      }, 200);
    }, 100);
  }

  /**
   * Flash green background to indicate successful save
   * @param {HTMLElement} element - Element to flash
   */
  flashSaveSuccess(element) {
    if (!element) return;

    const originalBg = element.style.backgroundColor || '';
    
    element.style.transition = 'background-color 300ms ease-out';
    element.style.backgroundColor = '#D1FAE5'; // Light green

    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 600);
  }

  /**
   * Animate email template selection
   * @param {HTMLElement} selectedTemplate - The selected template card
   * @param {HTMLElement[]} otherTemplates - Other template cards
   */
  selectTemplate(selectedTemplate, otherTemplates) {
    if (!selectedTemplate) return;

    // Scale selected
    selectedTemplate.style.transition = 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease-out';
    selectedTemplate.style.transform = 'scale(1.05)';
    selectedTemplate.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)';

    // Add checkmark
    const checkmark = document.createElement('div');
    checkmark.className = 'template-checkmark';
    checkmark.innerHTML = '✓';
    checkmark.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      background: #10B981;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    `;
    selectedTemplate.style.position = 'relative';
    selectedTemplate.appendChild(checkmark);

    // Animate checkmark
    animationEngine.scaleIn(checkmark, 300);

    // Dim others
    otherTemplates.forEach(template => {
      if (template !== selectedTemplate) {
        template.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out';
        template.style.opacity = '0.5';
        template.style.transform = 'scale(0.95)';

        // Remove any existing checkmarks
        const existingCheck = template.querySelector('.template-checkmark');
        if (existingCheck) existingCheck.remove();
      }
    });
  }

  /**
   * Animate email preview expand
   * @param {HTMLElement} previewCard - The preview card element
   */
  expandPreview(previewCard) {
    if (!previewCard) return;

    const isExpanded = previewCard.classList.contains('expanded');

    if (!isExpanded) {
      // Expand
      previewCard.classList.add('expanded');
      previewCard.style.transition = 'max-height 400ms ease-out, padding 400ms ease-out';
      previewCard.style.maxHeight = previewCard.scrollHeight + 'px';

      // Rotate expand icon
      const icon = previewCard.querySelector('.expand-icon');
      if (icon) {
        icon.style.transition = 'transform 300ms ease-out';
        icon.style.transform = 'rotate(180deg)';
      }
    } else {
      // Collapse
      previewCard.classList.remove('expanded');
      previewCard.style.maxHeight = '80px'; // Preview height

      const icon = previewCard.querySelector('.expand-icon');
      if (icon) {
        icon.style.transform = 'rotate(0deg)';
      }
    }
  }

  /**
   * Show error message with shake animation
   * @param {HTMLElement} container - Container to show error in
   * @param {string} message - Error message
   */
  showError(container, message) {
    if (!container) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'email-error';
    errorDiv.innerHTML = `
      <span class="error-icon">⚠️</span>
      <span class="error-message">${message}</span>
    `;
    errorDiv.style.cssText = `
      background: #FEE2E2;
      border: 2px solid #EF4444;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #991B1B;
      font-weight: 500;
    `;

    container.insertBefore(errorDiv, container.firstChild);

    // Shake animation
    animationEngine.shake(errorDiv);

    // Fade in
    animationEngine.fadeIn(errorDiv, 200);

    // Auto-dismiss after 5s
    setTimeout(() => {
      errorDiv.style.transition = 'opacity 300ms ease-out';
      errorDiv.style.opacity = '0';
      setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
  }

  /**
   * Animate regenerate button loading state
   * @param {HTMLElement} button - Regenerate button
   * @param {boolean} isLoading - Loading state
   */
  setRegenerateLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      const originalText = button.textContent;
      button.dataset.originalText = originalText;
      
      // Add spinner
      button.innerHTML = `
        <span class="spinner-small"></span>
        Regenerating...
      `;
      button.style.opacity = '0.7';

      // Pulse animation
      animationEngine.pulse(button, -1, 800); // Infinite pulse
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Regenerate';
      button.style.opacity = '1';
      
      // Stop pulse by removing animation
      button.style.animation = 'none';

      // Success bounce
      animationEngine.bounce(button);
    }
  }

  /**
   * Animate tone change selector
   * @param {HTMLElement} selector - Tone selector dropdown
   * @param {string} newTone - New tone selected
   */
  animateToneChange(selector, newTone) {
    if (!selector) return;

    // Pulse the selector
    animationEngine.pulse(selector, 1, 200);

    // Show tone change indicator
    const indicator = document.createElement('div');
    indicator.textContent = `Tone: ${newTone}`;
    indicator.style.cssText = `
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: #6366F1;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      z-index: 1001;
    `;

    selector.style.position = 'relative';
    selector.appendChild(indicator);

    // Float and fade
    animationEngine.floatUp(indicator, 30, 1000);

    setTimeout(() => indicator.remove(), 1000);
  }

  /**
   * Clean up any active animations and intervals
   */
  cleanup() {
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }
}

// Create singleton instance
const emailAnimations = new EmailAnimations();

export { emailAnimations };
