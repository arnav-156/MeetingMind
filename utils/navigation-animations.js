/**
 * Navigation & Transition Animations
 * Handles tab switching, panel transitions, modals, and loading states
 */

import { animationEngine } from './animation-engine.js';

class NavigationAnimations {
  constructor() {
    this.activeTab = null;
    this.loadingElements = new Map();
  }

  /**
   * Animate tab switching with sliding underline
   * @param {HTMLElement} newTab - The tab being switched to
   * @param {HTMLElement} oldTab - The previous active tab
   * @param {HTMLElement} indicator - The underline indicator element
   */
  switchTab(newTab, oldTab, indicator) {
    if (!newTab) return;

    // Remove active class from old tab
    if (oldTab) {
      oldTab.classList.remove('active');
      oldTab.style.color = '';
    }

    // Add active class to new tab
    newTab.classList.add('active');
    newTab.style.color = '#6366F1';

    // Animate indicator
    if (indicator) {
      const tabRect = newTab.getBoundingClientRect();
      const containerRect = newTab.parentElement.getBoundingClientRect();
      
      indicator.style.transition = 'transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1), width 300ms cubic-bezier(0.4, 0.0, 0.2, 1)';
      indicator.style.transform = `translateX(${tabRect.left - containerRect.left}px)`;
      indicator.style.width = `${tabRect.width}px`;
    }

    // Pulse new tab
    animationEngine.pulse(newTab, 1, 100);

    this.activeTab = newTab;
  }

  /**
   * Animate tab content transition
   * @param {HTMLElement} newContent - Content being shown
   * @param {HTMLElement} oldContent - Content being hidden
   */
  transitionTabContent(newContent, oldContent) {
    if (!newContent) return;

    // Fade out old content
    if (oldContent) {
      oldContent.style.transition = 'opacity 150ms ease-out';
      oldContent.style.opacity = '0';
      
      setTimeout(() => {
        oldContent.style.display = 'none';
      }, 150);
    }

    // Fade in new content with slide
    setTimeout(() => {
      newContent.style.display = 'block';
      newContent.style.opacity = '0';
      newContent.style.transform = 'translateY(10px)';

      requestAnimationFrame(() => {
        newContent.style.transition = 'opacity 250ms ease-out, transform 250ms ease-out';
        newContent.style.opacity = '1';
        newContent.style.transform = 'translateY(0)';
      });
    }, oldContent ? 150 : 0);
  }

  /**
   * Expand/collapse panel with smooth height animation
   * @param {HTMLElement} panel - The panel element
   * @param {boolean} expand - True to expand, false to collapse
   */
  togglePanel(panel, expand) {
    if (!panel) return;

    const content = panel.querySelector('.panel-content');
    const icon = panel.querySelector('.expand-icon');

    if (expand) {
      // Expand
      panel.classList.add('expanded');
      
      // Measure full height
      content.style.display = 'block';
      const fullHeight = content.scrollHeight;
      content.style.height = '0px';

      requestAnimationFrame(() => {
        content.style.transition = 'height 400ms cubic-bezier(0.4, 0.0, 0.2, 1)';
        content.style.height = fullHeight + 'px';
      });

      // Rotate icon
      if (icon) {
        icon.style.transition = 'transform 300ms ease-out';
        icon.style.transform = 'rotate(180deg)';
      }

      // After animation, set to auto for responsive behavior
      setTimeout(() => {
        content.style.height = 'auto';
      }, 400);

    } else {
      // Collapse
      panel.classList.remove('expanded');
      
      // Set explicit height first
      const currentHeight = content.scrollHeight;
      content.style.height = currentHeight + 'px';

      requestAnimationFrame(() => {
        content.style.transition = 'height 300ms cubic-bezier(0.4, 0.0, 1, 1)';
        content.style.height = '0px';
      });

      // Rotate icon back
      if (icon) {
        icon.style.transform = 'rotate(0deg)';
      }

      setTimeout(() => {
        content.style.display = 'none';
      }, 300);
    }
  }

  /**
   * Animate accordion section expand/collapse
   * @param {HTMLElement} section - Accordion section
   * @param {boolean} expand - True to expand
   */
  toggleAccordion(section, expand) {
    if (!section) return;

    const header = section.querySelector('.accordion-header');
    const body = section.querySelector('.accordion-body');
    const icon = section.querySelector('.accordion-icon');

    if (expand) {
      section.classList.add('active');
      
      // Expand body
      body.style.display = 'block';
      const height = body.scrollHeight;
      body.style.height = '0px';
      body.style.opacity = '0';

      requestAnimationFrame(() => {
        body.style.transition = 'height 350ms ease-out, opacity 350ms ease-out';
        body.style.height = height + 'px';
        body.style.opacity = '1';
      });

      // Rotate icon
      if (icon) {
        icon.style.transition = 'transform 300ms ease-out';
        icon.style.transform = 'rotate(90deg)';
      }

      // Subtle highlight
      if (header) {
        header.style.backgroundColor = '#F3F4F6';
      }

      setTimeout(() => {
        body.style.height = 'auto';
      }, 350);

    } else {
      section.classList.remove('active');
      
      const height = body.scrollHeight;
      body.style.height = height + 'px';

      requestAnimationFrame(() => {
        body.style.transition = 'height 300ms ease-in, opacity 300ms ease-in';
        body.style.height = '0px';
        body.style.opacity = '0';
      });

      if (icon) {
        icon.style.transform = 'rotate(0deg)';
      }

      if (header) {
        header.style.backgroundColor = '';
      }

      setTimeout(() => {
        body.style.display = 'none';
      }, 300);
    }
  }

  /**
   * Show modal with backdrop and scale animation
   * @param {HTMLElement} modal - Modal element
   */
  showModal(modal) {
    if (!modal) return;

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      backdrop-filter: blur(2px);
    `;
    document.body.appendChild(backdrop);

    // Fade in backdrop
    requestAnimationFrame(() => {
      backdrop.style.transition = 'opacity 200ms ease-out';
      backdrop.style.opacity = '1';
    });

    // Position and show modal
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0;
      z-index: 1000;
      background: white;
      border-radius: 12px;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
    `;
    modal.classList.add('modal-open');
    
    // Animate in
    requestAnimationFrame(() => {
      modal.style.transition = 'opacity 250ms ease-out, transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      modal.style.opacity = '1';
      modal.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Close on backdrop click
    backdrop.addEventListener('click', () => this.hideModal(modal));

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideModal(modal);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide modal with scale-down animation
   * @param {HTMLElement} modal - Modal element
   */
  hideModal(modal) {
    if (!modal) return;

    const backdrop = document.querySelector('.modal-backdrop');

    // Animate out modal
    modal.style.transition = 'opacity 200ms ease-in, transform 200ms ease-in';
    modal.style.opacity = '0';
    modal.style.transform = 'translate(-50%, -50%) scale(0.9)';

    // Fade out backdrop
    if (backdrop) {
      backdrop.style.opacity = '0';
    }

    // Remove after animation
    setTimeout(() => {
      modal.classList.remove('modal-open');
      modal.remove();
      if (backdrop) backdrop.remove();
      
      // Restore body scroll
      document.body.style.overflow = '';
    }, 200);
  }

  /**
   * Show loading skeleton screen
   * @param {HTMLElement} container - Container to show skeleton in
   * @param {number} rows - Number of skeleton rows
   * @returns {HTMLElement} - Skeleton element
   */
  showLoadingSkeleton(container, rows = 3) {
    if (!container) return null;

    const skeleton = document.createElement('div');
    skeleton.className = 'loading-skeleton';
    
    for (let i = 0; i < rows; i++) {
      const row = document.createElement('div');
      row.className = 'skeleton-row';
      row.style.cssText = `
        height: 16px;
        background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        margin: 12px 0;
        width: ${i === rows - 1 ? '60%' : '100%'};
        animation: shimmer 1.5s infinite;
      `;
      skeleton.appendChild(row);
    }

    container.appendChild(skeleton);
    animationEngine.fadeIn(skeleton, 200);

    return skeleton;
  }

  /**
   * Hide loading skeleton and show content
   * @param {HTMLElement} skeleton - Skeleton element
   * @param {HTMLElement} content - Content to show
   */
  hideLoadingSkeleton(skeleton, content) {
    if (!skeleton) return;

    // Fade out skeleton
    skeleton.style.transition = 'opacity 200ms ease-out';
    skeleton.style.opacity = '0';

    setTimeout(() => {
      skeleton.remove();

      // Show content
      if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
          content.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out';
          content.style.opacity = '1';
          content.style.transform = 'translateY(0)';
        });
      }
    }, 200);
  }

  /**
   * Show loading spinner overlay
   * @param {HTMLElement} container - Container element
   * @param {string} message - Loading message
   * @returns {HTMLElement} - Loading overlay
   */
  showLoadingOverlay(container, message = 'Loading...') {
    if (!container) return null;

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 100;
      opacity: 0;
    `;

    overlay.innerHTML = `
      <div class="spinner" style="
        width: 40px;
        height: 40px;
        border: 4px solid #E5E7EB;
        border-top-color: #6366F1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <p style="margin-top: 16px; color: #6B7280; font-weight: 500;">${message}</p>
    `;

    container.style.position = 'relative';
    container.appendChild(overlay);

    // Fade in
    animationEngine.fadeIn(overlay, 200);

    this.loadingElements.set(container, overlay);
    return overlay;
  }

  /**
   * Hide loading overlay
   * @param {HTMLElement} container - Container element
   */
  hideLoadingOverlay(container) {
    if (!container) return;

    const overlay = this.loadingElements.get(container);
    if (!overlay) return;

    overlay.style.transition = 'opacity 200ms ease-out';
    overlay.style.opacity = '0';

    setTimeout(() => {
      overlay.remove();
      this.loadingElements.delete(container);
    }, 200);
  }

  /**
   * Animate page transition (slide left/right)
   * @param {HTMLElement} oldPage - Current page
   * @param {HTMLElement} newPage - New page
   * @param {string} direction - 'left' or 'right'
   */
  transitionPage(oldPage, newPage, direction = 'left') {
    if (!newPage) return;

    const slideOut = direction === 'left' ? '-100%' : '100%';
    const slideIn = direction === 'left' ? '100%' : '-100%';

    // Slide out old page
    if (oldPage) {
      oldPage.style.transition = 'transform 350ms cubic-bezier(0.4, 0.0, 1, 1)';
      oldPage.style.transform = `translateX(${slideOut})`;

      setTimeout(() => {
        oldPage.style.display = 'none';
      }, 350);
    }

    // Slide in new page
    newPage.style.display = 'block';
    newPage.style.transform = `translateX(${slideIn})`;

    requestAnimationFrame(() => {
      newPage.style.transition = 'transform 350ms cubic-bezier(0.0, 0.0, 0.2, 1)';
      newPage.style.transform = 'translateX(0)';
    });
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - 'success', 'error', 'info', 'warning'
   * @param {number} duration - Auto-dismiss duration (ms)
   */
  showToast(message, type = 'info', duration = 3000) {
    const colors = {
      success: { bg: '#D1FAE5', border: '#10B981', icon: '✓' },
      error: { bg: '#FEE2E2', border: '#EF4444', icon: '✕' },
      info: { bg: '#DBEAFE', border: '#3B82F6', icon: 'ℹ' },
      warning: { bg: '#FEF3C7', border: '#F59E0B', icon: '⚠' }
    };

    const config = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: ${config.bg};
      border: 2px solid ${config.border};
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      max-width: 400px;
      font-weight: 500;
      transform: translateX(500px);
    `;

    toast.innerHTML = `
      <span style="font-size: 18px;">${config.icon}</span>
      <span style="flex: 1;">${message}</span>
      <button class="toast-close" style="
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.6;
        padding: 0;
        width: 20px;
        height: 20px;
      ">×</button>
    `;

    document.body.appendChild(toast);

    // Slide in from right
    requestAnimationFrame(() => {
      toast.style.transition = 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      toast.style.transform = 'translateX(0)';
    });

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.hideToast(toast));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.hideToast(toast), duration);
    }

    return toast;
  }

  /**
   * Hide toast notification
   * @param {HTMLElement} toast - Toast element
   */
  hideToast(toast) {
    if (!toast) return;

    toast.style.transition = 'transform 300ms ease-in, opacity 300ms ease-in';
    toast.style.transform = 'translateX(500px)';
    toast.style.opacity = '0';

    setTimeout(() => toast.remove(), 300);
  }

  /**
   * Show tooltip
   * @param {HTMLElement} target - Element to attach tooltip to
   * @param {string} text - Tooltip text
   * @param {string} position - 'top', 'bottom', 'left', 'right'
   * @returns {HTMLElement} - Tooltip element
   */
  showTooltip(target, text, position = 'top') {
    if (!target) return null;

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background: #1F2937;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.9);
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;
    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 8;
        break;
    }

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';

    // Animate in with delay
    setTimeout(() => {
      tooltip.style.transition = 'opacity 150ms ease-out, transform 150ms ease-out';
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'scale(1)';
    }, 100);

    return tooltip;
  }

  /**
   * Hide tooltip
   * @param {HTMLElement} tooltip - Tooltip element
   */
  hideTooltip(tooltip) {
    if (!tooltip) return;

    tooltip.style.transition = 'opacity 100ms ease-in, transform 100ms ease-in';
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.9)';

    setTimeout(() => tooltip.remove(), 100);
  }

  /**
   * Animate dropdown menu open/close
   * @param {HTMLElement} dropdown - Dropdown element
   * @param {boolean} open - True to open
   */
  toggleDropdown(dropdown, open) {
    if (!dropdown) return;

    if (open) {
      dropdown.style.display = 'block';
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'translateY(-10px) scale(0.95)';
      dropdown.style.transformOrigin = 'top';

      requestAnimationFrame(() => {
        dropdown.style.transition = 'opacity 200ms ease-out, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0) scale(1)';
      });
    } else {
      dropdown.style.transition = 'opacity 150ms ease-in, transform 150ms ease-in';
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'translateY(-10px) scale(0.95)';

      setTimeout(() => {
        dropdown.style.display = 'none';
      }, 150);
    }
  }

  /**
   * Animate breadcrumb navigation
   * @param {HTMLElement} newCrumb - New breadcrumb element
   */
  addBreadcrumb(newCrumb) {
    if (!newCrumb) return;

    newCrumb.style.opacity = '0';
    newCrumb.style.transform = 'translateX(-10px)';

    requestAnimationFrame(() => {
      newCrumb.style.transition = 'opacity 250ms ease-out, transform 250ms ease-out';
      newCrumb.style.opacity = '1';
      newCrumb.style.transform = 'translateX(0)';
    });
  }

  /**
   * Clean up all loading overlays and elements
   */
  cleanup() {
    this.loadingElements.forEach((overlay) => {
      overlay.remove();
    });
    this.loadingElements.clear();
  }
}

// Create singleton instance
const navigationAnimations = new NavigationAnimations();

export { navigationAnimations };
