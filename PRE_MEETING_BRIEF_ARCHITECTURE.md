# 📊 Pre-Meeting Brief System - Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CHROME EXTENSION ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ USER                                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Records meetings → Receives brief 5 min before → Clicks action             │
│                                                                              │
└────────────┬────────────────────────────────────────────┬────────────────────┘
             │                                            │
             ▼                                            ▼
┌──────────────────────────────┐            ┌──────────────────────────────┐
│   GOOGLE MEET / ZOOM / TEAMS │            │     GOOGLE CALENDAR          │
│   (Meeting Platforms)        │            │     (Calendar API)           │
└────────────┬─────────────────┘            └──────────┬───────────────────┘
             │                                         │
             │ Meeting detected                        │ Upcoming events
             │                                         │
             ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKGROUND.JS (Service Worker)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  1. Monitors Meetings                                                │  │
│  │     • Checks calendar every 60 seconds                               │  │
│  │     • Detects meetings starting in 5 minutes                         │  │
│  │     • Sends notification to sidepanel                                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  2. Brief Generation Orchestration                                   │  │
│  │     • Receives GENERATE_PRE_MEETING_BRIEF message                   │  │
│  │     • Calls Meeting Series Detector                                  │  │
│  │     • Calls Pre-Meeting Brief Generator                              │  │
│  │     • Saves brief to IndexedDB                                       │  │
│  │     • Notifies sidepanel                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  3. Message Handlers                                                 │  │
│  │     • CHECK_UPCOMING_MEETINGS → Returns calendar events              │  │
│  │     • GENERATE_PRE_MEETING_BRIEF → Generates brief                  │  │
│  │     • UPDATE_BRIEF_STATUS → Updates brief in storage                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└────────┬───────────────────────────────────┬────────────────┬───────────────┘
         │                                   │                │
         ▼                                   ▼                ▼
┌─────────────────────┐  ┌────────────────────────────┐  ┌──────────────────┐
│ MEETING SERIES      │  │ PRE-MEETING BRIEF         │  │  INDEXEDDB v4    │
│ DETECTOR            │  │ GENERATOR                 │  │  (Storage)       │
├─────────────────────┤  ├────────────────────────────┤  ├──────────────────┤
│                     │  │                            │  │                  │
│ • Normalize titles  │  │ • Initialize Prompt API    │  │ • meetings       │
│ • Detect patterns   │  │ • Extract action items     │  │ • transcripts    │
│ • Match meetings    │  │ • Analyze engagement       │  │ • summaries      │
│ • Calculate         │  │ • Predict duration         │  │ • actionItems    │
│   similarity        │  │ • Generate AI brief        │  │ • reminders      │
│ • Identify series   │  │ • Create agenda            │  │                  │
│                     │  │ • Focus areas              │  │ NEW:             │
│ Input:              │  │                            │  │ • preMeetingBriefs│
│ - Meeting title     │  │ Input:                     │  │ • meetingSeries  │
│ - Participants      │  │ - Series info              │  │                  │
│ - Timestamp         │  │ - Past meetings            │  │ Indexes:         │
│                     │  │                            │  │ - seriesId       │
│ Output:             │  │ Output:                    │  │ - status         │
│ - Series ID         │  │ - Complete brief JSON      │  │ - meetingDate    │
│ - Past meetings     │  │ - AI summary               │  │ - generatedAt    │
│ - Pattern data      │  │ - Metrics & insights       │  │                  │
│                     │  │                            │  │                  │
└─────────────────────┘  └────────────────────────────┘  └──────────────────┘
         │                          │                              │
         │                          │                              │
         │                          ▼                              │
         │            ┌──────────────────────────────┐            │
         │            │  PROMPT API (Chrome AI)      │            │
         │            ├──────────────────────────────┤            │
         │            │ • System prompt (facilitator)│            │
         │            │ • User prompt (context)      │            │
         │            │ • Generate 300-500 word brief│            │
         │            │ • Fallback: last summary     │            │
         │            └──────────────────────────────┘            │
         │                          │                              │
         │                          │                              │
         └──────────────────────────┴──────────────────────────────┘
                                    │
                                    │ Brief generated
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SIDEPANEL / UI LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  PRE-MEETING BRIEF MANAGER                                         │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  1. Initialization                                                 │    │
│  │     • Set up event listeners                                       │    │
│  │     • Start checking for meetings (every 60s)                      │    │
│  │     • Listen for background messages                               │    │
│  │                                                                     │    │
│  │  2. Brief Display                                                  │    │
│  │     • Receive UPCOMING_MEETING_DETECTED                           │    │
│  │     • Show loading state                                           │    │
│  │     • Receive BRIEF_READY                                          │    │
│  │     • Populate brief card                                          │    │
│  │     • Start countdown timer                                        │    │
│  │                                                                     │    │
│  │  3. User Interactions                                              │    │
│  │     • Dismiss (×) → Hide card, update status                       │    │
│  │     • Start with Context → Load into sidepanel                     │    │
│  │     • View Later → Save for later, dismiss                         │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  BRIEF CARD UI (sidepanel.html)                                    │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  ┌───────────────────────────────────────────────────────────┐    │    │
│  │  │ 📋 Pre-Meeting Brief Ready              [Countdown]  ×   │    │    │
│  │  ├───────────────────────────────────────────────────────────┤    │    │
│  │  │ [Series Badge]              Meeting #N                   │    │    │
│  │  │                                                           │    │    │
│  │  │ ┌──────────┐  ┌──────────┐  ┌──────────┐               │    │    │
│  │  │ │ Last IQ  │  │ Duration │  │   Open   │   Metrics    │    │    │
│  │  │ │   85     │  │  23 min  │  │    3     │               │    │    │
│  │  │ └──────────┘  └──────────┘  └──────────┘               │    │    │
│  │  │                                                           │    │    │
│  │  │ 📝 Context from Last Meeting                             │    │    │
│  │  │ [AI-generated summary text...]                           │    │    │
│  │  │                                                           │    │    │
│  │  │ 🎯 3 action items need follow-up                         │    │    │
│  │  │ 📊 Recurring topics: blockers, planning                  │    │    │
│  │  │                                                           │    │    │
│  │  │ ▶ View Full Brief                                        │    │    │
│  │  │   └─ Expandable details section                          │    │    │
│  │  ├───────────────────────────────────────────────────────────┤    │    │
│  │  │ [Start with this Context]        [View Later]           │    │    │
│  │  └───────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  STATES:                                                           │    │
│  │  • Loading:  Spinner + "Analyzing previous meetings..."          │    │
│  │  • Loaded:   Full brief with metrics and insights                │    │
│  │  • Error:    Message about first meeting or generation issue     │    │
│  │                                                                     │    │
│  │  THEMES:                                                           │    │
│  │  • Light:    White bg, dark text, purple accents                  │    │
│  │  • Dark:     Dark gray bg, light text, light purple accents       │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    │ User clicks "Start with Context"      │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  TRANSCRIPT AREA (Context Integration)                             │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐  │    │
│  │  │ 📋 PRE-MEETING CONTEXT LOADED                               │  │    │
│  │  ├─────────────────────────────────────────────────────────────┤  │    │
│  │  │ Series: Weekly Standup • Meeting #12                       │  │    │
│  │  │                                                             │  │    │
│  │  │ Open Action Items (3):                                     │  │    │
│  │  │ • Update API docs (Sarah Chen, 7 days)                     │  │    │
│  │  │ • Security audit (Mike Johnson, 3 days)                    │  │    │
│  │  │ • Update tests (Alice Wong, 2 days)                        │  │    │
│  │  │                                                             │  │    │
│  │  │ From Last Meeting:                                         │  │    │
│  │  │ Discussed Q4 milestones and committed to Nov 15...         │  │    │
│  │  └─────────────────────────────────────────────────────────────┘  │    │
│  │                                                                     │    │
│  │  [Recording can now start with full historical context]           │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW SEQUENCE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T-6 minutes (6 minutes before meeting)
├─ Calendar check runs (background.js alarm)
├─ Meeting detected: "Weekly Standup" starts at 10:00 AM
└─ No action (too early, waiting for T-5 minutes)

TIME: T-5 minutes (5 minutes before meeting)
├─ Calendar check runs again
├─ Meeting within 5-minute window
├─ background.js → chrome.runtime.sendMessage('UPCOMING_MEETING_DETECTED')
└─ sidepanel.js → Brief Manager receives notification

TIME: T-5 minutes + 1 second
├─ Brief Manager → Show loading state
├─ Brief Manager → chrome.runtime.sendMessage('GENERATE_PRE_MEETING_BRIEF')
└─ background.js → Receives request

TIME: T-5 minutes + 2 seconds
├─ background.js → seriesDetector.getSeriesInfo()
│   ├─ Normalize title: "weekly standup"
│   ├─ Query IndexedDB for past meetings
│   ├─ Found 11 past meetings
│   └─ Return series info
│
└─ background.js → briefGenerator.generateBriefForUpcoming()
    ├─ Extract open action items
    ├─ Analyze engagement patterns
    ├─ Predict duration (statistical)
    └─ Initialize Prompt API

TIME: T-5 minutes + 3-5 seconds
├─ Prompt API → Generate AI brief
│   ├─ System prompt: "You are a meeting facilitator..."
│   ├─ User prompt: Context from past 11 meetings
│   └─ Response: 400-word contextual brief
│
├─ Brief assembled with all components
├─ Saved to IndexedDB (preMeetingBriefs)
└─ background.js → chrome.runtime.sendMessage('BRIEF_READY')

TIME: T-5 minutes + 6 seconds
├─ Brief Manager → Receives BRIEF_READY
├─ Populate UI elements:
│   ├─ Series badge: "Weekly Standup"
│   ├─ Meeting count: "#12"
│   ├─ Last IQ: 85
│   ├─ Duration: 23 min
│   ├─ Open items: 3
│   ├─ AI summary: [Generated text]
│   ├─ Quick insights: 2 items
│   └─ Expandable details: Action items, agenda, engagement
│
├─ Start countdown timer (updates every second)
└─ Scroll to top, show brief card

TIME: T-4 minutes to T-0
├─ Countdown ticks down: "4 minutes", "3 minutes", ...
├─ User reviews brief
└─ User clicks action

ACTION 1: User clicks "Start with this Context"
├─ Brief Manager → loadContextIntoSidepanel()
├─ Create context card in transcript area
├─ Show action items, key points
├─ Update status to "used"
├─ Hide brief card
└─ User starts recording with context

ACTION 2: User clicks "View Later"
├─ Brief Manager → viewLater()
├─ Update status to "saved"
├─ Hide brief card
├─ Show notification: "Brief saved"
└─ Brief accessible from meeting history

ACTION 3: User clicks dismiss (×)
├─ Brief Manager → dismissBrief()
├─ Update status to "dismissed"
├─ Animate card out
└─ Clear state

TIME: T-0 (Meeting starts)
├─ Countdown shows "now"
└─ Recording can begin with or without context


┌─────────────────────────────────────────────────────────────────────────────┐
│                       ALGORITHM VISUALIZATIONS                               │
└─────────────────────────────────────────────────────────────────────────────┘

SERIES DETECTION ALGORITHM
──────────────────────────

Input: Meeting "Weekly Standup - 11/01"
  ↓
Step 1: Normalize Title
  "Weekly Standup - 11/01" 
  → Remove date pattern: "Weekly Standup"
  → Lowercase: "weekly standup"
  → Generate ID: "weekly-standup"
  ↓
Step 2: Query Past Meetings
  Find all meetings in IndexedDB
  Filter by normalized title match
  ↓
Step 3: Calculate Similarity
  For each candidate meeting:
    Participants A: ["Alice", "Bob", "Carol"]
    Participants B: ["Alice", "Bob", "Dave"]
    Intersection: 2 | Union: 4
    Similarity: 50% < 60% threshold → REJECT
  
  Next candidate:
    Participants C: ["Alice", "Bob", "Carol"]
    Intersection: 3 | Union: 3
    Similarity: 100% ≥ 60% threshold → ACCEPT
  ↓
Step 4: Detect Interval
  Dates: [Oct 11, Oct 18, Oct 25]
  Intervals: [7d, 7d]
  Average: 7 days
  Pattern: WEEKLY (confidence: 95%)
  ↓
Output: Series with 3 past meetings


PRIORITY SCORING ALGORITHM
──────────────────────────

Input: Action Item {
  task: "Fix critical API bug",
  dueDate: "2025-10-30",  // Yesterday
  assignee: "Sarah Chen"
}

Current date: 2025-10-31
  ↓
Step 1: Base Priority
  Base = 50
  ↓
Step 2: Due Date Modifier
  Days until due = -1 (overdue)
  Modifier = +30 (overdue)
  Running total = 80
  ↓
Step 3: Keyword Modifier
  Task contains "critical"
  Modifier = +25
  Running total = 105
  ↓
Step 4: Cap at 100
  Final priority = min(105, 100) = 100
  ↓
Output: Priority = 100 (HIGH)
  Rank: 1st in list


DURATION PREDICTION ALGORITHM
─────────────────────────────

Input: Past meeting durations [18, 23, 25, 20, 28, 19, 22, 24, 21, 26, 23]
  ↓
Step 1: Sort
  [18, 19, 20, 21, 22, 23, 23, 24, 25, 26, 28]
  ↓
Step 2: Calculate Statistics
  Count: 11
  Average: (18+19+...+28) / 11 = 22.6
  Median: 23 (middle value)
  Min: 18
  Max: 28
  ↓
Step 3: Calculate Variance
  Variance = Σ(x - avg)² / n
  = [(18-22.6)² + (19-22.6)² + ... + (28-22.6)²] / 11
  = 9.64
  Std Dev = √9.64 = 3.1
  ↓
Step 4: Confidence
  Coefficient of Variation = 3.1 / 22.6 = 0.137 (13.7%)
  CV < 20% → HIGH confidence
  ↓
Output: {
  predicted: 23 minutes,
  range: "18-28 min",
  confidence: "high"
}


ENGAGEMENT ANALYSIS ALGORITHM
─────────────────────────────

Input: 10 meetings with participant data

Meeting 1:
  Sarah: 5 contributions, score: 85
  Mike: 3 contributions, score: 70
  David: 1 contribution, score: 30

Meeting 2:
  Sarah: 6 contributions, score: 90
  Mike: 4 contributions, score: 75
  David: 0 contributions, score: 0

... (8 more meetings)
  ↓
Step 1: Aggregate Data
  Sarah: Total: 52 contributions across 10 meetings
  Mike: Total: 38 contributions across 10 meetings
  David: Total: 7 contributions across 10 meetings
  ↓
Step 2: Calculate Averages
  Sarah: 52/10 = 5.2 avg contributions, avg score: 84
  Mike: 38/10 = 3.8 avg contributions, avg score: 72
  David: 7/10 = 0.7 avg contributions, avg score: 25
  ↓
Step 3: Categorize
  Thresholds:
    ACTIVE: avg ≥ 3 contributions OR score ≥ 70
    MODERATE: avg ≥ 1 contribution OR score ≥ 40
    QUIET: Below moderate
  
  Sarah: 5.2 ≥ 3 → ACTIVE
  Mike: 3.8 ≥ 3 → ACTIVE
  David: 0.7 < 1 AND 25 < 40 → QUIET
  ↓
Output: {
  active: ["Sarah Chen", "Mike Johnson"],
  moderate: [],
  quiet: ["David Park"]
}


┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORAGE ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

IndexedDB: MeetingMindDB (Version 4)

Object Stores:
├─ meetings (existing)
│  └─ Records of all meetings with transcripts, summaries, IQ scores
│
├─ transcripts (existing)
│  └─ Individual transcript entries linked to meetings
│
├─ summaries (existing)
│  └─ Generated summaries for meetings
│
├─ actionItems (existing)
│  └─ Action items extracted from meetings
│
├─ reminders (existing)
│  └─ Smart reminders for action items
│
├─ sharedTranscripts (existing)
│  └─ Shareable transcript links
│
├─ preMeetingBriefs (NEW)
│  ├─ Primary Key: id
│  ├─ Indexes:
│  │  ├─ seriesId (meeting_series_id)
│  │  ├─ meetingDate (meeting_date)
│  │  ├─ generatedAt (generated_at)
│  │  └─ status (pending/shown/dismissed/used/saved)
│  │
│  └─ Data Structure: {
│       id: "brief-1730419200000-abc123",
│       meeting_series_id: "weekly-standup",
│       meeting_date: "2025-11-01T10:00:00Z",
│       generated_at: "2025-11-01T09:55:00Z",
│       status: "pending",
│       series_info: {...},
│       last_meeting: {...},
│       open_items: [...],
│       patterns: {...},
│       ai_brief: "...",
│       suggestions: {...},
│       metadata: {...}
│     }
│
└─ meetingSeries (NEW)
   ├─ Primary Key: seriesId
   ├─ Indexes:
   │  ├─ normalizedTitle
   │  └─ lastUpdated
   │
   └─ Data Structure: {
        seriesId: "weekly-standup",
        normalizedTitle: "weekly standup",
        meetingCount: 12,
        interval: "weekly",
        avgInterval: 7,
        intervalConfidence: 0.98,
        nextExpected: "2025-11-08T10:00:00Z",
        avgDuration: 23,
        avgIQScore: 78,
        commonTopics: [...],
        lastUpdated: "2025-11-01T10:00:00Z"
      }

Cleanup Policy:
├─ Briefs older than 30 days: Auto-delete
├─ Series with no meetings in 90 days: Archive
└─ Run cleanup weekly via background alarm


┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE CHARACTERISTICS                             │
└─────────────────────────────────────────────────────────────────────────────┘

Timing Breakdown (First Brief):
├─ Series detection: 50-100ms (IndexedDB query)
├─ Data extraction: 100-200ms (past meetings analysis)
├─ AI initialization: 500-1000ms (first time only)
├─ AI generation: 2000-4000ms (Prompt API)
├─ Brief assembly: 50-100ms (data structuring)
├─ Storage save: 20-50ms (IndexedDB write)
└─ UI render: 20-50ms (DOM updates)
    ────────────────────────────────────────
    TOTAL: 2.7-5.5 seconds

Timing Breakdown (Subsequent Briefs):
├─ Series detection: 50-100ms
├─ Data extraction: 100-200ms
├─ AI generation: 1000-2000ms (session warm)
├─ Brief assembly: 50-100ms
├─ Storage save: 20-50ms
├─ UI render: 20-50ms
    ────────────────────────────────────────
    TOTAL: 1.2-2.5 seconds

Memory Usage:
├─ Brief Manager: ~2 MB
├─ Series Detector: ~1 MB
├─ Brief Generator: ~3 MB (with AI session)
├─ UI Components: ~1 MB
├─ IndexedDB overhead: ~5 MB (per 100 briefs)
    ────────────────────────────────────────
    TOTAL: ~12 MB active

Storage Growth:
├─ Per brief: 5-8 KB
├─ Per series metadata: 2-3 KB
├─ 100 meetings: ~0.5 MB
├─ 1000 meetings: ~5 MB
└─ With cleanup (30-day retention): Stable at ~1-2 MB


┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERROR HANDLING                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Error Scenarios & Fallbacks:

1. Prompt API Not Available
   ├─ Detection: window.ai is undefined
   ├─ Fallback: Use last meeting summary
   └─ Impact: Brief still shows, just without AI-generated insights

2. No Past Meetings Found
   ├─ Detection: seriesInfo.isFirstMeeting === true
   ├─ Fallback: Show "First meeting" message
   └─ Impact: No brief displayed, normal recording flow

3. IndexedDB Error
   ├─ Detection: Transaction fails
   ├─ Fallback: In-memory brief (not persisted)
   └─ Impact: Brief works but won't be saved

4. Calendar Integration Failed
   ├─ Detection: API returns error
   ├─ Fallback: Check active tab for meeting URLs
   └─ Impact: May miss some upcoming meetings

5. AI Generation Timeout
   ├─ Detection: Promise doesn't resolve in 10s
   ├─ Fallback: Use structured summary from data
   └─ Impact: Brief less natural but still informative

6. Insufficient Data Quality
   ├─ Detection: metadata.data_quality === "low"
   ├─ Fallback: Show basic metrics only
   └─ Impact: Simplified brief with warnings

All errors logged to console with context for debugging.


┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUCCESS METRICS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Technical Metrics:
├─ Brief generation success rate: >95%
├─ Series detection accuracy: >90%
├─ Duration prediction error: <15%
├─ UI render time: <100ms
└─ Storage write latency: <50ms

User Engagement:
├─ Brief view rate: Target >80%
├─ Context load rate: Target >50%
├─ Dismiss rate: Target <20%
└─ "View Later" rate: Target 10-30%

Impact Metrics:
├─ Meeting IQ improvement: +5-10 points
├─ Action item completion: +20%
├─ Meeting duration reduction: -10%
├─ Participant engagement: +15%
└─ User satisfaction: 4+/5 rating

```

---

**Architecture designed for scalability, reliability, and exceptional user experience.**  
**All components work together seamlessly to deliver intelligent pre-meeting context.**
