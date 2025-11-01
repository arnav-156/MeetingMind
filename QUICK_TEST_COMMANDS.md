# 🧪 Quick Test Commands - Pre-Meeting Brief

## Console Commands for Testing

### 1️⃣ Check Initialization (Background Service Worker)

```javascript
// Verify brief system initialized
console.log('Brief generator:', briefGenerator);
console.log('Series detector:', seriesDetector);
console.log('Storage manager:', storageManager);

// Check alarm
chrome.alarms.get('checkUpcomingMeetings', (alarm) => {
  console.log('Check alarm:', alarm);
});

// List all alarms
chrome.alarms.getAll((alarms) => {
  console.log('All alarms:', alarms);
});
```

---

### 2️⃣ Check Initialization (Sidepanel)

```javascript
// Verify manager initialized
console.log('Brief manager:', briefManager);

// Check UI elements
const card = document.getElementById('pre-meeting-brief-card');
console.log('Card element:', card);
```

---

### 3️⃣ Manual Brief Generation (Sidepanel)

```javascript
// Generate brief for a test meeting
chrome.runtime.sendMessage({
  type: 'GENERATE_PRE_MEETING_BRIEF',
  meeting: {
    id: 'test-meeting-' + Date.now(),
    title: 'Weekly Standup',
    start_time: new Date(Date.now() + 4 * 60000).toISOString(),
    platform: 'Google Meet',
    url: 'https://meet.google.com/abc-defg-hij',
    participants: ['user1@example.com', 'user2@example.com']
  }
}, (response) => {
  console.log('Brief generated:', response);
});
```

---

### 4️⃣ Check for Upcoming Meetings (Sidepanel)

```javascript
// Check next 10 minutes
chrome.runtime.sendMessage({
  type: 'CHECK_UPCOMING_MEETINGS',
  timeWindow: 10
}, (response) => {
  console.log('Upcoming meetings:', response);
});
```

---

### 5️⃣ Inspect IndexedDB

```javascript
// Open IndexedDB in DevTools → Application → Storage → IndexedDB
// → meetingMindDB → preMeetingBriefs

// Or programmatically:
const request = indexedDB.open('meetingMindDB', 4);
request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction('preMeetingBriefs', 'readonly');
  const store = tx.objectStore('preMeetingBriefs');
  const getAllRequest = store.getAll();
  
  getAllRequest.onsuccess = () => {
    console.log('All briefs:', getAllRequest.result);
  };
};
```

---

### 6️⃣ Test Series Detection (Background)

```javascript
// Manually test series detection
if (seriesDetector) {
  // Get a meeting ID
  const meetingId = 'your-meeting-id';
  
  storageManager.getMeeting(meetingId).then(meeting => {
    if (meeting) {
      seriesDetector.getSeriesInfo(meeting).then(seriesInfo => {
        console.log('Series info:', seriesInfo);
      });
    }
  });
}
```

---

### 7️⃣ Force Brief Check (Background)

```javascript
// Manually trigger upcoming meeting check
checkUpcomingMeetings(10).then(meetings => {
  console.log('Found upcoming meetings:', meetings);
});
```

---

### 8️⃣ Simulate Brief Display (Sidepanel)

```javascript
// Show the brief card manually
if (briefManager) {
  // Create a test brief
  const testBrief = {
    id: 'brief_test_123',
    meeting_id: 'meeting-123',
    meeting_series_id: 'weekly-standup',
    meeting_title: 'Weekly Standup',
    meeting_date: new Date(Date.now() + 5 * 60000).toISOString(),
    generated_at: new Date().toISOString(),
    status: 'pending',
    
    last_meeting: {
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      summary: 'Discussed API improvements and bug fixes. Team velocity was good.',
      iq_score: 85,
      duration: 23
    },
    
    open_items: [
      {
        id: 'item-1',
        title: 'Fix critical API bug in user endpoint',
        owner: 'John Doe',
        priority: 95,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in-progress'
      },
      {
        id: 'item-2',
        title: 'Review pull request #234',
        owner: 'Jane Smith',
        priority: 70,
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      }
    ],
    
    patterns: {
      typical_duration: 23,
      duration_confidence: 'high',
      common_topics: ['API improvements', 'bug fixes', 'testing'],
      engagement: {
        active: ['john.doe@example.com'],
        moderate: ['jane.smith@example.com'],
        quiet: ['bob.jones@example.com']
      }
    },
    
    suggestions: {
      agenda: [
        { item: 'Review open action items', duration: 5 },
        { item: 'Status updates from team', duration: 10 },
        { item: 'Discuss API improvements', duration: 5 },
        { item: 'Plan next steps', duration: 3 }
      ],
      focus_areas: [
        'Complete API bug fix before Friday',
        'Improve test coverage to 80%'
      ],
      preparation_tips: [
        'Review pull request #234 before meeting',
        'Prepare status update on bug fix progress'
      ]
    }
  };
  
  // Display it
  briefManager.displayBrief(testBrief);
  briefManager.showBriefCard();
}
```

---

### 9️⃣ Test Brief Actions (Sidepanel)

```javascript
// Test "Start with Context" button
const briefId = 'brief_test_123';
briefManager.startWithContext(briefId);

// Test "View Later" button
briefManager.viewLater(briefId);

// Test "Dismiss" button
briefManager.dismissBrief(briefId);
```

---

### 🔟 Check Storage Stats

```javascript
// Get all meetings
storageManager.getAllMeetings().then(meetings => {
  console.log('Total meetings:', meetings.length);
  
  // Filter recurring meetings
  const recurring = meetings.filter(m => 
    m.title && meetings.filter(m2 => 
      m2.title && m2.title.toLowerCase().includes(m.title.toLowerCase().split(' ')[0])
    ).length > 1
  );
  console.log('Potentially recurring:', recurring);
});

// Get all series
storageManager.getAllMeetingSeries().then(series => {
  console.log('Meeting series:', series);
});

// Get all briefs
const request = indexedDB.open('meetingMindDB', 4);
request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction('preMeetingBriefs', 'readonly');
  const store = tx.objectStore('preMeetingBriefs');
  const countRequest = store.count();
  
  countRequest.onsuccess = () => {
    console.log('Total briefs:', countRequest.result);
  };
};
```

---

## 🎯 Expected Results

### After Running Test #1 (Initialization)
```
Brief generator: PreMeetingBriefGenerator {storageManager: {...}, seriesDetector: {...}}
Series detector: MeetingSeriesDetector {storageManager: {...}}
Storage manager: StorageManager {db: IDBDatabase}
Check alarm: {name: "checkUpcomingMeetings", periodInMinutes: 1}
```

### After Running Test #3 (Manual Generation)
```
Brief generated: {
  success: true,
  brief: {
    id: "brief_1234567890_abc",
    meeting_id: "test-meeting-1234567890",
    meeting_series_id: "weekly-standup",
    meeting_title: "Weekly Standup",
    ...
  }
}
```

### After Running Test #8 (Display)
- Card slides in from top
- Shows "Weekly Standup" title
- Countdown shows "in 5 minutes"
- Series badge: "RECURRING SERIES (0 past meetings)"
- Last IQ: 85
- Duration: ~23 min
- Open Items: 2
- AI summary displayed
- 2 insights shown
- Expandable details section

---

## 🐛 Debug Tips

### Brief Not Generating?
1. Check `briefGenerator !== null`
2. Check `storageManager !== null`
3. Check meeting has `id`, `title`, `start_time`
4. Check error logs in background console

### Card Not Showing?
1. Check `briefManager !== null`
2. Check card element exists: `document.getElementById('pre-meeting-brief-card')`
3. Check display style: `card.style.display`
4. Check for JavaScript errors in sidepanel console

### Series Not Detected?
1. Need 2+ meetings with similar titles
2. Need 60%+ participant overlap
3. Check normalized titles match
4. Run Test #6 to manually check detection

### Alarm Not Running?
1. Check alarm exists: Test #1
2. Reload extension
3. Check service worker is active
4. Check for errors in background console

---

## 📝 Quick Reference

| What | Where | Command |
|------|-------|---------|
| Check initialization | Background | `console.log(briefGenerator, seriesDetector)` |
| Generate brief | Sidepanel | `chrome.runtime.sendMessage({type: 'GENERATE_PRE_MEETING_BRIEF', ...})` |
| Check upcoming | Sidepanel | `chrome.runtime.sendMessage({type: 'CHECK_UPCOMING_MEETINGS', ...})` |
| View briefs | DevTools | Application → IndexedDB → meetingMindDB → preMeetingBriefs |
| Test display | Sidepanel | `briefManager.displayBrief(testBrief)` |
| Force check | Background | `checkUpcomingMeetings(10)` |

---

## ✅ Success Checklist

After running tests, you should see:

- [ ] ✅ Background: Brief system initialized
- [ ] ✅ Background: Alarm created and running every 1 minute
- [ ] ✅ Sidepanel: Brief manager initialized
- [ ] ✅ IndexedDB: preMeetingBriefs store created
- [ ] ✅ IndexedDB: meetingSeries store created
- [ ] ✅ Manual brief generation works (Test #3)
- [ ] ✅ Brief card displays correctly (Test #8)
- [ ] ✅ All three actions work (dismiss, view later, start with context)
- [ ] ✅ Countdown timer updates every second
- [ ] ✅ Series detection works for recurring meetings
- [ ] ✅ Context loads into transcript area when clicked

---

**Ready to test? Start with Test #1 and #2 to verify initialization! 🚀**
