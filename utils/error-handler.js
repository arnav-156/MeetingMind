// ============================================
// Error Handler - Centralized error management
// ============================================

export class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 50;
    this.retryAttempts = new Map();
  }

  /**
   * Handle an error with user-friendly messaging
   */
  handle(error, operation = 'operation', options = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      operation,
      error: error.message || String(error),
      severity: this.getSeverity(error),
      userMessage: this.getUserFriendlyMessage(error, operation),
      solution: this.getSolution(error, operation),
      stack: error.stack
    };

    // Log the error
    this.logError(errorInfo);

    // Notify user if needed
    if (options.notify !== false) {
      this.notifyUser(errorInfo);
    }

    return errorInfo;
  }

  /**
   * Get severity level of error
   */
  getSeverity(error) {
    const errorMsg = String(error.message || error).toLowerCase();
    
    if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
      return 'critical';
    }
    if (errorMsg.includes('network') || errorMsg.includes('offline')) {
      return 'high';
    }
    if (errorMsg.includes('not found') || errorMsg.includes('unavailable')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  getUserFriendlyMessage(error, operation) {
    const errorMsg = String(error.message || error).toLowerCase();
    
    // Network errors
    if (!navigator.onLine || errorMsg.includes('offline')) {
      return '[OFFLINE] You appear to be offline. Please check your internet connection.';
    }
    
    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      return '[NETWORK] Network error. Please check your connection and try again.';
    }

    // Permission errors
    if (errorMsg.includes('permission') || errorMsg.includes('denied') || errorMsg.includes('notallowed')) {
      return '[PERMISSION] Permission denied. Please grant microphone access in browser settings.';
    }

    // AI/Chrome API errors
    if (errorMsg.includes('ai') || errorMsg.includes('not available') || errorMsg.includes('promptapi')) {
      return '[AI] AI service unavailable. Using fallback method...';
    }

    // Audio errors
    if (errorMsg.includes('audio') || errorMsg.includes('microphone') || errorMsg.includes('mediastream')) {
      return '[AUDIO] Recording issue detected. Check your microphone and try again.';
    }

    // Storage errors
    if (errorMsg.includes('storage') || errorMsg.includes('quota') || errorMsg.includes('indexeddb')) {
      return '[STORAGE] Storage error. Your browser may be running low on space.';
    }

    // Context invalidated (extension reload)
    if (errorMsg.includes('context invalidated') || errorMsg.includes('receiving end does not exist')) {
      return '[RELOAD] Extension was updated. Please refresh this page.';
    }

    // Operation-specific messages
    switch (operation) {
      case 'start-recording':
        return '[ERROR] Could not start recording. Please check microphone permissions.';
      case 'stop-recording':
        return '[ERROR] Could not stop recording properly. Your data may still be saved.';
      case 'generate-summary':
        return '[ERROR] Could not generate summary. Try again in a moment.';
      case 'save-transcript':
        return '[ERROR] Could not save transcript. Check available storage space.';
      case 'export':
        return '[ERROR] Export failed. Try a different format or check disk space.';
      default:
        return `[ERROR] An error occurred during ${operation}. Please try again.`;
    }
  }

  /**
   * Get actionable solution for error
   */
  getSolution(error, operation) {
    const errorMsg = String(error.message || error).toLowerCase();

    if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
      return 'Go to Chrome Settings > Privacy > Microphone and allow access for this site.';
    }

    if (errorMsg.includes('network') || !navigator.onLine) {
      return 'Check your internet connection and try again.';
    }

    if (errorMsg.includes('storage') || errorMsg.includes('quota')) {
      return 'Free up browser storage: Settings > Privacy > Clear browsing data.';
    }

    if (errorMsg.includes('context invalidated')) {
      return 'Refresh the page to reconnect with the extension.';
    }

    return 'Try again in a few moments. If the problem persists, contact support.';
  }

  /**
   * Execute function with automatic retry logic
   */
  async executeWithRetry(operation, fn, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    const initialDelay = options.initialDelay || 1000;
    
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Track attempt count
        this.retryAttempts.set(operation, (this.retryAttempts.get(operation) || 0) + 1);

        const result = await fn();
        
        // Success - clear retry count
        this.retryAttempts.delete(operation);
        return { success: true, result };

      } catch (error) {
        lastError = error;
        console.warn(`[RETRY] Attempt ${attempt + 1} of ${maxAttempts} failed for ${operation}:`, error.message);

        // If not last attempt, wait and retry
        if (attempt < maxAttempts - 1) {
          const delay = this.getRetryDelay(attempt, initialDelay);
          console.log(`[WAIT] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed
    this.retryAttempts.delete(operation);
    const errorInfo = this.handle(lastError, operation);
    return { success: false, error: errorInfo };
  }

  /**
   * Calculate exponential backoff delay
   */
  getRetryDelay(attempt, initialDelay = 1000) {
    const maxDelay = 10000; // 10 seconds max
    const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
    return delay;
  }

  /**
   * Check if user is online
   */
  checkOnlineStatus() {
    const online = navigator.onLine;
    return {
      online,
      message: online ? 
        '[OK] Connected to the internet' : 
        '[OFFLINE] Offline - Some features may not work',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check microphone quality/availability
   */
  async checkAudioQuality() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          available: false,
          message: '[WARNING] Microphone API not available in this browser'
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tracks = stream.getAudioTracks();
      
      if (tracks.length === 0) {
        return {
          available: false,
          message: '[WARNING] No microphone detected'
        };
      }

      const track = tracks[0];
      const settings = track.getSettings();
      
      // Stop the stream
      stream.getTracks().forEach(t => t.stop());

      return {
        available: true,
        message: '[OK] Microphone is working',
        deviceId: settings.deviceId,
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount
      };

    } catch (error) {
      return {
        available: false,
        message: '[ERROR] Could not access microphone: ' + error.message,
        error: error.message
      };
    }
  }

  /**
   * Log error to internal log
   */
  logError(errorInfo) {
    this.errorLog.unshift(errorInfo);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console
    console.error(`[ERROR] ${errorInfo.operation}:`, errorInfo.error);
    if (errorInfo.solution) {
      console.info(`[SOLUTION] ${errorInfo.solution}`);
    }
  }

  /**
   * Notify user of error (could be extended to show UI notifications)
   */
  notifyUser(errorInfo) {
    // For now, just console log. In future, could show toast notifications
    console.warn(`[USER MESSAGE] ${errorInfo.userMessage}`);
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const byOperation = {};

    this.errorLog.forEach(err => {
      bySeverity[err.severity]++;
      byOperation[err.operation] = (byOperation[err.operation] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      bySeverity,
      byOperation,
      recentErrors: this.errorLog.slice(0, 5)
    };
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
