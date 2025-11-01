// ============================================
// Content Script - Injected into meeting pages
// ============================================

console.log('🎯 MeetingMind content script loaded');

// Detect meeting platform
const detectPlatform = () => {
  const hostname = window.location.hostname;
  
  if (hostname.includes('meet.google.com')) {
    return 'Google Meet';
  } else if (hostname.includes('zoom.us')) {
    return 'Zoom';
  } else if (hostname.includes('teams.microsoft.com')) {
    return 'Microsoft Teams';
  }
  
  return 'Unknown';
};

// Detect if user is in an active meeting
const isInMeeting = () => {
  const platform = detectPlatform();
  
  if (platform === 'Google Meet') {
    // Check for active meeting indicators
    return document.querySelector('[data-meeting-title]') !== null ||
           document.querySelector('[data-call-id]') !== null ||
           document.querySelector('[jsname="HlFzId"]') !== null;
  } else if (platform === 'Zoom') {
    return document.querySelector('#wc-container') !== null ||
           document.querySelector('.meeting-client') !== null;
  } else if (platform === 'Microsoft Teams') {
    return document.querySelector('[data-tid="meeting-panel"]') !== null;
  }
  
  return false;
};

// Get meeting title
const getMeetingTitle = () => {
  const platform = detectPlatform();
  
  if (platform === 'Google Meet') {
    const titleEl = document.querySelector('[data-meeting-title]') ||
                    document.querySelector('.u6vdEc');
    return titleEl?.textContent || 'Google Meet';
  } else if (platform === 'Zoom') {
    const titleEl = document.querySelector('.meeting-topic');
    return titleEl?.textContent || 'Zoom Meeting';
  } else if (platform === 'Microsoft Teams') {
    const titleEl = document.querySelector('.ts-calling-thread-header');
    return titleEl?.textContent || 'Teams Meeting';
  }
  
  return 'Meeting';
};

// Inject floating button for quick access (with drag-and-drop)
function injectFloatingButton() {
  if (document.getElementById('meetingmind-float-btn')) {
    return; // Already injected
  }

  const container = document.createElement('div');
  container.id = 'meetingmind-float-btn';
  
  // Load saved position or use default
  const savedPosition = loadButtonPosition();
  
  container.style.cssText = `
    position: fixed;
    bottom: ${savedPosition.bottom}px;
    right: ${savedPosition.right}px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    cursor: move;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: box-shadow 0.3s ease, transform 0.1s ease;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  `;
  
  container.innerHTML = `
    <span style="font-size: 18px; pointer-events: none;">🎙️</span>
    <span style="pointer-events: none;">MeetingMind</span>
  `;

  // Drag-and-drop state
  let isDragging = false;
  let hasMoved = false;
  let startX, startY;
  let initialRight, initialBottom;
  let dragThreshold = 5; // Pixels moved before considering it a drag

  // Mouse/Touch down - start potential drag
  const handlePointerDown = (e) => {
    isDragging = true;
    hasMoved = false;
    
    // Get initial position
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    
    // Get current position (convert from bottom/right to coordinates)
    const rect = container.getBoundingClientRect();
    initialRight = window.innerWidth - rect.right;
    initialBottom = window.innerHeight - rect.bottom;
    
    // Visual feedback
    container.style.cursor = 'grabbing';
    container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
    container.style.transform = 'scale(1.05)';
    container.style.transition = 'none'; // Disable transitions during drag
    
    e.preventDefault();
  };

  // Mouse/Touch move - drag
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    // Check if moved beyond threshold
    if (!hasMoved && (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)) {
      hasMoved = true;
    }
    
    if (hasMoved) {
      // Calculate new position (bottom/right coordinates)
      let newRight = initialRight - deltaX;
      let newBottom = initialBottom - deltaY;
      
      // Constrain to viewport bounds (with padding)
      const padding = 10;
      const rect = container.getBoundingClientRect();
      
      newRight = Math.max(padding, Math.min(window.innerWidth - rect.width - padding, newRight));
      newBottom = Math.max(padding, Math.min(window.innerHeight - rect.height - padding, newBottom));
      
      // Update position
      container.style.right = `${newRight}px`;
      container.style.bottom = `${newBottom}px`;
    }
    
    e.preventDefault();
  };

  // Mouse/Touch up - end drag
  const handlePointerUp = (e) => {
    if (!isDragging) return;
    
    // Reset visual feedback
    container.style.cursor = 'move';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    container.style.transform = 'scale(1)';
    container.style.transition = 'box-shadow 0.3s ease, transform 0.1s ease';
    
    // Save position if dragged
    if (hasMoved) {
      const rect = container.getBoundingClientRect();
      const right = window.innerWidth - rect.right;
      const bottom = window.innerHeight - rect.bottom;
      
      saveButtonPosition(right, bottom);
      console.log('💾 Button position saved:', { right, bottom });
    }
    
    // If not moved, treat as click
    if (!hasMoved) {
      openSidePanel();
    }
    
    isDragging = false;
    hasMoved = false;
    
    e.preventDefault();
  };

  // Hover effects (only when not dragging)
  container.addEventListener('mouseenter', () => {
    if (!isDragging) {
      container.style.transform = 'scale(1.05)';
    }
  });
  
  container.addEventListener('mouseleave', () => {
    if (!isDragging) {
      container.style.transform = 'scale(1)';
    }
  });

  // Mouse events
  container.addEventListener('mousedown', handlePointerDown);
  document.addEventListener('mousemove', handlePointerMove);
  document.addEventListener('mouseup', handlePointerUp);

  // Touch events (for mobile/tablet)
  container.addEventListener('touchstart', handlePointerDown, { passive: false });
  document.addEventListener('touchmove', handlePointerMove, { passive: false });
  document.addEventListener('touchend', handlePointerUp, { passive: false });

  // Function to open side panel
  const openSidePanel = () => {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.warn('⚠️ Extension context invalidated. Please reload the page.');
      alert('MeetingMind extension was updated. Please reload this page to continue.');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error opening side panel:', chrome.runtime.lastError);
          alert('Could not open MeetingMind. Please reload the page and try again.');
        }
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('MeetingMind extension needs to be reloaded. Please refresh this page.');
    }
  };

  document.body.appendChild(container);
}

// Save button position to localStorage
function saveButtonPosition(right, bottom) {
  try {
    localStorage.setItem('meetingmind_button_position', JSON.stringify({ right, bottom }));
  } catch (error) {
    console.warn('Could not save button position:', error);
  }
}

// Load button position from localStorage
function loadButtonPosition() {
  try {
    const saved = localStorage.getItem('meetingmind_button_position');
    if (saved) {
      const position = JSON.parse(saved);
      // Validate position is within reasonable bounds
      if (position.right >= 0 && position.bottom >= 0) {
        return position;
      }
    }
  } catch (error) {
    console.warn('Could not load button position:', error);
  }
  
  // Default position
  return { right: 20, bottom: 20 };
}

// Monitor for meeting state changes
let inMeetingState = false;
let checkInterval = null;

function monitorMeetingState() {
  const currentlyInMeeting = isInMeeting();
  
  if (currentlyInMeeting && !inMeetingState) {
    // Just entered a meeting
    inMeetingState = true;
    const platform = detectPlatform();
    const title = getMeetingTitle();
    
    console.log('✅ Meeting detected:', platform, '-', title);
    
    // Notify background script with error handling
    if (chrome.runtime?.id) {
      try {
        chrome.runtime.sendMessage({
          type: 'MEETING_DETECTED',
          data: {
            platform,
            meetingTitle: title,
            url: window.location.href
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('⚠️ Could not notify background:', chrome.runtime.lastError.message);
          }
        });
      } catch (error) {
        console.warn('⚠️ Extension context lost:', error.message);
      }
    }
    
    // Inject floating button
    injectFloatingButton();
    
  } else if (!currentlyInMeeting && inMeetingState) {
    // Left the meeting
    inMeetingState = false;
    console.log('👋 Left meeting');
    
    // Notify background script with error handling
    if (chrome.runtime?.id) {
      try {
        chrome.runtime.sendMessage({
          type: 'MEETING_ENDED'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('⚠️ Could not notify background:', chrome.runtime.lastError.message);
          }
        });
      } catch (error) {
        console.warn('⚠️ Extension context lost:', error.message);
      }
    }
    
    // Remove floating button
    const button = document.getElementById('meetingmind-float-btn');
    if (button) {
      button.remove();
    }
  }
}

// Start monitoring when page is loaded
window.addEventListener('load', () => {
  console.log('🔍 Starting meeting monitor...');
  
  // Check immediately
  monitorMeetingState();
  
  // Check every 3 seconds
  checkInterval = setInterval(monitorMeetingState, 3000);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    console.warn('⚠️ Extension context invalidated');
    return false;
  }
  
  if (message.type === 'GET_MEETING_INFO') {
    sendResponse({
      platform: detectPlatform(),
      meetingTitle: getMeetingTitle(),
      isInMeeting: isInMeeting()
    });
  }
  
  if (message.type === 'START_AUDIO_CAPTURE') {
    startSpeechRecognition(message.meetingId);
    sendResponse({ success: true });
  }
  
  if (message.type === 'STOP_AUDIO_CAPTURE') {
    stopSpeechRecognition();
    sendResponse({ success: true });
  }
  
  return true;
});

// Speech Recognition variables
let recognition = null;
let recognitionActive = false;
let recognitionRunning = false; // Track if recognition.start() has been called

// Start speech recognition
function startSpeechRecognition(meetingId) {
  try {
    console.log('🎤 Starting Web Speech API recognition...');
    
    // Use Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Web Speech API not available');
      return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    let lastTranscript = '';
    let interimTranscript = '';
    
    recognition.onresult = (event) => {
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          lastTranscript = transcript;
          
          // Send to background for processing
          if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({
              type: 'AUDIO_CHUNK',
              data: {
                text: transcript,
                timestamp: new Date().toISOString(),
                confidence: event.results[i][0].confidence,
                isFinal: true
              }
            }).catch(err => console.warn('Could not send transcript:', err));
          }
        } else {
          interimTranscript += transcript;
        }
      }
    };
    
    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      
      // Don't restart on these errors
      if (event.error === 'aborted' || event.error === 'not-allowed') {
        recognitionActive = false;
        recognitionRunning = false;
        return;
      }
      
      // Auto-restart on certain errors (with state check)
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        setTimeout(() => {
          if (recognitionActive && recognition && !recognitionRunning) {
            console.log('🔄 Restarting recognition after error...');
            try {
              recognition.start();
              // recognitionRunning will be set by onstart handler
            } catch (e) {
              console.warn('Could not restart recognition:', e);
              recognitionRunning = false;
            }
          }
        }, 1000);
      }
    };
    
    recognition.onstart = () => {
      recognitionRunning = true;
      console.log('✅ Recognition started');
    };
    
    recognition.onend = () => {
      recognitionRunning = false;
      console.log('🛑 Recognition ended');
      
      // Auto-restart if still active and not manually stopped
      if (recognitionActive) {
        console.log('🔄 Auto-restarting recognition...');
        setTimeout(() => {
          if (recognitionActive && !recognitionRunning) {
            try {
              recognition.start();
              // recognitionRunning will be set by onstart handler
            } catch (e) {
              console.warn('Could not restart recognition:', e);
              recognitionRunning = false;
            }
          }
        }, 500);
      }
    };
    
    recognitionActive = true;
    try {
      recognition.start();
      // recognitionRunning will be set by onstart handler
      console.log('✅ Speech recognition starting...');
    } catch (e) {
      console.error('❌ Failed to start recognition:', e);
      recognitionActive = false;
      recognitionRunning = false;
    }
    
  } catch (error) {
    console.error('❌ Error starting speech recognition:', error);
  }
}

// Stop speech recognition
function stopSpeechRecognition() {
  try {
    console.log('🛑 Stopping speech recognition...');
    recognitionActive = false;
    recognitionRunning = false;
    
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    
    console.log('✅ Speech recognition stopped');
  } catch (error) {
    console.error('❌ Error stopping speech recognition:', error);
  }
}

// Try to inject button if already in meeting
setTimeout(() => {
  if (isInMeeting() && chrome.runtime?.id) {
    injectFloatingButton();
  }
}, 2000);
