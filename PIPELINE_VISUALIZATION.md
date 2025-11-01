# 🎯 Structured Action Items Pipeline - Visual Guide

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MEETINGMIND PIPELINE                             │
│              Live Audio → Summary → Action Items → Draft Email          │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────┐
│   STEP 1   │  🎙️ LIVE AUDIO CAPTURE
└────────────┘
      │
      │  Tab Audio Stream (MediaRecorder)
      │  Codec: audio/webm
      ▼
┌─────────────────────────────────────┐
│  Chrome Tab Audio                    │
│  ┌─────────────────────────────────┤
│  │ "Alex, can you follow up..."    │
│  │ "Sarah will update the..."       │
│  │ "Team needs to review by..."     │
│  └─────────────────────────────────┤
└─────────────────────────────────────┘
      │
      │  Audio chunks → Speech Recognition
      │  (Web Speech API + Chrome AI)
      ▼
┌────────────┐
│   STEP 2   │  📝 REAL-TIME TRANSCRIPTION
└────────────┘
      │
      │  Text output with timestamps
      │  Speaker detection (pause-based)
      ▼
┌─────────────────────────────────────┐
│  Transcript Buffer                   │
│  ┌─────────────────────────────────┤
│  │ [10:15] Speaker 1: Alex, can    │
│  │         you follow up with...    │
│  │ [10:16] Speaker 2: Sure, I'll   │
│  │         handle that by Friday    │
│  │ [10:17] Speaker 1: Sarah will   │
│  │         update the roadmap       │
│  └─────────────────────────────────┤
└─────────────────────────────────────┘
      │
      ├─────────────┬─────────────────┐
      │             │                 │
      ▼             ▼                 ▼
      
┌────────────┐  ┌────────────┐  ┌────────────┐
│   STEP 3A  │  │   STEP 3B  │  │   STEP 3C  │
└────────────┘  └────────────┘  └────────────┘
   SUMMARY      ACTION ITEMS    ANALYTICS
   
      │             │                 │
      │             │                 │
      ▼             ▼                 ▼
      
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ AI SUMMARIZER │ │ STRUCTURED    │ │ REAL-TIME     │
│               │ │ EXTRACTOR     │ │ METRICS       │
│ Prompt API    │ │               │ │               │
│ Creates:      │ │ Prompt API    │ │ Word count    │
│ • Key points  │ │ JSON Output:  │ │ Speaker time  │
│ • Highlights  │ │               │ │ Participation │
│ • Decisions   │ │ {             │ │ Word cloud    │
└───────────────┘ │   "who": "x", │ └───────────────┘
                  │   "task": "y",│
                  │   "due": "z"  │
                  │ }             │
                  └───────────────┘
                        │
                        │ STRUCTURED OUTPUT
                        │ JSON Array
                        ▼
┌──────────────────────────────────────────────┐
│         STRUCTURED ACTION ITEMS              │
│  ┌──────────────────────────────────────┐   │
│  │ [                                     │   │
│  │   {                                   │   │
│  │     "id": "1730123456789_0",         │   │
│  │     "who": "Alex",                   │   │
│  │     "task": "Follow up with...",     │   │
│  │     "due": "EOD Friday",             │   │
│  │     "status": "pending"              │   │
│  │   },                                 │   │
│  │   {                                   │   │
│  │     "who": "Sarah",                  │   │
│  │     "task": "Update roadmap.",       │   │
│  │     "due": "Not specified",          │   │
│  │     "status": "pending"              │   │
│  │   },                                 │   │
│  │   {                                   │   │
│  │     "who": "Team",                   │   │
│  │     "task": "Review proposal.",      │   │
│  │     "due": "Next Monday",            │   │
│  │     "status": "pending"              │   │
│  │   }                                  │   │
│  │ ]                                     │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
      │
      │ Saved to IndexedDB
      │ Displayed in UI with badges
      ▼
┌────────────┐
│   STEP 4   │  🎨 UI RENDERING
└────────────┘
      │
      │  Render action items with:
      │  • Checkbox (✓ when complete)
      │  • Task description (bold)
      │  • 👤 Assignee badge
      │  • 📅 Due date badge (red if urgent)
      ▼
┌─────────────────────────────────────────────┐
│         USER INTERFACE                       │
│  ┌─────────────────────────────────────┐   │
│  │ ✅ Action Items                (3)   │   │
│  ├─────────────────────────────────────┤   │
│  │                                      │   │
│  │ ☐ Follow up with marketing team...  │   │
│  │    👤 Alex  📅 EOD Friday           │   │
│  │                                      │   │
│  │ ☐ Update the roadmap.               │   │
│  │    👤 Sarah                          │   │
│  │                                      │   │
│  │ ☐ Review proposal.                  │   │
│  │    👥 Team  📅 Next Monday          │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
      │
      │ User clicks "📧 Generate Email"
      ▼
┌────────────┐
│   STEP 5   │  📧 EMAIL GENERATION
└────────────┘
      │
      │  Combine:
      │  • Meeting summary
      │  • Structured action items
      │  • Professional template
      ▼
┌─────────────────────────────────────────────┐
│  AI EMAIL GENERATOR                          │
│  ┌──────────────────────────────────────┐   │
│  │ Prompt:                               │   │
│  │ "Create professional follow-up        │   │
│  │  email with:                          │   │
│  │  - Meeting highlights                 │   │
│  │  - All action items with WHO + DUE    │   │
│  │  - Friendly closing"                  │   │
│  └──────────────────────────────────────┘   │
│              │                               │
│              │ Chrome Prompt API             │
│              ▼                               │
│  ┌──────────────────────────────────────┐   │
│  │ Generated Email:                      │   │
│  │                                       │   │
│  │ Subject: Follow-up: Q4 Planning      │   │
│  │                                       │   │
│  │ Hi Team,                              │   │
│  │                                       │   │
│  │ Thank you for attending "Q4          │   │
│  │ Planning" on October 29, 2025.       │   │
│  │                                       │   │
│  │ KEY HIGHLIGHTS:                       │   │
│  │ • Discussed marketing campaign...     │   │
│  │ • Reviewed product roadmap...         │   │
│  │                                       │   │
│  │ ACTION ITEMS:                         │   │
│  │  • Follow up with marketing... -     │   │
│  │    Alex (Due: EOD Friday)            │   │
│  │  • Update roadmap. - Sarah           │   │
│  │  • Review proposal. - Team           │   │
│  │    (Due: Next Monday)                │   │
│  │                                       │   │
│  │ Best regards                          │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
      │
      │  Auto-copy to clipboard
      │  Show preview modal
      ▼
┌────────────┐
│   STEP 6   │  📋 CLIPBOARD & PREVIEW
└────────────┘
      │
      │  User sees modal with:
      │  • Subject line
      │  • Full email body
      │  • Copy Again button
      ▼
┌──────────────────────────────────────────────┐
│         EMAIL PREVIEW MODAL                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ 📧 Follow-up Email Draft        ✕ ┃   │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫   │
│  ┃                                     ┃   │
│  ┃ SUBJECT:                            ┃   │
│  ┃ Follow-up: Q4 Planning              ┃   │
│  ┃                                     ┃   │
│  ┃ BODY:                               ┃   │
│  ┃ Hi Team,                            ┃   │
│  ┃                                     ┃   │
│  ┃ Thank you for attending...          ┃   │
│  ┃ [Full email content]                ┃   │
│  ┃                                     ┃   │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫   │
│  ┃ [📋 Copy Again]  [Close]           ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
└──────────────────────────────────────────────┘
      │
      │  User pastes into Gmail/Outlook
      │  Send to meeting attendees
      ▼
┌────────────┐
│   STEP 7   │  ✅ COMPLETE
└────────────┘

     🎉 Meeting documented with:
     • Full transcript
     • AI summary
     • Structured action items
     • Professional follow-up email
```

---

## 🔄 Automatic Triggers

```
EVENT                       → TRIGGER                    → RESULT
──────────────────────────────────────────────────────────────────────
New transcript entry        → Every 10 entries           → Extract actions
5 minutes elapsed           → Auto-timer                 → Generate summary
User clicks "📝"            → Manual trigger             → Summary + actions
User clicks "📧"            → Manual trigger             → Generate email
Recording stops             → Final summary              → All extractions
```

---

## 🗄️ Data Storage

```
IndexedDB (meetingmind_db)
│
├── meetings
│   ├── id: "meet_1730123456789"
│   ├── title: "Q4 Planning"
│   ├── platform: "Google Meet"
│   ├── startTime: 1730123456789
│   └── status: "completed"
│
├── transcripts
│   ├── [0] { meetingId, speaker: "Speaker 1", text: "...", timestamp }
│   ├── [1] { meetingId, speaker: "Speaker 2", text: "...", timestamp }
│   └── ...
│
├── summaries
│   ├── [0] { meetingId, text: "Key points...", timestamp }
│   └── ...
│
└── actionItems
    ├── [0] { meetingId, who: "Alex", task: "...", due: "...", status: "pending" }
    ├── [1] { meetingId, who: "Sarah", task: "...", due: "...", status: "pending" }
    └── ...
```

---

## 🎯 Key Innovation: Structured Output

### Before (Old System)

```javascript
// Simple text extraction
[
  "Follow up with marketing - Unassigned",
  "Update roadmap",
  "Send specs to client"
]
```

**Problems:**
- No clear assignee
- No due dates
- Inconsistent format
- Hard to parse programmatically

### After (New System)

```javascript
// Structured JSON objects
[
  {
    "who": "Alex",
    "task": "Follow up with marketing team.",
    "due": "EOD Friday"
  },
  {
    "who": "Sarah",
    "task": "Update roadmap.",
    "due": "Not specified"
  },
  {
    "who": "John",
    "task": "Send specs to client.",
    "due": "Next Monday"
  }
]
```

**Benefits:**
✅ Clear ownership
✅ Deadline tracking
✅ Consistent format
✅ Machine-readable
✅ UI-friendly display
✅ Export-ready

---

## 🧠 AI Processing Details

### Action Item Extraction Prompt

```
INPUT: Transcript text (500-1000 words)

PROMPT STRUCTURE:
┌──────────────────────────────────────┐
│ System: "You are an expert at        │
│         extracting action items"     │
│                                      │
│ Task: "Extract ALL action items as   │
│        JSON array"                   │
│                                      │
│ Format: [{ who, task, due }]         │
│                                      │
│ Rules:                               │
│ • Look for assignments               │
│ • Extract WHO (name or team)         │
│ • Extract TASK (actionable)          │
│ • Extract DUE (deadline)             │
│                                      │
│ Context: [Transcript text]           │
└──────────────────────────────────────┘

PROCESSING:
1. AI analyzes transcript
2. Identifies action patterns
3. Extracts structured data
4. Returns JSON array

OUTPUT: Structured action items
```

### Email Generation Prompt

```
INPUT: Meeting summary + Action items

PROMPT STRUCTURE:
┌──────────────────────────────────────┐
│ System: "You are a professional      │
│         executive assistant"         │
│                                      │
│ Task: "Create polished follow-up     │
│        email"                        │
│                                      │
│ Include:                             │
│ • Thank you opening                  │
│ • 2-3 key highlights (bullets)       │
│ • All action items (with WHO + DUE)  │
│ • Friendly closing                   │
│                                      │
│ Tone: Professional but approachable  │
│                                      │
│ Context: [Summary + Actions]         │
└──────────────────────────────────────┘

PROCESSING:
1. AI reads summary and actions
2. Structures email format
3. Polishes language
4. Adds professional tone

OUTPUT: Ready-to-send email
```

---

## ⚡ Performance Metrics

```
OPERATION                    TIME        API CALLS    TOKENS USED
──────────────────────────────────────────────────────────────────
Transcription (10 sec)      Real-time   Web Speech   N/A
Action extraction (500w)    1-2 sec     Prompt API   ~600 tokens
Summary generation          2-3 sec     Prompt API   ~800 tokens
Email generation            2-3 sec     Prompt API   ~1000 tokens
UI rendering                <100ms      None         N/A
Clipboard copy              <50ms       None         N/A
──────────────────────────────────────────────────────────────────
TOTAL (per meeting)         ~10 sec     3 API calls  ~2400 tokens
```

---

## 🎨 UI Component Breakdown

```
MeetingMind Side Panel
│
├── Header
│   ├── Logo
│   ├── AI Status Indicator (🟢/🟡/🔴)
│   ├── Recording Status
│   └── Meeting Type Selector
│
├── Controls
│   ├── Start/Stop Recording
│   ├── Pause Button
│   └── Generate Summary
│
├── Live Transcript
│   ├── Speaker labels
│   ├── Timestamps
│   └── Auto-scroll toggle
│
├── Analytics
│   ├── Duration / Words / Speakers
│   ├── Speaker participation bars
│   └── Word cloud
│
├── Summary
│   └── AI-generated highlights
│
├── Action Items ⭐ NEW
│   ├── Checkbox (completion)
│   ├── Task description
│   ├── 👤 Assignee badge
│   └── 📅 Due date badge
│
├── Meeting IQ
│   ├── Score (0-100)
│   ├── Rating (Excellent/Good/Needs Work)
│   └── Insights
│
└── Export
    ├── TXT / MD / JSON
    └── 📧 Generate Email ⭐ NEW
        └── Preview Modal
            ├── Subject line
            ├── Email body
            ├── Copy Again button
            └── Close button
```

---

## 🔐 Privacy & Security

```
DATA FLOW                           STORAGE LOCATION
────────────────────────────────────────────────────────
Audio capture        →  Memory (temporary buffer)
Transcription        →  IndexedDB (local)
Action items         →  IndexedDB (local)
Summaries            →  IndexedDB (local)
Email drafts         →  Clipboard only (not saved)

EXTERNAL SERVICES:   None (100% local processing)
CLOUD UPLOADS:       None
API CALLS:           Chrome AI only (on-device)
```

---

## 🎓 Success Example

**Meeting Conversation:**
> "Alright team, let's wrap up. Alex, can you follow up with the marketing team about the Q4 campaign launch? We need that by EOD Friday. Sarah, please update the product roadmap and share it with stakeholders. John, send the final specs to the client by next Monday. And the whole team should review the budget proposal before next week's meeting. I'll reach out to the vendors about pricing by tomorrow afternoon."

**Generated Action Items:**
1. ✅ Follow up with marketing team about Q4 campaign launch. - **Alex** (📅 EOD Friday)
2. ✅ Update product roadmap and share with stakeholders. - **Sarah**
3. ✅ Send final specs to client. - **John** (📅 Next Monday)
4. ✅ Review budget proposal. - **Team** (📅 Before next week's meeting)
5. ✅ Reach out to vendors about pricing. - **Speaker 1** (📅 Tomorrow afternoon)

**Generated Email:**
```
Subject: Follow-up: Q4 Planning Meeting

Hi Team,

Thank you for attending "Q4 Planning Meeting" on October 29, 2025.

KEY HIGHLIGHTS:
• Discussed Q4 marketing campaign launch timeline and coordination
• Reviewed product roadmap updates and stakeholder communication strategy
• Addressed client specifications finalization and vendor pricing negotiations

ACTION ITEMS:
  • Follow up with marketing team about Q4 campaign launch. - Alex (Due: EOD Friday)
  • Update product roadmap and share with stakeholders. - Sarah
  • Send final specs to client. - John (Due: Next Monday)
  • Review budget proposal. - Team (Due: Before next week's meeting)
  • Reach out to vendors about pricing. - Speaker 1 (Due: Tomorrow afternoon)

Please reach out if you have any questions or need clarification on your action items.

Best regards
```

---

**Pipeline Visualization Complete** ✅

This visual guide shows the complete flow from audio capture to email generation, with all processing steps, data structures, and UI components clearly mapped out.
