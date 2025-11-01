# 📅 Calendar Integration - Complete Guide

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [User Guide](#user-guide)
- [Technical Architecture](#technical-architecture)
- [Integration with Smart Reminders](#integration-with-smart-reminders)
- [Privacy & Security](#privacy--security)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Calendar Integration feature allows you to seamlessly connect your MeetingMind transcripts with your calendar workflow. Export follow-up meetings as `.ics` files, copy formatted notes to paste into existing calendar events, and generate shareable links for transcript distribution.

### What's New
✅ **Generate Follow-up Meetings** - Export `.ics` files that can be imported into any calendar app  
✅ **Copy Calendar Notes** - Formatted notes ready to paste into calendar event descriptions  
✅ **Shareable Transcript Links** - Generate secure, time-limited links to share meeting data  
✅ **Smart Reminders Integration** - Automatically schedule reminders for follow-up meetings  

---

## Features

### 1. 📅 Follow-up Meeting (.ics Export)

Generate RFC 5545 compliant `.ics` calendar files for follow-up meetings.

**Key Features:**
- Automatically calculates optimal follow-up date (1 week out, or 2 days before earliest action item deadline)
- Includes all action items in event description
- Adds 15-minute advance reminder
- Supports multiple attendees
- Full timezone support (VTIMEZONE)
- Compatible with: Google Calendar, Outlook, Apple Calendar, etc.

**Use Case:**  
After a meeting, click "Add Follow-up Meeting" to create a calendar event for reviewing action items. The system intelligently schedules it before the earliest deadline to ensure timely follow-up.

---

### 2. 📝 Copy Calendar Notes

Generate beautifully formatted notes to paste into existing calendar events.

**What's Included:**
- Meeting summary
- Action items with assignees and deadlines
- Key moments/highlights
- Meeting IQ score
- Duration and participants

**Use Case:**  
Update your original calendar event with comprehensive notes. Perfect for adding context to recurring meetings or team syncs.

---

### 3. 🔗 Shareable Transcript Links

Create secure, time-limited links to share meeting transcripts with stakeholders.

**Features:**
- 30-day expiration (configurable)
- Access tracking (view count)
- No login required
- Privacy-focused (no personal data exposed)
- Includes: Transcript, summary, action items, Meeting IQ score

**Use Case:**  
Share meeting outcomes with team members who couldn't attend, or distribute action items to stakeholders without sending large email attachments.

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     SIDEPANEL UI                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Follow-up   │  │ Copy Notes  │  │ Share Link  │        │
│  │  Meeting    │  │             │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│              CALENDAR-INTEGRATION.JS                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ generateFollowUpICS()     - RFC 5545 .ics format   │   │
│  │ generateCalendarNotes()   - Formatted text          │   │
│  │ createShareableLink()     - Unique ID + 30d expiry  │   │
│  │ scheduleFollowUpReminders() - Smart Reminders API   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────┬──────────────────┬──────────────┬─────────┘
                  │                  │              │
                  ▼                  ▼              ▼
        ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
        │ Download .ics│   │  Clipboard   │  │  IndexedDB   │
        │    File      │   │     API      │  │ (Shared      │
        │              │   │              │  │ Transcripts) │
        └──────────────┘   └──────────────┘  └──────┬───────┘
                                                     │
                                                     ▼
                                              Smart Reminders
                                              (24h before)
```

### Data Flow

1. **User clicks button** → Sidepanel UI
2. **Function called** → calendar-integration.js
3. **Data retrieved** → IndexedDB via storage.js
4. **Processing** → Generate .ics / format notes / create link
5. **Output** → Download file / copy to clipboard / show modal
6. **Integration** → Schedule Smart Reminders (if applicable)

---

## User Guide

### How to Use: Follow-up Meeting

1. **Start and record a meeting** in MeetingMind
2. **Extract action items** (automatic after 10 transcripts)
3. Click **"📅 Add Follow-up Meeting"** button
4. **Download the `.ics` file** (automatically named with meeting title and date)
5. **Import to your calendar**:
   - **Google Calendar**: Open Calendar → Settings → Import & Export → Select file
   - **Outlook**: File → Open & Export → Import/Export → Select file
   - **Apple Calendar**: Double-click .ics file

**Result:**  
✅ Follow-up meeting scheduled at optimal time  
✅ Action items included in event description  
✅ 15-minute advance reminder set  
✅ Smart Reminders automatically scheduled (24h before + day-after)

---

### How to Use: Copy Calendar Notes

1. **Record and summarize a meeting**
2. Click **"📝 Copy Notes for Calendar"**
3. **Paste into calendar event**:
   - Open your calendar event
   - Click "Edit" or "Description"
   - Paste (Ctrl+V / Cmd+V)

**Result:**  
✅ Comprehensive notes in calendar event  
✅ Action items with assignees visible  
✅ Meeting IQ score displayed  
✅ Key moments highlighted

---

### How to Use: Shareable Link

1. **Complete a meeting** (transcript + summary)
2. Click **"🔗 Generate Shareable Link"**
3. **Copy the link** from the modal
4. **Share via**:
   - Email
   - Slack
   - Teams
   - Anywhere!

**Result:**  
✅ Unique link with 30-day expiration  
✅ Anyone can view without login  
✅ Access count tracked  
✅ Privacy-focused (no personal data)

---

## Technical Architecture

### File Structure

```
meeting mind/
├── utils/
│   └── calendar-integration.js    # Core calendar logic (800+ lines)
│       ├── ICS Generation
│       ├── Calendar Notes Formatting
│       ├── Shareable Links
│       └── Smart Reminders Integration
├── utils/
│   └── storage.js                 # Enhanced with sharedTranscripts store
├── background.js                  # Message handlers for GENERATE_ICS, etc.
├── sidepanel/
│   ├── sidepanel.html            # Calendar modal + buttons
│   └── sidepanel.js              # UI logic + toast notifications
└── CALENDAR_INTEGRATION.md       # This document
```

### Key Functions

#### 1. `generateFollowUpICS(meeting, actionItems, options)`

Generates RFC 5545 compliant `.ics` file content.

**Parameters:**
- `meeting` - Meeting object with id, title, startTime, etc.
- `actionItems` - Array of action item objects
- `options` - Optional config (attendees, location)

**Returns:** String (ICS file content)

**Algorithm:**
```javascript
1. Calculate optimal follow-up date:
   - Default: 1 week from meeting
   - If action items have deadlines: 2 days before earliest deadline
2. Format dates to YYYYMMDDTHHMMSS (RFC 5545)
3. Generate VTIMEZONE for user's timezone
4. Create VALARM for 15-minute reminder
5. Escape special characters (;, ,, \n)
6. Generate unique UID
7. Return complete VCALENDAR block
```

**ICS Format:**
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MeetingMind//Calendar Integration//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:1234567890-abc123@meetingmind.app
DTSTART;TZID=America/New_York:20240115T100000
DURATION:PT30M
SUMMARY:Follow-up: Team Planning Meeting
DESCRIPTION:Action items:\n1. Complete Q1 roadmap (Alice)\n2. Review budget (Bob)
LOCATION:Conference Room A
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Follow-up meeting reminder
TRIGGER:-PT15M
END:VALARM
END:VEVENT
END:VCALENDAR
```

---

#### 2. `generateCalendarNotes(meeting, transcripts, summary, actionItems)`

Generates formatted notes for pasting into calendar events.

**Parameters:**
- `meeting` - Meeting object
- `transcripts` - Array of transcript entries
- `summary` - Summary object (text, keyMoments)
- `actionItems` - Array of action items

**Returns:** String (formatted notes)

**Output Format:**
```
📋 Team Planning Meeting
📅 1/8/2024, 10:00:00 AM
⏱️ Duration: 45 minutes

📝 SUMMARY
Discussed Q1 priorities and resource allocation. Agreed on 3 key initiatives.

✅ ACTION ITEMS (3)
1. Complete Q1 roadmap
   👤 Alice | 📅 1/15/2024
2. Review budget proposal
   👤 Bob | 📅 1/12/2024
3. Schedule follow-up with engineering
   👤 Charlie | 📅 Next week

💡 KEY MOMENTS
• Decision: Focus on customer retention
• Agreement: Hire 2 engineers in Q1
• Blocker identified: Waiting on finance approval

🎓 Meeting IQ Score: 87/100

Generated by MeetingMind
```

---

#### 3. `createShareableLink(meeting, transcripts, summary, actionItems, meetingIQReport)`

Creates a shareable link with 30-day expiration.

**Parameters:**
- `meeting` - Meeting object
- `transcripts` - Full transcript array
- `summary` - Summary object
- `actionItems` - Action items array
- `meetingIQReport` - Meeting IQ report object

**Returns:** Object `{ shareId, shareLink, expiryDate, data }`

**Data Structure:**
```javascript
{
  id: "1705334400-abc123xyz-def456",  // Unique ID
  meetingId: "meeting_123",
  title: "Team Planning Meeting",
  date: "2024-01-15T10:00:00Z",
  duration: 45,  // minutes
  
  transcripts: [
    { timestamp: 0, text: "...", speaker: "Alice" },
    // ...
  ],
  
  summary: {
    text: "Meeting summary...",
    keyMoments: ["Decision: ...", "Agreement: ..."]
  },
  
  actionItems: [
    { task: "Complete roadmap", who: "Alice", due: "1/15" }
  ],
  
  meetingIQ: {
    score: 87,
    rating: "Excellent",
    highlights: ["Strong participation", "Clear outcomes"]
  },
  
  createdAt: 1705334400000,
  expiresAt: 1707926400000,  // 30 days later
  accessCount: 0,
  status: "active"
}
```

**Link Format:**  
`https://meetingmind.app/transcript/1705334400-abc123xyz-def456`

---

#### 4. `scheduleFollowUpReminders(followUpDate, meeting, actionItems)`

Integrates with Smart Reminders system to schedule notifications for follow-up meetings.

**Parameters:**
- `followUpDate` - Date object for follow-up meeting
- `meeting` - Original meeting object
- `actionItems` - Action items to review

**Flow:**
```javascript
1. Create synthetic action item for follow-up meeting:
   {
     id: "followup_meeting_123_1705334400",
     task: "Attend follow-up meeting for 'Team Planning Meeting'",
     who: "All attendees",
     due: "1/15/2024",
     isFollowUpMeeting: true
   }

2. Save to IndexedDB (actionItems store)

3. Call scheduleRemindersForActionItem():
   - 24-hour advance reminder
   - Day-after reminder (if applicable)

4. Reminders respect DND hours (10 PM - 8 AM)

5. Return action item object
```

---

### IndexedDB Schema

#### New Store: `sharedTranscripts`

```javascript
{
  keyPath: 'id',
  indexes: [
    { name: 'meetingId', unique: false },
    { name: 'status', unique: false },
    { name: 'expiresAt', unique: false },
    { name: 'createdAt', unique: false }
  ]
}
```

**Indexes:**
- `meetingId` - Query all shares for a meeting
- `status` - Filter by active/expired
- `expiresAt` - Cleanup expired links
- `createdAt` - Sort by creation date

**Cleanup:**  
`cleanupExpiredShares()` runs periodically to mark expired links

---

## Integration with Smart Reminders

### How It Works

When you generate a follow-up meeting `.ics` file, MeetingMind automatically:

1. **Creates a follow-up action item** in the database
2. **Schedules reminders** using the Smart Reminders system:
   - **24 hours before** the follow-up meeting (if > 24h away)
   - **Day after** if you miss it (optional)
3. **Respects Do Not Disturb** hours (10 PM - 8 AM)
4. **Includes calendar event info** in notification

### Example Flow

```
User generates .ics file
  ↓
Follow-up meeting: Tuesday, Jan 15 @ 10:00 AM
  ↓
Smart Reminders schedules:
  ✅ Reminder #1: Monday, Jan 14 @ 10:00 AM (24h before)
     "Follow-up meeting tomorrow: Review Q1 roadmap action items"
  
  ✅ Reminder #2 (if needed): Wednesday, Jan 16 @ 10:00 AM (day after)
     "Follow-up meeting was yesterday. Did it happen?"
```

### Benefits

- **Never miss a follow-up** - Automatic reminders ensure you stay on track
- **Syncs with calendar** - .ics file + reminders = complete integration
- **Smart scheduling** - Respects your DND hours and meeting schedule
- **Actionable** - Click notification → opens side panel with action items

---

## Privacy & Security

### Shareable Links

**What's Shared:**
✅ Transcript text (anonymized speakers)  
✅ Meeting summary and key moments  
✅ Action items (tasks + assignees)  
✅ Meeting IQ score and highlights  

**What's NOT Shared:**
❌ Attendee email addresses  
❌ Calendar event details  
❌ Meeting platform (Zoom/Meet/Teams)  
❌ Personal information  
❌ Audio recordings  

### Data Storage

- **All data stored locally** in IndexedDB (your browser)
- **No cloud servers** - everything is client-side
- **30-day auto-expiration** for shareable links
- **No tracking** - we don't collect analytics on link views

### Access Control

- **Link-based access** - Anyone with the link can view
- **No authentication** required (by design)
- **Access count tracked** locally
- **Manual deletion** available (coming soon)

### Recommendations

1. **Only share links with trusted parties** (no password protection)
2. **Sanitize sensitive info** before sharing (edit action items if needed)
3. **Check expiry date** before sharing
4. **Revoke access** by deleting the shared transcript (future feature)

---

## API Reference

### Core Functions

#### `generateFollowUpICS(meeting, actionItems, options = {})`

Generate RFC 5545 compliant .ics file.

**Parameters:**
- `meeting` (Object) - Meeting data
  - `id` (string) - Meeting ID
  - `title` (string) - Meeting title
  - `startTime` (string) - ISO 8601 timestamp
  - `endTime` (string) - ISO 8601 timestamp
- `actionItems` (Array) - Action items
  - `task` (string) - Task description
  - `who` (string) - Assignee
  - `due` (string) - Deadline (flexible format)
- `options` (Object) - Optional settings
  - `attendees` (Array<string>) - Email addresses
  - `location` (string) - Meeting location

**Returns:** `string` - ICS file content

**Example:**
```javascript
const icsContent = generateFollowUpICS(
  { id: '123', title: 'Planning', startTime: '2024-01-08T10:00:00Z' },
  [{ task: 'Complete roadmap', who: 'Alice', due: '1/15' }],
  { attendees: ['alice@example.com'], location: 'Conf Room A' }
);
```

---

#### `generateCalendarNotes(meeting, transcripts, summary, actionItems)`

Generate formatted notes for calendar events.

**Parameters:**
- `meeting` (Object) - Meeting data
- `transcripts` (Array) - Transcript entries
- `summary` (Object) - Summary with text and keyMoments
- `actionItems` (Array) - Action items

**Returns:** `string` - Formatted notes

**Example:**
```javascript
const notes = generateCalendarNotes(
  meeting,
  transcripts,
  { text: 'Summary...', keyMoments: ['Decision: ...'] },
  actionItems
);
await copyToClipboard(notes);
```

---

#### `createShareableLink(meeting, transcripts, summary, actionItems, meetingIQReport)`

Create shareable link with 30-day expiration.

**Parameters:**
- `meeting` (Object) - Meeting data
- `transcripts` (Array) - Full transcript
- `summary` (Object) - Summary
- `actionItems` (Array) - Action items
- `meetingIQReport` (Object) - Meeting IQ data

**Returns:** `Promise<Object>`
```javascript
{
  shareId: string,
  shareLink: string,
  expiryDate: string,
  data: Object  // Full shareable data package
}
```

**Example:**
```javascript
const { shareLink, expiryDate } = await createShareableLink(
  meeting,
  transcripts,
  summary,
  actionItems,
  meetingIQReport
);
console.log(`Share: ${shareLink} (expires ${expiryDate})`);
```

---

#### `scheduleFollowUpReminders(followUpDate, meeting, actionItems)`

Schedule Smart Reminders for follow-up meeting.

**Parameters:**
- `followUpDate` (Date) - Follow-up meeting date
- `meeting` (Object) - Original meeting
- `actionItems` (Array) - Action items to review

**Returns:** `Promise<Object>` - Follow-up action item

**Example:**
```javascript
const followUpDate = new Date('2024-01-15T10:00:00');
const followUpItem = await scheduleFollowUpReminders(
  followUpDate,
  meeting,
  actionItems
);
console.log('Reminders scheduled:', followUpItem.id);
```

---

### Utility Functions

#### `downloadICSFile(icsContent, filename = 'follow-up-meeting.ics')`

Download .ics file to user's device.

#### `copyToClipboard(text)`

Copy text to clipboard (with fallback for older browsers).

**Returns:** `Promise<boolean>` - Success status

#### `generateICSFilename(meeting)`

Generate filename for .ics file based on meeting title and date.

**Returns:** `string` - e.g., `"followup-planning-meeting-2024-01-15.ics"`

#### `parseAttendees(attendeesString)`

Parse comma/semicolon-separated email addresses.

**Returns:** `Array<string>` - Valid email addresses

---

## Troubleshooting

### Issue: .ics file won't import into calendar

**Possible Causes:**
1. **Invalid email addresses** in attendees field
2. **Special characters** in meeting title
3. **Timezone not supported** by calendar app

**Solutions:**
- ✅ Remove attendees and try again
- ✅ Simplify meeting title (remove emojis)
- ✅ Try a different calendar app (e.g., Google Calendar)
- ✅ Check browser console for errors

---

### Issue: Notes copied but formatting lost

**Possible Causes:**
1. **Calendar app doesn't support** rich text
2. **Pasted into wrong field** (title instead of description)

**Solutions:**
- ✅ Look for "Description" or "Notes" field in calendar
- ✅ Try pasting as plain text (Ctrl+Shift+V)
- ✅ Use a different calendar app

---

### Issue: Shareable link shows "Expired"

**Possible Causes:**
1. **More than 30 days** since creation
2. **Link was manually deleted**

**Solutions:**
- ✅ Generate a new link
- ✅ Check creation date in modal
- ✅ Use shorter expiration for sensitive content (coming soon)

---

### Issue: Smart Reminders not scheduling

**Possible Causes:**
1. **Follow-up date in the past**
2. **No action items** to remind about
3. **DND hours** (reminders deferred to 8 AM)

**Solutions:**
- ✅ Check follow-up date is in the future
- ✅ Ensure action items exist
- ✅ Check reminder logs in console

---

### Issue: Calendar buttons disabled

**Possible Causes:**
1. **No meeting recorded** yet
2. **No transcripts** generated
3. **Recording stopped** prematurely

**Solutions:**
- ✅ Start recording a meeting
- ✅ Speak for at least 30 seconds
- ✅ Wait for transcripts to appear in side panel

---

## Advanced Usage

### Custom Follow-up Date

Currently, follow-up dates are automatically calculated. For custom dates:

**Workaround:**
1. Generate the .ics file
2. Open in text editor
3. Modify `DTSTART` line (format: YYYYMMDDTHHMMSS)
4. Import modified .ics file

**Future Feature:** Date picker in modal (coming soon)

---

### Batch Export

Export multiple meetings at once:

**Workaround:**
```javascript
// Run in browser console
const meetings = await storageDB.getAllMeetings();
for (const meeting of meetings) {
  const actionItems = await storageDB.getActionItemsByMeetingId(meeting.id);
  const ics = generateFollowUpICS(meeting, actionItems);
  const filename = generateICSFilename(meeting);
  downloadICSFile(ics, filename);
}
```

---

### Custom Expiration

Change shareable link expiration from 30 days:

**Modify in code:**
```javascript
// calendar-integration.js, line ~730
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 30);  // Change 30 to desired days
```

---

## Performance & Limits

### File Sizes

- **.ics files**: Typically 1-5 KB (very small)
- **Shareable links**: 10-100 KB per meeting (stored locally)
- **Calendar notes**: 5-20 KB (plain text)

### Limits

- **Max attendees**: None (but large lists may slow down calendar import)
- **Max action items**: None
- **Max shareable links**: Limited by IndexedDB quota (~50 MB typical)

### Optimization Tips

1. **Clean up old shares** regularly (use `cleanupExpiredShares()`)
2. **Don't create duplicate links** for the same meeting
3. **Use calendar notes** instead of links when possible (lighter weight)

---

## Future Enhancements

### Planned Features

- 🔄 **Recurring follow-ups** (weekly/monthly)
- 📅 **Custom date picker** for follow-up meetings
- 🔐 **Password-protected links** (optional)
- 🗑️ **Manual link revocation** (delete before expiry)
- 📊 **Link analytics** (view count, last accessed)
- 🌐 **Multi-language support** for calendar notes
- ✉️ **Email integration** (send links via Gmail)

### Upcoming Integrations

- **Slack** - Share links directly to channels
- **Teams** - Post meeting summaries
- **Notion** - Export to Notion database
- **Jira** - Create tickets from action items

---

## FAQ

**Q: Can I share links outside my organization?**  
A: Yes, links work for anyone. Be mindful of sensitive content.

**Q: Do shareable links work offline?**  
A: No, links require internet. Use "Export JSON" for offline access.

**Q: Can I extend a link's expiration?**  
A: Not yet. Regenerate the link to reset the 30-day timer.

**Q: Are .ics files compatible with all calendars?**  
A: Yes, RFC 5545 is the industry standard. Works with Google Calendar, Outlook, Apple Calendar, etc.

**Q: Can I customize the follow-up meeting duration?**  
A: Default is 30 minutes. Edit the .ics file (modify `DURATION:PT30M` to `DURATION:PT60M` for 1 hour).

**Q: What happens if I delete a meeting?**  
A: Shareable links remain active. Delete shared transcripts separately (coming soon).

**Q: Can I schedule multiple follow-ups?**  
A: Yes, generate a new .ics file for each follow-up.

---

## Support

For issues or feature requests, please:
1. Check [Troubleshooting](#troubleshooting) section
2. Review browser console for errors
3. Open an issue on GitHub (link TBD)

---

## Changelog

### Version 1.0 (January 2024)
- ✅ Initial release
- ✅ .ics file generation (RFC 5545 compliant)
- ✅ Calendar notes formatting
- ✅ Shareable links with 30-day expiry
- ✅ Smart Reminders integration
- ✅ Toast notifications
- ✅ Modal UI

---

**Built with ❤️ by the MeetingMind team**

