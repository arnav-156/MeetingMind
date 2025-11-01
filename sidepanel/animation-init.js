// ============================================
// Animation System Initialization
// ============================================

// Import animation modules
import { animationEngine } from '../utils/animation-engine.js';
import { meetingIQAnimations } from '../utils/meeting-iq-animations.js';
import { transcriptAnimations } from '../utils/transcript-animations.js';
import { actionItemAnimations } from '../utils/action-item-animations.js';
import { emailAnimations } from '../utils/email-animations.js';
import { navigationAnimations } from '../utils/navigation-animations.js';

// Make animations globally available for sidepanel.js
window.animations = {
  engine: animationEngine,
  meetingIQ: meetingIQAnimations,
  transcript: transcriptAnimations,
  actionItem: actionItemAnimations,
  email: emailAnimations,
  navigation: navigationAnimations
};

console.log('✨ Animation system loaded successfully');
