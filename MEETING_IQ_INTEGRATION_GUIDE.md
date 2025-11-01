# 🧠 Meeting IQ Integration Guide - Final 3%

## 📍 What's Missing

You need to add **3 things** to `sidepanel/sidepanel.js`:

1. **Message listener** for Meeting IQ updates
2. **UI update function** to display the scores
3. **Toggle button** event listener

Total time: **~20 minutes** ⏱️

---

## 📝 Step-by-Step Instructions

### **STEP 1: Add Message Handlers**

**Location:** Inside the `chrome.runtime.onMessage.addListener` switch statement

**Find this code** (around line 893-926):
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Side panel received message:', message.type);
  
  switch (message.type) {
    case 'NEW_TRANSCRIPT':
      addTranscript(message.data);
      if (isRecording) {
        updateAnalytics();
      }
      break;
      
    case 'NEW_SUMMARY':
      addSummary(message.data);
      break;
      
    case 'NEW_ACTION_ITEMS':
      addActionItems(message.data);
      break;
      
    case 'RECORDING_STARTED':
      updateUIForRecording(message.meeting);
      break;
      
    case 'RECORDING_STOPPED':
      updateUIForStopped();
      break;
  }
  
  return true;
});
```

**ADD THESE TWO CASES** (before the closing `}`):
```javascript
    case 'MEETING_IQ_UPDATE':
      updateMeetingIQUI(message.data);
      break;
      
    case 'MEETING_IQ_FINAL_REPORT':
      showFinalIQReport(message.data);
      break;
```

**After adding, it should look like:**
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Side panel received message:', message.type);
  
  switch (message.type) {
    case 'NEW_TRANSCRIPT':
      addTranscript(message.data);
      if (isRecording) {
        updateAnalytics();
      }
      break;
      
    case 'NEW_SUMMARY':
      addSummary(message.data);
      break;
      
    case 'NEW_ACTION_ITEMS':
      addActionItems(message.data);
      break;
      
    case 'RECORDING_STARTED':
      updateUIForRecording(message.meeting);
      break;
      
    case 'RECORDING_STOPPED':
      updateUIForStopped();
      break;
      
    case 'MEETING_IQ_UPDATE':        // ← NEW
      updateMeetingIQUI(message.data);  // ← NEW
      break;                            // ← NEW
      
    case 'MEETING_IQ_FINAL_REPORT':   // ← NEW
      showFinalIQReport(message.data);  // ← NEW
      break;                            // ← NEW
  }
  
  return true;
});
```

---

### **STEP 2: Add Meeting IQ Functions**

**Location:** At the end of the file, before the final closing or after the analytics functions

**Find a good spot** (around line 1000+, after all other functions)

**ADD THIS ENTIRE SECTION:**

```javascript
// ============================================
// Meeting IQ Functions
// ============================================

/**
 * Update Meeting IQ UI with new score data
 */
function updateMeetingIQUI(iqData) {
  if (!iqData || !iqData.isReady) {
    return; // Don't show UI until score is ready
  }

  console.log('🧠 Updating Meeting IQ UI:', iqData.overallScore);

  // Show Meeting IQ section
  const iqSection = document.getElementById('meeting-iq-section');
  if (iqSection) {
    iqSection.style.display = 'block';
  }

  // Update main score
  const scoreEl = document.getElementById('iq-score');
  if (scoreEl) {
    scoreEl.textContent = iqData.overallScore;
    
    // Remove all existing classes
    scoreEl.className = 'iq-score';
    
    // Add color class based on score
    if (iqData.overallScore >= 81) {
      scoreEl.classList.add('excellent');
    } else if (iqData.overallScore >= 61) {
      scoreEl.classList.add('good');
    } else if (iqData.overallScore >= 41) {
      scoreEl.classList.add('needs-work');
    } else {
      scoreEl.classList.add('poor');
    }
  }

  // Update trend indicator
  const trendEl = document.getElementById('iq-trend');
  if (trendEl && iqData.trend !== undefined) {
    if (iqData.trend > 0) {
      trendEl.textContent = `↑ +${iqData.trend}`;
      trendEl.className = 'iq-trend positive';
    } else if (iqData.trend < 0) {
      trendEl.textContent = `↓ ${iqData.trend}`;
      trendEl.className = 'iq-trend negative';
    } else {
      trendEl.textContent = '→ 0';
      trendEl.className = 'iq-trend neutral';
    }
  }

  // Update rating text
  const ratingEl = document.getElementById('iq-rating');
  if (ratingEl) {
    const rating = getScoreRating(iqData.overallScore);
    ratingEl.textContent = rating;
  }

  // Update progress bar
  const progressEl = document.getElementById('iq-progress');
  if (progressEl) {
    progressEl.style.width = `${iqData.overallScore}%`;
    
    // Remove all existing classes
    progressEl.className = 'iq-progress-fill';
    
    // Add color class
    if (iqData.overallScore >= 81) {
      progressEl.classList.add('excellent');
    } else if (iqData.overallScore >= 61) {
      progressEl.classList.add('good');
    } else if (iqData.overallScore >= 41) {
      progressEl.classList.add('needs-work');
    } else {
      progressEl.classList.add('poor');
    }
  }

  // Update primary insight
  const insightTextEl = document.getElementById('iq-insight-text');
  if (insightTextEl && iqData.insights && iqData.insights.length > 0) {
    const insight = iqData.insights[0];
    insightTextEl.textContent = `${insight.message} → ${insight.action}`;
  }

  // Update dimension scores
  if (iqData.breakdown) {
    updateDimensionScores(iqData.breakdown);
  }

  // Update additional insights
  if (iqData.insights) {
    updateAdditionalInsights(iqData.insights);
  }

  // Update meeting stats
  if (iqData.meetingData) {
    console.log('📊 Meeting stats:', iqData.meetingData);
  }
}

/**
 * Get human-readable score rating
 */
function getScoreRating(score) {
  if (score >= 81) return 'Excellent! 🟢';
  if (score >= 61) return 'Good 🔵';
  if (score >= 41) return 'Needs Work 🟠';
  return 'Poor 🔴';
}

/**
 * Update individual dimension scores and progress bars
 */
function updateDimensionScores(dimensions) {
  const dimensionKeys = {
    participation: 'participation',
    focus: 'focus',
    actions: 'actions',
    decisions: 'decisions',
    engagement: 'engagement',
    efficiency: 'efficiency'
  };

  Object.keys(dimensionKeys).forEach(key => {
    const dim = dimensions[key];
    if (!dim) return;

    // Update score text
    const scoreEl = document.getElementById(`iq-${key}-score`);
    if (scoreEl) {
      scoreEl.textContent = `${Math.round(dim.score)}/100`;
    }

    // Update progress bar
    const barEl = document.getElementById(`iq-${key}-bar`);
    if (barEl) {
      barEl.style.width = `${Math.round(dim.score)}%`;
    }
  });
}

/**
 * Update additional insights list
 */
function updateAdditionalInsights(insights) {
  const container = document.getElementById('iq-additional-insights');
  if (!container) return;

  container.innerHTML = '';

  // Show insights 2-4 (skip first one as it's shown as primary)
  const additionalInsights = insights.slice(1, 4);
  
  if (additionalInsights.length === 0) {
    container.innerHTML = '<p style="font-size: var(--text-xs); color: var(--neutral-400); text-align: center; padding: var(--space-3);">All looking good! Keep it up! 🎉</p>';
    return;
  }

  additionalInsights.forEach(insight => {
    const insightEl = document.createElement('div');
    insightEl.className = `iq-insight-item ${insight.type}`;
    
    // Create content
    const iconMap = {
      success: '✅',
      warning: '⚠️',
      critical: '🚨',
      info: '💡'
    };
    
    const icon = iconMap[insight.type] || '💡';
    insightEl.innerHTML = `<strong>${icon} ${insight.message}</strong><br><span style="font-size: var(--text-xs);">${insight.action}</span>`;
    
    container.appendChild(insightEl);
  });
}

/**
 * Show final Meeting IQ report (when recording stops)
 */
function showFinalIQReport(report) {
  console.log('📊 Final Meeting IQ Report:', report);
  
  // Show a notification with the final score
  showNotification(
    `Meeting IQ Final Score: ${report.finalScore}/100 ${report.emoji}`,
    'success'
  );

  // Update UI one last time
  if (report.overallScore !== undefined) {
    updateMeetingIQUI(report);
  }
}

/**
 * Toggle Meeting IQ details view
 */
function toggleMeetingIQDetails() {
  const details = document.getElementById('meeting-iq-details');
  if (details) {
    details.classList.toggle('hidden');
    
    // Update button icon
    const toggleBtn = document.getElementById('toggle-iq-details');
    if (toggleBtn) {
      const isHidden = details.classList.contains('hidden');
      toggleBtn.innerHTML = isHidden ? '<span>📊</span>' : '<span>📉</span>';
      toggleBtn.title = isHidden ? 'Show details' : 'Hide details';
    }
  }
}
```

---

### **STEP 3: Add Toggle Button Event Listener**

**Location:** At the very end of the file, after all functions, in the initialization section

**Find the section with event listeners** (look for where buttons are initialized)

**ADD THIS:**
```javascript
// Meeting IQ toggle button
const toggleIQBtn = document.getElementById('toggle-iq-details');
if (toggleIQBtn) {
  toggleIQBtn.addEventListener('click', toggleMeetingIQDetails);
  console.log('🧠 Meeting IQ toggle button initialized');
}
```

---

## ✅ **Complete Code Summary**

Here's what you're adding in total:

### **1. In the message listener** (2 new cases):
```javascript
case 'MEETING_IQ_UPDATE':
  updateMeetingIQUI(message.data);
  break;
  
case 'MEETING_IQ_FINAL_REPORT':
  showFinalIQReport(message.data);
  break;
```

### **2. New functions** (5 functions, ~180 lines):
- `updateMeetingIQUI(iqData)` - Main UI update function
- `getScoreRating(score)` - Convert score to text
- `updateDimensionScores(dimensions)` - Update 6 dimension bars
- `updateAdditionalInsights(insights)` - Show insight list
- `showFinalIQReport(report)` - Final report notification
- `toggleMeetingIQDetails()` - Show/hide details

### **3. Event listener** (1 line):
```javascript
toggleIQBtn.addEventListener('click', toggleMeetingIQDetails);
```

---

## 🧪 **How to Test**

### **After adding the code:**

1. **Reload Extension**
   ```
   Go to: chrome://extensions/
   Click: Reload button on MeetingMind
   ```

2. **Start a Meeting**
   ```
   Open: Google Meet
   Click: Extension icon
   Click: "Start Recording"
   ```

3. **Wait 2 Minutes**
   ```
   - Speak and have conversation
   - After 2 minutes, Meeting IQ section appears
   - Score starts at ~40-60 (low initially)
   ```

4. **Watch Score Update**
   ```
   Every 60 seconds:
   - Score recalculates
   - Trend indicator shows change (↑ +5 or ↓ -3)
   - Insights update
   ```

5. **Test Insights**
   ```
   - Say action items → "Actions" score increases
   - Have conversation → "Participation" improves
   - Ask questions → "Engagement" goes up
   ```

6. **Toggle Details**
   ```
   - Click 📊 button in Meeting IQ header
   - See full 6-dimension breakdown
   - Click again to collapse
   ```

7. **Stop Recording**
   ```
   - Click "Stop Recording"
   - See final IQ report notification
   - Score saved to meeting history
   ```

---

## 🎯 **Expected Output in Console**

When working correctly, you should see:
```
🧠 Meeting IQ toggle button initialized
🧠 Meeting IQ tracking started
📨 Side panel received message: MEETING_IQ_UPDATE
🧠 Updating Meeting IQ UI: 45
📊 Meeting stats: {duration: 120000, speakerCount: 2, ...}
🧠 Updating Meeting IQ UI: 52
🧠 Updating Meeting IQ UI: 67
📨 Side panel received message: MEETING_IQ_FINAL_REPORT
📊 Final Meeting IQ Report: {finalScore: 78, ...}
```

---

## 🐛 **Troubleshooting**

### **Issue: Meeting IQ section doesn't appear**
**Solution:** 
- Check console for errors
- Verify `meeting-iq-section` element exists in HTML
- Wait at least 2 minutes into meeting

### **Issue: Score shows "NaN" or "--"**
**Solution:**
- Check that `iqData.overallScore` has a value
- Verify background is sending updates (check service worker console)

### **Issue: Dimensions don't update**
**Solution:**
- Check element IDs match: `iq-participation-score`, `iq-focus-score`, etc.
- Verify `iqData.breakdown` contains dimension data

### **Issue: Toggle button doesn't work**
**Solution:**
- Check that event listener is added
- Verify `toggle-iq-details` button exists in HTML
- Look for JavaScript errors in console

---

## 📊 **What Happens Behind the Scenes**

```
Meeting starts
    ↓
background.js initializes MeetingIQEngine
    ↓
Every transcript → Added to IQ engine
Every action item → Added to IQ engine
    ↓
Every 60 seconds:
    ↓
background.js calculates score
    ↓
Sends MEETING_IQ_UPDATE message
    ↓
sidepanel.js receives message
    ↓
updateMeetingIQUI() updates all UI elements
    ↓
User sees score change with animations!
```

---

## 🎉 **After Adding This Code**

You'll have a **FULLY FUNCTIONAL** Meeting IQ system that:
- ✅ Calculates scores in real-time
- ✅ Shows animated updates every 60 seconds
- ✅ Provides actionable insights
- ✅ Tracks 6 dimensions
- ✅ Generates final reports
- ✅ Saves to meeting history

**Total: 100% Complete!** 🚀

---

## 📝 **Quick Copy-Paste Checklist**

- [ ] Find `chrome.runtime.onMessage.addListener` (~line 893)
- [ ] Add 2 new cases in switch statement
- [ ] Scroll to end of file
- [ ] Paste Meeting IQ functions section
- [ ] Find event listener initialization
- [ ] Add toggle button listener
- [ ] Save file
- [ ] Reload extension
- [ ] Test in Google Meet!

---

**Need help?** Check the console for errors and refer to `MEETING_IQ_MVP.md` for full documentation!

Good luck! You're about to launch the most innovative meeting feature on the market! 🎯🚀
