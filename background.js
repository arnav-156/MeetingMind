// ============================================
// MeetingMind - Background Service Worker
// ============================================

// NOTE: AIManager uses window.ai APIs which are NOT available in service workers
// AI processing is handled in sidepanel.js instead
import { StorageManager } from './utils/storage.js';
import { AudioProcessor } from './utils/audio-processor.js';
import { errorHandler } from './utils/error-handler.js';
import { AnalyticsManager } from './utils/analytics.js';
import { MeetingIQEngine } from './utils/meeting-iq-engine.js';
import { MeetingTypeDetector } from './utils/meeting-type-detector.js';
import { 
  initializeReminderSystem, 
  triggerReminder, 
  handleNotificationButtonClick, 
  handleNotificationClick 
} from './utils/reminder-manager.js';
import { MeetingSeriesDetector } from './utils/meeting-series-detector.js';
import { PreMeetingBriefGenerator } from './utils/pre-meeting-brief.js';

// Load SpeakerDetector class
let SpeakerDetector = null;
import('./utils/speaker-detector.js').then(module => {
  SpeakerDetector = module.default || module.SpeakerDetector || class {
    constructor() { this.speakers = []; this.currentSpeaker = null; this.speakerCount = 0; }
    getCurrentSpeaker(timestamp, text = '') {
      if (!this.currentSpeaker) {
        this.speakerCount++;
        this.currentSpeaker = { id: `speaker_${this.speakerCount}`, name: `Speaker ${this.speakerCount}` };
        this.speakers.push(this.currentSpeaker);
      }
      return this.currentSpeaker;
    }
    getAllSpeakers() { return this.speakers; }
    renameSpeaker(id, name) {
      const speaker = this.speakers.find(s => s.id === id);
      if (speaker) { speaker.name = name; return true; }
      return false;
    }
    reset() { this.speakers = []; this.currentSpeaker = null; this.speakerCount = 0; }
  };
}).catch(err => {
  console.warn('Could not load SpeakerDetector, using fallback:', err);
  // Fallback simple implementation
  SpeakerDetector = class {
    constructor() { this.speakers = []; this.currentSpeaker = null; this.speakerCount = 0; }
    getCurrentSpeaker(timestamp, text = '') {
      if (!this.currentSpeaker) {
        this.speakerCount++;
        this.currentSpeaker = { id: `speaker_${this.speakerCount}`, name: `Speaker ${this.speakerCount}` };
        this.speakers.push(this.currentSpeaker);
      }
      return this.currentSpeaker;
    }
    getAllSpeakers() { return this.speakers; }
    renameSpeaker(id, name) {
      const speaker = this.speakers.find(s => s.id === id);
      if (speaker) { speaker.name = name; return true; }
      return false;
    }
    reset() { this.speakers = []; this.currentSpeaker = null; this.speakerCount = 0; }
  };
});

// Global state
let currentMeeting = null;
let audioProcessor = null;
// Note: aiManager removed - AI processing happens in sidepanel.js (has window.ai access)
let storageManager = null;
let speakerDetector = null;
let analyticsManager = null;
let meetingIQEngine = null; // Meeting IQ scoring engine
let meetingTypeDetector = null; // AI meeting type detector
let typeDetectionPerformed = false; // Flag to track if we've suggested a type
let transcriptBuffer = [];
let isRecording = false;
let keepAliveInterval = null;
let summaryInterval = null; // Store interval ID for periodic summaries
let meetingIQInterval = null; // Store interval ID for Meeting IQ updates
let transcriptCount = 0; // Track transcript count for triggering action items
const MAX_BUFFER_SIZE = 20; // Limit buffer to prevent memory issues
const MAX_TRANSCRIPT_LENGTH = 10000; // Max characters per transcript entry
const ACTION_ITEM_TRIGGER_COUNT = 10; // Extract action items every N transcripts
const MEETING_IQ_UPDATE_INTERVAL = 60000; // Update Meeting IQ every minute

// Pre-Meeting Brief System
let seriesDetector = null;
let briefGenerator = null;

// Initialize on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🎯 MeetingMind installed!', details.reason);
  
  // Initialize managers
  storageManager = new StorageManager();
  await storageManager.initialize();
  
  // Initialize reminder system
  await initializeReminderSystem();
  console.log('⏰ Reminder system initialized');
  
  // Initialize Pre-Meeting Brief system
  await initializeBriefSystem();
  console.log('📋 Pre-Meeting Brief system initialized');
  
  // Set default settings
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      settings: {
        summaryInterval: 5, // minutes
        language: 'en',
        autoStart: false,
        darkMode: true,
        retentionDays: 30
      }
    });
  }
});

// Handle extension icon click - open side panel
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🖱️ Extension icon clicked');
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('❌ Error opening side panel:', error);
  }
});

// Handle keyboard shortcuts (commands)
chrome.commands.onCommand.addListener(async (command) => {
  console.log('⌨️ Keyboard shortcut triggered:', command);
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    switch (command) {
      case 'open-side-panel':
        await chrome.sidePanel.open({ tabId: tab.id });
        break;
        
      case 'toggle-recording':
        // Send message to side panel to toggle recording
        if (isRecording) {
          await stopRecording(() => {});
        } else {
          // Get current tab info for recording
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_INFO' });
          await startRecording({
            tabId: tab.id,
            meetingTitle: response?.meetingTitle || 'Meeting',
            platform: response?.platform || 'unknown'
          }, () => {});
        }
        break;
        
      case 'generate-summary':
        await generateSummary(() => {});
        break;
    }
  } catch (error) {
    console.error('❌ Error handling keyboard shortcut:', error);
  }
});

// Keep service worker alive - ENHANCED
function keepAlive() {
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  
  // Multiple keep-alive strategies
  keepAliveInterval = setInterval(() => {
    // Strategy 1: Platform info check
    chrome.runtime.getPlatformInfo(() => {
      console.log('⏰ Keep-alive ping');
    });
    
    // Strategy 2: Storage read (lightweight)
    chrome.storage.local.get(['keepAlive'], () => {
      // Just to keep active
    });
  }, 20000); // Every 20 seconds
  
  console.log('✅ Keep-alive timer started');
}

// Stop keep-alive when not recording
function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('🛑 Keep-alive timer stopped');
  }
}

// Handle messages from content scripts and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.type);
  
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'OPEN_SIDE_PANEL':
        // Open side panel when floating button is clicked
        if (sender.tab && sender.tab.id) {
          await chrome.sidePanel.open({ tabId: sender.tab.id });
          sendResponse({ success: true });
        } else {
          sendResponse({ error: 'No tab ID available' });
        }
        break;
        
      case 'MEETING_DETECTED':
        // Store meeting info when detected by content script
        console.log('✅ Meeting detected:', message.data);
        currentMeeting = {
          ...message.data,
          detectedAt: new Date().toISOString()
        };
        sendResponse({ success: true });
        break;
        
      case 'MEETING_ENDED':
        // Clear meeting info when user leaves
        console.log('👋 Meeting ended');
        sendResponse({ success: true });
        break;
      
      case 'START_RECORDING':
        await startRecording(message.data, sendResponse);
        break;
        
      case 'STOP_RECORDING':
        await stopRecording(sendResponse);
        break;
        
      case 'PAUSE_RECORDING':
        pauseRecording(sendResponse);
        break;
        
      case 'RESUME_RECORDING':
        resumeRecording(sendResponse);
        break;
        
      case 'GET_STATUS':
        sendResponse({ 
          isRecording, 
          meeting: currentMeeting,
          bufferSize: transcriptBuffer.length 
        });
        break;
        
      case 'GET_TRANSCRIPT':
        sendResponse({ transcript: transcriptBuffer });
        break;
        
      case 'GENERATE_SUMMARY':
        await generateSummary(sendResponse);
        break;
        
      case 'EXTRACT_ACTION_ITEMS':
        await extractActionItems(sendResponse);
        break;
        
      case 'GENERATE_EMAIL':
        await generateEmail(sendResponse);
        break;
        
      case 'GET_MEETING_IQ':
        // Get current Meeting IQ score on demand
        if (meetingIQEngine) {
          try {
            const iqData = await meetingIQEngine.calculateScore();
            sendResponse({ success: true, data: iqData });
          } catch (error) {
            sendResponse({ error: error.message });
          }
        } else {
          sendResponse({ error: 'Meeting IQ not initialized' });
        }
        break;
        
      case 'AUDIO_CHUNK':
        await processAudioChunk(message.data, sendResponse);
        break;
        
      case 'CHECK_AI_AVAILABILITY':
        await checkAIAvailability(sendResponse);
        break;
        
      case 'GET_SPEAKERS':
        if (speakerDetector) {
          sendResponse({ speakers: speakerDetector.getAllSpeakers() });
        } else {
          sendResponse({ speakers: [] });
        }
        break;
        
      case 'RENAME_SPEAKER':
        if (speakerDetector && message.data) {
          const success = speakerDetector.renameSpeaker(message.data.speakerId, message.data.newName);
          sendResponse({ success });
          
          // Broadcast updated speakers to side panel
          broadcastToSidePanel({
            type: 'SPEAKERS_UPDATED',
            speakers: speakerDetector.getAllSpeakers()
          });
        } else {
          sendResponse({ success: false });
        }
        break;
      
      case 'GET_ANALYTICS':
        if (analyticsManager && isRecording) {
          const stats = analyticsManager.getStatistics();
          const wordCloud = analyticsManager.getWordCloudData(30);
          const distribution = analyticsManager.getSpeakerDistribution();
          
          sendResponse({ 
            success: true,
            analytics: {
              statistics: stats,
              wordCloud: wordCloud,
              distribution: distribution
            }
          });
        } else {
          sendResponse({ success: false, error: 'No analytics available' });
        }
        break;
        
      case 'CHANGE_MEETING_TYPE':
        // User accepted AI suggestion or manually changed type during recording
        if (message.meetingType && isRecording) {
          console.log(`🔄 Changing meeting type to: ${message.meetingType}`);
          
          // Update current meeting info
          currentMeeting.meetingType = message.meetingType;
          
          // Re-initialize Meeting IQ Engine with new type
          if (meetingIQEngine) {
            const MeetingIQEngine = (await import('./utils/meeting-iq-engine.js')).default;
            meetingIQEngine = new MeetingIQEngine({
              meetingType: message.meetingType,
              meetingTitle: currentMeeting.title || 'Meeting'
            });
            console.log('✨ Meeting IQ Engine reinitialized with new type');
          }
          
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Not recording or invalid type' });
        }
        break;
        
      case 'GENERATE_ICS':
        // Generate .ics file for follow-up meeting
        try {
          const { generateFollowUpICS, generateICSFilename } = await import('./utils/calendar-integration.js');
          const { storageDB } = await import('./utils/storage.js');
          
          const meetingId = message.meetingId;
          if (!meetingId) {
            sendResponse({ success: false, error: 'No meeting ID provided' });
            break;
          }
          
          // Get meeting data
          const meeting = await storageDB.getMeeting(meetingId);
          const actionItems = await storageDB.getActionItemsByMeetingId(meetingId);
          
          if (!meeting) {
            sendResponse({ success: false, error: 'Meeting not found' });
            break;
          }
          
          // Generate ICS content
          const icsContent = generateFollowUpICS(meeting, actionItems, message.options || {});
          const filename = generateICSFilename(meeting);
          
          sendResponse({ 
            success: true, 
            icsContent, 
            filename 
          });
        } catch (error) {
          console.error('❌ Error generating ICS:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'COPY_CALENDAR_NOTES':
        // Generate formatted notes for calendar
        try {
          const { generateCalendarNotes } = await import('./utils/calendar-integration.js');
          const { storageDB } = await import('./utils/storage.js');
          
          const meetingId = message.meetingId;
          if (!meetingId) {
            sendResponse({ success: false, error: 'No meeting ID provided' });
            break;
          }
          
          // Get meeting data
          const meeting = await storageDB.getMeeting(meetingId);
          const transcripts = await storageDB.getTranscriptsByMeetingId(meetingId);
          const summaries = await storageDB.getSummariesByMeetingId(meetingId);
          const actionItems = await storageDB.getActionItemsByMeetingId(meetingId);
          
          if (!meeting) {
            sendResponse({ success: false, error: 'Meeting not found' });
            break;
          }
          
          // Get latest summary
          const summary = summaries && summaries.length > 0 ? summaries[summaries.length - 1] : null;
          
          // Generate notes
          const notes = generateCalendarNotes(meeting, transcripts, summary, actionItems);
          
          sendResponse({ 
            success: true, 
            notes 
          });
        } catch (error) {
          console.error('❌ Error generating calendar notes:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'CREATE_SHAREABLE_LINK':
        // Create shareable transcript link
        try {
          const { createShareableLink } = await import('./utils/calendar-integration.js');
          const { storageDB } = await import('./utils/storage.js');
          
          const meetingId = message.meetingId;
          if (!meetingId) {
            sendResponse({ success: false, error: 'No meeting ID provided' });
            break;
          }
          
          // Get meeting data
          const meeting = await storageDB.getMeeting(meetingId);
          const transcripts = await storageDB.getTranscriptsByMeetingId(meetingId);
          const summaries = await storageDB.getSummariesByMeetingId(meetingId);
          const actionItems = await storageDB.getActionItemsByMeetingId(meetingId);
          const meetingIQReport = await storageDB.getMeetingIQReport(meetingId);
          
          if (!meeting) {
            sendResponse({ success: false, error: 'Meeting not found' });
            break;
          }
          
          // Get latest summary
          const summary = summaries && summaries.length > 0 ? summaries[summaries.length - 1] : null;
          
          // Create shareable link
          const linkData = await createShareableLink(
            meeting,
            transcripts,
            summary,
            actionItems,
            meetingIQReport
          );
          
          sendResponse({ 
            success: true, 
            ...linkData 
          });
        } catch (error) {
          console.error('❌ Error creating shareable link:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'CHECK_UPCOMING_MEETINGS':
        // Check for upcoming meetings and generate briefs if needed
        try {
          const timeWindow = message.timeWindow || 10; // Default 10 minutes
          const upcomingMeetings = await checkUpcomingMeetings(timeWindow);
          sendResponse({ success: true, meetings: upcomingMeetings });
        } catch (error) {
          console.error('❌ Error checking upcoming meetings:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'GENERATE_PRE_MEETING_BRIEF':
        // Generate a pre-meeting brief for an upcoming meeting
        try {
          if (!message.meeting) {
            sendResponse({ success: false, error: 'No meeting data provided' });
            break;
          }
          
          const brief = await generatePreMeetingBrief(message.meeting);
          sendResponse({ success: true, brief });
        } catch (error) {
          console.error('❌ Error generating pre-meeting brief:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'UPDATE_BRIEF_STATUS':
        // Update the status of a pre-meeting brief
        try {
          if (!storageManager) {
            sendResponse({ success: false, error: 'Storage not initialized' });
            break;
          }
          
          const { briefId, status } = message;
          if (!briefId || !status) {
            sendResponse({ success: false, error: 'Missing briefId or status' });
            break;
          }
          
          await storageManager.updateBriefStatus(briefId, status);
          sendResponse({ success: true });
        } catch (error) {
          console.error('❌ Error updating brief status:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    sendResponse({ error: error.message });
  }
}

// Start recording meeting
async function startRecording(data, sendResponse) {
  try {
    console.log('🎙️ Starting recording...', data);
    keepAlive();
    
    const tabId = data.tabId;
    if (!tabId) {
      throw new Error('No tab ID provided');
    }
    
    // NOTE: AI Manager NOT initialized here - it runs in sidepanel.js
    // Service workers don't have access to window.ai APIs
    
    // Initialize Audio Processor  
    if (!audioProcessor) {
      audioProcessor = new AudioProcessor();
    }
    
    // Initialize Speaker Detector
    if (SpeakerDetector && !speakerDetector) {
      speakerDetector = new SpeakerDetector();
      console.log('🎭 Speaker detection initialized');
    }
    
    // Initialize Analytics Manager
    if (!analyticsManager) {
      analyticsManager = new AnalyticsManager();
    }
    
    // Initialize Meeting IQ Engine with selected meeting type
    const meetingType = data.meetingType || 'GENERAL';
    if (!meetingIQEngine) {
      meetingIQEngine = new MeetingIQEngine(meetingType);
    } else {
      // Re-initialize with new meeting type for new meeting
      meetingIQEngine = new MeetingIQEngine(meetingType);
    }
    meetingIQEngine.startMeeting();
    console.log(`🧠 Meeting IQ tracking started (Type: ${meetingType})`);
    
    // Create new meeting record
    currentMeeting = {
      id: Date.now().toString(),
      title: data.meetingTitle || `Meeting ${new Date().toLocaleDateString()}`,
      platform: data.platform || 'unknown',
      startTime: new Date().toISOString(),
      status: 'recording',
      tabId: tabId,
      meetingType: meetingType // Store meeting type
    };
    
    if (!storageManager) {
      storageManager = new StorageManager();
      await storageManager.initialize();
    }
    
    await storageManager.saveMeeting(currentMeeting);
    
    isRecording = true;
    transcriptBuffer = [];
    transcriptCount = 0; // Reset transcript counter
    
    // Start analytics tracking
    if (analyticsManager) {
      analyticsManager.startSession(currentMeeting.id);
      console.log('📊 Analytics tracking started');
    }
    
    // Set up periodic summary generation (every 5 minutes)
    setupPeriodicSummary();
    
    // Set up Meeting IQ score updates (every minute)
    setupMeetingIQUpdates();
    
    // Instead of capturing here, we'll use Web Speech API in the content script
    // Send message to content script to start audio capture
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'START_AUDIO_CAPTURE',
        meetingId: currentMeeting.id
      });
      
      console.log('✅ Audio capture request sent to content script');
    } catch (error) {
      console.warn('Could not send capture message to content script:', error);
    }
    
    // Notify side panel
    broadcastToSidePanel({
      type: 'RECORDING_STARTED',
      meeting: currentMeeting
    });
    
    sendResponse({ 
      success: true, 
      meetingId: currentMeeting.id,
      aiAvailable: false // AI processing happens in sidepanel, not background worker
    });
    
  } catch (error) {
    console.error('❌ Error starting recording:', error);
    sendResponse({ error: error.message });
  }
}

// Stop recording
async function stopRecording(sendResponse) {
  try {
    console.log('🛑 Stopping recording...');
    
    if (!currentMeeting) {
      sendResponse({ error: 'No active meeting' });
      return;
    }
    
    isRecording = false;
    
    // Send message to content script to stop audio capture
    if (currentMeeting.tabId) {
      try {
        await chrome.tabs.sendMessage(currentMeeting.tabId, {
          type: 'STOP_AUDIO_CAPTURE'
        });
      } catch (error) {
        console.warn('Could not send stop message to content script:', error);
      }
    }
    
    currentMeeting.endTime = new Date().toISOString();
    currentMeeting.status = 'completed';
    
    // Get final analytics
    let analytics = null;
    if (analyticsManager) {
      analytics = analyticsManager.endSession();
      console.log('📊 Analytics collected:', analytics);
    }
    
    // Generate final summary
    await generateFinalSummary();
    
    // Save final meeting data
    await storageManager.updateMeeting(currentMeeting.id, {
      endTime: currentMeeting.endTime,
      status: 'completed',
      transcript: transcriptBuffer,
      analytics: analytics // Save analytics with meeting
    });
    
    // Reset speaker detector for next meeting
    if (speakerDetector) {
      speakerDetector.reset();
      console.log('🎭 Speaker detection reset');
    }
    
    // Clear periodic summary
    if (summaryInterval) {
      clearInterval(summaryInterval);
      summaryInterval = null;
    }
    
    // Clear Meeting IQ updates
    if (meetingIQInterval) {
      clearInterval(meetingIQInterval);
      meetingIQInterval = null;
    }
    
    // Generate final Meeting IQ report
    if (meetingIQEngine) {
      const finalReport = meetingIQEngine.generateReport();
      
      // Save report to storage
      if (storageManager && currentMeeting) {
        await storageManager.saveMeetingIQReport(currentMeeting.id, finalReport);
      }
      
      // Send final report to side panel
      broadcastToSidePanel({
        type: 'MEETING_IQ_FINAL_REPORT',
        data: finalReport
      });
      
      console.log(`🎓 Final Meeting IQ: ${finalReport.finalScore}/100 (${finalReport.rating})`);
    }
    
    broadcastToSidePanel({
      type: 'RECORDING_STOPPED',
      meeting: currentMeeting
    });
    
    sendResponse({ success: true });
    
    // Clear keep alive
    stopKeepAlive();
    
  } catch (error) {
    console.error('❌ Error stopping recording:', error);
    sendResponse({ error: error.message });
  }
}

// Pause recording
function pauseRecording(sendResponse) {
  isRecording = false;
  broadcastToSidePanel({ type: 'RECORDING_PAUSED' });
  sendResponse({ success: true });
}

// Resume recording
function resumeRecording(sendResponse) {
  isRecording = true;
  broadcastToSidePanel({ type: 'RECORDING_RESUMED' });
  sendResponse({ success: true });
}

// Process audio chunk
async function processAudioChunk(data, sendResponse) {
  try {
    if (!isRecording) {
      sendResponse({ error: 'Not recording' });
      return;
    }
    
    console.log('🎵 Processing transcript from Web Speech API...');
    
    // If data already contains text (from Web Speech API), use it directly
    if (data.text) {
      const timestamp = new Date();
      
      // Detect speaker based on timing and text content
      let speaker = { id: 'speaker_1', name: 'Speaker 1' };
      if (speakerDetector) {
        speaker = speakerDetector.getCurrentSpeaker(timestamp.getTime(), data.text);
      }
      
      const transcriptEntry = {
        timestamp: data.timestamp || timestamp.toISOString(),
        text: data.text,
        confidence: data.confidence || 0.9,
        speaker: speaker.name,
        speakerId: speaker.id
      };
      
      // Add to buffer with memory management
      transcriptBuffer.push(transcriptEntry);
      transcriptCount++; // Increment counter
      
      // Track in analytics
      if (analyticsManager) {
        analyticsManager.processTranscript(transcriptEntry);
      }
      
      // Update Meeting IQ Engine with new transcript
      if (meetingIQEngine) {
        meetingIQEngine.addTranscript(
          speaker.name,
          data.text,
          Date.now()
        );
      }
      
      // Auto-extract action items every N transcripts
      if (transcriptCount % ACTION_ITEM_TRIGGER_COUNT === 0 && aiManager) {
        console.log('🔍 Auto-extracting action items (transcript count:', transcriptCount, ')');
        extractActionItems(() => {}).catch(err => 
          console.warn('Could not auto-extract action items:', err)
        );
      }
      
      // Keep only last MAX_BUFFER_SIZE entries
      if (transcriptBuffer.length > MAX_BUFFER_SIZE) {
        transcriptBuffer.shift();
        console.log('📦 Buffer limit reached, removed oldest entry');
      }
      
      // Truncate very long transcripts to prevent memory issues
      if (transcriptEntry.text.length > MAX_TRANSCRIPT_LENGTH) {
        transcriptEntry.text = transcriptEntry.text.substring(0, MAX_TRANSCRIPT_LENGTH) + '... (truncated)';
        console.warn('⚠️ Transcript truncated due to length');
      }
      
      // Save to database
      if (storageManager && currentMeeting) {
        await storageManager.saveTranscript(currentMeeting.id, transcriptEntry);
      }
      
      // Broadcast to side panel
      broadcastToSidePanel({
        type: 'NEW_TRANSCRIPT',
        data: transcriptEntry
      });
      
      sendResponse({ success: true, transcript: transcriptEntry });
    } else if (data.audioBlob) {
      // Audio transcription moved to sidepanel.js (AI APIs need window object)
      console.log('⚠️ Audio blob received but AI transcription not available in service worker');
      // Forward to sidepanel for processing if needed
      try {
        await chrome.runtime.sendMessage({
          type: 'PROCESS_AUDIO_BLOB',
          audioBlob: data.audioBlob
        });
        sendResponse({ success: true, message: 'Audio forwarded to sidepanel for processing' });
      } catch (error) {
        console.warn('Could not forward audio to sidepanel:', error);
        sendResponse({ success: false, message: 'Audio transcription unavailable' });
      }
    } else {
      sendResponse({ success: false, message: 'No text or audio data provided' });
    }
    
  } catch (error) {
    console.error('❌ Error processing audio chunk:', error);
    sendResponse({ error: error.message });
  }
}

// Generate summary
async function generateSummary(sendResponse) {
  try {
    // AI summaries are now generated in sidepanel.js (has access to window.ai)
    // Background worker just stores and retrieves data
    if (transcriptBuffer.length === 0) {
      sendResponse({ error: 'No data to summarize' });
      return;
    }
    
    console.log('📝 Preparing transcript for summary generation...');
    
    // Combine recent transcripts and send to sidepanel for AI processing
    const recentText = transcriptBuffer.map(t => t.text).join(' ');
    
    // Return the text to be summarized - sidepanel will handle AI processing
    sendResponse({ 
      success: true, 
      text: recentText,
      message: 'Text ready for AI summarization in sidepanel'
    });
    
    if (summary) {
      // Save summary
      await storageManager.saveSummary(currentMeeting.id, {
        timestamp: new Date().toISOString(),
        summary: summary.text,
        keyMoments: summary.keyMoments || []
      });
      
      // Broadcast to side panel
      broadcastToSidePanel({
        type: 'NEW_SUMMARY',
        data: summary
      });
      
      sendResponse({ success: true, summary });
    } else {
      sendResponse({ error: 'Failed to generate summary' });
    }
    
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    sendResponse({ error: error.message });
  }
}

// Extract action items
async function extractActionItems(sendResponse) {
  try {
    // AI extraction moved to sidepanel.js (needs window.ai APIs)
    if (transcriptBuffer.length === 0) {
      sendResponse({ error: 'No data to analyze' });
      return;
    }
    
    console.log('✅ Preparing transcript for action item extraction...');
    
    const recentText = transcriptBuffer.map(t => t.text).join(' ');
    
    // Return text to sidepanel for AI processing
    sendResponse({ 
      success: true, 
      text: recentText,
      message: 'Text ready for AI action item extraction in sidepanel'
    });
    
  } catch (error) {
    console.error('❌ Error extracting action items:', error);
    sendResponse({ error: error.message });
  }
}

// Generate email
async function generateEmail(sendResponse) {
  try {
    // Email generation moved to sidepanel.js (needs window.ai)
    if (!currentMeeting) {
      sendResponse({ error: 'No meeting data available' });
      return;
    }
    
    console.log('📧 Preparing data for email generation...');
    
    // Get meeting data and send to sidepanel for AI processing
    const transcript = transcriptBuffer.map(t => t.text).join(' ');
    const summaries = await storageManager.getSummaries(currentMeeting.id);
    const actionItems = await storageManager.getActionItems(currentMeeting.id);
    
    sendResponse({ 
      success: true, 
      data: {
        meetingTitle: currentMeeting.title,
        date: new Date(currentMeeting.startTime).toLocaleDateString(),
        transcript,
        summaries,
        actionItems
      },
      message: 'Data ready for email generation in sidepanel'
    });
    
  } catch (error) {
    console.error('❌ Error preparing email data:', error);
    sendResponse({ error: error.message });
  }
}

// Generate final summary when meeting ends
async function generateFinalSummary() {
  try {
    if (transcriptBuffer.length > 0) {
      await generateSummary(() => {});
      await extractActionItems(() => {});
    }
  } catch (error) {
    console.error('❌ Error generating final summary:', error);
  }
}

// Set up periodic summary generation
function setupPeriodicSummary() {
  const settings = chrome.storage.local.get(['settings'], (result) => {
    const interval = (result.settings?.summaryInterval || 5) * 60 * 1000; // Convert to ms
    
    summaryInterval = setInterval(async () => {
      if (isRecording && transcriptBuffer.length > 0) {
        console.log('🔄 Periodic summary and action item extraction...');
        
        // Generate summary
        await generateSummary(() => {});
        
        // Extract action items
        await extractActionItems(() => {});
      }
    }, interval);
  });
}

/**
 * Set up Meeting IQ score updates
 */
function setupMeetingIQUpdates() {
  if (meetingIQInterval) {
    clearInterval(meetingIQInterval);
  }
  
  // Reset detection flag for new meeting
  typeDetectionPerformed = false;
  
  // Initialize meeting type detector
  if (!meetingTypeDetector) {
    meetingTypeDetector = new MeetingTypeDetector();
  }
  
  meetingIQInterval = setInterval(async () => {
    if (isRecording && meetingIQEngine) {
      try {
        console.log('🧠 Calculating Meeting IQ score...');
        const iqData = await meetingIQEngine.calculateScore();
        
        if (iqData.isReady) {
          // Broadcast to side panel
          broadcastToSidePanel({
            type: 'MEETING_IQ_UPDATE',
            data: iqData
          });
          
          console.log(`📊 Meeting IQ: ${iqData.overallScore}/100 (${iqData.trend >= 0 ? '+' : ''}${iqData.trend})`);
          
          // After 3 minutes, suggest meeting type if confidence is high
          const meetingDuration = Date.now() - (currentMeeting?.startTime ? new Date(currentMeeting.startTime).getTime() : Date.now());
          if (!typeDetectionPerformed && meetingDuration >= 180000 && transcriptBuffer.length >= 10) {
            await performMeetingTypeDetection();
          }
        }
      } catch (error) {
        console.error('❌ Error calculating Meeting IQ:', error);
      }
    }
  }, MEETING_IQ_UPDATE_INTERVAL);
  
  console.log('⏱️ Meeting IQ updates scheduled every 60 seconds');
}

/**
 * Perform AI meeting type detection and suggest if confidence is high
 */
async function performMeetingTypeDetection() {
  try {
    typeDetectionPerformed = true; // Only do this once per meeting
    
    console.log('🔍 Performing AI meeting type detection...');
    
    const context = {
      title: currentMeeting?.title || '',
      duration: Date.now() - (currentMeeting?.startTime ? new Date(currentMeeting.startTime).getTime() : Date.now()),
      transcripts: transcriptBuffer,
      speakerCount: speakerDetector ? speakerDetector.getAllSpeakers().length : 0,
      currentType: currentMeeting?.meetingType || 'GENERAL'
    };
    
    const detection = await meetingTypeDetector.detectMeetingType(context);
    
    // Only suggest if:
    // 1. Confidence is high (>70%)
    // 2. Detected type is different from current type
    // 3. Current type is GENERAL (user didn't manually select)
    if (detection.confidence >= 70 && 
        detection.type !== context.currentType &&
        context.currentType === 'GENERAL') {
      
      console.log(`✨ High-confidence detection: ${detection.type} (${detection.confidence}%)`);
      
      // Send suggestion to side panel
      broadcastToSidePanel({
        type: 'MEETING_TYPE_SUGGESTION',
        data: {
          suggestedType: detection.type,
          confidence: detection.confidence,
          reasoning: detection.reasoning,
          currentType: context.currentType
        }
      });
    } else {
      console.log(`ℹ️ Detection complete: ${detection.type} (${detection.confidence}%) - not suggesting change`);
    }
  } catch (error) {
    console.error('❌ Error detecting meeting type:', error);
  }
}

// Check AI availability
async function checkAIAvailability(sendResponse) {
  try {
    // AI availability checking moved to sidepanel.js (needs window.ai)
    // Service workers don't have access to window object
    sendResponse({ 
      availability: {
        promptAPI: false,
        summarizerAPI: false,
        writerAPI: false,
        message: 'AI availability checked in sidepanel context, not service worker'
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking AI availability:', error);
    sendResponse({ 
      availability: {
        promptAPI: false,
        summarizerAPI: false,
        writerAPI: false,
        error: error.message
      }
    });
  }
}

// Broadcast message to side panel
function broadcastToSidePanel(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel might not be open, ignore error
  });
}

// ============================================================================
// PRE-MEETING BRIEF SYSTEM
// ============================================================================

/**
 * Initialize the Pre-Meeting Brief system
 */
async function initializeBriefSystem() {
  try {
    if (!storageManager) {
      console.warn('⚠️ Storage manager not initialized, waiting...');
      storageManager = new StorageManager();
      await storageManager.initialize();
    }
    
    // Initialize series detector
    seriesDetector = new MeetingSeriesDetector(storageManager);
    console.log('✅ Meeting series detector initialized');
    
    // Initialize brief generator
    briefGenerator = new PreMeetingBriefGenerator(storageManager, seriesDetector);
    console.log('✅ Pre-meeting brief generator initialized');
    
    // Set up periodic check for upcoming meetings (every 1 minute)
    chrome.alarms.create('checkUpcomingMeetings', {
      periodInMinutes: 1
    });
    console.log('⏰ Brief check alarm created');
    
  } catch (error) {
    console.error('❌ Error initializing brief system:', error);
  }
}

/**
 * Check for upcoming meetings in the next X minutes
 * @param {number} timeWindow - Minutes to look ahead (default 10)
 * @returns {Promise<Array>} Array of upcoming meetings
 */
async function checkUpcomingMeetings(timeWindow = 10) {
  try {
    if (!storageManager) {
      console.warn('⚠️ Storage manager not initialized');
      return [];
    }
    
    // Get all meetings from storage
    const allMeetings = await storageManager.getAllMeetings();
    if (!allMeetings || allMeetings.length === 0) {
      return [];
    }
    
    const now = new Date();
    const cutoffTime = new Date(now.getTime() + timeWindow * 60000);
    
    // Filter for upcoming meetings
    const upcomingMeetings = allMeetings.filter(meeting => {
      if (!meeting.start_time) return false;
      
      const meetingTime = new Date(meeting.start_time);
      return meetingTime > now && meetingTime <= cutoffTime;
    });
    
    console.log(`📅 Found ${upcomingMeetings.length} upcoming meetings in next ${timeWindow} minutes`);
    
    // Check if we need to generate briefs for any upcoming meetings
    for (const meeting of upcomingMeetings) {
      const minutesUntil = (new Date(meeting.start_time) - now) / 60000;
      
      // Generate brief at T-5 minutes
      if (minutesUntil <= 5 && minutesUntil > 4) {
        console.log(`⏰ Meeting starts in ~5 minutes: ${meeting.title}`);
        
        // Check if brief already exists
        const existingBrief = await storageManager.getPreMeetingBrief(meeting.id);
        if (!existingBrief) {
          console.log('📋 Generating pre-meeting brief...');
          await generatePreMeetingBrief(meeting);
          
          // Notify sidepanel
          broadcastToSidePanel({
            type: 'UPCOMING_MEETING_DETECTED',
            meeting: meeting
          });
        }
      }
    }
    
    return upcomingMeetings;
    
  } catch (error) {
    console.error('❌ Error checking upcoming meetings:', error);
    return [];
  }
}

/**
 * Generate a pre-meeting brief for an upcoming meeting
 * @param {Object} meeting - Meeting data
 * @returns {Promise<Object>} Generated brief
 */
async function generatePreMeetingBrief(meeting) {
  try {
    if (!briefGenerator) {
      console.warn('⚠️ Brief generator not initialized');
      return null;
    }
    
    console.log(`📋 Generating brief for: ${meeting.title}`);
    
    // Generate the brief
    const brief = await briefGenerator.generateBrief(meeting);
    
    // Save to storage
    await storageManager.savePreMeetingBrief(brief);
    console.log(`✅ Brief generated and saved: ${brief.id}`);
    
    // Notify sidepanel that brief is ready
    broadcastToSidePanel({
      type: 'BRIEF_READY',
      brief: brief
    });
    
    return brief;
    
  } catch (error) {
    console.error('❌ Error generating pre-meeting brief:', error);
    throw error;
  }
}

/**
 * Detect platform from meeting URL
 * @param {string} url - Meeting URL
 * @returns {string} Platform name
 */
function detectPlatform(url) {
  if (!url) return 'Unknown';
  
  if (url.includes('meet.google.com')) return 'Google Meet';
  if (url.includes('zoom.us')) return 'Zoom';
  if (url.includes('teams.microsoft.com')) return 'Microsoft Teams';
  
  return 'Unknown';
}

// ============================================================================

// Handle tab capture for audio
chrome.runtime.onConnect.addListener((port) => {
  console.log('🔌 Port connected:', port.name);
  
  if (port.name === 'audio-stream') {
    port.onMessage.addListener(async (message) => {
      if (message.type === 'AUDIO_DATA') {
        await processAudioChunk(message.data, (response) => {
          port.postMessage(response);
        });
      }
    });
  }
});

// ============================================================================
// SMART REMINDERS - Chrome Alarms & Notifications
// ============================================================================

/**
 * Handle alarm triggers (reminders)
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('⏰ Alarm triggered:', alarm.name);
  
  try {
    // Handle Pre-Meeting Brief checks
    if (alarm.name === 'checkUpcomingMeetings') {
      await checkUpcomingMeetings(10); // Check next 10 minutes
      return;
    }
    
    // Handle reminder system alarms
    await triggerReminder(alarm.name);
  } catch (error) {
    console.error('❌ Error handling alarm:', error);
  }
});

/**
 * Handle notification button clicks (Mark Done, Snooze)
 */
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log(`🔘 Notification button clicked: ${notificationId}, button ${buttonIndex}`);
  
  try {
    await handleNotificationButtonClick(notificationId, buttonIndex);
  } catch (error) {
    console.error('❌ Error handling notification button click:', error);
  }
});

/**
 * Handle notification clicks (opens side panel with highlighted item)
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
  console.log('🔔 Notification clicked:', notificationId);
  
  try {
    await handleNotificationClick(notificationId);
  } catch (error) {
    console.error('❌ Error handling notification click:', error);
  }
});

console.log('✅ MeetingMind background service worker loaded!');
