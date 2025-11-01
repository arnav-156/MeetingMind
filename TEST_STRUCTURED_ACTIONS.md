# 🧪 Quick Test: Structured Action Items & Email Draft

## Test the Complete Pipeline

**Pipeline**: `Live Audio → Transcription → Summary → Structured Action Items → Draft Email`

---

## 🎯 Test 1: Structured Action Item Extraction

### Step 1: Start Recording

1. Open Chrome and navigate to `meet.google.com` or `zoom.us`
2. Open MeetingMind side panel
3. Click **"🎙️ Start Recording"**

### Step 2: Speak Test Phrases

Say these phrases clearly (or have a teammate say them):

```
"Alex, can you follow up with the marketing team about the Q4 campaign? 
We need this done by EOD Friday.

Sarah will update the product roadmap and share it with stakeholders.

John, please send the final specs to the client by next Monday.

The team needs to review the budget proposal before next week's meeting.

I'll reach out to the vendors about pricing by tomorrow afternoon."
```

### Step 3: Trigger Extraction

**Option A (Automatic)**: Wait for 10+ transcript entries (auto-triggers)

**Option B (Manual)**: Click the **"📝"** button in the header

### Step 4: Verify Action Items

Check the **"✅ Action Items"** section. You should see:

```
✅ Follow up with marketing team about Q4 campaign.
   👤 Alex  📅 EOD Friday

✅ Update the product roadmap and share with stakeholders.
   👤 Sarah

✅ Send the final specs to the client.
   👤 John  📅 Next Monday

✅ Review the budget proposal.
   👥 Team  📅 Before next week's meeting

✅ Reach out to vendors about pricing.
   👤 [Your Name]  📅 Tomorrow afternoon
```

### Expected Structure

Each action item should have:
- ✅ Clear task description (capitalized, ends with period)
- 👤 Assignee name (or "Team" / "Unassigned")
- 📅 Due date (if mentioned) with emoji badge

---

## 📧 Test 2: Email Draft Generation

### Step 1: Generate Summary (if not done yet)

Click **"📝"** button to create a meeting summary

### Step 2: Generate Email

1. Scroll to **"📤 Export & Share"** section
2. Click **"📧 Generate Email"** button
3. Wait 2-3 seconds

### Step 3: Verify Email Modal

A modal should appear showing:

**Subject**: `Follow-up: [Meeting Title]`

**Body** (example):
```
Hi Team,

Thank you for attending "[Meeting Name]" on October 29, 2025.

KEY HIGHLIGHTS:
• Discussed Q4 marketing campaign timeline and deliverables
• Reviewed product roadmap updates and stakeholder communication plan
• Addressed client specifications and vendor pricing discussions

ACTION ITEMS:
  • Follow up with marketing team about Q4 campaign. - Alex (Due: EOD Friday)
  • Update the product roadmap and share with stakeholders. - Sarah
  • Send the final specs to the client. - John (Due: Next Monday)
  • Review the budget proposal. - Team (Due: Before next week's meeting)
  • Reach out to vendors about pricing. - [Your Name] (Due: Tomorrow afternoon)

Please reach out if you have any questions or need clarification on your action items.

Best regards
```

### Step 4: Verify Clipboard

1. Email should be **auto-copied to clipboard**
2. Paste into a text editor (`Ctrl+V`) to verify
3. Should include both Subject and Body

### Step 5: Test Modal Actions

- Click **"📋 Copy Again"** → Should copy to clipboard again
- Click **"Close"** → Modal should disappear with fade animation
- Press **ESC** key → Should also close modal

---

## 🔍 Test 3: Edge Cases

### Test Empty/Unclear Assignments

Speak phrases without clear assignees:

```
"Someone should update the documentation.
We need to schedule a follow-up meeting.
The slides need to be finalized."
```

**Expected**: Action items with `👤 Unassigned` or `👥 Team`

### Test Vague Deadlines

```
"Alex should finish the report soon.
Sarah will contact the client when possible."
```

**Expected**: Due date shows "Not specified"

### Test Team Actions

```
"The team needs to brainstorm ideas for the new feature.
Everyone should review the proposal before the next sprint."
```

**Expected**: `👥 Team` as assignee

---

## 🐛 Troubleshooting

### Issue: Action Items Not Appearing

**Check**:
1. Chrome AI indicator (top right) - should be 🟢 Active
2. Console errors: `F12` → Console tab
3. Transcript has content: Check "📝 Live Transcript" section

**Fix**:
- Click "📝" button manually to trigger extraction
- Reload extension: `chrome://extensions` → MeetingMind → Reload

### Issue: Email Generation Fails

**Check**:
1. At least 1 summary exists
2. At least 1 action item extracted
3. Chrome AI available

**Fix**:
- Click "📝" to generate summary first
- Wait for action items to extract
- Try email generation again

### Issue: Wrong Format

**Check**:
- Old action items (before update) may show legacy format
- New items should have `who`, `task`, `due` fields

**Fix**:
- Clear old meetings: Stop recording and start fresh
- Hard refresh: `Ctrl+Shift+R`

---

## ✅ Success Criteria

### Action Item Extraction: PASS

- ✅ Structured format: `{ who, task, due }`
- ✅ Assignee extracted correctly
- ✅ Task descriptions clear and actionable
- ✅ Due dates captured when mentioned
- ✅ UI displays with emoji badges
- ✅ Checkbox completion works

### Email Generation: PASS

- ✅ Professional tone and structure
- ✅ Includes meeting highlights
- ✅ Lists all action items with assignees and due dates
- ✅ Auto-copies to clipboard
- ✅ Preview modal displays correctly
- ✅ "Copy Again" button works
- ✅ Close/ESC dismisses modal

### Complete Pipeline: PASS

- ✅ Audio → Transcription: Real-time display
- ✅ Transcription → Summary: Click "📝" or auto-generates
- ✅ Transcription → Action Items: Auto-extracts or manual
- ✅ Action Items → Email: One-click generation
- ✅ Email → Clipboard: Instant copy

---

## 📊 Performance Benchmarks

| Operation | Expected Time | Acceptable Range |
|-----------|--------------|------------------|
| Action item extraction (500 words) | 1-2 sec | < 5 sec |
| Email generation | 2-3 sec | < 10 sec |
| Modal display | Instant | < 0.5 sec |
| Clipboard copy | Instant | < 0.2 sec |

---

## 🎉 What to Look For

### Visual Quality

- **Action Items**:
  - Clean card layout with hover effects
  - Clear typography and spacing
  - Emoji badges for assignees (👤/👥) and due dates (📅)
  - Urgent dates highlighted (red badge for "today"/"EOD")

- **Email Modal**:
  - Dark overlay (70% opacity black)
  - White modal with rounded corners
  - Subject in highlighted box
  - Body in monospace font for readability
  - Action buttons at bottom (blue + gray)

### Functional Quality

- **Extraction Accuracy**: 85-95% for clear speech
- **Email Tone**: Professional but friendly
- **Format Consistency**: Same structure every time
- **Error Handling**: Graceful fallbacks if AI unavailable

---

## 🚀 Next Steps After Testing

### If Everything Works ✅

1. **Use in real meetings** - Test with actual meeting audio
2. **Customize if needed** - Edit email templates in `ai-manager.js`
3. **Share with team** - Let others test the feature
4. **Collect feedback** - Note any issues or requests

### If Issues Found ❌

1. **Document the problem** - Note exact error message
2. **Check console logs** - `F12` → Console for details
3. **Try simple fix** - Reload extension, restart Chrome
4. **Report issue** - Create GitHub issue or share logs

---

## 📝 Test Checklist

Print this and check off as you test:

```
□ Start recording successfully
□ Speak test phrases with clear assignees
□ Action items auto-extract after 10 transcripts
□ Action items show structured format (who, task, due)
□ UI displays emoji badges correctly
□ Checkboxes mark items as complete
□ Click "📧 Generate Email" button
□ Email modal appears with subject + body
□ Email auto-copies to clipboard
□ Can paste email into text editor
□ "Copy Again" button works
□ Close button dismisses modal
□ ESC key also closes modal
□ Email has professional tone
□ All action items included in email
□ Due dates shown in email
```

---

**Test Duration**: 5-10 minutes  
**Difficulty**: Easy  
**Prerequisites**: Chrome AI enabled, microphone access

**Ready to test?** Start recording and speak the test phrases! 🎙️
