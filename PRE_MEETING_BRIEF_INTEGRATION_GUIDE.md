# 🔌 Pre-Meeting Brief System - Integration Guide

**How to connect the Pre-Meeting Brief system to your existing codebase**

---

## 📋 Overview

This guide shows exactly how to integrate the Pre-Meeting Brief system into:
1. `background.js` - Meeting detection and brief generation
2. `sidepanel/sidepanel.js` - UI display and user interactions
3. `manifest.json` - Permissions

---

## 1️⃣ Background.js Integration

### Step 1: Import Dependencies

Add at the top of `background.js`:

```javascript
// Import Pre-Meeting Brief components
import { MeetingSeriesDetector } from './utils/meeting-series-detector.js';
import { PreMeetingBriefGenerator } from './utils/pre-meeting-brief.js';
import { storageDB } from './utils/storage.js';
```

### Step 2: Initialize Brief System

Add to initialization section:

```javascript
// Initialize brief system
let seriesDetector = null;
let briefGenerator = null;

async function initializeBriefSystem() {
  try {
    seriesDetector = new MeetingSeriesDetector(storageDB);
    briefGenerator = new PreMeetingBriefGenerator(storageDB, seriesDetector);
    
    console.log('✅ Pre-Meeting Brief system initialized');
    
    // Start periodic check for upcoming meetings
    chrome.alarms.create('checkUpcomingMeetings', { periodInMinutes: 1 });
  } catch (error) {
    console.error('❌ Error initializing brief system:', error);
  }
}

// Call during startup
initializeBriefSystem();
```

### Step 3: Add Message Handlers

Add to existing `chrome.runtime.onMessage` listener:

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  // Existing handlers...
  
  // === PRE-MEETING BRIEF HANDLERS ===
  
  if (message.type === 'CHECK_UPCOMING_MEETINGS') {
    // Check calendar for meetings in specified time window
    checkUpcomingMeetings(message.timeWindow)
      .then(meetings => sendResponse({ meetings }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open
  }
  
  if (message.type === 'GENERATE_PRE_MEETING_BRIEF') {
    // Generate brief for upcoming meeting
    generatePreMeetingBrief(message.meeting)
      .then(brief => sendResponse({ brief }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (message.type === 'UPDATE_BRIEF_STATUS') {
    // Update brief status (dismissed, used, saved)
    storageDB.updateBriefStatus(message.briefId, message.status)
      .then(updated => sendResponse({ success: true, brief: updated }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  // Continue with other handlers...
});
```

### Step 4: Implement Helper Functions

Add these functions to `background.js`:

```javascript
/**
 * Check for upcoming meetings in calendar
 * @param {number} timeWindow - Minutes to look ahead (default: 5)
 * @returns {Promise<Array>} - Upcoming meetings
 */
async function checkUpcomingMeetings(timeWindow = 5) {
  try {
    const now = Date.now();
    const future = now + (timeWindow * 60 * 1000);
    
    // Option 1: Use calendar integration
    if (calendarIntegration && calendarIntegration.isEnabled()) {
      const events = await calendarIntegration.getUpcomingEvents(timeWindow);
      return events.map(event => ({
        id: event.id,
        title: event.summary,
        startTime: event.start.dateTime || event.start.date,
        participants: event.attendees?.map(a => a.email) || []
      }));
    }
    
    // Option 2: Check active tab for meeting URL
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      const url = tabs[0].url;
      const title = tabs[0].title;
      
      // Detect meeting platforms
      if (url.includes('meet.google.com') || 
          url.includes('zoom.us') || 
          url.includes('teams.microsoft.com')) {
        return [{
          id: `meeting-${Date.now()}`,
          title: title,
          startTime: new Date(now).toISOString(),
          participants: [],
          platform: detectPlatform(url)
        }];
      }
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Error checking upcoming meetings:', error);
    return [];
  }
}

/**
 * Generate pre-meeting brief
 * @param {Object} meeting - Meeting details
 * @returns {Promise<Object>} - Generated brief
 */
async function generatePreMeetingBrief(meeting) {
  try {
    console.log('🔍 Generating brief for:', meeting.title);
    
    // Check if meeting is part of a series
    const seriesInfo = await seriesDetector.getSeriesInfo(meeting);
    
    // If first meeting, no brief needed
    if (seriesInfo.isFirstMeeting) {
      console.log('ℹ️ First meeting in series, no brief generated');
      return null;
    }
    
    // Generate brief
    const brief = await briefGenerator.generateBriefForUpcoming(meeting);
    
    if (brief) {
      // Save to storage
      await storageDB.savePreMeetingBrief(brief);
      
      // Send notification to sidepanel
      chrome.runtime.sendMessage({
        type: 'BRIEF_READY',
        brief: brief
      });
      
      console.log('✅ Brief generated and saved:', brief.id);
    }
    
    return brief;
    
  } catch (error) {
    console.error('❌ Error generating brief:', error);
    throw error;
  }
}

/**
 * Detect meeting platform from URL
 */
function detectPlatform(url) {
  if (url.includes('meet.google.com')) return 'google-meet';
  if (url.includes('zoom.us')) return 'zoom';
  if (url.includes('teams.microsoft.com')) return 'teams';
  return 'unknown';
}
```

### Step 5: Add Alarm Handler

Add alarm listener for periodic checks:

```javascript
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkUpcomingMeetings') {
    try {
      // Check for meetings in next 5 minutes
      const meetings = await checkUpcomingMeetings(5);
      
      if (meetings.length > 0) {
        const nextMeeting = meetings[0];
        
        // Check if we should show brief
        const startTime = new Date(nextMeeting.startTime).getTime();
        const now = Date.now();
        const minutesUntil = Math.floor((startTime - now) / (60 * 1000));
        
        // Show brief if meeting is 5 minutes away
        if (minutesUntil === 5 || minutesUntil === 4) {
          // Generate brief
          await generatePreMeetingBrief(nextMeeting);
          
          // Notify sidepanel
          chrome.runtime.sendMessage({
            type: 'UPCOMING_MEETING_DETECTED',
            meeting: nextMeeting
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in alarm handler:', error);
    }
  }
});
```

---

## 2️⃣ Sidepanel.js Integration

### Step 1: Import Brief Manager

Add to top of `sidepanel/sidepanel.js`:

```javascript
// Import Pre-Meeting Brief Manager
import PreMeetingBriefManager from '../utils/pre-meeting-brief-manager.js';
```

### Step 2: Initialize Manager

Add to initialization section:

```javascript
// Initialize Pre-Meeting Brief Manager
let briefManager = null;

async function initializeBriefManager() {
  try {
    briefManager = new PreMeetingBriefManager();
    await briefManager.initialize();
    
    console.log('✅ Pre-Meeting Brief Manager initialized');
  } catch (error) {
    console.error('❌ Error initializing brief manager:', error);
  }
}

// Call during DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  // Existing initialization...
  
  // Initialize brief manager
  await initializeBriefManager();
});
```

### Step 3: Handle Cleanup

Add to cleanup section:

```javascript
// Cleanup when sidepanel closes
window.addEventListener('beforeunload', () => {
  // Existing cleanup...
  
  // Cleanup brief manager
  if (briefManager) {
    briefManager.cleanup();
  }
});
```

### That's it! 🎉

The `PreMeetingBriefManager` handles all UI interactions automatically:
- Displays brief card when meeting detected
- Manages countdown timer
- Handles button clicks (start/dismiss/later)
- Loads context into sidepanel
- Updates brief status in storage

No additional code needed in `sidepanel.js`!

---

## 3️⃣ Manifest.json Integration

### Add Permissions

Update `manifest.json` permissions:

```json
{
  "manifest_version": 3,
  "name": "MeetingMind",
  "version": "1.0.0",
  
  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "notifications",
    "alarms"  // ← ADD THIS for periodic checks
  ],
  
  "host_permissions": [
    "https://meet.google.com/*",
    "https://zoom.us/*",
    "https://teams.microsoft.com/*",
    "https://calendar.google.com/*"  // ← ADD THIS if using Calendar API
  ],
  
  // Rest of manifest...
}
```

---

## 4️⃣ Verification Checklist

### After Integration

Run these checks:

#### Console Logs
```javascript
// Should see during initialization:
✅ Pre-Meeting Brief system initialized
✅ Pre-Meeting Brief Manager initialized
✅ Database schema created (v4)

// When meeting detected:
🔍 Generating brief for: [Meeting Title]
📋 Found [N] meetings in series
✅ Brief generated and saved: [Brief ID]
```

#### IndexedDB
```javascript
// Open DevTools → Application → IndexedDB → MeetingMindDB
// Should see:
✅ preMeetingBriefs (object store)
✅ meetingSeries (object store)
```

#### UI Elements
```javascript
// Check sidepanel HTML:
✅ #pre-meeting-brief-card exists
✅ #brief-start-with-context button exists
✅ #brief-dismiss button exists
```

#### Message Passing
```javascript
// Test in console:
chrome.runtime.sendMessage({
  type: 'CHECK_UPCOMING_MEETINGS',
  timeWindow: 5
}, response => console.log(response));

// Should return: { meetings: [...] }
```

---

## 5️⃣ Optional Enhancements

### Add Calendar Integration

If you want deeper calendar integration:

```javascript
// In background.js

async function syncWithCalendar() {
  try {
    // Fetch events from Google Calendar API
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
      'timeMin=' + new Date().toISOString() +
      '&timeMax=' + new Date(Date.now() + 24*60*60*1000).toISOString() +
      '&singleEvents=true',
      {
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      }
    );
    
    const data = await response.json();
    return data.items;
    
  } catch (error) {
    console.error('❌ Calendar sync error:', error);
    return [];
  }
}

// Use in checkUpcomingMeetings()
async function checkUpcomingMeetings(timeWindow = 5) {
  const calendarEvents = await syncWithCalendar();
  
  const upcomingMeetings = calendarEvents.filter(event => {
    const startTime = new Date(event.start.dateTime || event.start.date).getTime();
    const now = Date.now();
    const minutesUntil = (startTime - now) / (60 * 1000);
    return minutesUntil > 0 && minutesUntil <= timeWindow;
  });
  
  return upcomingMeetings.map(event => ({
    id: event.id,
    title: event.summary,
    startTime: event.start.dateTime || event.start.date,
    participants: event.attendees?.map(a => a.email) || [],
    location: event.location || event.hangoutLink
  }));
}
```

### Add Notification

Show browser notification when brief is ready:

```javascript
// In background.js

async function notifyBriefReady(meeting, brief) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon128.png',
    title: 'Pre-Meeting Brief Ready',
    message: `Your ${meeting.title} starts in 5 minutes. Brief available in sidepanel.`,
    buttons: [
      { title: 'View Brief' },
      { title: 'Dismiss' }
    ],
    requireInteraction: true
  });
}

// Call after brief generation
const brief = await generatePreMeetingBrief(meeting);
if (brief) {
  await notifyBriefReady(meeting, brief);
}
```

### Add Settings

Let users customize brief behavior:

```javascript
// In sidepanel settings section

<div class="setting-item">
  <label>
    <input type="checkbox" id="enable-pre-meeting-briefs" checked>
    Show pre-meeting briefs
  </label>
</div>

<div class="setting-item">
  <label>
    Brief timing:
    <select id="brief-timing">
      <option value="3">3 minutes before</option>
      <option value="5" selected>5 minutes before</option>
      <option value="10">10 minutes before</option>
    </select>
  </label>
</div>

<div class="setting-item">
  <label>
    <input type="checkbox" id="brief-notifications" checked>
    Show notification when brief is ready
  </label>
</div>
```

```javascript
// In sidepanel.js

// Save settings
document.getElementById('enable-pre-meeting-briefs').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ 
    briefsEnabled: e.target.checked 
  });
});

// Load settings
const settings = await chrome.storage.local.get({
  briefsEnabled: true,
  briefTiming: 5,
  briefNotifications: true
});

// Apply settings
if (!settings.briefsEnabled && briefManager) {
  briefManager.cleanup();
}
```

---

## 6️⃣ Testing Flow

### Manual Test

1. **Record Test Meetings**
   ```javascript
   // Record meeting 1
   Title: "Test Weekly Sync"
   Duration: 18 minutes
   Add 2 action items
   
   // Record meeting 2
   Title: "Test Weekly Sync"  // Same title
   Duration: 22 minutes
   Add 3 action items
   ```

2. **Create Upcoming Meeting**
   - Open Google Calendar
   - Create event: "Test Weekly Sync"
   - Set time: Current time + 4 minutes
   - Save

3. **Watch Console**
   ```
   🔍 Generating brief for: Test Weekly Sync
   📋 Found 2 meetings in series for: test weekly sync
   ✅ Brief generated and saved: brief-1730...
   ```

4. **Check Sidepanel**
   - Brief card should appear
   - Countdown shows "4 minutes"
   - Metrics show last IQ, duration, open items
   - AI summary (if Prompt API enabled)

5. **Test Interactions**
   - Click "Start with this Context" → Context card appears in transcript
   - Click "View Later" → Brief saved, card dismisses
   - Click × → Brief dismissed

### Automated Test

```javascript
// Run in console

async function testBriefSystem() {
  console.log('🧪 Testing Pre-Meeting Brief System...\n');
  
  // Test 1: Series Detection
  console.log('Test 1: Series Detection');
  const detector = new MeetingSeriesDetector(storageDB);
  const meetings = await storageDB.getAllMeetings();
  console.log(`Found ${meetings.length} total meetings`);
  
  if (meetings.length > 0) {
    const series = await detector.findSeriesMeetings(meetings[0].id);
    console.log(`✅ Series has ${series.length} meetings\n`);
  }
  
  // Test 2: Brief Generation
  console.log('Test 2: Brief Generation');
  const upcomingMeeting = {
    title: 'Test Weekly Sync',
    startTime: new Date(Date.now() + 5*60*1000).toISOString()
  };
  
  const response = await chrome.runtime.sendMessage({
    type: 'GENERATE_PRE_MEETING_BRIEF',
    meeting: upcomingMeeting
  });
  
  if (response.brief) {
    console.log(`✅ Brief generated: ${response.brief.id}`);
    console.log(`   - Open items: ${response.brief.open_items?.length || 0}`);
    console.log(`   - Predicted duration: ${response.brief.patterns?.typical_duration || 'N/A'} min\n`);
  } else {
    console.log('❌ No brief generated (might be first meeting)\n');
  }
  
  // Test 3: Storage
  console.log('Test 3: Storage');
  const allBriefs = await storageDB.getPendingBriefs();
  console.log(`✅ Found ${allBriefs.length} pending briefs\n`);
  
  // Test 4: UI
  console.log('Test 4: UI');
  const briefCard = document.getElementById('pre-meeting-brief-card');
  if (briefCard) {
    console.log('✅ Brief card element exists');
    console.log(`   Display: ${briefCard.style.display || 'default'}\n`);
  } else {
    console.log('❌ Brief card element not found\n');
  }
  
  console.log('🎉 Testing complete!');
}

testBriefSystem();
```

---

## 7️⃣ Troubleshooting

### Issue: Brief not generating

**Check:**
```javascript
// 1. Is series detector initialized?
console.log('Detector:', seriesDetector);

// 2. Are there past meetings?
const meetings = await storageDB.getAllMeetings();
console.log('Meetings:', meetings.length);

// 3. Can series be detected?
const detector = new MeetingSeriesDetector(storageDB);
const series = await detector.findSeriesMeetings(meetings[0].id);
console.log('Series:', series.length);
```

**Fix:**
- Ensure 2+ meetings recorded
- Check titles are similar
- Verify storage initialized

### Issue: Brief card not showing

**Check:**
```javascript
// 1. Is manager initialized?
console.log('Brief Manager:', briefManager);

// 2. Is card element present?
console.log('Card:', document.getElementById('pre-meeting-brief-card'));

// 3. Check display style
const card = document.getElementById('pre-meeting-brief-card');
console.log('Display:', card?.style.display);
```

**Fix:**
- Ensure manager initialized in sidepanel.js
- Verify HTML includes brief card
- Check CSS loaded correctly

### Issue: AI not working

**Check:**
```javascript
// In sidepanel console
const generator = new PreMeetingBriefGenerator(storageDB, seriesDetector);
const aiReady = await generator.initializeAI();
console.log('AI Ready:', aiReady);
```

**Fix:**
- Enable Prompt API flag
- Download model
- Use fallback (last summary) without AI

---

## 🎉 Integration Complete!

Your Pre-Meeting Brief system is now fully integrated and ready to use!

**Next steps:**
1. Test with real meetings
2. Monitor console for errors
3. Gather user feedback
4. Iterate and improve

**Resources:**
- Full docs: `PRE_MEETING_BRIEF_SYSTEM.md`
- Quick start: `PRE_MEETING_BRIEF_QUICK_START.md`
- Implementation: `PRE_MEETING_BRIEF_IMPLEMENTATION_SUMMARY.md`

---

*Happy coding! 🚀*
