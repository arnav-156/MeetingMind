# 🎯 Meeting IQ - Quick Visual Guide

## 📍 WHERE TO ADD CODE

```
sidepanel.js Structure:

Line 1-50:     Imports & Global Variables
Line 51-100:   Initialization
Line 101-800:  UI Functions (transcripts, summaries, etc.)
Line 801-892:  Analytics Functions
Line 893-930:  ← MESSAGE LISTENER (ADD 2 CASES HERE)
Line 931-1000: Other Functions
Line 1001+:    ← ADD MEETING IQ FUNCTIONS HERE
Line 1020+:    ← ADD EVENT LISTENER HERE
```

---

## 🎨 WHAT THE UI LOOKS LIKE

### Before Recording:
```
┌─────────────────────────────┐
│  Meeting IQ Section         │
│  (hidden - display: none)   │
└─────────────────────────────┘
```

### After 2 Minutes:
```
┌─────────────────────────────────────┐
│  🧠 Meeting IQ Score          📊    │
├─────────────────────────────────────┤
│                                     │
│          ┌───────┐                  │
│          │  52   │  ↑ +7           │
│          └───────┘                  │
│       Needs Work 🟠                 │
│    [████████░░░░░░] 52%            │
│                                     │
│  💡 "Sarah hasn't spoken in 10min  │
│      → Ask for her input"           │
│                                     │
└─────────────────────────────────────┘
```

### Click 📊 to Expand:
```
┌─────────────────────────────────────┐
│  🧠 Meeting IQ Score          📉    │
├─────────────────────────────────────┤
│          52 / 100  ↑ +7            │
│       Needs Work 🟠                 │
├─────────────────────────────────────┤
│  👥 Participation: 45/100           │
│     [████████░░░░░░░░░░] 45%       │
│                                     │
│  🎯 Focus: 72/100                   │
│     [██████████████░░░░] 72%       │
│                                     │
│  ✅ Actions: 30/100                 │
│     [██████░░░░░░░░░░░░] 30%       │
│                                     │
│  ⚡ Decisions: 60/100                │
│     [████████████░░░░░░] 60%       │
│                                     │
│  💬 Engagement: 88/100               │
│     [█████████████████░░] 88%      │
│                                     │
│  ⏱️ Efficiency: 75/100              │
│     [███████████████░░░] 75%       │
│                                     │
├─────────────────────────────────────┤
│  Additional Insights:               │
│                                     │
│  ⚠️ No action items in 15 minutes   │
│     → Define next steps             │
│                                     │
│  ⚠️ Mike hasn't spoken yet          │
│     → Invite his perspective        │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 DATA FLOW

```
┌─────────────────┐
│  background.js  │
│                 │
│  Every 60 sec:  │
│  1. Calculate   │
│  2. Send msg    │
└────────┬────────┘
         │
         │ chrome.runtime.sendMessage({
         │   type: 'MEETING_IQ_UPDATE',
         │   data: {
         │     overallScore: 52,
         │     trend: +7,
         │     insights: [...],
         │     breakdown: {...}
         │   }
         │ })
         │
         ↓
┌────────────────────┐
│  sidepanel.js      │
│                    │
│  Message Listener: │
│  1. Receive msg    │
│  2. Call function  │
└────────┬───────────┘
         │
         │ updateMeetingIQUI(data)
         │
         ↓
┌─────────────────────────┐
│  Update UI Elements:    │
│  • Score: 52            │
│  • Trend: ↑ +7          │
│  • Rating: "Needs Work" │
│  • Progress: 52%        │
│  • Insights: "..."      │
│  • Dimensions: [...]    │
└─────────────────────────┘
         │
         ↓
    User sees
   animated update!
```

---

## 🎬 ANIMATION SEQUENCE

```
Score Changes from 45 → 52:

1. Number animates: 45...46...47...48...49...50...51...52 ✨
2. Progress bar slides: [44%] → [52%] 📊
3. Trend appears: ↑ +7 (green, pops in) 🎉
4. New insight fades in: "Great progress!" 💡
5. Dimensions update smoothly 📈

All in ~1 second with smooth transitions!
```

---

## 🧪 TEST CHECKLIST

```
□ Extension reloaded
□ Meeting started
□ Wait 2 minutes
   □ Meeting IQ section appears
   □ Score shows (probably 40-60 initially)
   
□ Wait 1 more minute (3 min total)
   □ Score updates automatically
   □ Trend indicator shows change
   □ Console shows: "🧠 Updating Meeting IQ UI"
   
□ Say action items
   □ Wait 1 minute
   □ "Actions" dimension improves
   
□ Click 📊 button
   □ Details expand
   □ All 6 dimensions visible
   □ Additional insights show
   
□ Click 📉 button
   □ Details collapse
   
□ Stop recording
   □ Notification: "Meeting IQ Final Score: X/100"
   □ Score saved
```

---

## 💡 PRO TIPS

### **Tip 1: Speed Up Testing**
In `background.js`, temporarily change:
```javascript
const MEETING_IQ_UPDATE_INTERVAL = 60000; // 60 seconds
```
To:
```javascript
const MEETING_IQ_UPDATE_INTERVAL = 10000; // 10 seconds (TESTING ONLY)
```
Don't forget to change it back!

### **Tip 2: Force Update**
In browser console (side panel):
```javascript
chrome.runtime.sendMessage({type: 'GET_MEETING_IQ'}, (response) => {
  console.log('Current IQ:', response);
  updateMeetingIQUI(response.data);
});
```

### **Tip 3: See What Background Sends**
In background service worker console:
```javascript
// Look for these logs:
"🧠 Calculating Meeting IQ score..."
"📊 Meeting IQ: 52/100 (+7)"
```

### **Tip 4: Debug Element IDs**
In browser console:
```javascript
console.log('Score element:', document.getElementById('iq-score'));
console.log('Progress element:', document.getElementById('iq-progress'));
console.log('Section:', document.getElementById('meeting-iq-section'));
```

---

## ⚡ QUICK FIX GUIDE

### Problem: "Cannot read property 'textContent' of null"
**Solution:** Element ID mismatch
```javascript
// Check these match your HTML:
- iq-score
- iq-trend  
- iq-rating
- iq-progress
- iq-insight-text
- iq-participation-score
- iq-focus-score
- iq-actions-score
- iq-decisions-score
- iq-engagement-score
- iq-efficiency-score
```

### Problem: Score stays at "--"
**Solution:** Background not sending data
```javascript
// Check background console for:
✅ "🧠 Meeting IQ tracking started"
✅ "🧠 Calculating Meeting IQ score..."
❌ If missing, check meeting started properly
```

### Problem: Section doesn't appear
**Solution:** Display style issue
```javascript
// In updateMeetingIQUI, add debug:
console.log('Showing IQ section, isReady:', iqData.isReady);
console.log('Section element:', document.getElementById('meeting-iq-section'));
```

### Problem: Dimensions don't update
**Solution:** Check breakdown data
```javascript
// In updateDimensionScores, add:
console.log('Dimensions:', dimensions);
Object.keys(dimensions).forEach(key => {
  console.log(`${key}:`, dimensions[key].score);
});
```

---

## 📦 FILES MODIFIED

```
✅ utils/meeting-iq-engine.js       (NEW - 600 lines)
✅ utils/ai-manager.js              (ENHANCED)
✅ background.js                    (INTEGRATED)
✅ utils/storage.js                 (ENHANCED)
✅ sidepanel/sidepanel.html         (UI ADDED)
⚠️ sidepanel/sidepanel.js           (NEEDS 3 ADDITIONS)
```

---

## 🎯 FINAL CHECK

Before saying "done", verify:

```
✅ Message listener has MEETING_IQ_UPDATE case
✅ updateMeetingIQUI() function exists
✅ getScoreRating() function exists
✅ updateDimensionScores() function exists
✅ updateAdditionalInsights() function exists
✅ showFinalIQReport() function exists
✅ toggleMeetingIQDetails() function exists
✅ Toggle button has event listener
✅ No syntax errors (red squiggly lines)
✅ Extension reloads without errors
```

---

## 🚀 YOU'RE READY!

After adding these ~200 lines of JavaScript:

**YOU WILL HAVE:**
- World's first real-time meeting quality scorer
- AI-powered behavioral insights
- Gamification that drives better meetings
- Demo-ready hackathon project
- $37B market opportunity

**TIME TO SHIP:** 20 minutes! ⏱️

Go build the future of meeting productivity! 🎉
