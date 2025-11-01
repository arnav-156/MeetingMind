# 📅 Calendar Integration - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### What is Calendar Integration?

Turn your MeetingMind transcripts into actionable calendar items:
- **📅 Follow-up meetings** → Download .ics files for your calendar
- **📝 Calendar notes** → Copy formatted notes to paste into events
- **🔗 Shareable links** → Share meeting transcripts with anyone (30-day expiry)

---

## 🎯 Quick Use Cases

### Use Case 1: Schedule a Follow-up Meeting
**Scenario:** You just finished a planning meeting with 5 action items. You need to review them in 1 week.

**Steps:**
1. Record meeting in MeetingMind ✅
2. Click **"📅 Add Follow-up Meeting"** button
3. Download the `.ics` file (e.g., `followup-planning-meeting-2024-01-15.ics`)
4. Import to your calendar:
   - **Google Calendar:** Settings → Import & Export → Select file
   - **Outlook:** File → Import/Export → Select file
   - **Apple Calendar:** Double-click .ics file

**Result:**
- ✅ Follow-up meeting scheduled at optimal time
- ✅ All action items in event description
- ✅ 15-minute reminder set
- ✅ Smart Reminders automatically scheduled (24h before)

---

### Use Case 2: Add Notes to Existing Event
**Scenario:** You have a recurring 1:1 meeting. You want to add today's notes to the calendar event.

**Steps:**
1. Record your 1:1 in MeetingMind ✅
2. Click **"📝 Copy Notes for Calendar"** button
3. Open your calendar event → Click "Edit"
4. Paste (Ctrl+V / Cmd+V) into the "Description" field
5. Save

**Result:**
- ✅ Comprehensive notes in calendar
- ✅ Action items visible to both parties
- ✅ Meeting IQ score shown
- ✅ Easy reference for next 1:1

---

### Use Case 3: Share Meeting Summary
**Scenario:** A stakeholder couldn't attend the meeting. They need to see what was discussed and decided.

**Steps:**
1. Complete your meeting in MeetingMind ✅
2. Click **"🔗 Generate Shareable Link"** button
3. Copy the link from the modal
4. Send via email/Slack/Teams

**Result:**
- ✅ Stakeholder can view full transcript
- ✅ Summary and action items included
- ✅ Meeting IQ score visible
- ✅ Link expires in 30 days (automatic cleanup)

---

## 📋 Button Reference

### Calendar Integration Section (Side Panel)

```
┌─────────────────────────────────────────────┐
│  📅 Calendar Integration                    │
├─────────────────────────────────────────────┤
│  [📅 Add Follow-up Meeting]                │  ← Downloads .ics file
│  [📝 Copy Notes for Calendar]              │  ← Copies to clipboard
│  [🔗 Generate Shareable Link]              │  ← Creates unique link
└─────────────────────────────────────────────┘
```

**Button States:**
- 🔒 **Disabled** (gray) - No meeting data yet
- ✅ **Enabled** (blue) - Ready to use (after first transcript)

---

## ⚡ Pro Tips

### 1. Optimal Follow-up Timing
The system automatically calculates the best follow-up date:
- **Default:** 1 week from original meeting
- **Smart:** If action items have deadlines, schedules 2 days before earliest deadline

**Example:**
```
Meeting: Monday, Jan 8
Action Item: "Complete roadmap" - Due Friday, Jan 12
→ Follow-up scheduled: Wednesday, Jan 10 (2 days before deadline)
```

### 2. Smart Reminders Integration
When you generate a follow-up .ics file, Smart Reminders automatically:
- ✅ Creates a follow-up action item
- ✅ Schedules 24-hour advance reminder
- ✅ Respects Do Not Disturb hours (10 PM - 8 AM)
- ✅ Sends notification you can click to open side panel

### 3. Privacy Best Practices
Shareable links include:
- ✅ Transcript text
- ✅ Summary and action items
- ✅ Meeting IQ score
- ❌ **NOT** attendee emails
- ❌ **NOT** personal info

**Recommendation:** Only share links with trusted parties

### 4. Calendar App Compatibility
.ics files work with:
- ✅ Google Calendar
- ✅ Microsoft Outlook
- ✅ Apple Calendar
- ✅ Any RFC 5545 compliant app

### 5. Copy Notes Format
Calendar notes include emoji for visual appeal:
```
📋 Team Planning Meeting
📅 1/8/2024, 10:00 AM
⏱️ Duration: 45 minutes

📝 SUMMARY
...

✅ ACTION ITEMS (3)
1. Complete Q1 roadmap
   👤 Alice | 📅 1/15/2024
...

💡 KEY MOMENTS
• Decision: Focus on customer retention
...

🎓 Meeting IQ Score: 87/100
```

---

## 🔍 Troubleshooting

### Issue: Buttons are disabled
**Solution:** Record a meeting and speak for at least 30 seconds. Buttons enable after first transcript.

### Issue: .ics file won't import
**Solution:** Try a different calendar app (e.g., Google Calendar). Check for special characters in meeting title.

### Issue: Notes formatting lost when pasted
**Solution:** Make sure you're pasting into the "Description" or "Notes" field, not the title.

### Issue: Shareable link shows "Expired"
**Solution:** Links expire after 30 days. Generate a new link.

### Issue: No Smart Reminders scheduled
**Solution:** Make sure follow-up date is in the future and action items exist.

---

## 🎓 Examples

### Example 1: Planning Meeting
**Meeting:** Q1 Planning Session  
**Duration:** 45 minutes  
**Action Items:** 5 items, earliest due 1/15  
**Follow-up:** Scheduled for 1/13 at 10:00 AM (2 days before deadline)  
**Smart Reminders:** 1/12 at 10:00 AM (24h advance notice)

### Example 2: Brainstorming Session
**Meeting:** Product Ideas Brainstorm  
**Duration:** 60 minutes  
**Action Items:** 3 items, no deadlines  
**Follow-up:** Scheduled for 1 week out at 10:00 AM  
**Smart Reminders:** Day before at 10:00 AM

### Example 3: Client Meeting
**Meeting:** Acme Corp Quarterly Review  
**Duration:** 30 minutes  
**Action Items:** 2 items with client names  
**Shareable Link:** Generated and sent to client POC  
**Privacy:** Client names visible, internal notes hidden

---

## 📱 Keyboard Shortcuts

While calendar integration doesn't have dedicated shortcuts, you can:
- **Ctrl/Cmd + R** - Start/stop recording
- **Ctrl/Cmd + S** - Generate summary
- Then use mouse to click calendar buttons

---

## 🔗 Related Features

### Works Great With
- **Smart Reminders** - Auto-schedules notifications for follow-ups
- **Meeting IQ** - Shows meeting quality in calendar notes
- **Action Items** - Included in .ics files and shareable links
- **Export** - Combine with JSON export for offline backup

---

## 📚 Learn More

- **Full Documentation:** [CALENDAR_INTEGRATION.md](./CALENDAR_INTEGRATION.md)
- **Technical Details:** [CALENDAR_INTEGRATION_SUMMARY.md](./CALENDAR_INTEGRATION_SUMMARY.md)
- **Smart Reminders:** [SMART_REMINDERS.md](./SMART_REMINDERS.md)
- **Getting Started:** [START_HERE.md](./START_HERE.md)

---

## ✅ Quick Checklist

Before using Calendar Integration:
- [ ] MeetingMind extension installed
- [ ] Meeting recorded with transcripts
- [ ] Action items extracted (optional but recommended)
- [ ] Summary generated (optional but enhances output)

After using Calendar Integration:
- [ ] .ics file imported to calendar (if generated)
- [ ] Notes pasted into event (if copied)
- [ ] Shareable link sent (if generated)
- [ ] Smart Reminders notification received (if applicable)

---

**Need Help?** Check the [Troubleshooting section](#troubleshooting) or full documentation.

**Ready to Go!** Click a calendar button and start organizing your meetings better. 🚀

