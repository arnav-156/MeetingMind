# 🚀 Pre-Meeting Brief System - Quick Start Guide

**Get your intelligent pre-meeting context up and running in 5 minutes!**

---

## ✅ Prerequisites

- Chrome 120+ (or Chrome Canary for full AI features)
- MeetingMind extension installed
- At least 2 past meetings recorded in the same series

---

## 📦 Installation

### Step 1: Load New Files

The Pre-Meeting Brief system includes these new files:

```
✅ utils/meeting-series-detector.js
✅ utils/pre-meeting-brief.js
✅ utils/pre-meeting-brief-manager.js
✅ utils/storage.js (updated to v4)
✅ sidepanel/sidepanel.html (updated with brief card UI)
```

All files are already created and ready to use!

### Step 2: Enable AI (Optional but Recommended)

For the best experience with AI-generated insights:

1. **Use Chrome Canary** (for Prompt API support)
2. **Enable the flag**:
   - Navigate to: `chrome://flags/#prompt-api-for-gemini-nano`
   - Set to: **Enabled**
   - Restart browser

3. **Download the model**:
   - Navigate to: `chrome://components`
   - Find: "Optimization Guide On Device Model"
   - Click: **Check for update**
   - Wait for download to complete

Without AI, the system still works but uses fallback summaries instead of generated briefs.

---

## 🎯 How It Works

### Automatic Flow

```
1. You record meetings with similar titles
   ↓
2. System detects they're part of a series
   ↓
3. 5 minutes before next meeting starts
   ↓
4. Brief card appears with context
   ↓
5. Click "Start with this Context"
   ↓
6. Context loads into recording session
```

### What You Get

**Automatically Analyzed:**
- ✅ Summary of last meeting
- ✅ Open action items (with owners and age)
- ✅ Recurring discussion topics
- ✅ Participant engagement patterns
- ✅ Predicted meeting duration
- ✅ Suggested agenda structure

---

## 🧪 Quick Test

### Create a Test Series

1. **Record First Meeting**
   ```
   Title: "Test Weekly Sync"
   Duration: 15-20 minutes
   Add some action items
   ```

2. **Record Second Meeting** (same title)
   ```
   Title: "Test Weekly Sync"  ← Same normalized title
   Duration: 15-20 minutes
   Add more action items
   ```

3. **Create Upcoming Meeting**
   - Schedule a calendar event: "Test Weekly Sync"
   - Set time: 4 minutes from now
   - Watch sidepanel!

### Expected Result

After 1-2 minutes, you should see:

```
┌─────────────────────────────────────┐
│ 📋 Pre-Meeting Brief Ready          │
│    Your meeting starts in 4 minutes │  ×
├─────────────────────────────────────┤
│ [Test Weekly Sync]    Meeting #3    │
│                                     │
│  Last IQ: 78   Duration: 18 min     │
│  Open Items: 2                      │
│                                     │
│ 📝 Context from Last Meeting        │
│ [AI-generated summary appears here] │
│                                     │
│ [Start with this Context] [Later]   │
└─────────────────────────────────────┘
```

---

## 🎨 UI Features

### Brief Card Components

**Header:**
- Meeting series name and count
- Countdown to meeting start
- Dismiss button (×)

**Metrics:**
- Last Meeting IQ Score
- Typical Duration
- Open Action Items count

**AI Summary:**
- Concise recap of last meeting
- Key decisions and outcomes
- Critical focus areas

**Quick Insights:**
- High-priority items needing attention
- Recurring topics to discuss
- Engagement patterns

**Expandable Details:**
- Full list of open action items
- Suggested agenda with time allocations
- Participant engagement breakdown

**Action Buttons:**
- **Start with this Context** - Loads brief into recording session
- **View Later** - Saves brief for later access

### Dark Mode

The brief card automatically adapts to system theme:

- **Light Mode**: Clean white design with purple accents
- **Dark Mode**: Dark gray with high-contrast text

---

## 🔧 Integration with Existing Features

### With Recording

```javascript
// When you click "Start with this Context"
1. Brief loads into transcript area as context card
2. Shows: Series info, open items, key points
3. Recording can start with full historical context
```

### With Action Items

```javascript
// Open action items are prominently displayed
• Update API documentation (Sarah Chen, 7 days old)
• Review security audit (Mike Johnson, 3 days old)

// Click to see full list in brief details
```

### With Meeting IQ

```javascript
// Last meeting's IQ score is shown
Last IQ Score: 85

// Helps predict this meeting's likely quality
// Suggests areas for improvement
```

---

## 📊 Data Requirements

### Minimum for Series Detection

- **2+ meetings** with similar titles
- **60%+ participant overlap** between meetings
- **Consistent timing** (optional but helpful)

### Best Results

- **5+ past meetings** in series
- **Rich meeting data**: transcripts, summaries, IQ scores
- **Action items** with owners and due dates
- **Regular cadence** (daily, weekly, biweekly)

---

## 🐛 Troubleshooting

### Brief not appearing?

**Check:**
1. Do you have 2+ past meetings with same title?
   - Open IndexedDB → meetings → check titles
2. Is meeting starting in exactly 5 minutes or less?
   - System checks every 60 seconds
3. Is calendar integration working?
   - Check console for "UPCOMING_MEETING_DETECTED"

**Fix:**
```javascript
// Test manually in console
chrome.runtime.sendMessage({
  type: 'GENERATE_PRE_MEETING_BRIEF',
  meeting: {
    title: 'Test Weekly Sync',
    startTime: new Date(Date.now() + 3 * 60 * 1000).toISOString()
  }
});
```

### AI brief not generating?

**Check:**
1. Is Prompt API enabled?
   - `chrome://flags/#prompt-api-for-gemini-nano`
2. Is model downloaded?
   - `chrome://components` → check "Optimization Guide"
3. Console errors?
   - Look for "Prompt API not available"

**Fix:**
- Enable flag and download model (see Step 2)
- Or use without AI (fallback to last summary)

### Wrong meetings grouped together?

**Check:**
1. Are titles too similar?
   - "Meeting" will match "Team Meeting"
2. Participant overlap too high?
   - Same people in different meetings

**Fix:**
- Use more specific meeting titles
- Ensure unique participants per series
- Adjust similarity threshold in code (line 86 of meeting-series-detector.js)

---

## 🎓 Usage Tips

### Best Practices

1. **Consistent Naming**
   - Use same base title: "Weekly Standup"
   - OK to add dates: "Weekly Standup - 11/01"
   - System normalizes automatically

2. **Action Item Hygiene**
   - Mark completed items as done
   - Assign clear owners
   - Set due dates when possible

3. **Regular Cadence**
   - Schedule recurring meetings
   - Maintain similar timing
   - Keep participant list stable

4. **Review Before Meetings**
   - Brief appears 5 minutes early
   - Take 2-3 minutes to review
   - Come prepared with context

### Power User Features

**Manual Brief Access:**
```javascript
// In sidepanel console
const briefManager = new PreMeetingBriefManager();
await briefManager.initialize();

// Force check for upcoming meetings
await briefManager.checkUpcomingMeetings();
```

**Series Analysis:**
```javascript
// Check series detection
const detector = new MeetingSeriesDetector(storageDB);
const series = await detector.findSeriesMeetings('meeting-id-here');
console.log('Found series:', series);
```

**Storage Inspection:**
```javascript
// View all briefs
const briefs = await storageDB.getPendingBriefs();
console.log('Pending briefs:', briefs);

// View all series
const allSeries = await storageDB.getAllMeetingSeries();
console.log('Tracked series:', allSeries);
```

---

## 📈 What to Expect

### First Week
- System learns your meeting patterns
- Series get detected automatically
- Briefs start appearing before recurring meetings

### After 2-3 Weeks
- Rich historical context (5-10 meetings per series)
- Accurate duration predictions
- Clear engagement patterns
- Helpful agenda suggestions

### Long Term
- Deep insights across multiple series
- Cross-meeting pattern recognition
- Personalized meeting prep
- Continuous quality improvement

---

## 🎯 Success Metrics

**You'll know it's working when:**

✅ Brief appears automatically 5 minutes before meetings  
✅ Open action items are accurately tracked  
✅ AI summaries are relevant and concise  
✅ Duration predictions are within 10% of actual  
✅ You come to meetings better prepared  
✅ Meeting quality (IQ score) improves over time  

---

## 🔄 Next Steps

### Immediate (First Hour)
1. ✅ Record 2 test meetings
2. ✅ Create upcoming meeting
3. ✅ Watch brief appear
4. ✅ Test "Start with Context"

### This Week
1. Enable for real meetings
2. Review brief accuracy
3. Mark action items as complete
4. Monitor IQ score trends

### This Month
1. Analyze pattern insights
2. Optimize meeting structures
3. Improve engagement based on data
4. Share context with team

---

## 📚 Additional Resources

- **Full Documentation**: `PRE_MEETING_BRIEF_SYSTEM.md`
- **API Reference**: See documentation Section 11
- **Troubleshooting**: See documentation Section 10
- **Testing Guide**: See documentation Section 8

---

## 💡 Pro Tips

**Tip #1: First Brief**
The first time a brief generates might take 3-5 seconds. Subsequent briefs are faster as AI session stays warm.

**Tip #2: Fallback Mode**
Without AI, briefs still show:
- Last meeting summary (first 200 chars)
- All open action items
- Duration predictions
- Engagement patterns

**Tip #3: Storage Cleanup**
Briefs auto-delete after 30 days. Manual cleanup:
```javascript
await storageDB.deleteOldBriefs(30);
```

**Tip #4: Multiple Series**
System tracks unlimited series. Each gets independent analysis and briefs.

**Tip #5: Export**
You can export briefs for sharing:
```javascript
const brief = await storageDB.getPreMeetingBrief('brief-id');
console.log(JSON.stringify(brief, null, 2));
```

---

## 🎉 You're Ready!

The Pre-Meeting Brief system is now fully operational. 

**Start recording recurring meetings and watch the magic happen!** 🚀

---

**Questions?** Check `PRE_MEETING_BRIEF_SYSTEM.md` for comprehensive documentation.
