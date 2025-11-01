# 🔔 Smart Reminders System

## Overview

MeetingMind's Smart Reminder system uses **chrome.alarms** and **chrome.notifications** to help you never miss an action item. The system automatically schedules reminders based on deadlines, sends follow-ups after meetings, and provides weekly digests of open tasks.

**Key Features:**
- ⏰ **24-hour before deadline** reminders
- 📋 **Day-after meeting** follow-ups
- 📊 **Weekly digest** (every Monday at 9 AM)
- 🌍 **Timezone-aware** scheduling
- 🌙 **Do Not Disturb** hours (10 PM - 8 AM)
- 🔄 **Snooze functionality** (1 hour, 1 day, 3 days)
- 🚫 **Max 3 reminders** per action item (no spam!)
- ✓ **Click to Mark Done** directly from notification

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Reminder Types](#reminder-types)
3. [Notification Format](#notification-format)
4. [Do Not Disturb Hours](#do-not-disturb-hours)
5. [Snooze & Retry Logic](#snooze--retry-logic)
6. [Deadline Parsing](#deadline-parsing)
7. [User Interface](#user-interface)
8. [Technical Architecture](#technical-architecture)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## How It Works

```
MEETING RECORDING
      ↓
ACTION ITEMS EXTRACTED
      ↓
DEADLINES PARSED
      ↓
REMINDERS SCHEDULED
      ↓
chrome.alarms SET
      ↓
NOTIFICATION SENT at scheduled time
      ↓
USER CLICKS: [Mark Done] or [Snooze]
      ↓
SIDE PANEL OPENS with highlighted item
```

### Automatic Scheduling

1. **During Recording**: When action items are extracted (automatically every 10 transcripts), the system analyzes each item for:
   - **Owner** (who is responsible)
   - **Task** (what needs to be done)
   - **Due date** (when it's due)

2. **Reminder Creation**: For each action item with a deadline:
   - **24-hour before deadline** reminder is scheduled
   - **Day-after meeting** follow-up is scheduled (if deadline hasn't passed)

3. **Weekly Digest**: Every **Monday at 9 AM**, a digest of all open action items is sent

---

## Reminder Types

### 1. Before Deadline Reminder

**When**: 24 hours before the deadline  
**Title**: "⏰ Action Item Due Tomorrow"  
**Purpose**: Gives you advance notice to complete the task

**Example:**
```
Meeting: "Engineering Sync" (Oct 28, 2025)
Action Item: "Deploy API changes" (Due: Friday EOD)
Deadline: Friday Oct 31, 5:00 PM
Reminder: Thursday Oct 30, 5:00 PM

Notification:
┌────────────────────────────────────────┐
│ ⏰ Action Item Due Tomorrow            │
├────────────────────────────────────────┤
│ 📌 Deploy API changes                  │
│ 👤 Owner: Alex                         │
│ 📅 Due: Friday EOD                     │
│                                        │
│ From: Engineering Sync (Oct 28)       │
│                                        │
│ [✓ Mark Done]  [⏰ Snooze 1 Day]      │
└────────────────────────────────────────┘
```

**Scheduling Logic:**
- Deadline is parsed (e.g., "Friday EOD" → Friday 5:00 PM)
- 24 hours subtracted → Thursday 5:00 PM
- DND check: If scheduled during DND hours (10 PM - 8 AM), moved to 8 AM

**Skipped If:**
- Deadline is less than 24 hours away
- Deadline has already passed
- Action item marked as completed

---

### 2. Day-After Meeting Reminder

**When**: 24 hours after meeting ends  
**Title**: "📋 Follow-up: Action Item from Yesterday"  
**Purpose**: Ensures you follow up on action items from recent meetings

**Example:**
```
Meeting: "Product Planning" (Oct 29, 2025 2:00 PM)
Action Item: "Schedule demo with sales team"
Reminder: Oct 30, 2:00 PM

Notification:
┌────────────────────────────────────────┐
│ 📋 Follow-up: Action Item from        │
│     Yesterday                          │
├────────────────────────────────────────┤
│ 📌 Schedule demo with sales team       │
│ 👤 Owner: Sarah                        │
│                                        │
│ From: Product Planning (Oct 29)       │
│                                        │
│ [✓ Mark Done]  [⏰ Snooze 1 Day]      │
└────────────────────────────────────────┘
```

**Scheduling Logic:**
- Meeting start time + 24 hours
- DND check applied
- Sent regardless of deadline status

**Skipped If:**
- Meeting was more than 24 hours ago (no retroactive reminders)
- Action item already completed

---

### 3. Weekly Digest

**When**: Every **Monday at 9:00 AM**  
**Title**: "📊 Weekly Action Items Digest"  
**Purpose**: Weekly overview of all open action items

**Example:**
```
Notification:
┌────────────────────────────────────────┐
│ 📊 Weekly Action Items Digest          │
├────────────────────────────────────────┤
│ You have 5 open action items from     │
│ 3 meetings.                            │
│                                        │
│ 1. Deploy API changes (Engineering)   │
│ 2. Schedule demo (Product Planning)   │
│ 3. Update documentation (Design)      │
│                                        │
│ ... and 2 more                         │
│                                        │
│ [📋 View All Items]                   │
└────────────────────────────────────────┘
```

**Scheduling Logic:**
- Recurring alarm: Every 7 days
- First occurrence: Next Monday from extension installation
- Time: 9:00 AM (user's local timezone)
- DND check applied

**Content:**
- Groups action items by meeting
- Shows top 3 items
- Total count displayed
- Clicking opens side panel with "All" filter

**Skipped If:**
- No open action items (no notification sent)

---

## Notification Format

### Standard Notification Structure

All reminder notifications follow this format:

```javascript
{
  type: 'basic',
  iconUrl: 'icons/icon128.png', // MeetingMind logo
  title: 'Title varies by reminder type',
  message: 'Body with action item details',
  priority: 0-2, // 0=low, 1=default, 2=high
  requireInteraction: true, // Stays until user clicks
  buttons: [
    { title: '✓ Mark Done' },
    { title: '⏰ Snooze 1 Day' }
  ],
  contextMessage: 'From: [Meeting Name] ([Date])'
}
```

### Notification Actions

#### Button 0: "✓ Mark Done"
- Marks action item as **completed**
- Cancels all future reminders for that item
- Updates status in IndexedDB
- Shows confirmation: "✓ Action Item Completed" (auto-clears after 3s)

#### Button 1: "⏰ Snooze 1 Day"
- Reschedules reminder for **24 hours later**
- Increments snooze count
- Shows confirmation: "⏰ Reminder Snoozed" (auto-clears after 3s)
- Still subject to max retry limit (3 total)

#### Click on Notification Body
- Opens MeetingMind side panel
- Highlights the relevant action item (yellow pulse animation)
- Scrolls into view
- Highlight fades after 3 seconds

---

## Do Not Disturb Hours

### Default Schedule

**DND Hours**: 10:00 PM - 8:00 AM (user's local timezone)

During these hours:
- ❌ No notifications are sent
- ⏭️ Reminders are automatically rescheduled to **8:00 AM**
- ✅ All other scheduling rules still apply

### How It Works

```javascript
// Example: Reminder scheduled for 11 PM
Original Time: Oct 30, 11:00 PM
DND Check:     11 PM is between 10 PM - 8 AM
Adjusted Time: Oct 31, 8:00 AM ✅
```

```javascript
// Example: Reminder scheduled for 3 PM
Original Time: Oct 30, 3:00 PM
DND Check:     3 PM is NOT in DND window
Adjusted Time: Oct 30, 3:00 PM ✅ (no change)
```

### Timezone Handling

The system uses `Date` objects with the **user's local timezone**:

```javascript
const now = new Date(); // Automatically uses local timezone
const hour = now.getHours(); // 0-23 in local time

if (hour >= DND_START_HOUR || hour < DND_END_HOUR) {
  // Adjust to 8 AM
  adjusted.setHours(8, 0, 0, 0);
}
```

**No configuration needed** - works automatically for any timezone!

### Customization

To change DND hours, edit `utils/reminder-manager.js`:

```javascript
const REMINDER_CONFIG = {
  DND_START_HOUR: 22, // 10 PM (change to 21 for 9 PM)
  DND_END_HOUR: 8,    // 8 AM  (change to 7 for 7 AM)
  // ...
};
```

---

## Snooze & Retry Logic

### Max Reminders Per Item: 3

To prevent notification spam, each action item has a **maximum of 3 reminders**:

```
Reminder 1: Original scheduled time (count = 0)
Reminder 2: After first snooze or retry (count = 1)
Reminder 3: After second snooze or retry (count = 2)
Max Reached: No more reminders (count = 3)
```

### Snooze Behavior

When you click **"⏰ Snooze 1 Day"**:

1. Reminder rescheduled to **current time + 24 hours**
2. DND check applied to new time
3. Retry count incremented
4. Snooze count tracked separately
5. Chrome alarm rescheduled

**Example:**
```
Original:  Oct 30, 5:00 PM (retryCount = 0)
Snooze 1:  Oct 31, 5:00 PM (retryCount = 1, snoozeCount = 1)
Snooze 2:  Nov 1,  5:00 PM (retryCount = 2, snoozeCount = 2)
Snooze 3:  Max reached - no more reminders
```

### Retry vs. Snooze

**Retry**: Automatic system behavior  
**Snooze**: User-initiated action

Both count toward the max limit of 3.

### Database Tracking

Each reminder in IndexedDB stores:

```javascript
{
  id: 'reminder_123_before_deadline',
  actionItemId: '123',
  type: 'before_deadline',
  scheduledTime: 1698768000000,
  retryCount: 1,
  snoozeCount: 1,
  status: 'snoozed', // 'scheduled', 'sent', 'snoozed', 'completed', 'cancelled', 'max_reached'
  createdAt: 1698681600000,
  snoozedAt: 1698768000000
}
```

---

## Deadline Parsing

The system intelligently parses various deadline formats:

### Supported Formats

| Input | Parsed As | Time Set |
|-------|-----------|----------|
| "Today" | Today's date | 5:00 PM |
| "Tomorrow" | Tomorrow's date | 5:00 PM |
| "EOD" / "End of day" | Today | 5:00 PM |
| "Next week" | 7 days from now | 5:00 PM |
| "End of week" | This Friday | 5:00 PM |
| "Monday" | Next Monday | 5:00 PM |
| "Tuesday", "Wednesday", etc. | Next occurrence | 5:00 PM |
| "12/31" | December 31 (current year) | 5:00 PM |
| "12/31/25" | December 31, 2025 | 5:00 PM |
| "In 3 days" | 3 days from now | 5:00 PM |
| "By Friday" | This Friday | 5:00 PM |
| "Not specified" | 7 days from meeting | 5:00 PM |

### Parsing Logic

```javascript
// Example: "Next Monday"
Input: "Next Monday"
Current Day: Wednesday Oct 30, 2025
→ Days until Monday: 5 days
→ Deadline: Monday Nov 4, 2025, 5:00 PM

// Example: "12/31"
Input: "12/31"
Current Year: 2025
→ Month: 12 (December)
→ Day: 31
→ Deadline: Tuesday Dec 31, 2025, 5:00 PM
```

### Fallback Behavior

If deadline cannot be parsed:
- **Default**: 7 days from meeting start time
- **Time**: 5:00 PM
- **No reminder scheduled** if "Not specified" or "TBD"

### Time Assumptions

All deadlines assume **5:00 PM** (17:00) unless:
- "EOD" is mentioned → 5:00 PM (end of business day)
- Specific time is mentioned → that time (not yet implemented)

---

## User Interface

### Side Panel Action Items

Action items display with reminder indicators:

```
┌────────────────────────────────────────────┐
│ 📌 Deploy API changes                      │
│                                            │
│ 👤 Alex  📅 Friday EOD  ⏰ Reminder set   │
│                                            │
│ [✓ Mark Done]                             │
└────────────────────────────────────────────┘
```

#### Badges Explained

| Badge | Meaning | Color |
|-------|---------|-------|
| 👤 Name | Person assigned | Blue |
| 👥 Team | Team task | Blue |
| 📅 Date | Deadline | Blue (normal) / Red (urgent) |
| ⏰ Reminder set | Reminder scheduled | Green |

#### Mark Done Button

- **Visibility**: Only shown for **incomplete** action items
- **Action**: Marks item as completed, cancels reminders
- **Hover**: Scales to 105%, darkens background
- **Color**: Green (`--success-500`)

### Highlighted Item (from Notification Click)

When you click a notification:

1. Side panel opens
2. Relevant action item **highlighted with yellow pulse**
3. Smooth scroll to bring item into view
4. Highlight fades after **3 seconds**

**Visual Effect:**
```css
.highlighted-item {
  animation: highlightPulse 2s ease-in-out;
  border: 2px solid var(--warning-500);
  background: var(--warning-50);
}

@keyframes highlightPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.3); }
}
```

---

## Technical Architecture

### Files Modified

1. **`utils/reminder-manager.js`** (NEW)
   - Core reminder logic
   - Deadline parsing
   - Scheduling functions
   - Notification handling

2. **`utils/storage.js`** (ENHANCED)
   - Added `reminders` IndexedDB store
   - Added `notificationMappings` store
   - New methods: `addReminder()`, `getReminder()`, `updateReminder()`, etc.

3. **`manifest.json`** (UPDATED)
   - Added `alarms` permission
   - Added `notifications` permission

4. **`background.js`** (ENHANCED)
   - `chrome.alarms.onAlarm` listener
   - `chrome.notifications.onButtonClicked` listener
   - `chrome.notifications.onClicked` listener
   - Reminder initialization on install

5. **`sidepanel/sidepanel.js`** (ENHANCED)
   - Reminder badges in `renderActionItems()`
   - Highlight handling from `chrome.storage.session`
   - "Mark Done" button functionality

6. **`sidepanel/sidepanel.html`** (ENHANCED)
   - CSS for `.highlighted-item`
   - CSS for `@keyframes highlightPulse`

### Data Flow

```
ACTION ITEM EXTRACTED
      ↓
background.js: extractActionItems()
      ↓
reminder-manager.js: scheduleRemindersForActionItem()
      ↓
Parse deadline → Calculate reminder times
      ↓
storage.js: addReminder() → IndexedDB
      ↓
chrome.alarms.create() → Browser alarm set
      ↓
[TIME PASSES]
      ↓
chrome.alarms.onAlarm → background.js listener
      ↓
reminder-manager.js: triggerReminder()
      ↓
chrome.notifications.create() → Notification shown
      ↓
USER CLICKS BUTTON → chrome.notifications.onButtonClicked
      ↓
reminder-manager.js: handleNotificationButtonClick()
      ↓
Action: Mark Done OR Snooze
      ↓
storage.js: updateActionItem() / updateReminder()
```

### IndexedDB Schema

#### Reminders Store

```javascript
{
  id: 'reminder_123_before_deadline', // Primary key
  actionItemId: '123',
  type: 'before_deadline', // or 'day_after_meeting'
  scheduledTime: 1698768000000, // Timestamp (ms)
  originalTime: 1698768000000,
  retryCount: 0,
  snoozeCount: 0,
  status: 'scheduled', // 'scheduled', 'sent', 'snoozed', 'completed', 'cancelled', 'max_reached'
  actionItem: { /* Full action item object */ },
  meetingDate: 1698681600000,
  createdAt: 1698681600000,
  sentAt: null,
  snoozedAt: null
}
```

**Indexes:**
- `actionItemId` (get all reminders for an action item)
- `type` (query by reminder type)
- `status` (query active/completed reminders)
- `scheduledTime` (query upcoming reminders)

#### Notification Mappings Store

```javascript
{
  notificationId: 'notification_reminder_123', // Primary key
  reminderId: 'reminder_123_before_deadline',
  createdAt: 1698768000000
}
```

**Purpose:** Maps notification IDs to reminder IDs for button click handling

---

## Configuration

### Reminder Settings

Edit `utils/reminder-manager.js` → `REMINDER_CONFIG`:

```javascript
const REMINDER_CONFIG = {
  // Do Not Disturb hours (24-hour format)
  DND_START_HOUR: 22, // 10 PM
  DND_END_HOUR: 8,    // 8 AM
  
  // Maximum reminders per action item
  MAX_REMINDERS_PER_ITEM: 3,
  
  // Reminder types
  TYPES: {
    BEFORE_DEADLINE: {
      name: 'before_deadline',
      hoursBeforeDeadline: 24, // ← Change to 48 for 2 days before
      title: '⏰ Action Item Due Tomorrow',
      priority: 2
    },
    DAY_AFTER_MEETING: {
      name: 'day_after_meeting',
      hoursAfterMeeting: 24, // ← Change to 48 for 2 days after
      title: '📋 Follow-up: Action Item from Yesterday',
      priority: 1
    },
    WEEKLY_DIGEST: {
      name: 'weekly_digest',
      dayOfWeek: 1, // 1 = Monday (0 = Sunday, 6 = Saturday)
      hour: 9, // 9 AM ← Change to 10 for 10 AM
      title: '📊 Weekly Action Items Digest',
      priority: 0
    }
  },
  
  // Snooze durations (milliseconds)
  SNOOZE_DURATIONS: {
    '1_HOUR': 60 * 60 * 1000,
    '1_DAY': 24 * 60 * 60 * 1000,
    '3_DAYS': 3 * 24 * 60 * 60 * 1000
  }
};
```

### Disable Specific Reminder Types

Comment out scheduling calls in `background.js` → `extractActionItems()`:

```javascript
// Disable before-deadline reminders
// await scheduleRemindersForActionItem(item, meetingStartTime);

// Disable weekly digest
// await scheduleWeeklyDigest();
```

---

## Troubleshooting

### Problem: Notifications Not Appearing

**Check:**
1. Browser notification permissions granted?
   - `chrome://settings/content/notifications`
   - Ensure MeetingMind extension is allowed

2. Do Not Disturb mode enabled?
   - Check system DND settings (Windows, Mac, Linux)
   - Reminders will be delayed until DND ends

3. Check browser console for errors:
   - Open extension service worker console
   - Look for `[ReminderManager]` logs

4. Verify alarms are set:
   - Run in console: `chrome.alarms.getAll(console.log)`
   - Should see alarms like `reminder_123_before_deadline`

### Problem: Too Many Notifications

**Solution:**
- Reduce `MAX_REMINDERS_PER_ITEM` in config (default: 3)
- Increase `hoursBeforeDeadline` to get fewer frequent reminders
- Disable day-after-meeting reminders

### Problem: Reminders at Wrong Time

**Check:**
1. Timezone: System uses browser's local timezone
2. DND hours: Reminders may be adjusted to 8 AM
3. Deadline parsing: Check parsed deadline in console logs

**Debug:**
```javascript
// In reminder-manager.js, add logs:
console.log('Original time:', reminderTime.toLocaleString());
console.log('Adjusted time:', adjustedTime.toLocaleString());
```

### Problem: Notification Click Doesn't Open Side Panel

**Cause:** Side panel API requires active tab

**Solution:** Extension will try to open side panel in current window. If it fails:
1. Click extension icon manually
2. Check browser console for errors
3. Ensure extension has `sidePanel` permission (should be in manifest)

### Problem: Action Item Not Highlighted

**Check:**
1. `chrome.storage.session` API supported? (Chrome 102+)
2. Check session storage:
   ```javascript
   chrome.storage.session.get(['highlightActionItem'], console.log);
   ```
3. Item ID matches? Check console logs for `highlightActionItem` value

### Problem: Weekly Digest Not Sent

**Check:**
1. Are there any open action items?
   - Digest only sent if open items exist
2. Check alarm:
   ```javascript
   chrome.alarms.get('weekly_digest', console.log);
   ```
3. Verify day and time:
   - Should be Monday 9:00 AM (local time)

### Problem: Reminders After Completion

**Cause:** Action item marked complete, but reminders not cancelled

**Solution:** Reminders should auto-cancel when marking item complete. If not:
1. Check `storage.js` → `updateActionItem()` implementation
2. Verify `cancelRemindersForActionItem()` is called
3. Manually clear alarms:
   ```javascript
   chrome.alarms.clearAll();
   ```

### Problem: Database Errors

**Cause:** IndexedDB version mismatch

**Solution:**
1. Increment `version` in `storage.js` (currently `2`)
2. Add migration logic in `onupgradeneeded`
3. Or clear IndexedDB:
   - Open DevTools → Application → Storage → IndexedDB
   - Delete `MeetingMindDB`
   - Reload extension

---

## Best Practices

### For Users

1. **Set Clear Deadlines**: Use specific dates/times when assigning action items
   - ✅ "Complete by Friday 3 PM"
   - ❌ "ASAP" or "Soon"

2. **Mark Items Done Promptly**: Click "✓ Mark Done" to prevent unnecessary reminders

3. **Use Snooze Wisely**: Don't snooze repeatedly - task will hit max reminder limit

4. **Review Weekly Digest**: Check open items every Monday to stay on track

### For Developers

1. **Test Timezone Handling**: Test with different timezone settings

2. **Respect Max Reminders**: Don't bypass the 3-reminder limit - users will get annoyed

3. **Log Everything**: Reminder-manager uses extensive logging - keep it that way

4. **Handle Edge Cases**: What if meeting is in the past? What if deadline is "TBD"?

5. **Clean Up Old Data**: `cleanupOldReminders()` runs automatically - verify it works

---

## Future Enhancements

### Potential Features

1. **Customizable Snooze Durations**
   - Let users choose: 1 hour, 4 hours, 1 day, 3 days

2. **Smart Snooze**
   - Snooze until "next business day" or "next Monday"

3. **Priority-Based Reminders**
   - High-priority items get more frequent reminders

4. **User Preferences**
   - UI to customize DND hours, max reminders, notification frequency

5. **Rich Notifications**
   - Show action item context, related meeting notes
   - Inline completion checkbox

6. **Multi-Platform Sync**
   - Sync reminders across devices via Chrome Sync

7. **Email Reminders**
   - Optional email notifications for critical items

8. **Voice Reminders**
   - Text-to-speech for reminders (accessibility)

9. **Reminder Templates**
   - "Remind me daily until done"
   - "Remind me 1 week before and 1 day before"

10. **Analytics**
    - Track completion rates, average response time
    - "You completed 80% of action items on time!"

---

## API Reference

### `scheduleRemindersForActionItem(actionItem, meetingDate)`

Schedules all applicable reminders for an action item.

**Parameters:**
- `actionItem` (Object): Action item with `id`, `task`, `who`, `due`, `meetingId`
- `meetingDate` (Number): Meeting start timestamp (milliseconds)

**Returns:** `Promise<void>`

**Example:**
```javascript
await scheduleRemindersForActionItem({
  id: '123',
  task: 'Deploy API',
  who: 'Alex',
  due: 'Friday EOD',
  meetingId: 'meeting_456'
}, 1698681600000);
```

---

### `triggerReminder(alarmName)`

Triggers a reminder when its alarm fires.

**Parameters:**
- `alarmName` (String): Name of the chrome.alarm

**Returns:** `Promise<void>`

**Called by:** `chrome.alarms.onAlarm` listener

---

### `handleNotificationButtonClick(notificationId, buttonIndex)`

Handles notification button clicks (Mark Done, Snooze).

**Parameters:**
- `notificationId` (String): Notification ID
- `buttonIndex` (Number): 0 = Mark Done, 1 = Snooze

**Returns:** `Promise<void>`

**Called by:** `chrome.notifications.onButtonClicked` listener

---

### `handleNotificationClick(notificationId)`

Handles notification body clicks (opens side panel).

**Parameters:**
- `notificationId` (String): Notification ID

**Returns:** `Promise<void>`

**Called by:** `chrome.notifications.onClicked` listener

---

## Changelog

### Version 2.4.0 (Nov 2025)
- ✨ Initial Smart Reminders implementation
- ⏰ 24-hour before deadline reminders
- 📋 Day-after meeting follow-ups
- 📊 Weekly digest (every Monday)
- 🌙 Do Not Disturb hours (10 PM - 8 AM)
- 🔄 Snooze functionality (1 day)
- 🚫 Max 3 reminders per item
- ✓ Mark Done from notification
- 🎯 Highlighted action items on notification click

---

## License

MIT License - See main project README

---

## Support

**Questions?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)  
**Bug reports:** Open an issue on GitHub  
**Feature requests:** Discussions tab on GitHub

---

**Built with ❤️ by the MeetingMind Team**

*Smart reminders that respect your time and help you stay productive.*
