# 🧪 Smart Reminders - Quick Testing Guide

## 5-Minute Quick Test

### Step 1: Record a Meeting with Action Items

1. Open Google Meet/Zoom/Teams
2. Click **🎙️ MeetingMind** button
3. Click **"▶ Start Recording"**
4. Speak clearly:
   ```
   "Alex, can you deploy the API changes by Friday end of day?
    Sarah needs to schedule a demo with the sales team by tomorrow.
    John will update the documentation by next Monday."
   ```
5. Wait 30 seconds for extraction

### Step 2: Verify Action Items & Reminders

1. Open side panel
2. Check **"Action Items"** tab
3. You should see:
   ```
   ┌─────────────────────────────────────────┐
   │ 📌 Deploy the API changes               │
   │ 👤 Alex  📅 Friday EOD  ⏰ Reminder set │
   │ [✓ Mark Done]                          │
   ├─────────────────────────────────────────┤
   │ 📌 Schedule a demo with the sales team  │
   │ 👤 Sarah  📅 Tomorrow  ⏰ Reminder set  │
   │ [✓ Mark Done]                          │
   ├─────────────────────────────────────────┤
   │ 📌 Update the documentation             │
   │ 👤 John  📅 Next Monday  ⏰ Reminder set│
   │ [✓ Mark Done]                          │
   └─────────────────────────────────────────┘
   ```

### Step 3: Check Scheduled Alarms

1. Open extension service worker console:
   - `chrome://extensions/` → MeetingMind → "service worker"
2. Run:
   ```javascript
   chrome.alarms.getAll(alarms => console.table(alarms));
   ```
3. You should see alarms like:
   ```
   reminder_[id]_before_deadline
   reminder_[id]_day_after
   weekly_digest
   ```

### Step 4: Test Notification (Fast-Forward)

**Option A: Manually Trigger Alarm**
```javascript
// In service worker console
chrome.alarms.create('test_reminder', { when: Date.now() + 5000 });

// Wait 5 seconds, you should see a test notification
```

**Option B: Mock Reminder**
```javascript
// In service worker console
const { triggerReminder } = await import('./utils/reminder-manager.js');

// Trigger an existing reminder
const alarms = await chrome.alarms.getAll();
if (alarms.length > 0) {
  await triggerReminder(alarms[0].name);
}
```

### Step 5: Test Notification Interactions

When notification appears:

**Test 1: Click Body**
- Click anywhere on notification (not buttons)
- ✅ Side panel should open
- ✅ Action item should be highlighted (yellow pulse)

**Test 2: Click "Mark Done"**
- Click **"✓ Mark Done"** button
- ✅ Confirmation notification appears
- ✅ Action item marked complete in side panel
- ✅ Item gets strikethrough

**Test 3: Click "Snooze"**
- Click **"⏰ Snooze 1 Day"** button
- ✅ Confirmation notification appears
- ✅ Alarm rescheduled for +24 hours

---

## Visual Testing Examples

### Example 1: Before Deadline Reminder

```
⏰ EXPECTED NOTIFICATION
┌────────────────────────────────────────────────┐
│ 🔔 MeetingMind                                 │
├────────────────────────────────────────────────┤
│ ⏰ Action Item Due Tomorrow                    │
│                                                │
│ 📌 Deploy the API changes                      │
│ 👤 Owner: Alex                                 │
│ 📅 Due: Friday EOD                             │
│                                                │
│ From: Engineering Sync (Oct 29, 2025)         │
│                                                │
│ [✓ Mark Done]        [⏰ Snooze 1 Day]        │
└────────────────────────────────────────────────┘
```

### Example 2: Day-After Meeting Reminder

```
⏰ EXPECTED NOTIFICATION
┌────────────────────────────────────────────────┐
│ 🔔 MeetingMind                                 │
├────────────────────────────────────────────────┤
│ 📋 Follow-up: Action Item from Yesterday      │
│                                                │
│ 📌 Schedule a demo with the sales team         │
│ 👤 Owner: Sarah                                │
│                                                │
│ From: Product Planning (Oct 28, 2025)         │
│                                                │
│ [✓ Mark Done]        [⏰ Snooze 1 Day]        │
└────────────────────────────────────────────────┘
```

### Example 3: Weekly Digest

```
⏰ EXPECTED NOTIFICATION (Every Monday 9 AM)
┌────────────────────────────────────────────────┐
│ 🔔 MeetingMind                                 │
├────────────────────────────────────────────────┤
│ 📊 Weekly Action Items Digest                  │
│                                                │
│ You have 5 open action items from 3 meetings. │
│                                                │
│ 1. Deploy the API changes (Engineering)       │
│ 2. Schedule demo (Product Planning)           │
│ 3. Update documentation (Design Review)       │
│                                                │
│ ... and 2 more                                 │
│                                                │
│ [📋 View All Items]                           │
└────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Urgent Deadline (Today/Tomorrow)

**Input:**
```
"Sarah, can you send the report by end of day today?"
```

**Expected:**
- ✅ Action item created
- ✅ Badge: 📅 EOD Today (RED badge - urgent)
- ✅ Reminder scheduled for TOMORROW at 8 AM (since deadline is today, 24h before has passed)
- ✅ Day-after reminder scheduled

### Scenario 2: Specific Date Deadline

**Input:**
```
"John needs to complete testing by 12/31."
```

**Expected:**
- ✅ Action item created
- ✅ Badge: 📅 12/31
- ✅ Reminder scheduled for 12/30 at 5:00 PM (24h before)
- ✅ Day-after reminder scheduled

### Scenario 3: No Deadline

**Input:**
```
"Alex should look into that bug when he has time."
```

**Expected:**
- ✅ Action item created
- ✅ Badge: 👤 Alex (no date badge)
- ❌ NO reminder scheduled (no deadline)

### Scenario 4: Vague Deadline

**Input:**
```
"Sarah will follow up next week."
```

**Expected:**
- ✅ Action item created
- ✅ Badge: 📅 Next week
- ✅ Reminder scheduled for 6 days from now at 5 PM (24h before 7-day default)

### Scenario 5: DND Hours

**Input:**
- Current time: 11:00 PM (DND hours: 10 PM - 8 AM)
- Action item due: Tomorrow 5:00 PM
- Reminder should trigger: Tonight 11:00 PM (24h before)

**Expected:**
- ✅ Reminder adjusted to TOMORROW 8:00 AM
- ✅ Console log: "Adjusted time to avoid DND"

---

## Console Debugging Commands

### Check All Reminders

```javascript
// Get all reminders from IndexedDB
const db = await indexedDB.open('MeetingMindDB', 2);
const tx = db.transaction('reminders', 'readonly');
const reminders = await tx.objectStore('reminders').getAll();
console.table(reminders.result);
```

### Check All Alarms

```javascript
chrome.alarms.getAll(alarms => {
  console.log(`Total alarms: ${alarms.length}`);
  alarms.forEach(alarm => {
    const when = new Date(alarm.scheduledTime);
    console.log(`${alarm.name} → ${when.toLocaleString()}`);
  });
});
```

### Manually Trigger Reminder

```javascript
// Import reminder manager
const { triggerReminder } = await import('./utils/reminder-manager.js');

// Get first alarm
const alarms = await chrome.alarms.getAll();
console.log('Available alarms:', alarms.map(a => a.name));

// Trigger specific reminder
await triggerReminder('reminder_123_before_deadline');
```

### Clear All Alarms

```javascript
chrome.alarms.clearAll(() => {
  console.log('✅ All alarms cleared');
});
```

### Clear All Reminders from DB

```javascript
const db = await indexedDB.open('MeetingMindDB', 2);
const tx = db.transaction('reminders', 'readwrite');
const store = tx.objectStore('reminders');
await store.clear();
console.log('✅ All reminders cleared from database');
```

### Test Do Not Disturb

```javascript
// Force a reminder to DND hours
const now = new Date();
now.setHours(23, 0, 0, 0); // 11 PM

const { adjustForDND } = await import('./utils/reminder-manager.js');
const adjusted = adjustForDND(now);

console.log('Original:', now.toLocaleString());
console.log('Adjusted:', adjusted.toLocaleString());
// Should show 8:00 AM next day
```

---

## Troubleshooting Quick Checks

### Issue: No Notifications Appearing

**Check 1: Browser Permissions**
```
chrome://settings/content/notifications
→ Ensure MeetingMind is "Allowed"
```

**Check 2: System DND**
- Windows: Settings → Focus Assist → Off
- Mac: System Preferences → Notifications → Do Not Disturb → Off
- Linux: Check system notification settings

**Check 3: Alarms Scheduled**
```javascript
chrome.alarms.getAll(a => console.log(a.length > 0 ? '✅ Alarms exist' : '❌ No alarms'));
```

### Issue: Wrong Notification Time

**Check: Timezone**
```javascript
const now = new Date();
console.log('Local time:', now.toLocaleString());
console.log('Timezone offset:', now.getTimezoneOffset()); // Minutes from UTC
console.log('Hour:', now.getHours()); // Should match your clock
```

**Check: DND Adjustment**
```javascript
const alarms = await chrome.alarms.getAll();
alarms.forEach(alarm => {
  const time = new Date(alarm.scheduledTime);
  const hour = time.getHours();
  console.log(`${alarm.name}: ${time.toLocaleString()} (Hour: ${hour})`);
  if (hour === 8) {
    console.log('  → This was likely adjusted for DND');
  }
});
```

### Issue: Notification Not Opening Side Panel

**Check: Side Panel API Support**
```javascript
if (chrome.sidePanel) {
  console.log('✅ Side Panel API supported');
} else {
  console.log('❌ Side Panel API not supported (need Chrome 114+)');
}
```

**Check: Active Tab**
```javascript
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  console.log('Active tab:', tabs[0]?.id);
});
```

---

## Performance Testing

### Memory Usage

```javascript
// Check memory usage
if (performance.memory) {
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  console.log('Used:', mb(performance.memory.usedJSHeapSize));
  console.log('Total:', mb(performance.memory.totalJSHeapSize));
  console.log('Limit:', mb(performance.memory.jsHeapSizeLimit));
}
```

### Database Size

```javascript
navigator.storage.estimate().then(estimate => {
  const mb = (estimate.usage / 1024 / 1024).toFixed(2);
  const quota = (estimate.quota / 1024 / 1024).toFixed(0);
  console.log(`Storage: ${mb} MB / ${quota} MB (${(estimate.usage / estimate.quota * 100).toFixed(1)}%)`);
});
```

### Reminder Count

```javascript
const db = await indexedDB.open('MeetingMindDB', 2);
const tx = db.transaction(['reminders', 'actionItems'], 'readonly');
const reminders = await tx.objectStore('reminders').getAll();
const actions = await tx.objectStore('actionItems').getAll();

console.log(`Action Items: ${actions.result.length}`);
console.log(`Reminders: ${reminders.result.length}`);
console.log(`Avg Reminders/Item: ${(reminders.result.length / actions.result.length).toFixed(1)}`);
```

---

## Expected Console Logs

### When Action Items Extracted

```
[ReminderManager] Scheduling reminders for: Deploy the API changes
[ReminderManager] Scheduled before-deadline reminder: reminder_123_before_deadline in 1380 minutes
[ReminderManager] Scheduled day-after reminder: reminder_123_day_after
[ReminderManager] Reminders scheduled successfully
⏰ Reminders scheduled for: Deploy the API changes
```

### When Alarm Fires

```
⏰ Alarm triggered: reminder_123_before_deadline
[ReminderManager] Triggering reminder: reminder_123_before_deadline
[ReminderManager] Notification sent: notification_reminder_123_before_deadline
```

### When Button Clicked

```
🔘 Notification button clicked: notification_reminder_123_before_deadline, button 0
[ReminderManager] Button 0 clicked on notification notification_reminder_123_before_deadline
[ReminderManager] Marking action item complete: 123
[ReminderManager] Cancelling reminders for action item: 123
[ReminderManager] Cancelled reminder: reminder_123_before_deadline
```

### When DND Adjusted

```
[ReminderManager] Adjusted time to avoid DND: 11/1/2025, 8:00:00 AM
```

---

## Success Criteria

### ✅ Basic Functionality
- [ ] Action items extracted from speech
- [ ] Reminders scheduled automatically
- [ ] Notifications appear at correct time
- [ ] Buttons work (Mark Done, Snooze)
- [ ] Side panel opens on notification click

### ✅ Advanced Features
- [ ] Deadline parsing works for 10+ formats
- [ ] DND hours respected (10 PM - 8 AM)
- [ ] Max 3 reminders enforced
- [ ] Weekly digest sent every Monday 9 AM
- [ ] Highlighted item scrolls into view

### ✅ Edge Cases
- [ ] No crashes with missing deadlines
- [ ] Handles completed items gracefully
- [ ] Old meetings don't trigger reminders
- [ ] Database cleanup works (30 day retention)

---

## 🎉 If All Tests Pass

**Congratulations!** The Smart Reminders system is working perfectly. You now have:

✅ Automated action item reminders  
✅ Timezone-aware scheduling  
✅ Do Not Disturb support  
✅ Rich notification interactions  
✅ Snooze & retry logic  
✅ Weekly digests  

**System Status:** 🟢 Production Ready

---

**Testing completed:** _________  
**Tested by:** _________  
**Issues found:** _________  
**Status:** ☐ Pass ☐ Fail ☐ Needs Review
